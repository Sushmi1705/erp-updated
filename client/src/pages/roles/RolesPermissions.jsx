import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Edit2,
  Copy,
  Trash2,
  Users,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Sliders,
  Grid,
  Layers,
  CheckCircle2,
  FileText,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'approve'];

// Role category grouping for navigation rail
const ROLE_CATEGORIES = {
  'Executive & Governance': ['Super Admin', 'Plant Manager'],
  'Production & Shop Floor': ['Production Planner', 'Shop Floor Supervisor', 'Maintenance Engineer'],
  'Quality & Inspection': ['Quality Inspector'],
  'Procurement & Inventory': ['Purchase Officer', 'Store Keeper'],
  'Sales, Finance & Dispatch': ['Sales Executive', 'Accounts Executive', 'Dispatch Coordinator'],
  'HR & Workforce': ['HR Executive']
};

const ROLE_THEMES = {
  'Super Admin': { color: '#7e22ce', bg: '#f3e8ff', border: '#d8b4fe' },
  'Plant Manager': { color: '#3730a3', bg: '#e0e7ff', border: '#a5b4fc' },
  'Quality Inspector': { color: '#be123c', bg: '#ffe4e6', border: '#fecdd3' },
  'Maintenance Engineer': { color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
  'Purchase Officer': { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  'Store Keeper': { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  'Production Planner': { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  'Shop Floor Supervisor': { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  'HR Executive': { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe' },
  'Accounts Executive': { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  'Sales Executive': { color: '#0f766e', bg: '#ccfbf1', border: '#99f6e4' },
  'Dispatch Coordinator': { color: '#334155', bg: '#f1f5f9', border: '#cbd5e1' }
};

const RolesPermissions = () => {
  // Core state
  const [roles, setRoles] = useState([]);
  const [cat, setCat] = useState(null); // { groups, actions }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'studio' (Dual-Pane Access Studio) | 'matrix' (Enterprise Cross-Role Grid)
  const [viewMode, setViewMode] = useState('studio');

  // Currently inspected role in Studio
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [stagedPermissions, setStagedPermissions] = useState([]);
  const [roleIsActive, setRoleIsActive] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [savingStudio, setSavingStudio] = useState(false);

  // Search & Filters
  const [roleSearch, setRoleSearch] = useState('');
  const [matrixGroupFilter, setMatrixGroupFilter] = useState('all');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalFormData, setModalFormData] = useState({ name: '', description: '', cloneFrom: '' });
  const [modalSaving, setModalSaving] = useState(false);

  // Expanded groups in Studio
  const [expandedGroups, setExpandedGroups] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, c] = await Promise.all([
        axios.get('/roles'),
        axios.get('/roles/catalogue')
      ]);
      const fetchedRoles = r.data?.data || [];
      const fetchedCat = c.data?.data || null;
      setRoles(fetchedRoles);
      setCat(fetchedCat);

      // Default expand all groups in studio
      if (fetchedCat?.groups) {
        const initExpanded = {};
        fetchedCat.groups.forEach(g => { initExpanded[g.key] = true; });
        setExpandedGroups(initExpanded);
      }

      // Default select the first role if none selected or if selected was deleted
      if (fetchedRoles.length > 0) {
        const currentSelected = fetchedRoles.find(role => role._id === selectedRoleId) || fetchedRoles[0];
        selectRoleForStudio(currentSelected);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load roles and access catalogue.');
      notify.error('Failed to load roles catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const actions = cat?.actions || [];
  const groups = cat?.groups || [];
  const allModules = useMemo(
    () => groups.flatMap(g => g.modules.map(m => m.module)),
    [groups]
  );

  const selectedRole = useMemo(() => {
    return roles.find(r => r._id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Select a role into the right-hand Permission Studio
  const selectRoleForStudio = (role) => {
    if (!role) return;
    if (isDirty) {
      const discard = window.confirm('You have unsaved permission changes for the current role. Discard changes?');
      if (!discard) return;
    }
    setSelectedRoleId(role._id);
    setStagedPermissions(
      (role.permissions || []).map(p => ({
        module: p.module,
        actions: [...(p.actions || [])]
      }))
    );
    setRoleIsActive(role.isActive !== false);
    setIsDirty(false);
  };

  // ── Permission Management Logic (Strictly preserved from existing implementation) ──
  const actionsFor = (moduleName) => {
    return stagedPermissions.find(p => p.module === moduleName)?.actions || [];
  };

  const hasAction = (moduleName, action) => {
    return actionsFor(moduleName).includes(action);
  };

  const setModuleActions = (moduleName, nextActions) => {
    setStagedPermissions(prev => {
      const filtered = prev.filter(p => p.module !== moduleName);
      if (nextActions.length) {
        filtered.push({
          module: moduleName,
          actions: ACTION_ORDER.filter(a => nextActions.includes(a))
        });
      }
      return filtered;
    });
    setIsDirty(true);
  };

  const toggleAction = (moduleName, action) => {
    if (selectedRole?.isSystem) {
      notify.warning(`"${selectedRole.name}" is a built-in system role and cannot be modified.`);
      return;
    }

    const current = actionsFor(moduleName);
    const next = current.includes(action) ? current.filter(a => a !== action) : [...current, action];

    // Dependency Rule: Granting any write/approve implies being able to view (read)
    if (!current.includes(action) && action !== 'read' && !next.includes('read')) {
      next.push('read');
    }
    // Dependency Rule: Dropping View drops the rest with it
    setModuleActions(moduleName, action === 'read' && current.includes('read') ? [] : next);
  };

  const toggleFullModule = (moduleName) => {
    if (selectedRole?.isSystem) return;
    const current = actionsFor(moduleName);
    setModuleActions(moduleName, current.length === actions.length ? [] : actions.map(a => a.key));
  };

  const toggleViewGroup = (group, viewOnly) => {
    if (selectedRole?.isSystem) return;
    group.modules.forEach(m => setModuleActions(m.module, viewOnly ? ['read'] : []));
  };

  const grantAllModules = () => {
    if (selectedRole?.isSystem) return;
    const allPerms = allModules.map(m => ({
      module: m,
      actions: actions.map(a => a.key)
    }));
    setStagedPermissions(allPerms);
    setIsDirty(true);
  };

  const grantReadOnlyAll = () => {
    if (selectedRole?.isSystem) return;
    const readOnlyPerms = allModules.map(m => ({
      module: m,
      actions: ['read']
    }));
    setStagedPermissions(readOnlyPerms);
    setIsDirty(true);
  };

  const clearAllPermissions = () => {
    if (selectedRole?.isSystem) return;
    setStagedPermissions([]);
    setIsDirty(true);
  };

  const revertStudioChanges = () => {
    if (!selectedRole) return;
    setStagedPermissions(
      (selectedRole.permissions || []).map(p => ({
        module: p.module,
        actions: [...(p.actions || [])]
      }))
    );
    setRoleIsActive(selectedRole.isActive !== false);
    setIsDirty(false);
    notify.info('Changes reverted to saved role state.');
  };

  // Save changes from Studio
  const handleSaveStudio = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      notify.warning('System roles cannot be altered.');
      return;
    }
    setSavingStudio(true);
    try {
      const payload = {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: stagedPermissions,
        isActive: roleIsActive
      };

      const res = await axios.put(`/roles/${selectedRole._id}`, payload);
      notify.success(res.data?.message || `Permissions updated for ${selectedRole.name}`);
      setIsDirty(false);
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to save role permissions.');
    } finally {
      setSavingStudio(false);
    }
  };

  // ── Modals: Create Role & Clone Role ──
  const openCreateModal = () => {
    setModalFormData({ name: '', description: '', cloneFrom: '' });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    try {
      let initialPermissions = [];
      if (modalFormData.cloneFrom) {
        const sourceRole = roles.find(r => r._id === modalFormData.cloneFrom);
        if (sourceRole) {
          initialPermissions = (sourceRole.permissions || []).map(p => ({
            module: p.module,
            actions: [...(p.actions || [])]
          }));
        }
      }

      const res = await axios.post('/roles', {
        name: modalFormData.name.trim(),
        description: modalFormData.description.trim(),
        permissions: initialPermissions,
        isActive: true
      });

      notify.success(`Role "${modalFormData.name}" created.`);
      setIsCreateModalOpen(false);
      await loadData();
      if (res.data?.data) {
        selectRoleForStudio(res.data.data);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not create role.');
    } finally {
      setModalSaving(false);
    }
  };

  const openEditModal = () => {
    if (!selectedRole) return;
    setModalFormData({
      name: selectedRole.name,
      description: selectedRole.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setModalSaving(true);
    try {
      await axios.put(`/roles/${selectedRole._id}`, {
        name: modalFormData.name.trim(),
        description: modalFormData.description.trim()
      });
      notify.success('Role details updated.');
      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not update role details.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleCloneRole = (role) => {
    setModalFormData({
      name: `${role.name} (Copy)`,
      description: `Cloned from ${role.name}. ${role.description || ''}`,
      cloneFrom: role._id
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteRole = async (role) => {
    const confirmed = await confirmAction(
      `Delete the role "${role.name}"? Anyone assigned to it must be reassigned under Users & Logins first.`
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`/roles/${role._id}`);
      notify.success(res.data?.message || `Role "${role.name}" deleted.`);
      if (selectedRoleId === role._id) {
        setSelectedRoleId(null);
      }
      await loadData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete this role.');
    }
  };

  // Export Complete RBAC Matrix to CSV
  const handleExportMatrixCSV = () => {
    if (!cat?.groups || !roles.length) return;
    const headers = ['Functional Domain', 'Module Key', 'Module Label', ...roles.map(r => r.name)];
    const rows = [];

    groups.forEach(group => {
      group.modules.forEach(m => {
        const row = [
          `"${group.label}"`,
          `"${m.module}"`,
          `"${m.label}"`
        ];
        roles.forEach(r => {
          if (r.name === 'Super Admin') {
            row.push('"Full Access (All)"');
          } else {
            const rolePerm = (r.permissions || []).find(p => p.module === m.module);
            if (!rolePerm || !rolePerm.actions || rolePerm.actions.length === 0) {
              row.push('"No Access"');
            } else {
              row.push(`"${rolePerm.actions.join(', ')}"`);
            }
          }
        });
        rows.push(row.join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rbac_role_permission_matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Exported complete RBAC Matrix to CSV');
  };

  // Filtered Roles in Left Rail
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      if (!roleSearch.trim()) return true;
      const q = roleSearch.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    });
  }, [roles, roleSearch]);

  // Count granted modules for selected role
  const grantedModuleCount = stagedPermissions.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 86px)', minHeight: '620px', gap: '14px' }}>
      {/* ── Top Header & Global Command Bar ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Roles &amp; Authority Studio (RBAC)
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6d28d9',
                backgroundColor: '#ede9fe',
                border: '1px solid #ddd6fe',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={12} /> IATF 16949 &bull; LEAST PRIVILEGE ENFORCED
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '820px' }}>
            Configure job personas, govern functional module authorization, and enforce granular action privileges (View, Add, Change, Delete, Approve) across the enterprise.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Switcher */}
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
              onClick={() => setViewMode('studio')}
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
                backgroundColor: viewMode === 'studio' ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === 'studio' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'studio' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Sliders size={14} /> Dual-Pane Studio
            </button>
            <button
              onClick={() => setViewMode('matrix')}
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
                backgroundColor: viewMode === 'matrix' ? 'var(--bg-primary)' : 'transparent',
                color: viewMode === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Grid size={14} /> Cross-Role Matrix
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleExportMatrixCSV}
            title="Download complete RBAC Matrix as CSV"
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            <Download size={13} /> Export Matrix
          </button>

          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Reload catalogue from backend"
            style={{ fontSize: '12px', padding: '6px 10px' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sync
          </button>

          <button
            className="btn btn-primary"
            onClick={openCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}
          >
            <Plus size={14} /> + New Custom Role
          </button>
        </div>
      </div>

      {/* ── Main Stage Area ── */}
      {viewMode === 'matrix' ? (
        /* ── VIEW MODE 2: Comprehensive Enterprise Cross-Role Matrix (Audit Heatmap) ── */
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Matrix Top Filters */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  width: '260px'
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter functional module..."
                  value={matrixSearch}
                  onChange={e => setMatrixSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none', width: '100%' }}
                />
              </div>

              <select
                className="input-field"
                value={matrixGroupFilter}
                onChange={e => setMatrixGroupFilter(e.target.value)}
                style={{ width: '200px', padding: '4px 8px', fontSize: '12px' }}
              >
                <option value="all">All Functional Domains</option>
                {groups.map(g => (
                  <option key={g.key} value={g.key}>{g.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Legend:</span>
              <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>R = Read</span>
              <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>C = Create</span>
              <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>U = Update</span>
              <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>D = Delete</span>
              <span style={{ fontSize: '11px', backgroundColor: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>A = Approve</span>
            </div>
          </div>

          {/* Cross Table Matrix Grid */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 3, backgroundColor: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 14px', width: '240px', fontWeight: 700, color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                    Functional Module
                  </th>
                  {roles.map(r => {
                    const theme = ROLE_THEMES[r.name] || { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
                    return (
                      <th
                        key={r._id}
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: theme.color,
                          borderRight: '1px solid var(--border-color)',
                          minWidth: '100px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <div style={{ fontSize: '12px' }}>{r.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {r.userCount ?? 0} {r.userCount === 1 ? 'user' : 'users'}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groups
                  .filter(g => matrixGroupFilter === 'all' || g.key === matrixGroupFilter)
                  .map(group => {
                    const visibleModules = group.modules.filter(m => {
                      if (!matrixSearch.trim()) return true;
                      const q = matrixSearch.toLowerCase();
                      return m.label.toLowerCase().includes(q) || m.module.toLowerCase().includes(q);
                    });

                    if (visibleModules.length === 0) return null;

                    return (
                      <React.Fragment key={group.key}>
                        {/* Domain Group Header Row */}
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                          <td
                            colSpan={roles.length + 1}
                            style={{
                              padding: '6px 14px',
                              fontWeight: 700,
                              fontSize: '11px',
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {group.label} ({visibleModules.length} Modules)
                          </td>
                        </tr>

                        {visibleModules.map(m => (
                          <tr
                            key={m.module}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              transition: 'background-color 0.1s ease'
                            }}
                          >
                            <td style={{ padding: '8px 14px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {m.label}
                                {m.sensitive && <Lock size={11} style={{ color: '#d97706' }} title="Sensitive Security Module" />}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.what}</div>
                            </td>

                            {roles.map(r => {
                              if (r.name === 'Super Admin') {
                                return (
                                  <td
                                    key={r._id}
                                    style={{
                                      textAlign: 'center',
                                      padding: '6px 4px',
                                      borderRight: '1px solid var(--border-color)',
                                      backgroundColor: '#faf5ff'
                                    }}
                                  >
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#7e22ce', backgroundColor: '#f3e8ff', padding: '2px 6px', borderRadius: '4px' }}>
                                      FULL
                                    </span>
                                  </td>
                                );
                              }

                              const rolePerm = (r.permissions || []).find(p => p.module === m.module);
                              const acts = rolePerm?.actions || [];

                              if (acts.length === 0) {
                                return (
                                  <td
                                    key={r._id}
                                    style={{
                                      textAlign: 'center',
                                      padding: '6px 4px',
                                      borderRight: '1px solid var(--border-color)',
                                      color: 'var(--text-muted)',
                                      fontSize: '12px'
                                    }}
                                  >
                                    &mdash;
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={r._id}
                                  style={{
                                    textAlign: 'center',
                                    padding: '6px 4px',
                                    borderRight: '1px solid var(--border-color)'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', flexWrap: 'wrap' }}>
                                    {acts.includes('read') && (
                                      <span title="Read" style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '1px 3px', borderRadius: '2px' }}>R</span>
                                    )}
                                    {acts.includes('create') && (
                                      <span title="Create" style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 3px', borderRadius: '2px' }}>C</span>
                                    )}
                                    {acts.includes('update') && (
                                      <span title="Update" style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 3px', borderRadius: '2px' }}>U</span>
                                    )}
                                    {acts.includes('delete') && (
                                      <span title="Delete" style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1px 3px', borderRadius: '2px' }}>D</span>
                                    )}
                                    {acts.includes('approve') && (
                                      <span title="Approve" style={{ fontSize: '9px', fontWeight: 700, backgroundColor: '#ede9fe', color: '#6d28d9', padding: '1px 3px', borderRadius: '2px' }}>A</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── VIEW MODE 1: Dual-Pane Access Studio (Left Deck + Right Studio) ── */
        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '14px' }}>
          {/* ── Left Deck: Interactive Role Cards Rail ── */}
          <div
            style={{
              width: '320px',
              flexShrink: 0,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Search Header */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '5px 8px'
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search role personas..."
                  value={roleSearch}
                  onChange={e => setRoleSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none',
                    color: 'var(--text-primary)'
                  }}
                />
                {roleSearch && (
                  <button
                    onClick={() => setRoleSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Role Cards List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredRoles.map(role => {
                const isSelected = selectedRoleId === role._id;
                const theme = ROLE_THEMES[role.name] || { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
                const permCount = role.name === 'Super Admin' ? allModules.length : (role.permissions || []).length;
                const pct = Math.round((permCount / (allModules.length || 1)) * 100);

                return (
                  <div
                    key={role._id}
                    onClick={() => selectRoleForStudio(role)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--bg-primary)' : 'var(--bg-primary)',
                      border: isSelected ? `2px solid ${theme.color}` : '1px solid var(--border-color)',
                      boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: theme.bg,
                            color: theme.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Shield size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? theme.color : 'var(--text-primary)' }}>
                            {role.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={10} /> {role.userCount ?? 0} {role.userCount === 1 ? 'user' : 'users'}
                            <span>&bull;</span>
                            <span>{role.isSystem ? 'Built-in' : 'Custom'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCloneRole(role)}
                          title="Clone this role into a new custom role"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                        >
                          <Copy size={13} />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            title="Delete this role"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-negative-fg)', padding: '2px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.3' }}>
                      {role.description ? (
                        role.description.length > 70 ? `${role.description.substring(0, 70)}...` : role.description
                      ) : (
                        'No description provided'
                      )}
                    </div>

                    {/* Coverage Mini-Bar */}
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                        <span>Module Reach</span>
                        <span style={{ fontWeight: 600 }}>{permCount} / {allModules.length} ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Canvas: Permission Studio for Selected Role ── */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {selectedRole ? (
              <>
                {/* Selected Role Hero Bar */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: ROLE_THEMES[selectedRole.name]?.bg || '#eff6ff',
                        color: ROLE_THEMES[selectedRole.name]?.color || '#2563eb',
                        border: `1px solid ${ROLE_THEMES[selectedRole.name]?.border || '#bfdbfe'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Shield size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {selectedRole.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '1px 8px',
                            borderRadius: '10px',
                            backgroundColor: selectedRole.isSystem ? '#fef3c7' : '#e0f2fe',
                            color: selectedRole.isSystem ? '#b45309' : '#0369a1'
                          }}
                        >
                          {selectedRole.isSystem ? 'Built-in Master Role' : 'Custom Configured Role'}
                        </span>
                        {isDirty && (
                          <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            &bull; Unsaved Changes
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {selectedRole.description || 'No description entered.'}
                      </div>
                    </div>
                  </div>

                  {/* Studio Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!selectedRole.isSystem && (
                      <button
                        className="btn btn-secondary"
                        onClick={openEditModal}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        <Edit2 size={13} /> Edit Info
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleCloneRole(selectedRole)}
                      style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                      <Copy size={13} /> Clone
                    </button>
                    {isDirty && (
                      <button
                        className="btn btn-secondary"
                        onClick={revertStudioChanges}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Revert
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveStudio}
                      disabled={savingStudio || selectedRole.isSystem || !isDirty}
                      style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        fontWeight: 700,
                        backgroundColor: isDirty ? 'var(--accent-primary)' : 'var(--border-color)',
                        color: isDirty ? '#ffffff' : 'var(--text-muted)',
                        cursor: isDirty ? 'pointer' : 'default'
                      }}
                    >
                      {savingStudio ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                </div>

                {/* Role Warning / System Notice */}
                {selectedRole.isSystem ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a', color: '#92400e', fontSize: '12px' }}>
                    <Lock size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Built-in Role Protection:</strong> "{selectedRole.name}" is hardcoded by system architecture and cannot be edited. To customize, click <strong>Clone</strong> to create an editable copy.
                    </span>
                  </div>
                ) : (
                  (selectedRole.userCount || 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#eff6ff', borderBottom: '1px solid #dbeafe', color: '#1e40af', fontSize: '12px' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>{selectedRole.userCount} {selectedRole.userCount === 1 ? 'person holds' : 'people hold'} this role.</strong> Any permission changes saved here take effect immediately across live sessions.
                      </span>
                    </div>
                  )
                )}

                {/* Quick Presets Toolbar */}
                {!selectedRole.isSystem && (
                  <div
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={roleIsActive}
                          onChange={e => { setRoleIsActive(e.target.checked); setIsDirty(true); }}
                          style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }}
                        />
                        <span>Role is in use (Active)</span>
                      </label>
                      <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <strong>{grantedModuleCount}</strong> of {allModules.length} modules granted
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick Presets:</span>
                      <button
                        type="button"
                        onClick={grantReadOnlyAll}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)' }}
                      >
                        Read-Only All
                      </button>
                      <button
                        type="button"
                        onClick={grantAllModules}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)' }}
                      >
                        Full Access All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllPermissions}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--status-negative-fg)' }}
                      >
                        Revoke All
                      </button>
                      <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allOpen = {};
                          groups.forEach(g => { allOpen[g.key] = true; });
                          setExpandedGroups(allOpen);
                        }}
                        style={{ background: 'none', border: 'none', padding: '2px 4px', fontSize: '11px', cursor: 'pointer', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allClosed = {};
                          groups.forEach(g => { allClosed[g.key] = false; });
                          setExpandedGroups(allClosed);
                        }}
                        style={{ background: 'none', border: 'none', padding: '2px 4px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'underline' }}
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>
                )}

                {/* Functional Domain Accordions (The Deep-Dive Grid) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {groups.map(group => {
                    const isExpanded = expandedGroups[group.key] !== false;
                    return (
                      <div
                        key={group.key}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {/* Domain Group Header */}
                        <div
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !isExpanded }))}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {group.label}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                {group.hint}
                              </span>
                            </div>
                          </div>

                          {!selectedRole.isSystem && (
                            <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => toggleViewGroup(group, true)}
                                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                              >
                                View only
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleViewGroup(group, false)}
                                style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Modules Table inside Group */}
                        {isExpanded && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                              <thead>
                                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                                  <th style={{ padding: '8px 14px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px' }}>Area &amp; Functional Scope</th>
                                  {actions.map(a => (
                                    <th key={a.key} style={{ padding: '8px 6px', textAlign: 'center', width: '68px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px' }}>
                                      {a.label}
                                    </th>
                                  ))}
                                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '48px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px' }}>
                                    All
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.modules.map(m => {
                                  const granted = actionsFor(m.module);
                                  const hasAny = granted.length > 0;

                                  return (
                                    <tr
                                      key={m.module}
                                      style={{
                                        borderBottom: '1px solid var(--border-subtle)',
                                        backgroundColor: hasAny ? 'var(--bg-secondary)' : 'transparent',
                                        transition: 'background-color 0.1s ease'
                                      }}
                                    >
                                      <td style={{ padding: '10px 14px', whiteSpace: 'normal', minWidth: '220px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          {m.label}
                                          {m.sensitive && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 5px', borderRadius: '4px' }}>
                                              <Lock size={10} /> Sensitive
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{m.what}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1px' }}>
                                          Typical Owner: {m.whoTypically}
                                        </div>
                                      </td>

                                      {/* Action Checkboxes */}
                                      {actions.map(a => {
                                        const isChecked = selectedRole.name === 'Super Admin' ? true : hasAction(m.module, a.key);
                                        return (
                                          <td key={a.key} style={{ textAlign: 'center', padding: '8px 4px' }}>
                                            <input
                                              type="checkbox"
                                              aria-label={`${a.label} ${m.label}`}
                                              title={`${a.label}: ${a.hint}`}
                                              checked={isChecked}
                                              disabled={selectedRole.isSystem}
                                              onChange={() => toggleAction(m.module, a.key)}
                                              style={{
                                                accentColor: 'var(--accent-primary)',
                                                width: 16,
                                                height: 16,
                                                cursor: selectedRole.isSystem ? 'not-allowed' : 'pointer'
                                              }}
                                            />
                                          </td>
                                        );
                                      })}

                                      {/* All toggle button */}
                                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                        <button
                                          type="button"
                                          disabled={selectedRole.isSystem}
                                          onClick={() => toggleFullModule(m.module)}
                                          title={granted.length === actions.length ? 'Clear all actions for this module' : 'Grant all actions for this module'}
                                          style={{
                                            background: 'none',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            width: 24,
                                            height: 24,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: selectedRole.isSystem ? 'not-allowed' : 'pointer',
                                            color: granted.length === actions.length ? 'var(--accent-primary)' : 'var(--text-muted)'
                                          }}
                                        >
                                          <Check size={13} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a role from the left rail to view and configure its permission studio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Create New Role ── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Custom ERP Role"
        maxWidth={620}
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Role Job Title *</label>
            <input
              type="text"
              className="input-field"
              required
              placeholder="e.g. Senior Tooling Engineer or Line Auditor"
              value={modalFormData.name}
              onChange={e => setModalFormData({ ...modalFormData, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">What this job does (Description) *</label>
            <textarea
              rows={2}
              className="input-field"
              required
              placeholder="e.g. Manages press die maintenance schedules, tool room work orders, and spare parts"
              value={modalFormData.description}
              onChange={e => setModalFormData({ ...modalFormData, description: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Initial Permission Preset (Clone from existing)</label>
            <select
              className="input-field"
              value={modalFormData.cloneFrom}
              onChange={e => setModalFormData({ ...modalFormData, cloneFrom: e.target.value })}
            >
              <option value="">Start from blank (No initial permissions)</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>Clone from {r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSaving || !modalFormData.name.trim()}>
              {modalSaving ? 'Creating...' : 'Create Role & Open Studio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Role Details ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Role Details: ${selectedRole?.name || ''}`}
        maxWidth={580}
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Role Title *</label>
            <input
              type="text"
              className="input-field"
              required
              value={modalFormData.name}
              onChange={e => setModalFormData({ ...modalFormData, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description *</label>
            <textarea
              rows={3}
              className="input-field"
              required
              value={modalFormData.description}
              onChange={e => setModalFormData({ ...modalFormData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={modalSaving || !modalFormData.name.trim()}>
              {modalSaving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPermissions;
