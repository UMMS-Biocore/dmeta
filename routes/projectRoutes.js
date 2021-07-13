const express = require('express');
const authController = require('../controllers/authController');
const projectsController = require('../controllers/projectsController');
const collectionsController = require('../controllers/collectionsController');
const eventLogController = require('../controllers/eventLogController');
const collectionsRouter = require('./collectionsRoutes');
const dataRouter = require('./dataRoutes');

const router = express.Router({ mergeParams: true });

router.use(authController.isLoggedIn);
router.use(authController.setDefPerms);

router.use('/:projectID/collections', collectionsController.setFilter, collectionsRouter);
router.use('/:projectName/data', dataRouter);

router
  .route('/')
  .get(projectsController.getAllProjects)
  .post(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    // projectsController.setAfter,
    eventLogController.setAdminEventLog('project'),
    projectsController.createProject
  );

router
  .route('/:id')
  .get(projectsController.getProject)
  .patch(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    // projectsController.setAfter,
    eventLogController.setAdminEventLog('project'),
    projectsController.updateProject
  )
  .delete(
    authController.requireLogin,
    authController.restrictTo('admin', 'project-admin'),
    // projectsController.setAfter,
    eventLogController.setAdminEventLog('project'),
    projectsController.deleteProject
  );

module.exports = router;
