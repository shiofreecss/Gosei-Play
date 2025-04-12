import React from 'react';
import { Link } from 'react-router-dom';
import BoardSizeDemo from '../components/go-board/BoardSizeDemo';

const BoardDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-primary-700">Gosei Play</h1>
          <Link to="/" className="btn btn-primary text-lg py-3 px-6">
            Back to Home
          </Link>
        </div>
        
        <div className="card mb-10 p-6 md:p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Board Size Comparison</h2>
          <div className="max-w-[90vw] md:max-w-[80vw] mx-auto">
            <BoardSizeDemo />
          </div>
        </div>
        
        <div className="card p-6 md:p-8">
          <h2 className="text-3xl font-bold mb-6">Choosing the Right Board Size</h2>
          
          <div>
            <p className="mb-6 text-lg">
              Go (or Baduk in Korean, Weiqi in Chinese) is traditionally played on a 19×19 grid, 
              but smaller boards are also common for quicker games and learning.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
              <div className="border border-neutral-200 rounded-lg p-6 hover:shadow-card transition-shadow">
                <h3 className="text-2xl font-semibold mb-4">For Beginners</h3>
                <p className="mb-4 text-lg">
                  If you're new to Go, we recommend starting with a 9×9 board. This smaller size 
                  allows you to grasp the fundamental rules and basic tactics without being overwhelmed.
                </p>
                <ul className="list-disc pl-6 mb-2 space-y-2 text-lg">
                  <li>Quick games (15-30 minutes)</li>
                  <li>Easy to understand the whole board</li>
                  <li>Learn capturing, connecting, and basic shapes</li>
                </ul>
              </div>
              
              <div className="border border-neutral-200 rounded-lg p-6 hover:shadow-card transition-shadow">
                <h3 className="text-2xl font-semibold mb-4">For Intermediate Players</h3>
                <p className="mb-4 text-lg">
                  Once comfortable with 9×9, try the 13×13 board. This size introduces more strategic 
                  elements while keeping games at a reasonable length.
                </p>
                <ul className="list-disc pl-6 mb-2 space-y-2 text-lg">
                  <li>Medium-length games (30-60 minutes)</li>
                  <li>Room for strategic thinking</li>
                  <li>Practice opening patterns and middle game</li>
                </ul>
              </div>
              
              <div className="border border-neutral-200 rounded-lg p-6 hover:shadow-card transition-shadow">
                <h3 className="text-2xl font-semibold mb-4">For Advanced Players</h3>
                <p className="mb-4 text-lg">
                  The traditional 19×19 board offers the complete Go experience with rich strategic 
                  possibilities and complex gameplay.
                </p>
                <ul className="list-disc pl-6 mb-2 space-y-2 text-lg">
                  <li>Full-length games (1-3 hours)</li>
                  <li>Deep strategic planning</li>
                  <li>Complex territories and battles</li>
                </ul>
              </div>
            </div>
            
            <p className="mb-4 text-lg">
              Regardless of which board size you choose, the fundamental rules remain the same. 
              Many players enjoy all three sizes for different occasions and time constraints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDemoPage; 