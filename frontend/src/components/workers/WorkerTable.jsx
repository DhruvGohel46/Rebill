/**
 * WorkerTable — Premium worker grid list
 * Each card displays a worker in a 24px continuous curved glassmorphic card.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  IoEye,
  IoPencil,
  IoTrash,
  IoEllipsisVertical,
  IoCall,
  IoBriefcase,
  IoWalletOutline,
  IoCashOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircle,
  IoCloseCircleOutline
} from 'react-icons/io5';
import { formatCurrency } from '../../utils/api';

/* ─── Action Menu ─── */
const ActionMenu = ({
  worker,
  onView,
  onEdit,
  onDelete,
  onPermanentDelete,
  onReactivate,
  onAttendance,
  onSalaryHistory,
  onPayroll,
  open,
  setOpen
}) => {
  const { isDark } = useTheme();
  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
        whileTap={{ scale: 0.92 }}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '8px',
          color: isDark ? '#94A3B8' : '#64748B'
        }}
      >
        <IoEllipsisVertical size={16} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 4,
                zIndex: 100,
                minWidth: 185,
                background: isDark ? '#1C1D22' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #E2E8F0',
                borderRadius: 14,
                boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.6)' : '0 12px 28px rgba(0,0,0,0.1)',
                padding: 6,
                overflow: 'hidden'
              }}
            >
              <MenuItem icon={IoEye} label="View Profile" onClick={() => { onView?.(worker); setOpen(false); }} color="#FF6B1A" />
              <MenuItem icon={IoPencil} label="Edit Worker" onClick={() => { onEdit?.(worker); setOpen(false); }} color="#3B82F6" />
              <MenuItem icon={IoCalendarOutline} label="Attendance" onClick={() => { onAttendance ? onAttendance(worker) : onView?.(worker, 'attendance'); setOpen(false); }} color="#10B981" />
              <MenuItem icon={IoWalletOutline} label="Salary History" onClick={() => { onSalaryHistory ? onSalaryHistory(worker) : onView?.(worker, 'salary'); setOpen(false); }} color="#8B5CF6" />
              <MenuItem icon={IoDocumentTextOutline} label="Payroll / Advances" onClick={() => { onPayroll ? onPayroll(worker) : onView?.(worker, 'advances'); setOpen(false); }} color="#F59E0B" />
              <div
                style={{
                  height: 1,
                  margin: '6px 8px',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
                }}
              />
              {worker.status === 'inactive' ? (
                <>
                  <MenuItem icon={IoCheckmarkCircle} label="Reactivate" onClick={() => { onReactivate?.(worker); setOpen(false); }} color="#10B981" />
                  <MenuItem icon={IoTrash} label="Delete Permanently" onClick={() => { onPermanentDelete?.(worker); setOpen(false); }} color="#EF4444" />
                </>
              ) : (
                <>
                  <MenuItem icon={IoCloseCircleOutline} label="Deactivate Worker" onClick={() => { onDelete?.(worker); setOpen(false); }} color="#F59E0B" />
                  <MenuItem icon={IoTrash} label="Delete Permanently" onClick={() => { onPermanentDelete?.(worker); setOpen(false); }} color="#EF4444" />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, color }) => {
  const { isDark } = useTheme();
  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: isDark ? '#E2E8F0' : '#334155'
      }}
    >
      <Icon size={15} style={{ color, flexShrink: 0 }} />
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </motion.button>
  );
};

/* ─── Worker Card (24px Continuous Curved Design) ─── */
const WorkerCard = ({
  worker,
  onView,
  onEdit,
  onDelete,
  onPermanentDelete,
  onReactivate,
  onAttendance,
  onSalaryHistory,
  onPayroll,
  index
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={() => onView(worker)}
      className="worker-premium-card"
      style={{
        width: '100%',
        background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
        borderRadius: '24px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isDark ? '0 12px 30px -8px rgba(0, 0, 0, 0.5)' : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 107, 26, 0.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top Right Three Dot Menu */}
      <div
        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ActionMenu
          worker={worker}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onPermanentDelete={onPermanentDelete}
          onReactivate={onReactivate}
          onAttendance={onAttendance}
          onSalaryHistory={onSalaryHistory}
          onPayroll={onPayroll}
          open={menuOpen}
          setOpen={setMenuOpen}
        />
      </div>

      {/* Header Info Section */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}>
        {/* Profile Frame */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(255,107,26,0.15) 0%, rgba(234,88,12,0.25) 100%)',
            border: '1.5px solid rgba(255,107,26,0.3)',
            boxShadow: '0 4px 14px rgba(255,107,26,0.15)'
          }}
        >
          {worker.photo ? (
            <img
              src={worker.photo}
              alt={worker.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontSize: '24px',
                fontWeight: 850,
                color: '#FF6B1A'
              }}
            >
              {(worker.name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Employee Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '1.10rem',
              fontWeight: 850,
              color: isDark ? '#FFFFFF' : '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em'
            }}
          >
            {worker.name}
          </span>

          {/* Role Badge (Single-Line) */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              background: isDark ? '#1C1D22' : '#F1F5F9',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 750,
              color: isDark ? '#94A3B8' : '#64748B',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <IoBriefcase size={12} style={{ color: '#FF6B1A' }} />
            <span>{worker.role}</span>
          </div>

          {/* Phone */}
          {worker.phone && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                color: isDark ? '#64748B' : '#94A3B8',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              <IoCall size={12} style={{ opacity: 0.8 }} />
              <span>{worker.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Salary & Net Pay Mini-Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Salary */}
        <div
          style={{
            background: isDark ? '#16171B' : '#F8FAFC',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IoWalletOutline size={13} style={{ color: '#FF6B1A' }} />
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: isDark ? '#64748B' : '#94A3B8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              Base Salary
            </span>
          </div>
          <span
            style={{
              fontSize: '0.94rem',
              fontWeight: 850,
              color: isDark ? '#FFFFFF' : '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {formatCurrency(worker.salary)}
          </span>
        </div>

        {/* Net Pay */}
        <div
          style={{
            background: isDark ? '#16171B' : '#F8FAFC',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IoCashOutline size={13} style={{ color: '#10B981' }} />
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: isDark ? '#64748B' : '#94A3B8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              Net Payable
            </span>
          </div>
          <span
            style={{
              fontSize: '0.94rem',
              fontWeight: 850,
              color: isDark ? '#FFFFFF' : '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {formatCurrency(worker.salary - (worker.current_advance || 0))}
          </span>
        </div>
      </div>

      {/* Bottom Section: ID & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9'
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: isDark ? '#64748B' : '#94A3B8',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          WKR-{String(worker.worker_id).padStart(4, '0')}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(worker);
          }}
          type="button"
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1.5px solid #FF6B1A',
            borderRadius: '10px',
            color: '#FF6B1A',
            fontSize: '0.80rem',
            fontWeight: 750,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF6B1A';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#FF6B1A';
          }}
        >
          View Profile →
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Responsive Grid Container ─── */
const WorkerTable = ({
  workers,
  onView,
  onEdit,
  onDelete,
  onPermanentDelete,
  onReactivate,
  onAttendance,
  onSalaryHistory,
  onPayroll
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        padding: '4px 0 24px 0',
        width: '100%'
      }}
      className="workers-grid-layout"
    >
      {workers.map((worker, i) => (
        <WorkerCard
          key={worker.worker_id}
          worker={worker}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onPermanentDelete={onPermanentDelete}
          onReactivate={onReactivate}
          onAttendance={onAttendance}
          onSalaryHistory={onSalaryHistory}
          onPayroll={onPayroll}
          index={i}
        />
      ))}
    </div>
  );
};

export default WorkerTable;
