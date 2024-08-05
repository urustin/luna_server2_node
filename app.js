import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import cors from 'cors';
import connectDB from './config/database.js';
import dotenv from 'dotenv';
import weeklyCheckerRoutes from './routes/weeklyChecker.js';


dotenv.config();


const app = express();

app.use(
    cors({
      origin: [
        'https://typora-web.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    })
);
app.use(express.json({ extended: true }));


  // MongoDB 연결
connectDB();

// app.use(passport.initialize());
// app.use(passport.session());


app.use('/weeklyChecker', weeklyCheckerRoutes);

app.get('/', async (req, res) => {
  res.send("AAAA");
});
app.get('/luna', async (req, res) => {
  res.send("BBBB");
});





const PORT = process.env.PORT || 5103;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
