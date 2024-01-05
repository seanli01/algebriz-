import "dotenv/config";
import express from "express";
import session from "express-session";
import { unlink } from "fs";
import { Server as SocketIOServer} from "socket.io";
import { createServer } from "http";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import { serialize } from "cookie";
import { body, validationResult } from "express-validator";
import validator from "validator";
import bcrypt from 'bcryptjs';
import multer from "multer";
import MongoStore from "connect-mongo";
import path from "path";

const SAME_SITE = process.env.ENV === "dev" ? "none" : "strict";
const uri = process.env.MONGODB_URI;
const PORT = process.env.BACK_PORT;
const app = express();
const upload = multer({dest: `${process.env.UPLOADS_FOLDER}/`});
const frontendDomain = process.env.FRONTEND_DOMAIN;

// valid type values for questions
const TYPE_MULTI = "Multi-Choice";
const TYPE_FREE = "Free-Response";
const TYPE_MATRIX = "Matrix";
const QUEST_OPTS = [TYPE_MULTI, TYPE_FREE, TYPE_MATRIX];

// valid status values for sessions
const STATUS_OPEN = "Open";
const STATUS_PLAYING = "Playing";
const STATUS_CLOSED = "Closed";
const STATUS_OPS = [STATUS_OPEN, STATUS_PLAYING, STATUS_CLOSED];

const PAGE_COUNT = 10; // # of quizzes per page

let db;
let users;        // User collection
let questions;    // Quiz question collection
let quizzes;      // Quiz collection
let sessions;     // Game session collection

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const sess = session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  unset: "destroy",
  store: MongoStore.create({
    client, 
    dbName: "db", 
    collectionName: "sessionsLogin",
    ttl: 60 * 60 * 24 * 7             // Session deleted after 7 days
  }),
  cookie: { 
    httpOnly: true, 
    secure: process.env.ENV !== "dev",
    sameSite: SAME_SITE,
  }
});

const questionValidator = (req, res, next) => {
  try {
    req.body.question = validator.escape(req.body.question); 
    req.body.answers = JSON.parse(req.body.answers);
    if (validator.isEmpty(req.body.question)) throw new Error("Invalid question");
    if (validator.isEmpty(req.body.type)) throw new Error("Type is missing");
    if (!validator.isIn(req.body.type, QUEST_OPTS)) throw new Error("Invalid type");
    if (!validator.isInt(req.body.time, {min: 0})) throw new Error("Invalid time");
    if (!validator.isInt(req.body.correctIndex, {min: 0})) throw new Error("Invalid time");
    if (!Array.isArray(req.body.answers)) throw new Error("Answers is not an array");
    if (!validator.isInt(req.body.weight, {min: 0})) throw new Error("Invalid weight");
    req.body.answers = req.body.answers.map(a => typeof(a) === 'string' ? validator.escape(a) : a);
    return next();
  }
  catch (e) {
    return res.status(400).json(e.toString());
  }
}

app.use(express.json());
app.set('trust proxy', 1); 

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", frontendDomain);
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(sess);

app.use(function (req, res, next) {
  req.username = req.session.username ? req.session.username : null;
  console.log("HTTP request", req.username, req.method, req.url, req.body);
  next();
});



/* ----------- USER ----------- */

// Sign up user
// reqBody: { username: "Bob", password: "PW123" }
// return: username
app.post("/signup",
  body('username').notEmpty(),
  body('password').notEmpty(),
  async function (req, res, next)
{
  const valid = validationResult(req);
  if (valid.isEmpty()) {
    const username = req.body.username;
    const password = req.body.password;
    const exists = await users.countDocuments({ _id: username }, { limit: 1 }); // 1 if exists, 0 otherwise
    if (exists === 0) {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          try {
            const insertResult = await users.insertOne({ _id: username, password: hash });
            // Start a session w/ the signed-in user
            req.session.username = username;
            res.setHeader(
              "Set-Cookie",
              serialize("username", username, {
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
                httpOnly: false, // cannot be true, otherwise we can't read it in JS
                secure: true,
                sameSite: SAME_SITE
              })
            );
            return res.json(username);
          } catch (e) {
            return res.status(500).end(e.toString());
          }
        });
      });
    } else {
      return res.status(409).end("User " + username +  " already exists");
    }
  }
  else {
    return res.status(400).end("Username or password is missing");
  }
});

// Sign in user
// reqBody: { username: "Bob", password: "PW123" }
// return: username
app.post("/signin",
  body('username').notEmpty(),
  body('password').notEmpty(),
  async function (req, res, next)
{
  const valid = validationResult(req);
  if (valid.isEmpty()) {
    const username = req.body.username;
    const password = req.body.password;
    const doc = await users.findOne({ _id: username});
    if (!doc) return res.status(404).end("User " + username + " does not exist");
    bcrypt.compare(password, doc.password, function (err, match) {
      if (err) return res.status(500).end(err.toString());
      if (!match) return res.status(401).end("Access denied");
      // Start a session w/ the signed-in user
      req.session.username = username;
      res.setHeader(
        "Set-Cookie",
        serialize("username", username, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
          httpOnly: false, // cannot be true, otherwise we can't read it in JS
          secure: true,
          sameSite: SAME_SITE
        })
      );
      return res.json(username);
    })
  }
  else {
    return res.status(400).end("Username or password is missing");
  }
});

// Sign out user
app.get("/signout", function (req, res, next) {
    req.session.destroy();
    res.setHeader(
        "Set-Cookie",
        serialize("username", "", {
            path: "/",
            maxAge: 60*60*24*7, // 1 week
            sameSite: SAME_SITE
        }),
    );
    return res.status(200).end();
});

/* ----------- QUIZ ----------- */

// Create new quiz with current user
// reqBody: { title: "New Quiz", desc: "Quiz description" }
// return:  { _id, ownerId, title, desc, createdAt, updatedAt, isPublic }
app.post("/quiz",
body('title').notEmpty().escape(),
async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const title = req.body.title;
      const desc = req.body.desc ? req.body.desc : "";
      try {
        const insertResult = await quizzes.insertOne(
          { ownerId: req.username,
            title: title,
            desc: desc,
            isPublic: false
          });
        const doc = await quizzes.findOneAndUpdate(
          { _id: insertResult.insertedId },
          { $currentDate: {
              createdAt: true,
              updatedAt: true
            }
          });
        if (!doc) return res.status(500).end("Failed to create new quiz");
        return res.json(doc);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Quiz title is missing");
    }
  });
});

// Get a paginated list of quizzes
// query parameters: user=test&page=1
// return: Array of { _id, ownerId, title, desc, createdAt, updatedAt }
app.get("/quiz", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    // query params
    let user = "";
    if (req.query.user)
      user = req.query.user; // username
    let page = 1
    if (req.query.page)
      page = req.query.page; // page number, starting at 1
    try {
      if (user) { // get quizzes owned by user
        const findResult = await quizzes.find({ ownerId: user }).skip(PAGE_COUNT*(page-1)).limit(PAGE_COUNT).toArray();
        return res.json(findResult);
      }
      else { // get all (public) quizzes
        const findResult = await quizzes.find({ isPublic: true }).skip(PAGE_COUNT*(page-1)).limit(PAGE_COUNT).toArray();
        return res.json(findResult);
      }
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

// Get a quiz with a specific id
// return: { _id, ownerId, title, desc, createdAt, updatedAt }
app.get("/quiz/:id", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const id = req.params.id;
    try {
      const doc = await quizzes.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).end("Could not find quiz with id " + id);
      return res.json(doc);
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

// Edit details for quiz with given id
// reqBody: { title: "New Quiz", desc: "Quiz description" }
// return:  { _id, ownerId, title, desc, createdAt, updatedAt, isPublic }
app.patch("/quiz/:id",
  body('title').notEmpty().escape(),
  //body('desc').notEmpty().escape(), // Allow quizzes to have no description
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const id = req.params.id;
      const title = req.body.title;
      const desc = req.body.desc ? req.body.desc : "";
      try {
        const findResult = await quizzes.findOne({ _id: new ObjectId(id) });
        if (findResult.ownerId !== req.username) {
          return res.status(401).end("Access denied"); // Can't edit quiz owned by other user
        }
        const updateResult = await quizzes.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: {
              title: title,
              desc: desc 
            },
            $currentDate: {
              updatedAt: true
            }
          });
        return res.json(updateResult);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Quiz title is missing");
    }
  });
});

// Show or hide quiz from other quizzes list given its id in URL
// reqBody: { isPublic: true/false }
// return:  { _id, ownerId, title, desc, createdAt, updatedAt, isPublic }
app.patch("/quiz/:id/visibility",
  body('isPublic').notEmpty().isBoolean(),
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const id = req.params.id;
      const isPublic = req.body.isPublic;
      try {
        const findResult = await quizzes.findOne({ _id: new ObjectId(id) });
        if (findResult.ownerId !== req.username) {
          return res.status(401).end("Access denied"); // Can't edit quiz owned by other user
        }
        const updateResult = await quizzes.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: {
              isPublic: isPublic 
            },
            $currentDate: {
              updatedAt: true
            }
          });
        return res.json(updateResult);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Quiz visibility bool is missing");
    }
  });
});

// Delete quiz with given id
// return: Array of { _id, ownerId, title, desc, createdAt, updatedAt, isPublic }
app.delete("/quiz/:id", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const id = req.params.id;
    try {
      const findResult = await quizzes.findOne({ _id: new ObjectId(id) });
      if (findResult.ownerId !== req.username) {
        return res.status(401).end("Access denied"); // Can't edit quiz owned by other user
      }
      const deleteResult = await quizzes.findOneAndDelete({ _id: new ObjectId(id) });
      await deleteOwnedQuestions(id);
      return res.json(deleteResult);
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

/* ----------- QUESTION ----------- */

// Get all questions of a quiz
// return: Array of { quizId, question, type, time, correctIndex, answers, weight }
app.get("/quiz/:id/questions", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const quizId = req.params.id;
    try {
      const findResult = await questions.find({ quizId: new ObjectId(quizId) }).toArray();
      return res.json(findResult);
    } catch (e) {
      return res.status(500).end(e);
    }
  });
});

// Get image for a specific question
// return: image file
app.get("/questions/:qid/image", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const id = req.params.qid;
    try {
      const doc = await questions.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).end("Could not find question with id " + id);
      const quiz = await quizzes.findOne({ _id: new ObjectId(doc.quizId) });
      if (!quiz) return res.status(404).end(`Could not find quiz from question id ${id}, which shouldn't happen`);
      if (quiz.ownerId !== req.session.username) return res.status(403).end("Access denied to image");
      res.setHeader("Content-Type", doc.file.mimetype);
      return res.sendFile(path.resolve(doc.file.destination, doc.file.filename));
    } catch (e) {
      return res.status(500).end(e);
    }
  });
});

// Add a question to a quiz
// reqBody: { question: "2 + 2 = ?", type: "free", time: 20, correctIndex: 0, answers: ["4"], weight: 1 }
// return: { quizId, question, type, time, correctIndex, answers, weight }
app.post("/quiz/:id/questions",
  upload.single("file"),
  questionValidator,
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const quizId = req.params.id;
      const question = req.body.question;
      const type = req.body.type;
      const time = req.body.time;
      const weight = req.body.weight;
      const file = req.file ? req.file : "";
      const correctIndex = req.body.correctIndex;
      const answers = req.body.answers;
      // validate index/answer array based on question type
      switch (type) {
        case TYPE_MULTI:
          if (correctIndex >= answers.length)
            return res.status(400).end("Index of correct answer is out of bounds");
          break;
        case TYPE_MATRIX:
          if (correctIndex != 0)
            return res.status(400).end("Correct answer index for matrix should be 0");
          else if (answers.length > 1)
            return res.status(400).end("Too many answers provided");
          break;
        case TYPE_FREE:
          if (correctIndex != 0)
            return res.status(400).end("Correct answer index for free response should be 0");
          else if (answers.length > 1)
            return res.status(400).end("Too many answers provided");
          break;
        default:
          return res.status(400).end("Question details are missing");
      }
      try {
        const findResult = await quizzes.findOne({ _id: new ObjectId(quizId) });
        if (findResult.ownerId !== req.username) {
          return res.status(403).end("Access denied"); // Can't edit quiz owned by other user
        }
        const insertResult = await questions.insertOne(
          { quizId: new ObjectId(quizId),
            question: question,
            type: type,
            time: time,
            correctIndex: correctIndex,
            answers: answers,
            weight: weight,
            file: file
          });
        const doc = await questions.findOneAndUpdate(
          { _id: insertResult.insertedId },
          { $currentDate: {
              createdAt: true,
              updatedAt: true
            }
          });
        if (!doc) return res.status(500).end("Failed to create new question");
        return res.json(doc);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      if(req.file) unlink(path.resolve(process.env.UPLOADS_FOLDER, req.file.filename), () => {});
      return res.status(400).end("Question details are missing");
    }
  });
});

// Edit details for a question with given id
// reqBody: { question: "2 + 2 = ?", type: "free", time: 20, correctIndex: 0, answers: ["4"], weight: 1 }
// return: { quizId, question, type, time, correctIndex, answers, weight }
app.patch("/questions/:qid",
  upload.single('file'),
  questionValidator,
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const id = req.params.qid;
      const question = req.body.question;
      const type = req.body.type;
      const time = req.body.time;
      const weight = req.body.weight;
      const file = req.file ? req.file : "";
      const correctIndex = req.body.correctIndex;
      const answers = req.body.answers;
      // validate index/answer array based on question type
      switch (type) {
        case TYPE_MULTI:
          if (correctIndex >= answers.length)
            return res.status(400).end("Index of correct answer is out of bounds");
          break;
        case TYPE_MATRIX:
          if (correctIndex != 0)
            return res.status(400).end("Correct answer index for matrix should be 0");
          else if (answers.length > 1)
            return res.status(400).end("Too many answers provided");
          break;
        case TYPE_FREE:
          if (correctIndex != 0)
            return res.status(400).end("Correct answer index for free response should be 0");
          else if (answers.length > 1)
            return res.status(400).end("Too many answers provided");
          break;
        default:
          return res.status(400).end("Question details are missing");
      }
      try {
        let findResult = await questions.findOne({ _id: new ObjectId(id) });
        findResult = await quizzes.findOne({ _id: findResult.quizId });
        if (findResult.ownerId !== req.username) {
          return res.status(403).end("Access denied"); // Can't edit quiz owned by other user
        }
        const updateResult = await questions.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: {
              question: question,
              type: type,
              time: time,
              correctIndex: correctIndex,
              answers: answers,
              weight: weight,
              file: file
            },
            $currentDate: {
              updatedAt: true
            }
          });
        return res.json(updateResult);
      } catch (e) {
        if(req.file) unlink(path.resolve(process.env.UPLOADS_FOLDER, req.file.filename), () => {});
        return res.status(500).end(e.toString());
      }
    }

  });
});

// Delete question with given id
// return: { quizId, question, type, time, correctIndex, answers, weight }
app.delete("/questions/:qid", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const id = req.params.qid;
    try {
      let findResult = await questions.findOne({ _id: new ObjectId(id) });
      findResult = await quizzes.findOne({ _id: findResult.quizId });
      if (findResult.ownerId !== req.username) {
        return res.status(403).end("Access denied"); // Can't edit quiz owned by other user
      }
      const deleteResult = await questions.findOneAndDelete({ _id: new ObjectId(id) });
      if(req.file) unlink(path.resolve(process.env.UPLOADS_FOLDER, req.file.filename), () => {});
      return res.json(deleteResult);
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

// Get image for a specific question
// return: image file
app.get("/questions/:qid/image", async function (req, res, next) {
  isAuthenticated(req, res, async function() {
    const id = req.params.qid;
    try {
      const doc = await questions.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).end("Could not find question with id " + id);
      const quiz = await quizzes.findOne({ _id: new ObjectId(doc.quizId) });
      if (!quiz) return res.status(404).end(`Could not find quiz from question id ${id}, which shouldn't happen`);
      if (quiz.ownerId !== req.username) return res.status(401).end("Access denied to image");
      res.setHeader("Content-Type", doc.file.mimetype);
      return res.sendFile(path.resolve(doc.file.destination, doc.file.filename));
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

/* ----------- SESSION ----------- */

// Create a new open game session
// reqBody: { quizId: "a1b2c3d4e5" }
// return: { _id, hostId, quizId, code, status, currentQuestion, scores: [] }
app.post("/game/",
  body('quizId').notEmpty(),
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const quizId = req.body.quizId;
      try {
        // Find quiz by ID
        const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });
        if (!quiz) return res.status(404).end("Could not find quiz with id " + quizId);
        // If it exists, add new session to DB with initial values
        const insertResult = await sessions.insertOne(
          { hostId: req.username,
            quizId: new ObjectId(quizId),
            code: new Date().valueOf().substring(7,13), // unique 6-digit code
            status: "open",
            currentQuestion: 0,
            scores: []
          });
        const doc = await sessions.findOneAndUpdate(
          { _id: insertResult.insertedId },
          { $currentDate: {
              createdAt: true,
              updatedAt: true
            }
          });
        if (!doc) return res.status(500).end("Failed to create new session");
        return res.json(doc);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Quiz ID is missing");
    }
  });
});

// Update session status
// reqBody: { status: "playing" }
// return: { _id, hostId, quizId, code, status, currentQuestion, scores: [] }
app.patch("/game/:id/",
  body('status').notEmpty(),
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const id = req.params.id;
      const status = req.body.status;
      if (["open", "closed", "playing"].contains(status) === false)
        return res.status(400).end(status + " is not a valid session status");
      try {
        // Find session by id (available only to host)
        const session = await sessions.findOne({ _id: new ObjectId(id) });
        if (!session) return res.status(404).end("Could not find session with id " + id);
        // Update the session status
        const doc = await sessions.findOneAndUpdate(
          { _id: session._id },
          { $set: {
              status: status
            },
            $currentDate: {
              updatedAt: true
            }
          });
        if (!doc) return res.status(500).end("Failed to update session status");
        return res.json(doc);
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Session status is missing");
    }
  });
});

// Find and joins the current user to a game session given its unique access code
// return: { hostId, quizId, code, status, currentQuestion, scores: [] }
app.patch("/game/:code/play",
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {
    const code = req.params.code;
    try {
      // Find open session by code
      const session = await sessions.findOne({ code: code });
      if (!session) return res.status(404).end("Could not find session with code " + code);
      if (session.status !== "open") return res.status(400).end("Session with code " + code + " is not open");
      if (session.scores.filter(s => s.username === req.username).length > 0)
        return res.status(400).end("User is already in this session");
      // If it exists, add user to scores
      const doc = await sessions.findOneAndUpdate(
        { _id: session._id },
        { $push: {
            scores: { username: req.username, score: 0 }
          },
          $currentDate: {
            updatedAt: true
          },
        },
        { projection: { _id: 0 }} // hide _id from players
        );
      if (!doc) return res.status(500).end("Failed to add user to session");
      return res.json(doc);
    } catch (e) {
      return res.status(500).end(e.toString());
    }
  });
});

// Update the current user's score by adding a given value in an open game session
// reqBody: { score: 100 }
// return: score
app.patch("/game/:code/:username",
  body('score').isNumeric(),
  async function (req, res, next)
{
  isAuthenticated(req, res, async function() {    
    const valid = validationResult(req);
    if (valid.isEmpty()) {
      const code = req.params.code;
      const additionalScore = req.body.score;
      try {
        // Find open session by code
        const session = await sessions.findOne({ code: code });
        if (!session) return res.status(404).end("Could not find session with code " + code);
        if (session.status !== "playing") return res.status(400).end("Session with code " + code + " is not playing");
        if (session.scores.filter(s => s.username === req.username).length === 0)
          return res.status(400).end("User is not playing in this session");
        // Add the additionalScore to the user's current score
        const doc = await sessions.findOneAndUpdate(
          { _id: session._id, "b.username": req.username },
          { $inc: {
              "scores.$.score": additionalScore
            },
            $currentDate: {
              updatedAt: true
            }
          });
        if (!doc) return res.status(500).end("Failed to update user's score in session");
        return res.json(doc.scores.find(s => s.username === req.username).score); // return updated total
      } catch (e) {
        return res.status(500).end(e.toString());
      }
    }
    else {
      return res.status(400).end("Score is missing or not a number");
    }
  });
});

async function deleteOwnedQuestions(quizId) {  
  const deleteResult = await questions.deleteMany(
    {
      quizId: new ObjectId(quizId)
    }
  );
  return deleteResult;
}

// Taken from mongoDb example code for connecting app to database
async function run() {
  // Connect the client to the server	(optional starting in v4.7)
  await client.connect();
  // Send a ping to confirm a successful connection
  db = client.db("db");
  await db.command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  // Set local variables for collections
  users = db.collection('users');
  questions = db.collection('questions');
  quizzes = db.collection('quizzes');
  sessions = db.collection('sessions');
}
run().catch(console.dir);

// Swap to https when have cert
export const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: frontendDomain,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let quizSessions = {};
const generateSessionCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('create session', () => {
    const newCode = generateSessionCode();
    quizSessions[newCode] = { participants: [], connections: [] };
    socket.emit('session created', newCode);
    console.log("Created session with code " + newCode);
  });

  socket.on('join session', ({ code, userId }) => {
    if (quizSessions[code]) {
      if (quizSessions[code].participants.includes(userId)) return socket.emit('session error', 'Already joined session');
      quizSessions[code].participants.push(userId);
      quizSessions[code].connections.push(socket);
      socket.join(code);
      io.to(code).emit('session update', quizSessions[code].participants);
    } else {
      socket.emit('session error', 'Session not found');
    }
  });

  socket.on('start quiz', async ({ code, quizId, userId }) => {
    console.log("Session with code " + quizSessions[code] + " is starting");

    try {
        // Fetch the quiz object from the database
        const quiz = await quizzes.findOne({ _id: new ObjectId(quizId) });
        if (!quiz) {
            console.log(`Could not find quiz with id ${quizId}`);
            // Handle the case where the quiz is not found, maybe notify the user
            return; // Stop further execution if no quiz is found
        }

        // Emit to all clients in the room that the quiz has started, with the quiz object
        io.in(code).emit('quiz started', { quizId: quizId, creatorId: userId, quiz: quiz });
        console.log(`Quiz ${quizId} started in session ${code} by ${userId}`);
    } catch (e) {
        console.error(`Error starting quiz: ${e}`);
        // Handle the error, maybe notify the user
    }
  });

  // Disconnection from quiz but not from socket
  socket.on('leave quiz', () => {
    console.log('A user left a quiz');
    removeUser(socket, quizSessions);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    removeUser(socket, quizSessions);
  });
});

const removeUser = (socket, quizSessions) => {
  for(let value of Object.values(quizSessions)) {
    const idxToDel = value.connections.indexOf(socket);
    value.connections.splice(idxToDel, 1);
    value.participants.splice(idxToDel, 1);
  }
}

server.listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});

const isAuthenticated = function (req, res, next) {
  if (!req.session.username) return res.status(401).end("Access denied");
  next();
};
