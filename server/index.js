import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './db/connect.js';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Explicitly allow all for network testing
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json()); // allows parsing of JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io integration
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins a chat room (the room ID is the session ID)
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // User sends a message
  socket.on('send_message', async (data) => {
    const { session, sender, text } = data;

    try {
      // Save message to database
      const newMessage = await Message.create({ session, sender, text });
      
      // Broadcast to everyone else in the room
      socket.to(session).emit('receive_message', newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // User updates collaborative notes
  socket.on('update_note', (data) => {
    const { session, text } = data;
    // Broadcast the updated note to the other person in the room instantly
    socket.to(session).emit('receive_note', text);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Mentor Connect API is running' });
});

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    httpServer.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
