import { journeyService } from "./journey.service.js"
import { kafkaService } from "../../services/kafka.service.js"
import { Ride } from "../model/journey.model.js"


// GET AVAILABLE RIDES (REQUESTED status) — for drivers polling

export const getAvailableRides = async (req, res) => {
    try {
        // Driver is attached by authorizeRole('DRIVER') middleware
        const driver = req.user.driver;
        const vehicleType = driver?.vehicleInfo?.vehicleType;

        if (!vehicleType) {
            return res.status(400).json({
                success: false,
                message: 'Driver vehicle type not set. Please complete vehicle info in profile.'
            });
        }

        const rides = await Ride.find({
                status: 'REQUESTED',
                vehicleType: vehicleType
            })
            .populate('riderId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: rides,
            message: `Available ${vehicleType} rides retrieved successfully`
        });
    } catch (error) {
        console.error('Error in getAvailableRides:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve available rides'
        });
    }
};

export const createJourney = async (req, res) => {
    try {
        const userId = req.user._id;
        const journeyData = req.body;
        const journey = await journeyService.createJourney(userId, journeyData);

        // Publish Kafka event: Journey Requested
        await kafkaService.publishJourneyRequested(journey);
        
        // Send notification to nearby drivers
        await kafkaService.publishDriverNotification('broadcast', {
            title: 'New Journey Request',
            message: `New ${journey.vehicleType} ride from ${journey.pickup.address}`,
            type: 'INFO',
            data: { journeyId: journey._id.toString() }
        });
        
        res.status(201).json({
            success: true,
            data: journey,
            message: 'Journey created successfully'
        });
    } catch (error) {
        console.error('Error in createJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create journey'
        });
    }
};

export const acceptJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const driverId = req.user.driver._id;
        const journey = await journeyService.acceptJourney(journeyId, driverId);
        
        // Publish Kafka event: Journey Accepted
        await kafkaService.publishJourneyAccepted(journey, req.user.driver);
        
        // Send notification to rider
        await kafkaService.publishRiderNotification(journey.rider._id, {
            title: 'Driver Assigned',
            message: `${req.user.driver.userId.name} is on the way!`,
            type: 'SUCCESS',
            data: { 
                journeyId: journey._id.toString(),
                driverId: req.user.driver.userId._id.toString()
            }
        });
        
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey accepted successfully'
        });
    } catch (error) {
        console.error('Error in acceptJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to accept journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/status:
 *   patch:
 *     summary: Update journey status (Driver)
 *     description: |
 *       Driver updates the journey status.
 *       **Valid transitions:** `ACCEPTED → ARRIVED`, `ARRIVED → STARTED`
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ARRIVED, STARTED]
 *           example:
 *             status: "ARRIVED"
 *     responses:
 *       200:
 *         description: Journey status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Journey status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const updateJourneyStatus = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { status } = req.body;
        const driverId = req.user.driver._id;
        const journey = await journeyService.updateJourneyStatus(journeyId, driverId, status);
        
        // Publish Kafka event based on status
        if (status === 'STARTED') {
            await kafkaService.publishJourneyStarted(journey);
            
            // Notify rider
            await kafkaService.publishRiderNotification(journey.rider._id, {
                title: 'Journey Started',
                message: 'Your ride has started. Enjoy your journey!',
                type: 'INFO',
                data: { journeyId: journey._id.toString() }
            });
        }
        
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey status updated successfully'
        });
    } catch (error) {
        console.error('Error in updateJourneyStatus:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update journey status'
        });
    }
};

export const completeJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { actualFare, distance, duration } = req.body;
        const driverId = req.user.driver._id;
        const completionData = { actualFare, distance, duration };
        const journey = await journeyService.completeJourney(journeyId, driverId, completionData);
        
        // Publish Kafka event: Journey Completed
        await kafkaService.publishJourneyCompleted(journey);
        
        // Notify rider
        await kafkaService.publishRiderNotification(journey.rider._id, {
            title: 'Journey Completed',
            message: `Your journey is complete. Fare: ₹${journey.actualFare}`,
            type: 'SUCCESS',
            data: { 
                journeyId: journey._id.toString(),
                fare: journey.actualFare
            }
        });
        
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey completed successfully'
        });
    } catch (error) {
        console.error('Error in completeJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete journey'
        });
    }
};

export const cancelJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { reason, cancelledBy } = req.body;
        const userId = req.user._id;
        const journey = await journeyService.cancelJourney(journeyId, userId, reason, cancelledBy);
        
        // Publish Kafka event: Journey Cancelled
        await kafkaService.publishJourneyCancelled(journey);
        
        // Notify the other party
        if (cancelledBy === 'RIDER' && journey.driver) {
            await kafkaService.publishDriverNotification(journey.driver._id, {
                title: 'Journey Cancelled',
                message: `Rider cancelled the journey. Reason: ${reason}`,
                type: 'WARNING',
                data: { journeyId: journey._id.toString() }
            });
        } else if (cancelledBy === 'DRIVER' && journey.rider) {
            await kafkaService.publishRiderNotification(journey.rider._id, {
                title: 'Journey Cancelled',
                message: `Driver cancelled the journey. Reason: ${reason}`,
                type: 'WARNING',
                data: { journeyId: journey._id.toString() }
            });
        }
        
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey cancelled successfully'
        });
    } catch (error) {
        console.error('Error in cancelJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel journey'
        });
    }
};

export const getJourneyById = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const userId = req.user._id;
        const journey = await journeyService.getJourneyById(journeyId, userId);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getJourneyById:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve journey'
        });
    }
};

export const getRiderJourneys = async (req, res) => {
    try {
        const riderId = req.user._id;
        const { status } = req.query;
        const journeys = await journeyService.getRiderJourneys(riderId, status || null);
        res.status(200).json({
            success: true,
            data: journeys,
            message: 'Rider journeys retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getRiderJourneys:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve rider journeys'
        });
    }
};

export const getDriverJourneys = async (req, res) => {
    try {
        const driverId = req.user.driver._id;
        const { status } = req.query;
        const journeys = await journeyService.getDriverJourneys(driverId, status || null);
        res.status(200).json({
            success: true,
            data: journeys,
            message: 'Driver journeys retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getDriverJourneys:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve driver journeys'
        });
    }
};

export const generatePaymentQR = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const riderId = req.user._id;
        const paymentQR = await journeyService.generatePaymentQR(journeyId, riderId);
        res.status(200).json({
            success: true,
            data: paymentQR,
            message: 'Payment QR generated successfully'
        });
    } catch (error) {
        console.error('Error in generatePaymentQR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate payment QR'
        });
    }
};


export const confirmPayment = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const riderId = req.user._id;
        const result = await journeyService.confirmPayment(journeyId, riderId);
        res.status(200).json({
            success: true,
            data: result,
            message: result.alreadyPaid ? 'Payment already completed' : 'Payment confirmed successfully'
        });
    } catch (error) {
        console.error('Error in confirmPayment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to confirm payment'
        });
    }
};
