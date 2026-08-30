import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { workerAPI } from '../../api/workers';

const Attendance = () => {
    const { isDark } = useTheme();
    const { showSuccess, showError, showConfirm } = useAlert();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await workerAPI.getWorkers();
            setWorkers(data || []);
        } catch (error) {
            console.error("Failed to load workers", error);
        } finally {
            setLoading(false);
        }
    };

    const markIndividual = async (id, status) => {
        try {
            await workerAPI.markAttendance(id, { status, check_in: '09:00' });
            loadData();
        } catch (e) {
            showError('Error marking attendance');
        }
    };

    const markAllPresent = async () => {
        const confirmed = await showConfirm({
            title: 'Mark All Present',
            description: 'Mark ALL active workers as PRESENT for today?',
            confirmLabel: 'Mark All Present',
            cancelLabel: 'Cancel',
            variant: 'primary',
        });
        if (!confirmed) return;
        try {
            await workerAPI.bulkMarkPresent();
            loadData();
            showSuccess('All workers marked Present!');
        } catch (e) {
            showError('Error in bulk action');
        }
    };

    const presentCount = workers.filter(w => w.today_attendance === 'Present').length;
    const absentCount = workers.filter(w => w.today_attendance === 'Absent').length;
    const unmarkedCount = workers.filter(w => !w.today_attendance || w.today_attendance === 'Not Marked').length;

    return (
        <div style={{
            padding: '28px 32px 48px',
            height: '100%',
            overflowY: 'auto',
            background: isDark ? '#0A0C10' : '#F8FAFC',
            color: isDark ? '#FFFFFF' : '#0F172A',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
            {/* Header Area */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: 900,
                            margin: 0,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.03em',
                        }}>
                            Daily Attendance
                        </h1>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            background: isDark ? 'rgba(255, 107, 26, 0.15)' : '#FFF7ED',
                            border: isDark ? '1px solid rgba(255, 107, 26, 0.3)' : '1px solid #FDBA74',
                            color: '#EA580C',
                            fontSize: '12px',
                            fontWeight: 750,
                            letterSpacing: '0.02em',
                        }}>
                            Live Tracker
                        </span>
                    </div>
                    <p style={{
                        margin: '6px 0 0 0',
                        color: isDark ? '#94A3B8' : '#64748B',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Master Bulk Action */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={markAllPresent}
                    style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '12px 26px',
                        fontSize: '14.5px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mark All Present Today
                </motion.button>
            </div>

            {/* KPI Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
            }}>
                {[
                    { label: 'Total Workers', count: workers.length, color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF', border: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BFDBFE' },
                    { label: 'Present Today', count: presentCount, color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5', border: isDark ? 'rgba(16, 185, 129, 0.25)' : '#A7F3D0' },
                    { label: 'Absent Today', count: absentCount, color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2', border: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA' },
                    { label: 'Unmarked', count: unmarkedCount, color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB', border: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        style={{
                            background: isDark ? '#141722' : '#FFFFFF',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
                            borderRadius: '20px',
                            padding: '18px 22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 750, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {stat.label}
                            </div>
                            <div style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', marginTop: '4px' }}>
                                {stat.count}
                            </div>
                        </div>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: stat.bg,
                            border: `1px solid ${stat.border}`,
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 800,
                        }}>
                            {stat.count}
                        </div>
                    </div>
                ))}
            </div>

            {/* Attendance Table Card */}
            <div style={{
                background: isDark ? '#141722' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.35)' : '0 4px 24px rgba(15, 23, 42, 0.05)',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: isDark ? '#181C2A' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #E2E8F0' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: isDark ? '#94A3B8' : '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Worker
                            </th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: isDark ? '#94A3B8' : '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Role / Title
                            </th>
                            <th style={{ padding: '16px 24px', textAlign: 'center', color: isDark ? '#94A3B8' : '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Status Today
                            </th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: isDark ? '#94A3B8' : '#475569', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Quick Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map((worker) => {
                            const isPresent = worker.today_attendance === 'Present';
                            const isAbsent = worker.today_attendance === 'Absent';

                            return (
                                <tr
                                    key={worker.worker_id}
                                    style={{
                                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9',
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    {/* Worker Info */}
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '12px',
                                                background: isDark ? 'rgba(255, 107, 26, 0.12)' : '#FFF7ED',
                                                border: isDark ? '1px solid rgba(255, 107, 26, 0.25)' : '1px solid #FDBA74',
                                                color: '#EA580C',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '14px',
                                            }}>
                                                {(worker.name || 'W').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '14.5px', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                                    {worker.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                                                    ID: #{worker.worker_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td style={{ padding: '16px 24px', fontSize: '13.5px', fontWeight: 600, color: isDark ? '#CBD5E1' : '#475569' }}>
                                        {worker.role || 'Staff'}
                                    </td>

                                    {/* Status Badge */}
                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 14px',
                                            borderRadius: '999px',
                                            fontSize: '12.5px',
                                            fontWeight: 800,
                                            background: isPresent
                                                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                                                : isAbsent
                                                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2')
                                                    : (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB'),
                                            border: isPresent
                                                ? (isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0')
                                                : isAbsent
                                                    ? (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA')
                                                    : (isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A'),
                                            color: isPresent ? '#10B981' : isAbsent ? '#EF4444' : '#D97706',
                                        }}>
                                            <span style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: isPresent ? '#10B981' : isAbsent ? '#EF4444' : '#F59E0B',
                                            }} />
                                            {worker.today_attendance || 'Not Marked'}
                                        </span>
                                    </td>

                                    {/* Action Buttons */}
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                onClick={() => markIndividual(worker.worker_id, 'Present')}
                                                title="Mark Present"
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '10px',
                                                    border: isPresent ? '1.5px solid #10B981' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1'),
                                                    background: isPresent ? '#10B981' : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                                                    color: isPresent ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#475569'),
                                                    fontWeight: 750,
                                                    fontSize: '12.5px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}
                                            >
                                                ✓ Present
                                            </button>
                                            <button
                                                onClick={() => markIndividual(worker.worker_id, 'Absent')}
                                                title="Mark Absent"
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '10px',
                                                    border: isAbsent ? '1.5px solid #EF4444' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1'),
                                                    background: isAbsent ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                                                    color: isAbsent ? '#FFFFFF' : (isDark ? '#E2E8F0' : '#475569'),
                                                    fontWeight: 750,
                                                    fontSize: '12.5px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}
                                            >
                                                ✕ Absent
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {workers.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: isDark ? '#94A3B8' : '#64748B' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '18px',
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#94A3B8' : '#64748B'
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 750, color: isDark ? '#FFFFFF' : '#0F172A' }}>No Workers Registered</div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Please add workers in the staff management section first.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
