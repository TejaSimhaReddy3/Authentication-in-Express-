const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server connected to https://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit();
  }
};
initializeDbAndServer();

const checkPassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const postRegisterQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(postRegisterQuery);
  if (dbUser === undefined) {
    const createRegisterQuery = `INSERT INTO user(username,name,password,gender,location) VALUES ('${username}','${name}','${password}','${gender}','${location}');`;
    if (checkPassword(password)) {
      await database.run(createRegisterQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const postLoginQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(postLoginQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const putChangePwdQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(putChangePwdQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (checkPassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const putChangePwdQuery = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}'`;
        const user = await database.run(putChangePwdQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
