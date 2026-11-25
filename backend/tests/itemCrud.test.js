import test from "node:test";
import assert from "node:assert/strict";
import Item from "../models/item.js";
import {
  createItem,
  deleteItem,
  getItemById,
  getOwnedItemDetails,
  getItems,
  updateItem
} from "../controllers/itemController.js";

const itemId = "507f1f77bcf86cd799439011";
const ownerId = "507f191e810c19729de860ea";
const report = {
  title: "Blue backpack",
  description: "Found near the library",
  category: "Bags",
  status: "Found",
  location: "Library",
  date: "2026-11-25",
  contactName: "Asha",
  contactEmail: "asha@example.com"
};

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

test("create stores the authenticated owner, not a client-provided owner", async (t) => {
  let created;
  t.mock.method(Item, "create", async (data) => {
    created = data;
    return { ...data, _id: itemId };
  });
  const res = createResponse();

  await createItem({
    user: { id: ownerId },
    body: report
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(created.user, ownerId);
  assert.equal(created.contactEmail, "asha@example.com");
});

test("community listing excludes contact emails and only populates public owner names", async (t) => {
  let selectedFields;
  let populatedPath;
  let populatedFields;
  const query = {
    select(fields) {
      selectedFields = fields;
      return this;
    },
    populate(path, fields) {
      populatedPath = path;
      populatedFields = fields;
      return Promise.resolve([]);
    }
  };
  t.mock.method(Item, "find", () => query);
  const res = createResponse();

  await getItems({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(selectedFields, "-contactEmail");
  assert.equal(populatedPath, "user");
  assert.equal(populatedFields, "name");
});

test("single report reads remain available to the community", async (t) => {
  let requestedId;
  const item = { _id: itemId, ...report };
  const query = {
    select() {
      return this;
    },
    populate() {
      return Promise.resolve(item);
    }
  };
  t.mock.method(Item, "findById", (id) => {
    requestedId = id;
    return query;
  });
  const res = createResponse();

  await getItemById({ params: { id: itemId } }, res);

  assert.equal(requestedId, itemId);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data._id, itemId);
});

test("private item detail reads require and scope by the owner", async (t) => {
  let filter;
  let selectedFields;
  const item = { _id: itemId, ...report };
  const query = {
    select(fields) {
      selectedFields = fields;
      return this;
    },
    populate() {
      return Promise.resolve(item);
    }
  };
  t.mock.method(Item, "findOne", (queryFilter) => {
    filter = queryFilter;
    return query;
  });
  const res = createResponse();

  await getOwnedItemDetails({
    params: { id: itemId },
    user: { id: ownerId }
  }, res);

  assert.deepEqual(filter, { _id: itemId, user: ownerId });
  assert.equal(selectedFields, "+contactEmail");
  assert.equal(res.statusCode, 200);
});

test("owner-scoped update and delete still succeed for a matching owner", async (t) => {
  let updateFilter;
  let deleteFilter;
  t.mock.method(Item, "findOneAndUpdate", async (filter) => {
    updateFilter = filter;
    return { _id: itemId, ...report, title: "Updated backpack" };
  });
  t.mock.method(Item, "findOneAndDelete", async (filter) => {
    deleteFilter = filter;
    return { _id: itemId, ...report };
  });
  const updateRes = createResponse();
  const deleteRes = createResponse();

  await updateItem({
    params: { id: itemId },
    user: { id: ownerId },
    body: { title: "Updated backpack" }
  }, updateRes);
  await deleteItem({
    params: { id: itemId },
    user: { id: ownerId }
  }, deleteRes);

  assert.deepEqual(updateFilter, { _id: itemId, user: ownerId });
  assert.deepEqual(deleteFilter, { _id: itemId, user: ownerId });
  assert.equal(updateRes.statusCode, 200);
  assert.equal(deleteRes.statusCode, 200);
});
