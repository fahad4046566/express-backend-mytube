
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
// Temporary test route – seedha yahan, bina multer ke
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});
// configrations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "16kb",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import userRouter from "./routes/user.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js"
import subscriptionsRouter from './routes/subscriptions.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import playListRouter from './routes/playList.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/subscriptions", subscriptionsRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/playList",playListRouter);
app.use("/api/v1/dashboard",dashboardRouter);


export default app ;
