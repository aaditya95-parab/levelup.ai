import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import questsRouter from "./quests.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(questsRouter);
router.use(statsRouter);

export default router;
