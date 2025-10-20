const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${serverUrl}/api/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = new User({
              firstname: profile.name?.givenName || 'Google',
              lastname: profile.name?.familyName || 'User',
              email: profile.emails?.[0]?.value,
              googleId: profile.id,
              role: 'mentee'
            });
            await user.save();
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('Google OAuth disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;


