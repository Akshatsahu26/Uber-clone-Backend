import mongoose from "mongoose";
import { encrypt, decrypt, maskAadhar } from "../../common/utils/encryption.js";

const driverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    personalInfo: {
        languagePrefrence: {
            type: String,
            enum: ['HINDI', 'ENGLISH', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI', 'GUJARATI'],
            required: [true, 'Language preference is required']
        },
        city: {
            type: String,
            default: null
        },
            profilePicture: {
                type: String,
                default: null,
            },
            aadharNumber: {
                type: String,
                required: [true, 'Aadhar number is required'],
            },
    },

    documents: {
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
            uppercase: true,
            trim: true
        },

        licenseExpiry: {
            type: Date,
            default: null
        },

        rcNumber: {
            type: String,
            required: [true, 'RC number is required'],
            uppercase: true,
            trim: true
        },

        rcExpiry: {
            type: Date,
            default: null
        },
    },

    vehicleInfo: {

        vehicleType: {
            type: String,
            enum: ['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'],
            default: null
        },

        vehicleNumber: {
            type: String,
            uppercase: true,
            trim: true,
            default: null,
        },

        vehicleModel: {
            type: String,
            uppercase: true,
            trim: true,
            default: null,
        },

        vehicleColor: {
            type: String,
            uppercase: true,
            trim: true,
            default: null,
        }
    },

    status: {

        isOnline: {
            type: Boolean,
            default: false,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        profileCompletionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        }
    },

    //statistics

    stats: {

        rating: {
            type: Number,
            default: 5.0,
            min: 1,
            max: 5
        },

        totalRides: {
            type: Number,
            default: 5.0,
            min: 0
        }
    },

    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        }
    }
},{
    timestamps: true,
})

driverSchema.index({ location: '2dsphere' });

// userId index already created via unique:true on the field; remove duplicate explicit index


// PRE-SAVE HOOK: Encrypt Aadhar Number

driverSchema.pre('save', function() {
    // Only encrypt if aadhar is modified and not already encrypted
    if (this.isModified('personalInfo.aadharNumber') && 
        this.personalInfo.aadharNumber && 
        !this.personalInfo.aadharNumber.includes(':')) {
        this.personalInfo.aadharNumber = encrypt(this.personalInfo.aadharNumber);
    }
});

// PRE-SAVE HOOK: Calculate Profile Completion

driverSchema.pre("save", function(){
    this.status.profileCompletionPercentage = this.calculateProfileCompletion();
});

// METHOD: Calculate Profile Completion Percentage

driverSchema.methods.calculateProfileCompletion = function () {
    const personal = this.personalInfo || {};
    const docs = this.documents || {};
    const vehicle = this.vehicleInfo || {};

    let percentage = 0;

    // Required fields (70% total)
    if(personal.languagePrefrence) percentage += 10;
    if(personal.city) percentage += 10;
    if(personal.aadharNumber) percentage += 15;
    if(docs.licenseNumber) percentage += 15;
    if(docs.rcNumber) percentage += 10;
    if(vehicle.vehicleType) percentage += 10;

    // Optional fields (30% total)
    if(personal.profilePicture) percentage += 10;
    if(docs.licenseExpiry) percentage += 5;
    if(docs.rcExpiry) percentage += 5;
    if(vehicle.vehicleModel) percentage += 5;
    if(vehicle.vehicleColor) percentage += 5;
    
    return Math.min(percentage, 100);
}

// METHOD: Get Masked Aadhar

driverSchema.methods.getMaskedAadhar = function() {
    if(!this.personalInfo || !this.personalInfo.aadharNumber) return null;

    // Decrypt first, then mask
    const decrypted = decrypt(this.personalInfo.aadharNumber);
    return maskAadhar(decrypted);
}

// METHOD: Get Missing Fields

driverSchema.methods.getMissingField = function() {
    const missing = [];
    const personal = this.personalInfo || {};
    const docs = this.documents || {};
    const vehicle = this.vehicleInfo || {};

    if(!personal.profilePicture) {
        missing.push({ field: "profilePicture", weight: 10, label: "profilePicture"})
    }
    if(!docs.licenseExpiry) {
        missing.push({ field: "licenseExpiry", weight: 5, label: "licenseExpiry"})
    }
    if(!docs.rcExpiry) {
        missing.push({ field: "rcExpiry", weight: 5, label: "rcExpiry"})
    }
    if(!vehicle.vehicleModel) {
        missing.push({ field: "vehicleModel", weight: 5, label: "vehicleModel"})
    }
    if(!vehicle.vehicleColor) {
        missing.push({ field: "vehicleColor", weight: 5, label: "vehicleColor"})
    }

    return missing;
}

// Alias for consistent naming
driverSchema.methods.getMissingFields = function() {
    return this.getMissingField();
}

// METHOD: Can Go Online

driverSchema.methods.canGoOnline = function() {
    return this.status.profileCompletionPercentage >= 70;
}

export const Driver = mongoose.model("Driver", driverSchema);
