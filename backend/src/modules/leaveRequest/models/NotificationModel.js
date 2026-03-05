import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    ref: 'Company'
  },
  recipientUserId: {
    type: Number,
    required: true,
    ref: 'User'
  },
  referenceType: {
    type: String,
    enum: ['LEAVE_REQUEST', 'TASK', 'ATTENDANCE', 'PROJECT'],
    required: true
  },
  referenceId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientUserId: 1, isRead: 1 });



export default mongoose.model('Notification', notificationSchema);