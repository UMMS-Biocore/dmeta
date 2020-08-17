const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protect all routes after this middleware
router.use(authController.protect);
router.get('/me', userController.getMe, userController.getUser);

module.exports = router;
