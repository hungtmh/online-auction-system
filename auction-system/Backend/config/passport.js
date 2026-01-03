import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { supabase } from "./supabase.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
          let user = null;

          //console.log(`🔍 Google OAuth attempt for: ${email}`);

          // ═══════════════════════════════════════════════════════════
          // Bước 1: Kiểm tra user đã tồn tại bằng cách query profiles table
          // (tránh dùng listUsers vì có thể bị lỗi database với nhiều users)
          // ═══════════════════════════════════════════════════════════
          const { data: existingProfile, error: profileError } = await supabase.from("profiles").select("id, email, is_banned").eq("email", email).single();

          if (existingProfile) {
            // Kiểm tra user có bị banned không
            if (existingProfile.is_banned) {
              console.log(`🚫 Banned user tried to login via Google: ${email}`);
              return done(null, false, { message: "banned" });
            }

            // User đã có profile - lấy thông tin từ auth
            console.log(`🔍 Found existing profile for: ${email}, is_banned: ${existingProfile.is_banned}`);
            const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(existingProfile.id);

            if (authUser && authUser.user) {
              console.log(`✅ Existing user logged in via Google: ${email}`);
              return done(null, authUser.user);
            } else {
              console.log(`❌ Failed to get auth user for: ${email}`, getUserError);
            }
          }

          // ═══════════════════════════════════════════════════════════
          // Bước 2: Nếu không có profile, thử tạo user mới
          // ═══════════════════════════════════════════════════════════
          console.log(`🆕 Creating new user via Google: ${email}`);

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
            // ═══════════════════════════════════════════════════════════
            // Nếu lỗi email_exists - user đã tồn tại trong auth nhưng chưa có profile
            // ═══════════════════════════════════════════════════════════
            if (error.code === "email_exists") {
              console.log(`⚠️ Email exists in auth, trying to fetch and create profile: ${email}`);

              // Thử query trực tiếp từ auth.users table
              const { data: authUsers, error: queryError } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();

              if (!authUsers) {
                // Thử list users với pagination để tìm user
                try {
                  const { data: usersList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                  user = usersList.users.find((u) => u.email === email);

                  if (user) {
                    console.log(`✅ Found user in auth, creating profile: ${email}`);
                    // Tạo profile cho user đã tồn tại
                    await supabase.from("profiles").insert({
                      id: user.id,
                      email,
                      full_name: user.user_metadata?.full_name || full_name,
                      avatar_url: user.user_metadata?.avatar_url || avatar_url,
                      role: "bidder",
                    });
                    return done(null, user);
                  }
                } catch (listErr) {
                  console.error("❌ Error listing users:", listErr);
                }
              }
            }

            console.error("❌ Error creating user:", error);
            return done(error, null);
          }

          user = data.user;
          console.log(`✅ New user created: ${email} (ID: ${user.id})`);

          // Tạo profile trong database
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email,
            full_name,
            avatar_url,
            role: "bidder",
          });

          if (insertError) {
            console.error("❌ Error creating profile:", insertError);
          } else {
            console.log(`✅ Profile created for: ${email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error("❌ Google OAuth error:", error);
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
