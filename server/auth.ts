import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    // Send welcome email (don't block registration if email fails)
    try {
      await sendWelcomeEmail(user.email, user.firstName, user.language);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Continue with registration even if email fails
    }

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password reset endpoints
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      // Even if user doesn't exist, we return the same response
      if (user) {
        const { token } = await storage.createPasswordResetToken(user.id);
        await sendPasswordResetEmail(user.email, user.firstName, token, user.language);
      }
      
      res.json({ message: "If an account with that email exists, we've sent a password reset link." });
    } catch (error) {
      console.error('Password reset error:', error);
      res.json({ message: "If an account with that email exists, we've sent a password reset link." });
    }
  });

  app.get("/api/verify-reset-token", async (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Token is required" });
    }

    try {
      const tokenRecord = await storage.getPasswordResetToken(token);
      
      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      res.json({ message: "Token is valid" });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(400).json({ message: "Invalid or expired token" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    try {
      const tokenRecord = await storage.getPasswordResetToken(token);
      
      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Update user password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(tokenRecord.userId, { password: hashedPassword });
      
      // Invalidate the token
      await storage.invalidatePasswordResetToken(tokenRecord.id);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(400).json({ message: "Invalid or expired token" });
    }
  });

  // Set password endpoint for newly invited users
  app.post("/api/set-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    try {
      // Update user password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      
      res.json({ message: "Password set successfully" });
    } catch (error) {
      console.error('Set password error:', error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });
}
