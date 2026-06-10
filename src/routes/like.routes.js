import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentsLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT); 

router.route("/toggle/v/:videoId").post(toggleVideoLike);  // checked
router.route("/toggle/c/:commentId").post(toggleCommentsLike); // checked
router.route("/videos").get(getLikedVideos); 

export default router;
