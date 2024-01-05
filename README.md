# __Algebriz__

## Project URL 

https://algebriz.me

## Project Video URL 

https://youtu.be/UGGYrmDRFw8

## Project Description

Algebriz is a web application similar to the popular quiz website Kahoot!, but with a greater focus on mathematical questions. Users can learn and practice their mathematical skills through a gamified experience through online quizzes. Answer questions correctly to earn points—faster answers net greater points, but incorrect answers net nothing. Users can also join lobbies with other players and play through the same quizzes at the same time.

Users can create their own quizzes, with free response, multiple choice, and matrix questions supported. Images can be uploaded to provide visual aid for questions. Once the quiz is complete, it can be marked as public and added to the list of publically playable quizzes.

## Development

The application was developed using the MERN stack: MongoDB, Express.js, React, and Node.js. The frontend, developed using the Next.js framework with React, communicates with the Express backend to perform CRUD operations on data stored in the Mongo database. JavaScript was the primary programming language used.

The Mongo database is separated into four collections:
- users: Stores information for user accounts, such as username and password (salted/hashed).
- quizzes: Stores quiz details such as title and public status. Each quiz is owned by a user.
- questions: Stores question details such as scoring weight, time limit, and answer(s). Each question belongs to a quiz.
- sessionsLogin: Automatically stores browser sessions in the database using the `connect-mongo` package, rather than having them stored in memory.

The backend connects to the database using the Mongo URL stored in the environment variables.

Inputs to the backend are verified using the `express-validator` package before database operations are performed. The `bcrypt` package is also used to hash and salt user login details, for security purposes. Additionally, most operations cannot be performed unless the user is logged into an account, or specifically an account that owns the quiz/question being modified. Image uploads, used for adding images to certain quiz questions, are handled using the `multer` package to parse `multipart/form-data` from the frontend. Lastly, the `socket.io` library is used to set up web sockets that allow different users to join each other in lobbies and play the same quizzes. The `socket.io` library is also used in the frontend, connecting to the backend to create lobbies and receiving messages from the backend to know when to navigate to a quiz's page and start playing.

The frontend is built around the Next.js App Router, where each folder in the frontend's `app` directly represents a path to a page (i.e; `app/(headFootLayout)/quizzes` represents the https://algebriz.me/quizzes page). Each folder has a `page.js` file that defines the page itself using React, as well as optionally a `layout.js` UI that can be shared between pages. In Algebriz's case, every page shares the RootLayout defined in `app/layout.js` as well as the headFootLayout in `app/(headFootLayout)/layout.js` that sets up the navigation bar at the top of every page, as well as provides a way for all child pages to access the client's logged-in user using React's `useContext` hook. This router also allows for the creation of dynamic routes, used in the `/quizzes/[quizId]` route that generates a page for playing the quiz identified by `quizId`.

The React library was used to build the frontend interface, allowing us to create modular UI components in the `components` directory that could pass parameters to each other, update in response to user actions, and be easily placed in our pages wherever necessary. For example, the `QuizManagement` component stores a list of quizzes, which are passed down through children into individual `QuizLabel` components, each with their own buttons to play/edit/delete them. Once the user performs an action like modifying a quiz, the `QuizLabel` calls a function passed down from `QuizManagement`, which allows us to update the quiz list visible to the user without refreshing the page.

## Deployment

Both the frontend and backend were dockerized into separate containers, alongside the reverse-proxy jwilder/nginx-proxy and SSL manager nginxproxy/acme-companion. There is also an images volume for storing user-uploaded images on the local filesystem. There is a docker-compose.yml file that can set up and run the images and volumes at once. Also included are .cmd files that automatically deploy the website since Windows was having trouble running the shell script. The app is deployed using a Google Cloud VM that hosts all these containers. The domain name is the free domain name provided by NameCheap.com. 

## Challenges

1. Having to work on a larger-scale application with multiple people proved an interesting challenge, as each developer had a different setup and there were often cases where things that worked on one user's machine wouldn't work on another's (this was also sometimes the case between local and deployed environments). Additionally, multiple people working on the same files (especially `app.mjs`) in different branches could create complicated merge conflicts down the line that would have to be resolved manually.
2. Understanding how sockets worked in the multiplayer developement proved to be quite the challenge as it was a completely new concept, as debugging how the socket provider was not passing the correct information for the backend to receive at times created complications.
3. Deployment was much more challenging than I anticipated since deploying to the VM required different configurations of the ports and domain/ip address compared to deploying locally, so there was a little bit of additional learning with networking and ports involved. 

## Contributions

Arthur Lu: developed most of the backend, the components in `components/Quiz`, and the `quizzes`, `quizzes/quiz`, `manage` pages.

Sean Li: developed the multiplayer content using sockets + backend socket configuration, the components in `components/Multiplayer` along with the quiz gameplay `components/Gameplay`.

Auric Zhou: designed most of the frontend with CSS and made icons, logo, and the background in Inkscape, also worked primarily on `frontend` for creating questions and `feat/image-upload` for uploading images and deployment.

# One more thing? 

**Task:** Any additional comment you want to share with the course staff? 
