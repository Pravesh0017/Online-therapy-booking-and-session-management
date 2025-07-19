const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  qualification: {
    type: String,
    required: [true, 'Please add qualification']
  },
  specialty: {
    type: [String],
    required: [true, 'Please add at least one specialty'],
    enum: [
      'Anxiety',
      'Depression',
      'Relationship Issues',
      'Stress Management',
      'Trauma',
      'Addiction',
      'Teen Therapy',
      'Couples Counseling'
    ]
  },
  bio: {
    type: String,
    required: [true, 'Please add a bio'],
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  experience: {
    type: Number,
    required: [true, 'Please add years of experience'],
    min: [0, 'Experience cannot be negative']
  },
  availableSlots: {
    type: [String],
    default: [
      '09:00', '10:00', '11:00', '12:00', 
      '14:00', '15:00', '16:00', '17:00'
    ]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Cascade delete bookings when a therapist is deleted
therapistSchema.pre('remove', async function(next) {
  await this.model('Booking').deleteMany({ therapist: this._id });
  next();
});

module.exports = mongoose.model('Therapist', therapistSchema);