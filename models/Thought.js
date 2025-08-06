import mongoose from 'mongoose';

export const Thought = mongoose.model('Thought', {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  heats: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  }
})