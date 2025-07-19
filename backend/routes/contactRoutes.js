const express = require('express');
const {
  createContact,
  getContacts
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(createContact)
  .get(protect, authorize('admin'), getContacts);

module.exports = router;