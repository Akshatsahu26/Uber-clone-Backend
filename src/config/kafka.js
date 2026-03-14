import { Kafka } from 'kafkajs';
import { env } from './env.js';


export const KAFKA_TOPICS = {
    // Journey lifecycle events
    JOURNEY_REQUESTED: 'journey_requested',
    JOURNEY_ACCEPTED: 'journey_accepted',
    JOURNEY_ARRIVED: 'journey_arrived',
    JOURNEY_STARTED: 'journey_started',
    JOURNEY_COMPLETED: 'journey_completed',
    JOURNEY_CANCELLED: 'journey_cancelled',

    // Driver events
    DRIVER_LOCATION: 'driver_location',
    DRIVER_STATUS: 'driver_status',

    // Notifications
    RIDER_NOTIFICATION: 'rider_notification',
    DRIVER_NOTIFICATION: 'driver_notification',
};

// KAFKA CLIENT CONFIGURATION

let kafka = null;
let producer = null;
let consumer = null;

// Initialize Kafka client
export const initKafka = async () => {
    if(!env.KAFKA_ENABLED){
        console.log("Kafka is disabled. Set KAFKA_ENABLED=true to enable.");
        return null;
    }
    try {
        // Configure Kafka client
        const kafkaConfig = {
            clientId: env.KAFKA_CLIENT_ID,
            brokers: [env.KAFKA_BROKER],
        };

        // Add SASL authentication for Confluent Cloud
        if(env.KAFKA_USERNAME && env.KAFKA_PASSWORD){
            kafkaConfig.ssl = true;
            kafkaConfig.sasl = {
                mechanism: 'plain',
                username: env.KAFKA_USERNAME,
                password: env.KAFKA_PASSWORD,
            };
        }

        kafka = new Kafka(kafkaConfig);

        console.log("Kafka client initialized successfully");
        return kafka;
    } catch (error) {
        console.error("Error initializing Kafka client:", error);
        return null;
    }
};

// KAFKA PRODUCER

// Producer sends messages to Kafka topics
export const getProducer = async () => {
    if(!env.KAFKA_ENABLED){
        return null;
    }

    if(producer){
        return producer;
    }

    try {
        if(!kafka){
            initKafka();
        }
        producer = kafka.producer({
            allowAutoTopicCreation: true, // Automatically create topics if they don't exist
            transactionTimeout: 30000, // Set transaction timeout to 30 seconds
        });

        await producer.connect();
        console.log("Kafka producer connected successfully");
        return producer;

    } catch (error) {
        console.error("Error connecting Kafka producer:", error);
        return null;
    }
};

// KAFKA CONSUMER

// Consumer reads messages from Kafka topics
export const getConsumer = async (groupId) => {
    if(!env.KAFKA_ENABLED){
        return null;
    }

    try {
    if(!kafka){
        initKafka();
    }

    const newConsumer = kafka.consumer({ 
        groupId : groupId || 'uber-clone-consumer-group',
        sessionTimeout: 30000, // Set session timeout to 30 seconds
        heartbeatInterval: 10000, // Set heartbeat interval to 10 seconds
    });

    await newConsumer.connect();
    console.log("Kafka consumer connected successfully");
    return newConsumer;
    } catch (error) {
        console.error("Error connecting Kafka consumer:", error);
        return null;
    }
};


// PUBLISH MESSAGE TO KAFKA

export const publishMessage = async (topic, message, key = null) => {
    if(!env.KAFKA_ENABLED){
        console.log("Kafka is disabled. Message not published.");
        return{success: true, disabled: true};
    }

    try {
        const prod = await getProducer();

        if(!prod){
            throw new Error("Kafka producer is not available");
        }

        const kafkaMessage = {
            topic,
            messages: [
                {
                    key: key ? String(key) : null, // Optional key for partitioning
                    value: JSON.stringify(message), // Convert message to string
                    timestamp: Date.now().toString(), // Add timestamp for message ordering
                }
            ],
        };

        const result = await prod.send(kafkaMessage);
        console.log(`✓ Published to ${topic}:`, message);
        
        return { success: true, result };
    } catch (error) {
        console.error(`Failed to publish to ${topic}:`, error.message);
        return { success: false, error: error.message };
    }
};

// SUBSCRIBE TO KAFKA TOPIC

export const subscribeToTopic = async (topics, handler, groupId = 'uber-clone-consumer') => {
    if (!env.KAFKA_ENABLED) {
        console.log(`[Kafka Disabled] Would subscribe to topics:`, topics);
        return null;
    }

    try {
        const cons = await getConsumer(groupId);
        if (!cons) {
            throw new Error('Consumer not available');
        }

        // Subscribe to topics
        await cons.subscribe({
            topics: Array.isArray(topics) ? topics : [topics],
            fromBeginning: false,
        });

        // Run consumer
        await cons.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const value = JSON.parse(message.value.toString());
                    console.log(`✓ Received from ${topic}:`, value);
                    
                    // Call the handler function
                    await handler({
                        topic,
                        partition,
                        key: message.key?.toString(),
                        value,
                        timestamp: message.timestamp,
                    });
                } catch (error) {
                    console.error(`Error processing message from ${topic}:`, error.message);
                }
            },
        });

        console.log(`✓ Subscribed to topics:`, topics);
        return cons;
    } catch (error) {
        console.error('Failed to subscribe to topics:', error.message);
        return null;
    }
};

// DISCONNECT KAFKA

// Gracefully disconnect producer and consumer

export const disconnectKafka = async () => {
    try {
        if (producer) {
            await producer.disconnect();
            console.log('✓ Kafka producer disconnected');
        }
        if (consumer) {
            await consumer.disconnect();
            console.log('✓ Kafka consumer disconnected');
        }
    } catch (error) {
        console.error('Error disconnecting Kafka:', error.message);
    }
};

// CREATE TOPICS (FOR DEVELOPMENT)

export const createTopics = async () => {
    if (!env.KAFKA_ENABLED) {
        return;
    }

    try {
        if (!kafka) {
            initKafka();
        }

        const admin = kafka.admin();
        await admin.connect();

        const topics = Object.values(KAFKA_TOPICS).map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 3, // For Confluent Cloud
        }));

        await admin.createTopics({
            topics,
            waitForLeaders: true,
        });

        console.log('✓ Kafka topics created');
        await admin.disconnect();
    } catch (error) {
        // Topics might already exist, which is fine
        console.log('Kafka topics status:', error.message);
    }
};

export default {
    initKafka,
    getProducer,
    getConsumer,
    publishMessage,
    subscribeToTopic,
    disconnectKafka,
    createTopics,
    KAFKA_TOPICS,
};
