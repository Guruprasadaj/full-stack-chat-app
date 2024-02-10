// client.js
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('WebSocket connection opened');
};

ws.onmessage = (event) => {
  try {
    const { type, data } = JSON.parse(event.data);

    switch (type) {
      case 'updateRooms':
        updateRooms(data);
        break;
      case 'roomJoined':
        roomJoined(data);
        break;
      case 'newMessage':
        newMessage(data);
        break;
      // Handle other message types
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket connection closed:', event);
};
