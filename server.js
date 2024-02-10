const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    handleMessage(ws, JSON.parse(message));
  });
});

function handleMessage(ws, message) {
  switch (message.type) {
    case 'createRoom':
      createRoom(ws, message.data);
      break;
    case 'joinRoom':
      joinRoom(ws, message.data);
      break;
    case 'sendMessage':
      sendMessage(ws, message.data);
      break;
    case 'upvoteMessage':
      upvoteMessage(message.data);
      break;
    default:
      break;
  }
}

function createRoom(ws, roomData) {
  const roomId = roomData.roomId;
  rooms[roomId] = {
    name: roomData.name,
    start_time: roomData.start_time,
    is_open: roomData.is_open,
    cool_down_time: roomData.cool_down_time,
    messages: [],
  };
  broadcastRooms();
}

function joinRoom(ws, roomData) {
  const roomId = roomData.roomId;
  if (rooms[roomId]) {
    ws.roomId = roomId;
    ws.isAdmin = roomData.isAdmin;
    ws.username = roomData.username;
    send(ws, 'roomJoined', rooms[roomId]);
  }
}

function sendMessage(ws, messageData) {
  const roomId = ws.roomId;
  if (rooms[roomId]) {
    const message = {
      username: ws.username,
      content: messageData.content,
      upvotes: 0,
    };
    rooms[roomId].messages.push(message);
    broadcast(roomId, 'newMessage', message);
  }
}

function upvoteMessage(messageData) {
  const roomId = messageData.roomId;
  const messageId = messageData.messageId;
  if (rooms[roomId]) {
    const message = rooms[roomId].messages.find((msg) => msg.id === messageId);
    if (message) {
      message.upvotes += 1;
      if (message.upvotes >= 3) {
        broadcast(roomId, 'moveToSeparateSection', message);
      }
      if (message.upvotes >= 10) {
        broadcast(roomId, 'alertAdmin', message);
      }
    }
  }
}

function send(ws, type, data) {
  ws.send(JSON.stringify({ type, data }));
}

function broadcast(roomId, type, data) {
  wss.clients.forEach((client) => {
    if (client.roomId === roomId) {
      send(client, type, data);
    }
  });
}

function broadcastRooms() {
  wss.clients.forEach((client) => {
    if (client.isAdmin) {
      send(client, 'updateRooms', Object.keys(rooms));
    }
  });
}

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
