import bcrypt from "bcryptjs";
import { userModel } from "../models/user.model.js";
import { generateToken } from "../libs/token.js";
import { renderAuth } from "../views/user.view.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { requireFound } from "../utils/requireFound.js";

interface RegisterBody {
  email?: string;
  password?: string;
  name?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

// POST /api/auth/register
export const register = asyncHandler(
  async (req, res) => {
    const { email, password, name } = req.body as RegisterBody;

    if (!email || !password || !name) {
      throw new HttpError(400, "Email, password, and name are required");
    }

    const normalizedEmail = String(email).toLowerCase();

    // Check if user already exists
    if (userModel.emailExists(normalizedEmail)) {
      throw new HttpError(409, "Email is already registered");
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const id = userModel.create({ email: normalizedEmail, passwordHash, name });

    const user = requireFound(userModel.findPublicById(id));
    const token = generateToken(id);

    res.status(201).json(renderAuth(token, user));
  },
  "Registration error",
  "Failed to register user"
);

// POST /api/auth/login
export const login = asyncHandler(
  async (req, res) => {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required");
    }

    // Find user by email
    const user = userModel.findWithHashByEmail(String(email).toLowerCase());

    // Same generic message for unknown email and wrong password.
    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = generateToken(user.id);

    // renderAuth strips password_hash from the response
    res.json(renderAuth(token, user));
  },
  "Login error",
  "Failed to log in"
);
