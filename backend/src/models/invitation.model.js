import mongoose, { Schema } from 'mongoose';

const invitationSchema = new Schema(
    {
        meeting_code: { 
            type: String, 
            required: true 
        },
        inviter_username: { 
            type: String, 
            required: true 
        },
        invitee_email: { 
            type: String, 
            required: true 
        },
        status: { 
            type: String, 
            enum: ['sent', 'opened', 'joined'], 
            default: 'sent' 
        },
        sent_at: { 
            type: Date, 
            default: Date.now 
        },
        opened_at: { 
            type: Date 
        },
        joined_at: { 
            type: Date 
        }
    },
    { timestamps: true }
);

const Invitation = mongoose.model('Invitation', invitationSchema);

export { Invitation };
