const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { Plant, Department, CostCenter, BusinessUnit, Company } = require('../models/CompanyStructure');
const { Warehouse } = require('../models/MasterWarehouse');

// Generic helper for simple CRUD
const getGeneric = (Model, populates = []) => async (req, res) => {
  try {
    let query = Model.find();
    populates.forEach(p => { query = query.populate(p); });
    const data = await query;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    handleError(res, error);
  }
};

// Organization structure masters save directly — no approval required.
// Approval workflow applies only to transactional documents (PO, SO, GRN, etc.)
const createGeneric = (Model) => async (req, res) => {
  try {
    const data = await Model.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

const updateGeneric = (Model) => async (req, res) => {
  try {
    const data = await Model.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
};

const deleteGeneric = (Model, entityName) => async (req, res) => {
  try {
    const record = await Model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Referential integrity guard
    if (entityName === 'Company') {
      const buCount = await BusinessUnit.countDocuments({ companyId: req.params.id });
      const plantCount = await Plant.countDocuments({ companyId: req.params.id });
      if (buCount > 0 || plantCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete company: ${buCount} business units and ${plantCount} plants are linked to it. Reassign or remove them first.`
        });
      }
    } else if (entityName === 'Plant') {
      const deptCount = await Department.countDocuments({ plantId: req.params.id });
      const whCount = await Warehouse.countDocuments({ plantId: req.params.id });
      if (deptCount > 0 || whCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete plant: ${deptCount} departments and ${whCount} warehouses are linked to it. Reassign or remove them first.`
        });
      }
    } else if (entityName === 'BusinessUnit') {
      const plantCount = await Plant.countDocuments({ businessUnitId: req.params.id });
      if (plantCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete business unit: ${plantCount} plants are linked to it. Reassign or remove them first.`
        });
      }
    }

    await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: `${entityName} deleted successfully` });
  } catch (error) {
    handleError(res, error);
  }
};

// Organization Tree Structure API (Aggregated hierarchy)
exports.getOrganizationTree = async (req, res) => {
  try {
    const [companies, bus, plants, depts, whs, ccs] = await Promise.all([
      Company.find().lean(),
      BusinessUnit.find().populate('companyId', 'name code').lean(),
      Plant.find().populate('companyId', 'name code').populate('businessUnitId', 'name code').lean(),
      Department.find().populate('plantId', 'name code').lean(),
      Warehouse.find().populate('plantId', 'name code').lean(),
      CostCenter.find().lean()
    ]);

    // Build hierarchical tree
    const tree = companies.map(comp => {
      const compBUs = bus.filter(b => b.companyId && String(b.companyId._id || b.companyId) === String(comp._id));
      const compPlants = plants.filter(p => p.companyId && String(p.companyId._id || p.companyId) === String(comp._id));

      const buTree = compBUs.map(bu => {
        const buPlants = compPlants.filter(p => p.businessUnitId && String(p.businessUnitId._id || p.businessUnitId) === String(bu._id));
        const plantsWithChildren = buPlants.map(p => {
          const plantDepts = depts.filter(d => d.plantId && String(d.plantId._id || d.plantId) === String(p._id));
          const plantWhs = whs.filter(w => w.plantId && String(w.plantId._id || w.plantId) === String(p._id));
          return {
            ...p,
            departments: plantDepts,
            warehouses: plantWhs,
            stats: {
              departmentCount: plantDepts.length,
              warehouseCount: plantWhs.length
            }
          };
        });
        return {
          ...bu,
          plants: plantsWithChildren,
          stats: { plantCount: plantsWithChildren.length }
        };
      });

      return {
        ...comp,
        businessUnits: buTree,
        totalPlants: compPlants.length,
        stats: {
          buCount: compBUs.length,
          plantCount: compPlants.length
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        tree,
        counts: {
          companies: companies.length,
          businessUnits: bus.length,
          plants: plants.length,
          departments: depts.length,
          warehouses: whs.length,
          costCenters: ccs.length
        }
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Companies
exports.getCompanyProfiles = getGeneric(Company);
exports.createCompanyProfile = createGeneric(Company);
exports.updateCompanyProfile = updateGeneric(Company);
exports.deleteCompanyProfile = deleteGeneric(Company, 'Company');

// Business Units
exports.getBusinessUnits = getGeneric(BusinessUnit, ['companyId']);
exports.createBusinessUnit = createGeneric(BusinessUnit);
exports.updateBusinessUnit = updateGeneric(BusinessUnit);
exports.deleteBusinessUnit = deleteGeneric(BusinessUnit, 'BusinessUnit');

// Plants
exports.getPlants = getGeneric(Plant, ['companyId', 'businessUnitId', 'warehouseId']);
exports.createPlant = createGeneric(Plant);
exports.updatePlant = updateGeneric(Plant);
exports.deletePlant = deleteGeneric(Plant, 'Plant');

// Departments
exports.getDepartments = getGeneric(Department, ['plantId']);
exports.createDepartment = createGeneric(Department);
exports.updateDepartment = updateGeneric(Department);
exports.deleteDepartment = deleteGeneric(Department, 'Department');

// Warehouses (Still kept here for backward compatibility in routing if needed, but belongs to Warehouse structure ideally)
exports.getWarehouses = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role && req.user.role.name !== 'Super Admin' && req.user.plantId) {
      query.plantId = req.user.plantId;
    }
    const warehouses = await Warehouse.find(query).populate('plantId', 'name code');
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    handleError(res, error);
  }
};
exports.createWarehouse = createGeneric(Warehouse);
exports.updateWarehouse = updateGeneric(Warehouse);
exports.deleteWarehouse = deleteGeneric(Warehouse, 'Warehouse');

// Cost Centers
exports.getCostCenters = getGeneric(CostCenter);
exports.createCostCenter = createGeneric(CostCenter);
exports.updateCostCenter = updateGeneric(CostCenter);
exports.deleteCostCenter = deleteGeneric(CostCenter, 'CostCenter');

// Legacy Branches (Disabled/Stubbed to avoid route crashes)
exports.getBranches = async (req, res) => {
  res.status(200).json({ success: true, count: 0, data: [] });
};
exports.createBranch = async (req, res) => {
  res.status(400).json({ success: false, message: 'Branch is deprecated' });
};
exports.updateBranch = async (req, res) => {
  res.status(400).json({ success: false, message: 'Branch is deprecated' });
};
