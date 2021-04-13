const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);
router.get('/me', userController.getMe, userController.getUser);

router
  .get('/useridwithemail/:email', userController.getUserIDWithEmail)
  .get('/emailwithuserid/:userid', userController.getEmailWithUserID);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
