// models/User.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: String,
  days: [Boolean],
  goal: Number
});

const weekSchema = new mongoose.Schema({
  startDate: String,
  tasks: [taskSchema]
});

const userSchema = new mongoose.Schema({
  name: String,
  color: String,
  weeks: [weekSchema]
});

export default mongoose.model('User', userSchema);