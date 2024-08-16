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
const upload = multer({ storage: multer.memoryStorage() });

router.get('/download', async (req, res) => {
    try {
      console.log("download request");
      // Retrieve all documents from the User collection
      const users = await User.find({});
      // Send the retrieved documents as a JSON response
      res.json(users);
    } catch (error) {
      // Log any errors that occur
      console.error("Error retrieving data from MongoDB:", error);
  
      // Send an error response with status code 500
      res.status(500).json({ error: "Failed to retrieve data from MongoDB" });
    }
});


router.post('/upload', async (req, res) => {
    try {
        // console.log("Received data:", req.body);
        // Clear existing data
        await User.deleteMany({});

        // Insert new data
        const result = await User.insertMany(req.body);
        console.log(result);
        res.json({ message: `${result.length} documents were inserted` });
    } catch (error) {
        console.error("Error uploading to MongoDB:", error);
        res.status(500).json({ error: "Failed to upload data to MongoDB" });
    }
});

router.post('/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    let tempDir, tempFilePath;

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

        // Create temporary file
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'imgbox-'));
        tempFilePath = path.join(tempDir, req.file.originalname);
        await fs.writeFile(tempFilePath, req.file.buffer);

        // Upload to imgbox with options
        console.log('Uploading image to imgbox...');
        const uploadOptions = {
            auth_cookie: null,
            adult_content: false,
            comments_enabled: 0,
            content_type: 0,
            is_family_safe: true,
            thumb_size: '350r',
        };

        const result = await imgbox(tempFilePath, uploadOptions);
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
        const updatedUser = await User.findOne({ name: username });
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
  console.log("password +" +password);
  try {
    // First, find the user and get their password hash
    const post = await Post.findOne({ username: username, task:task, date:date });
    if (!post) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(post);
    
    if(password === post.password){

      // Delete the post
    const pass = await Post.findOneAndDelete({ username, task, date });
    console.log(pass);
    console.log("post password +" +pass.password);
    // Calculate the day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date(date).getDay();
    // Convert to 0-6 where 0 is Monday
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Update user data to uncheck the task
    const result = await User.updateOne(
      { name: username },
      [
        {
          $set: {
            weeks: {
              $map: {
                input: "$weeks",
                as: "week",
                in: {
                  $mergeObjects: [
                    "$$week",
                    {
                      tasks: {
                        $map: {
                          input: "$$week.tasks",
                          as: "task",
                          in: {
                            $cond: [
                              { $and: [
                                { $eq: ["$$task.name", task] },
                                { $lte: ["$$week.startDate", new Date(date)] },
                                { $gt: [{ $add: [{ $dateFromString: { dateString: "$$week.startDate" } }, 7 * 24 * 60 * 60 * 1000] }, new Date(date)] }
                              ]},
                              {
                                $mergeObjects: [
                                  "$$task",
                                  {
                                    days: {
                                      $map: {
                                        input: { $range: [0, 7] },
                                        as: "i",
                                        in: {
                                          $cond: [
                                            { $eq: ["$$i", dayIndex] },
                                            false,
                                            { $arrayElemAt: ["$$task.days", "$$i"] }
                                          ]
                                        }
                                      }
                                    }
                                  }
                                ]
                              },
                              "$$task"
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    );
    res.json({ message: 'Image deleted and task unchecked successfully' });


    }else{
      return res.status(401).json({ error: 'Invalid password' });
    }

    
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image and uncheck task' });
  }
});




export default router;

