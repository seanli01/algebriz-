const backendDomain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN + process.env.NEXT_PUBLIC_APPEND;

async function send(method, url, data) {
  console.log(method, backendDomain+url, data)
  return fetch(backendDomain+url, {
    method: method,
    headers: { 
      "Content-Type": "application/json",
   },
    credentials: "include",
    body: (data) ? JSON.stringify(data) : null,
  });
}

async function sendMultipart(method, url, data) {
  console.log(method, backendDomain+url, data, "using sendMultipart");
  return fetch(backendDomain+url, {
    method: method,
    credentials: "include",
    body: data,
  });
}

export function getUsername() {
  return document.cookie.replace(
    /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
    "$1",
  );
}

export function signin(username, password) {
  return send("POST", "/signin", { username: username, password: password });
}

export function signup(username, password) {
  return send("POST", "/signup", { username: username, password: password });
}

export function signout() {
  return send("GET", "/signout", null);
}

export function getQuiz(quizId) {
  return send("GET", `/quiz/${quizId}`, null);
}

export function getAllQuizzes(page) {
  return send("GET", `/quiz?page=${page}`, null);
}

export function getQuizzes(ownerId, page) {
  return send("GET", `/quiz?user=${ownerId}&page=${page}`, null);
}

export function addQuiz(title, desc) {
  return send("POST", "/quiz", { title: title, desc: desc });
}

export function editQuiz(quizId, title, desc) {
  return send("PATCH", `/quiz/${quizId}`, { title: title, desc: desc });
}

export function editQuizVisibility(quizId, isPublic) {
  return send("PATCH", `/quiz/${quizId}/visibility`, { isPublic: isPublic });
}

export function deleteQuiz(quizId) {
  return send("DELETE", `/quiz/${quizId}`, null);
}

export function getQuestions(quizId) {
  return send("GET", `/quiz/${quizId}/questions`, null);
}

export function getQuestionImage(questionId) {
  return send("GET", `/questions/${questionId}/image`, null);
}

export function addQuestion(quizId, question, type, time, correctIndex, answers, weight, file) {
  const form = new FormData();
  form.append("question", question);
  form.append("type", type);
  form.append("time", time);
  form.append("correctIndex", correctIndex);
  form.append("answers", JSON.stringify(answers));
  form.append("weight", weight);
  form.append("file", file);
  return sendMultipart("POST", `/quiz/${quizId}/questions`, form);
}

export function editQuestion(questionId, question, type, time, correctIndex, answers, weight, file) {
  const form = new FormData();
  form.append("question", question);
  form.append("type", type);
  form.append("time", time);
  form.append("correctIndex", correctIndex);
  form.append("answers", JSON.stringify(answers));
  form.append("weight", weight);
  form.append("file", file);
  return sendMultipart("PATCH", `/questions/${questionId}`, form);
}

export function deleteQuestion(questionId) {
  return send("DELETE", `/questions/${questionId}`, null)
}
