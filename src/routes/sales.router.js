const express = require('express');
const router = express.Router();
const SalesController = require('../controllers/sales.controller');
const { validateSale } = require('../middlewares/validators');  //falta hacerlo
const { authMiddleware } = require('../middlewares/auth');    //falta hacerlo

// Rutas protegidas por autenticación
router.post('/', authMiddleware, validateSale, SalesController.createSale);
router.get('/client/:dniClient', authMiddleware, SalesController.getSalesByClient);

module.exports = router;