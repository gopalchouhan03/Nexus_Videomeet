import httpStatus from 'http-status';
import { Invitation } from '../models/invitation.model.js';
import { User } from '../models/user.model.js';
import { sendMeetingInvitation } from '../utils/emailService.js';
import logger from '../utils/logger.js';

/**
 * Send meeting invitation to email
 */
export const sendInvitation = async (req, res) => {
    const { token, meeting_code, invitee_email } = req.body;

    try {
        // Validate input
        if (!meeting_code || !invitee_email) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: 'Meeting code and invitee email are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invitee_email)) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: 'Invalid email format' 
            });
        }

        // Get user from token
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
                message: 'User not found' 
            });
        }

        // Check if same person is trying to invite themselves
        if (user.email === invitee_email) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: 'You cannot invite yourself' 
            });
        }

        // Check if invitation already sent to this email for this meeting
        const existingInvitation = await Invitation.findOne({
            meeting_code,
            invitee_email,
            status: { $in: ['sent', 'opened'] }
        });

        if (existingInvitation) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: 'Invitation already sent to this email' 
            });
        }

        // Create invitation record
        const invitation = new Invitation({
            meeting_code,
            inviter_username: user.username,
            invitee_email,
            status: 'sent'
        });

        await invitation.save();

        // Prepare meeting link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const meetingLink = `${baseUrl}/${meeting_code}`;

        // Send email
        try {
            await sendMeetingInvitation(invitee_email, user.name || user.username, meeting_code, meetingLink);
        } catch (emailError) {
            logger.error('Email sending failed:', emailError);
            // Don't fail the entire request if email fails, just log it
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to send email. Please check email configuration.',
                error: emailError.message
            });
        }

        res.status(httpStatus.OK).json({
            message: 'Invitation sent successfully',
            invitationId: invitation._id
        });

    } catch (error) {
        logger.error('Send invitation error:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Get invitations sent by user
 */
export const getInvitationsSent = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ 
                message: 'User not found' 
            });
        }

        const invitations = await Invitation.find({
            inviter_username: user.username
        }).sort({ sent_at: -1 });

        res.json(invitations);

    } catch (error) {
        logger.error('Get invitations error:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        });
    }
};

/**
 * Update invitation status
 */
export const updateInvitationStatus = async (req, res) => {
    const { invitationId, status } = req.body;

    try {
        if (!['sent', 'opened', 'joined'].includes(status)) {
            return res.status(httpStatus.BAD_REQUEST).json({ 
                message: 'Invalid status' 
            });
        }

        const updateData = { status };
        if (status === 'opened') {
            updateData.opened_at = new Date();
        } else if (status === 'joined') {
            updateData.joined_at = new Date();
        }

        const invitation = await Invitation.findByIdAndUpdate(
            invitationId,
            updateData,
            { new: true }
        );

        if (!invitation) {
            return res.status(httpStatus.NOT_FOUND).json({ 
                message: 'Invitation not found' 
            });
        }

        res.json({
            message: 'Invitation updated',
            invitation
        });

    } catch (error) {
        logger.error('Update invitation error:', error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        });
    }
};
