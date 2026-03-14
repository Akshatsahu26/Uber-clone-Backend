import app from "./app.js"
import { env } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js"

const startServer = async ()=>{
    try {
        await connectDB();
        app.listen(env.PORT, () => {
        console.log(`Server is running on port ${env.PORT} by ${env.AUTHOR_NAME}`);
        })
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1)
    }
}
 
startServer();