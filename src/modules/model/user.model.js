import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';


const userSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [ 3, 'First name must be at least 3 characters long' ],
        },
        lastname: {
            type: String,
            minlength: [ 3, 'Last name must be at least 3 characters long' ],
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: [ 5, 'Email must be at least 5 characters long' ],
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [10, 'Phone number must be at least 10 digits'],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['RIDER', 'DRIVER', 'ADMIN'],
        default: 'RIDER',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    socketId: {
        type: String,
    },
}, { timestamps: true })

// index is defined via `unique: true` on the email field; explicit index removed to avoid duplicates

userSchema.pre('save', async function() {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return;
    }
    // Hash password with bcrypt (10 salt rounds)
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            _id: this._id,      
            role: this.role || 'RIDER'
        },
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN
        }
    );
};

export const User = mongoose.model('User', userSchema);