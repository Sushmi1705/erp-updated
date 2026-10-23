import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  UserPlus,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Edit2,
  Trash2,
  Key,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  Factory,
  Building,
  Building2,
  Copy,
  Check,
  X,
  ExternalLink,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { resolveIntent, intentTokens } from '../../theme/status';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};

// Role styling & color badge map for automotive plant roles
const ROLE_THEMES = {
  'Super Admin': { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  'Plant Manager': { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'Quality Inspector': { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
  'Maintenance Engineer': { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
  'Purchase Officer': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'Store Keeper': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  'Production Planner': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Shop Floor Supervisor': { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  'HR Executive': { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
  'Accounts Executive': { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  'Sales Executive': { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' },
  'Dispatch Coordinator': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [plants, setPlants] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // View state & inspection
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('directory'); // 'directory' | 'roles_matrix'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Password Reset Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [copiedEmail, setCopiedEmail] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const [plantsRes, buRes] = await Promise.all([
        axios.get('/company/plants'),
        axios.get('/company/business-units')
      ]);
      setPlants(plantsRes.data.data || []);
      setBusinessUnits(buRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/roles');
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/users');
      const userList = res.data.data || [];
      setUsers(userList);
      if (selectedUser) {
        const refreshed = userList.find(u => u._id === selectedUser._id);
        if (refreshed) setSelectedUser(refreshed);
      }
    } catch (err) {
      console.error(err);
      notify.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const copyEmailToClipboard = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    notify.success('Copied email to clipboard');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.plantId) delete payload.plantId;
      if (!payload.businessUnitId) delete payload.businessUnitId;

      if (editingId) {
        await axios.put(`/users/${editingId}`, payload);
        notify.success('User profile updated successfully');
      } else {
        await axios.post('/users', payload);
        notify.success('New user account created successfully');
      }
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/users/${id}/status`, { status });
      notify.success(`User login status changed to ${status}`);
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleEdit = (row) => {
    setFormData({
      ...row,
      roleId: row.role?._id || row.role || '',
      plantId: row.plantId?._id || row.plantId || '',
      businessUnitId: row.businessUnitId?._id || row.businessUnitId || '',
      phone: row.phone || ''
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmAction(
      `Delete user account for "${row.firstName} ${row.lastName}" (${row.email})? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`/users/${row._id}`);
      notify.success('User account removed');
      if (selectedUser && selectedUser._id === row._id) {
        setSelectedUser(null);
      }
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openResetPasswordModal = (user) => {
    setPasswordTargetUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordTargetUser || !newPassword) return;
    setResettingPassword(true);
    try {
      await axios.put(`/users/${passwordTargetUser._id}/reset-password`, {
        newPassword
      });
      notify.success(`Password reset successfully for ${passwordTargetUser.firstName} ${passwordTargetUser.lastName}`);
      setIsPasswordModalOpen(false);
      setPasswordTargetUser(null);
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const openCreate = () => {
    setFormData({
      status: 'Active',
      plantId: plants.length === 1 ? plants[0]._id : ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      notify.error('No users to export');
      return;
    }
    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Plant', 'Status', 'Phone'];
    const rows = filteredUsers.map(u => [
      `"${u.firstName || ''}"`,
      `"${u.lastName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role?.name || ''}"`,
      `"${u.plantId?.name || 'All Facilities'}"`,
      `"${u.status || 'Active'}"`,
      `"${u.phone || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `erp_users_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success(`Exported ${filteredUsers.length} users to CSV`);
  };

  // Filter users based on search and dropdowns
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role?.name || '').toLowerCase();
        const plant = (u.plantId?.name || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        if (!fullName.includes(q) && !email.includes(q) && !role.includes(q) && !plant.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all') {
        const roleName = u.role?.name || '';
        if (roleName !== roleFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = u.status || 'Active';
        if (status !== statusFilter) return false;
      }

      // Plant filter
      if (plantFilter !== 'all') {
        const pId = u.plantId?._id || u.plantId;
        if (plantFilter === 'unassigned') {
          if (pId) return false;
        } else if (pId !== plantFilter) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, plantFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => (u.status || 'Active') === 'Active').length;
    const admins = users.filter(u => ['Super Admin', 'Plant Manager'].includes(u.role?.name)).length;
    const operational = users.filter(u => !['Super Admin', 'Plant Manager'].includes(u.role?.name)).length;
    const lockedOrSuspended = users.filter(u => ['Suspended', 'Locked', 'Inactive'].includes(u.status)).length;
    return { total, active, admins, operational, lockedOrSuspended };
  }, [users]);

  // Distinct roles list for filtering
  const distinctRoles = useMemo(() => {
    const roleMap = new Map();
    users.forEach(u => {
      if (u.role?.name) {
        roleMap.set(u.role.name, (roleMap.get(u.role.name) || 0) + 1);
      }
    });
    return Array.from(roleMap.entries()).map(([name, count]) => ({ name, count }));
  }, [users]);

  const columns = [
    {
      header: 'User & Credentials',
      accessor: 'firstName',
      render: row => {
        const roleTheme = ROLE_THEMES[row.role?.name] || { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
        const initials = `${(row.firstName || '')[0] || ''}${(row.lastName || '')[0] || ''}`.toUpperCase() || 'U';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: roleTheme.bg,
                color: roleTheme.text,
                border: `1px solid ${roleTheme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {row.firstName} {row.lastName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{row.email}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyEmailToClipboard(row.email); }}
                  title="Copy Email"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Assigned Role',
      render: row => {
        const roleName = row.role?.name || 'No role set';
        const theme = ROLE_THEMES[roleName] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.bg,
              color: theme.text,
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            {roleName}
          </span>
        );
      }
    },
    {
      header: 'Operating Facility',
      render: row => {
        const isSuper = row.role?.name === 'Super Admin';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Factory size={13} style={{ color: isSuper ? '#8b5cf6' : 'var(--accent-primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: isSuper ? '#7c3aed' : 'var(--text-primary)' }}>
              {isSuper ? 'All Enterprise Facilities' : (row.plantId?.name || 'Unassigned / Global')}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Login & Security Status',
      render: row => {
        const value = row.status || 'Active';
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={value}
              onChange={e => updateStatus(row._id, e.target.value)}
              title="Change whether this person can log in"
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: '1px solid',
                cursor: 'pointer',
                ...intentTokens(resolveIntent(value))
              }}
            >
              <option value="Active">Active — can log in</option>
              <option value="Inactive">Inactive — cannot log in</option>
              <option value="Suspended">Suspended — stopped for now</option>
              <option value="Locked">Locked — security block</option>
            </select>
          </div>
        );
      }
    },
    {
      header: 'Security Actions',
      render: row => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
            title="Inspect User Dossier"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: selectedUser?._id === row._id ? 'var(--accent-primary)' : 'var(--text-muted)'
            }}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openResetPasswordModal(row); }}
            title="Reset Password"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#d97706'
            }}
          >
            <Key size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            title="Edit Details"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-primary)'
            }}
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            title="Delete User"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-danger)'
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Header & Global Actions */}
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
              Users &amp; Access Governance
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#4338ca',
                backgroundColor: '#e0e7ff',
                border: '1px solid #c7d2fe',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              RBAC SECURED &bull; {users.length} PERSONAS
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '850px' }}>
            Every authenticated operator and executive in Precision ERP. Manage sign-in status, assign automotive role authorities,
            scope plant data visibility, and enforce credential security.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              fetchUsers();
              fetchRoles();
              fetchOrganizationData();
              notify.success('User directory refreshed');
            }}
            title="Reload user roster"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            className="btn btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <UserPlus size={15} /> + Add user
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>Total Personnel</span>
            <Users size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered ERP accounts</div>
        </div>

        <div
          onClick={() => setStatusFilter('Active')}
          style={{
            backgroundColor: statusFilter === 'Active' ? '#eff6ff' : 'var(--bg-primary)',
            border: statusFilter === 'Active' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>Active Logins</span>
            <UserCheck size={16} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.active}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authorized to sign in</div>
        </div>

        <div
          onClick={() => setRoleFilter('Super Admin')}
          style={{
            backgroundColor: roleFilter === 'Super Admin' ? '#f3e8ff' : 'var(--bg-primary)',
            border: roleFilter === 'Super Admin' ? '2px solid #9333ea' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b21a8' }}>Executive & Admin</span>
            <Shield size={16} style={{ color: '#9333ea' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.admins}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Super Admin & Plant Manager</div>
        </div>

        <div
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>Operational Personas</span>
            <Factory size={16} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.operational}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shop, QC, Store &amp; Procurement</div>
        </div>

        <div
          onClick={() => setStatusFilter(metrics.lockedOrSuspended > 0 ? 'Suspended' : 'all')}
          style={{
            backgroundColor: metrics.lockedOrSuspended > 0 ? '#fef2f2' : 'var(--bg-primary)',
            border: metrics.lockedOrSuspended > 0 ? '1px solid #f87171' : '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: metrics.lockedOrSuspended > 0 ? '#b91c1c' : '#475569' }}>
              Locked / Suspended
            </span>
            <Lock size={16} style={{ color: metrics.lockedOrSuspended > 0 ? '#ef4444' : '#64748b' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {metrics.lockedOrSuspended}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {metrics.lockedOrSuspended === 0 ? 'Zero security blocks' : 'Immediate review needed'}
          </div>
        </div>
      </div>

      {/* Role Quick-Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px', flexShrink: 0 }}>
          Filter Role:
        </span>
        <button
          onClick={() => setRoleFilter('all')}
          style={{
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: roleFilter === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            backgroundColor: roleFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-primary)',
            color: roleFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          All Roles ({users.length})
        </button>
        {distinctRoles.map(({ name, count }) => {
          const theme = ROLE_THEMES[name] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
          const isSelected = roleFilter === name;
          return (
            <button
              key={name}
              onClick={() => setRoleFilter(isSelected ? 'all' : name)}
              style={{
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSelected ? `2px solid ${theme.text}` : `1px solid ${theme.border}`,
                backgroundColor: isSelected ? theme.text : theme.bg,
                color: isSelected ? '#ffffff' : theme.text,
                whiteSpace: 'nowrap'
              }}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Container: Filter Bar + Table + Slide-Out Dossier */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {/* Search & Select Filters */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
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
                backgroundColor: 'var(--bg-primary)',
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
                placeholder="Search by name, email, role, or plant..."
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

            {/* Status dropdown */}
            <select
              className="input-field"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '130px', padding: '5px 8px', fontSize: '12px' }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active only</option>
              <option value="Inactive">Inactive only</option>
              <option value="Suspended">Suspended</option>
              <option value="Locked">Locked</option>
            </select>

            {/* Plant dropdown */}
            <select
              className="input-field"
              value={plantFilter}
              onChange={e => setPlantFilter(e.target.value)}
              style={{ width: '160px', padding: '5px 8px', fontSize: '12px' }}
            >
              <option value="all">All Operating Plants</option>
              {plants.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>

            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || plantFilter !== 'all') && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setPlantFilter('all');
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredUsers.length}</strong> of {users.length} accounts
            </span>
            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
              title="Download CSV"
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table + Slide-Out Split Panel */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div
            style={{
              flex: selectedUser ? '1 1 62%' : '1 1 100%',
              overflowY: 'auto',
              transition: 'flex 0.2s ease',
              padding: '12px'
            }}
          >
            <DataTable
              columns={columns}
              data={filteredUsers}
              isLoading={loading}
              onRowClick={(row) => setSelectedUser(row)}
              selectedRowId={selectedUser?._id}
              onRetry={fetchUsers}
              emptyTitle="No users found"
              emptyMessage="No personnel records match your active search and role filters."
              emptyAction={
                <button className="btn btn-primary" onClick={openCreate}>
                  <UserPlus size={14} /> Add user
                </button>
              }
            />
          </div>

          {/* Slide-out User Profile & Security Dossier */}
          {selectedUser && (
            <div
              style={{
                width: '380px',
                maxWidth: '38%',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: ROLE_THEMES[selectedUser.role?.name]?.bg || '#eff6ff',
                      color: ROLE_THEMES[selectedUser.role?.name]?.text || '#2563eb',
                      border: `1px solid ${ROLE_THEMES[selectedUser.role?.name]?.border || '#bfdbfe'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '15px'
                    }}
                  >
                    {(selectedUser.firstName || '')[0]}{(selectedUser.lastName || '')[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      USER IDENTITY &amp; CREDENTIAL DOSSIER
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Close Inspector"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status and Role Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: ROLE_THEMES[selectedUser.role?.name]?.bg || '#f1f5f9',
                    color: ROLE_THEMES[selectedUser.role?.name]?.text || '#475569',
                    border: `1px solid ${ROLE_THEMES[selectedUser.role?.name]?.border || '#cbd5e1'}`
                  }}
                >
                  {selectedUser.role?.name || 'Unassigned Role'}
                </span>
                <StatusBadge value={selectedUser.status || 'Active'} />
              </div>

              {/* Contact Information Group */}
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Contact &amp; Identification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <Mail size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedUser.email}</span>
                  <button
                    onClick={() => copyEmailToClipboard(selectedUser.email)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}
                    title="Copy Email"
                  >
                    <Copy size={12} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                {selectedUser.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <Phone size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-primary)' }}>{selectedUser.phone}</span>
                  </div>
                )}
              </div>

              {/* Facility & Data Scoping */}
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Plant Data Visibility Scope
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <Factory size={13} style={{ color: '#059669', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Operating Plant:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedUser.role?.name === 'Super Admin'
                      ? 'Full Enterprise Access (All Plants)'
                      : (selectedUser.plantId?.name || 'Company-wide (No Restriction)')}
                  </span>
                </div>
                {selectedUser.businessUnitId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <Building size={13} style={{ color: '#7c3aed', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Business Division:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedUser.businessUnitId?.name || '-'}
                    </span>
                  </div>
                )}
              </div>

              {/* Security Health & Authentication */}
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Security &amp; Authentication Health
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Failed Login Attempts:</span>
                  <span style={{ fontWeight: 600, color: (selectedUser.failedLoginAttempts || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                    {selectedUser.failedLoginAttempts || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Account Lock Status:</span>
                  <span style={{ fontWeight: 600, color: selectedUser.lockUntil ? '#dc2626' : '#16a34a' }}>
                    {selectedUser.lockUntil ? `Locked until ${new Date(selectedUser.lockUntil).toLocaleTimeString()}` : 'Unlocked / Normal'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password Policy:</span>
                  <span style={{ fontWeight: 600, color: '#0284c7' }}>Bcrypt Salted Hash</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'center' }}
                  onClick={() => openResetPasswordModal(selectedUser)}
                >
                  <Key size={14} /> Reset Password
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '12px', padding: '6px 10px', justifyContent: 'center' }}
                    onClick={() => handleEdit(selectedUser)}
                  >
                    <Edit2 size={13} /> Edit Profile
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--accent-danger)' }}
                    onClick={() => handleDelete(selectedUser)}
                    title="Delete Account"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Edit User: ${formData.firstName || ''} ${formData.lastName || ''}` : 'Add New ERP User'}
        maxWidth={720}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Personal Identification */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              1. Personal Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">First Name *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Suresh"
                  value={formData.firstName || ''}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Last Name *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Babu"
                  value={formData.lastName || ''}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Official Work Email *</label>
                <input
                  type="email"
                  className="input-field"
                  required
                  placeholder="e.g. plant.manager@lbap.in"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contact Phone / Mobile</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="+91 99943 00000"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role & Privileges */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              2. Role &amp; Login Privileges
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Assigned Automotive Role *</label>
                <select
                  className="input-field"
                  required
                  value={formData.roleId || ''}
                  onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                >
                  <option value="" disabled>Select a role persona</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <p style={hintStyle}>No roles found. Please configure roles in Roles &amp; Access first.</p>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Sign-in Status</label>
                <select
                  className="input-field"
                  value={formData.status || 'Active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active — can log in</option>
                  <option value="Inactive">Inactive — cannot log in</option>
                  <option value="Suspended">Suspended — stopped for now</option>
                  <option value="Locked">Locked — security block</option>
                </select>
              </div>

              {!editingId && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Initial Password * (Operator changes after first login)</label>
                  <input
                    type="password"
                    className="input-field"
                    required
                    placeholder="Min 6 characters, e.g. password123"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Data Scoping Restrictions */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              3. Data Visibility &amp; Plant Restrictions
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Scope which manufacturing facility this operator sees. Leave empty for enterprise-wide access.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Operating Plant (Facility restriction)</label>
                <select
                  className="input-field"
                  value={formData.plantId || ''}
                  onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                >
                  <option value="">All Plants (Enterprise unrestricted)</option>
                  {plants.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Business Unit (Division restriction)</label>
                <select
                  className="input-field"
                  value={formData.businessUnitId || ''}
                  onChange={e => setFormData({ ...formData, businessUnitId: e.target.value })}
                >
                  <option value="">All Business Units</option>
                  {businessUnits.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontWeight: 600, minWidth: '120px' }}>
              {saving ? 'Saving...' : editingId ? 'Update user' : 'Save user'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Reset Password: ${passwordTargetUser?.firstName || ''} ${passwordTargetUser?.lastName || ''}`}
        maxWidth={460}
      >
        <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '6px' }}>
            <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#92400e' }}>
              Setting a new password will immediately unlock the account and invalidate existing login sessions for <strong>{passwordTargetUser?.email}</strong>.
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">New Password * (Min 6 characters)</label>
            <input
              type="text"
              className="input-field"
              required
              minLength={6}
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => setNewPassword('LBA@' + Math.floor(100000 + Math.random() * 900000))}
            >
              Generate Random Password
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={resettingPassword || !newPassword}
                style={{ fontWeight: 600 }}
              >
                {resettingPassword ? 'Updating...' : 'Set Password'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;