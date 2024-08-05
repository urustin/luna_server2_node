// routes/weeklyChecker.js
import express from 'express';
const router = express.Router();
import User from '../models/User.js';

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



export default router;

