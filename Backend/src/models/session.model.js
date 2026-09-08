import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    refreshToken: {
        type: String,
        required: [true, 'Refresh token is required']
    },
    userAgent: {
        type: String,
        required: [true, 'User agent is required']
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const Session = mongoose.model('Session', sessionSchema);

export default Session;