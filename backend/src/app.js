import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import rfqRoutes from "./routes/rfqRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import logRoutes from "./routes/logRoutes.js";

import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/rfq", rfqRoutes);
app.use("/bid", bidRoutes);
app.use("/logs", logRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;