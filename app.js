import express from "express";
import cors from "cors";
import { authRouter } from "./src/modules/auth/auth.routes.js";
import profileRoutes from "./src/modules/profile/profile.routes.js";
import journeyRoutes from "./src/modules/journey/journey.routes.js";
import driverRoutes from "./src/modules/driver/driver.routes.js";
//
const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/journey', journeyRoutes);

app.get("/", (req, res)=>{
    res.send("Hello World");
})

export default app;