# Troubleshooting Guide for Gosei Play

## Game Creation and Redirection Issues

If you're experiencing issues where the app doesn't redirect to the game page after creating a game with a name and options, here's how to fix it:

### 1. Start the App Properly

The most common issue is that the socket server may not be running properly. Use the new `run-all.bat` script that we created:

```
run-all.bat
```

This script will:
- Install all dependencies for both client and server
- Check if the socket server is already running
- Start the socket server if it's not running
- Start the React app

### 2. Check for Socket Connection Issues

We've added a connection status indicator in the bottom right corner of the home page. This will show you if the socket server is connected.

- **Green**: Server is connected
- **Red**: Server is disconnected

If it shows disconnected:
1. Try clicking the "Refresh" button on the indicator
2. Make sure the server is running
3. Check if there are any firewall issues blocking port 3001

### 3. Server Status Check

You can also run the check-server.bat script to check if the server is running properly:

```
check-server.bat
```

This will check if the server is running on port 3001 and start it if needed.

### 4. Technical Changes Made

We've made the following technical improvements to fix the redirect issue:

1. **Enhanced Socket Connection**: Added better error handling and connection options for the socket.io client
2. **Improved Game Creation Logic**: Added fallback navigation when the context-based navigation doesn't work
3. **Backup Game Finding**: Added code to search localStorage for the created game if the socket connection fails
4. **Better Error Handling**: Now showing specific error messages when game creation fails
5. **Connection Status Indicator**: Added a visual indicator to show if the socket server is connected

### 5. Common Issues and Solutions

- **"Could not navigate to the game"**: This usually means the socket connection is failing. Check if the server is running.
- **Browser Console Errors**: Press F12 in your browser and check the Console tab for any errors.
- **Game Created but No Redirect**: The app now includes a fallback that will try to find your game in localStorage after 3 seconds.

### 6. Still Having Issues?

If you're still experiencing problems after trying the above solutions:

1. Close all command prompt windows
2. Delete the node_modules folder in both the main directory and the server directory
3. Run the run-all.bat script again
4. Try using a different browser
5. Check if your antivirus is blocking the socket connection

## Socket Server Manual Start

If you need to start the socket server manually:

```
cd server
npm install
node server.js
```

Then, in a separate command prompt:

```
npm start
``` 