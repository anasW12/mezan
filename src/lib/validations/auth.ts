import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z
    .string()
    .min(1, "يرجى إدخال كلمة المرور"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  companyName: z
    .string()
    .trim()
    .min(2, "اسم الشركة يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الشركة طويل جداً")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون ٨ أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جداً"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
