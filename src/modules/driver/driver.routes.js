import express from "express"
import { authenticate, authorizeRole } from "../../common/middleware/auth.middleware.js";
import { 
    createProfile,
    getProfile, 
    getProfileCompletion, 
    updateProfile, 
    updateStatus } 
    from "./driver.controller.js";
import { Driver } from "../model/driver.model.js";
import { validate } from "../../common/middleware/auth.validate.js";
import { createDriverProfileSchema, updateDriverProfileSchema, updateStatusSchema } from "./driver.validation.js";

const router = express.Router();

// CREATE DRIVER PROFILE

router.post(
    "/register",
    authenticate,
    validate(createDriverProfileSchema),
    createProfile,
)

// GET PROFILE COMPLETION DETAILS

router.get(
    "/me/completion",
    authenticate,
    authorizeRole('DRIVER'),
    getProfileCompletion,
)

// UPDATE DRIVER STATUS (ONLINE/OFFLINE)

router.patch(
    "/me/status",
    authenticate,
    authorizeRole('DRIVER'),
    validate(updateStatusSchema),
    updateStatus,
)

// GET DRIVER PROFILE

router.get(
    "/me",
    authenticate,
    authorizeRole('DRIVER'),
    getProfile,
)

// UPDATE DRIVER PROFILE

router.patch(
    "/me",
    authenticate,
    authorizeRole('DRIVER'),
    validate(updateDriverProfileSchema),
    updateProfile,
)

export default router;