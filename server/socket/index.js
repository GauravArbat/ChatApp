const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const UserModel = require('../models/UserModel');
const { ConversationModel, MessageModel } = require('../models/ConversationModel');
const getConversation = require('../helpers/getConversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
});

const onlineUser = new Set();

io.on('connection', async (socket) => {
    console.log("User connected:", socket.id);

    try {
        const token = socket.handshake.auth.token;
        const user = await getUserDetailsFromToken(token);

        if (!user) {
            socket.disconnect();
            return;
        }

        socket.join(user._id.toString());
        onlineUser.add(user._id.toString());

        io.emit('onlineUser', Array.from(onlineUser));

        socket.on('message-page', async (userId) => {
            try {
                console.log('UserId:', userId);
                const userDetails = await UserModel.findById(userId).select("-password");

                const payload = {
                    _id: userDetails._id,
                    name: userDetails.name,
                    email: userDetails.email,
                    profile_pic: userDetails.profile_pic,
                    online: onlineUser.has(userId),
                };
                socket.emit('message-user', payload);

                const getConversationMessage = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: userId },
                        { sender: userId, receiver: user._id },
                    ]
                }).populate('messages').sort({ updatedAt: -1 });

                socket.emit('message', getConversationMessage?.messages || []);
            } catch (error) {
                console.error('Error on message-page event:', error);
            }
        });

        // Add other event handlers...

        socket.on('disconnect', () => {
            onlineUser.delete(user._id.toString());
            console.log('User disconnected:', socket.id);
        });

    } catch (error) {
        console.error('Connection error:', error);
        socket.disconnect();
    }
});

module.exports = {
    app,
    server,
};


