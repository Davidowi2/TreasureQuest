import { Router, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";

const router = Router();

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body as any;
    const passwordHash = await hashPassword(password);

    const existing = await db.query.usersTable.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email),
    });
    if (existing) {
      return res.status(400).json({ error: "User exists" });
    }

    const [user] = await (db as any).insert(usersTable).values({
      name, email, passwordHash, role,
    } as any).returning();

    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser: any = {
      id: user.id, name: user.name, email: user.email, role: user.role,
    };
    return res.json({ user: safeUser });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as any;
    const user = await db.query.usersTable.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email),
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser: any = {
      id: user.id, name: user.name, email: user.email, role: user.role,
    };
    return res.json({ user: safeUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token");
  return res.json({ message: "Logged out" });
});

// Get current user
router.get("/me", async (_req: Request, res: Response) => {
  return res.json({ user: null }); // placeholder
});

export default router;
