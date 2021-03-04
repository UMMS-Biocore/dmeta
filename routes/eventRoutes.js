const express = require('express');
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');

const router = express.Router({ mergeParams: true });

router.use(authController.isLoggedIn);
router.use(authController.setDefPerms);

router
  .route('/')
  .get(eventController.getAllEvents)
  .post(
    authController.requireLogin,
    authController.restrictTo('admin'),
    eventController.createEvent
  );

router
  .route('/:id')
  .get(eventController.getEvent)
  .patch(
    authController.requireLogin,
    authController.restrictTo('admin'),
    eventController.updateEvent
  )
  .delete(
    authController.requireLogin,
    authController.restrictTo('admin'),
    eventController.deleteEvent
  );

module.exports = router;
