import React from 'react';
import {
  MicIcon,
  MicOffIcon,
  VideocamIcon,
  VideocamOffIcon,
  ScreenShareIcon,
  StopScreenShareIcon,
  ChatIcon,
  PeopleIcon,
  SettingsIcon,
  CallEndIcon,
  AddIcon
} from '../../icons/index';
import '../../styles/video-components.css';

/**
 * Control Bar Component
 * Contains all meeting controls (mic, camera, screen share, etc.)
 */
export const ControlsBar = ({
  isMicOn = true,
  isCameraOn = true,
  isScreenSharing = false,
  isChatOpen = false,
  isParticipantsOpen = false,
  onMicToggle = () => {},
  onCameraToggle = () => {},
  onScreenShare = () => {},
  onChatToggle = () => {},
  onParticipantsToggle = () => {},
  onSettings = () => {},
  onInvite = () => {},
  onLeaveCall = () => {},
  participantCount = 1,
  newMessages = 0,
}) => {
  return (
    <div className="controls-bar">
      <div className="controls-container">
        {/* Left Controls */}
        <div className="controls-group">
          {/* Mic Toggle */}
          <button
            className={`control-button ${isMicOn ? 'active' : 'inactive'}`}
            onClick={onMicToggle}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <MicIcon className="control-icon" /> : <MicOffIcon className="control-icon" />}
            <span className="control-label">
              {isMicOn ? 'Mute' : 'Unmute'}
            </span>
          </button>

          {/* Camera Toggle */}
          <button
            className={`control-button ${isCameraOn ? 'active' : 'inactive'}`}
            onClick={onCameraToggle}
            title={isCameraOn ? 'Stop Video' : 'Start Video'}
          >
            {isCameraOn ? <VideocamIcon className="control-icon" /> : <VideocamOffIcon className="control-icon" />}
            <span className="control-label">
              {isCameraOn ? 'Camera On' : 'Camera Off'}
            </span>
          </button>

          {/* Screen Share */}
          <button
            className={`control-button ${isScreenSharing ? 'active' : ''}`}
            onClick={onScreenShare}
            title="Share Screen"
          >
            {isScreenSharing ? <StopScreenShareIcon className="control-icon" /> : <ScreenShareIcon className="control-icon" />}
            <span className="control-label">
              {isScreenSharing ? 'Stop Sharing' : 'Share'}
            </span>
          </button>
        </div>

        {/* Center Controls */}
        <div className="controls-group">
          {/* Participants */}
          <button
            className={`control-button info ${isParticipantsOpen ? 'active' : ''}`}
            onClick={onParticipantsToggle}
            title="Show participants"
          >
            <PeopleIcon className="control-icon" />
            <span className="participant-badge">{participantCount}</span>
          </button>

          {/* Chat */}
          <button
            className={`control-button info ${isChatOpen ? 'active' : ''}`}
            onClick={onChatToggle}
            title="Show chat"
          >
            <ChatIcon className="control-icon" />
            {newMessages > 0 && (
              <span className="message-badge">{newMessages}</span>
            )}
          </button>

          {/* Settings */}
          <button
            className="control-button info"
            onClick={onSettings}
            title="Settings"
          >
            <SettingsIcon className="control-icon" />
          </button>

          {/* Invite */}
          <button
            className="control-button info"
            onClick={onInvite}
            title="Invite people"
          >
            <AddIcon className="control-icon" />
            <span className="control-label">Invite</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="controls-group">
          {/* Leave Call */}
          <button
            className="control-button danger leave-button"
            onClick={onLeaveCall}
            title="Leave call"
          >
            <CallEndIcon className="control-icon" />
            <span className="control-label">Leave</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="controls-mobile">
        <button
          className={`control-button mobile ${isMicOn ? 'active' : 'inactive'}`}
          onClick={onMicToggle}
        >
          {isMicOn ? <MicIcon /> : <MicOffIcon />}
        </button>
        <button
          className={`control-button mobile ${isCameraOn ? 'active' : 'inactive'}`}
          onClick={onCameraToggle}
        >
          {isCameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </button>
        <button
          className={`control-button mobile ${isScreenSharing ? 'active' : ''}`}
          onClick={onScreenShare}
        >
          {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </button>
        <button
          className={`control-button mobile info ${isParticipantsOpen ? 'active' : ''}`}
          onClick={onParticipantsToggle}
        >
          <PeopleIcon />
        </button>
        <button
          className={`control-button mobile info ${isChatOpen ? 'active' : ''}`}
          onClick={onChatToggle}
        >
          <ChatIcon />
        </button>
        <button
          className="control-button mobile danger"
          onClick={onLeaveCall}
        >
          <CallEndIcon />
        </button>
      </div>
    </div>
  );
};

/**
 * Floating Action Button for Quick Actions
 */
export const FloatingActionButton = ({
  icon = AddIcon,
  onClick = () => {},
  label = '',
  variant = 'primary',
}) => {
  const Icon = icon;
  return (
    <button
      className={`fab fab-${variant}`}
      onClick={onClick}
      title={label}
    >
      {typeof icon === 'string' ? <span>{icon}</span> : <Icon />}
    </button>
  );
};
