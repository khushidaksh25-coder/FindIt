import test from "node:test";
import assert from "node:assert/strict";
import Item from "../models/item.js";
import { deleteItem, updateItem } from "../controllers/itemController.js";

const itemId = "507f1f77bcf86cd799439011";
const ownerId = "507f191e810c19729de860ea";

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

test("update query scopes report changes to the authenticated owner", async (t) => {
  let filter;
  t.mock.method(Item, "findOneAndUpdate", async (query) => {
    filter = query;
    return null;
  });
  const res = createResponse();

  await updateItem({
    params: { id: itemId },
    user: { id: ownerId },
    body: { title: "Updated report" }
  }, res);

  assert.deepEqual(filter, { _id: itemId, user: ownerId });
  assert.equal(res.statusCode, 404);
});

test("delete query scopes report removal to the authenticated owner", async (t) => {
  let filter;
  t.mock.method(Item, "findOneAndDelete", async (query) => {
    filter = query;
    return null;
  });
  const res = createResponse();

  await deleteItem({
    params: { id: itemId },
    user: { id: ownerId }
  }, res);

  assert.deepEqual(filter, { _id: itemId, user: ownerId });
  assert.equal(res.statusCode, 404);
});
