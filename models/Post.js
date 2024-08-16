// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  username: { type: String, required: true },
  task: { type: String, required: true },
  date: { type: Date, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  password : {type: String, required:true}
});

export default mongoose.model('Post', postSchema);