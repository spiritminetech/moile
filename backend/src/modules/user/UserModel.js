import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  
  },
  passwordHash: {
    type: String,
    required: true
  },
  tenantCode: {
    type: String,
    required: true,
    trim: true
  },
  

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});



export default mongoose.model('User', userSchema);