const express = require('express');
const app = express();
const helmet = require('helmet');
const fs = require('fs');
const http = require('http');
const server = http.Server(app);
const socketio = require('socket.io');
const io = socketio(server);

app.use(helmet());

io.on('connection', async (socket) => {
  console.log(`User Connected :${socket.id}`);

  // Triggered when a peer hits the join room button.
  socket.on('join', (roomName) => {
    const {rooms} = io.sockets.adapter;
    const room = rooms.get(roomName);

    // room == undefined when no such room exists.
    if (room === undefined) {
      socket.join(roomName);
      socket.emit('created');
    } else if (room.size === 1) {
      // room.size == 1 when one person is inside the room.
      socket.join(roomName);
      socket.emit('joined');
    } else {
      // when there are already two people inside the room.
      socket.emit('full');
    }
    console.log(rooms);
  });

  // Triggered when the person who joined the room is ready to communicate.
  socket.on('ready', (roomName) => {
    socket.broadcast.to(roomName).emit('ready'); // Informs the other peer in the room.
  });

  // Triggered when server gets an icecandidate from a peer in the room.
  socket.on('ice-candidate', (candidate, roomName) => {
    console.log('candidate ===>> ', candidate);
    socket.broadcast.to(roomName).emit('ice-candidate', candidate); // Sends Candidate to the other peer in the room.
  });

  // Triggered when server gets an offer from a peer in the room.
  socket.on('offer', (offer, roomName) => {
    socket.broadcast.to(roomName).emit('offer', offer); // Sends Offer to the other peer in the room.
  });

  // Triggered when server gets an answer from a peer in the room
  socket.on('answer', (answer, roomName) => {
    socket.broadcast.to(roomName).emit('answer', answer); // Sends Answer to the other peer in the room.
  });

  socket.on('leave', (roomName) => {
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit('leave');
  });

  socket.on('disconnect', async () => {
    console.log(
      socket.id +
        ' ' +
        'user-----------disconnected----------'
    );
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

const {PORT = 5000} = process.env;

// list of followers not done yet...
server.listen(PORT, () =>
  console.log('DB AND APPLICATION HAS STARTED SUCCESSFULLY => ', PORT)
);
