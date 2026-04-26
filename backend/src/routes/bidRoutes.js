import express from "express";
import { placeBid } from "../controllers/bidController.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorize("SUPPLIER"), placeBid);

export default router;