import mongoose from 'mongoose';
import {env} from "./env.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL).then(() => {
            console.log("MONGODB connected successfully --> ", mongoose.connection.host);
        });
    } catch (err) {
        console.error("MONGODB connection failed ---> ", err.message);
        console.error("Stack trace:", err.stack);
        process.exit(1);
    }
};