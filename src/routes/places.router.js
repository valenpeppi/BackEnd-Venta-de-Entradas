const express = require('express');
const router = express.Router();
const { getAllPlaces} = require('../controllers/places.controller');


router.get('/', getAllPlaces);

module.exports = router;
