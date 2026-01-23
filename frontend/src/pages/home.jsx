import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/layouts/index';
import { Button, Input, Card, Container, Modal } from '../components/common/index';
import { VideocamIcon, LinkIcon, HistoryIcon } from '../icons/index';
import '../styles/home.css';

function HomeComponent() {
  const navigate = useNavigate();
  const { addToUserHistory } = useContext(AuthContext);

  const [meetingCode, setMeetingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [recentMeetings] = useState([]);

  // Generate a mock meeting code
  const generateMeetingCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Handle start new meeting
  const handleStartMeeting = async () => {
    setLoading(true);
    const code = generateMeetingCode();
    try {
      await addToUserHistory(code);
      navigate(`/${code}`);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle join meeting
  const handleJoinMeeting = async () => {
    if (!meetingCode.trim()) {
      alert('Please enter a meeting code');
      return;
    }
    setLoading(true);
    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Copy meeting link
  const copyMeetingLink = (code) => {
    const link = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(link);
    alert('Meeting link copied to clipboard!');
  };

  return (
    <AppLayout showNav={true}>
      <Container maxWidth="xl">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-grid">
            {/* Left Content */}
            <div className="hero-left">
              <h1 className="home-title">
                Ready to <span className="gradient-text">connect</span>?
              </h1>
              <p className="home-subtitle">
                Start a video call instantly or join an ongoing meeting with your team.
              </p>

              {/* Action Buttons */}
              <div className="hero-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartMeeting}
                  loading={loading}
                >
                  <VideocamIcon style={{ marginRight: '8px' }} /> Start New Meeting
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowJoinModal(true)}
                >
                  <LinkIcon style={{ marginRight: '8px' }} /> Join a Meeting
                </Button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hero-visual">
              <div className="video-preview">
                <div className="preview-grid">
                  <div className="preview-tile"></div>
                  <div className="preview-tile"></div>
                  <div className="preview-tile"></div>
                  <div className="preview-tile"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Card className="action-card" onClick={handleStartMeeting}>
              <div className="action-icon"><VideocamIcon /></div>
              <h3>Start Meeting</h3>
              <p>Create a new video call instantly</p>
            </Card>
            <Card className="action-card" onClick={() => setShowJoinModal(true)}>
              <div className="action-icon"><LinkIcon /></div>
              <h3>Join Meeting</h3>
              <p>Enter a code to join a call</p>
            </Card>
            <Card className="action-card" onClick={() => navigate('/history')}>
              <div className="action-icon"><HistoryIcon /></div>
              <h3>Meeting History</h3>
              <p>View your past meetings</p>
            </Card>
            <Card className="action-card">
              <div className="action-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Manage your preferences</p>
            </Card>
          </div>
        </section>

        {/* Recent Meetings */}
        {recentMeetings.length > 0 && (
          <section className="recent-meetings">
            <h2>Recent Meetings</h2>
            <div className="meetings-list">
              {recentMeetings.map((meeting, index) => (
                <Card key={index} className="meeting-card">
                  <div className="meeting-info">
                    <div className="meeting-code">{meeting.code}</div>
                    <p className="meeting-date">{new Date(meeting.date).toLocaleDateString()}</p>
                  </div>
                  <div className="meeting-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/${meeting.code}`)}
                    >
                      Join
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyMeetingLink(meeting.code)}
                    >
                      Copy Link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Join Meeting Modal */}
      <Modal
        open={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setMeetingCode('');
        }}
        title="Join a Meeting"
        size="md"
        footer={
          <div className="modal-footer-actions">
            <Button
              variant="outline"
              onClick={() => {
                setShowJoinModal(false);
                setMeetingCode('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleJoinMeeting}
              loading={loading}
            >
              Join Meeting
            </Button>
          </div>
        }
      >
        <div className="join-modal-content">
          <p className="modal-description">
            Enter the meeting code provided by the host
          </p>
          <Input
            label="Meeting Code"
            type="text"
            placeholder="abc123def456"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
            size="lg"
          />
          <p className="modal-hint">
            💡 You can usually find the meeting code in the invitation email or message
          </p>
        </div>
      </Modal>
    </AppLayout>
  );
}

export default withAuth(HomeComponent);