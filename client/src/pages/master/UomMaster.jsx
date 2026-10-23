import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Scale, Ruler, Boxes, Layers, Droplets, Clock, Package, Hash,
  ArrowRight, ArrowLeftRight, Sparkles, Search, Plus, Edit2, Eye,
  Check, CheckCircle2, XCircle, X, Download, LayoutGrid, List,
  Calculator, ShieldCheck, AlertCircle, ExternalLink, FileText,
  RefreshCw, Copy, CheckCircle, HelpCircle, ArrowUpRight
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Guidance / Hint style */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: '12px',
  marginTop: '4px',
  lineHeight: 1.4
};

// Preset standard automotive metrology units for 1-click seeding
const AUTOMOTIVE_PRESETS = [
  { name: 'Each', symbol: 'ea', code: 'EA', type: 'Quantity', decimalPrecision: 0, isBaseUnit: true, systemStandard: 'ISO / Metric', description: 'Discrete piece count for press stampings, brackets, and assemblies' },
  { name: 'Kilograms', symbol: 'kg', code: 'KG', type: 'Weight', decimalPrecision: 3, isBaseUnit: true, systemStandard: 'Metric (SI)', description: 'SI base unit for mass; steel coils, blank weights, and scrap reconciliation' },
  { name: 'Meters', symbol: 'm', code: 'MTR', type: 'Length', decimalPrecision: 2, isBaseUnit: true, systemStandard: 'Metric (SI)', description: 'SI base unit for length; strip infeed, coil unwinding, wire harnesses' },
  { name: 'Metric Ton', symbol: 'MT', code: 'TNE', type: 'Weight', decimalPrecision: 3, isBaseUnit: false, systemStandard: 'Metric (SI)', description: 'Heavy bulk steel infeed (1 MT = 1,000 kg); steel mill coils & raw ingots' },
  { name: 'Grams', symbol: 'g', code: 'GRM', type: 'Weight', decimalPrecision: 2, isBaseUnit: false, systemStandard: 'Metric (SI)', description: 'Fine metallurgical measurement (1 kg = 1,000 g); fasteners and clips' },
  { name: 'Millimeters', symbol: 'mm', code: 'MMT', type: 'Length', decimalPrecision: 2, isBaseUnit: false, systemStandard: 'Metric (SI)', description: 'Sheet metal thickness, stamping pitch, piercing tolerances' },
  { name: 'Centimeters', symbol: 'cm', code: 'CMT', type: 'Length', decimalPrecision: 2, isBaseUnit: false, systemStandard: 'Metric (SI)', description: 'Intermediate component dimensions (1 m = 100 cm)' },
  { name: 'Square Meters', symbol: 'm²', code: 'MTK', type: 'Area', decimalPrecision: 3, isBaseUnit: true, systemStandard: 'Metric (SI)', description: 'Sheet metal blank nesting surface, electro-zinc plating, e-coating area' },
  { name: 'Liters', symbol: 'L', code: 'LTR', type: 'Volume', decimalPrecision: 2, isBaseUnit: true, systemStandard: 'Metric (SI)', description: 'Stamping press lubrication oils, hydraulic fluids, rust preventative liquids' },
  { name: 'Hours', symbol: 'hr', code: 'HUR', type: 'Time', decimalPrecision: 2, isBaseUnit: true, systemStandard: 'ISO / SI', description: 'Machine cycle time, press run time, preventive maintenance duration' },
  { name: 'Minutes', symbol: 'min', code: 'MIN', type: 'Time', decimalPrecision: 1, isBaseUnit: false, systemStandard: 'ISO / SI', description: 'Stamping changeover time, tool setup duration (1 hr = 60 min)' },
  { name: 'Set / Kit', symbol: 'SET', code: 'SET', type: 'Quantity', decimalPrecision: 0, isBaseUnit: false, systemStandard: 'Automotive Customary', description: 'Matched sub-assembly kit (e.g. Precision Piston Kit Set of 4)' },
  { name: 'Box', symbol: 'BOX', code: 'BX', type: 'Packaging', decimalPrecision: 0, isBaseUnit: false, systemStandard: 'Automotive Customary', description: 'Corrugated dispatch box (e.g. 50 pcs / box)' }
];

const PRESET_CONVERSIONS = [
  { fromSymbol: 'MT', toSymbol: 'kg', factor: 1000, formula: '1 MT = 1,000 kg', notes: 'Mill coil conversion to standard stock kg' },
  { fromSymbol: 'kg', toSymbol: 'g', factor: 1000, formula: '1 kg = 1,000 g', notes: 'Blank mass to fine fastener weight' },
  { fromSymbol: 'm', toSymbol: 'mm', factor: 1000, formula: '1 m = 1,000 mm', notes: 'Strip feed pitch calculation' },
  { fromSymbol: 'm', toSymbol: 'cm', factor: 100, formula: '1 m = 100 cm', notes: 'Linear cut length' },
  { fromSymbol: 'hr', toSymbol: 'min', factor: 60, formula: '1 hr = 60 min', notes: 'Machine hours to cycle time minutes' },
  { fromSymbol: 'BOX', toSymbol: 'ea', factor: 50, formula: '1 BOX = 50 ea', notes: 'Standard packing shipper box count' }
];

// Helper to get dimension icon and styling
const getDimensionMeta = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('weight') || t.includes('mass')) {
    return { label: 'Weight / Mass', icon: Scale, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' };
  }
  if (t.includes('length') || t.includes('linear') || t.includes('dist')) {
    return { label: 'Length / Linear', icon: Ruler, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' };
  }
  if (t.includes('area') || t.includes('surface')) {
    return { label: 'Surface Area', icon: Layers, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' };
  }
  if (t.includes('volume') || t.includes('fluid') || t.includes('liquid')) {
    return { label: 'Volume / Fluid', icon: Droplets, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' };
  }
  if (t.includes('time') || t.includes('cycle') || t.includes('hour')) {
    return { label: 'Time / Operations', icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
  }
  if (t.includes('pack') || t.includes('box') || t.includes('carton')) {
    return { label: 'Packaging / Bundles', icon: Package, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' };
  }
  return { label: 'Discrete / Count', icon: Hash, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
};

const UomMaster = () => {
  const navigate = useNavigate();

  // Primary navigation tabs: 'units' | 'conversions'
  const [activeTab, setActiveTab] = useState('units');

  // View mode for units: 'cards' (Metrology Instrument Cards) vs 'table' (Calibration Matrix Table)
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDimensionFilter, setSelectedDimensionFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'symbol' | 'dimension' | 'precision' | 'items'

  // Data state
  const [uoms, setUoms] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Modals & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [conversionFormData, setConversionFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null); // UOM 360 Slide-Over
  const [copiedSymbolId, setCopiedSymbolId] = useState(null);

  // Live Metrology Simulator State
  const [simValue, setSimValue] = useState('100');
  const [simFromUomId, setSimFromUomId] = useState('');
  const [simToUomId, setSimToUomId] = useState('');

  // Launchpad quick-create deep link (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    fetchConversions();
    fetchCatalogReferences();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/master/uom?limit=200&includeInactive=true');
      const items = res.data?.data || [];
      setUoms(items);

      // Auto-set simulator defaults once data is ready
      if (items.length > 0 && !simFromUomId) {
        const kgUnit = items.find(u => u.symbol === 'kg') || items[0];
        const mtUnit = items.find(u => u.symbol === 'MT') || items[1] || items[0];
        setSimFromUomId(mtUnit._id);
        setSimToUomId(kgUnit._id);
      }
    } catch (err) {
      console.error('Error fetching UOMs:', err);
    }
    setLoading(false);
  };

  const fetchConversions = async () => {
    try {
      const res = await axios.get('/master/uomconversion?limit=200&includeInactive=true');
      setConversions(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching UOM Conversions:', err);
    }
  };

  const fetchCatalogReferences = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        axios.get('/master/product?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } })),
        axios.get('/master/material?limit=200&includeInactive=true').catch(() => ({ data: { data: [] } }))
      ]);
      setProducts(pRes.data?.data || []);
      setMaterials(mRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching catalog references:', err);
    }
  };

  // Map how many products and materials reference each UOM
  const uomUsageMap = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const uid = p.uomId?._id || p.uomId;
      if (uid) {
        if (!map[uid]) map[uid] = { products: [], materials: [] };
        map[uid].products.push(p);
      }
    });
    materials.forEach(m => {
      const uid = m.uomId?._id || m.uomId;
      if (uid) {
        if (!map[uid]) map[uid] = { products: [], materials: [] };
        map[uid].materials.push(m);
      }
    });
    return map;
  }, [products, materials]);

  // Telemetry Metrics
  const telemetry = useMemo(() => {
    const total = uoms.length;
    const active = uoms.filter(u => u.status !== 'Inactive' && u.isActive !== false).length;
    const baseUnits = uoms.filter(u => u.isBaseUnit).length;
    const activeConversions = conversions.filter(c => c.status !== 'Inactive' && c.isActive !== false).length;
    const totalLinkedItems = Object.values(uomUsageMap).reduce(
      (acc, curr) => acc + curr.products.length + curr.materials.length,
      0
    );
    return { total, active, baseUnits, activeConversions, totalLinkedItems };
  }, [uoms, conversions, uomUsageMap]);

  // One-click Automotive Presets Seeding
  const handleSeedPresets = async () => {
    if (!await confirmAction('Seed standard automotive metrology units (MT, kg, g, mm, m, L, m², hr, SET, BOX) and common conversion factors?')) return;
    setSeeding(true);
    try {
      const createdUoms = {};
      for (const preset of AUTOMOTIVE_PRESETS) {
        const existing = uoms.find(u => u.symbol?.toLowerCase() === preset.symbol.toLowerCase() || u.name?.toLowerCase() === preset.name.toLowerCase());
        if (!existing) {
          const res = await axios.post('/master/uom', preset);
          createdUoms[preset.symbol] = res.data?.data;
        } else {
          createdUoms[preset.symbol] = existing;
          // If existing is missing precision metadata, update it
          if (!existing.code || existing.isBaseUnit === undefined) {
            await axios.put(`/master/uom/${existing._id}`, {
              ...existing,
              code: existing.code || preset.code,
              type: existing.type || preset.type,
              decimalPrecision: existing.decimalPrecision ?? preset.decimalPrecision,
              isBaseUnit: existing.isBaseUnit ?? preset.isBaseUnit,
              description: existing.description || preset.description,
              systemStandard: existing.systemStandard || preset.systemStandard
            });
          }
        }
      }

      // Refresh list to have latest IDs
      const latestUomsRes = await axios.get('/master/uom?limit=200&includeInactive=true');
      const latestUoms = latestUomsRes.data?.data || [];
      setUoms(latestUoms);

      // Seed conversions
      for (const conv of PRESET_CONVERSIONS) {
        const fromDoc = latestUoms.find(u => u.symbol === conv.fromSymbol);
        const toDoc = latestUoms.find(u => u.symbol === conv.toSymbol);
        if (fromDoc && toDoc) {
          const existingConv = conversions.find(c => {
            const fid = c.fromUOM?._id || c.fromUOM;
            const tid = c.toUOM?._id || c.toUOM;
            return fid === fromDoc._id && tid === toDoc._id;
          });
          if (!existingConv) {
            await axios.post('/master/uomconversion', {
              fromUOM: fromDoc._id,
              toUOM: toDoc._id,
              factor: conv.factor,
              formula: conv.formula,
              notes: conv.notes,
              status: 'Active'
            });
          }
        }
      }

      await fetchConversions();
      notify.success('Precision automotive metrology presets calibrated successfully!');
    } catch (err) {
      console.error(err);
      notify.error('Error seeding presets: ' + (err.response?.data?.message || err.message));
    }
    setSeeding(false);
  };

  // Live Unit Conversion Calculation
  const simResult = useMemo(() => {
    const val = parseFloat(simValue);
    if (isNaN(val) || !simFromUomId || !simToUomId) {
      return { output: '—', formula: 'Select units to calculate conversion' };
    }
    if (simFromUomId === simToUomId) {
      return { output: val.toString(), formula: 'Source and target units are identical (1 : 1 ratio)' };
    }

    const fromUom = uoms.find(u => u._id === simFromUomId);
    const toUom = uoms.find(u => u._id === simToUomId);
    if (!fromUom || !toUom) return { output: '—', formula: 'Unit definition not found' };

    // 1. Direct conversion rule
    const directRule = conversions.find(c => {
      const fid = c.fromUOM?._id || c.fromUOM;
      const tid = c.toUOM?._id || c.toUOM;
      return fid === simFromUomId && tid === simToUomId;
    });
    if (directRule) {
      const calculated = val * directRule.factor;
      const precision = toUom.decimalPrecision ?? 2;
      return {
        output: calculated.toLocaleString('en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision }),
        formula: `${val} ${fromUom.symbol} × ${directRule.factor} = ${(val * directRule.factor).toFixed(precision)} ${toUom.symbol} (${directRule.formula || 'Direct Factor'})`
      };
    }

    // 2. Inverse conversion rule
    const inverseRule = conversions.find(c => {
      const fid = c.fromUOM?._id || c.fromUOM;
      const tid = c.toUOM?._id || c.toUOM;
      return fid === simToUomId && tid === simFromUomId;
    });
    if (inverseRule && inverseRule.factor > 0) {
      const calculated = val / inverseRule.factor;
      const precision = toUom.decimalPrecision ?? 2;
      return {
        output: calculated.toLocaleString('en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision }),
        formula: `${val} ${fromUom.symbol} ÷ ${inverseRule.factor} = ${(val / inverseRule.factor).toFixed(precision)} ${toUom.symbol} (Reciprocal of ${inverseRule.formula || 'Rule'})`
      };
    }

    // 3. Known dimension defaults fallback if direct conversion rule isn't registered in DB
    const fSym = fromUom.symbol;
    const tSym = toUom.symbol;
    const dim = (fromUom.type || '').toLowerCase();
    const targetDim = (toUom.type || '').toLowerCase();

    if (dim !== targetDim && dim !== '' && targetDim !== '') {
      return {
        output: 'Incompatible Dimensions',
        formula: `Cannot convert ${fromUom.type} (${fromUom.symbol}) into ${toUom.type} (${toUom.symbol}). Dimensions must match.`
      };
    }

    // Hardcoded physics standard conversions fallback
    let fallbackFactor = null;
    let factorFormula = '';
    if (fSym === 'MT' && tSym === 'kg') { fallbackFactor = 1000; factorFormula = '1 MT = 1,000 kg'; }
    else if (fSym === 'kg' && tSym === 'MT') { fallbackFactor = 0.001; factorFormula = '1 kg = 0.001 MT'; }
    else if (fSym === 'kg' && tSym === 'g') { fallbackFactor = 1000; factorFormula = '1 kg = 1,000 g'; }
    else if (fSym === 'g' && tSym === 'kg') { fallbackFactor = 0.001; factorFormula = '1 g = 0.001 kg'; }
    else if (fSym === 'm' && tSym === 'mm') { fallbackFactor = 1000; factorFormula = '1 m = 1,000 mm'; }
    else if (fSym === 'mm' && tSym === 'm') { fallbackFactor = 0.001; factorFormula = '1 mm = 0.001 m'; }
    else if (fSym === 'm' && tSym === 'cm') { fallbackFactor = 100; factorFormula = '1 m = 100 cm'; }
    else if (fSym === 'cm' && tSym === 'm') { fallbackFactor = 0.01; factorFormula = '1 cm = 0.01 m'; }
    else if (fSym === 'hr' && tSym === 'min') { fallbackFactor = 60; factorFormula = '1 hr = 60 min'; }
    else if (fSym === 'min' && tSym === 'hr') { fallbackFactor = 1 / 60; factorFormula = '60 min = 1 hr'; }
    else if (fSym === 'BOX' && tSym === 'ea') { fallbackFactor = 50; factorFormula = '1 BOX = 50 ea'; }
    else if (fSym === 'ea' && tSym === 'BOX') { fallbackFactor = 0.02; factorFormula = '50 ea = 1 BOX'; }

    if (fallbackFactor !== null) {
      const calculated = val * fallbackFactor;
      const precision = toUom.decimalPrecision ?? 2;
      return {
        output: calculated.toLocaleString('en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision }),
        formula: `${val} ${fSym} × ${fallbackFactor} = ${calculated.toFixed(precision)} ${tSym} (${factorFormula})`
      };
    }

    return {
      output: 'No Conversion Rule',
      formula: `No calibrated conversion factor registered between ${fromUom.name} and ${toUom.name}. Click "+ Add Conversion Rule" above to define one.`
    };
  }, [simValue, simFromUomId, simToUomId, uoms, conversions]);

  const handleSwapSimulator = () => {
    const temp = simFromUomId;
    setSimFromUomId(simToUomId);
    setSimToUomId(temp);
  };

  // Filtered & Sorted UOMs
  const filteredUoms = useMemo(() => {
    return uoms.filter(item => {
      // Dimension Filter
      if (selectedDimensionFilter !== 'ALL') {
        const typeMatch = (item.type || '').toLowerCase();
        const filter = selectedDimensionFilter.toLowerCase();
        if (!typeMatch.includes(filter)) return false;
      }
      // Status Filter
      if (selectedStatusFilter === 'ACTIVE' && (item.status === 'Inactive' || item.isActive === false)) return false;
      if (selectedStatusFilter === 'INACTIVE' && item.status !== 'Inactive' && item.isActive !== false) return false;

      // Text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchSymbol = item.symbol?.toLowerCase().includes(q);
        const matchCode = item.code?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchType = item.type?.toLowerCase().includes(q);
        if (!matchName && !matchSymbol && !matchCode && !matchDesc && !matchType) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'symbol') return (a.symbol || '').localeCompare(b.symbol || '');
      if (sortBy === 'dimension') return (a.type || '').localeCompare(b.type || '');
      if (sortBy === 'precision') return (b.decimalPrecision || 0) - (a.decimalPrecision || 0);
      if (sortBy === 'items') {
        const countA = (uomUsageMap[a._id]?.products.length || 0) + (uomUsageMap[a._id]?.materials.length || 0);
        const countB = (uomUsageMap[b._id]?.products.length || 0) + (uomUsageMap[b._id]?.materials.length || 0);
        return countB - countA;
      }
      return 0;
    });
  }, [uoms, selectedDimensionFilter, selectedStatusFilter, searchTerm, sortBy, uomUsageMap]);

  // Copy symbol to clipboard
  const handleCopySymbol = (id, sym) => {
    navigator.clipboard?.writeText(sym);
    setCopiedSymbolId(id);
    notify.success(`Copied "${sym}" to clipboard!`);
    setTimeout(() => setCopiedSymbolId(null), 2000);
  };

  // Open Create UOM Modal
  const openCreate = () => {
    setFormData({
      name: '',
      symbol: '',
      code: '',
      type: 'Weight',
      decimalPrecision: 2,
      isBaseUnit: false,
      systemStandard: 'Metric (SI)',
      description: '',
      status: 'Active'
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit UOM Modal
  const handleEdit = (row) => {
    setFormData({
      ...row,
      decimalPrecision: row.decimalPrecision ?? 2,
      isBaseUnit: !!row.isBaseUnit,
      systemStandard: row.systemStandard || 'Metric (SI)',
      status: row.status || (row.isActive ? 'Active' : 'Inactive')
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  // Toggle Active Status
  const toggleStatus = async (row) => {
    const isCurrentlyActive = row.status !== 'Inactive' && row.isActive !== false;
    const linked = (uomUsageMap[row._id]?.products.length || 0) + (uomUsageMap[row._id]?.materials.length || 0);

    if (isCurrentlyActive && linked > 0) {
      if (!await confirmAction(`Warning: This unit is currently utilized by ${linked} catalog items. Deactivating it may affect BOMs and inventory receipts. Proceed with deactivation?`)) {
        return;
      }
    } else if (isCurrentlyActive) {
      if (!await confirmAction(`Deactivate unit "${row.name}" (${row.symbol})?`)) return;
    }

    try {
      await axios.put(`/master/uom/${row._id}`, {
        isActive: !isCurrentlyActive,
        status: isCurrentlyActive ? 'Inactive' : 'Active'
      });
      notify.success(`Unit ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully.`);
      fetchData();
    } catch (err) {
      console.error(err);
      notify.error('Error updating status');
    }
  };

  // Save UOM
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        decimalPrecision: parseInt(formData.decimalPrecision ?? 2, 10),
        isBaseUnit: !!formData.isBaseUnit,
        isActive: formData.status !== 'Inactive'
      };

      if (editingId) {
        await axios.put(`/master/uom/${editingId}`, payload);
        notify.success('Unit of measure updated successfully!');
      } else {
        await axios.post('/master/uom', payload);
        notify.success('New unit of measure registered successfully!');
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving unit of measure');
    }
    setSaving(false);
  };

  // Save Conversion Rule
  const handleSaveConversion = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (conversionFormData.fromUOM === conversionFormData.toUOM) {
      notify.error('Source and Target units must be distinct.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...conversionFormData,
        factor: parseFloat(conversionFormData.factor),
        status: 'Active',
        isActive: true
      };
      await axios.post('/master/uomconversion', payload);
      notify.success('Conversion rule calibrated successfully!');
      setIsConversionModalOpen(false);
      setConversionFormData({});
      fetchConversions();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving conversion rule');
    }
    setSaving(false);
  };

  // Delete Conversion Rule
  const handleDeleteConversion = async (conv) => {
    if (!await confirmAction(`Delete conversion rule between ${conv.fromUOM?.symbol || 'from'} and ${conv.toUOM?.symbol || 'to'}?`)) return;
    try {
      await axios.delete(`/master/uomconversion/${conv._id}`);
      notify.success('Conversion rule removed.');
      fetchConversions();
    } catch (err) {
      notify.error('Error deleting conversion rule');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredUoms.length === 0) {
      notify.error('No units available to export.');
      return;
    }
    const headers = ['Unit Name', 'Symbol', 'ISO Code', 'Dimension', 'Base Unit', 'Precision Decimals', 'Standard', 'Status', 'Linked Products', 'Linked Materials', 'Description'];
    const rows = filteredUoms.map(u => [
      `"${u.name || ''}"`,
      `"${u.symbol || ''}"`,
      `"${u.code || ''}"`,
      `"${u.type || ''}"`,
      `"${u.isBaseUnit ? 'YES' : 'NO'}"`,
      `"${u.decimalPrecision ?? 2}"`,
      `"${u.systemStandard || 'Metric (SI)'}"`,
      `"${u.status || (u.isActive ? 'Active' : 'Inactive')}"`,
      `"${uomUsageMap[u._id]?.products.length || 0}"`,
      `"${uomUsageMap[u._id]?.materials.length || 0}"`,
      `"${(u.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Precision_Metrology_UOM_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Metrology registry exported to CSV.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 20 }}>
      {/* ── METROLOGY CONSOLE BANNER ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #042f2c 0%, #064e3b 45%, #0f766e 100%)',
        borderRadius: 12,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Vernier scale background lines pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '45%',
          opacity: 0.08,
          backgroundImage: 'repeating-linear-gradient(90deg, #ffffff, #ffffff 1px, transparent 1px, transparent 16px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', marginBottom: 12, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Scale size={14} color="#5eead4" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#5eead4', textTransform: 'uppercase' }}>
                Precision Metrology & Unit Standards • ISO 80000 / SI Calibration
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Units of Measure & Precision Metrology
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.55 }}>
              Central enterprise metrology directory governing steel coil mass reconciliations (MT ⇄ kg), sheet blank dimensions (m ⇄ mm), cycle time metrics (hr ⇄ min), and BOM consumption multipliers for automated ERP conversion.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Export CSV registry"
            >
              <Download size={15} /> Export CSV
            </button>

            <button
              onClick={handleSeedPresets}
              disabled={seeding}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(94, 234, 212, 0.2)',
                color: '#5eead4',
                border: '1px solid rgba(94, 234, 212, 0.4)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Ensure all standard automotive units and conversion rules exist"
            >
              <Sparkles size={15} /> {seeding ? 'Calibrating…' : 'Seed Automotive Presets'}
            </button>

            <button
              onClick={() => {
                setConversionFormData({
                  fromUOM: uoms[0]?._id || '',
                  toUOM: uoms[1]?._id || '',
                  factor: 1000,
                  formula: '',
                  notes: ''
                });
                setIsConversionModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <ArrowLeftRight size={15} /> + Add Conversion Rule
            </button>

            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} /> Register Unit
            </button>
          </div>
        </div>

        {/* ── METROLOGY TELEMETRY KPI TILES ─────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginTop: 22
        }}>
          {/* Tile 1 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#99f6e4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Calibrated Units
              </span>
              <Scale size={14} color="#5eead4" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.total}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>({telemetry.active} Active in Master)</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Standard ISO dimensional vocabulary
            </p>
          </div>

          {/* Tile 2 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#99f6e4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SI Base Anchors
              </span>
              <ShieldCheck size={14} color="#5eead4" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.baseUnits}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>Base Dimensions</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              Core reference units (kg, m, ea, m², L, hr)
            </p>
          </div>

          {/* Tile 3 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#99f6e4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Conversion Engine
              </span>
              <ArrowLeftRight size={14} color="#5eead4" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.activeConversions}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>Active Rules</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              1 MT = 1,000 kg • 1 m = 1,000 mm
            </p>
          </div>

          {/* Tile 4 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#99f6e4', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Catalog Dependencies
              </span>
              <Boxes size={14} color="#5eead4" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{telemetry.totalLinkedItems}</span>
              <span style={{ fontSize: 11, color: '#a7f3d0' }}>Bound Master Items</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(255, 255, 255, 0.7)' }}>
              {materials.length} Raw Materials • {products.length} Products
            </p>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE UNIVERSAL METROLOGY SIMULATOR / CONVERTER BAR ───────── */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: '14px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={16} color="#0d9488" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Interactive Universal Unit Converter & Calibration Simulator
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              — Test real-time shop floor conversion math
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Input Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Value:</label>
            <input
              type="number"
              step="any"
              value={simValue}
              onChange={e => setSimValue(e.target.value)}
              style={{
                width: 110,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: 13
              }}
              placeholder="e.g. 100"
            />
          </div>

          {/* From UOM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>From:</label>
            <select
              value={simFromUomId}
              onChange={e => setSimFromUomId(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {uoms.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.symbol}) — {u.type || 'General'}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapSimulator}
            title="Swap source and target units"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: '#0d9488',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* To UOM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>To:</label>
            <select
              value={simToUomId}
              onChange={e => setSimToUomId(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {uoms.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.symbol}) — {u.type || 'General'}
                </option>
              ))}
            </select>
          </div>

          {/* Equal Sign */}
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>=</span>

          {/* Output Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            background: 'rgba(13, 148, 136, 0.1)',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: 6
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0d9488' }}>
              {simResult.output} {uoms.find(u => u._id === simToUomId)?.symbol}
            </span>
          </div>

          {/* Formula text */}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1, minWidth: 200 }}>
            {simResult.formula}
          </span>
        </div>
      </div>

      {/* ── CONSOLE TABS NAVIGATION ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('units')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'units' ? '#0d9488' : 'transparent',
              color: activeTab === 'units' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <Scale size={15} />
            Metrology Units ({uoms.length})
          </button>

          <button
            onClick={() => setActiveTab('conversions')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'conversions' ? '#0d9488' : 'transparent',
              color: activeTab === 'conversions' ? '#ffffff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeftRight size={15} />
            Precision Conversion Matrix ({conversions.length})
          </button>
        </div>

        {activeTab === 'units' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', padding: 3, borderRadius: 6, border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#0d9488' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600
              }}
              title="Calibrated Instrument Cards View"
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#0d9488' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600
              }}
              title="Calibration Matrix Table View"
            >
              <List size={14} /> Table
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: METROLOGY UNITS ─────────────────────────────────────────── */}
      {activeTab === 'units' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dimension Filter Chips & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'ALL', label: 'All Dimensions' },
                { id: 'Weight', label: 'Weight / Mass', icon: Scale },
                { id: 'Length', label: 'Length / Linear', icon: Ruler },
                { id: 'Quantity', label: 'Discrete Count', icon: Hash },
                { id: 'Area', label: 'Surface Area', icon: Layers },
                { id: 'Volume', label: 'Volume / Fluid', icon: Droplets },
                { id: 'Time', label: 'Time / Ops', icon: Clock },
                { id: 'Packaging', label: 'Packaging', icon: Package }
              ].map(dim => {
                const isSelected = selectedDimensionFilter === dim.id;
                const Icon = dim.icon;
                return (
                  <button
                    key={dim.id}
                    onClick={() => setSelectedDimensionFilter(dim.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #0d9488' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(13, 148, 136, 0.15)' : 'var(--bg-secondary)',
                      color: isSelected ? '#0d9488' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {Icon && <Icon size={12} />}
                    {dim.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', width: 240 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search unit, symbol, ISO code…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 12
                }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 12
                }}
              >
                <option value="name">Sort: Name (A-Z)</option>
                <option value="symbol">Sort: Symbol</option>
                <option value="dimension">Sort: Dimension Type</option>
                <option value="precision">Sort: Decimal Precision</option>
                <option value="items">Sort: Linked Catalog Items</option>
              </select>
            </div>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Calibrating metrology records…
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredUoms.length === 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <Scale size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                No units match the selected metrology criteria
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px 0', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                Try adjusting your search query, or click below to seed standard precision automotive units (kg, MT, m, mm, L, ea, SET).
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={handleSeedPresets}
                  className="btn btn-primary"
                  style={{ background: '#0d9488', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={14} /> Seed Automotive Presets
                </button>
                <button
                  onClick={openCreate}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={14} /> Add Custom Unit
                </button>
              </div>
            </div>
          )}

          {/* ── VIEW MODE 1: CALIBRATED INSTRUMENT CARDS (GRID) ──────────────── */}
          {!loading && viewMode === 'cards' && filteredUoms.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16
            }}>
              {filteredUoms.map(u => {
                const meta = getDimensionMeta(u.type);
                const Icon = meta.icon;
                const isActive = u.status !== 'Inactive' && u.isActive !== false;
                const usage = uomUsageMap[u._id] || { products: [], materials: [] };
                const totalLinked = usage.products.length + usage.materials.length;
                const isCopied = copiedSymbolId === u._id;

                return (
                  <div
                    key={u._id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                      borderTop: `3px solid ${meta.color}`
                    }}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Large Symbol Badge */}
                          <div
                            onClick={() => handleCopySymbol(u._id, u.symbol)}
                            title="Click to copy unit symbol"
                            style={{
                              background: meta.bg,
                              border: `1px solid ${meta.border}`,
                              color: meta.color,
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontWeight: 800,
                              fontSize: 16,
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span>{u.symbol}</span>
                            {isCopied ? <Check size={12} /> : <Copy size={11} style={{ opacity: 0.6 }} />}
                          </div>

                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              {u.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              {u.code && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                                  ISO: {u.code}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {u.systemStandard || 'Metric (SI)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div onClick={() => toggleStatus(u)} style={{ cursor: 'pointer' }} title="Toggle active status">
                          <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                        </div>
                      </div>

                      {/* Dimension and Base Unit tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`
                        }}>
                          <Icon size={12} />
                          {meta.label}
                        </span>

                        {u.isBaseUnit ? (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            letterSpacing: '0.04em'
                          }}>
                            ★ SI BASE UNIT
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                          }}>
                            DERIVED UNIT
                          </span>
                        )}

                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {u.decimalPrecision ?? 2} Decimals ({Math.pow(10, -(u.decimalPrecision ?? 2)).toFixed(u.decimalPrecision ?? 2)})
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        margin: '0 0 12px 0',
                        lineHeight: 1.45,
                        minHeight: 34
                      }}>
                        {u.description || 'General industrial measure for production, stock control, and engineering BOM assemblies.'}
                      </p>
                    </div>

                    {/* Bottom Row: Dependencies & Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-color)',
                      marginTop: 6
                    }}>
                      {/* Linked catalog items count */}
                      <div
                        onClick={() => setSelectedDossier(u)}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: totalLinked > 0 ? '#0d9488' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Click to view linked catalog items"
                      >
                        <Boxes size={13} />
                        {totalLinked > 0 ? (
                          <span>{totalLinked} Catalog Items ({usage.materials.length} RM, {usage.products.length} FG)</span>
                        ) : (
                          <span>0 Catalog Bindings</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setSimFromUomId(u._id);
                            notify.success(`Set ${u.name} as simulator source unit!`);
                          }}
                          title="Simulate conversions with this unit"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px 6px'
                          }}
                        >
                          <Calculator size={14} />
                        </button>

                        <button
                          onClick={() => setSelectedDossier(u)}
                          title="Inspect Metrology 360 Dossier"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#0d9488',
                            padding: '4px 6px'
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handleEdit(u)}
                          title="Edit unit specifications"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--accent-primary)',
                            padding: '4px 6px'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VIEW MODE 2: CALIBRATION MATRIX TABLE ───────────────────────── */}
          {!loading && viewMode === 'table' && filteredUoms.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 12 }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Symbol & Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Unit Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dimension Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Base Unit?</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Decimals</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Standard</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Linked Items</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUoms.map((u, idx) => {
                    const meta = getDimensionMeta(u.type);
                    const Icon = meta.icon;
                    const isActive = u.status !== 'Inactive' && u.isActive !== false;
                    const usage = uomUsageMap[u._id] || { products: [], materials: [] };
                    const totalLinked = usage.products.length + usage.materials.length;

                    return (
                      <tr
                        key={u._id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                              fontSize: 12
                            }}>
                              {u.symbol}
                            </span>
                            {u.code && (
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                ({u.code})
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div>{u.name}</div>
                          {u.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            color: meta.color
                          }}>
                            <Icon size={12} />
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {u.isBaseUnit ? (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>★ Base Unit</span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Derived</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                          {u.decimalPrecision ?? 2} ({Math.pow(10, -(u.decimalPrecision ?? 2)).toFixed(u.decimalPrecision ?? 2)})
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {u.systemStandard || 'Metric (SI)'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            onClick={() => setSelectedDossier(u)}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: totalLinked > 0 ? '#0d9488' : 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            {totalLinked} Items ({usage.materials.length} RM, {usage.products.length} FG)
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge value={isActive ? 'Active' : 'Inactive'} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => setSelectedDossier(u)}
                              title="Inspect Unit 360"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d9488', padding: '4px' }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(u)}
                              title="Edit"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', padding: '4px' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => toggleStatus(u)}
                              title={isActive ? 'Deactivate' : 'Activate'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? 'var(--accent-danger)' : 'var(--accent-success)', padding: '4px' }}
                            >
                              {isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PRECISION CONVERSION MATRIX ──────────────────────────────── */}
      {activeTab === 'conversions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Active Dimensional Conversion Multipliers
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Direct algebraic multipliers utilized by MRP scheduling, coil strip backflushing, and purchase order conversions.
              </p>
            </div>

            <button
              onClick={() => {
                setConversionFormData({
                  fromUOM: uoms[0]?._id || '',
                  toUOM: uoms[1]?._id || '',
                  factor: 1000,
                  formula: '',
                  notes: ''
                });
                setIsConversionModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ background: '#0d9488', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> + Add Conversion Rule
            </button>
          </div>

          {conversions.length === 0 ? (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 12,
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <ArrowLeftRight size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                No conversion rules registered yet
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Add conversion rules like 1 Metric Ton = 1,000 Kilograms or click below to seed presets.
              </p>
              <button
                onClick={handleSeedPresets}
                className="btn btn-primary"
                style={{ background: '#0d9488', border: 'none' }}
              >
                <Sparkles size={14} /> Seed Standard Automotive Conversions
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16
            }}>
              {conversions.map(conv => {
                const fromDoc = conv.fromUOM || {};
                const toDoc = conv.toUOM || {};
                const fromMeta = getDimensionMeta(fromDoc.type);
                const toMeta = getDimensionMeta(toDoc.type);

                return (
                  <div
                    key={conv._id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      {/* From ➔ To Visual Strip */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        {/* Source Unit */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: fromMeta.bg,
                            color: fromMeta.color,
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            border: `1px solid ${fromMeta.border}`
                          }}>
                            {fromDoc.symbol || 'Source'}
                          </span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {fromDoc.name || 'Source Unit'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {fromMeta.label}
                            </div>
                          </div>
                        </div>

                        {/* Factor Arrow */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', background: 'rgba(13, 148, 136, 0.1)', padding: '2px 8px', borderRadius: 9999, border: '1px solid rgba(13, 148, 136, 0.25)' }}>
                            × {conv.factor}
                          </span>
                          <ArrowRight size={16} color="#0d9488" style={{ marginTop: 2 }} />
                        </div>

                        {/* Target Unit */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {toDoc.name || 'Target Unit'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {toMeta.label}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: toMeta.bg,
                            color: toMeta.color,
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            border: `1px solid ${toMeta.border}`
                          }}>
                            {toDoc.symbol || 'Target'}
                          </span>
                        </div>
                      </div>

                      {/* Formula Card */}
                      <div style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        marginBottom: 10
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Conversion Formula:</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', fontFamily: 'monospace' }}>
                          {conv.formula || `1 ${fromDoc.symbol || 'from'} = ${conv.factor} ${toDoc.symbol || 'to'}`}
                        </div>
                        {conv.notes && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {conv.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Status: <strong style={{ color: '#10b981' }}>Calibrated</strong>
                      </span>
                      <button
                        onClick={() => handleDeleteConversion(conv)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-danger)',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <X size={13} /> Remove Rule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── METROLOGY 360 SLIDE-OVER DOSSIER DRAWER ────────────────────────── */}
      {selectedDossier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1050,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 580,
            background: 'var(--bg-secondary)',
            height: '100%',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              {/* Drawer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: 16,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(13, 148, 136, 0.15)',
                      color: '#0d9488',
                      border: '1px solid rgba(13, 148, 136, 0.3)'
                    }}>
                      {selectedDossier.symbol}
                    </span>
                    {selectedDossier.code && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                        ISO: {selectedDossier.code}
                      </span>
                    )}
                    {selectedDossier.isBaseUnit && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        ★ SI BASE
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {selectedDossier.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDossier(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Section 1: Metrology Specifications */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Metrology Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Dimension Type:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDossier.type || 'General Count'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Decimal Precision:</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {selectedDossier.decimalPrecision ?? 2} Decimals ({Math.pow(10, -(selectedDossier.decimalPrecision ?? 2)).toFixed(selectedDossier.decimalPrecision ?? 2)})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>System Standard:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDossier.systemStandard || 'Metric (SI)'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Master Status:</div>
                    <div><StatusBadge value={selectedDossier.status || (selectedDossier.isActive ? 'Active' : 'Inactive')} /></div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Description & Operational Context:</div>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                      {selectedDossier.description || 'General industrial measure for production, stock control, and engineering BOM assemblies.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Active Conversion Rules for this Unit */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Calibrated Conversion Rules
                </h4>
                {(() => {
                  const unitConversions = conversions.filter(c => {
                    const fid = c.fromUOM?._id || c.fromUOM;
                    const tid = c.toUOM?._id || c.toUOM;
                    return fid === selectedDossier._id || tid === selectedDossier._id;
                  });

                  if (unitConversions.length === 0) {
                    return (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No direct conversion rules calibrated for {selectedDossier.name} yet.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {unitConversions.map(c => {
                        const isFrom = (c.fromUOM?._id || c.fromUOM) === selectedDossier._id;
                        return (
                          <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 12 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {c.formula || (isFrom ? `1 ${c.fromUOM?.symbol} = ${c.factor} ${c.toUOM?.symbol}` : `1 ${c.toUOM?.symbol} = ${1 / c.factor} ${c.fromUOM?.symbol}`)}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {c.notes || 'Calibrated'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Section 3: Bound Catalog Items (Products & Materials) */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
                  Bound Master Catalog Items
                </h4>
                {(() => {
                  const usage = uomUsageMap[selectedDossier._id] || { products: [], materials: [] };
                  const hasItems = usage.products.length > 0 || usage.materials.length > 0;

                  if (!hasItems) {
                    return (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No products or raw materials currently bound to {selectedDossier.name}.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Raw Materials */}
                      {usage.materials.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
                            Raw Materials ({usage.materials.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                            {usage.materials.map(m => (
                              <div
                                key={m._id}
                                onClick={() => navigate('/master/material')}
                                style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                                title="Click to view in Raw Materials"
                              >
                                <span><strong>{m.code}</strong> — {m.name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>₹{m.standardCost || 0} / {selectedDossier.symbol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products We Make */}
                      {usage.products.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: 4, marginTop: 6 }}>
                            Products We Make ({usage.products.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                            {usage.products.map(p => (
                              <div
                                key={p._id}
                                onClick={() => navigate('/master/product')}
                                style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                                title="Click to view in Products We Make"
                              >
                                <span><strong>{p.code}</strong> — {p.name}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>₹{p.sellingPrice || 0} / {selectedDossier.symbol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-color)', marginTop: 20 }}>
              <button
                onClick={() => {
                  setSelectedDossier(null);
                  handleEdit(selectedDossier);
                }}
                className="btn btn-primary"
                style={{ flex: 1, background: '#0d9488', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Edit2 size={14} /> Edit Unit
              </button>
              <button
                onClick={() => {
                  const unit = selectedDossier;
                  setSelectedDossier(null);
                  toggleStatus(unit);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT UNIT OF MEASURE MODAL ─────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={18} color="#0d9488" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit Metrology Unit Specifications' : 'Register New Unit of Measure'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Unit Name */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Unit Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Kilograms, Metric Ton, Millimeters, Square Meters"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  <p style={hintStyle}>Full descriptive designation used across official invoices and engineering drawings.</p>
                </div>

                {/* Symbol */}
                <div className="input-group">
                  <label className="input-label">Unit Symbol / Abbreviation *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. kg, MT, mm, ea, m²"
                    value={formData.symbol || ''}
                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                  />
                  <p style={hintStyle}>Short symbol printed on purchase orders and dispatch labels.</p>
                </div>

                {/* ISO Code */}
                <div className="input-group">
                  <label className="input-label">ISO / GST UQC Code</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. KGM, TNE, MMT, NOS"
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  <p style={hintStyle}>Standard ISO 80000 / Indian GST UQC e-invoicing identifier.</p>
                </div>

                {/* What it Measures (Dimension) */}
                <div className="input-group">
                  <label className="input-label">Physical Dimension / What It Measures *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.type || 'Weight'}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Weight">Weight / Mass (Coils, ingots, scrap)</option>
                    <option value="Length">Length / Linear (Strip infeed, harnesses)</option>
                    <option value="Quantity">Discrete Count / Pieces (Assemblies, stampings)</option>
                    <option value="Area">Surface Area (Blank nesting, e-coating)</option>
                    <option value="Volume">Volume / Fluid (Press oils, coolants)</option>
                    <option value="Time">Time / Machine Operations (Cycle time, runs)</option>
                    <option value="Packaging">Packaging / Shipping Bundles (Boxes, crates)</option>
                  </select>
                </div>

                {/* Decimal Precision */}
                <div className="input-group">
                  <label className="input-label">Decimal Precision (0 - 4 Decimals) *</label>
                  <select
                    className="input-field"
                    required
                    value={formData.decimalPrecision ?? 2}
                    onChange={e => setFormData({ ...formData, decimalPrecision: parseInt(e.target.value, 10) })}
                  >
                    <option value="0">0 Decimals (Integer — Discreet counts, boxes)</option>
                    <option value="1">1 Decimal (0.1 — Cycle minutes, rough cuts)</option>
                    <option value="2">2 Decimals (0.01 — Dimensions mm/m, volumes)</option>
                    <option value="3">3 Decimals (0.001 — Precision coil kg & metric tons)</option>
                    <option value="4">4 Decimals (0.0001 — High-precision chemistry weighing)</option>
                  </select>
                  <p style={hintStyle}>Determines rounding rules across inventory ledgers and invoices.</p>
                </div>

                {/* System Standard */}
                <div className="input-group">
                  <label className="input-label">System Standard</label>
                  <select
                    className="input-field"
                    value={formData.systemStandard || 'Metric (SI)'}
                    onChange={e => setFormData({ ...formData, systemStandard: e.target.value })}
                  >
                    <option value="Metric (SI)">Metric (SI / International System)</option>
                    <option value="Automotive Customary">Automotive Customary</option>
                    <option value="ISO 80000">ISO 80000 Metrology</option>
                    <option value="Imperial">Imperial / Customary</option>
                  </select>
                </div>

                {/* Status */}
                <div className="input-group">
                  <label className="input-label">Operational Status</label>
                  <select
                    className="input-field"
                    value={formData.status || 'Active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active — Available for all modules</option>
                    <option value="Inactive">Inactive — Retired from new catalog entries</option>
                  </select>
                </div>

                {/* Base Unit Checkbox */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    id="isBaseUnitCheck"
                    checked={!!formData.isBaseUnit}
                    onChange={e => setFormData({ ...formData, isBaseUnit: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="isBaseUnitCheck" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}>
                    Mark as Fundamental SI Base Anchor for this dimension (e.g. kg for Weight, m for Length)
                  </label>
                </div>

                {/* Description */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Description & Application Notes</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Specify factory usage, e.g., 'Primary raw material unit for press infeed coils and strip stock.'"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
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
                  style={{ background: '#0d9488', border: 'none' }}
                >
                  {saving ? 'Calibrating…' : editingId ? 'Update Unit Specifications' : 'Save Unit of Measure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE CONVERSION RULE MODAL ────────────────────────────────────── */}
      {isConversionModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 540,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ArrowLeftRight size={18} color="#0d9488" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Calibrate Unit Conversion Rule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConversionModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConversion} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* From UOM */}
                <div className="input-group">
                  <label className="input-label">From Unit (1 Source Unit) *</label>
                  <select
                    className="input-field"
                    required
                    value={conversionFormData.fromUOM || ''}
                    onChange={e => setConversionFormData({ ...conversionFormData, fromUOM: e.target.value })}
                  >
                    <option value="" disabled>Select source unit</option>
                    {uoms.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* To UOM */}
                <div className="input-group">
                  <label className="input-label">To Unit (Target Unit) *</label>
                  <select
                    className="input-field"
                    required
                    value={conversionFormData.toUOM || ''}
                    onChange={e => setConversionFormData({ ...conversionFormData, toUOM: e.target.value })}
                  >
                    <option value="" disabled>Select target unit</option>
                    {uoms.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* Conversion Factor */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Conversion Factor Multiplier *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.0000001"
                    className="input-field"
                    placeholder="e.g. 1000 for 1 MT = 1,000 kg"
                    value={conversionFormData.factor ?? ''}
                    onChange={e => setConversionFormData({ ...conversionFormData, factor: e.target.value })}
                  />
                  <p style={hintStyle}>Equation: 1 [From Unit] = [Factor] × [To Unit]. For example: 1 MT = 1,000 kg.</p>
                </div>

                {/* Formula Text */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Formula Description Label</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 1 MT = 1,000 kg"
                    value={conversionFormData.formula || ''}
                    onChange={e => setConversionFormData({ ...conversionFormData, formula: e.target.value })}
                  />
                </div>

                {/* Operational Notes */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Operational Notes</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Primary mill coil delivery conversion into standard inventory stock kg"
                    value={conversionFormData.notes || ''}
                    onChange={e => setConversionFormData({ ...conversionFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsConversionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ background: '#0d9488', border: 'none' }}
                >
                  {saving ? 'Calibrating…' : 'Calibrate Conversion Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UomMaster;