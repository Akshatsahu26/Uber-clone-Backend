class KafkaConsumerService {
    constructor() {
        this.consumers = [];
    }

    // START ALL CONSUMERS
    // Initializes and starts all Kafka consumers

    async startConsumers() {
        if (!env.KAFKA_ENABLED) {
            console.log('Kafka consumers disabled');
            return;
        }

        try {
            console.log('Starting Kafka consumers...');

            // Start journey events consumer
            await this.startJourneyEventsConsumer();

            // Start driver events consumer
            await this.startDriverEventsConsumer();

            // Start notification consumer
            await this.startNotificationConsumer();

            console.log('✓ All Kafka consumers started successfully');
        } catch (error) {
            console.error('Failed to start Kafka consumers:', error.message);
        }
    }

    // JOURNEY EVENTS CONSUMER
    // Listens to all journey-related events

    async startJourneyEventsConsumer() {
        const topics = [
            KAFKA_TOPICS.JOURNEY_REQUESTED,
            KAFKA_TOPICS.JOURNEY_ACCEPTED,
            KAFKA_TOPICS.JOURNEY_STARTED,
            KAFKA_TOPICS.JOURNEY_COMPLETED,
            KAFKA_TOPICS.JOURNEY_CANCELLED,
        ];

        const consumer = await subscribeToTopic(
            topics,
            this.handleJourneyEvent.bind(this),
            'journey-events-consumer-group'
        );

        if (consumer) {
            this.consumers.push(consumer);
        }
    }

    // DRIVER EVENTS CONSUMER
    // Listens to driver-related events

    async startDriverEventsConsumer() {
        const topics = [
            KAFKA_TOPICS.DRIVER_LOCATION,
            KAFKA_TOPICS.DRIVER_STATUS,
        ];

        const consumer = await subscribeToTopic(
            topics,
            this.handleDriverEvent.bind(this),
            'driver-events-consumer-group'
        );

        if (consumer) {
            this.consumers.push(consumer);
        }
    }

    // NOTIFICATION CONSUMER
    // Listens to notification events
    async startNotificationConsumer() {
        const topics = [
            KAFKA_TOPICS.RIDER_NOTIFICATION,
            KAFKA_TOPICS.DRIVER_NOTIFICATION,
        ];

        const consumer = await subscribeToTopic(
            topics,
            this.handleNotificationEvent.bind(this),
            'notification-consumer-group'
        );

        if (consumer) {
            this.consumers.push(consumer);
        }
    }

    // JOURNEY EVENT HANDLER
    // Processes journey events
    async handleJourneyEvent(message) {
        const { topic, value } = message;

        console.log(`\n Journey Event Received:`);
        console.log(`   Topic: ${topic}`);
        console.log(`   Event Type: ${value.eventType}`);
        console.log(`   Journey ID: ${value.journeyId}`);

        switch (topic) {
            case KAFKA_TOPICS.JOURNEY_REQUESTED:
                await this.onJourneyRequested(value);
                break;

            case KAFKA_TOPICS.JOURNEY_ACCEPTED:
                await this.onJourneyAccepted(value);
                break;

            case KAFKA_TOPICS.JOURNEY_STARTED:
                await this.onJourneyStarted(value);
                break;

            case KAFKA_TOPICS.JOURNEY_COMPLETED:
                await this.onJourneyCompleted(value);
                break;

            case KAFKA_TOPICS.JOURNEY_CANCELLED:
                await this.onJourneyCancelled(value);
                break;

            default:
                console.log('Unknown journey event topic:', topic);
        }
    }

    // DRIVER EVENT HANDLER
    // Processes driver events
    async handleDriverEvent(message) {
        const { topic, value } = message;

        console.log(`\n🚗 Driver Event Received:`);
        console.log(`   Topic: ${topic}`);
        console.log(`   Event Type: ${value.eventType}`);
        console.log(`   Driver ID: ${value.driverId}`);

        switch (topic) {
            case KAFKA_TOPICS.DRIVER_LOCATION:
                await this.onDriverLocationUpdate(value);
                break;

            case KAFKA_TOPICS.DRIVER_STATUS:
                await this.onDriverStatusChange(value);
                break;

            default:
                console.log('Unknown driver event topic:', topic);
        }
    }

    // NOTIFICATION EVENT HANDLER
    // Processes notification events
    async handleNotificationEvent(message) {
        const { topic, value } = message;

        console.log(`\n🔔 Notification Event Received:`);
        console.log(`   Topic: ${topic}`);
        console.log(`   Title: ${value.notification.title}`);
        console.log(`   Message: ${value.notification.message}`);

        switch (topic) {
            case KAFKA_TOPICS.RIDER_NOTIFICATION:
                await this.onRiderNotification(value);
                break;

            case KAFKA_TOPICS.DRIVER_NOTIFICATION:
                await this.onDriverNotification(value);
                break;

            default:
                console.log('Unknown notification topic:', topic);
        }
    }

    // EVENT PROCESSORS

    async onJourneyRequested(event) {
        console.log('   → Processing: Journey requested by rider');
        console.log(`   → Pickup: ${event.pickup.address}`);
        console.log(`   → Dropoff: ${event.dropoff.address}`);
        console.log(`   → Vehicle Type: ${event.vehicleType}`);
        console.log(`   → Estimated Fare: ₹${event.estimatedFare}`);

        // 1. Find nearby available drivers
        // 2. Send push notifications to drivers
        // 3. Update real-time dashboard
        // 4. Store in cache for quick access
    }

    async onJourneyAccepted(event) {
        console.log('   → Processing: Journey accepted by driver');
        console.log(`   → Driver: ${event.driverName}`);
        console.log(`   → Vehicle: ${event.vehicleInfo.model} (${event.vehicleInfo.color})`);
        console.log(`   → Rating: ${event.driverRating}⭐`);
        
        // 1. Send push notification to rider
        // 2. Update journey status in real-time
        // 3. Start tracking driver location
        // 4. Notify other drivers that journey is taken
    }

    async onJourneyStarted(event) {
        console.log('   → Processing: Journey started');
        console.log(`   → Started At: ${event.startedAt}`);
        
        // 1. Send push notification to rider
        // 2. Start real-time tracking
        // 3. Calculate ETA
        // 4. Update dashboard
    }

    async onJourneyCompleted(event) {
        console.log('   → Processing: Journey completed');
        console.log(`   → Fare: ₹${event.actualFare}`);
        console.log(`   → Distance: ${event.distance} km`);
        console.log(`   → Duration: ${event.duration} minutes`);
        
        // 1. Send push notification to rider
        // 2. Trigger payment processing
        // 3. Request rating from rider
        // 4. Update driver stats
        // 5. Generate invoice
    }

    async onJourneyCancelled(event) {
        console.log('   → Processing: Journey cancelled');
        console.log(`   → Cancelled By: ${event.cancelledBy}`);
        console.log(`   → Reason: ${event.cancellationReason}`);
        
        // 1. Send push notification to both parties
        // 2. Calculate cancellation fee (if applicable)
        // 3. Update driver availability
        // 4. Log cancellation for analytics
    }

    async onDriverLocationUpdate(event) {
        console.log('   → Processing: Driver location update');
        console.log(`   → Location: [${event.location.latitude}, ${event.location.longitude}]`);
       
        // 1. Update driver location in cache/database
        // 2. Send real-time update to rider (if in active journey)
        // 3. Calculate updated ETA
        // 4. Update map view
    }

     async onDriverStatusChange(event) {
        console.log('   → Processing: Driver status change');
        console.log(`   → Status: ${event.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        console.log(`   → City: ${event.city}`);
        console.log(`   → Vehicle Type: ${event.vehicleType}`);
   
        // 1. Update available drivers list
        // 2. Update matching algorithm
        // 3. Send notification if needed
        // 4. Update analytics
    }

    async onRiderNotification(event) {
        console.log(`   → Sending to Rider: ${event.riderId}`);
        
        // 1. Send push notification via FCM/APNS
        // 2. Send SMS if critical
        // 3. Send email if needed
        // 4. Update notification center
    }

    async onDriverNotification(event) {
        console.log(`   → Sending to Driver: ${event.driverId}`);
       
        // 1. Send push notification via FCM/APNS
        // 2. Send SMS if critical
        // 3. Update notification center
        // 4. Play sound alert in driver app
    }

    // STOP ALL CONSUMERS

    // Gracefully stops all consumers
    async stopConsumers() {
        console.log('Stopping Kafka consumers...');
        
        for (const consumer of this.consumers) {
            try {
                await consumer.disconnect();
            } catch (error) {
                console.error('Error stopping consumer:', error.message);
            }
        }
        
        this.consumers = [];
        console.log('✓ All Kafka consumers stopped');
    }
}

export const KafkaConsumerService = new KafkaConsumerService();