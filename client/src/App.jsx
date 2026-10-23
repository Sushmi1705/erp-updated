import lazyWithReload from './utils/lazyWithReload';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const Login = lazyWithReload(() => import('./pages/auth/Login'));
const Dashboard = lazyWithReload(() => import('./pages/dashboard/Dashboard'));
const ReportsHub = lazyWithReload(() => import('./pages/dashboards/ReportsHub'));
const IssueQueue = lazyWithReload(() => import('./pages/audit/IssueQueue'));
const CEODashboard = lazyWithReload(() => import('./pages/dashboards/CEODashboard'));
const SalesDashboard = lazyWithReload(() => import('./pages/dashboards/SalesDashboard'));
const ProcurementDashboard = lazyWithReload(() => import('./pages/dashboards/ProcurementDashboard'));
const InventoryDashboard = lazyWithReload(() => import('./pages/dashboards/InventoryDashboard'));
const ProductionDashboard = lazyWithReload(() => import('./pages/dashboards/ProductionDashboard'));
const QualityDashboard = lazyWithReload(() => import('./pages/dashboards/QualityDashboard'));
const MaintenanceDashboard = lazyWithReload(() => import('./pages/dashboards/MaintenanceDashboard'));

const CompanySetup = lazyWithReload(() => import('./pages/company/CompanySetup'));
const UserManagement = lazyWithReload(() => import('./pages/users/UserManagement'));
const RolesPermissions = lazyWithReload(() => import('./pages/roles/RolesPermissions'));
const ApprovalRights = lazyWithReload(() => import('./pages/roles/ApprovalRights'));
const AuditLogs = lazyWithReload(() => import('./pages/audit/AuditLogs'));
const ResetPassword = lazyWithReload(() => import('./pages/auth/ResetPassword'));
const ApprovalCenter = lazyWithReload(() => import('./pages/approvals/ApprovalCenter'));
const Unauthorized = lazyWithReload(() => import('./pages/auth/Unauthorized'));

// Master Data Imports
const CustomerMaster = lazyWithReload(() => import('./pages/master/CustomerMaster'));
const VendorMaster = lazyWithReload(() => import('./pages/master/VendorMaster'));
const ProductMaster = lazyWithReload(() => import('./pages/master/ProductMaster'));
const MaterialMaster = lazyWithReload(() => import('./pages/master/MaterialMaster'));
const UomMaster = lazyWithReload(() => import('./pages/master/UomMaster'));
const WarehouseMaster = lazyWithReload(() => import('./pages/master/WarehouseMaster'));
const MachineMaster = lazyWithReload(() => import('./pages/master/MachineMaster'));
const WorkCenterMaster = lazyWithReload(() => import('./pages/master/WorkCenterMaster'));
const SystemConfiguration = lazyWithReload(() => import('./pages/master/SystemConfiguration'));

// Engineering Management Imports
const BomMaster = lazyWithReload(() => import('./pages/engineering/BomMaster'));
const RoutingMaster = lazyWithReload(() => import('./pages/engineering/RoutingMaster'));
const EngineeringChange = lazyWithReload(() => import('./pages/engineering/EngineeringChange'));

// Sales Management Imports
const InquiryMaster = lazyWithReload(() => import('./pages/sales/InquiryMaster'));
const QuotationMaster = lazyWithReload(() => import('./pages/sales/QuotationMaster'));
const SalesOrderMaster = lazyWithReload(() => import('./pages/sales/SalesOrderMaster'));

// Demand Planning Imports
const DemandForecasting = lazyWithReload(() => import('./pages/demand/DemandForecasting'));
const DemandConsolidation = lazyWithReload(() => import('./pages/demand/DemandConsolidation'));

// MRP Imports
const MrpExecution = lazyWithReload(() => import('./pages/mrp/MrpExecution'));
const ShortageAnalysis = lazyWithReload(() => import('./pages/mrp/ShortageAnalysis'));
const MrpRecommendations = lazyWithReload(() => import('./pages/mrp/MrpRecommendations'));

// Capacity Planning Imports
const MachineCapacity = lazyWithReload(() => import('./pages/capacity/MachineCapacity'));
const LaborCapacity = lazyWithReload(() => import('./pages/capacity/LaborCapacity'));
const ProductionScheduling = lazyWithReload(() => import('./pages/capacity/ProductionScheduling'));

// Procurement Imports
const PurchaseRequisition = lazyWithReload(() => import('./pages/procurement/PurchaseRequisition'));
const RFQManagement = lazyWithReload(() => import('./pages/procurement/RFQManagement'));
const PurchaseOrder = lazyWithReload(() => import('./pages/procurement/PurchaseOrder'));
const VendorPerformance = lazyWithReload(() => import('./pages/procurement/VendorPerformance'));

// Goods Receipt Imports
const GoodsReceiptNote = lazyWithReload(() => import('./pages/goods-receipt/GoodsReceiptNote'));
const QualityInspection = lazyWithReload(() => import('./pages/goods-receipt/QualityInspection'));
const InventoryPosting = lazyWithReload(() => import('./pages/goods-receipt/InventoryPosting'));

// Inventory Management Imports
const InventoryControl = lazyWithReload(() => import('./pages/inventory/InventoryControl'));
const InventoryTransactions = lazyWithReload(() => import('./pages/inventory/InventoryTransactions'));
const InventoryOptimization = lazyWithReload(() => import('./pages/inventory/InventoryOptimization'));
const InventoryValuation = lazyWithReload(() => import('./pages/inventory/InventoryValuation'));
const TraceabilityManagement = lazyWithReload(() => import('./pages/inventory/TraceabilityManagement'));

// Production Management Imports
const ProductionPlanning = lazyWithReload(() => import('./pages/production/ProductionPlanning'));
const WorkOrderManagement = lazyWithReload(() => import('./pages/production/WorkOrderManagement'));
const MaterialAllocation = lazyWithReload(() => import('./pages/production/MaterialAllocation'));
const ProductionExecution = lazyWithReload(() => import('./pages/production/ProductionExecution'));
const ProductionOutput = lazyWithReload(() => import('./pages/production/ProductionOutput'));

// Shop Floor Management Imports
const OperatorManagement = lazyWithReload(() => import('./pages/shopfloor/OperatorManagement'));
const MachineUtilization = lazyWithReload(() => import('./pages/shopfloor/MachineUtilization'));
const DowntimeManagement = lazyWithReload(() => import('./pages/shopfloor/DowntimeManagement'));
const ScrapManagement = lazyWithReload(() => import('./pages/shopfloor/ScrapManagement'));

// Quality Management Imports
const IncomingQuality = lazyWithReload(() => import('./pages/quality/IncomingQuality'));
const InProcessQuality = lazyWithReload(() => import('./pages/quality/InProcessQuality'));
const FinalQuality = lazyWithReload(() => import('./pages/quality/FinalQuality'));
const QualityParameters = lazyWithReload(() => import('./pages/quality/QualityParameters'));
const NonConformanceManagement = lazyWithReload(() => import('./pages/quality/NonConformanceManagement'));
const QualityAnalytics = lazyWithReload(() => import('./pages/quality/QualityAnalytics'));

// Maintenance Management Imports
const PreventiveMaintenance = lazyWithReload(() => import('./pages/maintenance/PreventiveMaintenance'));
const BreakdownMaintenance = lazyWithReload(() => import('./pages/maintenance/BreakdownMaintenance'));
const SparePartsManagement = lazyWithReload(() => import('./pages/maintenance/SparePartsManagement'));
const MaintenanceAnalytics = lazyWithReload(() => import('./pages/maintenance/MaintenanceAnalytics'));

// Dispatch & Logistics Imports
const DispatchPlanning = lazyWithReload(() => import('./pages/dispatch/DispatchPlanning'));
const DispatchExecution = lazyWithReload(() => import('./pages/dispatch/DispatchExecution'));
const DeliveryTracking = lazyWithReload(() => import('./pages/dispatch/DeliveryTracking'));

// Finance & Accounting Imports
const AccountsReceivable = lazyWithReload(() => import('./pages/finance/AccountsReceivable'));
const AccountsPayable = lazyWithReload(() => import('./pages/finance/AccountsPayable'));
const GeneralLedger = lazyWithReload(() => import('./pages/finance/GeneralLedger'));
const TaxManagement = lazyWithReload(() => import('./pages/finance/TaxManagement'));
const FinancialStatements = lazyWithReload(() => import('./pages/finance/FinancialStatements'));
const CostAccounting = lazyWithReload(() => import('./pages/finance/CostAccounting'));

const GlobalLogoutHandler = () => {
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <GlobalLogoutHandler />
      <Suspense fallback={<div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',backgroundColor:'var(--bg-primary)'}}><div style={{width:'40px',height:'40px',borderRadius:'50%',border:'3px solid var(--border-color)',borderTopColor:'var(--accent-primary)',animation:'spin 1s linear infinite'}}/><style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              <Route path="issues" element={<ProtectedRoute requiredModule="Audit"><IssueQueue /></ProtectedRoute>} />
              <Route path="dashboards" element={<ReportsHub />} />
              <Route path="dashboards/ceo" element={<ProtectedRoute requiredModule="CEODashboard"><CEODashboard /></ProtectedRoute>} />
              <Route path="dashboards/sales" element={<SalesDashboard />} />
              <Route path="dashboards/procurement" element={<ProcurementDashboard />} />
              <Route path="dashboards/inventory" element={<InventoryDashboard />} />
              <Route path="dashboards/production" element={<ProductionDashboard />} />
              <Route path="dashboards/quality" element={<QualityDashboard />} />
              <Route path="dashboards/maintenance" element={<MaintenanceDashboard />} />
              <Route path="approvals" element={<ApprovalCenter />} />

              <Route path="company" element={<ProtectedRoute requiredModule="CompanySetup"><CompanySetup /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute requiredModule="UserManagement"><UserManagement /></ProtectedRoute>} />
              <Route path="roles" element={<ProtectedRoute requiredModule="RolesPermissions"><RolesPermissions /></ProtectedRoute>} />
              <Route path="approval-rights" element={<ApprovalRights />} />
              <Route path="audit" element={<ProtectedRoute requiredModule="AuditLogs"><AuditLogs /></ProtectedRoute>} />

              <Route path="master/customer" element={<CustomerMaster />} />
              <Route path="master/vendor" element={<VendorMaster />} />
              <Route path="master/product" element={<ProductMaster />} />
              <Route path="master/material" element={<MaterialMaster />} />
              <Route path="master/uom" element={<UomMaster />} />
              <Route path="master/warehouse" element={<WarehouseMaster />} />
              <Route path="master/machine" element={<MachineMaster />} />
              <Route path="master/workcenter" element={<WorkCenterMaster />} />
              <Route path="master/system-config" element={<SystemConfiguration />} />
              
              {/* Engineering Routes */}
              <Route path="engineering/bom" element={<BomMaster />} />
              <Route path="engineering/routing" element={<RoutingMaster />} />
              <Route path="engineering/change" element={<EngineeringChange />} />

              {/* Sales Routes */}
              <Route path="sales/inquiry" element={<InquiryMaster />} />
              <Route path="sales/quotation" element={<QuotationMaster />} />
              <Route path="sales/order" element={<SalesOrderMaster />} />

              {/* Demand Planning Routes */}
              <Route path="demand/forecasting" element={<DemandForecasting />} />
              <Route path="demand/consolidation" element={<DemandConsolidation />} />

              {/* MRP Routes */}
              <Route path="mrp/execution" element={<MrpExecution />} />
              <Route path="mrp/shortages" element={<ShortageAnalysis />} />
              <Route path="mrp/recommendations" element={<MrpRecommendations />} />

              {/* Capacity Planning Routes */}
              <Route path="capacity/machine" element={<MachineCapacity />} />
              <Route path="capacity/labor" element={<LaborCapacity />} />
              <Route path="capacity/schedule" element={<ProductionScheduling />} />

              {/* Procurement Routes */}
              <Route path="procurement/requisition" element={<PurchaseRequisition />} />
              <Route path="procurement/rfq" element={<RFQManagement />} />
              <Route path="procurement/po" element={<PurchaseOrder />} />
              <Route path="procurement/performance" element={<VendorPerformance />} />

              {/* Goods Receipt Routes */}
              <Route path="receipt/grn" element={<GoodsReceiptNote />} />
              <Route path="receipt/inspection" element={<QualityInspection />} />
              <Route path="receipt/inventory" element={<InventoryPosting />} />

              {/* Inventory Management Routes */}
              <Route path="inventory/control" element={<InventoryControl />} />
              <Route path="inventory/transactions" element={<InventoryTransactions />} />
              <Route path="inventory/optimization" element={<InventoryOptimization />} />
              <Route path="inventory/valuation" element={<InventoryValuation />} />
              <Route path="inventory/traceability" element={<TraceabilityManagement />} />

              {/* Production Management Routes */}
              <Route path="production/plan" element={<ProductionPlanning />} />
              <Route path="production/wo" element={<WorkOrderManagement />} />
              <Route path="production/allocation" element={<MaterialAllocation />} />
              <Route path="production/execution" element={<ProductionExecution />} />
              <Route path="production/output" element={<ProductionOutput />} />

              {/* Shop Floor Management Routes */}
              <Route path="shopfloor/operator" element={<OperatorManagement />} />
              <Route path="shopfloor/machine" element={<MachineUtilization />} />
              <Route path="shopfloor/downtime" element={<DowntimeManagement />} />
              <Route path="shopfloor/scrap" element={<ScrapManagement />} />

              {/* Quality Management Routes */}
              <Route path="quality/incoming" element={<IncomingQuality />} />
              <Route path="quality/in-process" element={<InProcessQuality />} />
              <Route path="quality/final" element={<FinalQuality />} />
              <Route path="quality/parameters" element={<QualityParameters />} />
              <Route path="quality/ncr" element={<NonConformanceManagement />} />
              <Route path="quality/analytics" element={<QualityAnalytics />} />

              {/* Maintenance Management Routes */}
              <Route path="maintenance/preventive" element={<PreventiveMaintenance />} />
              <Route path="maintenance/breakdown" element={<BreakdownMaintenance />} />
              <Route path="maintenance/sparepart" element={<SparePartsManagement />} />
              <Route path="maintenance/analytics" element={<MaintenanceAnalytics />} />

              {/* Dispatch & Logistics Routes */}
              <Route path="dispatch/planning" element={<DispatchPlanning />} />
              <Route path="dispatch/execution" element={<DispatchExecution />} />
              <Route path="dispatch/tracking" element={<DeliveryTracking />} />

              {/* Finance & Accounting Routes */}
              <Route path="finance/ar" element={<ProtectedRoute requiredModule="Finance"><AccountsReceivable /></ProtectedRoute>} />
              <Route path="finance/ap" element={<ProtectedRoute requiredModule="Finance"><AccountsPayable /></ProtectedRoute>} />
              <Route path="finance/ledger" element={<ProtectedRoute requiredModule="Finance"><GeneralLedger /></ProtectedRoute>} />
              <Route path="finance/tax" element={<ProtectedRoute requiredModule="Finance"><TaxManagement /></ProtectedRoute>} />
              <Route path="finance/statements" element={<ProtectedRoute requiredModule="Finance"><FinancialStatements /></ProtectedRoute>} />
              <Route path="finance/costing" element={<ProtectedRoute requiredModule="Finance"><CostAccounting /></ProtectedRoute>} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
