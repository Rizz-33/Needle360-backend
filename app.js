import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import http from "http";
import passport from "passport";
import { handleStripeWebhook } from "./controllers/payment.controller.js";
import { connectToMongoDB } from "./db_connection.js";
import webhookRoutes from "./mailtrap/webhookController.js";
import initializeSocketServer from "./middleware/socket.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import availabilityRoutes from "./routes/availability.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import customerRoutes from "./routes/customer.route.js";
import designRoutes from "./routes/design.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import messageRoutes from "./routes/message.route.js";
import offerRoutes from "./routes/offer.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import serviceRoutes from "./routes/service.route.js";
import tailorRoutes from "./routes/tailor.route.js";
import userInteractionsRoutes from "./routes/user-interactions.route.js";
import "./utils/passport.config.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://needle360.online",
  "http://www.needle360.online",
  "https://www.needle360.online",
  "http://localhost:5173",
  "http://172.20.10.5",
  "http://13.61.16.74",
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.some((allowed) =>
          typeof allowed === "string"
            ? allowed === origin
            : allowed.test(origin)
        )
      ) {
        callback(null, true);
      } else {
        console.warn(`Express: Blocked CORS request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  express.static("public", {
    setHeaders: (res, path) => {
      if (path.endsWith(".webmanifest")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
    },
  })
);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhook/stripe") {
    next();
  } else {
    express.json({ limit: "16mb" })(req, res, next);
  }
});

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const io = initializeSocketServer(server);
app.set("io", io);
console.log("Express: Socket.IO server initialized");

app.use((req, res, next) => {
  req.io = io;
  next();
});

const port = process.env.PORT || 4000;

app.use(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

connectToMongoDB()
  .then(() => {
    app.use("/api/auth", authRoutes);
    app.use("/api/tailor", tailorRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/user-interactions", userInteractionsRoutes);
    app.use("/api/design", designRoutes);
    app.use("/api/offer", offerRoutes);
    app.use("/api/availability", availabilityRoutes);
    app.use("/api/services", serviceRoutes);
    app.use("/api/customer", customerRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/review", reviewRoutes);
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/order", orderRoutes);
    app.use("/api/mailtrap-webhook", webhookRoutes);

    app.get("/api", (req, res) => {
      res.json({ message: "API server is up and running" });
    });

    app.get("/", (req, res) => {
      res.json({
        message: "Welcome to Needle360 Backend",
        api_docs: "http://13.61.16.74:4000/api",
        frontend: "http://13.61.16.74:5173",
      });
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Express: Backend server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(
      "Express: Failed to connect to MongoDB. Server not started.",
      error
    );
    process.exit(1);
  });
