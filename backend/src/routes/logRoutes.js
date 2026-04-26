import express from "express";
import { getLogs } from "../controllers/logController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:rfqId", authMiddleware, getLogs);

export default router;