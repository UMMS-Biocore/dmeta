const express = require('express');
const dataController = require('../controllers/dataController');
const authController = require('../controllers/authController');
const eventLogController = require('../controllers/eventLogController');

const router = express.Router({ mergeParams: true });

router.use(authController.setDefPerms);
router.use(authController.isLoggedIn);

router
  .route('/:collectionName/format/:format')
  .get(dataController.setExcludeFields, dataController.getFormatData);

router
  .route('/:collectionName/summary')
  .get(dataController.setExcludeFields, dataController.getDataSummary);
router
  .route('/:collectionName/detailed')
  .get(dataController.setExcludeFields, dataController.getDataDetailed);
router
  .route('/:collectionName/populated')
  .get(dataController.setExcludeFields, dataController.getDataPopulated);

router
  .route('/:collectionName')
  .get(dataController.setExcludeFields, dataController.setModel, dataController.getAllData)
  .post(
    authController.requireLogin,
    dataController.setModel,
    eventLogController.setEventLog('data'),
    dataController.createData
  );

router
  .route('/:collectionName/:id')
  .get(dataController.setExcludeFields, dataController.setModel, dataController.getData)
  .patch(
    authController.requireLogin,
    dataController.setExcludeFields,
    dataController.setModel,
    eventLogController.setEventLog('data'),
    dataController.updateData
  )
  .delete(
    authController.requireLogin,
    dataController.setModel,
    eventLogController.setEventLog('data'),
    dataController.deleteData
  );

module.exports = router;
