const mongoose = require('mongoose');
const moment = require('moment');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Therapist',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    validate: {
      validator: function(value) {
        return moment(value).isSameOrAfter(moment(), 'day');
      },
      message: 'Booking date must be today or in the future'
    }
  },
  time: {
    type: String,
    required: [true, 'Please add a time']
  },
  concern: {
    type: String,
    enum: [
      'Anxiety',
      'Depression',
      'Relationship Issues',
      'Stress Management',
      'Trauma',
      'Other'
    ]
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate bookings
bookingSchema.index({ therapist: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);