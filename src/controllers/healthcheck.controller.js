import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});

export {healthCheck}