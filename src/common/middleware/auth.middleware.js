import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { User }from "../../modules/model/user.model.js";
import { Driver } from "../../modules/model/driver.model.js";


export const authenticate = async (req, res, next) => {
    
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        })
    }

    const token = authHeader.split(" ")[1];

    try {
        const decode = jwt.verify(token, env.JWT_SECRET);

        const user = await User.findById(decode._id);

        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invaild token. User not found",
            })
        }

        if(!user.isActive){
            return res.status(403).json({
                success: false,
                message: "Account is deactivated",
            })
        }

        req.user = user;
        return next();
        
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        })
    };

}

export const authorizeRole = (...allRequiredRoles) => {
    // normalize required roles to uppercase once
    const required = allRequiredRoles.map(r => String(r).toUpperCase());

    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        let userRole = (req.user.role || '').toUpperCase();

        // If driver role is required, attach driver profile (and normalize role) first
        if (required.includes('DRIVER')) {
            const driverProfile = await Driver.findOne({ userId: req.user._id });
            if (!driverProfile) {
                return res.status(403).json({
                    success: false,
                    message: 'Driver profile not found. Please complete driver setup first.'
                });
            }
            // ensure downstream handlers can access driver details
            req.user.driver = driverProfile;
            userRole = 'DRIVER';
            req.user.role = 'DRIVER';
        }

        if (!required.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Only ${required.join(', ')} can access this resource`
            });
        }

        next();
    };
}
