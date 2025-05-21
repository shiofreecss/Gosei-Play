import Pusher from 'pusher-js';

// Initialize Pusher
const pusherClient = new Pusher(process.env.REACT_APP_PUSHER_KEY || '', {
  cluster: process.env.REACT_APP_PUSHER_CLUSTER || '',
  forceTLS: true,
});

export default pusherClient; 