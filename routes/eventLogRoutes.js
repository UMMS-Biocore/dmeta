const express = require('express');
const authController = require('../controllers/authController');
const eventLogController = require('../controllers/eventLogController');

const router = express.Router();

router.use(authController.isLoggedIn);
router.use(authController.requireLogin);
router.use(authController.setDefPerms);

router
  .route('/admin')
  .get(
    authController.restrictTo('admin', 'project-admin'),
    eventLogController.getAllAdminEventLogs
  );
router
  .route('/admin/:id')
  .get(authController.restrictTo('admin', 'project-admin'), eventLogController.getAdminEventLog);

router.route('/').get(eventLogController.getAllEventLogs);
router.route('/:id').get(eventLogController.getEventLog);

module.exports = router;
