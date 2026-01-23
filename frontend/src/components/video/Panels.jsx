import React, { useState } from 'react';
import { Avatar } from '../common/index';
import {
  CloseIcon,
  SendIcon,
  MicOffIcon,
  VideocamOffIcon,
  MicIcon,
  VideocamIcon
} from '../../icons/index';
import '../../styles/video-components.css';

/**
 * Participants Panel Component
 */
export const ParticipantsPanel = ({
  participants = [],
  isOpen = false,
  onClose = () => {},
  isHost = false,
}) => {
  return (
    <div className={`side-panel participants-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h3>Participants ({participants.length})</h3>
        <button className="panel-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="panel-content">
        <div className="participants-list">
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <Avatar
                initials={participant.name?.charAt(0).toUpperCase() || '?'}
                size="sm"
                status={participant.status || 'online'}
              />

              <div className="participant-info">
                <div className="participant-name">
                  {participant.name}
                  {participant.isHost && (
                    <span className="host-badge">👑 Host</span>
                  )}
                  {participant.isLocal && (
                    <span className="local-badge">You</span>
                  )}
                </div>
                <div className="participant-status">
                  {!participant.audioEnabled && <span><MicOffIcon /> Muted</span>}
                  {!participant.videoEnabled && <span><VideocamOffIcon /> Camera Off</span>}
                </div>
              </div>

              {/* Host Controls */}
              {isHost && !participant.isLocal && (
                <div className="participant-actions">
                  <button
                    className="action-button"
                    title="More options"
                  >
                    ⋮
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Chat Panel Component
 */
export const ChatPanel = ({
  messages = [],
  isOpen = false,
  onClose = () => {},
  onSendMessage = () => {},
  currentUserName = 'You',
}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage();
    }
  };

  return (
    <div className={`side-panel chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h3>Chat</h3>
        <button className="panel-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="panel-content">
        {/* Messages List */}
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>No messages yet</p>
              <span>Be the first to say hello! 👋</span>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.isLocal ? 'local' : 'remote'}`}
              >
                <div className="message-content">
                  <div className="message-sender">{msg.senderName}</div>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="panel-footer">
        <div className="message-input-wrapper">
          <textarea
            className="message-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button
            className="message-send-button"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            title="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Panel Component
 */
export const SettingsPanel = ({
  isOpen = false,
  onClose = () => {},
  onAudioDeviceChange = () => {},
  onVideoDeviceChange = () => {},
  audioDevices = [],
  videoDevices = [],
}) => {
  const [selectedAudio, setSelectedAudio] = useState(audioDevices[0]?.deviceId || '');
  const [selectedVideo, setSelectedVideo] = useState(videoDevices[0]?.deviceId || '');

  const handleAudioChange = (deviceId) => {
    setSelectedAudio(deviceId);
    onAudioDeviceChange(deviceId);
  };

  const handleVideoChange = (deviceId) => {
    setSelectedVideo(deviceId);
    onVideoDeviceChange(deviceId);
  };

  return (
    <div className={`side-panel settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h3>Settings</h3>
        <button className="panel-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="panel-content">
        {/* Audio Devices */}
        <div className="settings-section">
          <h4><MicIcon style={{ marginRight: '8px' }} />Microphone</h4>
          <div className="settings-options">
            {audioDevices.length > 0 ? (
              audioDevices.map((device) => (
                <label key={device.deviceId} className="settings-option">
                  <input
                    type="radio"
                    name="audioDevice"
                    value={device.deviceId}
                    checked={selectedAudio === device.deviceId}
                    onChange={() => handleAudioChange(device.deviceId)}
                  />
                  <span>{device.label || 'Microphone'}</span>
                </label>
              ))
            ) : (
              <p className="no-devices">No microphones found</p>
            )}
          </div>
        </div>

        {/* Video Devices */}
        <div className="settings-section">
          <h4><VideocamIcon style={{ marginRight: '8px' }} />Camera</h4>
          <div className="settings-options">
            {videoDevices.length > 0 ? (
              videoDevices.map((device) => (
                <label key={device.deviceId} className="settings-option">
                  <input
                    type="radio"
                    name="videoDevice"
                    value={device.deviceId}
                    checked={selectedVideo === device.deviceId}
                    onChange={() => handleVideoChange(device.deviceId)}
                  />
                  <span>{device.label || 'Camera'}</span>
                </label>
              ))
            ) : (
              <p className="no-devices">No cameras found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
