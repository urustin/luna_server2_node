// routes/weeklyChecker.js
import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Post from '../models/Post.js';
import multer from 'multer';
import { imgbox } from 'imgbox-js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import cron from 'node-cron';
import { getNextMonday, formatDate } from '../utils/date.js';
import sharp from 'sharp';

const upload = multer({ storage: multer.memoryStorage() });

router.get('/download', async (req, res) => {
    try {
      await res.json(req.user);
    } catch (error) {
      // Log any errors that occur
      console.error("Error retrieving data from MongoDB:", error);
  
      // Send an error response with status code 500
      res.status(500).json({ error: "Failed to retrieve data from MongoDB" });
    }
});

router.get('/download-all', async (req, res) => {
  try {
    console.log("download request");
    const users = await User.find({});
    await res.json(users);
  } catch (error) {
    // Log any errors that occur
    console.error("Error retrieving data from MongoDB:", error);

    // Send an error response with status code 500
    res.status(500).json({ error: "Failed to retrieve data from MongoDB" });
  }
});



router.put('/upload', async (req, res) => {
    try {
      console.log("up");

      const username = req.user.username;
        const user = await User.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        user.weeks = req.body.weeks;
        // console.log(user);
        await user.save();
        res.json({ message: "User data updated successfully" });
        // res.json({ message: `${result.length} documents were inserted` });
    } catch (error) {
        console.error("Error uploading to MongoDB:", error);
        res.status(500).json({ error: "Failed to upload data to MongoDB" });
    }
});

router.post('/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    let tempDir, tempFilePath, resizedFilePath;

    try {
        const { username, task, date, password } = req.body;
        console.log('Received date:', date); // Log the received date
        if (!password) {
          throw new Error("Password is required");
        }
        // Validate date
        let validDate;
        if (date && date.trim() !== '') {
            validDate = new Date(date);
            if (isNaN(validDate.getTime())) {
                throw new Error("Invalid date provided: " + date);
            }
        } else {
            validDate = new Date(); // Use current date if no date provided
        }

        console.log('Parsed date:', validDate); // Log the parsed date

        // Create temporary directory
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imgbox-'));
        tempFilePath = path.join(tempDir, req.file.originalname);
        resizedFilePath = path.join(tempDir, 'resized-' + req.file.originalname);

        // Write original file
        await fs.writeFile(tempFilePath, req.file.buffer);
        
        // Get image metadata
        const metadata = await sharp(tempFilePath).metadata();

        // Resize image to half of its original dimensions
        await sharp(tempFilePath)
            .resize({
                width: Math.round(metadata.width / 3),
                height: Math.round(metadata.height / 3)
            })
            .toFile(resizedFilePath);


        // Upload to imgbox with options
        console.log('Uploading image to imgbox...');
        const uploadOptions = {
            auth_cookie: null,
            adult_content: false,
            comments_enabled: 0,
            content_type: 0,
            is_family_safe: true,
            thumb_size: '150r',
        };

        const result = await imgbox(resizedFilePath, uploadOptions);
        console.log('Imgbox upload result:', result);

        if (!result || !result.ok || !result.data || result.data.length === 0) {
            throw new Error("Failed to upload image to imgbox: " + JSON.stringify(result));
        }

        const imageUrl = result.data[0].original_url;

        // Create new Post
        const newPost = new Post({
            username,
            task,
            date: validDate,
            imageUrl,
            password
        });

        await newPost.save();

        // Update user data in MongoDB (mark task as completed)
        const updatedUser = await User.findOne({ username: username });
        if (!updatedUser) {
            throw new Error("User not found");
        }

        const weekIndex = updatedUser.weeks.findIndex(week => 
            new Date(week.startDate) <= validDate && 
            new Date(week.startDate).getTime() + 7 * 24 * 60 * 60 * 1000 > validDate.getTime()
        );

        if (weekIndex === -1) {
            throw new Error("No matching week found for the given date");
        }

        const taskIndex = updatedUser.weeks[weekIndex].tasks.findIndex(t => t.name === task);
        if (taskIndex === -1) {
            throw new Error("Task not found in the specified week");
        }

        const dayIndex = validDate.getDay() === 0 ? 6 : validDate.getDay() - 1; // Convert to 0-6 range where 0 is Monday
        updatedUser.weeks[weekIndex].tasks[taskIndex].days[dayIndex] = true;

        await updatedUser.save();

        res.json({ message: "Image uploaded and user data updated successfully", imageUrl });
    } catch (error) {
        console.error("Error processing image upload:", error);
        res.status(500).json({ error: "Failed to process image upload: " + error.message });
    } finally {
        // Clean up temporary files
        if (tempFilePath) {
            await fs.unlink(tempFilePath).catch(console.error);
        }
        if (tempDir) {
            await fs.rmdir(tempDir).catch(console.error);
        }
    }
});

router.get('/get-image', async (req, res) => {
    const { username, task, date } = req.query;
  
    try {
      const post = await Post.findOne({ username, task, date });
      if (post) {
        res.json({ imageUrl: post.imageUrl });
      } else {
        res.status(404).json({ message: 'No image found' });
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
});

// routes/weeklyChecker.js

router.post('/delete-image', async (req, res) => {

  const { username, task, date, password } = req.body;
  console.log("password: " + password);

  try {
  //   // Find the post and verify password
    const post = await Post.findOne({ username, task, date });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (password !== post.password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete the post
    
    await Post.findOneAndDelete({ username, task, date });
    console.log("post deleted!");
    // Find the user
    const user = await User.findOne({ username: username });
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the correct week and task
    const validDate = new Date(date);
    const weekIndex = user.weeks.findIndex(week => 
      new Date(week.startDate) <= validDate && 
      new Date(week.startDate).getTime() + 7 * 24 * 60 * 60 * 1000 > validDate.getTime()
    );

    if (weekIndex === -1) {
      throw new Error("No matching week found for the given date");
    }

    const taskIndex = user.weeks[weekIndex].tasks.findIndex(t => t.name === task);
    if (taskIndex === -1) {
      throw new Error("Task not found in the specified week");
    }

    // Calculate the day index (0-6, where 0 is Monday)
    const dayIndex = validDate.getDay() === 0 ? 6 : validDate.getDay() - 1;

    // Uncheck the task
    user.weeks[weekIndex].tasks[taskIndex].days[dayIndex] = false;

    // Save the updated user
    await user.save();

    res.json({ message: 'Image deleted and task unchecked successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image and uncheck task: ' + error.message });
  }
});





  // New Cron Weeks
const addNewWeekToAllUsers = async () => {
  try {
    const users = await User.find({});
    const nextMonday = getNextMonday();

    for (let user of users) {
      if (user.weeks.length > 0) {
        const lastWeek = user.weeks[user.weeks.length - 1];
        const newWeek = {
          startDate: formatDate(nextMonday),
          tasks: lastWeek.tasks.map(task => ({
            ...task,
            days: [false, false, false, false, false, false, false]
          }))
        };

        if(lastWeek.startDate !== formatDate(nextMonday)){
          user.weeks.push(newWeek);
          await user.save();
        }else{
          console.log("failed!");
        }
        
      }
    }
    console.log('New week added to all users successfully');
  } catch (error) {
    console.error('Error adding new week to users:', error);
  }
};


// 새로운 주를 추가하는 라우트
router.post('/add-new-week', async (req, res) => {
  try {
    console.log("add Week Req");
    await addNewWeekToAllUsers();
    res.json({ message: 'New week added to all users successfully' });
  } catch (error) {
    console.error('Error in add-new-week route:', error);
    res.status(500).json({ error: 'Failed to add new week to users' });
  }
});


// Cron job 설정 (매주 일요일 자정에 실행)
cron.schedule('0 0 * * 0', async () => {
  console.log('Running weekly task to add new week');
  await addNewWeekToAllUsers();
}, {
  timezone: "Asia/Seoul" // 서버의 시간대에 맞게 설정
});





export default router;

