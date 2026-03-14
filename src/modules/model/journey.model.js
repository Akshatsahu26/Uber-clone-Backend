import mongoose from "mongoose";
import { tr } from "zod/v4/locales";

const journeySchema = new mongoose.Schema({
    // USER REFERENCES
    // Rider who requested the journey
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Rider ID is required']
    },

    // Driver assigned to the journey (null until accepted)
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    },

    // JOURNEY STATUS

    // Current status of the journey
    // Lifecycle: REQUESTED → ACCEPTED → ARRIVED → STARTED → COMPLETED/CANCELLED
    status: {
        type: String,
        enum: {
            values: ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'],
            message: 'Invalid journey status'
        },
        default: 'REQUESTED'
    },

    // VEHICLE TYPE

    // Type of vehicle requested by rider
    vehicleType: {
        type: String,
        enum: ['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'],
        required: [true, 'Vehicle type is required']
    },

    // LOCATION DETAILS

    // 1. Pickup location
    pickup: {
        address: {
            type: String,
            required: [true, 'Pickup address is required'],
            trim: true
        },
        // GeoJSON Point: { type: 'Point', coordinates: [longitude, latitude] }
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],  // [longitude, latitude]
                required: [true, 'Pickup coordinates are required']
            }
        }
    },

    // 2. Dropoff location

    dropoff: {
        address: {
            type: String,
            required: [true, 'Dropoff address is required'],
            trim: true
        },
        // GeoJSON Point: { type: 'Point', coordinates: [longitude, latitude] }
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],  // [longitude, latitude]
                required: [true, 'Dropoff coordinates are required']
            }
        }
    },

    // PRICING DETAILS

    // Estimated fare calculated at request time
    estimatedFare: {
        type: Number,
        required: [true, 'Estimated fare is required'],
        min: [0, 'Fare cannot be negative']
    },

    // Actual fare after journey completion
    actualFare: {
        type: Number,
        default: null,
        min: [0, 'Fare cannot be negative']
    },

    // Distance in kilometers
    distance: {
        type: Number,
        default: null,
        min: [0, 'Distance cannot be negative']
    },

    // Duration in minutes
    duration: {
        type: Number,
        default: null,
        min: [0, 'Duration cannot be negative']
    },

    // PAYMENT DETAILS

    // Payment method chosen by rider
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'WALLET'],
        required: [true, 'Payment method is required']
    },

    // Payment status
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },

    // TIMESTAMPS

    // When journey was requested
    requestedAt: {
        type: Date,
        default: Date.now
    },

    // When driver accepted the journey
    acceptedAt: {
        type: Date,
        default: null
    },

    // When driver arrived at pickup location
    arrivedAt: {
        type: Date,
        default: null
    },

    // When journey started (driver picked up rider)
    startedAt: {
        type: Date,
        default: null
    },

    // When journey completed
    completedAt: {
        type: Date,
        default: null
    },

    // When journey was cancelled
    cancelledAt: {
        type: Date,
        default: null
    },

    // CANCELLATION DETAILS

    // Reason for cancellation
    cancellationReason: {
        type: String,
        default: null,
        trim: true
    },

    // Who cancelled the journey
    cancelledBy: {
        type: String,
        enum: ['RIDER', 'DRIVER', null],
        default: null
    },

    // RATING & FEEDBACK

    // Rider's rating for the journey (1-5 stars)
    rating: {
        type: Number,
        default: null,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },

    // Rider's feedback
    feedback: {
        type: String,
        default: null,
        trim: true,
        maxlength: [500, 'Feedback cannot exceed 500 characters']
    }
},{
    timestamps: true,
});

// DATABASE INDEXES

// Index for rider's journey history
journeySchema.index({ riderId: 1, createdAt: -1 });

// Index for driver's journey history
journeySchema.index({ driverId: 1, createdAt: -1 });

// Index for finding journeys by status
journeySchema.index({ status: 1 });

// Geospatial index for pickup location (enables nearby journey queries)
journeySchema.index({ 'pickup.location': '2dsphere' });
journeySchema.index({ 'dropoff.location': '2dsphere' });


// Check if journey can be cancelled
journeySchema.methods.canBeCancelled = function () {
    return ['REQUESTED', 'ACCEPTED', 'ARRIVED'].includes(this.status);
};

// Check if status transition is valid
journeySchema.methods.isValidStatusTransition = function (newStatus) {
    const validTransitions = {
        'REQUESTED': ['ACCEPTED', 'CANCELLED'],
        'ACCEPTED': ['ARRIVED', 'CANCELLED'],
        'ARRIVED': ['STARTED', 'CANCELLED'],
        'STARTED': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [],
        'CANCELLED': []
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
};

export const Journey = mongoose.model('Ride', journeySchema);

export const Ride = Journey;