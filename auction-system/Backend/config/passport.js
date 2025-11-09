import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { supabase } from "./supabase.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔧 Passport instance ID:", passport);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH STRATEGY
// ═══════════════════════════════════════════════════════════════════════════
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const full_name = profile.displayName;
          const avatar_url = profile.photos[0]?.value;

          // Kiểm tra user đã tồn tại chưa
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          let user = existingUsers.users.find((u) => u.email === email);

          if (!user) {
            // Tạo user mới với Supabase Auth
            const { data, error } = await supabase.auth.admin.createUser({
              email,
              email_confirm: true, // OAuth tự động verify email
              user_metadata: {
                full_name,
                avatar_url,
                provider: "google",
                google_id: profile.id,
              },
            });

            if (error) {
              return done(error, null);
            }

            user = data.user;

            // Tạo profile trong database
            await supabase.from("profiles").insert({
              id: user.id,
              email,
              full_name,
              avatar_url,
              role: "bidder",
            });

            console.log(`✅ New user created via Google: ${email}`);
          } else {
            console.log(`✅ Existing user logged in via Google: ${email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
}

// ═══════════════════════════════════════════════════════════════════════════
// SERIALIZE/DESERIALIZE USER (cho session)
// ═══════════════════════════════════════════════════════════════════════════
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data: user } = await supabase.auth.admin.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

console.log("✅ GoogleStrategy registered");
console.log("📋 Available strategies:", Object.keys(passport._strategies));

export default passport;
