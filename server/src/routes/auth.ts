import { Router, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = Router();

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase();

    // Check if user already exists
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(normalizedEmail);

    if (existing) {
      res.status(409).json({ error: "Email is already registered" });
      return;
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const id = randomUUID();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES (?, ?, ?, ?)`
    ).run(id, normalizedEmail, passwordHash, name);

    // Never SELECT * on users — return explicit non-sensitive columns only.
    const user = db
      .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
      .get(id);

    const token = generateToken(id);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Registration error:", (err as Error).message);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = db
      .prepare(
        "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?"
      )
      .get(String(email).toLowerCase()) as
      | {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          created_at: string;
        }
      | undefined;

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id);

    // Strip password_hash from response
    const { password_hash: _password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", (err as Error).message);
    res.status(500).json({ error: "Failed to log in" });
  }
});

export default router;
