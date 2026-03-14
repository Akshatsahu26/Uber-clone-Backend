import express from "express"
import { authenticate, authorizeRole } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/auth.validate.js";
import {
    createJourney,
    getJourneyById,
    getRiderJourneys,
    cancelJourney,
    generatePaymentQR,
    confirmPayment,
    acceptJourney,
    updateJourneyStatus,
    completeJourney,
    getDriverJourneys,
    getAvailableRides,
} from "./journey.controller.js";
import {
    createJourneySchema,
    updateJourneyStatusSchema,
    completeJourneySchema,
    cancelJourneySchema,
} from "./journey.validation.js";

// JOURNEY ROUTES
const router = express.Router();

// ── STATIC ROUTES FIRST (must be before /:journeyId) ─────────────────────────

// GET AVAILABLE RIDES (for drivers polling)
router.get(
    '/available',
    authenticate,
    authorizeRole('DRIVER'),
    getAvailableRides
);

// GET RIDER JOURNEYS HISTORY
router.get(
    '/rider/history',
    authenticate,
    getRiderJourneys
);

// GET DRIVER JOURNEYS HISTORY
router.get(
    '/driver/history',
    authenticate,
    authorizeRole('DRIVER'),
    getDriverJourneys
);

// ── CREATE JOURNEY ────────────────────────────────────────────────────────────
router.post(
    '/',
    authenticate,
    validate(createJourneySchema),
    createJourney
);

// ── PARAM ROUTES (/:journeyId) — must come AFTER all static routes ────────────

// GET JOURNEY BY ID
router.get(
    '/:journeyId',
    authenticate,
    getJourneyById
);

// CANCEL JOURNEY (RIDER)
router.post(
    '/:journeyId/cancel',
    authenticate,
    validate(cancelJourneySchema),
    cancelJourney
);

// GENERATE PAYMENT QR
router.get(
    '/:journeyId/payment-qr',
    authenticate,
    generatePaymentQR
);

// CONFIRM PAYMENT
router.post(
    '/:journeyId/confirm-payment',
    authenticate,
    confirmPayment
);

// ACCEPT JOURNEY (DRIVER)
router.post(
    '/:journeyId/accept',
    authenticate,
    authorizeRole('DRIVER'),
    acceptJourney
);

// UPDATE JOURNEY STATUS
router.patch(
    '/:journeyId/status',
    authenticate,
    authorizeRole('DRIVER'),
    validate(updateJourneyStatusSchema),
    updateJourneyStatus
);

// COMPLETE JOURNEY
router.post(
    '/:journeyId/complete',
    authenticate,
    authorizeRole('DRIVER'),
    validate(completeJourneySchema),
    completeJourney
);

export default router;