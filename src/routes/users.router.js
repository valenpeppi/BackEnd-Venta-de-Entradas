const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, getAllPlaces} = require('../controllers/users.controller');


router.get('/', getAllUsers);
router.post('/', createUser);


module.exports = router;
