import { asyncHandler } from "../utils/asyncHandler";

const createPLayList = asyncHandler(async (req, res) => {
  const { name , description } = req.body;
});

const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId } = req.params;
});

const getUserPlayListById = asyncHandler(async (req, res) => {
  const { playListId } = req.params;
})
const addVideoToPlayList = asyncHandler(async (req, res) => {
  const {playListId, videoId } = req.params;
});
const removeVideoToPlayList = asyncHandler(async (req, res) => {
  const {playListId, videoId } = req.params;
});
const deletePlayList = asyncHandler(async (req, res) => {
  const {playListId } = req.params;
});
const updatePlayList = asyncHandler(async (req, res) => {
  const {playListId } = req.params;
  const { name , description } = req.body;
});

export {
    getUserPlayList,
    getUserPlayListById,
    addVideoToPlayList,
    removeVideoToPlayList,
    deletePlayList,
    updatePlayList
}