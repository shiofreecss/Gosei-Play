import React, { useEffect, useState, useRef } from 'react';
import { StoneColor } from '../types/go';

interface TimeControlProps {
  timeControl: number; // Main time in minutes
  timePerMove?: number; // Time per move in seconds
  byoYomiPeriods?: number; // Number of byo-yomi periods
  byoYomiTime?: number; // Time per byo-yomi period in seconds
  fischerTime?: number; // Fischer increment in seconds
  currentTurn: StoneColor;
  onTimeout: (color: StoneColor) => void;
  isPlaying: boolean;
}

interface TimeState {
  mainTime: number; // Main time remaining in seconds
  byoYomiPeriodsLeft: number;
  byoYomiTimeLeft: number;
  isByoYomi: boolean;
}

const TimeControl: React.FC<TimeControlProps> = ({
  timeControl,
  timePerMove = 0,
  byoYomiPeriods = 5, // Default 5 periods
  byoYomiTime = 30, // Default 30 seconds per period
  fischerTime = 0,
  currentTurn,
  onTimeout,
  isPlaying
}) => {
  // Initialize time states for both players
  const [blackTime, setBlackTime] = useState<TimeState>({
    mainTime: timeControl * 60,
    byoYomiPeriodsLeft: byoYomiPeriods,
    byoYomiTimeLeft: byoYomiTime,
    isByoYomi: false
  });

  const [whiteTime, setWhiteTime] = useState<TimeState>({
    mainTime: timeControl * 60,
    byoYomiPeriodsLeft: byoYomiPeriods,
    byoYomiTimeLeft: byoYomiTime,
    isByoYomi: false
  });
  
  // Use refs to track the last update time to handle timer drift
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    audioRef.current = new Audio('/sounds/time-warning.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Play time warning sound
  const playTimeWarning = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore playback errors
      });
    }
  };

  useEffect(() => {
    // Clean up previous timer
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    if (isPlaying) {
      // Reset the last update time
      lastUpdateTimeRef.current = Date.now();
      
      timerIdRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastUpdateTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only update if at least 1 second has passed
        if (elapsedSeconds > 0) {
          lastUpdateTimeRef.current = now - (elapsedMs % 1000); // Account for remainder
          
          const currentTimeState = currentTurn === 'black' ? blackTime : whiteTime;
          const setTimeState = currentTurn === 'black' ? setBlackTime : setWhiteTime;

          setTimeState(prev => {
            let newState = { ...prev };

            // Handle main time
            if (prev.mainTime > 0) {
              newState.mainTime = Math.max(0, prev.mainTime - elapsedSeconds);
              
              // Play warning sound at specific thresholds
              if (
                (newState.mainTime <= 60 && prev.mainTime > 60) || // 1 minute
                (newState.mainTime <= 30 && prev.mainTime > 30) || // 30 seconds
                (newState.mainTime <= 10 && prev.mainTime > 10)    // 10 seconds
              ) {
                playTimeWarning();
              }

              // If main time runs out, switch to byo-yomi if available
              if (newState.mainTime === 0 && prev.byoYomiPeriodsLeft > 0) {
                newState.isByoYomi = true;
                newState.byoYomiTimeLeft = byoYomiTime;
                playTimeWarning(); // Signal byo-yomi start
              }
            }
            // Handle byo-yomi time
            else if (prev.isByoYomi && prev.byoYomiPeriodsLeft > 0) {
              newState.byoYomiTimeLeft = Math.max(0, prev.byoYomiTimeLeft - elapsedSeconds);
              
              // Play warning sound in byo-yomi
              if (
                (newState.byoYomiTimeLeft <= 10 && prev.byoYomiTimeLeft > 10) || // 10 seconds
                (newState.byoYomiTimeLeft <= 5 && prev.byoYomiTimeLeft > 5)     // 5 seconds
              ) {
                playTimeWarning();
              }

              // If byo-yomi period runs out
              if (newState.byoYomiTimeLeft === 0) {
                if (prev.byoYomiPeriodsLeft > 1) {
                  newState.byoYomiPeriodsLeft = prev.byoYomiPeriodsLeft - 1;
                  newState.byoYomiTimeLeft = byoYomiTime;
                  playTimeWarning(); // Signal new period
                } else {
                  // No periods left, time's up
                  newState.byoYomiPeriodsLeft = 0;
                  onTimeout(currentTurn);
                }
              }
            }
            // Time's up
            else if (!prev.isByoYomi || prev.byoYomiPeriodsLeft === 0) {
              onTimeout(currentTurn);
            }

            return newState;
          });
        }
      }, 100); // Update more frequently to reduce drift
    }

    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isPlaying, currentTurn, blackTime, whiteTime, byoYomiTime, onTimeout]);

  // Handle Fischer increment on move change
  useEffect(() => {
    if (fischerTime > 0) {
      const prevTurn = currentTurn === 'black' ? 'white' : 'black';
      const setTimeState = prevTurn === 'black' ? setBlackTime : setWhiteTime;

      setTimeState(prev => ({
        ...prev,
        mainTime: prev.mainTime + fischerTime
      }));
    }
  }, [currentTurn, fischerTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeDisplay = (timeState: TimeState): string => {
    if (timeState.mainTime > 0) {
      return formatTime(timeState.mainTime);
    } else if (timeState.isByoYomi) {
      return `BY ${timeState.byoYomiPeriodsLeft}×${formatTime(timeState.byoYomiTimeLeft)}`;
    }
    return '0:00';
  };

  const getTimeStyle = (timeState: TimeState, isActive: boolean) => {
    const baseStyle = {
      color: isActive ? '#000' : '#4b5563',
      fontWeight: isActive ? '700' : '600',
      fontSize: '1.25rem'
    };
    
    // Critical time warning (red)
    if (
      (timeState.mainTime > 0 && timeState.mainTime <= 30) ||
      (timeState.isByoYomi && timeState.byoYomiTimeLeft <= 10)
    ) {
      return { ...baseStyle, color: '#dc2626' }; // Red for critical time
    }
    
    // Low time warning (orange)
    if (
      (timeState.mainTime > 0 && timeState.mainTime <= 60) ||
      (timeState.isByoYomi && timeState.byoYomiTimeLeft <= 20)
    ) {
      return { ...baseStyle, color: '#f97316' }; // Orange for low time
    }
    
    return baseStyle;
  };

  const clockCardStyle = (isActive: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem',
    backgroundColor: isActive ? '#f9fafb' : '#f3f4f6',
    borderRadius: '0.375rem',
    flex: 1,
    borderLeft: isActive ? '3px solid #000' : '3px solid transparent',
    position: 'relative' as const,
    overflow: 'hidden' as const
  });

  // Time pressure indicator animation
  const getTimePressureStyle = (timeState: TimeState) => {
    if (
      (timeState.mainTime > 0 && timeState.mainTime <= 30) ||
      (timeState.isByoYomi && timeState.byoYomiTimeLeft <= 10)
    ) {
      return {
        animation: 'pulse 1s ease-in-out infinite',
        background: 'linear-gradient(45deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%)'
      };
    }
    return {};
  };

  return (
    <div className="flex gap-4 mt-4">
      <div style={clockCardStyle(currentTurn === 'black')}>
        <div className="absolute inset-0" style={getTimePressureStyle(blackTime)} />
        <div className="flex items-center mb-1">
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '50%',
            background: '#000',
            marginRight: '0.5rem',
          }}></div>
          <div className="text-sm font-medium">Black</div>
        </div>
        <div style={getTimeStyle(blackTime, currentTurn === 'black')}>
          {getTimeDisplay(blackTime)}
        </div>
        {blackTime.isByoYomi && (
          <div className="text-xs text-gray-500 mt-1">
            {blackTime.byoYomiPeriodsLeft} periods left
          </div>
        )}
      </div>
      
      <div style={clockCardStyle(currentTurn === 'white')}>
        <div className="absolute inset-0" style={getTimePressureStyle(whiteTime)} />
        <div className="flex items-center mb-1">
          <div style={{
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid #000',
            marginRight: '0.5rem',
          }}></div>
          <div className="text-sm font-medium">White</div>
        </div>
        <div style={getTimeStyle(whiteTime, currentTurn === 'white')}>
          {getTimeDisplay(whiteTime)}
        </div>
        {whiteTime.isByoYomi && (
          <div className="text-xs text-gray-500 mt-1">
            {whiteTime.byoYomiPeriodsLeft} periods left
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeControl; 