import express from "express";
import { login, signup } from "./auth.controller.js";
import { validate } from "../../common/middleware/auth.validate.js";
import { loginSchema, signupSchema } from "./auth.validation.js";

const routes = express.Router();

routes.post("/signup",validate(signupSchema) ,signup );
routes.post("/login",validate(loginSchema) ,login);

export const authRouter = routes;
