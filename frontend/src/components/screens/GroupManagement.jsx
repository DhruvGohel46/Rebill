import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../../hooks/useAnimation';
import { groupsAPI, categoriesAPI, handleAPIError } from '../../utils/api';
import { settingsAPI } from '../../api/settings';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/Management.css';
import { useAlert } from '../../context/AlertContext';
import Button from '../ui/Button';
import GlobalSelect from '../ui/GlobalSelect';
import PageContainer from '../layout/PageContainer';
import {
  IoAddOutline,
  IoCloseOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoSearchOutline,
  IoChevronBackOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { FiPackage, FiGrid } from 'react-icons/fi';
import { usePOSData } from '../../context/POSDataContext';

const GroupManagement = ({ activeTab, setActiveTab }) => {
  const { staggerContainer, staggerItem } = useAnimation();
  const { showConfirm } = useAlert();
  const { refreshAll } = usePOSData();
  const { settings, updateSettings } = useSettings();
  const { isDark } = useTheme();

  // Groups state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Bulk selection
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  // Delete dialog for groups
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteOption, setDeleteOption] = useState('remove'); // 'remove' or 'move'
  const [targetGroupId, setTargetGroupId] = useState('');

  // ----- Category management inside a selected group -----
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isShowingAllCategories, setIsShowingAllCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    active: true,
    group_id: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#64748B', 
    icon: '',
    is_active: true,
  });

  // ----- Load groups -----
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await groupsAPI.getAllGroups(true);
      setGroups(response.data.groups || []);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Group form handling -----
  const resetForm = () => {
    setEditingGroup(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      color: '#64748B',
      icon: '',
      is_active: true,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (editingGroup) {
        await groupsAPI.updateGroup(editingGroup.id, formData);
      } else {
        await groupsAPI.createGroup(formData);
      }
      resetForm();
      loadGroups();
      window.dispatchEvent(new Event('pos-catalog-updated'));
      if (refreshAll) refreshAll();
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#64748B',
      icon: group.icon || '',
      is_active: group.is_active,
    });
    setShowAddForm(true);
  };

  const onRequestDelete = (group) => {
    setPendingDelete(group);
    setDeleteOption('remove');
    setTargetGroupId('');
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setError('');
      if (settings?.default_group_id && settings.default_group_id.toString() === pendingDelete.id.toString()) {
        await settingsAPI.updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
        if (updateSettings) updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
      }
      await groupsAPI.deleteGroup(pendingDelete.id, deleteOption, targetGroupId);
      setPendingDelete(null);
      loadGroups();
      window.dispatchEvent(new Event('pos-catalog-updated'));
      if (refreshAll) refreshAll();
      if (selectedGroup && selectedGroup.id === pendingDelete.id) {
        setSelectedGroup(null);
      }
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const toggleGroupActive = async (group) => {
    try {
      setError('');
      if (group.is_active && settings?.default_group_id && settings.default_group_id.toString() === group.id.toString()) {
        const confirmed = await showConfirm({
          title: 'Default Group Active',
          message: `"${group.name}" is currently set as the Default Item Group. Deactivating it will unset the default group. Do you want to proceed?`,
          confirmText: 'Deactivate & Unset',
          type: 'warning'
        });
        if (!confirmed) return;
        await settingsAPI.updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
        if (updateSettings) updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
      }

      const updatedData = {
        name: group.name,
        description: group.description || '',
        color: group.color || '#64748B',
        icon: group.icon || '',
        is_active: !group.is_active
      };
      await groupsAPI.updateGroup(group.id, updatedData);
      loadGroups();
      window.dispatchEvent(new Event('pos-catalog-updated'));
      if (refreshAll) refreshAll();
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  // ----- Selection Helpers -----
  const handleToggleSelectGroup = (id) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (paginatedItems) => {
    const paginatedIds = paginatedItems.map(g => g.id);
    const allSelected = paginatedIds.every(id => selectedGroupIds.includes(id));
    if (allSelected) {
      setSelectedGroupIds(prev => prev.filter(id => !paginatedIds.includes(id)));
    } else {
      setSelectedGroupIds(prev => [...new Set([...prev, ...paginatedIds])]);
    }
  };

  const handleBulkStatusChange = async (is_active) => {
    if (selectedGroupIds.length === 0) return;
    try {
      setError('');
      setLoading(true);
      if (!is_active && settings?.default_group_id && selectedGroupIds.map(String).includes(settings.default_group_id.toString())) {
        await settingsAPI.updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
        if (updateSettings) updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
      }
      await Promise.all(selectedGroupIds.map(async (id) => {
        const group = groups.find(g => g.id === id);
        if (group) {
          const updatedData = {
            name: group.name,
            description: group.description || '',
            color: group.color || '#64748B',
            icon: group.icon || '',
            is_active
          };
          await groupsAPI.updateGroup(id, updatedData);
        }
      }));
      setSelectedGroupIds([]);
      loadGroups();
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGroupIds.length === 0) return;
    const confirmed = await showConfirm({
      title: 'Delete Selected Groups',
      message: `Are you sure you want to delete the ${selectedGroupIds.length} selected groups?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      setError('');
      setLoading(true);
      if (settings?.default_group_id && selectedGroupIds.map(String).includes(settings.default_group_id.toString())) {
        await settingsAPI.updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
        if (updateSettings) updateSettings({ default_group_id: '', idle_timeout_enabled: 'false' });
      }
      await Promise.all(selectedGroupIds.map(id => groupsAPI.deleteGroup(id, 'remove', '')));
      setSelectedGroupIds([]);
      loadGroups();
      setSelectedGroup(null);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  // ----- Category Operations -----
  const selectGroup = async (group) => {
    setSelectedGroup(group);
    setIsShowingAllCategories(false);
    setCategorySearchTerm('');
    setShowAddCategoryForm(false);
    setEditingCategory(null);
    await loadCategories(group.id);
  };

  const deselectGroup = () => {
    setSelectedGroup(null);
    setIsShowingAllCategories(false);
    setCategories([]);
  };

  const handleShowAllCategories = async () => {
    setSelectedGroup(null);
    setIsShowingAllCategories(true);
    setCategorySearchTerm('');
    setShowAddCategoryForm(false);
    setEditingCategory(null);
    await loadAllCategories();
  };

  const loadAllCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getAllCategories(true);
      setCategories(response.data.categories || []);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategories = async (groupId) => {
    try {
      setLoadingCategories(true);
      const response = await groupsAPI.getGroupCategories(groupId);
      setCategories(response.data.categories || []);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategoryInputChange = (field, value) => {
    setCategoryFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setShowAddCategoryForm(false);
    setCategoryFormData({ name: '', description: '', active: true, group_id: '' });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const gId = selectedGroup ? selectedGroup.id : categoryFormData.group_id;
    if (!gId) {
      setError('Please select a group to assign this category.');
      return;
    }
    try {
      setError('');
      const payload = {
        name: categoryFormData.name,
        description: categoryFormData.description,
        active: categoryFormData.active,
        group_id: gId
      };
      if (editingCategory) {
        await categoriesAPI.updateCategory(editingCategory.id, payload);
      } else {
        await categoriesAPI.createCategory(payload);
      }
      resetCategoryForm();
      if (isShowingAllCategories) {
        await loadAllCategories();
      } else {
        await loadCategories(selectedGroup.id);
      }
      loadGroups();
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const handleCategoryEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      description: cat.description || '',
      active: cat.active,
      group_id: cat.group_id || '',
    });
    setShowAddCategoryForm(true);
  };

  const handleCategoryDelete = async (cat) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.name}"?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      setError('');
      await categoriesAPI.deleteCategory(cat.id);
      if (isShowingAllCategories) {
        await loadAllCategories();
      } else {
        await loadCategories(selectedGroup.id);
      }
      loadGroups();
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  // ----- Filtering / Pagination -----
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pageCount = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(categorySearchTerm.toLowerCase()))
  );

  const otherGroups = groups.filter(g => pendingDelete && g.id !== pendingDelete.id);

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: '16px'
      }}
    >
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        padding: '18px 24px',
        background: isDark
          ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)'
          : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
        borderRadius: '24px',
        marginBottom: '8px',
        boxShadow: isDark
          ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
        flexWrap: 'wrap'
      }}>
        {/* Left: Title + Segmented Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              color: isDark ? '#FFFFFF' : '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Management
            </h1>
          </div>

          {setActiveTab && (
            <div style={{
              display: 'inline-flex',
              background: isDark ? '#1C1D22' : '#F1F5F9',
              borderRadius: '999px',
              padding: '4px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 18px',
                  background: activeTab === 'products'
                    ? 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: '999px',
                  color: activeTab === 'products' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                  fontWeight: activeTab === 'products' ? 750 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'products' ? '0 3px 10px rgba(255, 107, 26, 0.35)' : 'none'
                }}
              >
                <FiPackage size={16} /> Products Catalog
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 18px',
                  background: activeTab === 'groups'
                    ? 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: '999px',
                  color: activeTab === 'groups' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                  fontWeight: activeTab === 'groups' ? 750 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'groups' ? '0 3px 10px rgba(255, 107, 26, 0.35)' : 'none'
                }}
              >
                <FiGrid size={16} /> Category & Groups
              </button>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="gm-search-container" style={{ minWidth: '240px' }}>
            <IoSearchOutline className="gm-search-icon" size={17} />
            <input
              className="gm-search-input"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                height: '40px',
                borderRadius: '12px',
                background: isDark ? '#16171B' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            />
          </div>
          <button
            onClick={handleShowAllCategories}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              height: '40px',
              padding: '0 16px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: '700',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1.5px solid #93C5FD',
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
              color: isDark ? '#60A5FA' : '#2563EB',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
          >
            Show All Categories
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              height: '40px',
              padding: '0 20px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 800,
              border: 'none',
              background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
              color: '#FFFFFF',
              boxShadow: '0 6px 20px rgba(255, 107, 26, 0.35)',
              cursor: showAddForm ? 'not-allowed' : 'pointer',
              opacity: showAddForm ? 0.6 : 1,
              transition: 'all 0.18s ease'
            }}
          >
            <IoAddOutline size={18} /> Add Group
          </button>
        </div>
      </div>

      {/* Selection Action Bar */}
      <AnimatePresence>
        {selectedGroupIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ 
              display: 'flex', 
              padding: '14px 24px', 
              gap: '14px', 
              alignItems: 'center', 
              marginBottom: '16px', 
              background: isDark ? '#16171B' : '#FFF7ED', 
              border: isDark ? '1px solid rgba(255, 107, 26, 0.3)' : '1.5px solid #FDBA74',
              borderRadius: '20px',
              boxShadow: '0 4px 16px rgba(255, 107, 26, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
              <IoCheckmarkCircle size={22} color="#FF6B1A" />
              <span style={{ fontSize: '0.90rem', fontWeight: 750, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                {selectedGroupIds.length} Selected
              </span>
            </div>
            <button 
              className="pmSecondaryBtn" 
              style={{
                padding: '7px 16px',
                fontSize: '0.82rem',
                borderRadius: '10px',
                height: '36px',
                background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                color: isDark ? '#34D399' : '#16A34A',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC'
              }} 
              onClick={() => handleBulkStatusChange(true)}
            >
              Activate
            </button>
            <button 
              className="pmSecondaryBtn" 
              style={{
                padding: '7px 16px',
                fontSize: '0.82rem',
                borderRadius: '10px',
                height: '36px',
                background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                color: isDark ? '#FBBF24' : '#D97706',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
              }} 
              onClick={() => handleBulkStatusChange(false)}
            >
              Deactivate
            </button>
            <button 
              className="pmSecondaryBtn pmActionDanger" 
              style={{ 
                padding: '7px 16px', 
                fontSize: '0.82rem', 
                color: '#EF4444', 
                borderColor: 'rgba(239, 68, 68, 0.3)', 
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '10px',
                height: '36px' 
              }} 
              onClick={handleBulkDelete}
            >
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Group Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              marginBottom: '20px',
              padding: '24px 28px',
              borderRadius: '24px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
              background: isDark ? 'linear-gradient(165deg, #18191E 0%, #121316 100%)' : '#FFFFFF',
              boxShadow: isDark ? '0 12px 36px -8px rgba(0, 0, 0, 0.5)' : '0 6px 24px -4px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.01em' }}>
                {editingGroup ? 'Edit Group' : 'Add New Group'}
              </div>
              <button 
                onClick={resetForm}
                style={{
                  padding: '6px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: isDark ? '#94A3B8' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                <IoCloseOutline size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.80rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '8px' }}>
                    Group Name *
                  </div>
                  <input 
                    className="pmInput" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    maxLength={50} 
                    required 
                    placeholder="e.g. Beverages, Main Course"
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                      background: isDark ? '#16171B' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.80rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '8px' }}>
                    Description
                  </div>
                  <input 
                    className="pmInput" 
                    value={formData.description} 
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of this group..."
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                      background: isDark ? '#16171B' : '#F8FAFC',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      width: '100%'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: isDark ? '#16171B' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
                }}>
                  <input 
                    type="checkbox" 
                    id="is_active_toggle" 
                    checked={formData.is_active} 
                    onChange={(e) => handleInputChange('is_active', e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#FF6B1A' }} 
                  />
                  <label htmlFor="is_active_toggle" style={{ fontWeight: 700, fontSize: '0.90rem', cursor: 'pointer', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                    Active Group (Visible in POS & Menus)
                  </label>
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                    background: 'transparent',
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: '9px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    fontWeight: 750,
                    fontSize: '0.86rem',
                    boxShadow: '0 4px 14px rgba(255, 107, 26, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alerts */}
      {error && <div className="pmError" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* Groups Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'baseline',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Groups
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', opacity: 0.7 }}>
              ({loading ? 'Loading...' : `${filteredGroups.length} Groups`})
            </span>
          </div>
          {filteredGroups.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="select_page_toggle"
                checked={selectedGroupIds.length === paginatedGroups.length && paginatedGroups.length > 0}
                onChange={() => handleSelectAll(paginatedGroups)}
                style={{ cursor: 'pointer', width: '15px', height: '15px' }}
              />
              <label htmlFor="select_page_toggle" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Select All
              </label>
            </div>
          )}
        </div>

        {loading ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading groups...</div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 32px',
            border: '2px dashed var(--glass-border)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗂</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Groups Yet</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Create your first group to start organizing categories.</div>
            <Button variant="primary" onClick={() => setShowAddForm(true)} icon={<IoAddOutline size={18} />}>Create Group</Button>
          </div>
        ) : (
          <motion.div 
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
            variants={staggerContainer} 
            initial="initial" 
            animate="animate"
          >
            {paginatedGroups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <motion.div key={group.id} variants={staggerItem}>
                  <div
                    style={{
                      padding: '22px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '210px',
                      opacity: group.is_active ? 1 : 0.65,
                      border: !group.is_active
                        ? '1px dashed rgba(239, 68, 68, 0.35)'
                        : (isSelected
                            ? '1.5px solid #FF6B1A'
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0')),
                      background: isDark
                        ? (isSelected ? 'rgba(255, 107, 26, 0.08)' : 'linear-gradient(165deg, #18191E 0%, #121316 100%)')
                        : (isSelected ? '#FFF7ED' : '#FFFFFF'),
                      boxShadow: isDark
                        ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
                        : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: '24px'
                    }}
                    onClick={() => selectGroup(group)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#FF6B1A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = group.is_active
                          ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0')
                          : 'rgba(239, 68, 68, 0.35)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        {group.name}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={() => handleToggleSelectGroup(group.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#FF6B1A' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleGroupActive(group); }}
                        title={group.is_active ? 'Click to disable group' : 'Click to enable group'}
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 750,
                          borderRadius: '999px',
                          border: group.is_active ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                          background: group.is_active ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4') : (isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2'),
                          color: group.is_active ? '#10B981' : '#EF4444',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: group.is_active ? '#10B981' : '#EF4444' }} />
                        {group.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div style={{ fontSize: '0.86rem', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                      {group.description || 'No description available.'}
                    </div>

                    <div style={{ height: '1px', background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', width: '100%', marginBottom: '14px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        fontSize: '0.74rem',
                        color: '#FF6B1A',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: isDark ? 'rgba(255, 107, 26, 0.1)' : '#FFF7ED',
                        border: '1px solid rgba(255, 107, 26, 0.25)',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}>
                        {group.categories_count || 0} Categories
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleEdit(group)} 
                          style={{ 
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                            background: 'transparent',
                            color: isDark ? '#94A3B8' : '#64748B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.80rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <IoCreateOutline size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => onRequestDelete(group)} 
                          style={{ 
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.80rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <IoTrashOutline size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {pageCount > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '32px', alignItems: 'center' }}>
            <button 
              className="pmSecondaryBtn" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >
              Prev
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Page {currentPage} of {pageCount}</span>
            <button 
              className="pmSecondaryBtn" 
              disabled={currentPage === pageCount} 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              style={{ padding: '8px 16px', borderRadius: '8px' }}
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Category Management Section */}
      <AnimatePresence>
        {(selectedGroup || isShowingAllCategories) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: '48px' }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '22px 28px',
              background: isDark
                ? 'linear-gradient(165deg, #18191E 0%, #121316 100%)'
                : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
              borderRadius: '24px',
              boxShadow: isDark
                ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
                : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={deselectGroup}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: isDark ? '#16171B' : '#F1F5F9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.86rem',
                    fontWeight: 750,
                    transition: 'all 0.18s ease'
                  }}
                >
                  <IoChevronBackOutline size={16} /> Back to Groups
                </button>
                <div>
                  <h2 style={{
                    fontSize: '1.45rem',
                    fontWeight: 850,
                    margin: 0,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    letterSpacing: '-0.01em'
                  }}>
                    {isShowingAllCategories ? 'All Categories' : `Categories in ${selectedGroup?.name}`}
                  </h2>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="gm-search-container" style={{ minWidth: '240px' }}>
                  <IoSearchOutline className="gm-search-icon" size={17} />
                  <input
                    className="gm-search-input"
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    style={{
                      height: '40px',
                      borderRadius: '12px',
                      background: isDark ? '#16171B' : '#F8FAFC',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                      color: isDark ? '#FFFFFF' : '#0F172A'
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowAddCategoryForm(true)}
                  disabled={showAddCategoryForm}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    height: '40px',
                    padding: '0 20px',
                    borderRadius: '14px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 6px 20px rgba(255, 107, 26, 0.35)',
                    cursor: showAddCategoryForm ? 'not-allowed' : 'pointer',
                    opacity: showAddCategoryForm ? 0.6 : 1,
                    transition: 'all 0.18s ease'
                  }}
                >
                  <IoAddOutline size={18} /> Add Category
                </button>
              </div>
            </div>

            {/* Add/Edit Category Form */}
            <AnimatePresence>
              {showAddCategoryForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginBottom: '28px',
                    padding: '24px 28px',
                    borderRadius: '24px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
                    background: isDark ? 'linear-gradient(165deg, #18191E 0%, #121316 100%)' : '#FFFFFF',
                    boxShadow: isDark ? '0 12px 36px -8px rgba(0, 0, 0, 0.5)' : '0 6px 24px -4px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #F1F5F9'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </div>
                    <button 
                      onClick={resetCategoryForm}
                      style={{
                        padding: '6px',
                        borderRadius: '10px',
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94A3B8' : '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      <IoCloseOutline size={22} />
                    </button>
                  </div>
                  <form onSubmit={handleCategorySubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.80rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '8px' }}>
                          Category Name *
                        </div>
                        <input 
                          className="pmInput" 
                          value={categoryFormData.name} 
                          onChange={(e) => handleCategoryInputChange('name', e.target.value)} 
                          maxLength={50} 
                          required
                          placeholder="e.g. Hot Drinks, Sandwiches"
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                            background: isDark ? '#16171B' : '#F8FAFC',
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            width: '100%'
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.80rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '8px' }}>
                          Description
                        </div>
                        <input 
                          className="pmInput" 
                          value={categoryFormData.description} 
                          onChange={(e) => handleCategoryInputChange('description', e.target.value)}
                          placeholder="Brief description..."
                          style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                            background: isDark ? '#16171B' : '#F8FAFC',
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            width: '100%'
                          }}
                        />
                      </div>
                      {isShowingAllCategories && (
                        <div>
                          <div style={{ fontSize: '0.80rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '8px' }}>
                            Assign to Group *
                          </div>
                          <GlobalSelect
                            options={groups.map(g => ({ label: g.name, value: g.id }))}
                            value={categoryFormData.group_id || ''}
                            onChange={(val) => handleCategoryInputChange('group_id', val ? parseInt(val) : '')}
                            placeholder="-- Select Group --"
                            direction="top"
                          />
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isDark ? '#16171B' : '#F8FAFC',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
                      }}>
                        <input 
                          type="checkbox" 
                          id="cat_active_toggle" 
                          checked={categoryFormData.active} 
                          onChange={(e) => handleCategoryInputChange('active', e.target.checked)} 
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#FF6B1A' }} 
                        />
                        <label htmlFor="cat_active_toggle" style={{ fontWeight: 700, fontSize: '0.90rem', cursor: 'pointer', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                          Active Category (Visible in POS & Menus)
                        </label>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={resetCategoryForm}
                        style={{
                          padding: '9px 22px',
                          borderRadius: '12px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                          background: 'transparent',
                          color: isDark ? '#94A3B8' : '#64748B',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{
                          padding: '9px 24px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                          color: '#FFFFFF',
                          fontWeight: 750,
                          fontSize: '0.86rem',
                          boxShadow: '0 4px 14px rgba(255, 107, 26, 0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        {editingCategory ? 'Update Category' : 'Create Category'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category List */}
            {loadingCategories ? (
              <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#94A3B8' : '#64748B' }}>Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div style={{
                padding: '48px 32px',
                textAlign: 'center',
                border: isDark ? '2px dashed rgba(255, 255, 255, 0.1)' : '2px dashed #CBD5E1',
                background: isDark ? 'rgba(255, 255, 255, 0.01)' : '#F8FAFC',
                borderRadius: '24px'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: '8px' }}>No Categories Yet</div>
                <div style={{ fontSize: '0.88rem', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '20px' }}>
                  {categorySearchTerm ? 'No categories match your search.' : 'Create your first category inside this group.'}
                </div>
                {!categorySearchTerm && (
                  <button
                    onClick={() => setShowAddCategoryForm(true)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                      color: '#FFFFFF',
                      fontWeight: 750,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255, 107, 26, 0.3)'
                    }}
                  >
                    Create Category
                  </button>
                )}
              </div>
            ) : (
              <motion.div 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px'
                }}
                variants={staggerContainer} 
                initial="initial" 
                animate="animate"
              >
                {filteredCategories.map((cat) => (
                  <motion.div key={cat.id} variants={staggerItem}>
                    <div
                      style={{
                        padding: '22px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
                        opacity: cat.active ? 1 : 0.65,
                        background: isDark ? 'linear-gradient(165deg, #18191E 0%, #121316 100%)' : '#FFFFFF',
                        boxShadow: isDark
                          ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
                          : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: '24px',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = '#FF6B1A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
                      }}
                    >
                      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ fontSize: '1.20rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                            {cat.name}
                          </div>
                          <span
                            style={{
                              padding: '3px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 750,
                              background: cat.active ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4') : (isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9'),
                              color: cat.active ? '#10B981' : '#64748B',
                              border: cat.active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #CBD5E1',
                              borderRadius: '999px'
                            }}
                          >
                            {cat.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {isShowingAllCategories && (
                          <div style={{ fontSize: '0.74rem', fontWeight: 750, color: '#FF6B1A', marginBottom: '10px', background: isDark ? 'rgba(255, 107, 26, 0.1)' : '#FFF7ED', padding: '3px 10px', borderRadius: '999px', alignSelf: 'flex-start', border: '1px solid rgba(255, 107, 26, 0.25)' }}>
                            Group: {cat.group_name || 'Unassigned'}
                          </div>
                        )}
                        <div style={{ fontSize: '0.86rem', color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>
                          {cat.description || 'No description available.'}
                        </div>

                        <div style={{ height: '1px', background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', width: '100%', marginBottom: '14px' }} />                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            fontSize: '0.76rem',
                            color: '#10B981',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}>
                            {cat.product_count || 0} Products
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button 
                              onClick={() => handleCategoryEdit(cat)} 
                              style={{ 
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                                background: 'transparent',
                                color: isDark ? '#94A3B8' : '#64748B',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.80rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              <IoCreateOutline size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => handleCategoryDelete(cat)} 
                              style={{ 
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#EF4444',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.80rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              <IoTrashOutline size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deletion Prompt Modal */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div className="pmOverlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="pmDialog" style={{ width: 'calc(450px * var(--display-zoom))' }} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="pmDialogTitle">Delete Group?</div>
              <div className="pmDialogBody">
                <p>Are you sure you want to delete group <strong>"{pendingDelete.name}"</strong>?</p>
                {pendingDelete.categories_count > 0 && (
                  <div className="glass-card" style={{ padding: '16px', marginTop: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ color: '#ef4444', fontWeight: 700, margin: '0 0 10px 0' }}>⚠️ This group contains {pendingDelete.categories_count} active categories.</p>
                    <p style={{ fontSize: '13px', margin: '0 0 12px 0' }}>Choose what to do with them:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {otherGroups.length > 0 && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                          <input type="radio" name="delete_action" checked={deleteOption === 'move'} onChange={() => setDeleteOption('move')} />
                          Move categories to another group:
                        </label>
                      )}
                      {deleteOption === 'move' && otherGroups.length > 0 && (
                        <select className="pmInput" value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} style={{ marginLeft: '24px', width: '80%', height: 'calc(34px * var(--display-zoom))' }}>
                          {otherGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                        </select>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="radio" name="delete_action" checked={deleteOption === 'remove'} onChange={() => setDeleteOption('remove')} />
                        Remove group assignment (leave categories unassigned)
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="pmDialogActions">
                <button className="pmDialogBtn" onClick={() => setPendingDelete(null)}>Cancel</button>
                <button className="pmDialogBtn pmDialogBtnPrimary" style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }} onClick={handleConfirmDelete}>Confirm Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (activeTab) {
    return content;
  }

  return <PageContainer>{content}</PageContainer>;
};

export default GroupManagement;
