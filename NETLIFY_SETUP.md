# Netlify Deployment Setup for Gosei Play

This document outlines the deployment setup for Gosei Play on Netlify, including key files and configuration.

## Key Files

1. **netlify.toml** - Configuration file for Netlify build and deployment
   - Defines build settings
   - Sets up redirects for SPA and API

2. **functions/socket-server/socket-server.js** - Socket.IO server as a serverless function
   - Handles real-time game communication
   - Adapted from the original server.js

3. **src/config.ts** - Environment-specific configuration
   - Manages API URLs based on environment
   - Sets up socket URL for both development and production

4. **public/_redirects** - Netlify redirects for client-side routing
   - Handles SPA routing

## Environment Variables

You may need to set these in the Netlify UI under Site settings > Build & deploy > Environment:

- `REACT_APP_SOCKET_URL` (optional) - Override the socket server URL if needed. **Important:** Set this to your Heroku app URL (e.g., `https://your-app-name.herokuapp.com`) to connect the Netlify frontend to your Heroku backend

## Connecting to Heroku Backend

To connect your Netlify frontend with a Heroku backend:

1. Deploy your server to Heroku:
   ```
   cd server
   # Initialize Git if not already done
   git init
   # Create Heroku app
   heroku create your-app-name
   # Add and commit your changes
   git add .
   git commit -m "Server code for Heroku deployment"
   # Push to Heroku
   git push heroku master
   ```

2. Get your Heroku app URL (e.g., `https://your-app-name.herokuapp.com`)

3. In Netlify dashboard:
   - Go to Site settings > Build & deploy > Environment
   - Add environment variable:
     - Key: `REACT_APP_SOCKET_URL`
     - Value: `https://your-app-name.herokuapp.com` (your Heroku app URL)

4. Deploy your Netlify site:
   - If using Git integration, just push to your main branch
   - If deploying manually:
     ```
     npm run build:netlify
     netlify deploy --prod
     ```

5. Test the connection by:
   - Opening your Netlify app URL
   - Using browser console to verify socket connection to Heroku
   - Creating a game and checking real-time functionality

## Local Development

To run the project locally:

1. Start the server:
   ```
   cd server
   npm install
   npm start
   ```

2. Start the React app:
   ```
   npm start
   ```

## Netlify Deployment Steps

### Option 1: Connect to Git Repository (Recommended)

1. Log in to your [Netlify account](https://app.netlify.com/)
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider (GitHub, GitLab, etc.)
4. Select the Gosei Play repository
5. Configure build settings:
   - Build command: `npm run build:netlify`
   - Publish directory: `build`
6. Click "Deploy site"

### Option 2: Manual Deploy

1. Install Netlify CLI:
   ```
   npm install netlify-cli -g
   ```

2. Build the project:
   ```
   npm run build:netlify
   ```

3. Deploy to Netlify:
   ```
   netlify deploy
   ```

## Socket.IO in Production

The Socket.IO server has been adapted to work as a Netlify function:

1. The socket server runs as a serverless function
2. The client app automatically connects to the correct URL based on environment

## Troubleshooting

- If real-time updates don't work, check the browser console for connection errors
- Make sure the socket.io-client version matches the server version
- Check Netlify function logs for any server-side errors

## Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Socket.IO and Netlify Functions](https://www.netlify.com/blog/2021/07/30/how-to-build-a-real-time-chat-app-with-gatsby-and-netlify/) 