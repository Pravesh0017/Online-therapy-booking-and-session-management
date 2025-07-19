const Contact = require('../models/Contact');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');

// @desc    Create contact message
// @route   POST /api/contact
// @access  Public
exports.createContact = async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);

    // Send confirmation email
    const message = `Dear ${contact.name},\n\nThank you for contacting Mindful Therapy. We have received your message regarding "${contact.subject}" and will get back to you within 24 hours.\n\nBest regards,\nThe Mindful Therapy Team`;

    await sendEmail({
      email: contact.email,
      subject: 'Thank you for contacting us',
      message
    });

    // Notify admin
    const adminMessage = `New contact form submission:\n\nName: ${contact.name}\nEmail: ${contact.email}\nSubject: ${contact.subject}\nMessage: ${contact.message}`;

    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: 'New Contact Form Submission',
      message: adminMessage
    });

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (err) {
    next(err);
  }
};