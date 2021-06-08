const express = require('express');
const authController = require('../controllers/authController');
const configApiController = require('../controllers/configApiController');

const router = express.Router({ mergeParams: true });

router.use(authController.isLoggedIn);
router.use(authController.setDefPerms);

router
  .route('/')
  .get(configApiController.getAllConfigApis)
  .post(
    authController.requireLogin,
    authController.restrictTo('admin'),
    configApiController.createConfigApi
  );

router
  .route('/:id')
  .get(configApiController.getConfigApi)
  .patch(
    authController.requireLogin,
    authController.restrictTo('admin'),
    configApiController.updateConfigApi
  )
  .delete(
    authController.requireLogin,
    authController.restrictTo('admin'),
    configApiController.deleteConfigApi
  );

module.exports = router;
