console.log("✅ app.js loaded with /api/ping route");

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

app.use("/api/v1/users", userRouter);

export default app ;
