const categories = new Set([
  "Electronics",
  "Bags",
  "Documents",
  "Accessories",
  "Clothing",
  "Other"
]);

const statuses = new Set(["Lost", "Found"]);

const stringLimits = {
  title: 120,
  description: 2000,
  location: 200,
  contactName: 100,
  contactEmail: 254,
  image: 2048
};

const allowedFields = new Set([
  ...Object.keys(stringLimits),
  "category",
  "status",
  "date"
]);

export const validateItemInput = (input, { partial = false } = {}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object." };
  }

  const unexpectedField = Object.keys(input).find((field) => !allowedFields.has(field));
  if (unexpectedField) {
    return { error: `Unexpected field: ${unexpectedField}.` };
  }

  const fields = partial
    ? Object.keys(input)
    : [...allowedFields].filter((field) => field !== "image");

  if (fields.length === 0) {
    return { error: "Provide at least one report field to update." };
  }

  const data = {};

  for (const field of fields) {
    const value = input[field];
    if (value === undefined && partial) continue;

    if (field === "category" || field === "status") {
      const values = field === "category" ? categories : statuses;
      if (typeof value !== "string" || !values.has(value)) {
        return { error: `Choose a valid ${field}.` };
      }
      data[field] = value;
      continue;
    }

    if (field === "date") {
      if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value))) {
        return { error: "Enter a valid report date." };
      }
      data.date = new Date(value);
      continue;
    }

    if (typeof value !== "string") {
      return { error: `${field} must be text.` };
    }

    const normalized = value.trim();
    if (!normalized && field !== "image") {
      return { error: `${field} is required.` };
    }
    if (normalized.length > stringLimits[field]) {
      return { error: `${field} must be at most ${stringLimits[field]} characters.` };
    }
    if (field === "contactEmail" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { error: "Enter a valid contact email address." };
    }

    data[field] = field === "contactEmail" ? normalized.toLowerCase() : normalized;
  }

  return { data };
}
