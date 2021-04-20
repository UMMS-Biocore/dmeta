const express = require('express');
const authController = require('../controllers/authController');
const collectionsController = require('../controllers/collectionsController');
const fieldsController = require('../controllers/fieldsController');
const fieldsRouter = require('./fieldsRoutes');

const router = express.Router();

router.use(authController.isLoggedIn);
router.use(authController.setDefPerms);

router.use('/:collectionID/fields', fieldsController.setFilter, fieldsRouter);

router
  .route('/')
  .get(collectionsController.getAllCollections)
  .post(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    collectionsController.setAfter,
    collectionsController.createCollection
  );

router
  .route('/:id')
  .get(collectionsController.getCollection)
  .patch(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    collectionsController.setBefore,
    collectionsController.setAfter,
    collectionsController.updateCollection
  )
  .delete(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    collectionsController.setBefore,
    collectionsController.setAfter,
    collectionsController.deleteCollection
  );

module.exports = router;
