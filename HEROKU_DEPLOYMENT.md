# Gosei Play Deployment Guide

This document outlines how to deploy Gosei Play using Heroku for the Socket.IO server and Netlify for the frontend.

## Architecture Overview

- **Frontend**: React app deployed on Netlify
- **Backend**: Socket.IO server deployed on Heroku with custom domain (svr-01.gosei.xyz)

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

3. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial server setup"
   ```

4. **Create a Heroku app**
   ```bash
   heroku create gosei-play-server
   ```
   Note: If this name is taken, Heroku will assign an alternative name.

5. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

6. **Push to Heroku**

   Check your current branch name first:
   ```bash
   git branch
   ```

   Then push to Heroku using the appropriate command:

   If your branch is named "main":
   ```bash
   git push heroku main
   ```

   If your branch is named "master":
   ```bash
   git push heroku master:main
   ```

   If you're on a different branch:
   ```bash
   git push heroku your-branch-name:main
   ```

7. **Ensure at least one instance is running**
   ```bash
   heroku ps:scale web=1
   ```

8. **Check that the server is running**
   ```bash
   heroku open
   ```
   You should see a JSON response like: `{"status":"ok","timestamp":"..."}`

9. **Set up a custom domain (Optional)**
   
   a. Add the domain to your Heroku app:
   ```bash
   heroku domains:add svr-01.gosei.xyz
   ```
   
   b. Get the DNS target from Heroku:
   ```bash
   heroku domains
   ```
   
   c. Configure your DNS provider to point your domain to the Heroku DNS target.
   
   d. If you need SSL (recommended):
   ```bash
   heroku certs:auto:enable
   ```

10. **Get your server URL**
    This will be either your Heroku URL (e.g., `https://gosei-play-server.herokuapp.com`) 
    or your custom domain (e.g., `https://svr-01.gosei.xyz`)

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
     - Value: `https://svr-01.gosei.xyz` (your custom domain)

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

### Git and Deployment Issues

- **"No such app" error**: Make sure you're in the correct directory with the git repository
- **Branch name issues**: Use `git branch` to check your current branch, then use the correct push command
- **Permission denied**: Make sure you're logged in with `heroku login`
- **Git remote issues**: Add Heroku as a remote with `heroku git:remote -a your-app-name`
- **Deployment fails**: Check logs with `heroku logs --tail`

### Connection Issues

- Check the browser console for connection errors
- Verify that CORS is correctly configured on the Heroku server
- Make sure the Socket.IO client version matches the server version
- If connections work locally but not on Heroku, check network settings with `heroku features:enable http-routing`
- For custom domain issues, verify DNS is properly configured with `dig svr-01.gosei.xyz`

### Game Sync Problems

- Check that both players have proper WebSocket connections
- Verify that game state is being transmitted correctly
- Check server logs for any errors in game state management
- If players can't see each other's moves, verify that room-based broadcasting is working

### Heroku-specific Issues

- Remember that Heroku dynos go to sleep after 30 minutes of inactivity on free tier
- Consider upgrading to a hobby dyno ($7/month) to avoid sleep issues
- If your app crashes, check memory usage with `heroku logs --tail`
- Add error handling to prevent crashes due to unexpected input

### Custom Domain Issues

- Check DNS propagation with `dig svr-01.gosei.xyz` or an online DNS checker
- Verify Heroku's SSL certificate is correctly set up with `heroku certs:auto`
- Make sure your browser is not blocking mixed content if using HTTPS
- Check for SSL/TLS handshake errors in the browser console

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

## 7. Common Heroku Commands

- **View logs**: `heroku logs --tail`
- **Access Bash console**: `heroku run bash`
- **Restart dyno**: `heroku restart`
- **View app info**: `heroku info`
- **Add collaborator**: `heroku access:add email@example.com`
- **Add custom domain**: `heroku domains:add www.yourdomain.com`
- **Check SSL certificates**: `heroku certs:auto`
- **Check domains**: `heroku domains` 