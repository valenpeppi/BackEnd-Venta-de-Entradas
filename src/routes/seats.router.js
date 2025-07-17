const express = require('express');
const router = express.Router();
const SeatsController = require('../controllers/seats.controller');

// Público
router.get('/availability', SeatsController.getAvailableSeats);

// Admin
router.put('/:idPlace/:idSector/:idSeat', SeatsController.updateSeatState);

module.exports = router;