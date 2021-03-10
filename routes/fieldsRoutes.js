const express = require('express');
const authController = require('../controllers/authController');

const fieldsController = require('../controllers/fieldsController');

const router = express.Router({ mergeParams: true });

router.use(authController.isLoggedIn);
router.use(authController.setDefPerms);

router
  .route('/transfer')
  .post(authController.requireLogin, authController.restrictTo('admin'), fieldsController.transfer);

router
  .route('/')
  .get(fieldsController.getAllFields)
  .post(
    authController.requireLogin,
    authController.restrictTo('admin'),
    fieldsController.setCollectionId,
    fieldsController.setAfter,
    fieldsController.createField
  );

router
  .route('/:id')
  .get(fieldsController.getField)
  .patch(
    authController.requireLogin,
    authController.restrictTo('admin'),
    fieldsController.setAfter,
    fieldsController.updateField
  )
  .delete(
    authController.requireLogin,
    authController.restrictTo('admin'),
    fieldsController.setAfter,
    fieldsController.deleteField
  );

module.exports = router;
