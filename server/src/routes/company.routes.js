const express = require('express');
const { 
  getPlants, createPlant, updatePlant, deletePlant,
  getBranches, createBranch, updateBranch,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
  getCostCenters, createCostCenter, updateCostCenter, deleteCostCenter,
  getBusinessUnits, createBusinessUnit, updateBusinessUnit, deleteBusinessUnit,
  getCompanyProfiles, createCompanyProfile, updateCompanyProfile, deleteCompanyProfile,
  getOrganizationTree
} = require('../controllers/company.controller');
const { protect, requirePermission } = require('../middlewares/auth.middleware');
const { logActivity } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

// Organization Tree & Architecture Overview
router.get('/tree', getOrganizationTree);

router.route('/profiles')
  .get(requirePermission('CompanySetup', 'read'), getCompanyProfiles)
  .post(requirePermission('CompanySetup', 'create'), logActivity('CompanyProfile'), createCompanyProfile);
router.route('/profiles/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('CompanyProfile'), updateCompanyProfile)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('CompanyProfile'), deleteCompanyProfile);

// Dynamic routes for typical entities (GET open to authenticated users for dropdown references)
router.route('/plants')
  .get(getPlants)
  .post(requirePermission('CompanySetup', 'create'), logActivity('Plant'), createPlant);
router.route('/plants/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('Plant'), updatePlant)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('Plant'), deletePlant);

router.route('/departments')
  .get(getDepartments)
  .post(requirePermission('CompanySetup', 'create'), logActivity('Department'), createDepartment);
router.route('/departments/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('Department'), updateDepartment)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('Department'), deleteDepartment);

router.route('/branches')
  .get(getBranches)
  .post(requirePermission('CompanySetup', 'create'), logActivity('Branch'), createBranch);
router.put('/branches/:id', requirePermission('CompanySetup', 'update'), logActivity('Branch'), updateBranch);

router.route('/warehouses')
  .get(getWarehouses)
  .post(requirePermission('CompanySetup', 'create'), logActivity('Warehouse'), createWarehouse);
router.route('/warehouses/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('Warehouse'), updateWarehouse)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('Warehouse'), deleteWarehouse);

router.route('/cost-centers')
  .get(getCostCenters)
  .post(requirePermission('CompanySetup', 'create'), logActivity('CostCenter'), createCostCenter);
router.route('/cost-centers/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('CostCenter'), updateCostCenter)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('CostCenter'), deleteCostCenter);

router.route('/business-units')
  .get(getBusinessUnits)
  .post(requirePermission('CompanySetup', 'create'), logActivity('BusinessUnit'), createBusinessUnit);
router.route('/business-units/:id')
  .put(requirePermission('CompanySetup', 'update'), logActivity('BusinessUnit'), updateBusinessUnit)
  .delete(requirePermission('CompanySetup', 'delete'), logActivity('BusinessUnit'), deleteBusinessUnit);

module.exports = router;
