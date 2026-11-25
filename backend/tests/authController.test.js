import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { loginUser, registerUser } from "../controllers/userController.js";

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test("signup hashes the password and returns only safe account fields", async (t) => {
  let storedUser;
  t.mock.method(User, "findOne", async () => null);
  t.mock.method(User, "create", async (user) => {
    storedUser = user;
    return { ...user, _id: "507f1f77bcf86cd799439011" };
  });
  const res = createResponse();

  await registerUser({
    body: {
      name: "  FindIt User ",
      email: "  user@example.com ",
      password: "a-secure-password"
    }
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(storedUser.name, "FindIt User");
  assert.equal(storedUser.email, "user@example.com");
  assert.notEqual(storedUser.password, "a-secure-password");
  assert.equal(await bcrypt.compare("a-secure-password", storedUser.password), true);
  assert.equal("password" in res.body.user, false);
});

test("login verifies credentials and returns a signed token without password data", async (t) => {
  const secret = "test-only-secret-that-is-long-enough-for-jwt-signing";
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  const passwordHash = await bcrypt.hash("a-secure-password", 4);
  const user = {
    _id: "507f1f77bcf86cd799439011",
    name: "FindIt User",
    email: "user@example.com",
    password: passwordHash
  };
  t.mock.method(User, "findOne", () => ({
    select: async () => user
  }));
  const res = createResponse();

  try {
    await loginUser({
      body: { email: " USER@example.com ", password: "a-secure-password" }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(jwt.verify(res.body.token, secret).id, user._id);
    assert.equal(res.body.user.email, user.email);
    assert.equal("password" in res.body.user, false);
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  }
});

test("login rejects an incorrect password with a generic client error", async (t) => {
  const passwordHash = await bcrypt.hash("correct-password", 4);
  t.mock.method(User, "findOne", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      name: "FindIt User",
      email: "user@example.com",
      password: passwordHash
    })
  }));
  const res = createResponse();

  await loginUser({
    body: { email: "user@example.com", password: "incorrect-password" }
  }, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid email or password");
});

test("signup reports an already registered email without creating a user", async (t) => {
  t.mock.method(User, "findOne", async () => ({ _id: "existing-user" }));
  const res = createResponse();

  await registerUser({
    body: {
      name: "FindIt User",
      email: "user@example.com",
      password: "a-secure-password"
    }
  }, res);

  assert.equal(res.statusCode, 409);
});
