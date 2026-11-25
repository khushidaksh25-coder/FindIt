import test from "node:test";
import assert from "node:assert/strict";
import { validateItemInput } from "../utils/itemValidation.js";

const validReport = {
  title: "Blue backpack",
  description: "Found near the library",
  category: "Bags",
  status: "Found",
  location: "Library",
  date: "2026-11-25",
  contactName: "Asha",
  contactEmail: "ASHA@example.com"
};

test("valid report fields are normalized for MongoDB", () => {
  const result = validateItemInput(validReport);

  assert.equal(result.error, undefined);
  assert.equal(result.data.contactEmail, "asha@example.com");
  assert.ok(result.data.date instanceof Date);
});

test("required report fields and enum values are validated", () => {
  assert.match(validateItemInput({ ...validReport, title: " " }).error, /title is required/);
  assert.match(validateItemInput({ ...validReport, category: "Weapons" }).error, /valid category/);
  assert.match(validateItemInput({ ...validReport, status: "Unknown" }).error, /valid status/);
  assert.match(validateItemInput({ ...validReport, date: "not-a-date" }).error, /valid report date/);
  assert.match(validateItemInput({ ...validReport, contactEmail: "bad-email" }).error, /valid contact email/);
});

test("unknown fields, including ownership fields, cannot be written", () => {
  assert.match(
    validateItemInput({ ...validReport, user: "another-user" }).error,
    /Unexpected field/
  );
  assert.match(
    validateItemInput({ title: "Edited", user: "another-user" }, { partial: true }).error,
    /Unexpected field/
  );
});

test("partial updates require at least one valid mutable field", () => {
  assert.deepEqual(validateItemInput({ title: "Updated bag" }, { partial: true }).data, {
    title: "Updated bag"
  });
  assert.match(validateItemInput({}, { partial: true }).error, /at least one/);
  assert.match(
    validateItemInput({ description: "x".repeat(2001) }, { partial: true }).error,
    /at most 2000/
  );
});

test("non-object request bodies are rejected", () => {
  assert.match(validateItemInput(null).error, /JSON object/);
  assert.match(validateItemInput([]).error, /JSON object/);
});
