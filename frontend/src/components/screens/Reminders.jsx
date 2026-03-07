/**
 * =============================================================================
 * SMART REMINDERS SCREEN — Reminders.jsx
 * =============================================================================
 * A business assistant inside ReBill — helps shop owners manage supplier
 * payments, inventory restocking, staff salaries, daily tasks, and more.
 * =============================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
    REMINDER_CATEGORIES, PRIORITY_LEVELS, REPEAT_TYPES, SNOOZE_OPTIONS,
    generateId, loadReminders, saveReminders, formatSmartTime,
    isOverdue, isDueNow, categorizeReminders, generateMockSuggestions,
    createDefaultReminder, loadDismissedSuggestions, saveDismissedSuggestions,
    resetRecurringReminder,
} from '../../utils/reminderUtils';
import { getLocalDateString } from '../../utils/api';
import GlobalDatePicker from '../ui/GlobalDatePicker';
import GlobalTimePicker from '../ui/GlobalTimePicker';
import GlobalSelect from '../ui/GlobalSelect';
import '../../styles/Reminders.css';

// ─── Inline icon helpers ─────────────────────────────────────────────────────
const Icons = {
    bell: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    plus: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
    ),
    check: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
    ),
    clock: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    ),
    trash: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
    ),
    edit: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
    ),
    repeat: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
    ),
    x: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
    ),
    chevron: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
    ),
    sparkle: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>
    ),
};

const TABS = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'completed', label: 'Completed' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Reminders() {
    const { currentTheme, isDark } = useTheme();
    const t = currentTheme;

    // ─── State ──────────────────────────────────────────────────────────────────
    const [reminders, setReminders] = useState(() => loadReminders());
    const [activeTab, setActiveTab] = useState('today');
    const [showModal, setShowModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [completingIds, setCompletingIds] = useState(new Set());
    const [toasts, setToasts] = useState([]);
    const [dismissedSuggestions, setDismissedSuggestions] = useState(() => loadDismissedSuggestions());
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [snoozeMenuId, setSnoozeMenuId] = useState(null);

    // Quick-add state
    const [quickTitle, setQuickTitle] = useState('');
    const [quickDate, setQuickDate] = useState(getLocalDateString());
    const [quickTime, setQuickTime] = useState('09:00');
    const [quickRepeat, setQuickRepeat] = useState('once');
    const [quickPriority, setQuickPriority] = useState('medium');
    const [quickCategory, setQuickCategory] = useState('custom');

    const triggeredRef = useRef(new Set());

    // ─── Persist ────────────────────────────────────────────────────────────────
    useEffect(() => { saveReminders(reminders); }, [reminders]);
    useEffect(() => { saveDismissedSuggestions(dismissedSuggestions); }, [dismissedSuggestions]);

    // ─── Notification Timer (30s) ───────────────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            reminders.forEach((r) => {
                if (isDueNow(r) && !triggeredRef.current.has(r.id)) {
                    triggeredRef.current.add(r.id);
                    addToast(`⏰ ${r.title}`, formatSmartTime(r.date, r.time, r.repeatType));
                    if (Notification.permission === 'granted') {
                        new Notification('ReBill Reminder', { body: r.title, icon: '/favicon.ico' });
                    }
                }
            });
        }, 30000);
        return () => clearInterval(interval);
    }, [reminders]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // ─── Actions ────────────────────────────────────────────────────────────────
    const addToast = useCallback((title, message) => {
        const id = generateId();
        setToasts((prev) => [...prev, { id, title, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    }, []);

    const handleQuickAdd = () => {
        if (!quickTitle.trim()) return;
        const newReminder = createDefaultReminder({
            title: quickTitle.trim(),
            date: quickDate,
            time: quickTime,
            repeatType: quickRepeat,
            priority: quickPriority,
            category: quickCategory,
        });
        setReminders((prev) => [newReminder, ...prev]);
        setQuickTitle('');
        setQuickRepeat('once');
        setQuickPriority('medium');
        setQuickCategory('custom');
        addToast('✅ Reminder created', newReminder.title);
    };

    const handleComplete = (id) => {
        setCompletingIds((prev) => new Set(prev).add(id));
        setTimeout(() => {
            setReminders((prev) => prev.map((r) => {
                if (r.id !== id) return r;
                if (r.repeatType !== 'once') return resetRecurringReminder(r);
                return { ...r, status: 'completed' };
            }));
            setCompletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }, 500);
    };

    const handleDelete = (id) => {
        setReminders((prev) => prev.filter((r) => r.id !== id));
    };

    const handleSnooze = (id, minutes) => {
        const until = new Date(Date.now() + minutes * 60000).toISOString();
        setReminders((prev) => prev.map((r) => r.id === id ? { ...r, snoozeUntil: until, status: 'active' } : r));
        setSnoozeMenuId(null);
        addToast('😴 Snoozed', `Reminder snoozed for ${minutes} minutes`);
    };

    const handleConvertToRecurring = (id) => {
        setReminders((prev) => prev.map((r) => r.id === id ? { ...r, repeatType: 'weekly' } : r));
        addToast('🔄 Converted', 'Reminder is now weekly recurring');
    };

    const handleSaveModal = (reminder) => {
        if (editingReminder) {
            setReminders((prev) => prev.map((r) => r.id === reminder.id ? reminder : r));
        } else {
            setReminders((prev) => [reminder, ...prev]);
        }
        setShowModal(false);
        setEditingReminder(null);
    };

    const handleAcceptSuggestion = (preset) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const r = createDefaultReminder({ ...preset, date: tomorrow.toISOString().split('T')[0], time: '09:00' });
        setReminders((prev) => [r, ...prev]);
        addToast('✅ Suggestion accepted', r.title);
    };

    const handleDismissSuggestion = (sugId) => {
        setDismissedSuggestions((prev) => [...prev, sugId]);
    };

    // ─── Categorized Data ──────────────────────────────────────────────────────
    const categories = categorizeReminders(reminders);
    const suggestions = generateMockSuggestions(dismissedSuggestions);
    const activeCount = reminders.filter((r) => r.status === 'active').length;
    const overdueCount = reminders.filter((r) => isOverdue(r)).length;
    const completedTodayCount = reminders.filter((r) => {
        if (r.status !== 'completed') return false;
        const today = new Date().toISOString().split('T')[0];
        return r.date === today;
    }).length;

    const currentList = categories[activeTab] || [];

    // ─── Style Helpers ─────────────────────────────────────────────────────────
    const cardBg = isDark ? '#1B1D22' : '#FFFFFF';
    const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e4e7ec';
    const cardShadow = isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 12px rgba(16,24,40,0.06)';
    const subtleBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

    const getPriorityObj = (p) => PRIORITY_LEVELS.find((l) => l.id === p) || PRIORITY_LEVELS[1];
    const getCategoryObj = (c) => REMINDER_CATEGORIES.find((cat) => cat.id === c) || REMINDER_CATEGORIES[6];

    // ─── Action Button ─────────────────────────────────────────────────────────
    const ActionBtn = ({ icon, label, onClick, color, hoverColor }) => {
        const [hovered, setHovered] = useState(false);
        return (
            <button
                title={label}
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    borderRadius: '8px', color: hovered ? (hoverColor || t.colors.primary[500]) : (color || t.colors.text.muted),
                    backgroundColor: hovered ? subtleBg : 'transparent',
                    transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >{icon}</button>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="reminders-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>

                {/* ─── Header ────────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #FF6A00, #FF8A3D)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                            boxShadow: '0 6px 18px rgba(255,106,0,0.35)',
                        }}>{Icons.bell}</div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.colors.text.primary, margin: 0, lineHeight: 1.2 }}>
                                Smart Reminders
                            </h1>
                            <p style={{ fontSize: '0.8rem', color: t.colors.text.muted, margin: 0, marginTop: '2px' }}>
                                Your business assistant
                            </p>
                        </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {[
                            { label: 'Active', value: activeCount, color: t.colors.primary[500] },
                            { label: 'Overdue', value: overdueCount, color: '#f87171' },
                            { label: 'Done Today', value: completedTodayCount, color: '#22c55e' },
                        ].map((s) => (
                            <div key={s.label} style={{
                                textAlign: 'center', padding: '8px 16px', borderRadius: '12px',
                                background: subtleBg, border: cardBorder, minWidth: '70px',
                            }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.7rem', color: t.colors.text.muted, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => { setEditingReminder(null); setShowModal(true); }}
                            style={{
                                background: 'linear-gradient(135deg, #FF6A00, #FF8A3D)', border: 'none',
                                borderRadius: '12px', padding: '10px 18px', color: '#fff', fontWeight: 600,
                                fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 4px 12px rgba(255,106,0,0.35)',
                            }}>
                            {Icons.plus} New Reminder
                        </motion.button>
                    </div>
                </motion.div>

                {/* ─── Quick Add Panel ────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}
                    style={{
                        background: cardBg, border: cardBorder, borderRadius: '18px',
                        padding: '20px 24px', marginBottom: '20px', boxShadow: cardShadow,
                    }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <input
                                value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                                placeholder="Quick add a reminder..."
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e7ec',
                                    background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                                    color: t.colors.text.primary, fontSize: '0.95rem', outline: 'none',
                                    transition: 'border 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#FF6A00'; e.target.style.boxShadow = '0 0 0 3px rgba(255,106,0,0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e4e7ec'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div style={{ width: '160px' }}>
                            <GlobalDatePicker
                                value={quickDate}
                                onChange={setQuickDate}
                                placeholder="Date"
                                hideLabel
                                forceDown
                            />
                        </div>

                        <div style={{ width: '130px' }}>
                            <GlobalTimePicker
                                value={quickTime}
                                onChange={setQuickTime}
                                placeholder="Time"
                                hideLabel
                                forceDown
                            />
                        </div>

                        <div style={{ width: '140px' }}>
                            <GlobalSelect
                                options={REPEAT_TYPES.map(r => ({ label: r.label, value: r.id }))}
                                value={quickRepeat}
                                onChange={setQuickRepeat}
                                placeholder="Repeat"
                                hideLabel
                                direction="bottom"
                            />
                        </div>
                        {/* Priority pills */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {PRIORITY_LEVELS.map((p) => (
                                <button key={p.id} onClick={() => setQuickPriority(p.id)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        border: quickPriority === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                                        background: quickPriority === p.id ? (isDark ? p.bgDark : p.bgLight) : 'transparent',
                                        color: quickPriority === p.id ? p.color : t.colors.text.muted,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}>{p.label}</button>
                            ))}
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleQuickAdd} disabled={!quickTitle.trim()}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', border: 'none',
                                background: quickTitle.trim() ? 'linear-gradient(135deg, #FF6A00, #FF8A3D)' : subtleBg,
                                color: quickTitle.trim() ? '#fff' : t.colors.text.muted,
                                fontWeight: 600, fontSize: '0.85rem', cursor: quickTitle.trim() ? 'pointer' : 'not-allowed',
                                boxShadow: quickTitle.trim() ? '0 4px 12px rgba(255,106,0,0.3)' : 'none',
                                transition: 'all 0.2s',
                            }}>Save</motion.button>
                    </div>
                </motion.div>

                {/* ─── Smart Suggestions ──────────────────────────────────────────── */}
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}
                        style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: t.colors.text.secondary, fontSize: '0.85rem', fontWeight: 600 }}>
                                <span style={{ color: '#FF6A00' }}>{Icons.sparkle}</span> Smart Suggestions
                            </div>
                            <button onClick={() => setShowSuggestions(false)}
                                style={{ background: 'none', border: 'none', color: t.colors.text.muted, cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px' }}>
                                Hide
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {suggestions.slice(0, 3).map((sug) => (
                                <motion.div key={sug.id} className="suggestion-card" whileHover={{ translateY: -2 }}
                                    style={{
                                        position: 'relative', overflow: 'hidden', padding: '16px 20px',
                                        background: isDark ? 'rgba(255,138,61,0.05)' : 'rgba(255,138,61,0.04)',
                                        border: isDark ? '1px solid rgba(255,138,61,0.12)' : '1px solid rgba(255,138,61,0.10)',
                                        borderRadius: '16px', cursor: 'default',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{sug.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: t.colors.text.primary, marginBottom: '4px' }}>{sug.title}</div>
                                            <div style={{ fontSize: '0.78rem', color: t.colors.text.muted, lineHeight: 1.4 }}>{sug.description}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                <button onClick={() => { handleAcceptSuggestion(sug.preset); handleDismissSuggestion(sug.id); }}
                                                    style={{
                                                        padding: '5px 14px', borderRadius: '8px', border: 'none', fontSize: '0.75rem',
                                                        fontWeight: 600, background: '#FF6A00', color: '#fff', cursor: 'pointer',
                                                    }}>Create Reminder</button>
                                                <button onClick={() => handleDismissSuggestion(sug.id)}
                                                    style={{
                                                        padding: '5px 12px', borderRadius: '8px', border: 'none', fontSize: '0.75rem',
                                                        fontWeight: 500, background: subtleBg, color: t.colors.text.muted, cursor: 'pointer',
                                                    }}>Dismiss</button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ─── Category Tabs ──────────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e4e7ec', paddingBottom: '0' }}>
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const count = (categories[tab.id] || []).length;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                                    fontSize: '0.85rem', fontWeight: isActive ? 600 : 500,
                                    color: isActive ? '#FF6A00' : t.colors.text.muted,
                                    position: 'relative', borderBottom: isActive ? '2px solid #FF6A00' : '2px solid transparent',
                                    transition: 'all 0.2s', marginBottom: '-1px',
                                }}>
                                {tab.label}
                                {count > 0 && (
                                    <span style={{
                                        marginLeft: '6px', padding: '1px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                                        background: isActive ? 'rgba(255,106,0,0.15)' : subtleBg,
                                        color: isActive ? '#FF6A00' : t.colors.text.muted,
                                    }}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ─── Reminder List ──────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence mode="popLayout">
                        {currentList.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <div className="empty-state-icon" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>
                                    {activeTab === 'completed' ? '🎉' : '🔔'}
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 600, color: t.colors.text.secondary, marginBottom: '6px' }}>
                                    {activeTab === 'completed' ? 'No completed reminders yet' : 'All clear!'}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: t.colors.text.muted }}>
                                    {activeTab === 'completed' ? 'Complete reminders to see them here' : 'Use the quick add above to create a reminder'}
                                </div>
                            </motion.div>
                        ) : currentList.map((reminder, idx) => {
                            const priority = getPriorityObj(reminder.priority);
                            const category = getCategoryObj(reminder.category);
                            const overdue = isOverdue(reminder);
                            const completing = completingIds.has(reminder.id);
                            const isCompleted = reminder.status === 'completed';

                            return (
                                <motion.div key={reminder.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: completing ? 0.4 : 1, y: 0, scale: completing ? 0.98 : 1 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                                    className={`${reminder.priority === 'high' && !isCompleted ? 'reminder-priority-high' : ''} ${completing ? 'reminder-completing' : ''} card-zoom`}
                                    style={{
                                        background: cardBg, border: cardBorder, borderRadius: '16px',
                                        padding: '16px 20px', boxShadow: cardShadow,
                                        borderLeft: `3px solid ${priority.color}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'default', position: 'relative',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 30px rgba(0,0,0,0.45)' : '0 8px 24px rgba(16,24,40,0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cardShadow; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        {/* Complete button */}
                                        {!isCompleted && (
                                            <button onClick={() => handleComplete(reminder.id)}
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                                    border: `2px solid ${priority.color}`, background: 'transparent',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s', color: priority.color,
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = priority.color; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = priority.color; }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                            </button>
                                        )}
                                        {isCompleted && (
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                                background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                                            }}>
                                                {Icons.check}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '0.9rem', fontWeight: 600, color: t.colors.text.primary,
                                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                                    opacity: isCompleted ? 0.5 : 1,
                                                }}>{reminder.title}</span>
                                                {overdue && !isCompleted && (
                                                    <span className="reminder-overdue-badge" style={{
                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600,
                                                        background: 'rgba(248,113,113,0.15)', color: '#f87171',
                                                    }}>Overdue</span>
                                                )}
                                                {reminder.repeatType !== 'once' && (
                                                    <span style={{ color: t.colors.text.muted, display: 'flex', alignItems: 'center' }}>{Icons.repeat}</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.78rem', color: t.colors.text.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {Icons.clock} {formatSmartTime(reminder.date, reminder.time, reminder.repeatType)}
                                                </span>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600,
                                                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                    color: category.color,
                                                }}>{category.icon} {category.label}</span>
                                                {reminder.description && (
                                                    <span style={{ fontSize: '0.75rem', color: t.colors.text.muted, opacity: 0.7 }}>
                                                        — {reminder.description.substring(0, 50)}{reminder.description.length > 50 ? '...' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {!isCompleted && (
                                            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', position: 'relative' }}>
                                                <ActionBtn icon={Icons.edit} label="Edit" onClick={() => { setEditingReminder(reminder); setShowModal(true); }} />
                                                <div style={{ position: 'relative' }}>
                                                    <ActionBtn icon={Icons.clock} label="Snooze" onClick={() => setSnoozeMenuId(snoozeMenuId === reminder.id ? null : reminder.id)} color="#f59e0b" />
                                                    {snoozeMenuId === reminder.id && (
                                                        <div className="snooze-menu" style={{
                                                            position: 'absolute', top: '100%', right: 0, zIndex: 50,
                                                            background: cardBg, border: cardBorder, borderRadius: '12px',
                                                            padding: '6px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', minWidth: '140px',
                                                        }}>
                                                            {SNOOZE_OPTIONS.map((opt) => (
                                                                <button key={opt.minutes} onClick={() => handleSnooze(reminder.id, opt.minutes)}
                                                                    style={{
                                                                        display: 'block', width: '100%', padding: '8px 12px', borderRadius: '8px',
                                                                        border: 'none', background: 'transparent', color: t.colors.text.primary,
                                                                        fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
                                                                        transition: 'background 0.15s',
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                >{opt.label}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {reminder.repeatType === 'once' && (
                                                    <ActionBtn icon={Icons.repeat} label="Make recurring" onClick={() => handleConvertToRecurring(reminder.id)} color="#0ea5e9" />
                                                )}
                                                <ActionBtn icon={Icons.trash} label="Delete" onClick={() => handleDelete(reminder.id)} color="#ef4444" />
                                            </div>
                                        )}
                                        {isCompleted && (
                                            <ActionBtn icon={Icons.trash} label="Delete" onClick={() => handleDelete(reminder.id)} color="#ef4444" />
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── Toast Notifications ──────────────────────────────────────────── */}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div key={toast.id}
                            initial={{ opacity: 0, x: 80, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 80, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            style={{
                                background: isDark ? '#1B1D22' : '#fff', border: cardBorder, borderRadius: '14px',
                                padding: '12px 18px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                borderLeft: '3px solid #FF6A00', minWidth: '260px', maxWidth: '340px',
                            }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: t.colors.text.primary }}>{toast.title}</div>
                            {toast.message && <div style={{ fontSize: '0.78rem', color: t.colors.text.muted, marginTop: '2px' }}>{toast.message}</div>}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ─── Create / Edit Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {showModal && (
                    <ReminderModal
                        isDark={isDark} theme={t} cardBg={cardBg} cardBorder={cardBorder} subtleBg={subtleBg}
                        reminder={editingReminder}
                        onSave={handleSaveModal}
                        onClose={() => { setShowModal(false); setEditingReminder(null); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ReminderModal({ isDark, theme: t, cardBg, cardBorder, subtleBg, reminder, onSave, onClose }) {
    const isEditing = !!reminder;
    const [form, setForm] = useState(() => {
        if (reminder) return { ...reminder };
        return createDefaultReminder();
    });

    const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: '12px',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e7ec',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
        color: t.colors.text.primary, fontSize: '0.88rem', outline: 'none',
        transition: 'border 0.2s',
    };

    const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: t.colors.text.secondary, marginBottom: '6px', display: 'block' };

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: 1001, width: '90%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto',
                    background: cardBg, border: cardBorder, borderRadius: '20px',
                    padding: '28px', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: t.colors.text.primary, margin: 0 }}>
                        {isEditing ? 'Edit Reminder' : 'New Reminder'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.colors.text.muted, padding: '4px' }}>{Icons.x}</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Title */}
                    <div>
                        <label style={labelStyle}>Title *</label>
                        <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Restock Coca Cola" style={inputStyle} />
                    </div>
                    {/* Description */}
                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2}
                            placeholder="Optional notes..." style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
                    </div>
                    {/* Date + Time */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <GlobalDatePicker
                                label="Date"
                                value={form.date}
                                onChange={(val) => update('date', val)}
                                forceDown
                            />
                        </div>
                        <div>
                            <GlobalTimePicker
                                label="Time"
                                value={form.time}
                                onChange={(val) => update('time', val)}
                                forceDown
                            />
                        </div>
                    </div>
                    {/* Repeat Type */}
                    <div>
                        <GlobalSelect
                            label="Repeat"
                            options={REPEAT_TYPES.map(rt => ({ label: rt.label, value: rt.id }))}
                            value={form.repeatType}
                            onChange={(val) => update('repeatType', val)}
                            direction="bottom"
                        />
                    </div>
                    {/* Priority */}
                    <div>
                        <label style={labelStyle}>Priority</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {PRIORITY_LEVELS.map((p) => (
                                <button key={p.id} onClick={() => update('priority', p.id)}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                                        border: form.priority === p.id ? `2px solid ${p.color}` : '2px solid transparent',
                                        background: form.priority === p.id ? (isDark ? p.bgDark : p.bgLight) : subtleBg,
                                        color: form.priority === p.id ? p.color : t.colors.text.muted,
                                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                                    }}>{p.label}</button>
                            ))}
                        </div>
                    </div>
                    {/* Category */}
                    <div>
                        <label style={labelStyle}>Category</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {REMINDER_CATEGORIES.map((cat) => (
                                <button key={cat.id} onClick={() => update('category', cat.id)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 500,
                                        border: form.category === cat.id ? `1.5px solid ${cat.color}` : `1.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e4e7ec'}`,
                                        background: form.category === cat.id ? `${cat.color}15` : 'transparent',
                                        color: form.category === cat.id ? cat.color : t.colors.text.muted,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}>{cat.icon} {cat.label}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
                    <button onClick={onClose}
                        style={{
                            padding: '10px 20px', borderRadius: '12px', border: cardBorder, background: 'transparent',
                            color: t.colors.text.secondary, fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
                        }}>Cancel</button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { if (form.title.trim()) onSave(form); }}
                        disabled={!form.title.trim()}
                        style={{
                            padding: '10px 24px', borderRadius: '12px', border: 'none',
                            background: form.title.trim() ? 'linear-gradient(135deg, #FF6A00, #FF8A3D)' : subtleBg,
                            color: form.title.trim() ? '#fff' : t.colors.text.muted,
                            fontWeight: 600, fontSize: '0.85rem', cursor: form.title.trim() ? 'pointer' : 'not-allowed',
                            boxShadow: form.title.trim() ? '0 4px 12px rgba(255,106,0,0.3)' : 'none',
                        }}>{isEditing ? 'Save Changes' : 'Create Reminder'}</motion.button>
                </div>
            </motion.div>
        </>
    );
}
