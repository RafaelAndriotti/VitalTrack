import { z } from "zod";
import { bodyObject } from "./common.js";

const REGISTER_REQUIRED = "Email, password, and name are required";
const LOGIN_REQUIRED = "Email and password are required";

const EMAIL_MAX = 254;
const PASSWORD_MAX = 200;
const NAME_MAX = 100;

const isEmail = (value: string) => z.email().safeParse(value).success;

/** Shared email shape (type/size); register adds the format check on top. */
const emailField = (required: string) =>
  z.string({ error: required }).min(1, required).max(EMAIL_MAX, emailTooLong);

const emailTooLong = `Email must be at most ${EMAIL_MAX} characters`;
const passwordTooLong = `Password must be at most ${PASSWORD_MAX} characters`;

// No password-strength policy here on purpose (separate auth task).
export const registerBody = bodyObject({
  email: emailField(REGISTER_REQUIRED).refine(isEmail, "Invalid email format"),
  password: z
    .string({ error: REGISTER_REQUIRED })
    .min(1, REGISTER_REQUIRED)
    .max(PASSWORD_MAX, passwordTooLong),
  name: z
    .string({ error: REGISTER_REQUIRED })
    .min(1, REGISTER_REQUIRED)
    .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
});

// Login only checks type/size, not email format: accounts created before
// format validation existed must still be able to log in.
export const loginBody = bodyObject({
  email: emailField(LOGIN_REQUIRED),
  password: z
    .string({ error: LOGIN_REQUIRED })
    .min(1, LOGIN_REQUIRED)
    .max(PASSWORD_MAX, passwordTooLong),
});

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
