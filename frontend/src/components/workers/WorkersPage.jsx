import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IoAdd,
  IoSearch,
  IoTimeOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoSyncOutline
} from 'react-icons/io5';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';
import { workerService } from '../../services/workerService';
import { formatCurrency } from '../../utils/api';
import PageContainer from '../layout/PageContainer';
import WorkerTable from './WorkerTable';
import WorkerEmpty from './WorkerEmpty';
import AddWorkerModal from './AddWorkerModal';
import AttendanceModal from './AttendanceModal';
import '../../styles/Workers.css';

export default function WorkersPage() {
  const { showConfirm, showError, showSuccess } = useAlert();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    loadData();

    const handleAttendanceUpdated = () => {
      loadData(true);
    };
    window.addEventListener('worker-attendance-updated', handleAttendanceUpdated);
    return () => {
      window.removeEventListener('worker-attendance-updated', handleAttendanceUpdated);
    };
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsData, workersData] = await Promise.all([
        workerService.getStats(),
        workerService.getWorkers('all')
      ]);
      setStats(statsData || {});
      setWorkers(workersData || []);
    } catch (err) {
      console.error('Failed to load worker data', err);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAddClick = () => {
    setEditingWorker(null);
    setShowAddModal(true);
  };

  const handleEditClick = (worker) => {
    setEditingWorker(worker);
    setShowAddModal(true);
  };

  const handleViewClick = (worker, tab = 'attendance') => {
    navigate(`/workers/${worker.worker_id}?tab=${tab}`, { state: { tab } });
  };

  const handleWorkerAttendance = (worker) => {
    navigate(`/workers/${worker.worker_id}?tab=attendance`, { state: { tab: 'attendance' } });
  };

  const handleWorkerSalary = (worker) => {
    navigate(`/workers/${worker.worker_id}?tab=salary`, { state: { tab: 'salary' } });
  };

  const handleWorkerPayroll = (worker) => {
    navigate(`/workers/${worker.worker_id}?tab=advances`, { state: { tab: 'advances' } });
  };

  const handleAttendanceClick = () => {
    setShowAttendanceModal(true);
  };

  const handleDeleteClick = async (worker) => {
    const confirmed = await showConfirm({
      title: `Deactivate ${worker.name}?`,
      description: 'This worker will be marked as inactive and will not appear in daily attendance or payroll cycles.',
      confirmLabel: 'Deactivate',
      cancelLabel: 'Cancel',
      variant: 'warning'
    });
    if (confirmed) {
      try {
        await workerService.deleteWorker(worker.worker_id, { permanent: false });
        showSuccess(`Worker "${worker.name}" deactivated`);
        await loadData(true);
      } catch (err) {
        showError('Failed to deactivate worker');
      }
    }
  };

  const handlePermanentDeleteClick = async (worker) => {
    const confirmed = await showConfirm({
      title: `Permanently Delete ${worker.name}?`,
      description: 'This will permanently remove the worker profile and associated records. This action cannot be undone.',
      confirmLabel: 'Delete Permanently',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });
    if (confirmed) {
      try {
        await workerService.deleteWorker(worker.worker_id, { permanent: true });
        showSuccess(`Worker "${worker.name}" deleted permanently`);
        await loadData(true);
      } catch (err) {
        showError('Failed to permanently delete worker');
      }
    }
  };

  const handleReactivateClick = async (worker) => {
    try {
      await workerService.updateWorker(worker.worker_id, { status: 'active' });
      showSuccess(`Worker "${worker.name}" reactivated`);
      await loadData(true);
    } catch (err) {
      showError('Failed to reactivate worker');
    }
  };

  const handleModalSave = async () => {
    await loadData(true);
    setShowAddModal(false);
  };

  const activeWorkersCount = useMemo(() => workers.filter((w) => w.status === 'active').length, [workers]);
  const inactiveWorkersCount = useMemo(() => workers.filter((w) => w.status === 'inactive').length, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(
      (w) =>
        w.status === statusFilter &&
        (w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (w.phone && w.phone.includes(searchQuery)))
    );
  }, [workers, statusFilter, searchQuery]);

  return (
    <PageContainer>
      <div className="workers-page-wrap">
        {/* ─── Unified Header Card (24px Curve, Black-Grey) ─── */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
            borderRadius: '24px',
            boxShadow: isDark
              ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: '900',
                margin: 0,
                color: isDark ? '#FFFFFF' : '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              Staff & Workers
            </h1>
            <p
              style={{
                margin: '4px 0 0 0',
                color: isDark ? '#94A3B8' : '#64748B',
                fontSize: '0.88rem',
                fontWeight: 500
              }}
            >
              Manage employee profiles, daily attendance logs, advances, and payroll cycles
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh workers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '40px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: '700',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                background: isDark ? '#16171B' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#0F172A',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <IoSyncOutline className={isRefreshing ? 'spinner' : ''} size={16} /> Sync
            </button>

            <button
              type="button"
              onClick={handleAttendanceClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '40px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: '700',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <IoTimeOutline size={17} /> Attendance
            </button>

            <button
              type="button"
              onClick={handleAddClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '40px',
                padding: '0 20px',
                borderRadius: '14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(255, 107, 26, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <IoAdd size={20} /> Add Worker
            </button>
          </div>
        </div>

        {/* ─── Metric Summary Cards (4-Column Modern Glass) ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            {
              label: 'Total Staff',
              value: stats.totalWorkers || workers.length,
              subtext: `${activeWorkersCount} active, ${inactiveWorkersCount} inactive`,
              color: '#3B82F6',
              icon: <IoPeopleOutline size={22} />
            },
            {
              label: 'Active Staff',
              value: stats.activeWorkers || activeWorkersCount,
              subtext: 'Eligible for payroll',
              color: '#10B981',
              icon: <IoCheckmarkCircleOutline size={22} />
            },
            {
              label: 'Present Today',
              value: stats.presentToday || 0,
              subtext: 'Daily marked attendance',
              color: '#FF6B1A',
              icon: <IoCalendarOutline size={22} />
            },
            {
              label: 'Net Payable',
              value: formatCurrency(stats.netPayable !== undefined ? stats.netPayable : (stats.totalSalary || 0)),
              subtext: `Total Base: ${formatCurrency(stats.totalSalary || 0)}`,
              color: '#8B5CF6',
              icon: <IoWalletOutline size={22} />
            }
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px 20px',
                background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
                borderRadius: '24px',
                boxShadow: isDark
                  ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
                  : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  background: `${card.color}15`,
                  border: `1px solid ${card.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  flexShrink: 0
                }}
              >
                {card.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isDark ? '#94A3B8' : '#64748B'
                  }}
                >
                  {card.label}
                </span>
                <span
                  style={{
                    fontSize: '1.40rem',
                    fontWeight: '850',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {card.value}
                </span>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: isDark ? '#64748B' : '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {card.subtext}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ─── Controls: Search & Status Filter Tabs ─── */}
        <div
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 300px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="workers-search" style={{ flex: '1 1 240px' }}>
              <IoSearch className="workers-search-icon" size={16} />
              <input
                className="workers-search-input"
                type="text"
                placeholder="Search staff by name, role or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: '42px',
                  borderRadius: '14px',
                  background: isDark ? '#16171B' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.90rem',
                  fontWeight: 600
                }}
              />
            </div>

            {/* Status Filter Pills */}
            <div
              style={{
                display: 'inline-flex',
                background: isDark ? '#16171B' : '#F1F5F9',
                borderRadius: '14px',
                padding: '3px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                gap: '3px',
                flexShrink: 0
              }}
            >
              {[
                { key: 'active', label: 'Active Staff', count: activeWorkersCount },
                { key: 'inactive', label: 'Inactive Staff', count: inactiveWorkersCount }
              ].map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    style={{
                      padding: '7px 16px',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      background: isActive ? '#FF6B1A' : 'transparent',
                      color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(255, 107, 26, 0.3)' : 'none',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: isActive ? 'rgba(0, 0, 0, 0.25)' : isDark ? '#1F2026' : '#E2E8F0',
                        color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                        fontWeight: 800
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <span
            style={{
              fontSize: '0.84rem',
              color: isDark ? '#94A3B8' : '#64748B',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {filteredWorkers.length} {filteredWorkers.length === 1 ? 'employee shown' : 'employees shown'}
          </span>
        </div>

        {/* ─── Workers Grid List ─── */}
        <div style={{ flex: 1, paddingBottom: '24px' }}>
          {loading ? (
            <div
              style={{
                padding: '60px',
                textAlign: 'center',
                color: isDark ? '#94A3B8' : '#64748B',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div className="spinner" />
              <span style={{ fontWeight: 600 }}>Loading staff members...</span>
            </div>
          ) : workers.length === 0 ? (
            <WorkerEmpty onAdd={handleAddClick} />
          ) : filteredWorkers.length === 0 ? (
            <div
              style={{
                padding: '50px 30px',
                textAlign: 'center',
                background: isDark ? '#16171B' : '#FFFFFF',
                border: isDark ? '2px dashed rgba(255, 255, 255, 0.08)' : '2px dashed #CBD5E1',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: 'rgba(255, 107, 26, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF6B1A'
                }}
              >
                <IoPeopleOutline size={26} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                No Workers Found
              </div>
              <p style={{ fontSize: '0.88rem', color: isDark ? '#94A3B8' : '#64748B', margin: 0, maxWidth: '420px' }}>
                {searchQuery
                  ? `No employees match "${searchQuery}" in ${statusFilter} staff.`
                  : `There are currently no ${statusFilter} workers registered.`}
              </p>
            </div>
          ) : (
            <WorkerTable
              workers={filteredWorkers}
              statusFilter={statusFilter}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onPermanentDelete={handlePermanentDeleteClick}
              onReactivate={handleReactivateClick}
              onAttendance={handleWorkerAttendance}
              onSalaryHistory={handleWorkerSalary}
              onPayroll={handleWorkerPayroll}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <AddWorkerModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSaved={handleModalSave}
          initialData={editingWorker}
        />

        {/* Attendance Modal */}
        <AttendanceModal
          isOpen={showAttendanceModal}
          workers={workers.filter((w) => w.status === 'active')}
          onClose={() => setShowAttendanceModal(false)}
          onAttendanceUpdate={() => loadData(true)}
        />
      </div>
    </PageContainer>
  );
}
