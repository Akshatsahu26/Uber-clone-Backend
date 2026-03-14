import { z } from "zod";

// SIGNUP VALIDATION SCHEMA
export const signupSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters")
      .trim(),

    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .trim(),

    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
      .trim(),
    
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password cannot exceed 100 characters"),

    role: z
      .enum(["RIDER", "DRIVER", "ADMIN"])
      .optional()
      .default("RIDER"),
  }),
});

// LOGIN VALIDATION SCHEMA

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Invaild email format")
            .trim()
            .optional()
            .or(z.literal("")), //Allow empty string

        phone: z
            .string()
            .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
            .trim()
            .optional()
            .or(z.literal("")), //Allow empty string
        
        password: z
            .string({
                required_error: 'Password is required'
            })
            .min(1, 'Password is required')
    })

    
    //refine(its will check if email or password has actual value (not empty string))
    .refine(
        (data) => {
            const hasemail = data.email && data.email.trim().length > 0;
            const hasPhone = data.phone && data.phone.trim().length > 0;
            return hasemail || hasPhone;
        },
        {
            message: "Either phone or email is required",
            path: ["email"] //Show error on email filed
        }
    )

})
