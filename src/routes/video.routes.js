import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { deleteVideo, getAllVideos, getuploadConfig, getVideoByID, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/get-upload-config").get( verifyJWT,getuploadConfig) // checked
router.route("/").get( getAllVideos)  // checking
router.route("/").post( verifyJWT,publishVideo)  // checked
router.route("/:videoId").post( verifyJWT,getVideoByID)  // checked
router.route("/update/:videoId").patch( verifyJWT,updateVideo)  // checked
router.route("/delete/:videoId").delete( verifyJWT,deleteVideo)  // checked
router.route("/status/:videoId/:bool").patch( verifyJWT,togglePublishStatus)  // checked

  
export default router