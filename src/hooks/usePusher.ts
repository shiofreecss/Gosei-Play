import { useEffect, useRef } from 'react';
import pusherClient from '../config/pusher';

interface UsePusherOptions {
  channelName: string;
  eventName: string;
  callback: (data: any) => void;
}

export function usePusher({ channelName, eventName, callback }: UsePusherOptions) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Subscribe to the channel
    channelRef.current = pusherClient.subscribe(channelName);

    // Bind to the event
    channelRef.current.bind(eventName, callback);

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName);
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [channelName, eventName, callback]);

  return channelRef.current;
} 