const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/sales.controller');

// Rutas protegidas por autenticación
router.post('/', SalesController.createSale);
router.get('/client/:dniClient', SalesController.getSalesByClient);

module.exports = router;