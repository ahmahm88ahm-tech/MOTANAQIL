import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";

// Simple logging middleware as fallback
const simpleLogger = (req: Request, res: Response, next: () => void) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

const app: Express = express();

app.use(simpleLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
