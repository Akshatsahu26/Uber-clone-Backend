import { KAFKA_TOPICS, publishMessage } from "../config/kafka.js";


class KafkaService {
    // JOURNEY REQUESTED EVENT

    async publishJourneyRequested(journey) {
        const event = {
            eventType: 'JOURNEY_REQUESTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            riderName: journey.rider.name,
            riderPhone: journey.rider.phone,
            pickup: {
                address: journey.pickup.address,
                coordinates: journey.pickup.location.coordinates,
            },
            dropoff: {
                address: journey.dropoff.address,
                coordinates: journey.dropoff.location.coordinates,
            },
            vehicleType: journey.vehicleType,
            estimatedFare: journey.estimatedFare,
            paymentMethod: journey.paymentMethod,
            status: journey.status,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_REQUESTED,
            event,
            journey._id.toString()
        );
    }

    // JOURNEY ACCEPTED EVENT

    async publishJourneyAccepted(journey, driver) {
        const event = {
            eventType: 'JOURNEY_ACCEPTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: driver.userId._id.toString(),
            driverName: driver.userId.name,
            driverPhone: driver.userId.phone,
            vehicleInfo: {
                type: driver.vehicleInfo.vehicleType,
                number: driver.vehicleInfo.vehicleNumber,
                model: driver.vehicleInfo.vehicleModel,
                color: driver.vehicleInfo.vehicleColor,
            },
            driverRating: driver.stats.rating,
            status: journey.status,
            acceptedAt: journey.acceptedAt,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_ACCEPTED,
            event,
            journey._id.toString()
        );
    }

    // JOURNEY STARTED EVENT

    async publishJourneyStarted(journey) {
        const event = {
            eventType: 'JOURNEY_STARTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: journey.driver._id.toString(),
            status: journey.status,
            startedAt: journey.startedAt,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_STARTED,
            event,
            journey._id.toString()
        );
    }

    // JOURNEY COMPLETED EVENT

     async publishJourneyCompleted(journey) {
        const event = {
            eventType: 'JOURNEY_COMPLETED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: journey.driver._id.toString(),
            status: journey.status,
            completedAt: journey.completedAt,
            actualFare: journey.actualFare,
            distance: journey.distance,
            duration: journey.duration,
            paymentMethod: journey.paymentMethod,
            paymentStatus: journey.paymentStatus,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_COMPLETED,
            event,
            journey._id.toString()
        );
    }

    // JOURNEY CANCELLED EVENT

    async publishJourneyCancelled(journey) {
        const event = {
            eventType: 'JOURNEY_CANCELLED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id ? journey.rider._id.toString() : null,
            driverId: journey.driver?._id ? journey.driver._id.toString() : null,
            status: journey.status,
            cancelledAt: journey.cancelledAt,
            cancelledBy: journey.cancelledBy,
            cancellationReason: journey.cancellationReason,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_CANCELLED,
            event,
            journey._id.toString()
        );
    }

    // DRIVER LOCATION UPDATE EVENT

    async publishDriverLocation(driverId, location, journeyId = null) {
        const event = {
            eventType: 'DRIVER_LOCATION_UPDATE',
            timestamp: new Date().toISOString(),
            driverId: driverId.toString(),
            journeyId: journeyId ? journeyId.toString() : null,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || null,
                heading: location.heading || null,
                speed: location.speed || null,
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_LOCATION,
            event,
            driverId.toString()
        );
    }

    // DRIVER STATUS CHANGE EVENT

    async publishDriverStatus(driver, isOnline) {
        const event = {
            eventType: 'DRIVER_STATUS_CHANGE',
            timestamp: new Date().toISOString(),
            driverId: driver.userId._id.toString(),
            isOnline,
            vehicleType: driver.vehicleInfo.vehicleType,
            city: driver.personalInfo.city,
            rating: driver.stats.rating,
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_STATUS,
            event,
            driver.userId._id.toString()
        );
    }

     // RIDER NOTIFICATION EVENT
     // Sends notification to rider

     async publishRiderNotification(riderId, notification) {
        const event = {
            eventType: 'RIDER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            riderId: riderId.toString(),
            notification: {
                title: notification.title,
                message: notification.message,
                type: notification.type, // INFO, WARNING, SUCCESS, ERROR
                data: notification.data || {},
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.RIDER_NOTIFICATION,
            event,
            riderId.toString()
        );
    }

    // DRIVER NOTIFICATION EVENT
    // Sends notification to driver

    async publishDriverNotification(driverId, notification) {
        const event = {
            eventType: 'DRIVER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            driverId: driverId.toString(),
            notification: {
                title: notification.title,
                message: notification.message,
                type: notification.type, // INFO, WARNING, SUCCESS, ERROR
                data: notification.data || {},
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_NOTIFICATION,
            event,
            driverId.toString()
        );
    }
}

export const kafkaService = new KafkaService();



