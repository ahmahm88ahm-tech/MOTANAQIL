import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import serversRouter from "./servers.js";
import deviceRouter from "./device.js";
import detectCompanyRouter from "./detectCompany.js";
import spoofUrlsRouter from "./spoofUrls.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(serversRouter);
router.use(deviceRouter);
router.use(detectCompanyRouter);
router.use(spoofUrlsRouter);

export default router;
