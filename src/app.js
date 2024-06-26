import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeSocketIO } from "./socket/index.js";
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.set("io", io);

initializeSocketIO(io);

//configuration setting
app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//routes declaration
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

app.use("/images", express.static("temp"));

export { app, httpServer };
