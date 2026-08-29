import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';
import { FiX, FiCalendar, FiCreditCard, FiAlignLeft, FiEdit2, FiTrash2, FiUser, FiTag, FiDollarSign } from 'react-icons/fi';

export default function ExpenseDetailsModal({ expense, onClose, onEdit, onDelete }) {
  const { isDark } = useTheme();
  if (!expense) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', padding: '16px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        style={{
          width: '100%', maxWidth: '520px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: '24px',
          background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 40px -10px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
          zIndex: 1001,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: isDark ? 'linear-gradient(to right, rgba(255, 107, 26, 0.08), transparent)' : 'linear-gradient(to right, #FFF7ED, #FFFFFF)'
        }}>
          <div>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '999px',
              background: 'rgba(255, 107, 26, 0.15)', color: '#FF6B1A',
              fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: '8px'
            }}>
              <FiTag size={12} /> {expense.category}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '850', color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em' }}>
              {expense.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#94A3B8' : '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Main Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', 
                background: isDark ? '#16171B' : '#F1F5F9', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: isDark ? '#94A3B8' : '#64748B' 
              }}>
                <FiCalendar size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Date</div>
                <div style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: '700', fontSize: '0.92rem' }}>{formatDate(expense.date)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', 
                background: isDark ? '#16171B' : '#F1F5F9', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: isDark ? '#94A3B8' : '#64748B' 
              }}>
                <FiCreditCard size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Payment Method</div>
                <div style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: '700', fontSize: '0.92rem' }}>{expense.payment_method || 'Cash'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', 
                background: isDark ? '#16171B' : '#F1F5F9', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: isDark ? '#94A3B8' : '#64748B' 
              }}>
                <FiUser size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Linked Worker</div>
                <div style={{ color: expense.worker_name ? '#FF6B1A' : isDark ? '#64748B' : '#94A3B8', fontWeight: '700', fontSize: '0.92rem' }}>
                  {expense.worker_name || 'None linked'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '10px', 
                background: 'rgba(255, 107, 26, 0.1)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', color: '#FF6B1A' 
              }}>
                <FiDollarSign size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: isDark ? '#64748B' : '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Total Amount</div>
                <div style={{ color: '#FF6B1A', fontSize: '1.2rem', fontWeight: '900' }}>{formatCurrency(expense.amount)}</div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div style={{ 
            padding: '16px',
            background: isDark ? '#16171B' : '#F8FAFC',
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              <FiAlignLeft /> Notes & Remarks
            </div>
            <div style={{ color: isDark ? '#E2E8F0' : '#334155', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
              {expense.notes || 'No notes provided for this expense.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #F1F5F9',
          background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: '750',
                fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <FiEdit2 size={14} /> Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '750',
                fontSize: '0.84rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <FiTrash2 size={14} /> Delete
            </button>
          </div>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
              background: 'transparent',
              color: isDark ? '#94A3B8' : '#64748B',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
