import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import weatherRoutes from './routes/weather.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);

app.get('/', (req, res) => {
  res.send('Weather App Backend is running!');
});

// Start Server and Connect Database
const startServer = async () => {
  // Try connecting to MongoDB. The function handles errors internally and falls back to in-memory mode.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
