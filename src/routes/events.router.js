const express = require('express');
const router = express.Router();
const {createEvent, getAllEvents} = require('../controllers/events.controller');
const { validateEvent } = require('../middlewares/validators');

router.post('/', validateEvent, createEvent);
router.get('/', getAllEvents);

module.exports = router;