
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import connectDB from "./config/db.js";
import itemRoutes from "./routes/itemRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
export { app };
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin is not allowed by CORS."));
  }
}));
app.use(express.json({ limit: "32kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  }
});

app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

// Home Route
app.get("/", (req, res) => {
  res.send("Welcome to FindIt API");
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FindIt server is running successfully!"
  });
});

// Item Routes
app.use("/api/items", itemRoutes);

// User Routes
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      message: "Request body is too large."
    });
    return;
  }

  if (error.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      message: "Request body must contain valid JSON."
    });
    return;
  }

  if (error.message === "Origin is not allowed by CORS.") {
    res.status(403).json({
      success: false,
      message: "Origin is not allowed."
    });
    return;
  }

  console.error("Request failed.");
  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI must be configured.");
    }
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log(`FindIt server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

if (process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startServer();
}
