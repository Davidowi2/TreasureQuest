import { Router } from "express";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { usersTable, insertUserSchema } from "@workspace/db/schema";
import { hashPassword, verifyPassword, generateToken, authMiddleware } from "../lib/auth";
import { z } from "zod";

const router = Router();

// Signup
const signupSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = signupSchema.parse({
      ...req.body,
      passwordHash: req.body.password,
    });

    // Check if user already exists
    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role,
    }).returning();

    const token = generateToken(newUser.id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out" });
});

// Get current user
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
