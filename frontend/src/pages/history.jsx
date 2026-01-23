import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/layouts/index';
import { Button, Card, Container, Badge } from '../components/common/index';
import { HistoryIcon } from '../icons/index';
import '../styles/history.css';

export default function History() {
  const navigate = useNavigate();
  const { getHistoryOfUser } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch (err) {
        setError('Failed to load meeting history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  const copyToClipboard = (code) => {
    const link = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(link);
    alert('Meeting link copied!');
  };

  return (
    <AppLayout showNav={true}>
      <Container maxWidth="lg">
        {/* Header */}
        <div className="history-header">
          <div>
            <h1>Meeting History</h1>
            <p>View and rejoin your past meetings</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/home')}
          >
            ← Back to Home
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="history-empty">
            <p>Loading your meetings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="history-error">
            <p>{error}</p>
          </div>
        )}

        {/* Meetings List */}
        {!loading && !error && meetings.length > 0 ? (
          <div className="history-container">
            <div className="history-tabs">
              <button className="tab-button active">All Meetings</button>
              <button className="tab-button">This Week</button>
              <button className="tab-button">This Month</button>
            </div>

            <div className="meetings-table">
              <div className="table-header">
                <div className="col col-code">Meeting Code</div>
                <div className="col col-date">Date</div>
                <div className="col col-time">Time</div>
                <div className="col col-actions">Actions</div>
              </div>

              {meetings.map((meeting, index) => (
                <div key={index} className="table-row">
                  <div className="col col-code">
                    <div className="code-display">
                      <span className="code-badge">{meeting.meetingCode}</span>
                    </div>
                  </div>
                  <div className="col col-date">
                    {formatDate(meeting.date)}
                  </div>
                  <div className="col col-time">
                    {formatTime(meeting.date)}
                  </div>
                  <div className="col col-actions">
                    <div className="action-buttons">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/${meeting.meetingCode}`)}
                      >
                        Join
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(meeting.meetingCode)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Alternative Card View (Mobile) */}
            <div className="meetings-cards">
              {meetings.map((meeting, index) => (
                <Card key={index} className="meeting-history-card">
                  <div className="card-header">
                    <div className="code-display">
                      <span className="code-badge">{meeting.meetingCode}</span>
                    </div>
                    <Badge variant="primary">Completed</Badge>
                  </div>

                  <div className="card-body">
                    <div className="meeting-detail">
                      <span className="label">📅 Date</span>
                      <span className="value">{formatDate(meeting.date)}</span>
                    </div>
                    <div className="meeting-detail">
                      <span className="label">⏰ Time</span>
                      <span className="value">{formatTime(meeting.date)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/${meeting.meetingCode}`)}
                    >
                      Join Meeting
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => copyToClipboard(meeting.meetingCode)}
                    >
                      Copy Link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-value">{meetings.length}</div>
                <div className="stat-label">Total Meetings</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {new Set(meetings.map(m => new Date(m.date).toDateString())).size}
                </div>
                <div className="stat-label">Unique Days</div>
              </div>
            </div>
          </div>
        ) : !loading && !error ? (
          <div className="history-empty">
            <div className="empty-icon"><HistoryIcon /></div>
            <h2>No meetings yet</h2>
            <p>Your meeting history will appear here</p>
            <Button
              variant="primary"
              onClick={() => navigate('/home')}
            >
              Start Your First Meeting
            </Button>
          </div>
        ) : null}
      </Container>
    </AppLayout>
  );
}
