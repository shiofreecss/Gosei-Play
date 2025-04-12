@echo off
echo Starting Gosei Play...

:: Start the socket server
start cmd /k "cd server && npm install && npm start"

:: Start the React app
start cmd /k "npm start"

echo Gosei Play started!
echo Server running on http://localhost:3001
echo Client running on http://localhost:3000 