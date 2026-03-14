import { z } from 'zod';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================
// Validates incoming request data before processing
// Zod is a TypeScript-first schema validation library
// Provides type-safe validation with detailed error messages

// ============================================
// CREATE JOURNEY VALIDATION
// ============================================
// Validates data when rider creates a new journey
// Used in: POST /api/journey/create
export const createJourneySchema = z.object({
    body: z.object({
        // ============================================
        // PICKUP LOCATION
        // ============================================
        pickupAddress: z
            .string({
                required_error: 'Pickup address is required'
            })
            .min(5, 'Pickup address must be at least 5 characters')
            .max(200, 'Pickup address cannot exceed 200 characters')
            .trim(),

        pickupCoordinates: z
            .array(z.number(), {
                required_error: 'Pickup coordinates are required'
            })
            .length(2, 'Coordinates must be [longitude, latitude]'),

        // ============================================
        // DROPOFF LOCATION
        // ============================================
        dropoffAddress: z
            .string({
                required_error: 'Dropoff address is required'
            })
            .min(5, 'Dropoff address must be at least 5 characters')
            .max(200, 'Dropoff address cannot exceed 200 characters')
            .trim(),

        dropoffCoordinates: z
            .array(z.number(), {
                required_error: 'Dropoff coordinates are required'
            })
            .length(2, 'Coordinates must be [longitude, latitude]'),

        // ============================================
        // VEHICLE TYPE
        // ============================================
        vehicleType: z
            .enum(['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'], {
                required_error: 'Vehicle type is required',
                invalid_type_error: 'Invalid vehicle type'
            }),

        // ============================================
        // PAYMENT METHOD
        // ============================================
        paymentMethod: z
            .enum(['CASH', 'DIGITAL_WALLET', 'DEBIT_CARD', 'CREDIT_CARD', 'UPI'], {
                required_error: 'Payment method is required'
            })
            .default('CASH'),

        // ============================================
        // OPTIONAL FIELDS
        // ============================================
        numberOfPassengers: z
            .number()
            .min(1, 'At least 1 passenger required')
            .max(5, 'Maximum 5 passengers allowed')
            .default(1)
            .optional(),

        specialRequests: z
            .string()
            .max(500, 'Special requests cannot exceed 500 characters')
            .optional(),

        luggage: z
            .boolean()
            .default(false)
            .optional()
    })
});

// ============================================
// UPDATE JOURNEY STATUS VALIDATION
// ============================================
// Validates status update requests from driver
// Used in: PATCH /api/journey/:journeyId/status
export const updateJourneyStatusSchema = z.object({
    body: z.object({
        status: z
            .enum(['ARRIVED', 'STARTED'], {
                required_error: 'Status is required',
                invalid_type_error: 'Invalid status. Only ARRIVED or STARTED allowed'
            })
    })
});

// ============================================
// COMPLETE JOURNEY VALIDATION
// ============================================
// Validates journey completion data from driver
// Used in: POST /api/journey/:journeyId/complete
export const completeJourneySchema = z.object({
    body: z.object({
        // ============================================
        // ACTUAL FARE
        // ============================================
        actualFare: z
            .number({
                required_error: 'Actual fare is required',
                invalid_type_error: 'Actual fare must be a number'
            })
            .positive('Actual fare must be greater than 0')
            .max(100000, 'Actual fare seems unrealistically high'),

        // ============================================
        // DISTANCE
        // ============================================
        distance: z
            .number({
                required_error: 'Distance is required'
            })
            .positive('Distance must be greater than 0')
            .max(500, 'Distance cannot exceed 500 km'),

        // ============================================
        // DURATION (in minutes)
        // ============================================
        duration: z
            .number({
                required_error: 'Duration is required'
            })
            .positive('Duration must be greater than 0')
            .max(1440, 'Duration cannot exceed 24 hours')
    })
});

// ============================================
// CANCEL JOURNEY VALIDATION
// ============================================
// Validates journey cancellation requests
// Used in: POST /api/journey/:journeyId/cancel
export const cancelJourneySchema = z.object({
    body: z.object({
        // ============================================
        // CANCELLATION REASON
        // ============================================
        reason: z
            .string({
                required_error: 'Cancellation reason is required'
            })
            .min(5, 'Reason must be at least 5 characters')
            .max(500, 'Reason cannot exceed 500 characters')
            .trim(),

        // ============================================
        // WHO CANCELLED
        // ============================================
        cancelledBy: z
            .enum(['RIDER', 'DRIVER'], {
                required_error: 'Cancelled by is required',
                invalid_type_error: 'Invalid cancelled by value'
            })
    })
});

// ============================================
// COORDINATE VALIDATION (Helper)
// ============================================
// Used to validate latitude and longitude
export const coordinateValidator = z.object({
    longitude: z
        .number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180'),

    latitude: z
        .number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
});

// ============================================
// VALIDATE ROUTE COORDINATES
// ============================================
// Helper function to validate coordinates format
export const validateCoordinates = (coords) => {
    if (!Array.isArray(coords) || coords.length !== 2) {
        throw new Error('Coordinates must be [longitude, latitude]');
    }
    const [lon, lat] = coords;
    const result = coordinateValidator.safeParse({ longitude: lon, latitude: lat });
    if (!result.success) {
        throw new Error(result.error.errors[0].message);
    }
    return true;
};

// ============================================
// VALIDATE DISTANCE BETWEEN LOCATIONS
// ============================================
// Helper function to ensure pickup and dropoff are different
export const validatePickupDropoff = (pickupCoords, dropoffCoords) => {
    const [lon1, lat1] = pickupCoords;
    const [lon2, lat2] = dropoffCoords;

    // Make sure they're not the same location
    if (lon1 === lon2 && lat1 === lat2) {
        throw new Error('Pickup and dropoff locations cannot be the same');
    }

    return true;
};