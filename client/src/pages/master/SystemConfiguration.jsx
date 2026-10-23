import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Globe, DollarSign, Percent, FileText, Scale, Hash, Plus, Edit2, Eye,
  Copy, Check, Download, LayoutGrid, List, RefreshCw, Sparkles, X,
  ChevronRight, ArrowRight, ArrowUpRight, Calculator, Clock, ShieldCheck,
  CheckCircle, CheckCircle2, XCircle, Search, Sliders, Layers,
  HelpCircle, AlertTriangle, Zap, Building, ArrowLeftRight, Award
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Preset Calibration Standards for Precision Auto Components ERP */
const SYSTEM_PRESET_STANDARDS = {
  currency: [
    { name: 'Indian Rupee', code: 'INR', symbol: '₹', exchangeRate: 1.0, isBaseCurrency: true, decimalPlaces: 2, status: 'Active' },
    { name: 'US Dollar', code: 'USD', symbol: '$', exchangeRate: 84.50, isBaseCurrency: false, decimalPlaces: 2, status: 'Active' },
    { name: 'Euro', code: 'EUR', symbol: '€', exchangeRate: 91.20, isBaseCurrency: false, decimalPlaces: 2, status: 'Active' },
    { name: 'British Pound', code: 'GBP', symbol: '£', exchangeRate: 108.50, isBaseCurrency: false, decimalPlaces: 2, status: 'Active' },
    { name: 'Japanese Yen', code: 'JPY', symbol: '¥', exchangeRate: 0.56, isBaseCurrency: false, decimalPlaces: 2, status: 'Active' }
  ],
  tax: [
    { name: 'GST Exempt / Nil Rated', code: 'GST-0', rate: 0, type: 'Exempt', cgstRate: 0, sgstRate: 0, igstRate: 0, description: 'Exempt and non-taxable manufacturing raw supplies', status: 'Active' },
    { name: 'GST 5% (Scrap & Job Work)', code: 'GST-5', rate: 5, type: 'GST', cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, description: 'Concessional rate for scrap disposal and job work subcontracts', status: 'Active' },
    { name: 'GST 12% (Fasteners & Tooling)', code: 'GST-12', rate: 12, type: 'GST', cgstRate: 6.0, sgstRate: 6.0, igstRate: 12, description: 'Standard rate for standard hardware fasteners and tooling parts', status: 'Active' },
    { name: 'GST 18% (Automotive Parts & Assemblies)', code: 'GST-18', rate: 18, type: 'GST', cgstRate: 9.0, sgstRate: 9.0, igstRate: 18, description: 'Statutory standard rate for sheet metal stamped auto components and assemblies', status: 'Active' },
    { name: 'GST 28% (Luxury & Special Parts)', code: 'GST-28', rate: 28, type: 'GST', cgstRate: 14.0, sgstRate: 14.0, igstRate: 28, description: 'Highest tax tier for air conditioning, radiators and specialty assemblies', status: 'Active' }
  ],
  paymentterms: [
    { name: '100% Advance Payment', code: 'ADV-100', days: 0, discountPercent: 0, discountDays: 0, description: 'Full payment received prior to raw material dispatch or production start', status: 'Active' },
    { name: 'Cash on Delivery (COD) / Immediate', code: 'COD', days: 0, discountPercent: 2, discountDays: 0, description: 'Settlement upon delivery inspection at warehouse gate', status: 'Active' },
    { name: 'Net 15 Days', code: 'NET-15', days: 15, discountPercent: 1.5, discountDays: 5, description: 'Fast settlement terms with 1.5% discount if paid within 5 days', status: 'Active' },
    { name: 'Net 30 Days Standard', code: 'NET-30', days: 30, discountPercent: 1.0, discountDays: 10, description: 'Standard commercial credit terms for domestic suppliers and customers', status: 'Active' },
    { name: 'Net 45 Days', code: 'NET-45', days: 45, discountPercent: 0, discountDays: 0, description: 'Extended credit terms for approved automotive tier-1 accounts', status: 'Active' },
    { name: 'Net 60 Days', code: 'NET-60', days: 60, discountPercent: 0, discountDays: 0, description: 'Standard billing cycle for OEM direct delivery schedules', status: 'Active' },
    { name: 'Net 90 Days (Tier-1 OEM Special)', code: 'NET-90', days: 90, discountPercent: 0, discountDays: 0, description: 'Institutional long credit envelope for major automotive OEMs', status: 'Active' }
  ],
  documentseries: [
    { documentType: 'PurchaseOrder', prefix: 'PO-', suffix: '/2026-27', currentNumber: 104, paddingLength: 6, description: 'Procurement Purchase Orders issued to suppliers', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'SalesOrder', prefix: 'SO-', suffix: '/2026-27', currentNumber: 88, paddingLength: 6, description: 'Sales Orders booked from customer schedules', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'Quotation', prefix: 'QT-', suffix: '/2026', currentNumber: 42, paddingLength: 5, description: 'Engineering sales quotations and price bids', resetFrequency: 'Calendar Year', status: 'Active' },
    { documentType: 'Invoice', prefix: 'INV-', suffix: '/2026-27', currentNumber: 216, paddingLength: 6, description: 'Statutory GST Tax Invoices and e-Invoices', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'GoodsReceiptNote', prefix: 'GRN-', suffix: '/2026', currentNumber: 152, paddingLength: 6, description: 'Warehouse inward goods receipt and gate passes', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'WorkOrder', prefix: 'WO-', suffix: '/2026', currentNumber: 310, paddingLength: 6, description: 'Shop floor manufacturing production work orders', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'MaterialIssue', prefix: 'ISS-', suffix: '/2026', currentNumber: 74, paddingLength: 5, description: 'Raw material store requisitions and line issues', resetFrequency: 'Fiscal Year', status: 'Active' },
    { documentType: 'QualityInspection', prefix: 'QC-', suffix: '/2026', currentNumber: 195, paddingLength: 5, description: 'Quality inspection logs (Incoming, In-process, Final)', resetFrequency: 'Fiscal Year', status: 'Active' }
  ]
};

const SystemConfiguration = () => {
  const navigate = useNavigate();

  // Active Subsystem Domain
  const [activeTab, setActiveTab] = useState('currency'); // 'currency', 'tax', 'paymentterms', 'documentseries', 'uomconversion'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' vs 'table'

  // Master Data & State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uoms, setUoms] = useState([]);
  const [calibrating, setCalibrating] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals & 360 Dossier
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);

  // Interactive Live Utility State
  const [forexCalcAmount, setForexCalcAmount] = useState(100000);
  const [taxCalcAmount, setTaxCalcAmount] = useState(10000);
  const [taxCalcRate, setTaxCalcRate] = useState(18);
  const [creditCalcDays, setCreditCalcDays] = useState(30);

  // Deep-link tab query & quick create (?tab=tax or ?create=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['currency', 'tax', 'paymentterms', 'documentseries', 'uomconversion'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (params.get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    if (activeTab === 'uomconversion') fetchUoms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchUoms = async () => {
    try {
      const res = await axios.get('/master/uom?limit=100');
      setUoms(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching UOMs for conversions:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/master/${activeTab}?limit=200&includeInactive=true`);
      setData(res.data?.data || []);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
    }
    setLoading(false);
  };

  // Subsystem Definition Meta
  const SUBSYSTEMS = {
    currency: {
      id: 'currency',
      title: 'Currencies & Forex Ledgers',
      pill: 'CURRENCY & FINANCIAL LEDGERS',
      shortName: 'Currency',
      one: 'currency',
      many: 'currencies',
      icon: Globe,
      color: '#06b6d4',
      blurb: 'Multi-currency ledger standards, exchange rates against base currency (INR ₹), and export trade billing configurations.'
    },
    tax: {
      id: 'tax',
      title: 'GST & Statutory Tax Schedules',
      pill: 'STATUTORY TAXATION & GST SLABS',
      shortName: 'Tax Rate',
      one: 'tax rate',
      many: 'tax rates',
      icon: Percent,
      color: '#10b981',
      blurb: 'Statutory Indian GST schedules (0%, 5%, 12%, 18%, 28%), intra-state CGST/SGST splits, inter-state IGST, and HSN tax codes.'
    },
    paymentterms: {
      id: 'paymentterms',
      title: 'Payment & Credit Settlement Terms',
      pill: 'CREDIT POLICIES & CASH FLOW ENVELOPES',
      shortName: 'Payment Term',
      one: 'payment term',
      many: 'payment terms',
      icon: Clock,
      color: '#f59e0b',
      blurb: 'Customer credit policies, supplier settlement terms (Net 30/60/90), early payment discount incentives, and cash-flow maturity windows.'
    },
    documentseries: {
      id: 'documentseries',
      title: 'Document Numbering & Masking Series',
      pill: 'AUTOMATED DOCUMENT NUMBERING ENGINES',
      shortName: 'Number Series',
      one: 'number series',
      many: 'number series',
      icon: Hash,
      color: '#8b5cf6',
      blurb: 'Document serial masks, prefix codes (PO-, SO-, INV-, GRN-, WO-), zero-padding lengths, and running sequence odometers.'
    },
    uomconversion: {
      id: 'uomconversion',
      title: 'Dimensional & Unit Conversions',
      pill: 'PRECISION METROLOGICAL RATIOS & CONVERSIONS',
      shortName: 'Unit Conversion',
      one: 'unit conversion',
      many: 'unit conversions',
      icon: Scale,
      color: '#38bdf8',
      blurb: 'Cross-unit mathematical multipliers and dimensional conversion equations for raw material buying vs shop floor consumption.'
    }
  };

  const currentSubsystem = SUBSYSTEMS[activeTab];

  // 1-Click "Calibrate Standard ERP Settings" across active or all subsystems
  const handleCalibrateStandards = async () => {
    const isAll = await confirmAction(
      `Calibrate standard industrial automotive settings for "${currentSubsystem.title}"?\n\nThis will populate statutory Indian automotive manufacturing standards, tax rates, payment envelopes, and document series.`
    );
    if (!isAll) return;

    setCalibrating(true);
    try {
      if (activeTab === 'uomconversion') {
        // Needs real UOMs
        const uRes = await axios.get('/master/uom?limit=100');
        const allUoms = uRes.data?.data || [];
        const uomMap = {};
        allUoms.forEach(u => {
          uomMap[(u.symbol || '').toLowerCase()] = u;
          uomMap[(u.name || '').toLowerCase()] = u;
          uomMap[(u.code || '').toLowerCase()] = u;
        });

        const conversionRules = [
          { from: 'mt', to: 'kg', factor: 1000, notes: '1 Metric Ton = 1,000 Kilograms' },
          { from: 'kg', to: 'g', factor: 1000, notes: '1 Kilogram = 1,000 Grams' },
          { from: 'm', to: 'mm', factor: 1000, notes: '1 Metre = 1,000 Millimetres' },
          { from: 'l', to: 'ml', factor: 1000, notes: '1 Litre = 1,000 Millilitres' }
        ];

        for (const rule of conversionRules) {
          const fromDoc = uomMap[rule.from] || allUoms.find(u => (u.symbol || '').toLowerCase().includes(rule.from));
          const toDoc = uomMap[rule.to] || allUoms.find(u => (u.symbol || '').toLowerCase().includes(rule.to));
          if (fromDoc && toDoc) {
            const existing = data.find(c => {
              const fId = c.fromUOM?._id || c.fromUOM;
              const tId = c.toUOM?._id || c.toUOM;
              return fId === fromDoc._id && tId === toDoc._id;
            });
            const payload = {
              fromUOM: fromDoc._id,
              toUOM: toDoc._id,
              factor: rule.factor,
              formula: `1 ${fromDoc.symbol || fromDoc.name} = ${rule.factor} ${toDoc.symbol || toDoc.name}`,
              notes: rule.notes,
              status: 'Active'
            };
            if (existing) {
              await axios.put(`/master/uomconversion/${existing._id}`, payload);
            } else {
              await axios.post('/master/uomconversion', payload);
            }
          }
        }
      } else {
        const presets = SYSTEM_PRESET_STANDARDS[activeTab] || [];
        for (const preset of presets) {
          const searchKey = activeTab === 'documentseries' ? 'documentType' : 'code';
          const matchVal = preset[searchKey];
          const existing = data.find(item => item[searchKey] === matchVal);

          if (existing) {
            await axios.put(`/master/${activeTab}/${existing._id}`, { ...preset, status: 'Active' });
          } else {
            await axios.post(`/master/${activeTab}`, preset);
          }
        }
      }

      await fetchData();
      notify.success(`Standard settings calibrated for ${currentSubsystem.title}!`);
    } catch (err) {
      console.error(err);
      notify.error('Error calibrating settings: ' + (err.response?.data?.message || err.message));
    }
    setCalibrating(false);
  };

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (selectedStatusFilter === 'ACTIVE' && item.status !== 'Active') return false;
      if (selectedStatusFilter === 'INACTIVE' && item.status === 'Active') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (activeTab === 'uomconversion') {
          const fName = item.fromUOM?.name?.toLowerCase() || '';
          const tName = item.toUOM?.name?.toLowerCase() || '';
          const notes = item.notes?.toLowerCase() || '';
          if (!fName.includes(q) && !tName.includes(q) && !notes.includes(q)) return false;
        } else if (activeTab === 'documentseries') {
          const doc = item.documentType?.toLowerCase() || '';
          const pfx = item.prefix?.toLowerCase() || '';
          const desc = item.description?.toLowerCase() || '';
          if (!doc.includes(q) && !pfx.includes(q) && !desc.includes(q)) return false;
        } else {
          const name = item.name?.toLowerCase() || '';
          const code = item.code?.toLowerCase() || '';
          const desc = item.description?.toLowerCase() || '';
          if (!name.includes(q) && !code.includes(q) && !desc.includes(q)) return false;
        }
      }

      return true;
    });
  }, [data, activeTab, selectedStatusFilter, searchTerm]);

  // Telemetry Aggregates (Overview metrics)
  const telemetry = useMemo(() => {
    const activeCount = data.filter(d => d.status === 'Active').length;
    const totalCount = data.length;

    let highlight1 = { label: 'Active Items', value: `${activeCount} / ${totalCount}` };
    let highlight2 = { label: 'Subsystem Focus', value: currentSubsystem.shortName };

    if (activeTab === 'currency') {
      const baseCurr = data.find(c => c.isBaseCurrency || c.code === 'INR');
      highlight1 = { label: 'Base Currency', value: baseCurr ? `${baseCurr.name} (${baseCurr.symbol})` : 'INR (₹)' };
      highlight2 = { label: 'Active Currencies', value: `${activeCount} Currencies` };
    } else if (activeTab === 'tax') {
      const highest = Math.max(...data.map(t => t.rate || 0), 0);
      highlight1 = { label: 'Tax Slabs', value: `${activeCount} GST Rates` };
      highlight2 = { label: 'Max Rate Slab', value: `${highest}% GST` };
    } else if (activeTab === 'paymentterms') {
      const maxDays = Math.max(...data.map(p => p.days || 0), 0);
      highlight1 = { label: 'Credit Policies', value: `${activeCount} Active Terms` };
      highlight2 = { label: 'Max Credit Envelope', value: `${maxDays} Days` };
    } else if (activeTab === 'documentseries') {
      const totalDocs = data.reduce((s, d) => s + (d.currentNumber || 0), 0);
      highlight1 = { label: 'Doc Number Series', value: `${activeCount} Series` };
      highlight2 = { label: 'Docs Issued Count', value: `#${totalDocs.toLocaleString()}` };
    } else if (activeTab === 'uomconversion') {
      highlight1 = { label: 'Conversion Multipliers', value: `${activeCount} Equations` };
      highlight2 = { label: 'Base Metrology', value: 'Metric & Count' };
    }

    return { activeCount, totalCount, highlight1, highlight2 };
  }, [data, activeTab, currentSubsystem]);

  // Copy helper
  const handleCopy = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCodeId(id);
    notify.success(`Copied "${text}" to clipboard!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Open Create
  const openCreate = () => {
    if (activeTab === 'currency') {
      setFormData({ name: '', code: '', symbol: '', exchangeRate: 1.0, isBaseCurrency: false, decimalPlaces: 2, status: 'Active' });
    } else if (activeTab === 'tax') {
      setFormData({ name: '', code: '', rate: 18, type: 'GST', cgstRate: 9, sgstRate: 9, igstRate: 18, description: '', status: 'Active' });
    } else if (activeTab === 'paymentterms') {
      setFormData({ name: '', code: '', days: 30, discountPercent: 0, discountDays: 0, description: '', status: 'Active' });
    } else if (activeTab === 'documentseries') {
      setFormData({ documentType: '', prefix: '', suffix: `/${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`, currentNumber: 1, paddingLength: 6, resetFrequency: 'Fiscal Year', status: 'Active' });
    } else if (activeTab === 'uomconversion') {
      setFormData({ fromUOM: uoms[0]?._id || '', toUOM: uoms[1]?._id || '', factor: 1000, notes: '', status: 'Active' });
    }
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit
  const handleEdit = (row) => {
    setFormData({
      ...row,
      fromUOM: row.fromUOM?._id || row.fromUOM,
      toUOM: row.toUOM?._id || row.toUOM
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      if (activeTab === 'currency') {
        payload.exchangeRate = Number(payload.exchangeRate) || 1.0;
        payload.decimalPlaces = Number(payload.decimalPlaces) || 2;
      } else if (activeTab === 'tax') {
        payload.rate = Number(payload.rate) || 0;
        payload.cgstRate = Number(payload.cgstRate) || (payload.rate / 2);
        payload.sgstRate = Number(payload.sgstRate) || (payload.rate / 2);
        payload.igstRate = Number(payload.igstRate) || payload.rate;
      } else if (activeTab === 'paymentterms') {
        payload.days = Number(payload.days) || 0;
        payload.discountPercent = Number(payload.discountPercent) || 0;
        payload.discountDays = Number(payload.discountDays) || 0;
      } else if (activeTab === 'documentseries') {
        payload.currentNumber = Number(payload.currentNumber) || 0;
        payload.paddingLength = Number(payload.paddingLength) || 6;
      } else if (activeTab === 'uomconversion') {
        payload.factor = Number(payload.factor) || 1;
      }

      if (editingId) {
        await axios.put(`/master/${activeTab}/${editingId}`, payload);
        notify.success(`${currentSubsystem.shortName} updated successfully`);
      } else {
        await axios.post(`/master/${activeTab}`, payload);
        notify.success(`New ${currentSubsystem.shortName} created successfully`);
      }

      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      notify.error(err.response?.data?.message || 'Error saving configuration');
    }
    setSaving(false);
  };

  // Toggle Active/Inactive
  const toggleStatus = async (row) => {
    const isCurrentlyActive = row.status === 'Active';
    if (isCurrentlyActive && !await confirmAction(`Deactivate ${currentSubsystem.shortName} "${row.name || row.code || row.documentType}"? Modules referencing this setting will ignore it.`)) return;
    try {
      await axios.put(`/master/${activeTab}/${row._id}`, {
        status: isCurrentlyActive ? 'Inactive' : 'Active'
      });
      notify.success(`${currentSubsystem.shortName} ${isCurrentlyActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      notify.error('Error updating status');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      notify.error('No configuration rows to export');
      return;
    }
    let headers = [];
    let rows = [];

    if (activeTab === 'currency') {
      headers = ['Code', 'Name', 'Symbol', 'Exchange Rate to INR', 'Is Base Currency', 'Status'];
      rows = filteredData.map(c => [c.code, `"${c.name}"`, `"${c.symbol}"`, c.exchangeRate || 1.0, c.isBaseCurrency ? 'YES' : 'NO', c.status]);
    } else if (activeTab === 'tax') {
      headers = ['Code', 'Name', 'Total Rate (%)', 'CGST (%)', 'SGST (%)', 'IGST (%)', 'Tax Type', 'Description', 'Status'];
      rows = filteredData.map(t => [t.code, `"${t.name}"`, t.rate, t.cgstRate || t.rate / 2, t.sgstRate || t.rate / 2, t.igstRate || t.rate, t.type || 'GST', `"${t.description || ''}"`, t.status]);
    } else if (activeTab === 'paymentterms') {
      headers = ['Code', 'Name', 'Days to Pay', 'Cash Discount (%)', 'Discount Window (Days)', 'Description', 'Status'];
      rows = filteredData.map(p => [p.code, `"${p.name}"`, p.days, p.discountPercent || 0, p.discountDays || 0, `"${p.description || ''}"`, p.status]);
    } else if (activeTab === 'documentseries') {
      headers = ['Document Type', 'Prefix', 'Suffix', 'Current Number', 'Padding Digits', 'Next Document ID', 'Reset Frequency', 'Status'];
      rows = filteredData.map(d => {
        const nextId = `${d.prefix || ''}${String(d.currentNumber || 0).padStart(d.paddingLength || 6, '0')}${d.suffix || ''}`;
        return [d.documentType, d.prefix, d.suffix || '', d.currentNumber || 0, d.paddingLength || 6, nextId, d.resetFrequency || 'Fiscal Year', d.status];
      });
    } else if (activeTab === 'uomconversion') {
      headers = ['Convert From', 'Convert To', 'Multiplier Factor', 'Formula / Equation', 'Notes', 'Status'];
      rows = filteredData.map(u => [u.fromUOM?.name || '', u.toUOM?.name || '', u.factor, `"${u.formula || ''}"`, `"${u.notes || ''}"`, u.status]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `precision_${activeTab}_config_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success(`Exported ${filteredData.length} records to CSV`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HERO COMMAND BANNER (Deep Obsidian Carbon & Electric Cyan-Teal Matrix)
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #0e7490 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(14, 116, 144, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.4)'
      }}>
        {/* Ambient cyan circuit backdrop */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(6, 182, 212, 0.2) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(20, 184, 166, 0.15) 0%, transparent 40%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Tag Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}>
              <Zap size={13} style={{ color: '#06b6d4' }} /> GLOBAL ERP SYSTEM KERNEL & MASTER CONFIGURATION VAULT
            </span>
          </div>

          {/* Title & Actions Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ maxWidth: '680px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff'
              }}>
                System Settings & Core Engine Configuration
              </h1>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: '#e2e8f0',
                margin: '6px 0 0 0'
              }}>
                Global parameter registry establishing multi-currency base ledgers, statutory GST tax schedules, customer/supplier payment terms, document numbering series, and precision unit conversion ratios.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportCSV}
                className="btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} /> Export CSV
              </button>

              <button
                onClick={handleCalibrateStandards}
                disabled={calibrating}
                className="btn"
                style={{
                  background: 'rgba(6, 182, 212, 0.25)',
                  color: '#e0f2fe',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Seed standard statutory GST slabs, payment terms, Indian document series, and currency rates"
              >
                <Sparkles size={15} style={{ color: '#38bdf8' }} />
                {calibrating ? 'Calibrating...' : 'Calibrate Standard Settings'}
              </button>

              <button
                onClick={openCreate}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add {currentSubsystem.shortName}
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TELEMETRY KPI STRIP (4 Parameter Health Metrics)
              ───────────────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '22px'
          }}>
            {/* KPI 1: Active In Subsystem */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                  Active {currentSubsystem.shortName}s
                </span>
                <currentSubsystem.icon size={14} style={{ color: '#06b6d4' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>{telemetry.activeCount}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {telemetry.totalCount} registered</span>
              </div>
              <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '2px' }}>
                Online & active across system
              </div>
            </div>

            {/* KPI 2: Subsystem Metric 1 */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                  {telemetry.highlight1.label}
                </span>
                <Sliders size={14} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>{telemetry.highlight1.value}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '2px' }}>
                System configuration parameter
              </div>
            </div>

            {/* KPI 3: Subsystem Metric 2 */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                  {telemetry.highlight2.label}
                </span>
                <ShieldCheck size={14} style={{ color: '#6ee7b7' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#6ee7b7' }}>{telemetry.highlight2.value}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '2px' }}>
                Statutory & commercial standard
              </div>
            </div>

            {/* KPI 4: Enterprise Audit Health */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              backdropFilter: 'blur(6px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', fontWeight: 700 }}>
                  Compliance Guard
                </span>
                <Award size={14} style={{ color: '#fde047' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#fde047' }}>100%</span>
                <span style={{ fontSize: '12px', color: '#e2e8f0' }}>Compliant</span>
              </div>
              <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '2px' }}>
                GST & Document audit lock active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MISSION CONTROL SUBSYSTEM DOCK (5 Subsystems)
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {Object.values(SUBSYSTEMS).map(sub => {
          const Icon = sub.icon;
          const isSelected = activeTab === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => {
                setActiveTab(sub.id);
                setSearchTerm('');
              }}
              style={{
                background: isSelected ? 'var(--card-bg, #ffffff)' : 'var(--bg-secondary, #f8fafc)',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '4px',
                  background: 'linear-gradient(to bottom, #0284c7, #06b6d4)'
                }} />
              )}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(2, 132, 199, 0.1)' : 'var(--border-color, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#0284c7' : 'var(--text-secondary, #64748b)',
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#0284c7' : 'var(--text-primary, #0f172a)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {sub.title.split('&')[0].trim()}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                  {sub.shortName} Registry
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE LIVE UTILITY SANDBOX PANEL
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {activeTab === 'currency' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={16} style={{ color: '#0284c7' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>Live Multi-Currency Forex Simulator</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Convert base INR ledger transactions to international billing equivalents.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>Base INR: ₹</span>
                <input
                  type="number"
                  value={forexCalcAmount}
                  onChange={e => setForexCalcAmount(Number(e.target.value) || 0)}
                  style={{
                    width: '120px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                />
              </div>
              <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                {data.filter(c => c.code !== 'INR').slice(0, 3).map(c => {
                  const converted = c.exchangeRate > 0 ? (forexCalcAmount / c.exchangeRate).toFixed(2) : 0;
                  return (
                    <span key={c._id} style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0284c7'
                    }}>
                      {c.symbol} {converted} {c.code}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={16} style={{ color: '#10b981' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>Live GST Split & Tax Accumulator</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Calculate Base Amount, CGST, SGST, and IGST for invoice line items.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>Gross ₹:</span>
                <input
                  type="number"
                  value={taxCalcAmount}
                  onChange={e => setTaxCalcAmount(Number(e.target.value) || 0)}
                  style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13px', fontWeight: 700 }}
                />
              </div>
              <select
                value={taxCalcRate}
                onChange={e => setTaxCalcRate(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13px', fontWeight: 600 }}
              >
                {data.map(t => (
                  <option key={t._id} value={t.rate}>{t.name} ({t.rate}%)</option>
                ))}
              </select>
              <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              {(() => {
                const baseVal = taxCalcAmount / (1 + (taxCalcRate / 100));
                const totalGst = taxCalcAmount - baseVal;
                const halfGst = totalGst / 2;
                return (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                      Base: <strong>₹{baseVal.toFixed(2)}</strong>
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
                      CGST ({(taxCalcRate/2).toFixed(1)}%): <strong>₹{halfGst.toFixed(2)}</strong>
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
                      SGST ({(taxCalcRate/2).toFixed(1)}%): <strong>₹{halfGst.toFixed(2)}</strong>
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'paymentterms' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#f59e0b' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>Maturity Due Date & Cash Flow Timeline</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Project invoice settlement horizon calculated from today's invoice date.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                value={creditCalcDays}
                onChange={e => setCreditCalcDays(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13px', fontWeight: 600 }}
              >
                {data.map(p => (
                  <option key={p._id} value={p.days}>{p.name} ({p.days} Days)</option>
                ))}
              </select>
              <ArrowRight size={14} style={{ color: '#94a3b8' }} />
              {(() => {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + creditCalcDays);
                return (
                  <span style={{ padding: '6px 12px', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '12px', fontWeight: 700 }}>
                    Maturity Horizon: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({creditCalcDays} days)
                  </span>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'documentseries' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={16} style={{ color: '#8b5cf6' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>Live Document Mask Sequence Tester</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Preview exact format of the next generated document numbering series.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {data.slice(0, 3).map(d => {
                const nextId = `${d.prefix || ''}${String((d.currentNumber || 0) + 1).padStart(d.paddingLength || 6, '0')}${d.suffix || ''}`;
                return (
                  <span key={d._id} style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#6d28d9'
                  }}>
                    {d.documentType}: {nextId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'uomconversion' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeftRight size={16} style={{ color: '#0284c7' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary, #0f172a)' }}>Precision Unit Conversion Equations</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                Standard ratios governing unit conversions between procurement and consumption.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {data.slice(0, 3).map(u => (
                <span key={u._id} style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#15803d'
                }}>
                  1 {u.fromUOM?.symbol || u.fromUOM?.name} = {u.factor} {u.toUOM?.symbol || u.toUOM?.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FILTER & VIEW MODE BAR
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--card-bg, #ffffff)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary, #94a3b8)'
            }} />
            <input
              type="text"
              placeholder={`Search ${currentSubsystem.many}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-primary, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {/* View Switcher (Cards vs Table) */}
        <div style={{
          display: 'inline-flex',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #cbd5e1)',
          padding: '2px',
          background: 'var(--bg-secondary, #f1f5f9)'
        }}>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: viewMode === 'cards' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'cards' ? '#0284c7' : 'transparent',
              color: viewMode === 'cards' ? '#ffffff' : 'var(--text-secondary, #64748b)'
            }}
          >
            <LayoutGrid size={13} /> Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: viewMode === 'table' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'table' ? '#0284c7' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary, #64748b)'
            }}
          >
            <List size={13} /> Table
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MAIN CONTENT: CARDS OR MATRIX TABLE
          ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <RefreshCw size={26} className="animate-spin" style={{ color: '#0284c7' }} />
          <span style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
            Loading {currentSubsystem.many}...
          </span>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px dashed var(--border-color, #cbd5e1)'
        }}>
          <currentSubsystem.icon size={40} style={{ color: '#0284c7', opacity: 0.6, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary, #0f172a)' }}>
            No {currentSubsystem.many} Configured
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
            {currentSubsystem.blurb}
          </p>
          <button
            onClick={openCreate}
            className="btn btn-primary"
            style={{ background: '#0284c7', color: '#ffffff' }}
          >
            <Plus size={14} /> Add {currentSubsystem.one}
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── MODULAR CARDS CONSOLE ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {filteredData.map(item => {
            const isActive = item.status === 'Active';
            return (
              <div
                key={item._id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  opacity: isActive ? 1 : 0.65,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Card Top */}
                <div style={{ padding: '16px 18px 12px 18px', borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Code Badge */}
                      <span
                        onClick={() => handleCopy(item._id, item.code || item.documentType)}
                        title="Click to copy code"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          background: 'rgba(2, 132, 199, 0.08)',
                          color: '#0284c7',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedCodeId === item._id ? <Check size={11} style={{ color: '#16a34a' }} /> : <Copy size={11} />}
                        {item.code || item.documentType}
                      </span>

                      {/* Currency Base Tag */}
                      {activeTab === 'currency' && item.isBaseCurrency && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}>
                          BASE LEDGER
                        </span>
                      )}

                      {/* Tax Type Tag */}
                      {activeTab === 'tax' && item.type && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0'
                        }}>
                          {item.type}
                        </span>
                      )}
                    </div>

                    <StatusBadge value={item.status} />
                  </div>

                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '8px 0 2px 0',
                    color: 'var(--text-primary, #0f172a)'
                  }}>
                    {item.name || item.documentType || `${item.fromUOM?.name} → ${item.toUOM?.name}`}
                  </h3>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                    {item.description || item.notes || (activeTab === 'uomconversion' ? `Ratio: 1 to ${item.factor}` : 'Standard System Parameter')}
                  </div>
                </div>

                {/* Card Parameters Middle */}
                <div style={{ padding: '12px 18px', background: 'var(--bg-secondary, #fafafa)', flex: 1 }}>
                  {activeTab === 'currency' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Symbol:</span>{' '}
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{item.symbol}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Rate to INR:</span>{' '}
                        <strong>₹{item.exchangeRate || 1.0}</strong>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tax' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>GST Rate:</span>{' '}
                        <strong style={{ fontSize: '15px', color: '#059669' }}>{item.rate}%</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>CGST / SGST:</span>{' '}
                        <strong>{(item.cgstRate || item.rate / 2)}% + {(item.sgstRate || item.rate / 2)}%</strong>
                      </div>
                    </div>
                  )}

                  {activeTab === 'paymentterms' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Credit Window:</span>{' '}
                        <strong style={{ fontSize: '15px', color: '#d97706' }}>{item.days} Days</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Cash Discount:</span>{' '}
                        <strong>{item.discountPercent ? `${item.discountPercent}% (${item.discountDays}d)` : 'None'}</strong>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documentseries' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Sequence:</span>{' '}
                        <strong style={{ fontFamily: 'monospace', color: '#6d28d9' }}>#{item.currentNumber || 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary, #64748b)' }}>Format Preview:</span>{' '}
                        <strong style={{ fontFamily: 'monospace' }}>
                          {item.prefix || ''}{String(item.currentNumber || 0).padStart(item.paddingLength || 6, '0')}{item.suffix || ''}
                        </strong>
                      </div>
                    </div>
                  )}

                  {activeTab === 'uomconversion' && (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Conversion Multiplier:</span>{' '}
                      <strong style={{ color: '#0284c7', fontSize: '14px' }}>× {item.factor}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        1 {item.fromUOM?.symbol || item.fromUOM?.name} = {item.factor} {item.toUOM?.symbol || item.toUOM?.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div style={{
                  padding: '10px 18px',
                  background: 'var(--bg-primary, #ffffff)',
                  borderTop: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => setSelectedDossier(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Eye size={13} /> 360° Specs <ChevronRight size={13} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit Configuration"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary, #64748b)',
                        padding: '4px'
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleStatus(item)}
                      title={isActive ? 'Deactivate' : 'Activate'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isActive ? 'var(--accent-danger, #ef4444)' : 'var(--accent-success, #22c55e)',
                        padding: '4px'
                      }}
                    >
                      {isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── ENTERPRISE MATRIX TABLE ── */
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #475569)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {activeTab === 'currency' && (
                    <>
                      <th style={{ padding: '12px 16px' }}>Code</th>
                      <th style={{ padding: '12px 16px' }}>Currency Name</th>
                      <th style={{ padding: '12px 16px' }}>Symbol</th>
                      <th style={{ padding: '12px 16px' }}>Rate to INR</th>
                      <th style={{ padding: '12px 16px' }}>Base Currency</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'tax' && (
                    <>
                      <th style={{ padding: '12px 16px' }}>Code</th>
                      <th style={{ padding: '12px 16px' }}>Tax Slab Name</th>
                      <th style={{ padding: '12px 16px' }}>Total Rate</th>
                      <th style={{ padding: '12px 16px' }}>CGST / SGST</th>
                      <th style={{ padding: '12px 16px' }}>IGST</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'paymentterms' && (
                    <>
                      <th style={{ padding: '12px 16px' }}>Code</th>
                      <th style={{ padding: '12px 16px' }}>Term Name</th>
                      <th style={{ padding: '12px 16px' }}>Days to Pay</th>
                      <th style={{ padding: '12px 16px' }}>Cash Discount</th>
                      <th style={{ padding: '12px 16px' }}>Description</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'documentseries' && (
                    <>
                      <th style={{ padding: '12px 16px' }}>Document Type</th>
                      <th style={{ padding: '12px 16px' }}>Prefix</th>
                      <th style={{ padding: '12px 16px' }}>Suffix</th>
                      <th style={{ padding: '12px 16px' }}>Running Count</th>
                      <th style={{ padding: '12px 16px' }}>Sample Document ID</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </>
                  )}
                  {activeTab === 'uomconversion' && (
                    <>
                      <th style={{ padding: '12px 16px' }}>Convert From</th>
                      <th style={{ padding: '12px 16px' }}>Convert To</th>
                      <th style={{ padding: '12px 16px' }}>Multiplier Factor</th>
                      <th style={{ padding: '12px 16px' }}>Equation / Notes</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                    </>
                  )}
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => {
                  const isActive = row.status === 'Active';
                  return (
                    <tr
                      key={row._id}
                      style={{
                        borderBottom: '1px solid var(--border-color, #f1f5f9)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary, #fafafa)'
                      }}
                    >
                      {activeTab === 'currency' && (
                        <>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                            {row.code}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: '12px 16px', fontSize: '15px', fontWeight: 800 }}>{row.symbol}</td>
                          <td style={{ padding: '12px 16px' }}>₹{row.exchangeRate || 1.0}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {row.isBaseCurrency ? (
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>
                                YES (Base)
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      )}

                      {activeTab === 'tax' && (
                        <>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                            {row.code}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#059669' }}>{row.rate}%</td>
                          <td style={{ padding: '12px 16px' }}>{(row.cgstRate || row.rate / 2)}% + {(row.sgstRate || row.rate / 2)}%</td>
                          <td style={{ padding: '12px 16px' }}>{row.igstRate || row.rate}%</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                              {row.type || 'GST'}
                            </span>
                          </td>
                        </>
                      )}

                      {activeTab === 'paymentterms' && (
                        <>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#d97706' }}>
                            {row.code}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800 }}>{row.days} Days</td>
                          <td style={{ padding: '12px 16px' }}>
                            {row.discountPercent ? `${row.discountPercent}% within ${row.discountDays}d` : '-'}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{row.description || '-'}</td>
                        </>
                      )}

                      {activeTab === 'documentseries' && (
                        <>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#6d28d9' }}>
                            {row.documentType}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{row.prefix}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{row.suffix || '-'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{row.currentNumber || 0}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0f172a' }}>
                            {row.prefix || ''}{String(row.currentNumber || 0).padStart(row.paddingLength || 6, '0')}{row.suffix || ''}
                          </td>
                        </>
                      )}

                      {activeTab === 'uomconversion' && (
                        <>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.fromUOM?.name || '-'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{row.toUOM?.name || '-'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0284c7' }}>× {row.factor}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                            {row.notes || row.formula || `1 ${row.fromUOM?.name} = ${row.factor} ${row.toUOM?.name}`}
                          </td>
                        </>
                      )}

                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge value={row.status} />
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedDossier(row)}
                            title="View Specs"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', padding: '4px' }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleEdit(row)}
                            title="Edit"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)', padding: '4px' }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => toggleStatus(row)}
                            title={isActive ? 'Deactivate' : 'Activate'}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: isActive ? 'var(--accent-danger, #ef4444)' : 'var(--accent-success, #22c55e)',
                              padding: '4px'
                            }}
                          >
                            {isActive ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. CONFIGURATION 360° SLIDE-OVER DOSSIER DRAWER
          ───────────────────────────────────────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--card-bg, #ffffff)',
            height: '100%',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  background: 'rgba(2, 132, 199, 0.08)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}>
                  {selectedDossier.code || selectedDossier.documentType || 'CONFIG'}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0 2px 0', color: 'var(--text-primary, #0f172a)' }}>
                  {selectedDossier.name || selectedDossier.documentType || `${selectedDossier.fromUOM?.name} → ${selectedDossier.toUOM?.name}`}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
                  {currentSubsystem.title}
                </div>
              </div>
              <button
                onClick={() => setSelectedDossier(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Parameter Dossier Box */}
            <div style={{ background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#0284c7', margin: '0 0 12px 0' }}>
                Mathematical & Operational Parameters
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                {activeTab === 'currency' && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Currency Symbol:</span>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>{selectedDossier.symbol}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Base Rate (INR):</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{selectedDossier.exchangeRate || 1.0}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Is Base Ledger:</span>
                      <div style={{ fontWeight: 700, color: selectedDossier.isBaseCurrency ? '#059669' : '#64748b' }}>
                        {selectedDossier.isBaseCurrency ? 'YES (Master Currency)' : 'NO (Foreign Currency)'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Decimal Precision:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDossier.decimalPlaces || 2} Places</div>
                    </div>
                  </>
                )}

                {activeTab === 'tax' && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Total Tax Rate:</span>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#059669' }}>{selectedDossier.rate}%</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Tax Classification:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDossier.type || 'GST'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Intra-State Split:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {(selectedDossier.cgstRate || selectedDossier.rate / 2)}% CGST + {(selectedDossier.sgstRate || selectedDossier.rate / 2)}% SGST
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Inter-State IGST:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDossier.igstRate || selectedDossier.rate}% IGST</div>
                    </div>
                  </>
                )}

                {activeTab === 'paymentterms' && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Settlement Period:</span>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#d97706' }}>{selectedDossier.days} Days</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Cash Discount %:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDossier.discountPercent || 0}%</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Commercial Policy:</span>
                      <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>{selectedDossier.description || 'Standard settlement term'}</div>
                    </div>
                  </>
                )}

                {activeTab === 'documentseries' && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Document Prefix:</span>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedDossier.prefix}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Document Suffix:</span>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedDossier.suffix || 'None'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Zero-Padding Length:</span>
                      <div style={{ fontWeight: 700 }}>{selectedDossier.paddingLength || 6} Digits</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Reset Frequency:</span>
                      <div style={{ fontWeight: 700 }}>{selectedDossier.resetFrequency || 'Fiscal Year'}</div>
                    </div>
                  </>
                )}

                {activeTab === 'uomconversion' && (
                  <>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Source Unit:</span>
                      <div style={{ fontWeight: 700 }}>{selectedDossier.fromUOM?.name} ({selectedDossier.fromUOM?.symbol})</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Target Unit:</span>
                      <div style={{ fontWeight: 700 }}>{selectedDossier.toUOM?.name} ({selectedDossier.toUOM?.symbol})</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-secondary, #64748b)' }}>Mathematical Equation:</span>
                      <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '14px', marginTop: '2px' }}>
                        1 {selectedDossier.fromUOM?.symbol} = {selectedDossier.factor} {selectedDossier.toUOM?.symbol}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Downstream ERP Integration Map */}
            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '16px', border: '1px solid #bae6fd' }}>
              <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#0369a1', margin: '0 0 10px 0' }}>
                Downstream ERP Integration Points
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#0c4a6e' }}>
                {activeTab === 'currency' && (
                  <>
                    <div>• <strong>Sales Quotations & Orders:</strong> Multi-currency export billing.</div>
                    <div>• <strong>Purchase Orders:</strong> Import supplier pricing conversion.</div>
                    <div>• <strong>General Ledger:</strong> Automatic forex gain/loss settlement entries.</div>
                  </>
                )}
                {activeTab === 'tax' && (
                  <>
                    <div>• <strong>Tax Invoices:</strong> Mandatory HSN GST rate accumulation.</div>
                    <div>• <strong>Vendor POs:</strong> Input Tax Credit (ITC) ledger posting.</div>
                    <div>• <strong>GSTR-1 & GSTR-3B:</strong> Statutory tax return filing exports.</div>
                  </>
                )}
                {activeTab === 'paymentterms' && (
                  <>
                    <div>• <strong>Accounts Receivable:</strong> Customer aging bucket calculations.</div>
                    <div>• <strong>Accounts Payable:</strong> Supplier invoice payment scheduling.</div>
                    <div>• <strong>Credit Control:</strong> Automated dispatch hold upon overdue terms.</div>
                  </>
                )}
                {activeTab === 'documentseries' && (
                  <>
                    <div>• <strong>Sequencer Engine:</strong> Thread-safe unique auto-number generation.</div>
                    <div>• <strong>Audit Logs:</strong> Tamper-evident sequential document tracking.</div>
                    <div>• <strong>Barcodes & QR:</strong> Serialized barcode printing on shop floor travelers.</div>
                  </>
                )}
                {activeTab === 'uomconversion' && (
                  <>
                    <div>• <strong>Store Inward:</strong> Automatic conversion from Tonnes to KG at GRN.</div>
                    <div>• <strong>BOM Consumption:</strong> Raw material sheet weight calculations.</div>
                    <div>• <strong>Stock Valuation:</strong> Normalized inventory valuation per base unit.</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. DYNAMIC CREATE / EDIT MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--card-bg, #ffffff)',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <currentSubsystem.icon size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                  {editingId ? `Edit ${currentSubsystem.shortName}` : `Configure New ${currentSubsystem.shortName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* ── CURRENCY FIELDS ── */}
                {activeTab === 'currency' && (
                  <>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Currency Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. Indian Rupee, US Dollar"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Currency Code (ISO) *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. INR, USD, EUR"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Symbol *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. ₹, $, €"
                        value={formData.symbol || ''}
                        onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Exchange Rate to Base (INR) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        required
                        value={formData.exchangeRate ?? 1.0}
                        onChange={e => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Decimal Places</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.decimalPlaces ?? 2}
                        onChange={e => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                      <input
                        type="checkbox"
                        id="isBaseCurrency"
                        checked={!!formData.isBaseCurrency}
                        onChange={e => setFormData({ ...formData, isBaseCurrency: e.target.checked })}
                      />
                      <label htmlFor="isBaseCurrency" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Is Primary Base Currency (INR)
                      </label>
                    </div>
                  </>
                )}

                {/* ── TAX FIELDS ── */}
                {activeTab === 'tax' && (
                  <>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Tax Slab Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. GST 18% (Automotive Parts)"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Tax Code *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. GST-18"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Total Tax Rate (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        required
                        value={formData.rate ?? 18}
                        onChange={e => {
                          const r = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, rate: r, cgstRate: r / 2, sgstRate: r / 2, igstRate: r });
                        }}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Tax Classification</label>
                      <select
                        className="input-field"
                        value={formData.type || 'GST'}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="GST">Standard GST</option>
                        <option value="IGST">Inter-State IGST</option>
                        <option value="Exempt">Exempt / Nil Rated</option>
                        <option value="Cess">Compensation Cess</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>CGST Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.cgstRate ?? 9}
                        onChange={e => setFormData({ ...formData, cgstRate: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>SGST Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.sgstRate ?? 9}
                        onChange={e => setFormData({ ...formData, sgstRate: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Description & HSN Guidance</label>
                      <textarea
                        className="input-field"
                        rows="2"
                        placeholder="HSN codes applicable, statutory notifications..."
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* ── PAYMENT TERMS FIELDS ── */}
                {activeTab === 'paymentterms' && (
                  <>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Term Name *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. Net 30 Days Standard"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Term Code *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. NET-30"
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Days to Pay *</label>
                      <input
                        type="number"
                        className="input-field"
                        required
                        value={formData.days ?? 30}
                        onChange={e => setFormData({ ...formData, days: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Early Cash Discount (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="input-field"
                        value={formData.discountPercent ?? 0}
                        onChange={e => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Discount Window (Days)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={formData.discountDays ?? 0}
                        onChange={e => setFormData({ ...formData, discountDays: parseInt(e.target.value) })}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Commercial Terms Description</label>
                      <textarea
                        className="input-field"
                        rows="2"
                        placeholder="Conditions, milestone payments..."
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* ── DOCUMENT SERIES FIELDS ── */}
                {activeTab === 'documentseries' && (
                  <>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Document Entity Type *</label>
                      <select
                        className="input-field"
                        required
                        value={formData.documentType || ''}
                        onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                      >
                        <option value="" disabled>Select document type</option>
                        <option value="PurchaseOrder">Purchase Order (PO)</option>
                        <option value="SalesOrder">Sales Order (SO)</option>
                        <option value="Quotation">Sales Quotation (QT)</option>
                        <option value="Invoice">Tax Invoice (INV)</option>
                        <option value="GoodsReceiptNote">Goods Receipt Note (GRN)</option>
                        <option value="WorkOrder">Shop Floor Work Order (WO)</option>
                        <option value="MaterialIssue">Material Issue Slip (ISS)</option>
                        <option value="QualityInspection">Quality Inspection Certificate (QC)</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Prefix Code *</label>
                      <input
                        type="text"
                        className="input-field"
                        required
                        placeholder="e.g. PO-, SO-, INV-"
                        value={formData.prefix || ''}
                        onChange={e => setFormData({ ...formData, prefix: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Suffix Code (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. /2026-27"
                        value={formData.suffix || ''}
                        onChange={e => setFormData({ ...formData, suffix: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Next Running Number *</label>
                      <input
                        type="number"
                        className="input-field"
                        required
                        value={formData.currentNumber ?? 1}
                        onChange={e => setFormData({ ...formData, currentNumber: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Digit Padding Length (e.g. 6 &rarr; 000001)</label>
                      <input
                        type="number"
                        className="input-field"
                        required
                        value={formData.paddingLength ?? 6}
                        onChange={e => setFormData({ ...formData, paddingLength: parseInt(e.target.value) })}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Sequence Reset Frequency</label>
                      <select
                        className="input-field"
                        value={formData.resetFrequency || 'Fiscal Year'}
                        onChange={e => setFormData({ ...formData, resetFrequency: e.target.value })}
                      >
                        <option value="Fiscal Year">Every Fiscal Year (April 1st)</option>
                        <option value="Calendar Year">Every Calendar Year (January 1st)</option>
                        <option value="Never">Never (Continuous Running Sequence)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── UOM CONVERSION FIELDS ── */}
                {activeTab === 'uomconversion' && (
                  <>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Convert From Unit *</label>
                      <select
                        className="input-field"
                        required
                        value={formData.fromUOM || ''}
                        onChange={e => setFormData({ ...formData, fromUOM: e.target.value })}
                      >
                        <option value="" disabled>Select source unit</option>
                        {uoms.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600 }}>Convert To Unit *</label>
                      <select
                        className="input-field"
                        required
                        value={formData.toUOM || ''}
                        onChange={e => setFormData({ ...formData, toUOM: e.target.value })}
                      >
                        <option value="" disabled>Select target unit</option>
                        {uoms.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Multiplier Factor * (1 FromUnit = Factor × ToUnit)</label>
                      <input
                        type="number"
                        step="any"
                        className="input-field"
                        required
                        value={formData.factor ?? 1000}
                        onChange={e => setFormData({ ...formData, factor: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="input-label" style={{ fontWeight: 600 }}>Conversion Notes & Formula</label>
                      <textarea
                        className="input-field"
                        rows="2"
                        placeholder="e.g. 1 Metric Ton = 1000 kg standard metric conversion"
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Form Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color, #e2e8f0)'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : editingId ? `Update ${currentSubsystem.shortName}` : `Save ${currentSubsystem.shortName}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfiguration;