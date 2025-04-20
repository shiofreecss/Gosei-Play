# Gosei Play Deployment Guide

This document outlines how to deploy Gosei Play using Heroku for the Socket.IO server and Netlify for the frontend.

## Architecture Overview

- **Frontend**: React app deployed on Netlify
- **Backend**: Socket.IO server deployed on Heroku

## 1. Deploying the Socket.IO Server to Heroku

### Prerequisites

- [Heroku account](https://signup.heroku.com/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

### Deployment Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Navigate to the server directory**
   ```bash
   cd heroku-server
   ```

3. **Initialize Git (if needed)**
   ```bash
   git init
   git add .
   git commit -m "Initial server setup"
   ```

4. **Create a Heroku app**
   ```bash
   heroku create gosei-play-server
   ```

5. **Push to Heroku**
   ```bash
   git push heroku main
   ```

6. **Ensure at least one instance is running**
   ```bash
   heroku ps:scale web=1
   ```

7. **Check that the server is running**
   ```bash
   heroku open
   ```

8. **Get your Heroku app URL**
   This should be something like `https://gosei-play-server.herokuapp.com`

## 2. Deploying the Frontend to Netlify

### Prerequisites

- [Netlify account](https://app.netlify.com/signup)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (optional)

### Deployment Steps

1. **Build the frontend app**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify manually**
   
   a. Go to [Netlify](https://app.netlify.com/)
   
   b. Drag and drop the `build` folder to deploy
   
   OR
   
   c. Use Netlify CLI:
   ```bash
   netlify deploy --prod
   ```

3. **Set environment variables in Netlify**
   
   In the Netlify dashboard:
   - Go to Site settings → Build & deploy → Environment
   - Add the following variable:
     - Key: `REACT_APP_SOCKET_URL`
     - Value: `https://gosei-play-server.herokuapp.com` (your Heroku app URL)

4. **Trigger a new build**
   ```bash
   netlify deploy --trigger --prod
   ```

## 3. Local Development Setup

### Starting the Socket.IO Server Locally

```bash
cd heroku-server
npm install
npm start
```

### Starting the Frontend Locally

```bash
npm start
```

The local frontend will connect to your local Socket.IO server running on port 3001.

## 4. Testing

1. **Open your Netlify app** (e.g., `https://gosei-play.netlify.app`)
2. **Create a game**
3. **Share the game link with another player**
4. **Verify that both players can see the game and make moves**
5. **Check that the server logs show connection and game activity**:
   ```bash
   heroku logs --tail
   ```

## 5. Troubleshooting

### Connection Issues

- Check the browser console for connection errors
- Verify that CORS is correctly configured on the Heroku server
- Make sure the Socket.IO client version matches the server version

### Game Sync Problems

- Check that both players have proper WebSocket connections
- Verify that game state is being transmitted correctly
- Check server logs for any errors in game state management

### Heroku-specific Issues

- Remember that Heroku dynos go to sleep after 30 minutes of inactivity on free tier
- Consider upgrading to a hobby dyno ($7/month) to avoid sleep issues

## 6. Maintenance

- **Update server dependencies**:
  ```bash
  cd heroku-server
  npm update
  git add .
  git commit -m "Update dependencies"
  git push heroku main
  ```

- **Update frontend**:
  After making changes:
  ```bash
  npm run build
  netlify deploy --prod
  ``` 