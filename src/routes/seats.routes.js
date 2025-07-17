const express = require('express');
const router = express.Router();
const SeatsController = require('../controllers/seats.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');    //falta hacerlo

// Público
router.get('/availability', SeatsController.getAvailableSeats);

// Admin
router.put('/:idPlace/:idSector/:idSeat', 
  authMiddleware, 
  adminMiddleware, 
  SeatsController.updateSeatState
);

module.exports = router;