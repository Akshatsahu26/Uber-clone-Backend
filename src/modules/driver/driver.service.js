import { Driver } from "../model/driver.model.js";
import { User } from "../model/user.model.js";


// DRIVER SERVICE - Business Logic Layer
class DriverService{

    // CREATE DRIVER PROFILE
    async createProfile(userId, profileData){

        // STEP 1: Check if profile already exists
        const count = await Driver.countDocuments({userId})

        if(count > 0){
            throw new Error("Driver profile already exists")
        }

        // STEP 2: Structure data according to model schema
        // Normalize incoming payload: accept either flat fields or nested objects
    const personal = profileData.personalInfo || {};
    const documents = profileData.documents || profileData.document || {};
    const vehicle = profileData.vehicleInfo || profileData.vehicalInfo || {};

        const driverData = {
            userId,
            personalInfo: {
                languagePrefrence: personal.languagePrefrence || profileData.languagePrefrence,
                city: profileData.city || personal.city || null,
                aadharNumber: personal.aadharNumber || profileData.aadharNumber || null,
                profilePicture: personal.profilePicture || profileData.profilePicture || null,
            },

            documents: {
                licenseNumber: documents.licenseNumber || profileData.licenseNumber || null,
                licenseExpiry: documents.licenseExpiry || documents.licenseExpire || profileData.licenseExpiry || null,
                rcNumber: documents.rcNumber || profileData.rcNumber || null,
                rcExpiry: documents.rcExpiry || documents.rcExpire || profileData.rcExpiry || null,
            },

            vehicleInfo: {
                vehicleType: vehicle.vehicleType || vehicle.vehicletype || profileData.vehicleType || profileData.vehicletype || null,
                vehicleNumber: vehicle.vehicleNumber || profileData.vehicleNumber || null,
                vehicleModel: vehicle.vehicleModel || profileData.vehicleModel || null,
                vehicleColor: vehicle.vehicleColor || profileData.vehicleColor || null,
            },
        };

        // STEP 3: Create profile in database
        const driver = new Driver(driverData);
        await driver.save();
        await driver.populate('userId', 'name email phone role')

        // STEP 3b: Ensure the associated user is marked as DRIVER
        if (driver.userId?.role !== 'DRIVER') {
            await User.findByIdAndUpdate(userId, { role: 'DRIVER' });
            driver.userId.role = 'DRIVER';
        }

        // STEP 4: Return formatted response
        return this.FormatDriverResponse(driver);
    }

    // GET DRIVER PROFILE
    async getProfile(userId) {

        // STEP 1: Find driver by userId
        const driver = await Driver.findOne({userId})
            .populate("userId", "name email phone role");

        if(!driver){
            throw new Error("Driver profile not found. Please create your profile first");
        }
        
        return this.FormatDriverResponse(driver);
    }

    // UPDATE DRIVER PROFILE
    // Purpose: Update driver profile (optional fields)

    async updateProfile(userId , updateData){
        // STEP 1: Check if profile exists

        const existingDriver = await Driver.findOne({userId})
            .populate("userId", "name email phone role")

        if(!existingDriver){
            throw new Error("Driver profile not found. Please create your profile frist")
        }

        // STEP 2: Structure update data

        const updates = {};

        // Personal info updates
        if (updateData.languagePreference || updateData.languagePrefrence) {
            updates['personalInfo.languagePrefrence'] = updateData.languagePreference || updateData.languagePrefrence;
        }
        if (updateData.city) {
            updates['personalInfo.city'] = updateData.city;
        }
        if (updateData.profilePicture) {
            updates['personalInfo.profilePicture'] = updateData.profilePicture;
        }

        // Document updates
        if (updateData.licenseExpiry || updateData.licenseExpire) {
            updates['documents.licenseExpiry'] = updateData.licenseExpiry || updateData.licenseExpire;
        }
        if (updateData.rcExpiry || updateData.rcExpire) {
            updates['documents.rcExpiry'] = updateData.rcExpiry || updateData.rcExpire;
        }

        // Vehicle info updates
        if (updateData.vehicleNumber) {
            updates['vehicleInfo.vehicleNumber'] = updateData.vehicleNumber;
        }
        if (updateData.vehicleModel) {
            updates['vehicleInfo.vehicleModel'] = updateData.vehicleModel;
        }
        if (updateData.vehicleColor) {
            updates['vehicleInfo.vehicleColor'] = updateData.vehicleColor;
        }

        // STEP 3: Update profile in database

        const updateDriver = await Driver.findOneAndUpdate(
            {userId},
            { $set: updates },
            {
                new: true,             // Return updated document
                runValidators: true,   // Run schema validations
            }
        ).populate("userId", "name email phone role")

         // STEP 4: Return formatted response

         return this.FormatDriverResponse(updateDriver);
    }


    // UPDATE DRIVER STATUS (ONLINE/OFFLINE)
    // Purpose: Toggle driver availability

    async updateStatus(userId, isOnline){
        // STEP 1: Find driver profile

        const driver = await Driver.findOne({userId})
            .populate("userId", "name email phone role");

            if(!driver){
                throw new Error("Driver profile not found")
            }
        
        // STEP 2: Check if driver can go online

        if(isOnline && !driver.canGoOnline()){
            // Driver cannot go online → check why
            // Reason 1: Profile not complete enough
            // Reason 2: Not verified by admin

            if(driver.status.profileCompletionPercentage < 70){
                throw new Error("Profile must be atleast 70% completed to go online")
            }

            // if(!driver.status.isVerified){
            //     throw new Error("Your profile is prnding verification. Please wait for admin approval.")
            // }
        }

        // STEP 3: Update status in database
        const updateDriver = await Driver.findOneAndUpdate(
            {userId},
            { $set: {"status.isOnline": isOnline} },
            {
                new: true,             // Return updated document
                runValidators: true,   // Run schema validations
            }
        ).populate("userId", "name email phone role")

         // STEP 4: Return formatted response
         return this.FormatDriverResponse(updateDriver);
    }

    // GET PROFILE COMPLETION DETAILS

    async getProfileCompletion(userId){
        // STEP 1: Find driver profile

        const driver = await Driver.findOne({userId})
            .populate("userId", "name email phone role");

            if(!driver){
                throw new Error("Driver profile not found")
            }
        
        // STEP 2: Return completion details

        return {
            completionPercentage: driver.status.profileCompletionPercentage, 
            missingFields: driver.getMissingFields ? driver.getMissingFields() : driver.getMissingField(),  
            canGoOnline: driver.canGoOnline(),         
            isVerified: driver.status.isVerified       
        };
    }

    // FORMAT DRIVER RESPONSE

    FormatDriverResponse(driver){
        return{
            // Driver ID
            _id: driver._id,

            //user basic info
            user:{
                _id: driver.userId._id,
                name: driver.userId.name,
                email: driver.userId.email,
                phone: driver.userId.phone,
            },

            //personal information
            personalInfo: {
                languagePreference: driver.personalInfo?.languagePrefrence,
                city: driver.personalInfo?.city,
                profilePicture: driver.personalInfo?.profilePicture,
                aadharNumber: driver.getMaskedAadhar()  // MASKED: XXXX XXXX 9012
            },

            // Documents
            documents: {
                licenseNumber: driver.documents?.licenseNumber,
                licenseExpiry: driver.documents?.licenseExpiry,
                rcNumber: driver.documents?.rcNumber,
                rcExpiry: driver.documents?.rcExpiry
            },

            // Vehicle information
            vehicleInfo: {
                vehicleType: driver.vehicleInfo?.vehicleType,
                vehicleNumber: driver.vehicleInfo?.vehicleNumber,
                vehicleModel: driver.vehicleInfo?.vehicleModel,
                vehicleColor: driver.vehicleInfo?.vehicleColor
            },

            // Status
            status: {
                isOnline: driver.status.isOnline,
                isVerified: driver.status.isVerified,
                profileCompletionPercentage: driver.status.profileCompletionPercentage
            },

            // Statistics
            stats: {
                rating: driver.stats.rating,
                totalRides: driver.stats.totalRides
            },

            // Timestamps
            createdAt: driver.createdAt,
            updatedAt: driver.updatedAt
        };
    }
    
}

// EXPORT SINGLE INSTANCE
export const driverService = new DriverService();