import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { app } from "../server.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("health endpoint works without a database connection", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await response.json()).success, true);
});

test("protected report creation rejects missing authorization", async () => {
  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Should not be created" })
  });

  assert.equal(response.status, 401);

  const update = await fetch(`${baseUrl}/api/items/507f1f77bcf86cd799439011`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized edit" })
  });
  assert.equal(update.status, 401);

  const remove = await fetch(`${baseUrl}/api/items/507f1f77bcf86cd799439011`, {
    method: "DELETE"
  });
  assert.equal(remove.status, 401);

  const privateDetails = await fetch(`${baseUrl}/api/items/507f1f77bcf86cd799439011/private`);
  assert.equal(privateDetails.status, 401);
});

test("malformed JSON requests return a client error", async () => {
  const response = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid-json"
  });

  assert.equal(response.status, 400);
});

test("invalid item IDs are rejected before database access", async () => {
  const response = await fetch(`${baseUrl}/api/items/not-an-id`);
  assert.equal(response.status, 400);
});

test("invalid signup and login payloads return client errors", async () => {
  const signup = await fetch(`${baseUrl}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "A", email: "invalid", password: "short" })
  });
  assert.equal(signup.status, 400);

  const login = await fetch(`${baseUrl}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(login.status, 400);
});

test("unknown API routes return JSON 404 responses", async () => {
  const response = await fetch(`${baseUrl}/api/missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).success, false);
});
