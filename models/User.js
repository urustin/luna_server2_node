// models/User.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: String,
  days: [Boolean],
  goal: {
    type: Number,
    default : 0
  } 
});

const weekSchema = new mongoose.Schema({
  startDate: String,
  tasks: [taskSchema]
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique:true,
  },
  password: {
    type: String,
    required: true
  },
  weeks: [weekSchema]
});


export default mongoose.model('User', userSchema);