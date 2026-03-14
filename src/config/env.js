import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['PORT', 'AUTHOR_NAME',"MONGODB_URL","JWT_SECRET","JWT_EXPIRES_IN" ];
requiredEnvVars.forEach((envVar)=>{
    if(!process.env[envVar]){
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
})

export const env = {
    PORT: process.env.PORT,
    AUTHOR_NAME: process.env.AUTHOR_NAME,
    MONGODB_URL: process.env.MONGODB_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

    // Kafka Configuration
    KAFKA_ENABLED: process.env.KAFKA_ENABLED === 'true',
    KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
    KAFKA_USERNAME: process.env.KAFKA_USERNAME || '',
    KAFKA_PASSWORD: process.env.KAFKA_PASSWORD || '',
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'uber-clone-backend',
   
};

