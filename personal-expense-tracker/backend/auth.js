const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";

// Signup
function signup(name, email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db
    .prepare(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    )
    .run(name.trim(), normalizedEmail, hashedPassword);

  return {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: normalizedEmail,
  };
}

// Login
function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = bcrypt.compareSync(password, user.password);

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

module.exports = {
  signup,
  login,
};