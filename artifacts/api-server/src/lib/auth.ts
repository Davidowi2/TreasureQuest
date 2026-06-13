import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { usersTable, type User } from "@workspace/db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "7d";

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, decoded.userId),
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Remove password hash before attaching to request
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
