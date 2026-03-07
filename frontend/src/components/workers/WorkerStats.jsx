/**
 * WorkerStats — Single compact info bar replacing 5 separate cards
 * Shows key metrics in a single horizontal strip
 */
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';

const Dot = ({ color }) => (
    <span style={{
        width: 'calc(6px * var(--display-zoom))', height: 'calc(6px * var(--display-zoom))', borderRadius: '50%',
        background: color, display: 'inline-block', flexShrink: 0
    }} />
);

const WorkerStats = ({ stats }) => {
    const { isDark } = useTheme();

    const items = [
        { label: 'Workers', value: stats.totalWorkers || 0, color: '#3B82F6' },
        { label: 'Active', value: stats.activeWorkers || 0, color: '#10B981' },
        { label: 'Present', value: stats.presentToday || 0, color: '#F97316' },
        { label: 'Salary', value: formatCurrency(stats.totalSalary || 0), color: '#8B5CF6' },
        { label: 'Net Pay', value: formatCurrency(stats.netPayable || 0), color: '#EF4444' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: '0 calc(8px * var(--display-zoom))',
                height: 'calc(42px * var(--display-zoom))',
                transition: 'all 0.3s ease',
                width: '100%',
                /* Integrated styles: blend into main card */
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            }}
        >
            {items.map((item, i) => (
                <React.Fragment key={item.label}>
                    {i > 0 && (
                        <div style={{
                            width: 1,
                            height: 'calc(20px * var(--display-zoom))',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                            flexShrink: 0,
                        }} />
                    )}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'calc(8px * var(--display-zoom))',
                        padding: '0 calc(12px * var(--display-zoom))',
                        minWidth: 0,
                    }}>
                        <Dot color={item.color} />
                        <span style={{
                            fontSize: 'calc(12px * var(--text-scale))',
                            fontWeight: 500,
                            color: isDark ? '#71717A' : '#6B7280',
                            whiteSpace: 'nowrap',
                        }}>
                            {item.label}
                        </span>
                        <span style={{
                            fontSize: 'calc(13px * var(--text-scale))',
                            fontWeight: 600,
                            color: isDark ? '#FAFAFA' : '#111827',
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {item.value}
                        </span>
                    </div>
                </React.Fragment>
            ))}
        </motion.div>
    );
};

export default WorkerStats;
