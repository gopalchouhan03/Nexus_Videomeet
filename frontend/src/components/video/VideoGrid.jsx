import React from 'react';
import { Avatar, Badge } from '../common/index';
import { MicOffIcon } from '../../icons/index';
import '../../styles/video-components.css';

/**
 * Video Tile Component
 * Displays a single participant's video
 */
export const VideoTile = ({
  videoRef = null,
  isLocal = false,
  userName = 'User',
  isMuted = false,
  isScreenSharing = false,
  isActive = false,
  initials = '?',
}) => {
  return (
    <div
      className={`video-tile ${isLocal ? 'local' : 'remote'} ${isActive ? 'active-speaker' : ''} ${isScreenSharing ? 'screen-share' : ''}`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="video-element"
        autoPlay
        muted={isLocal}
        playsInline
      />

      {/* Fallback Avatar (when camera is off) */}
      <div className="video-fallback">
        <Avatar
          initials={initials}
          size="lg"
        />
      </div>

      {/* Tile Info */}
      <div className="video-tile-info">
        <div className="tile-info-left">
          <span className="user-name">{userName}</span>
          {isScreenSharing && (
            <Badge variant="info" size="sm">
              🖥 Sharing
            </Badge>
          )}
        </div>

        <div className="tile-info-right">
          {isMuted && (
            <span className="status-indicator" title="Muted">
              <MicOffIcon />
            </span>
          )}
          {isLocal && (
            <Badge variant="primary" size="sm">
              You
            </Badge>
          )}
        </div>
      </div>

      {/* Active Speaker Indicator */}
      {isActive && <div className="active-speaker-border" />}
    </div>
  );
};

/**
 * Video Grid Component
 * Manages layout of multiple video tiles
 */
export const VideoGrid = ({
  participants = [],
  localStream = null,
  localUserName = 'You',
  activeParticipantId = null,
}) => {
  const getGridClass = () => {
    const count = participants.length + 1; // +1 for local

    if (count === 1) return 'grid-single';
    if (count === 2) return 'grid-two';
    if (count <= 4) return 'grid-four';
    if (count <= 6) return 'grid-six';
    if (count <= 9) return 'grid-nine';
    return 'grid-many';
  };

  return (
    <div className={`video-grid ${getGridClass()}`}>
      {/* Local Video */}
      <VideoTile
        videoRef={(ref) => {
          if (ref && localStream) {
            ref.srcObject = localStream;
          }
        }}
        isLocal={true}
        userName={localUserName}
        isMuted={!localStream}
        isActive={activeParticipantId === 'local'}
        initials={localUserName.charAt(0).toUpperCase()}
      />

      {/* Remote Videos */}
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          videoRef={(ref) => {
            if (ref && participant.stream) {
              ref.srcObject = participant.stream;
            }
          }}
          isLocal={false}
          userName={participant.name || 'Participant'}
          isMuted={!participant.audioEnabled}
          isScreenSharing={participant.isScreenSharing}
          isActive={activeParticipantId === participant.id}
          initials={(participant.name || 'P').charAt(0).toUpperCase()}
        />
      ))}
    </div>
  );
};
