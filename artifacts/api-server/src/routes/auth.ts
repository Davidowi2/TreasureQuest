import { Router, Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { hashPassword, verifyPassword, generateToken, authMiddleware } from "../lib/auth";
import { OAuth2Client } from "google-auth-library";

const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = "both" } = req.body as any;
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
    return res.json({ user: safeUser, token });

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
    return res.json({ user: safeUser, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

// Google OAuth
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken: string };

    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    // Verify ID token with Google
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid ID token" });
    }

    const { email, name, picture } = payload;

    // Check if user exists
    let user = await db.query.usersTable.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email),
    });

    if (user) {
      // Update user if needed (e.g., name changed)
      const shouldUpdate = user.name !== name;
      if (shouldUpdate) {
        // TODO: Add picture column to users schema if needed
        [user] = await (db as any).update(usersTable)
          .set({ name })
          .where((u: any, { eq }: any) => eq(u.email, email))
          .returning();
      }
    } else {
      // Create new user: since passwordHash is required, generate a dummy one
      const dummyPasswordHash = await hashPassword(`google-oauth-${Date.now()}`);
      [user] = await (db as any).insert(usersTable).values({
        name: name || "Anonymous Player",
        email,
        passwordHash: dummyPasswordHash,
        role: "both",
      } as any).returning();
    }

    // Ensure user is defined
    if (!user) {
      return res.status(500).json({ error: "Failed to create or retrieve user" });
    }

    // Generate token and set cookie
    const token = generateToken(user.id);
    res.cookie("auth_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser: any = {
      id: user.id, name: user.name, email: user.email, role: user.role,
    };
    return res.json({ user: safeUser, token });
  } catch (e) {
    console.error("Google OAuth error:", e);
    return res.status(401).json({ error: "Invalid ID token" });
  }
});

// Logout
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("auth_token");
  return res.json({ message: "Logged out" });
});

// Get current user
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: (u, { eq }) => eq(u.id, req.user?.id),
    });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return res.json({ user: safeUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
