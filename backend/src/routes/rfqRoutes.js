import express from "express";
import {
  createRFQ,
  getAllRFQs,
  getRFQById,
} from "../controllers/rfqController.js";
import { authMiddleware, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorize("BUYER"), createRFQ);
router.get("/", authMiddleware, getAllRFQs);
router.get("/:id", authMiddleware, getRFQById);

export default router;