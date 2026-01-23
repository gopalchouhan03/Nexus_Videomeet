import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// Initialize email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Send meeting invitation email
 * @param {string} recipientEmail - Email address of the invitee
 * @param {string} inviterName - Name of the person sending invitation
 * @param {string} meetingCode - Meeting code to join
 * @param {string} meetingLink - Full meeting link
 * @returns {Promise<boolean>}
 */
export const sendMeetingInvitation = async (recipientEmail, inviterName, meetingCode, meetingLink) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `${inviterName} has invited you to a video meeting`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background: #f9f9f9;
                            border-radius: 8px;
                        }
                        .header {
                            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 8px;
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            background: white;
                            padding: 30px;
                            border-radius: 8px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        .inviter-name {
                            font-weight: 600;
                            color: #2563eb;
                            font-size: 18px;
                        }
                        .meeting-code {
                            background: #f0f0f0;
                            padding: 15px;
                            border-radius: 6px;
                            margin: 20px 0;
                            text-align: center;
                            font-family: monospace;
                            font-size: 18px;
                            font-weight: bold;
                            color: #2563eb;
                        }
                        .button-container {
                            margin: 30px 0;
                            text-align: center;
                        }
                        .button {
                            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                            color: white;
                            padding: 14px 40px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                            font-weight: 600;
                            font-size: 16px;
                            transition: transform 0.2s;
                        }
                        .button:hover {
                            transform: scale(1.05);
                        }
                        .copy-link {
                            background: #f0f0f0;
                            padding: 10px;
                            border-radius: 6px;
                            word-break: break-all;
                            font-size: 12px;
                            color: #666;
                            margin-top: 15px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            color: #999;
                            font-size: 12px;
                        }
                        .info-box {
                            background: #e7f3ff;
                            padding: 15px;
                            border-left: 4px solid #2563eb;
                            border-radius: 4px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎥 You're Invited to a Video Meeting</h1>
                        </div>
                        
                        <div class="content">
                            <p>Hi there!</p>
                            
                            <p><span class="inviter-name">${inviterName}</span> has invited you to join a video meeting on <strong>NEXUS</strong>.</p>
                            
                            <div class="info-box">
                                <p><strong>Meeting Code:</strong></p>
                                <div class="meeting-code">${meetingCode}</div>
                            </div>
                            
                            <div class="button-container">
                                <a href="${meetingLink}" class="button">Join Video Meeting</a>
                            </div>
                            
                            <p style="text-align: center; color: #666;">Or copy and paste this link in your browser:</p>
                            <div class="copy-link">${meetingLink}</div>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <p style="font-size: 13px; color: #666;">
                                <strong>Tips:</strong>
                                <ul>
                                    <li>Make sure you have a camera and microphone connected</li>
                                    <li>Allow browser permissions for camera and audio when prompted</li>
                                    <li>Join a few minutes early to test your audio and video</li>
                                </ul>
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2026 NEXUS Video Conferencing. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Meeting invitation sent to ${recipientEmail} from ${inviterName}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send email to ${recipientEmail}: ${error.message}`);
        throw error;
    }
};

/**
 * Verify email service is configured
 */
export const verifyEmailService = async () => {
    try {
        await transporter.verify();
        logger.info('Email service verified successfully');
        return true;
    } catch (error) {
        logger.error('Email service configuration error:', error.message);
        return false;
    }
};

export default { sendMeetingInvitation, verifyEmailService };
