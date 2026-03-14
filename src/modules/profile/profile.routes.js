import express from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { getwelcome } from "./profile.controller.js";

const router = express.Router();

router.get("/:userId/welcome",authenticate, getwelcome);

export default router;