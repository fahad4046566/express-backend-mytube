import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist) // checked

router
    .route("/:playlistId") 
    .get(getPlaylistById) // checked
    .patch(updatePlaylist) // checked
    .delete(deletePlaylist); // checked

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);  // checked
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist); // checked

router.route("/user/:userId").get(getUserPlaylists); // checked

export default router