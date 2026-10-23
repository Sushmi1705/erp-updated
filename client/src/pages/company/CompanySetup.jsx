import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Building,
  Building2,
  Factory,
  Warehouse,
  Coins,
  Briefcase,
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Copy,
  Check,
  ChevronRight,
  GitFork,
  Network,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};

const LEVEL = {
  profiles: {
    one: 'company',
    many: 'companies',
    title: 'Legal Entities & Corporate Profiles',
    blurb: 'Your registered legal entities, GSTIN, PAN, and corporate offices. Every plant and invoice links to a company.',
    icon: Building
  },
  business_units: {
    one: 'business unit',
    many: 'business units',
    title: 'Operating Business Units & Divisions',
    blurb: 'Major divisions inside the corporation (e.g., Sheet Metal Division, Automotive Components Division).',
    icon: Briefcase
  },
  plants: {
    one: 'plant',
    many: 'plants',
    title: 'Manufacturing Plants & Facilities',
    blurb: 'Physical manufacturing sites and stamping plants. Machines, production lines, and stores sit under a plant.',
    icon: Factory
  },
  departments: {
    one: 'department',
    many: 'departments',
    title: 'Plant Departments & Production Cells',
    blurb: 'Operational sections inside the plant — press shop, weld & assembly, tool room, quality, and stores.',
    icon: Users
  },
  warehouses: {
    one: 'warehouse',
    many: 'warehouses',
    title: 'Central Stores & Storage Warehouses',
    blurb: 'Stock-holding locations and storage hubs (Raw Materials, WIP, Finished Goods, Tool Crib).',
    icon: Warehouse
  },
  cost_centers: {
    one: 'cost centre',
    many: 'cost centres',
    title: 'Cost Centres & Financial Allocation',
    blurb: 'Accounting cost centres for spend booking, ledger allocation, and manufacturing expense tracking.',
    icon: Coins
  }
};

const WAREHOUSE_TYPES = ['Raw Material', 'WIP', 'Finished Goods', 'Consumables & Spares', 'Scrap Yard', 'General Store'];

const CompanySetup = () => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('profiles');
  const [viewMode, setViewMode] = useState('directory'); // 'directory' | 'tree'
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Core Data Lists
  const [data, setData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [treeData, setTreeData] = useState(null);

  // States
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');

  // Load active tab data and references
  useEffect(() => {
    fetchData();
    fetchAllReferences();
  }, [activeTab]);

  useEffect(() => {
    if (viewMode === 'tree') {
      fetchTree();
    }
  }, [viewMode]);

  const fetchAllReferences = async () => {
    try {
      const [compRes, buRes, plantRes, deptRes, whRes, ccRes] = await Promise.all([
        axios.get('/company/profiles'),
        axios.get('/company/business-units'),
        axios.get('/company/plants'),
        axios.get('/company/departments'),
        axios.get('/company/warehouses'),
        axios.get('/company/cost-centers')
      ]);
      setCompanies(compRes.data.data || []);
      setBusinessUnits(buRes.data.data || []);
      setPlants(plantRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setCostCenters(ccRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch references', err);
    }
  };

  const fetchTree = async () => {
    setTreeLoading(true);
    try {
      const res = await axios.get('/company/tree');
      setTreeData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch organization tree', err);
    } finally {
      setTreeLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'profiles':
          endpoint = '/company/profiles';
          break;
        case 'business_units':
          endpoint = '/company/business-units';
          break;
        case 'plants':
          endpoint = '/company/plants';
          break;
        case 'departments':
          endpoint = '/company/departments';
          break;
        case 'warehouses':
          endpoint = '/company/warehouses';
          break;
        case 'cost_centers':
          endpoint = '/company/cost-centers';
          break;
      }
      if (endpoint) {
        const res = await axios.get(endpoint);
        const fetchedData = res.data.data || [];
        setData(fetchedData);
        // If selectedRecord was set, update it with fresh data
        if (selectedRecord) {
          const match = fetchedData.find(item => item._id === selectedRecord._id);
          if (match) setSelectedRecord(match);
        }
      }
    } catch (err) {
      console.error(err);
      notify.error('Failed to load company setup records');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    notify.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'profiles':
          endpoint = '/company/profiles';
          break;
        case 'business_units':
          endpoint = '/company/business-units';
          break;
        case 'plants':
          endpoint = '/company/plants';
          break;
        case 'departments':
          endpoint = '/company/departments';
          break;
        case 'warehouses':
          endpoint = '/company/warehouses';
          break;
        case 'cost_centers':
          endpoint = '/company/cost-centers';
          break;
        default:
          setSaving(false);
          return;
      }

      const payload = { ...formData };

      // Clean up empty strings for unique sparse fields
      if (activeTab === 'profiles') {
        if (!payload.gst || payload.gst.trim() === '') delete payload.gst;
      }

      if (editingId) {
        await axios.put(`${endpoint}/${editingId}`, payload);
        notify.success(`${LEVEL[activeTab].one.toUpperCase()} updated successfully`);
      } else {
        await axios.post(endpoint, payload);
        notify.success(`New ${LEVEL[activeTab].one} created successfully`);
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
      fetchAllReferences();
      if (viewMode === 'tree') fetchTree();
    } catch (err) {
      console.error('Save error:', err);
      notify.error(err.response?.data?.message || err.message || 'Error saving data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    const editData = { ...row };
    if (editData.companyId && editData.companyId._id) editData.companyId = editData.companyId._id;
    if (editData.businessUnitId && editData.businessUnitId._id) editData.businessUnitId = editData.businessUnitId._id;
    if (editData.plantId && editData.plantId._id) editData.plantId = editData.plantId._id;
    setFormData(editData);
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    const entityName = LEVEL[activeTab].one;
    const confirmed = await confirmAction(
      `Delete ${entityName} "${row.name}" (${row.code})? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'profiles':
          endpoint = '/company/profiles';
          break;
        case 'business_units':
          endpoint = '/company/business-units';
          break;
        case 'plants':
          endpoint = '/company/plants';
          break;
        case 'departments':
          endpoint = '/company/departments';
          break;
        case 'warehouses':
          endpoint = '/company/warehouses';
          break;
        case 'cost_centers':
          endpoint = '/company/cost-centers';
          break;
      }
      await axios.delete(`${endpoint}/${row._id}`);
      notify.success(`${entityName} deleted successfully`);
      if (selectedRecord && selectedRecord._id === row._id) {
        setSelectedRecord(null);
      }
      fetchData();
      fetchAllReferences();
      if (viewMode === 'tree') fetchTree();
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to delete ${entityName}`);
    }
  };

  const toggleStatus = async (row) => {
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'profiles':
          endpoint = '/company/profiles';
          break;
        case 'business_units':
          endpoint = '/company/business-units';
          break;
        case 'plants':
          endpoint = '/company/plants';
          break;
        case 'departments':
          endpoint = '/company/departments';
          break;
        case 'warehouses':
          endpoint = '/company/warehouses';
          break;
        case 'cost_centers':
          endpoint = '/company/cost-centers';
          break;
      }
      const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';
      await axios.put(`${endpoint}/${row._id}`, { status: newStatus });
      notify.success(`Status updated to ${newStatus}`);
      fetchData();
      fetchAllReferences();
      if (viewMode === 'tree') fetchTree();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const openCreate = () => {
    let codePrefix = 'CMP-';
    switch (activeTab) {
      case 'plants':
        codePrefix = 'PLNT-';
        break;
      case 'departments':
        codePrefix = 'DEPT-';
        break;
      case 'warehouses':
        codePrefix = 'WRHS-';
        break;
      case 'cost_centers':
        codePrefix = 'CC-';
        break;
      case 'business_units':
        codePrefix = 'BU-';
        break;
      case 'profiles':
        codePrefix = 'CMP-';
        break;
    }
    const randomCode = codePrefix + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Smart pre-fills
    const defaults = {
      code: randomCode,
      status: 'Active',
      currency: 'INR',
      timeZone: 'Asia/Kolkata',
      country: 'India',
      state: 'Tamil Nadu',
      fiscalYear: 'Apr-Mar'
    };

    if (activeTab === 'business_units' || activeTab === 'plants') {
      if (companies.length === 1) defaults.companyId = companies[0]._id;
    }
    if (activeTab === 'plants' && businessUnits.length === 1) {
      defaults.businessUnitId = businessUnits[0]._id;
    }
    if ((activeTab === 'departments' || activeTab === 'warehouses') && plants.length === 1) {
      defaults.plantId = plants[0]._id;
    }

    setFormData(defaults);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      notify.error('No data to export');
      return;
    }
    const headers = Object.keys(filteredData[0]).filter(k => typeof filteredData[0][k] !== 'object');
    const rows = filteredData.map(row =>
      headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success(`Exported ${filteredData.length} records to CSV`);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const codeMatch = (item.code || '').toLowerCase().includes(q);
        const gstMatch = (item.gst || '').toLowerCase().includes(q);
        const panMatch = (item.pan || '').toLowerCase().includes(q);
        const addrMatch = (item.address || '').toLowerCase().includes(q);
        const parentPlantMatch = (item.plantId?.name || '').toLowerCase().includes(q);
        const parentCompMatch = (item.companyId?.name || '').toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !gstMatch && !panMatch && !addrMatch && !parentPlantMatch && !parentCompMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Company filter
      if (companyFilter !== 'all') {
        const cId = item.companyId?._id || item.companyId || (activeTab === 'profiles' ? item._id : null);
        if (cId !== companyFilter) return false;
      }

      // Plant filter
      if (plantFilter !== 'all') {
        const pId = item.plantId?._id || item.plantId || (activeTab === 'plants' ? item._id : null);
        if (pId !== plantFilter) return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter, companyFilter, plantFilter, activeTab]);

  const level = LEVEL[activeTab];
  const addLabel = `+ Add ${level.one}`;

  const tabs = [
    { id: 'profiles', label: 'Companies', count: companies.length, icon: Building },
    { id: 'business_units', label: 'Business units', count: businessUnits.length, icon: Briefcase },
    { id: 'plants', label: 'Plants', count: plants.length, icon: Factory },
    { id: 'departments', label: 'Departments', count: departments.length, icon: Users },
    { id: 'warehouses', label: 'Warehouses', count: warehouses.length, icon: Warehouse },
    { id: 'cost_centers', label: 'Cost centres', count: costCenters.length, icon: Coins }
  ];

  // Column definitions for DataTable
  const getColumns = () => {
    const baseCols = [
      {
        header: 'Entity / Record Name',
        accessor: 'name',
        render: row => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-primary-subtle, #eff6ff)',
                color: 'var(--accent-primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
                border: '1px solid rgba(37, 99, 235, 0.2)'
              }}
            >
              {row.name ? row.name.substring(0, 2).toUpperCase() : 'EP'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {row.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Code: <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>{row.code}</span>
              </div>
            </div>
          </div>
        )
      }
    ];

    if (activeTab === 'profiles') {
      baseCols.push({
        header: 'GSTIN & Statutory',
        render: row => (
          row.gst ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-primary, #2563eb)',
                  backgroundColor: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                {row.gst}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(row.gst, 'GSTIN'); }}
                title="Copy GSTIN"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
              >
                <Copy size={12} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending registration</span>
          )
        )
      });
      baseCols.push({
        header: 'Location & State',
        render: row => (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div>{row.state ? `${row.state}, ${row.country || 'India'}` : (row.country || 'India')}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.address || 'Registered Head Office'}
            </div>
          </div>
        )
      });
      baseCols.push({
        header: 'Hierarchy Footprint',
        render: row => {
          const linkedPlants = plants.filter(p => (p.companyId?._id || p.companyId) === row._id);
          const linkedBUs = businessUnits.filter(b => (b.companyId?._id || b.companyId) === row._id);
          return (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge badge-subtle" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                {linkedBUs.length} {linkedBUs.length === 1 ? 'Division' : 'Divisions'}
              </span>
              <span className="badge badge-subtle" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                {linkedPlants.length} {linkedPlants.length === 1 ? 'Plant' : 'Plants'}
              </span>
            </div>
          );
        }
      });
    }

    if (activeTab === 'business_units') {
      baseCols.push({
        header: 'Parent Legal Entity',
        render: row => (
          <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '12px' }}>
            {row.companyId?.name || 'Unassigned'}
          </span>
        )
      });
      baseCols.push({
        header: 'Division Scope',
        render: row => (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {row.description || 'Automotive Manufacturing & Assembly'}
          </span>
        )
      });
      baseCols.push({
        header: 'Manufacturing Facilities',
        render: row => {
          const linkedPlants = plants.filter(p => (p.businessUnitId?._id || p.businessUnitId) === row._id);
          return (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {linkedPlants.length} Operating {linkedPlants.length === 1 ? 'Plant' : 'Plants'}
            </span>
          );
        }
      });
    }

    if (activeTab === 'plants') {
      baseCols.push({
        header: 'Company & Business Unit',
        render: row => (
          <div style={{ fontSize: '12px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.companyId?.name || '-'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.businessUnitId?.name || 'Central Unit'}</div>
          </div>
        )
      });
      baseCols.push({
        header: 'Site Location',
        render: row => (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.address || 'Industrial Manufacturing Zone'}
              </span>
            </div>
          </div>
        )
      });
      baseCols.push({
        header: 'Plant Sub-Units',
        render: row => {
          const linkedDepts = departments.filter(d => (d.plantId?._id || d.plantId) === row._id);
          const linkedWhs = warehouses.filter(w => (w.plantId?._id || w.plantId) === row._id);
          return (
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: '#475569' }}>
                {linkedDepts.length} Depts
              </span>
              <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '12px', color: '#b45309' }}>
                {linkedWhs.length} Stores
              </span>
            </div>
          );
        }
      });
    }

    if (activeTab === 'departments') {
      baseCols.push({
        header: 'Operating Plant',
        render: row => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Factory size={13} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 500, fontSize: '12px' }}>{row.plantId?.name || 'Unassigned'}</span>
          </div>
        )
      });
      baseCols.push({
        header: 'Shop Floor Section',
        render: row => {
          let roleTag = 'General Production';
          if (/press/i.test(row.name)) roleTag = 'Heavy Stamping & Pressing';
          else if (/weld|assembly/i.test(row.name)) roleTag = 'Robotic & Manual Welding';
          else if (/tool/i.test(row.name)) roleTag = 'Die & Tooling Maintenance';
          else if (/quality|qc/i.test(row.name)) roleTag = 'IATF 16949 Inspection Cell';
          else if (/store/i.test(row.name)) roleTag = 'Material Receipt & Issuance';
          return (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {roleTag}
            </span>
          );
        }
      });
    }

    if (activeTab === 'warehouses') {
      baseCols.push({
        header: 'Operating Plant',
        render: row => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Factory size={13} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 500, fontSize: '12px' }}>{row.plantId?.name || 'Unassigned'}</span>
          </div>
        )
      });
      baseCols.push({
        header: 'Storage Classification',
        render: row => {
          let color = '#0284c7';
          let bg = '#e0f2fe';
          const type = row.type || (/rm|raw/i.test(row.name) ? 'Raw Material' : /wip/i.test(row.name) ? 'WIP' : /fg|finished/i.test(row.name) ? 'Finished Goods' : 'General Store');
          if (type === 'Finished Goods') {
            color = '#15803d';
            bg = '#dcfce7';
          } else if (type === 'WIP') {
            color = '#b45309';
            bg = '#fef3c7';
          }
          return (
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: bg, color }}>
              {type}
            </span>
          );
        }
      });
    }

    if (activeTab === 'cost_centers') {
      baseCols.push({
        header: 'Accounting Heading',
        render: row => (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Financial Ledger & Cost Absorption Head
          </span>
        )
      });
    }

    baseCols.push({
      header: 'Status',
      render: row => <StatusBadge value={row.status === 'Active' ? 'Active' : 'Inactive'} />
    });

    return baseCols;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Page Title & Global Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Company & Operating Structure Setup
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#059669',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              IATF 16949 & GST COMPLIANT
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '850px' }}>
            Define corporate legal entities, GSTIN registrations, multi-plant stamping sites, manufacturing departments,
            central raw-material & FG warehouses, and financial cost centres.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            <button
              onClick={() => setViewMode('directory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'directory' ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === 'directory' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'directory' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Building2 size={14} /> Master Directory
            </button>
            <button
              onClick={() => setViewMode('tree')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: viewMode === 'tree' ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === 'tree' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Network size={14} /> Organization Hierarchy Tree
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              fetchData();
              fetchAllReferences();
              if (viewMode === 'tree') fetchTree();
              notify.success('Structure synchronized with backend');
            }}
            title="Reload latest structure from database"
          >
            <RefreshCw size={13} className={loading || treeLoading ? 'animate-spin' : ''} /> Sync Structure
          </button>

          <button
            className="btn btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <Plus size={15} /> {addLabel}
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          onClick={() => { setActiveTab('profiles'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'profiles' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'profiles' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>Legal Entities</span>
            <Building size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {companies.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corporate GSTIN registrations</div>
        </div>

        <div
          onClick={() => { setActiveTab('business_units'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'business_units' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'business_units' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b21a8' }}>Business Units</span>
            <Briefcase size={16} style={{ color: '#9333ea' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {businessUnits.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operating divisions</div>
        </div>

        <div
          onClick={() => { setActiveTab('plants'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'plants' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'plants' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>Manufacturing Plants</span>
            <Factory size={16} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {plants.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Press & assembly facilities</div>
        </div>

        <div
          onClick={() => { setActiveTab('departments'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'departments' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'departments' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#c2410c' }}>Departments</span>
            <Users size={16} style={{ color: '#ea580c' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {departments.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shop floor production cells</div>
        </div>

        <div
          onClick={() => { setActiveTab('warehouses'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'warehouses' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'warehouses' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0369a1' }}>Central Warehouses</span>
            <Warehouse size={16} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {warehouses.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RM, WIP & FG stores</div>
        </div>

        <div
          onClick={() => { setActiveTab('cost_centers'); setViewMode('directory'); }}
          style={{
            backgroundColor: activeTab === 'cost_centers' ? '#eff6ff' : 'var(--bg-primary)',
            border: activeTab === 'cost_centers' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cost Centres</span>
            <Coins size={16} style={{ color: '#64748b' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {costCenters.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Financial spend headings</div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'tree' ? (
        /* Visual Hierarchy Tree View */
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Enterprise Organizational Architecture
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Complete multi-tier parent-child relationship: Legal Entity → Business Division → Manufacturing Plant → Departments & Warehouses
              </p>
            </div>
            <button className="btn btn-secondary" onClick={fetchTree} disabled={treeLoading}>
              <RefreshCw size={13} className={treeLoading ? 'animate-spin' : ''} /> Refresh Tree
            </button>
          </div>

          {treeLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading enterprise hierarchy tree...
            </div>
          ) : !treeData || !treeData.tree || treeData.tree.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No organization tree available. Create companies and plants in the directory first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {treeData.tree.map((comp) => (
                <div
                  key={comp._id}
                  style={{
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    overflow: 'hidden'
                  }}
                >
                  {/* Company Root Header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#eff6ff',
                      borderBottom: '1px solid #bfdbfe',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}
                      >
                        <Building size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
                            {comp.name}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {comp.code}
                          </span>
                          <StatusBadge value={comp.status} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{comp.gst || 'Not registered'}</span> | {comp.address || 'Registered Office'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => {
                          setSelectedRecord(comp);
                          setActiveTab('profiles');
                          setViewMode('directory');
                        }}
                      >
                        <Eye size={13} /> View Dossier
                      </button>
                    </div>
                  </div>

                  {/* Business Units Container */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {comp.businessUnits && comp.businessUnits.length > 0 ? (
                      comp.businessUnits.map((bu) => (
                        <div
                          key={bu._id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            padding: '14px',
                            marginLeft: '16px',
                            borderLeft: '4px solid #8b5cf6'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Briefcase size={16} style={{ color: '#7c3aed' }} />
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {bu.name}
                              </span>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6d28d9', backgroundColor: '#f3e8ff', padding: '1px 6px', borderRadius: '4px' }}>
                                {bu.code}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {bu.plants ? bu.plants.length : 0} Plants
                            </span>
                          </div>

                          {/* Plants under this BU */}
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '14px' }}>
                            {bu.plants && bu.plants.length > 0 ? (
                              bu.plants.map((plant) => (
                                <div
                                  key={plant._id}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    backgroundColor: '#f8fafc',
                                    padding: '12px',
                                    borderLeft: '3px solid #10b981'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Factory size={15} style={{ color: '#059669' }} />
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
                                        {plant.name}
                                      </span>
                                      <span style={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#d1fae5', color: '#047857', padding: '1px 5px', borderRadius: '3px' }}>
                                        {plant.code}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {plant.address || 'Industrial Manufacturing Site'}
                                    </span>
                                  </div>

                                  {/* Sub wings: Departments and Warehouses */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                    {/* Departments */}
                                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                                        <Users size={12} /> Plant Departments ({plant.departments ? plant.departments.length : 0})
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {plant.departments && plant.departments.length > 0 ? (
                                          plant.departments.map(d => (
                                            <span key={d._id} style={{ fontSize: '11px', backgroundColor: '#ffedd5', color: '#9a3412', padding: '2px 6px', borderRadius: '4px' }}>
                                              {d.name}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>None registered</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Warehouses */}
                                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                                        <Warehouse size={12} /> Warehouses & Storage Stores ({plant.warehouses ? plant.warehouses.length : 0})
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {plant.warehouses && plant.warehouses.length > 0 ? (
                                          plant.warehouses.map(w => (
                                            <span key={w._id} style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                                              {w.name}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>None registered</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No plants registered under this business unit.
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>
                        No business units configured under this company yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tabular Master Directory View */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {/* Navigation Tabs Header */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              overflowX: 'auto',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '0 4px'
            }}
          >
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedRecord(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    border: 'none',
                    borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? 'var(--bg-primary)' : 'transparent',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <TabIcon size={16} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--border-color)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 700
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtering Bar */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  width: '100%',
                  maxWidth: '360px'
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={`Search ${level.many} by name, code, location...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none',
                    color: 'var(--text-primary)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                className="input-field"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '130px', padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active only</option>
                <option value="Inactive">Inactive only</option>
              </select>

              {/* Company Filter (for BUs, Plants, Depts, Warehouses) */}
              {activeTab !== 'profiles' && activeTab !== 'cost_centers' && (
                <select
                  className="input-field"
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                  style={{ width: '180px', padding: '5px 8px', fontSize: '12px' }}
                >
                  <option value="all">All Legal Entities</option>
                  {companies.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              )}

              {/* Plant Filter (for Depts, Warehouses) */}
              {(activeTab === 'departments' || activeTab === 'warehouses') && (
                <select
                  className="input-field"
                  value={plantFilter}
                  onChange={e => setPlantFilter(e.target.value)}
                  style={{ width: '160px', padding: '5px 8px', fontSize: '12px' }}
                >
                  <option value="all">All Plants</option>
                  {plants.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleExportCSV}
                title="Download CSV report"
                style={{ fontSize: '12px', padding: '5px 10px' }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          {/* Main Table & Selected Record Inspection Panel */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div
              style={{
                flex: selectedRecord ? '1 1 60%' : '1 1 100%',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-primary)',
                transition: 'flex 0.2s ease',
                padding: '12px'
              }}
            >
              <DataTable
                columns={getColumns()}
                data={filteredData}
                isLoading={loading}
                onRowClick={(row) => setSelectedRecord(row)}
                selectedRowId={selectedRecord?._id}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRetry={fetchData}
                emptyTitle={`No ${level.many} matching filter`}
                emptyMessage={level.blurb}
                emptyAction={
                  <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={14} /> {addLabel}
                  </button>
                }
                customActions={row => {
                  const active = row.status === 'Active';
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedRecord(row); }}
                        title="View Full Record Dossier"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          color: selectedRecord?._id === row._id ? 'var(--accent-primary)' : 'var(--text-muted)'
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(row); }}
                        title={active ? 'Deactivate record' : 'Activate record'}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          color: active ? 'var(--accent-danger)' : 'var(--accent-success)'
                        }}
                      >
                        {active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>
                    </div>
                  );
                }}
              />
            </div>

            {/* Slide-out Inspection Dossier Card */}
            {selectedRecord && (
              <div
                style={{
                  width: '380px',
                  maxWidth: '40%',
                  borderLeft: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  padding: '16px',
                  gap: '14px',
                  boxShadow: '-2px 0 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Dossier Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}
                    >
                      {selectedRecord.code?.substring(0, 3) || 'REC'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedRecord.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {LEVEL[activeTab].one.toUpperCase()} MASTER DOSSIER
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title="Close Inspector"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status</span>
                  <StatusBadge value={selectedRecord.status} />
                </div>

                {/* Identity & Statutory Group */}
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Registration & Identification
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Entity Code:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedRecord.code}</span>
                  </div>
                  {selectedRecord.gst && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>GSTIN:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                          {selectedRecord.gst}
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedRecord.gst, 'GSTIN')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          title="Copy GSTIN"
                        >
                          <Copy size={11} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedRecord.pan && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>PAN:</span>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedRecord.pan}</span>
                    </div>
                  )}
                  {selectedRecord.fiscalYear && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Fiscal Year:</span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.fiscalYear}</span>
                    </div>
                  )}
                  {selectedRecord.currency && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Currency:</span>
                      <span style={{ fontWeight: 600 }}>{selectedRecord.currency}</span>
                    </div>
                  )}
                </div>

                {/* Location & Contact Group */}
                {(selectedRecord.address || selectedRecord.email || selectedRecord.phone) && (
                  <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Location & Communication
                    </div>
                    {selectedRecord.address && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                        <MapPin size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{selectedRecord.address}</span>
                      </div>
                    )}
                    {selectedRecord.email && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{selectedRecord.email}</span>
                      </div>
                    )}
                    {selectedRecord.phone && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{selectedRecord.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hierarchy Relations */}
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Hierarchy Linkage
                  </div>
                  {activeTab === 'profiles' && (
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Linked Operating Plants:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {plants.filter(p => (p.companyId?._id || p.companyId) === selectedRecord._id).map(p => (
                          <span key={p._id} style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'plants' && (
                    <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>Parent Entity: <strong>{selectedRecord.companyId?.name || '-'}</strong></div>
                      <div>Division: <strong>{selectedRecord.businessUnitId?.name || '-'}</strong></div>
                    </div>
                  )}
                  {(activeTab === 'departments' || activeTab === 'warehouses') && (
                    <div style={{ fontSize: '12px' }}>
                      Parent Plant: <strong>{selectedRecord.plantId?.name || '-'}</strong>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 10px', justifyContent: 'center' }}
                    onClick={() => handleEdit(selectedRecord)}
                  >
                    <Edit2 size={13} /> Edit Record
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--accent-danger)' }}
                    onClick={() => handleDelete(selectedRecord)}
                    title="Delete record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Entity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingId ? 'Edit' : 'Create New'} ${level.one.toUpperCase()}`}
        maxWidth={760}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Basic Identity */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              1. Basic Identification
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Legal / Record Name *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder={`Official ${level.one} name`}
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Master Code *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Operational Status</label>
                <select
                  className="input-field"
                  value={formData.status || 'Active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {activeTab === 'warehouses' && (
                <div className="input-group">
                  <label className="input-label">Storage Classification</label>
                  <select
                    className="input-field"
                    value={formData.type || 'Raw Material'}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    {WAREHOUSE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'business_units' && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Division Description / Scope</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sheet metal stamping, robotic welding & chassis brackets"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Hierarchy Relationship */}
          {(activeTab === 'business_units' || activeTab === 'plants' || activeTab === 'departments' || activeTab === 'warehouses') && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                2. Enterprise Hierarchy Linkage
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {(activeTab === 'business_units' || activeTab === 'plants') && (
                  <div className="input-group">
                    <label className="input-label">Parent Company / Legal Entity *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.companyId || ''}
                      onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                    >
                      <option value="" disabled>Select parent company</option>
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                    {companies.length === 0 && (
                      <p style={hintStyle}>No companies configured yet. Please add a company first.</p>
                    )}
                  </div>
                )}

                {activeTab === 'plants' && (
                  <div className="input-group">
                    <label className="input-label">Parent Business Unit *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.businessUnitId || ''}
                      onChange={e => setFormData({ ...formData, businessUnitId: e.target.value })}
                    >
                      <option value="" disabled>Select division / BU</option>
                      {businessUnits.map(b => (
                        <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                    {businessUnits.length === 0 && (
                      <p style={hintStyle}>No business units found. Please configure a business unit first.</p>
                    )}
                  </div>
                )}

                {(activeTab === 'departments' || activeTab === 'warehouses') && (
                  <div className="input-group">
                    <label className="input-label">Operating Manufacturing Plant *</label>
                    <select
                      className="input-field"
                      required
                      value={formData.plantId || ''}
                      onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                    >
                      <option value="" disabled>Select parent plant</option>
                      {plants.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                    {plants.length === 0 && (
                      <p style={hintStyle}>No plants configured yet. Please create a plant first.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Statutory & Compliance (For Companies and Plants) */}
          {(activeTab === 'profiles' || activeTab === 'plants') && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                3. Tax, Financial & Compliance Setup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {activeTab === 'profiles' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">GSTIN (15 Digits)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 33AAECL4521D1Z6"
                        value={formData.gst || ''}
                        onChange={e => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">PAN (10 Digits)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. AAECL4521D"
                        value={formData.pan || ''}
                        onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </>
                )}
                <div className="input-group">
                  <label className="input-label">Operating Currency</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.currency || 'INR'}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Fiscal Year Format</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Apr-Mar or 2026-27"
                    value={formData.fiscalYear || 'Apr-Mar'}
                    onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Time Zone</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.timeZone || 'Asia/Kolkata'}
                    onChange={e => setFormData({ ...formData, timeZone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Address & Communication (For Companies and Plants) */}
          {(activeTab === 'profiles' || activeTab === 'plants') && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                4. Location & Contact Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Factory / Office Address</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Industrial estate, plot number, street address, pin code"
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">State / Region</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.state || 'Tamil Nadu'}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Country</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.country || 'India'}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                {activeTab === 'profiles' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Official Corporate Email</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="corporate@domain.com"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone / Telephone</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="+91 44 ..."
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ fontWeight: 600, minWidth: '120px' }}
            >
              {saving ? 'Saving...' : `${editingId ? 'Update' : 'Save'} ${level.one}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompanySetup;