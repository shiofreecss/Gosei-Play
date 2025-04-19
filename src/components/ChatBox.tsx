import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface ChatBoxProps {
  gameId: string;
  currentPlayerId: string;
  currentPlayerUsername: string;
  socket?: any;  // Use the actual socket type from your project
  messages?: ChatMessage[];
}

const ChatBox: React.FC<ChatBoxProps> = ({
  gameId,
  currentPlayerId,
  currentPlayerUsername,
  socket,
  messages = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Listen for incoming chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: ChatMessage) => {
      setChatMessages(prevMessages => [...prevMessages, data]);
    };

    socket.on('chatMessage', handleChatMessage);

    return () => {
      socket.off('chatMessage', handleChatMessage);
    };
  }, [socket]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentPlayerId,
      username: currentPlayerUsername,
      message: inputValue.trim(),
      timestamp: Date.now()
    };

    // Send message to server
    socket.emit('chatMessage', {
      gameId,
      playerId: currentPlayerId,
      username: currentPlayerUsername,
      message: inputValue.trim()
    });

    // Add message to local state
    setChatMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Clear input
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: '400px',
    maxHeight: '600px',
  };

  const headerStyle = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
    fontSize: '1.25rem',
  };

  const messagesContainerStyle = {
    padding: '1rem',
    overflowY: 'auto' as const,
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  };

  const messageStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    maxWidth: '85%',
  };

  const selfMessageStyle = {
    ...messageStyle,
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  };

  const otherMessageStyle = {
    ...messageStyle,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  };

  const messageContentStyle = {
    padding: '0.75rem',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    wordBreak: 'break-word' as const,
    maxWidth: '100%',
  };

  const selfMessageContentStyle = {
    ...messageContentStyle,
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    borderBottomRightRadius: '0.25rem',
  };

  const otherMessageContentStyle = {
    ...messageContentStyle,
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    borderBottomLeftRadius: '0.25rem',
  };

  const metaInfoStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  };

  const inputContainerStyle = {
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.5rem',
  };

  const textareaStyle = {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e5e7eb',
    resize: 'none' as const,
    fontSize: '0.875rem',
    minHeight: '2.5rem',
    maxHeight: '6rem',
  };

  const sendButtonStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '0.375rem',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        Chat
      </div>
      
      <div style={messagesContainerStyle}>
        {chatMessages.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          chatMessages.map(msg => (
            <div 
              key={msg.id} 
              style={msg.playerId === currentPlayerId ? selfMessageStyle : otherMessageStyle}
            >
              {msg.playerId !== currentPlayerId && (
                <div style={{ fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {msg.username}
                </div>
              )}
              <div 
                style={msg.playerId === currentPlayerId ? selfMessageContentStyle : otherMessageContentStyle}
              >
                {msg.message}
              </div>
              <div style={metaInfoStyle}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={inputContainerStyle}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          style={textareaStyle}
          placeholder="Type a message..."
          rows={1}
        />
        <button 
          onClick={handleSendMessage}
          style={sendButtonStyle}
          disabled={!inputValue.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBox; 