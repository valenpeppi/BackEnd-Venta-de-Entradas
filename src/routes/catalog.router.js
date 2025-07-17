const express = require('express');
const router = express.Router();
const {getEventTypes, getPlaces, getSectorsByPlace} = require('../controllers/catalog.controller');

router.get('/event-types', getEventTypes);
router.get('/places', getPlaces);
router.get('/places/:idPlace/sectors', getSectorsByPlace);

module.exports = router;