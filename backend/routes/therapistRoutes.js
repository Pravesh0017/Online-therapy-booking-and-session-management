const express = require('express');
const {
  getTherapists,
  getTherapist,
  createTherapist,
  updateTherapist,
  deleteTherapist,
  getTherapistsBySpecialty
} = require('../controllers/therapistController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getTherapists)
  .post(protect, authorize('admin'), createTherapist);

router.route('/:id')
  .get(getTherapist)
  .put(protect, authorize('admin'), updateTherapist)
  .delete(protect, authorize('admin'), deleteTherapist);

router.route('/specialty/:specialty')
  .get(getTherapistsBySpecialty);

module.exports = router;