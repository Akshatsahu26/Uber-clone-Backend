import { Ride } from '../model/journey.model.js'
import { User } from '../model/user.model.js'
import { Driver } from '../model/driver.model.js'
import QRCode from 'qrcode'



// JOURNEY SERVICE - Business Logic Layer

class JourneyService {
    // CREATE JOURNEY (RIDER)

    async createJourney(riderId, journeyData) {
        // Validate rider exists
        const rider = await User.findById(riderId);
        if (!rider) {
            throw new Error('Rider not found');
        }

        // Calculate estimated fare (simple calculation: base + distance-based)
        const estimatedFare = this.calculateEstimatedFare(
            journeyData.pickupCoordinates,
            journeyData.dropoffCoordinates,
            journeyData.vehicleType
        );

        // Create journey
        const journey = new Ride({
            riderId,
            vehicleType: journeyData.vehicleType,
            pickup: {
                address: journeyData.pickupAddress,
                location: {
                    type: 'Point',
                    coordinates: journeyData.pickupCoordinates  // [longitude, latitude]
                }
            },
            dropoff: {
                address: journeyData.dropoffAddress,
                location: {
                    type: 'Point',
                    coordinates: journeyData.dropoffCoordinates  // [longitude, latitude]
                }
            },
            estimatedFare,
            paymentMethod: journeyData.paymentMethod,
            status: 'REQUESTED'
        });

        await journey.save();
        await journey.populate('riderId', 'name email phone');

        return this.formatJourneyResponse(journey);
    }

    // ACCEPT JOURNEY (DRIVER)

    async acceptJourney(journeyId, driverId) {
        // Validate driver
        const driver = await Driver.findById(driverId).populate('userId');
        if (!driver) {
            throw new Error('Driver not found');
        }

        if (!driver.status.isOnline) {
            throw new Error('Driver must be online to accept journeys');
        }

        // if (!driver.status.isVerified) {
        //     throw new Error('Driver must be verified to accept journeys');
        // }

        // Validate journey
        const journey = await Ride.findById(journeyId);
        if (!journey) {
            throw new Error('Journey not found');
        }

        if (journey.status !== 'REQUESTED') {
            throw new Error('Journey is no longer available');
        }

        // Check vehicle type match
        if (journey.vehicleType !== driver.vehicleInfo.vehicleType) {
            throw new Error('Vehicle type does not match journey request');
        }

        // Assign driver and update status
        journey.driverId = driverId;
        journey.status = 'ACCEPTED';
        journey.acceptedAt = new Date();

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // UPDATE JOURNEY STATUS (DRIVER)

    async updateJourneyStatus(journeyId, driverId, newStatus) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate driver owns this journey
        if (!journey.driverId || journey.driverId.toString() !== driverId.toString()) {
            throw new Error('You are not assigned to this journey');
        }

        // Validate status transition
        if (!journey.isValidStatusTransition(newStatus)) {
            throw new Error(`Cannot transition from ${journey.status} to ${newStatus}`);
        }

        // Update status and timestamp
        journey.status = newStatus;

        if (newStatus === 'ARRIVED') {
            journey.arrivedAt = new Date();
        } else if (newStatus === 'STARTED') {
            journey.startedAt = new Date();
        }

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // COMPLETE JOURNEY (DRIVER)

    async completeJourney(journeyId, driverId, completionData) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate driver owns this journey
        if (!journey.driverId || journey.driverId.toString() !== driverId.toString()) {
            throw new Error('You are not assigned to this journey');
        }

        // Validate journey is started
        if (journey.status !== 'STARTED') {
            throw new Error('Journey must be started before completion');
        }

        // Update journey
        journey.status = 'COMPLETED';
        journey.completedAt = new Date();
        journey.actualFare = completionData.actualFare;
        journey.distance = completionData.distance;
        journey.duration = completionData.duration;
        
        // Auto-complete payment only for CASH
        if (journey.paymentMethod === 'CASH') {
            journey.paymentStatus = 'COMPLETED';
        } else {
            journey.paymentStatus = 'PENDING';
        }

        await journey.save();

        // Update driver stats
        await Driver.findByIdAndUpdate(driverId, {
            $inc: { 'stats.totalRides': 1 }
        });

        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // CANCEL JOURNEY

    async cancelJourney(journeyId, userId, reason, cancelledBy) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate user is part of this journey
        const isRider = journey.riderId.toString() === userId.toString();
        const isDriver = journey.driverId && journey.driverId.toString() === userId.toString();

        if (!isRider && !isDriver) {
            throw new Error('You are not authorized to cancel this journey');
        }

        // Check if journey can be cancelled
        if (!journey.canBeCancelled()) {
            throw new Error('Journey cannot be cancelled in current status');
        }

        // Update journey
        journey.status = 'CANCELLED';
        journey.cancelledAt = new Date();
        journey.cancellationReason = reason;
        journey.cancelledBy = cancelledBy;

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // GET JOURNEY BY ID

    async getJourneyById(journeyId, userId) {
        const journey = await Ride.findById(journeyId)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            });

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate user is part of this journey
        const isRider = journey.riderId._id.toString() === userId.toString();
        const isDriver = journey.driverId && journey.driverId._id.toString() === userId.toString();

        if (!isRider && !isDriver) {
            throw new Error('You are not authorized to view this journey');
        }

        return this.formatJourneyResponse(journey);
    }

    // GET RIDER JOURNEYS

    async getRiderJourneys(riderId, status = null) {
        const query = { riderId };

        if (status) {
            query.status = status;
        }

        const journeys = await Ride.find(query)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        return journeys.map(journey => this.formatJourneyResponse(journey));
    }

    // GET DRIVER JOURNEYS

    async getDriverJourneys(driverId, status = null) {
        const query = { driverId };

        if (status) {
            query.status = status;
        }

        const journeys = await Ride.find(query)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        return journeys.map(journey => this.formatJourneyResponse(journey));
    }

    // CALCULATE ESTIMATED FARE

    calculateEstimatedFare(pickupCoords, dropoffCoords, vehicleType) {
        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(pickupCoords, dropoffCoords);

        // Base fares and rates per km for different vehicle types
        const pricing = {
            'CAR': { base: 50, perKm: 12 },
            'BIKE': { base: 20, perKm: 6 },
            'AUTO': { base: 30, perKm: 8 },
            'E_RICKSHAW': { base: 25, perKm: 7 },
            'ELECTRIC_SCOOTER': { base: 15, perKm: 5 }
        };

        const { base, perKm } = pricing[vehicleType];
        const fare = base + (distance * perKm);

        return Math.round(fare);
    }

    // CALCULATE DISTANCE

    calculateDistance(coords1, coords2) {
        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;

        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    // Convert degrees to radians
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // FORMAT JOURNEY RESPONSE

    formatJourneyResponse(journey) {
        const response = {
            _id: journey._id,
            status: journey.status,
            vehicleType: journey.vehicleType,

            rider: {
                _id: journey.riderId._id,
                name: journey.riderId.name,
                email: journey.riderId.email,
                phone: journey.riderId.phone
            },

            driver: journey.driverId ? {
                _id: journey.driverId._id,
                name: journey.driverId.userId.name,
                email: journey.driverId.userId.email,
                phone: journey.driverId.userId.phone,
                vehicleModel: journey.driverId.vehicleInfo.vehicleModel,
                vehicleColor: journey.driverId.vehicleInfo.vehicleColor,
                vehicleNumber: journey.driverId.vehicleInfo.vehicleNumber,
                rating: journey.driverId.stats.rating
            } : null,

            pickup: journey.pickup,
            dropoff: journey.dropoff,

            estimatedFare: journey.estimatedFare,
            actualFare: journey.actualFare,
            distance: journey.distance,
            duration: journey.duration,

            paymentMethod: journey.paymentMethod,
            paymentStatus: journey.paymentStatus,

            requestedAt: journey.requestedAt,
            acceptedAt: journey.acceptedAt,
            arrivedAt: journey.arrivedAt,
            startedAt: journey.startedAt,
            completedAt: journey.completedAt,
            cancelledAt: journey.cancelledAt,

            cancellationReason: journey.cancellationReason,
            cancelledBy: journey.cancelledBy,

            rating: journey.rating,
            feedback: journey.feedback,

            createdAt: journey.createdAt,
            updatedAt: journey.updatedAt
        };

        return response;
    }

    // GENERATE PAYMENT QR
    async generatePaymentQR(journeyId, riderId) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Only the rider of this journey can request QR
        if (journey.riderId.toString() !== riderId.toString()) {
            throw new Error('You are not authorized to generate payment for this journey');
        }

        // Only COMPLETED journeys need payment
        if (journey.status !== 'COMPLETED') {
            throw new Error('Payment QR only available for completed journeys');
        }

        // Allow viewing QR even if payment is completed (for history/receipt purposes)
        // if (journey.paymentStatus === 'COMPLETED') {
        //     throw new Error('Payment has already been completed');
        // }

        const amount = journey.actualFare || journey.estimatedFare;

        // Use a static UPI ID for receiving payments
        // Replace 'akshatsahu@upi' with your actual UPI ID (e.g. shown in your Google Pay profile)
        const merchantVPA = 'akshatsahu@upi'; 
        const merchantName = 'Uber Clone Driver';
        
        // Build UPI URL for dynamic payment (Amount is pre-filled)
        const upiUrl = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Ride-${journey._id.toString().slice(-4)}`;

        // Generate base64 QR code image
        const qrCode = await QRCode.toDataURL(upiUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        return {
            journeyId: journey._id,
            amount,
            paymentMethod: journey.paymentMethod,
            qrCode
        };
    }

    // CONFIRM PAYMENT

    async confirmPayment(journeyId, riderId) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        if (journey.riderId.toString() !== riderId.toString()) {
            throw new Error('You are not authorized to confirm payment for this journey');
        }

        if (journey.status !== 'COMPLETED') {
            throw new Error('Can only confirm payment for completed journeys');
        }

        if (journey.paymentStatus === 'COMPLETED') {
            return { alreadyPaid: true, journeyId: journey._id };
        }

        journey.paymentStatus = 'COMPLETED';
        await journey.save();

        return {
            alreadyPaid: false,
            journeyId: journey._id,
            amount: journey.actualFare || journey.estimatedFare,
            paymentMethod: journey.paymentMethod
        };
    }
}

export const journeyService = new JourneyService();