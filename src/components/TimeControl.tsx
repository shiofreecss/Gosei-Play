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
  timePerMove,
  byoYomiPeriods = 0,
  byoYomiTime = 0,
  fischerTime = 0,
  currentTurn,
  onTimeout,
  isPlaying
}) => {
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

  // Play notification sound using browser's built-in notification
  const playNotification = (type: 'low-time' | 'byo-yomi') => {
    try {
      if (type === 'low-time') {
        new Notification('Low Time Warning', {
          body: 'Less than 30 seconds remaining!',
          silent: false
        });
      } else {
        new Notification('Byo-yomi Period', {
          body: 'Main time expired. Entering byo-yomi period.',
          silent: false
        });
      }
    } catch (e) {
      console.warn('Notifications not supported or permission not granted');
    }
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Handle server time synchronization
  useEffect(() => {
    // Listen for server time updates
    const handleServerTimeUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'timeUpdate' && data.color) {
          // Update the appropriate timer based on the color
          const setTimeState = data.color === 'black' ? setBlackTime : setWhiteTime;
          const timeRemaining = data.timeRemaining;
          
          console.log(`Synchronizing ${data.color} time from server: ${timeRemaining}s`);
          
          // Update the timer state from server
          setTimeState(prev => ({
            ...prev,
            mainTime: timeRemaining,
            // Keep other byo-yomi state intact
          }));
          
          // Update the last update time
          lastUpdateTimeRef.current = Date.now();
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };
    
    // This is just a mock event listener since we don't have direct access to socket events here
    // In a real implementation, you would connect this to your socket events
    // window.addEventListener('message', handleServerTimeUpdate);
    
    // return () => {
    //   window.removeEventListener('message', handleServerTimeUpdate);
    // };
  }, []);

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

          if (currentTimeState.mainTime > 0 || (currentTimeState.isByoYomi && currentTimeState.byoYomiTimeLeft > 0)) {
            // Play warning sounds
            if (currentTimeState.mainTime === 30 || currentTimeState.byoYomiTimeLeft === 10) {
              playNotification('low-time');
            } else if (currentTimeState.mainTime === 0 && !currentTimeState.isByoYomi) {
              playNotification('byo-yomi');
            }

            setTimeState(prev => {
              // Don't go below zero
              if (prev.mainTime <= elapsedSeconds && !prev.isByoYomi) {
                // We've just run out of main time
                if (prev.byoYomiPeriodsLeft > 0) {
                  // Enter byo-yomi
                  return {
                    ...prev,
                    mainTime: 0,
                    isByoYomi: true,
                    byoYomiTimeLeft: byoYomiTime
                  };
                } else {
                  // No byo-yomi periods, time's up
                  return {
                    ...prev,
                    mainTime: 0
                  };
                }
              } else if (prev.mainTime > 0) {
                // Just decrement main time
                return { 
                  ...prev, 
                  mainTime: Math.max(0, prev.mainTime - elapsedSeconds) 
                };
              } else if (prev.isByoYomi) {
                // Handle byo-yomi time
                if (prev.byoYomiTimeLeft <= elapsedSeconds) {
                  // This byo-yomi period is over
                  if (prev.byoYomiPeriodsLeft > 1) {
                    // Move to next period
                    return {
                      ...prev,
                      byoYomiPeriodsLeft: prev.byoYomiPeriodsLeft - 1,
                      byoYomiTimeLeft: byoYomiTime
                    };
                  } else {
                    // No periods left, time's up
                    return {
                      ...prev,
                      byoYomiPeriodsLeft: 0,
                      byoYomiTimeLeft: 0
                    };
                  }
                } else {
                  // Just decrement byo-yomi time
                  return {
                    ...prev,
                    byoYomiTimeLeft: prev.byoYomiTimeLeft - elapsedSeconds
                  };
                }
              }
              return prev;
            });
          } else if (currentTimeState.mainTime === 0 && 
                   (!currentTimeState.isByoYomi || currentTimeState.byoYomiTimeLeft === 0)) {
            // Time has run out
            onTimeout(currentTurn);
            
            // Stop the timer
            if (timerIdRef.current) {
              clearInterval(timerIdRef.current);
              timerIdRef.current = null;
            }
          }
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

  // Handle Fischer increment on move
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
      return `BY ${timeState.byoYomiPeriodsLeft}x${formatTime(timeState.byoYomiTimeLeft)}`;
    }
    return '0:00';
  };

  const getTimeStyle = (timeState: TimeState, isActive: boolean) => {
    const baseStyle = {
      color: isActive ? '#000' : '#4b5563',
      fontWeight: isActive ? '700' : '600',
      fontSize: '1.25rem'
    };
    
    if (timeState.mainTime <= 30 || (timeState.isByoYomi && timeState.byoYomiTimeLeft <= 10)) {
      return { ...baseStyle, color: isActive ? '#dc2626' : '#ef4444' }; // Red for low time
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
    borderLeft: isActive ? '3px solid #000' : '3px solid transparent'
  });

  return (
    <div className="flex gap-4 mt-4">
      <div style={clockCardStyle(currentTurn === 'black')}>
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
      </div>
      
      <div style={clockCardStyle(currentTurn === 'white')}>
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
      </div>
    </div>
  );
};

export default TimeControl; 