const Booking = require('../models/Booking');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const moment = require('moment');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query;
    
    // Regular users can see only their bookings
    if (req.user.role === 'user') {
      query = Booking.find({ user: req.user.id });
    } 
    // Therapists can see bookings assigned to them
    else if (req.user.role === 'therapist') {
      query = Booking.find({ therapist: req.user.id });
    }
    // Admins can see all bookings
    else {
      query = Booking.find();
    }

    const bookings = await query
      .populate('user', 'name email phone')
      .populate('therapist', 'name specialty')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('therapist', 'name specialty');

    if (!booking) {
      return next(
        new ErrorResponse(`No booking found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is booking owner or admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to access this booking`,
          401
        )
      );
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check if therapist exists
    const therapist = await Therapist.findById(req.body.therapist);
    if (!therapist) {
      return next(
        new ErrorResponse(`No therapist with id of ${req.body.therapist}`, 404)
      );
    }

    // Check if therapist is available at the requested time
    if (!therapist.availableSlots.includes(req.body.time)) {
      return next(
        new ErrorResponse(
          `Therapist is not available at ${req.body.time}`,
          400
        )
      );
    }

    // Check for existing booking at the same time
    const existingBooking = await Booking.findOne({
      therapist: req.body.therapist,
      date: req.body.date,
      time: req.body.time,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return next(
        new ErrorResponse('The selected time slot is already booked', 400)
      );
    }

    const booking = await Booking.create(req.body);

    // Populate therapist details for email
    const populatedBooking = await Booking.findById(booking._id)
      .populate('therapist', 'name')
      .populate('user', 'name email');

    // Send confirmation email
    const message = `Dear ${populatedBooking.user.name},\n\nYour therapy session with ${populatedBooking.therapist.name} has been booked for ${moment(populatedBooking.date).format('LL')} at ${populatedBooking.time}.\n\nThank you for choosing Mindful Therapy.`;

    await sendEmail({
      email: populatedBooking.user.email,
      subject: 'Therapy Session Confirmation',
      message
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(
        new ErrorResponse(`No booking found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this booking`,
          401
        )
      );
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(
        new ErrorResponse(`No booking found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is booking owner or admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this booking`,
          401
        )
      );
    }

    await booking.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get available time slots for a therapist
// @route   GET /api/bookings/availability/:therapistId
// @access  Private
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.therapistId);

    if (!therapist) {
      return next(
        new ErrorResponse(
          `No therapist found with id of ${req.params.therapistId}`,
          404
        )
      );
    }

    // Get all bookings for the therapist on the specified date
    const bookings = await Booking.find({
      therapist: req.params.therapistId,
      date: req.query.date,
      status: { $ne: 'cancelled' }
    });

    // Filter out booked slots from available slots
    const bookedSlots = bookings.map(booking => booking.time);
    const availableSlots = therapist.availableSlots.filter(
      slot => !bookedSlots.includes(slot)
    );

    res.status(200).json({
      success: true,
      data: availableSlots
    });
  } catch (err) {
    next(err);
  }
};