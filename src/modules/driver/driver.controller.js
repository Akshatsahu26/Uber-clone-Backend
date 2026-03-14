import { driverService } from "./driver.service.js";


export const createProfile = async (req, res, next) => {
    try {
        // STEP 1: Extract data from request
        const userId = req.user._id;

        // req.body contains profile data
        const profileData = req.body;

        // STEP 2: Call service to create profile
        const driver = await driverService.createProfile(userId, profileData);

        res.status(200).json({
            success:true,
            data: driver,
            message: "Driver profile created successfully"
        })
        
    } catch (error) {
        console.error("Error in createProfile", error)

        res.status(500).json({
            success: false,
            message: error.message || "Failed to create driver profile",
        })
    }
};

// GET DRIVER PROFILE

export const getProfile = async (req, res) => {
    try {
        // STEP 1: Extract userId from request
        const userId = req.user._id;

        // STEP 2: Call service to get profile
        const driver = await driverService.getProfile(userId);

        res.status(201).json({
            success: true,
            data: driver,
            message: "Driver profile created successfully'"
        })
    } catch (error) {
        console.error('Error in getProfile:', error);
        
        if (error.message.includes("Driver profile not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get driver profile'
    })
    }
} 

// UPDATE DRIVER PROFILE

export const updateProfile = async (req, res) => {
    try {
        // STEP 1: Extract data from request
        const userId = req.user._id;
        const updateData = req.body;

        // STEP 2: Call service to update profile
        const driver = await driverService.updateProfile(userId, updateData);

        // STEP 3: Send success response
        res.status(201).json({
            success:true,
            data: driver,
            message: "Profile updated successfully"
        })
    } catch (error) {
        console.error("Error in updating Profile", error);

        res.status(500).json({
            success:false,
            message: error.message || "Failed to update driver profile"
        })
    }
}

// UPDATE DRIVER STATUS (ONLINE/OFFLINE)
export const updateStatus = async (req,res) => {
    try {
        // STEP 1: Extract data from request
        const userId = req.user._id;
        const {isOnline} = req.body;

        // STEP 2: Call service to update status
        const driver = await driverService.updateStatus(userId, isOnline);

        // STEP 3: Send success response
        res.status(201).json({
            success:true,
            data: driver,
            message: "Profile updated successfully"
        })
    } catch (error) {
        console.error("Error in updating Status", error);

        res.status(500).json({
            success:false,
            message: error.message || "Failed to update driver status"
        })
    }
}

// GET PROFILE COMPLETION DETAILS

export const getProfileCompletion = async (req,res) => {
    try {
        // STEP 1: Extract userId from request
        const userId = req.user._id;

        // STEP 2: Call service to get completion details
        const completion = await driverService.getProfileCompletion(userId);

        // STEP 3: Send success response
        res.status(201).json({
            success:true,
            data: completion,
            message: "Profile completion details"
        })
    } catch (error) {
        console.error("Error in getProfileCompletion", error);

        res.status(500).json({
            success:false,
            message: error.message || "Failed to getProfileCompletion"
        })
    }
}