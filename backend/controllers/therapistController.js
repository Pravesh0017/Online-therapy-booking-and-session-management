const Therapist = require('../models/Therapist');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all therapists
// @route   GET /api/therapists
// @access  Public
exports.getTherapists = async (req, res, next) => {
  try {
    const therapists = await Therapist.find().populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single therapist
// @route   GET /api/therapists/:id
// @access  Public
exports.getTherapist = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!therapist) {
      return next(
        new ErrorResponse(`No therapist found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create therapist
// @route   POST /api/therapists
// @access  Private/Admin
exports.createTherapist = async (req, res, next) => {
  try {
    // Check if user exists and is not already a therapist
    const user = await User.findById(req.body.user);

    if (!user) {
      return next(
        new ErrorResponse(`No user found with id of ${req.body.user}`, 404)
      );
    }

    if (user.role === 'therapist') {
      return next(
        new ErrorResponse(
          `User ${req.body.user} is already a therapist`,
          400
        )
      );
    }

    // Update user role to therapist
    user.role = 'therapist';
    await user.save();

    const therapist = await Therapist.create(req.body);

    res.status(201).json({
      success: true,
      data: therapist
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res, next) => {
  try {
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!therapist) {
      return next(
        new ErrorResponse(`No therapist found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete therapist
// @route   DELETE /api/therapists/:id
// @access  Private/Admin
exports.deleteTherapist = async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return next(
        new ErrorResponse(`No therapist found with id of ${req.params.id}`, 404)
      );
    }

    // Update user role back to user
    const user = await User.findById(therapist.user);
    if (user) {
      user.role = 'user';
      await user.save();
    }

    await therapist.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get therapists by specialty
// @route   GET /api/therapists/specialty/:specialty
// @access  Public
exports.getTherapistsBySpecialty = async (req, res, next) => {
  try {
    const therapists = await Therapist.find({
      specialty: req.params.specialty
    }).populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (err) {
    next(err);
  }
};