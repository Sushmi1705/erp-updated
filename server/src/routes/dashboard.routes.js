const express = require('express');
const router = express.Router();
const { protect, requirePermission } = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const reports = require('../controllers/report.controller');

// Every dashboard endpoint returns company-wide figures — revenue, profit,
// order book, customer names. Left commented out, they answered 200 to anyone
// who could reach the server, with no token at all.
router.use(protect);

// stats and launchpad back the universal Dashboard landing page every role
// sees — Sidebar.jsx leaves that entry untagged on purpose — so they stay
// open to any authenticated user. Each named report is one department's
// figures and is gated to that department, same as the sidebar link that
// leads to it: a Quality Inspector has no more reason to pull the Sales
// report through the API than to find it in their menu.
router.get('/stats', dashboardController.getSystemStats);
router.get('/launchpad', dashboardController.getLaunchpad);
// "What needs attention" is filtered inside the controller to the modules
// the caller can read, so it is safe for every signed-in user.
router.get('/attention', reports.getAttention);
router.get('/ceo', requirePermission('Finance', 'read'), reports.getCompanyReport);
router.get('/sales', requirePermission('Sales', 'read'), reports.getSalesReport);
router.get('/procurement', requirePermission('Procurement', 'read'), reports.getPurchasingReport);
router.get('/inventory', requirePermission('Inventory', 'read'), reports.getStockReport);
router.get('/production', requirePermission('Production', 'read'), reports.getProductionReport);
router.get('/quality', requirePermission('Quality', 'read'), reports.getQualityReport);
router.get('/maintenance', requirePermission('Maintenance', 'read'), reports.getMaintenanceReport);

module.exports = router;
