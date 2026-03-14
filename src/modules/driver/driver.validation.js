import { z } from "zod";

// ZOD VALIDATION SCHEMAS

export const createDriverProfileSchema = z.object({
    // Validate request body expecting nested objects to match the model shape
    body: z.object({
        personalInfo: z.object({
            languagePrefrence: z.enum(
                ['HINDI', 'ENGLISH', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI', 'GUJARATI'],
                {
                    required_error: 'Language prefrence is required',
                    invalid_type_error: 'Invalid language prefrence',
                }
            ),
            aadharNumber: z
                .string({ required_error: 'Aadhar Number is required' })
                .regex(/^[0-9]{12}$/, 'Aadhar number must be exactly 12 digit')
                .trim(),
        }),

        // CITY at top-level inside body
        city: z.enum(
            ['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE', 'AHMEDABAD'],
            {
                required_error: 'City is required',
                invalid_type_error: 'Invalid city',
            }
        ),

        // DOCUMENTS nested object
        documents: z.object({
            licenseNumber: z
                .string({ required_error: 'License Number is required' })
                .min(8, 'License number must be at least 8 characters')
                .max(20, 'License number cannot exceed 20 characters')
                .trim(),

            licenseExpiry: z
                .string()
                .optional()
                .refine((date) => {
                    if (!date) return true;
                    return new Date(date) > new Date();
                }, 'License expiry date must be in the future'),

            rcNumber: z
                .string({ required_error: 'RC Number is required' })
                .min(8, 'RC number must be at least 8 characters')
                .max(15, 'RC number cannot exceed 15 characters')
                .trim(),

            rcExpiry: z
                .string()
                .optional()
                .refine((date) => {
                    if (!date) return true;
                    return new Date(date) > new Date();
                }, 'RC expiry date must be in the future'),
        }).optional(),

        // VEHICLE INFO nested object (optional)
        vehicleInfo: z
            .object({
                vehicleType: z
                    .enum(['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'])
                    .optional(),

                vehicleNumber: z
                    .string()
                    .optional()
                    .refine((val) => {
                        if (!val) return true;
                        return /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(val);
                    }, 'Vehicle number must be in format: XX00XX0000 (e.g. MH12AB1234)'),

                vehicleModel: z.string().max(30, 'Vehicle model cannot exceed 30 characters').optional(),
                vehicleColor: z.string().max(20, 'Vehicle color cannot exceed 20 characters').optional(),
            })
            .optional(),

        profilePicture: z.string().url('Profile picture must be a valid url').optional(),
    }),
});

// UPDATE DRIVER PROFILE VALIDATION

export const updateDriverProfileSchema = z.object ({
    //Validate request body
    body: z.object({
        // All fields optional; accept nested shapes to match model
        personalInfo: z
            .object({
                languagePrefrence: z
                    .enum([
                        'HINDI',
                        'ENGLISH',
                        'MARATHI',
                        'TAMIL',
                        'TELUGU',
                        'KANNADA',
                        'BENGALI',
                        'GUJARATI',
                    ])
                    .optional(),
                aadharNumber: z
                    .string()
                    .regex(/^[0-9]{12}$/, 'Aadhar number must be exactly 12 digit')
                    .optional(),
            })
            .optional(),

        city: z
            .enum(['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE', 'AHMEDABAD'])
            .optional(),

        documents: z
            .object({
                licenseExpiry: z
                    .string()
                    .optional()
                    .refine((date) => {
                        if (!date) return true;
                        return new Date(date) > new Date();
                    }, 'License expiry date must be in the future'),
                rcExpiry: z
                    .string()
                    .optional()
                    .refine((date) => {
                        if (!date) return true;
                        return new Date(date) > new Date();
                    }, 'RC expiry date must be in the future'),
            })
            .optional(),

        vehicleInfo: z
            .object({
                vehicleNumber: z
                    .string()
                    .optional()
                    .refine((val) => {
                        if (!val) return true;
                        return /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/.test(val);
                    },
                    'Vehicle number must be in format: XX00XX0000 (e.g. MH12AB1234)'),
                vehicleModel: z.string().max(30, 'Vehicle model cannot exceed 30 characters').optional(),
                vehicleColor: z.string().max(20, 'Vehicle color cannot exceed 20 characters').optional(),
            })
            .optional(),

        profilePicture: z.string().url('Profile picture must be a valid url').optional(),
    })
});

// UPDATE STATUS VALIDATION

export const updateStatusSchema = z.object ({
    // Validate request body
    body: z.object({
        //is online
        isOnline:z.boolean({
            required_error: "Status must be required",
            invalid_type_error: "Status must be true or false",
        })
    })
});