# Gosei Play Socket.IO Server

This is the Socket.IO server for the Gosei Play app. It handles real-time game communication between players.

## Deployment on Heroku

This server is designed to be deployed on Heroku. Follow these steps to deploy:

1. Create a Heroku account if you don't have one: [https://signup.heroku.com/](https://signup.heroku.com/)

2. Install the Heroku CLI: [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

3. Log in to Heroku CLI:
   ```
   heroku login
   ```

4. Navigate to the server directory:
   ```
   cd heroku-server
   ```

5. Initialize Git repository (if not already done):
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```

6. Create a Heroku app:
   ```
   heroku create gosei-play-server
   ```

7. Push to Heroku:
   ```
   git push heroku main
   ```

8. Scale up the dyno:
   ```
   heroku ps:scale web=1
   ```

9. Open the app:
   ```
   heroku open
   ```

10. Check logs if needed:
    ```
    heroku logs --tail
    ```

## Environment Variables

- `PORT`: Set by Heroku automatically
- `NODE_ENV`: Should be set to "production" on Heroku

## Local Development

To run the server locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on http://localhost:3001 by default.

## API Endpoints

- `GET /`: Health check
- `GET /status`: Server status information 