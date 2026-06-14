import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = verifyToken(token);
    const user = await db.query.usersTable.findFirst({
      where: (u: any, { eq }: any) => eq(u.id, decoded.userId),
    });

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // @ts-ignore – remove password hash
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (_error) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
};
