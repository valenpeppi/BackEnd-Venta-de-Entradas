const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalog.controller');

router.get('/event-types', CatalogController.getEventTypes);
router.get('/places', CatalogController.getPlaces);
router.get('/places/:idPlace/sectors', CatalogController.getSectorsByPlace);

module.exports = router;