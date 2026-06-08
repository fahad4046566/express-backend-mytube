import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription); // checked

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers); //checked
router.route("/c/:subscriberId/channels").get(getSubscribedChannels); // checked

export default router;
