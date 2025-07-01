// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const GitHubStrategy = require('passport-github2').Strategy;
// const User = require('../models/User');
// const axios = require('axios');

// // ========== Google ==========
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails[0].value;
//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         name: profile.displayName,
//         email,
//         password: '',
//         isVerified: true,
//         providers: ['google'],
//       });
//     } else {
//       if (!user.providers?.includes('google')) {
//         user.providers.push('google');
//         await user.save();
//       }
//     }

//     return done(null, user);
//   } catch (err) {
//     return done(err, null);
//   }
// }));

// // ========== Facebook ==========
// passport.use(new FacebookStrategy({
//   clientID: process.env.FB_CLIENT_ID,
//   clientSecret: process.env.FB_CLIENT_SECRET,
//   callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
//   profileFields: ['id', 'emails', 'name', 'displayName']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     const email = profile.emails?.[0]?.value;
//     if (!email) return done(new Error("No email from Facebook profile"));

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         name: profile.displayName,
//         email,
//         password: '',
//         isVerified: true,
//         providers: ['facebook'],
//       });
//     } else {
//       if (!user.providers?.includes('facebook')) {
//         user.providers.push('facebook');
//         await user.save();
//       }
//     }

//     return done(null, user);
//   } catch (err) {
//     return done(err, null);
//   }
// }));

// // ========== GitHub ==========
// passport.use(new GitHubStrategy({
//   clientID: process.env.GITHUB_CLIENT_ID,
//   clientSecret: process.env.GITHUB_CLIENT_SECRET,
//   callbackURL: `${process.env.API_URL}/api/auth/github/callback`,
//   scope: ['user:email']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     console.log('🐙 GitHub profile:', profile);
//     let email = profile.emails?.[0]?.value;

//     if (!email) {
//       const { data } = await axios.get('https://api.github.com/user/emails', {
//         headers: { Authorization: `token ${accessToken}` }
//       });
//       console.log('📧 GitHub email data:', data);

//       const primaryEmail = data.find(e => e.primary && e.verified);
//       if (primaryEmail) {
//         email = primaryEmail.email;
//       }
//     }

//     if (!email) {
//       console.error('❌ No email could be resolved from GitHub');
//       return done(new Error("No email from GitHub profile"));
//     }

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         name: profile.displayName || profile.username,
//         email,
//         password: '',
//         isVerified: true,
//         providers: ['github'],
//       });
//       console.log('✅ New GitHub user created:', user.email);
//     } else {
//       if (!user.providers?.includes('github')) {
//         user.providers.push('github');
//         await user.save();
//         console.log('🔁 GitHub provider added to existing user:', user.email);
//       }
//     }

//     return done(null, user);
//   } catch (err) {
//     console.error('❌ GitHub Strategy Error:', err);
//     return done(err, null);
//   }
// }));
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const axios = require('axios');

// ========== Google ==========
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email,
        password: '',
        isVerified: true,
        providers: ['google'],
      });
    } else {
      if (!user.providers?.includes('google')) {
        user.providers.push('google');
        await user.save();
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// ========== Facebook ==========
passport.use(new FacebookStrategy({
  clientID: process.env.FB_CLIENT_ID,
  clientSecret: process.env.FB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/facebook/callback`,
  profileFields: ['id', 'emails', 'name', 'displayName']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error("No email from Facebook profile"));

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email,
        password: '',
        isVerified: true,
        providers: ['facebook'],
      });
    } else {
      if (!user.providers?.includes('facebook')) {
        user.providers.push('facebook');
        await user.save();
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// ========== GitHub ==========
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/api/auth/github/callback`,
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('🐙 GitHub profile:', profile);
    let email = profile.emails?.[0]?.value;

    if (!email) {
      const { data } = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `token ${accessToken}` }
      });
      console.log('📧 GitHub email data:', data);

      const primaryEmail = data.find(e => e.primary && e.verified);
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }

    if (!email) {
      console.error('❌ No email could be resolved from GitHub');
      return done(new Error("No email from GitHub profile"));
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: profile.displayName || profile.username,
        email,
        password: '',
        isVerified: true,
        providers: ['github'],
      });
      console.log('✅ New GitHub user created:', user.email);
    } else {
      if (!user.providers?.includes('github')) {
        user.providers.push('github');
        await user.save();
        console.log('🔁 GitHub provider added to existing user:', user.email);
      }
    }

    return done(null, user);
  } catch (err) {
    console.error('❌ GitHub Strategy Error:', err);
    return done(err, null);
  }
}));
