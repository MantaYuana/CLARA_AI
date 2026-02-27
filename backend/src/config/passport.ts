/**
 * passport.ts
 * Google OAuth 2.0 strategy.
 *
 * On successful auth:
 *  1. Calls upsertUser() to create/update the User node in Neo4j
 *  2. Signs a JWT (24 h expiry) with user payload
 *  3. Passes { token } back to the callback route
 */
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { upsertUser } from "../services/user/userService";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.OAUTH_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_in_production";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/v1/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email =
                    profile.emails?.[0]?.value ?? `${profile.id}@google.com`;
                const name = profile.displayName ?? email;
                const user = await upsertUser(profile.id, email, name);
                const token = jwt.sign(
                    { userId: user.id, email: user.email, name: user.name },
                    JWT_SECRET,
                    { expiresIn: "24h" },
                );
                const authUser: Express.User & { token: string } = {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    token,
                };
                done(null, authUser);
            } catch (err) {
                done(err as Error);
            }
        },
    ),
);

// serialize/deserialize are required by passport even if we do not use sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj as Express.User));

export { passport as configuredPassport, FRONTEND_URL };
