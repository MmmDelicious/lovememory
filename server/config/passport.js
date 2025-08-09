const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    scope: ['profile', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        return done(null, user);
      }

      user = await User.findOne({ where: { email: profile.emails[0].value } });

      if (user) {
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      const newUser = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        first_name: profile.name.givenName || 'New',
        gender: 'other',
        age: 18,
        city: 'Unknown',
        password_hash: null, // Google users don't need password
      });
      
      return done(null, newUser);
    } catch (error) {
      return done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});