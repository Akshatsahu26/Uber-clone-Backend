import { authService } from "./auth.service.js";

export const signup = async (req, res) =>{
    try {
        const userData = req.body;

        const result = await authService.signup(userData);
        
        return res.status(201).json({
            success: true,
            message: "User signup successfully",
            data: result,
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "signup failed"
        });
    }
}

export const login = async (req, res) =>{
    try {
        const {email, phone, password} = req.body;
        const identifier = email || phone;

        const result = await authService.login(identifier, password);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result,
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "login failed"
        })
    }
}