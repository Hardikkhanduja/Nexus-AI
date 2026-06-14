import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);

export default router;
