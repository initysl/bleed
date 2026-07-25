import { z } from 'zod';

export const emailSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const passwordsMatch = (data: { password: string; confirm: string }) =>
  data.password === data.confirm;

// Shared by both the "forgot password" reset flow and the logged-in
// "change password" flow — same rule either way.
export const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine(passwordsMatch, {
    message: "Passwords don't match",
    path: ['confirm'],
  });
