import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoAdd, IoSearch } from 'react-icons/io5';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { workerService } from '../../services/workerService';
import Button from '../../components/ui/Button';
import WorkerStats from './WorkerStats';
import WorkerTable from './WorkerTable';
import WorkerEmpty from './WorkerEmpty';
import AddWorkerModal from './AddWorkerModal';
import AttendanceModal from './AttendanceModal';
import PageContainer from '../layout/PageContainer';

const WorkersPage = () => {
    const { currentTheme, isDark } = useTheme();
    const { showConfirm, showError } = useAlert();
    const navigate = useNavigate();

    const [stats, setStats] = useState({});
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, workersData] = await Promise.all([
                workerService.getStats(),
                workerService.getWorkers()
            ]);
            setStats(statsData || {});
            setWorkers(workersData || []);
        } catch (err) {
            console.error('Failed to load worker data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => { setEditingWorker(null); setShowAddModal(true); };
    const handleEditClick = (worker) => { setEditingWorker(worker); setShowAddModal(true); };
    const handleViewClick = (worker) => { navigate(`/workers/${worker.worker_id}`); };
    const handleAttendanceClick = () => { setShowAttendanceModal(true); };

    const handleDeleteClick = async (worker) => {
        const confirmed = await showConfirm({
            title: `Delete ${worker.name}?`,
            description: 'This worker will be permanently removed. This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (confirmed) {
            try {
                await workerService.deleteWorker(worker.worker_id);
                await loadData();
            } catch (err) {
                showError('Failed to delete worker');
            }
        }
    };

    const handleModalSave = async () => { await loadData(); setShowAddModal(false); };

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.phone && w.phone.includes(searchQuery))
    );

    // Skeleton loader for premium feel
    const SkeletonRows = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
            {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 16px',
                    opacity: 1 - (i * 0.15),
                }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{
                            width: 120 + (i * 20), height: 12, borderRadius: 4,
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                        <div style={{
                            width: 80, height: 10, borderRadius: 4,
                            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <PageContainer>
            {/* ─── Header ─── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 style={{
                        fontSize: 'calc(28px * var(--text-scale))',
                        fontWeight: 600,
                        margin: '0 0 calc(2px * var(--display-zoom)) 0',
                        color: isDark ? '#FFFFFF' : '#111827',
                        letterSpacing: '-0.02em',
                    }}>
                        Workers
                    </h1>
                    <p style={{
                        margin: 0,
                        color: isDark ? '#71717A' : '#6B7280',
                        fontSize: 'calc(13px * var(--text-scale))',
                        fontWeight: 400,
                    }}>
                        Manage your staff, attendance and salary
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    style={{
                        display: 'flex',
                        gap: 'calc(12px * var(--display-zoom))'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleAttendanceClick}
                        style={{
                            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
                            borderRadius: 'calc(10px * var(--display-zoom))',
                            padding: 'calc(9px * var(--display-zoom)) calc(18px * var(--display-zoom))',
                            fontSize: 'calc(13px * var(--text-scale))',
                            fontWeight: 600,
                            color: '#3B82F6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'calc(6px * var(--display-zoom))',
                            transition: 'all 0.2s ease',
                        }}
                        whileHover={{
                            background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            scale: 1.02,
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                            <path d="M2 12h20" />
                        </svg>
                        Take Attendance
                    </Button>
                    
                    <Button
                        variant="primary"
                        onClick={handleAddClick}
                        style={{
                            background: '#F97316',
                            border: 'none',
                            borderRadius: 'calc(10px * var(--display-zoom))',
                            padding: 'calc(9px * var(--display-zoom)) calc(18px * var(--display-zoom))',
                            fontSize: 'calc(13px * var(--text-scale))',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'calc(6px * var(--display-zoom))',
                            boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                        }}
                        whileHover={{
                            boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                            scale: 1.02,
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <IoAdd size={16} />
                        Add Worker
                    </Button>
                </motion.div>
            </div>


            {/* ─── Content ─── */}
            <div style={{
                background: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                borderRadius: 'calc(16px * var(--display-zoom))',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                overflow: 'hidden', // Ensure stats bar borders don't overflow
            }}>
                {/* Stats Bar Integrated */}
                <WorkerStats stats={stats} />
                {/* Search + Count header */}
                {workers.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'calc(14px * var(--display-zoom)) calc(16px * var(--display-zoom))',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    }}>
                        <div style={{
                            position: 'relative',
                            width: 'calc(260px * var(--display-zoom))',
                        }}>
                            <IoSearch
                                size={14}
                                style={{
                                    position: 'absolute',
                                    left: 10, top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: isDark ? '#52525B' : '#9CA3AF',
                                    pointerEvents: 'none',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search by name, role or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 'calc(8px * var(--display-zoom)) calc(10px * var(--display-zoom)) calc(8px * var(--display-zoom)) calc(32px * var(--display-zoom))',
                                    borderRadius: 'calc(8px * var(--display-zoom))',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                                    background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                                    color: isDark ? '#FAFAFA' : '#111827',
                                    fontSize: 'calc(13px * var(--text-scale))',
                                    outline: 'none',
                                    transition: 'all 0.15s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'rgba(249,115,22,0.4)';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <span style={{
                            fontSize: 'calc(12px * var(--text-scale))',
                            color: isDark ? '#52525B' : '#9CA3AF',
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {filteredWorkers.length} {filteredWorkers.length === 1 ? 'worker' : 'workers'}
                        </span>
                    </div>
                )}

                {/* Body */}
                <div style={{ padding: workers.length > 0 ? 'calc(8px * var(--display-zoom)) 0 calc(4px * var(--display-zoom)) 0' : 0 }}>
                    {loading ? (
                        <SkeletonRows />
                    ) : workers.length > 0 ? (
                        filteredWorkers.length > 0 ? (
                            <WorkerTable
                                workers={filteredWorkers}
                                onView={handleViewClick}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                        ) : (
                            <div style={{
                                padding: '48px 16px',
                                textAlign: 'center',
                                color: isDark ? '#52525B' : '#9CA3AF',
                                fontSize: 14,
                            }}>
                                No workers match "{searchQuery}"
                            </div>
                        )
                    ) : (
                        <WorkerEmpty onAdd={handleAddClick} />
                    )}
                </div>
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
                workers={workers}
                onClose={() => setShowAttendanceModal(false)}
                onAttendanceUpdate={() => loadData()}
            />
        </PageContainer>
    );
};

export default WorkersPage;
