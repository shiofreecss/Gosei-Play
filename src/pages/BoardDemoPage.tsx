import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoBoard from '../components/go-board/GoBoard';
import { Board, Position, StoneColor } from '../types/go';
import { useBoardTheme } from '../context/BoardThemeContext';
import BoardThemeSelector from '../components/BoardThemeSelector';

const BoardDemoPage: React.FC = () => {
  const { currentTheme } = useBoardTheme();
  
  // Create a demo board with some stones for visualization
  const [board, setBoard] = useState<Board>({
    size: 19,
    stones: [
      { position: { x: 3, y: 3 }, color: 'black' },
      { position: { x: 3, y: 15 }, color: 'black' },
      { position: { x: 15, y: 3 }, color: 'black' },
      { position: { x: 15, y: 15 }, color: 'black' },
      { position: { x: 9, y: 9 }, color: 'white' },
      { position: { x: 10, y: 9 }, color: 'black' },
      { position: { x: 8, y: 9 }, color: 'black' },
      { position: { x: 9, y: 10 }, color: 'black' },
      { position: { x: 9, y: 8 }, color: 'black' },
      { position: { x: 6, y: 3 }, color: 'white' },
      { position: { x: 4, y: 15 }, color: 'white' },
      { position: { x: 3, y: 4 }, color: 'white' },
    ]
  });
  
  // Current turn for hover effect
  const [currentTurn, setCurrentTurn] = useState<StoneColor>('black');
  
  // Last move for highlighting
  const [lastMove, setLastMove] = useState<Position>({ x: 10, y: 9 });
  
  // Handle stone placement for demo
  const handlePlaceStone = (position: Position) => {
    // Add stone to the board
    const newStone = {
      position,
      color: currentTurn
    };
    
    setBoard({
      ...board,
      stones: [...board.stones, newStone]
    });
    
    // Update last move
    setLastMove(position);
    
    // Switch turn
    setCurrentTurn(currentTurn === 'black' ? 'white' : 'black');
  };
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Board Themes Demo</h1>
          <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Back to Home
          </Link>
        </div>
        <p className="text-neutral-600">
          Select a board theme below and try placing stones to see how it looks. Your theme choice will be saved for your games.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">
              Current Theme: {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1).replace('-', ' ')}
            </h2>
            <div className="max-w-2xl mx-auto">
              <GoBoard
                board={board}
                currentTurn={currentTurn}
                onPlaceStone={handlePlaceStone}
                isPlayerTurn={true}
                lastMove={lastMove}
                isScoring={false}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">Theme Selection</h2>
            <BoardThemeSelector />
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">Instructions</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-700">
              <li>Click on the board to place stones</li>
              <li>Select a theme from the options on the right</li>
              <li>Your selection will be saved for all games</li>
              <li>The "Wood 3D" theme has more realistic stones with depth</li>
              <li>The "Universe" theme represents stones as black holes and white holes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDemoPage; 