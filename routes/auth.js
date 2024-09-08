import express from 'express';
import passport from 'passport';

import User from '../models/User.js';
import { getCurrentMonday, formatDate } from '../utils/date.js';


const router = express.Router();

router.post('/register', async (req, res) => {
    console.log("regist");
  try {
    const { username, password } = req.body;
    console.log(username);
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ message: 'username already registered' });
    }

    const blankWeek = {
      startDate: getCurrentMonday(), // Current date
      tasks: [

      ]
    };


    const newUser = new User({
      username: username,
      password: password,
      weeks: [blankWeek]
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

router.post('/login', (req, res, next) => {
    console.log("login");
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({ message: 'Logged in successfully', user: { username: user.username, } });
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err.message });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { usernmae: req.user.username, week: req.user.weeks } });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});


// New route for auto-login
router.get('/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: { username: req.user.username } });
    } else {
      res.status(401).json({ message: 'No active session' });
    }
});
  

export default router;