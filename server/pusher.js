const Pusher = require('pusher');

let pusher = null;

// Only initialize Pusher if all required environment variables are present
if (process.env.PUSHER_APP_ID && 
    process.env.PUSHER_KEY && 
    process.env.PUSHER_SECRET && 
    process.env.PUSHER_CLUSTER) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  });
} else {
  console.warn('Pusher configuration not found. Running without Pusher support.');
}

module.exports = pusher; 