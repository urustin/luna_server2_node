// /models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    // required: true,
    unique: true,
    sparse: true,
  },
  displayName: {
    type: String,
    // required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    sparse: true,
    unique: true
  },
  password: { 
    type: String,
    // required: true,
  },
  createdAt: { type: Date, default: Date.now },
  avatar: String,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  googleAccessToken: String,
  googleRefreshToken: String

});



userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log("Comparing passwords:");
  console.log("Candidate password:", candidatePassword); // 평문 비밀번호 출력
  console.log("Stored hashed password:", this.password);
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log("Password match result:", isMatch);
  return isMatch;
};

export default mongoose.model('User', userSchema, 'users');