import crypto from 'crypto';
import { env } from '../../config/env.js';

// ENCRYPTION ALGORITHM CONFIGURATION
const ALGORITHM = 'aes-256-cbc' // Advanced Encryption Standard with 256-bit key
const ENCRYPTION_KEY = env.ENCRYPTION_KEY || "your-32-character-secret-key!!!!"; // 32 chars
const IV_LENGTH = 16; // (IV - Initialization Vector) length (16 bytes for AES)

// ENCRYPT FUNCTION
export const encrypt = (text) => {
    // Step 1: Generate random 16-byte IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Step 2: Create cipher object with our algorithm, key, and IV
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.slice(0,32)),
        iv
        );

    // Step 3: Encrypt the text
    let encrypted = cipher.update(text, "utf8", 'hex')
    encrypted += cipher.final('hex');

    // Step 4: Return encrypted data with IV (separated by colon)
    return `${encrypted}:${iv.toString('hex')}`;
}

// DECRYPT FUNCTION
export const decrypt = (encryptedText) => {
    // Step 1: Split the encrypted string to extract data and IV
    const parts = encryptedText.split(':');
    const encrypted = parts[0];
    const iv = Buffer.from(parts[1], 'hex');

    // Step 2: Create decipher object with same algorithm, key, and IV
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.slice(0,32)),
        iv
    );

    // Step 3: Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Step 4: Return original plain text
    return decrypted;
};

// MASK AADHAR FUNCTION
export const maskAadhar = (aaddharNumber) => {
    // Step 1: Validate input
    if(!aaddharNumber || aaddharNumber.length !== 12){
    return 'XXXX XXXX XXXX'; //invalid
    }

    // Step 2: Get last 4 digits
    const lastFour = aaddharNumber.slice(-4);

    // Step 3: Create masked format with spaces
    return `XXXX XXXX ${lastFour}`;
}