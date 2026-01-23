import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { VideoLayout } from '../components/layouts/index';
import { VideoGrid } from '../components/video/VideoGrid';
import { ControlsBar } from '../components/video/ControlsBar';
import { ParticipantsPanel, ChatPanel, SettingsPanel } from '../components/video/Panels';
import { InviteModal } from '../components/video/InviteModal';
import { Modal, Button } from '../components/common/index';
import { TimerIcon } from '../icons/index';
import server from '../environment';
import '../styles/video-meeting.css';

const peerConfigConnections = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VideoMeetComponent() {
  // Socket and peer connections
  const socketRef = useRef();
  const socketIdRef = useRef();
  const connections = useRef({});
  const localVideoRef = useRef();

  // State
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState(0);
  const [username, setUsername] = useState('');
  const [askUsername, setAskUsername] = useState(true);
  const [localStream, setLocalStream] = useState(null);

  // UI State
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [meetingTimer, setMeetingTimer] = useState('00:00');

  // Initialize media and socket
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const setupMedia = async () => {
      if (!askUsername) {
        await initializeMedia();
        connectToSocket();
      }
    };
    setupMedia();
  }, [askUsername, username, initializeMedia]);

  // Meeting timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMeetingTimer((prev) => {
        const [min, sec] = prev.split(':').map(Number);
        if (sec === 59) {
          return `${String(min + 1).padStart(2, '0')}:00`;
        }
        return `${String(min).padStart(2, '0')}:${String(sec + 1).padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalStream(stream);
      window.localStream = stream;
    } catch (error) {
      alert('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const connectToSocket = () => {
    const token = localStorage.getItem('token');
    socketRef.current = io.connect(server, {
      secure: false,
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit('join-call', window.location.href);

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketId) => {
          if (!connections.current[socketId]) {
            connections.current[socketId] = new RTCPeerConnection(peerConfigConnections);

            connections.current[socketId].onicecandidate = (event) => {
              if (event.candidate) {
                socketRef.current.emit('signal', socketId, JSON.stringify({ ice: event.candidate }));
              }
            };

            connections.current[socketId].ontrack = (event) => {
              setParticipants((prev) => {
                const exists = prev.find((p) => p.id === socketId);
                if (exists) {
                  return prev.map((p) =>
                    p.id === socketId ? { ...p, stream: event.streams[0] } : p
                  );
                }
                return [...prev, {
                  id: socketId,
                  name: `Participant ${prev.length + 1}`,
                  stream: event.streams[0],
                  audioEnabled: true,
                  videoEnabled: true
                }];
              });
            };

            if (window.localStream) {
              window.localStream.getTracks().forEach((track) => {
                connections.current[socketId].addTrack(track, window.localStream);
              });
            }

            connections.current[socketId].createOffer().then((offer) => {
              connections.current[socketId].setLocalDescription(offer);
              socketRef.current.emit('signal', socketId, JSON.stringify({ sdp: offer }));
            });
          }
        });
      });

      socketRef.current.on('signal', (id, signal) => {
        const parsedSignal = JSON.parse(signal);

        if (parsedSignal.sdp) {
          if (connections.current[id]) {
            connections.current[id]
              .setRemoteDescription(new RTCSessionDescription(parsedSignal.sdp))
              .then(() => {
                if (parsedSignal.sdp.type === 'offer') {
                  connections.current[id].createAnswer().then((answer) => {
                    connections.current[id].setLocalDescription(answer);
                    socketRef.current.emit('signal', id, JSON.stringify({ sdp: answer }));
                  });
                }
              });
          }
        }

        if (parsedSignal.ice && connections.current[id]) {
          connections.current[id].addIceCandidate(new RTCIceCandidate(parsedSignal.ice));
        }
      });

      socketRef.current.on('chat-message', (message) => {
        setMessages((prev) => [...prev, message]);
        setNewMessages((prev) => prev + 1);
      });

      socketRef.current.on('user-left', (id) => {
        if (connections.current[id]) {
          connections.current[id].close();
          delete connections.current[id];
        }
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      });
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        setScreenSharing(true);
        // TODO: Replace local video stream with screen
      } catch (error) {
        // Screen sharing error
      }
    } else {
      setScreenSharing(false);
      // TODO: Switch back to camera
    }
  };

  const sendMessage = (text) => {
    const message = {
      senderName: username,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true
    };
    setMessages((prev) => [...prev, message]);
    socketRef.current?.emit('chat-message', message);
  };

  const handleLeaveCall = () => {
    // Clean up
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    Object.values(connections.current).forEach((conn) => conn.close());
    socketRef.current?.disconnect();
    window.location.href = '/home';
  };

  // Username Modal
  if (askUsername) {
    return (
      <Modal
        open={true}
        title="Enter Your Name"
        size="sm"
        footer={
          <Button
            variant="primary"
            onClick={() => setAskUsername(false)}
            disabled={!username.trim()}
          >
            Join Meeting
          </Button>
        }
      >
        <div style={{ padding: '20px 0' }}>
          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setAskUsername(false)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '16px',
              backgroundColor: 'var(--color-bg-dark)',
              color: 'var(--color-text)',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>
      </Modal>
    );
  }

  // Video Meeting Layout
  return (
    <VideoLayout
      controls={
        <ControlsBar
          isMicOn={audioEnabled}
          isCameraOn={videoEnabled}
          isScreenSharing={screenSharing}
          isChatOpen={showChat}
          isParticipantsOpen={showParticipants}
          onMicToggle={toggleAudio}
          onCameraToggle={toggleVideo}
          onScreenShare={toggleScreenShare}
          onChatToggle={() => {
            setShowChat(!showChat);
            if (!showChat) setNewMessages(0);
          }}
          onParticipantsToggle={() => setShowParticipants(!showParticipants)}
          onSettings={() => setShowSettings(!showSettings)}
          onInvite={() => setShowInviteModal(true)}
          onLeaveCall={handleLeaveCall}
          participantCount={participants.length + 1}
          newMessages={newMessages}
        />
      }
    >
      <div className="video-meeting-container">
        {/* Meeting Header */}
        <div className="meeting-header">
          <div className="meeting-info">
            <h2>Video Meeting</h2>
            <span className="meeting-timer"><TimerIcon /> {meetingTimer}</span>
          </div>
          <div className="meeting-stats">
            <span>👥 {participants.length + 1} Participants</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="video-container">
          <VideoGrid
            participants={participants}
            localStream={localStream}
            localUserName={username}
          />
        </div>

        {/* Panels */}
        <ParticipantsPanel
          participants={[
            { id: 'local', name: username, isLocal: true, isHost: true, audioEnabled, videoEnabled: videoEnabled },
            ...participants
          ]}
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          isHost={true}
        />

        <ChatPanel
          messages={messages}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          onSendMessage={sendMessage}
          currentUserName={username}
        />

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <InviteModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          meetingCode={window.location.pathname.slice(1)}
        />
      </div>
    </VideoLayout>
  );
}
