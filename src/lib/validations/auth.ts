import { z } from "zod";

const COMMON_WEAK_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password123",
  "qwerty123",
  "admin123",
  "welcome1",
  "00000000",
  "11111111",
  "a1234567",
  "abcd1234",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const strongPasswordSchema = z
  .string({ error: "يرجى إدخال كلمة المرور" })
  .min(8, { error: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل" })
  .max(100, { error: "كلمة المرور طويلة جداً" })
  .refine((val) => /[a-zA-Z\u0600-\u06FF]/.test(val), {
    message: "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل",
  })
  .refine((val) => /\d/.test(val), {
    message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل",
  })
  .refine((val) => !COMMON_WEAK_PASSWORDS.has(val.toLowerCase()), {
    message: "كلمة المرور ضعيفة وشائعة، يرجى اختيار كلمة مرور أقوى",
  })
  .refine((val) => !/(.)\1{5,}/.test(val), {
    message: "كلمة المرور تحتوي على أحرف متكررة بشكل يسهل تخمينه",
  });

export const loginSchema = z.object({
  email: z
    .string({ error: "يرجى إدخال البريد الإلكتروني" })
    .trim()
    .toLowerCase()
    .email({ error: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z
    .string({ error: "يرجى إدخال كلمة المرور" })
    .min(1, { error: "يرجى إدخال كلمة المرور" })
    .max(100, { error: "كلمة المرور طويلة جداً" }),
});

export const registerSchema = z
  .object({
    name: z
      .string({ error: "يرجى إدخال الاسم الكامل" })
      .trim()
      .min(2, { error: "الاسم الكامل يجب أن يكون حرفين على الأقل" })
      .max(100, { error: "الاسم طويل جداً" }),
    companyName: z
      .string({ error: "يرجى إدخال اسم الشركة" })
      .trim()
      .min(2, { error: "اسم الشركة يجب أن يكون حرفين على الأقل" })
      .max(100, { error: "اسم الشركة طويل جداً" }),
    email: z
      .string({ error: "يرجى إدخال البريد الإلكتروني" })
      .trim()
      .toLowerCase()
      .max(254, { error: "البريد الإلكتروني طويل جداً" })
      .email({ error: "يرجى إدخال بريد إلكتروني صحيح" }),
    password: strongPasswordSchema,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined ||
      data.password === data.confirmPassword,
    {
      message: "كلمتا المرور غير متطابقتين",
      path: ["confirmPassword"],
    }
  )
  .refine((data) => data.password.toLowerCase() !== data.email, {
    message: "لا يمكن استخدام البريد الإلكتروني نفسه ككلمة مرور",
    path: ["password"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "يرجى إدخال كلمة المرور الحالية" })
      .min(1, { error: "يرجى إدخال كلمة المرور الحالية" })
      .max(100, { error: "كلمة المرور طويلة جداً" }),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string({ error: "يرجى تأكيد كلمة المرور الجديدة" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمة المرور الجديدة وتأكيدها غير متطابقتين",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "كلمة المرور الجديدة يجب أن تختلف عن الحالية",
    path: ["newPassword"],
  });

export const setInitialPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string({ error: "يرجى تأكيد كلمة المرور الجديدة" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SetInitialPasswordInput = z.infer<typeof setInitialPasswordSchema>;
