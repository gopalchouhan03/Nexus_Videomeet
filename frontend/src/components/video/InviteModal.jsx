import React, { useState } from 'react';
import { Button, Input, Modal } from '../common/index';
import { SendIcon } from '../../icons/index';
import server from '../../environment';

export const InviteModal = ({ open = false, onClose, meetingCode, onInviteSend }) => {
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSendInvitation = async () => {
    // Validation
    if (!inviteeEmail.trim()) {
      setMessageType('error');
      setMessage('Please enter an email address');
      return;
    }

    if (!validateEmail(inviteeEmail)) {
      setMessageType('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${server}/api/v1/users/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          meeting_code: meetingCode,
          invitee_email: inviteeEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage('Invitation sent successfully! ✓');
        setInviteeEmail('');
        
        // Call callback if provided
        if (onInviteSend) {
          onInviteSend(inviteeEmail);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error sending invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSendInvitation();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite People to Meeting"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendInvitation}
            loading={loading}
          >
            <SendIcon style={{ marginRight: '8px' }} /> Send Invitation
          </Button>
        </div>
      }
    >
      <div style={{ padding: '20px 0' }}>
        <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
          Send invitations to participants. They'll receive an email with the meeting link.
        </p>

        <Input
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          value={inviteeEmail}
          onChange={(e) => {
            setInviteeEmail(e.target.value);
            setMessage('');
          }}
          onKeyPress={handleKeyPress}
          disabled={loading}
          size="lg"
        />

        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <p style={{ marginBottom: '8px' }}>
            Meeting Code: <strong style={{ color: 'var(--color-primary)' }}>{meetingCode}</strong>
          </p>
          <p>
            Participant will receive an email with a link to join the video call.
          </p>
        </div>

        {message && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: messageType === 'success' ? '#d1fae5' : '#fee2e2',
              color: messageType === 'success' ? '#065f46' : '#991b1b',
              fontSize: '14px',
              border: `1px solid ${messageType === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {message}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InviteModal;
