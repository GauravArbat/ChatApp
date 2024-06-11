const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/connectDB');
const router = require('./routes/index');
const cookiesParser = require('cookie-parser');
const { app, server } = require('./socket/index'); // Import app and server from socket/index.js

const PORT = process.env.PORT || 8080;

// Initialize Express app
const app = express();

// Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Parse incoming JSON requests
app.use(express.json());

// Parse cookies from incoming requests
app.use(cookiesParser());

// Define a simple route handler for the root URL
app.get('/', (request, response) => {
    response.json({
        message: "Server running at " + PORT
    });
});

// Define API endpoints
app.use('/api', router);

// Connect to the database
connectDB().then(() => {
    // Start the server
    server.listen(PORT, () => {
        console.log("Server running at " + PORT);
    });
});

