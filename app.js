import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import configurePassport from './config/passport.js';
import connectDB from './config/database.js';
import MongoStore from 'connect-mongo';

import weeklyCheckerRoutes from './routes/weeklyChecker.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

app.use(
    cors({
      origin: [
        'https://luna-client.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      methods: ['GET', 'POST','PUT'],
      credentials: true,
    })
);
app.use(express.json({ extended: true }));


  // MongoDB 연결
connectDB();


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions' // This is optional, default is 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict' // Helps prevent CSRF attacks
  }
}));
const passport = configurePassport();
app.use(passport.initialize());
app.use(passport.session());



app.use('/weeklyChecker', weeklyCheckerRoutes);
app.use('/auth', authRoutes);
app.get('/', async (req, res) => {
  res.send("AAAAAA");
});
app.get('/luna', async (req, res) => {
  res.send("BBBB");
});





const PORT = process.env.PORT || 5103;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
