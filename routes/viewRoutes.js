const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/receivetoken', authController.ssoReceiveToken);

router.use(authController.isLoggedInView);
router.get('/', viewsController.getOverview);
router.get('/admin-overview', viewsController.getAdminOverview);
router.get('/after-sso', viewsController.afterSSO);
router.get('/login', viewsController.getLoginForm, viewsController.getOverview);
router.get('/import', viewsController.getImportPage);
router.get('/profile', authController.requireLogin, viewsController.getProfile);

module.exports = router;
