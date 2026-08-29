import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlobalSelect, GlobalDatePicker } from '../ui';
import { formatCurrency } from '../../utils/api';
import { workerAPI } from '../../api/workers';
import { expensesAPI } from '../../api/expenses';
import { useTheme } from '../../context/ThemeContext';
import { FiX, FiInfo, FiDollarSign, FiTag, FiUser, FiCreditCard, FiCalendar, FiMessageSquare } from 'react-icons/fi';

export default function ExpenseFormModal({ onClose, onSubmit, initialData = null }) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Other',
    amount: '',
    payment_method: 'Cash',
    worker_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [workers, setWorkers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);

  useEffect(() => {
    fetchWorkers();
    fetchExpenseTypes();
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Other',
        amount: initialData.amount || '',
        payment_method: initialData.payment_method || 'Cash',
        worker_id: initialData.worker_id || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const fetchWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const res = await workerAPI.getWorkers();
      if (Array.isArray(res)) {
        setWorkers(res.map(w => ({ value: w.worker_id, label: w.name })));
      }
    } catch (e) {
      console.error('Failed to fetch workers', e);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      setLoadingExpenseTypes(true);
      const res = await expensesAPI.getExpenseTypes();
      const types = res.expense_types || [];
      setExpenseTypes(types);
    } catch (e) {
      console.error('Failed to fetch expense types', e);
    } finally {
      setLoadingExpenseTypes(false);
    }
  };

  const categoryOptions = expenseTypes.length > 0 
    ? expenseTypes
        .filter(t => t.is_active || (initialData && t.name === initialData.category))
        .map(t => ({ value: t.name, label: t.name }))
    : [
        { value: 'Salary', label: 'Salary' },
        { value: 'Utilities', label: 'Utilities' },
        { value: 'Rent', label: 'Rent' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Supplies', label: 'Supplies' },
        { value: 'Equipment', label: 'Equipment' },
        { value: 'Transport', label: 'Transport' },
        { value: 'Other', label: 'Other' }
      ];

  const paymentOptions = [
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(formData.amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: Number(formData.amount),
        worker_id: formData.worker_id || null
      });
    } finally {
      setIsSubmitting(false);
    }
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
          width: '100%', maxWidth: '540px', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: '24px',
          background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 40px -10px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
          zIndex: 1001,
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: isDark ? 'linear-gradient(to right, rgba(255, 107, 26, 0.08), transparent)' : 'linear-gradient(to right, #FFF7ED, #FFFFFF)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #F1F5F9'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '850', color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '-0.02em' }}>
              {initialData ? 'Edit Expense' : 'Record New Expense'}
            </h2>
            <p style={{ margin: '3px 0 0 0', color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.82rem', fontWeight: 500 }}>
              Track operational costs, vendor utility charges, and payouts
            </p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Title Section */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                <FiInfo size={13} style={{ color: '#FF6B1A' }} />
                Expense Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. March Electricity Bill, Shop Maintenance, Cleaning Supplies"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: isDark ? '#16171B' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                  borderRadius: '12px', color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.90rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Category */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                  <FiTag size={13} style={{ color: '#FF6B1A' }} />
                  Category
                </label>
                <GlobalSelect
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(val) => handleInputChange({ target: { name: 'category', value: val } })}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                  <FiDollarSign size={13} style={{ color: '#FF6B1A' }} />
                  Amount (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FF6B1A', fontWeight: '800' }}>₹</span>
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 26px',
                      background: isDark ? '#16171B' : '#F8FAFC',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                      borderRadius: '12px', color: isDark ? '#FFFFFF' : '#0F172A',
                      fontSize: '0.92rem', fontWeight: '800', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Worker Selection */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                  <FiUser size={13} style={{ color: '#FF6B1A' }} />
                  Link to Worker (Optional)
                </label>
                <GlobalSelect
                  options={[{ value: '', label: 'None' }, ...workers]}
                  value={formData.worker_id}
                  placeholder={loadingWorkers ? 'Loading...' : 'Select worker'}
                  onChange={(val) => handleInputChange({ target: { name: 'worker_id', value: val } })}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                  <FiCreditCard size={13} style={{ color: '#FF6B1A' }} />
                  Payment Method
                </label>
                <GlobalSelect
                  options={paymentOptions}
                  value={formData.payment_method}
                  onChange={(val) => handleInputChange({ target: { name: 'payment_method', value: val } })}
                />
              </div>

              {/* Date Selection */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                  <FiCalendar size={13} style={{ color: '#FF6B1A' }} />
                  Expense Date
                </label>
                <GlobalDatePicker
                  value={formData.date}
                  onChange={(val) => handleInputChange({ target: { name: 'date', value: val } })}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#94A3B8' : '#64748B', marginBottom: '6px' }}>
                <FiMessageSquare size={13} style={{ color: '#FF6B1A' }} />
                Notes / Remarks
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add receipt reference, vendor remarks, or additional context..."
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: isDark ? '#16171B' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                  borderRadius: '12px', color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '0.86rem', outline: 'none', transition: 'all 0.2s', resize: 'none'
                }}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #F1F5F9',
            background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#F8FAFC',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '0.80rem', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Total Amount
              </span>
              <strong style={{ color: '#FF6B1A', fontSize: '1.45rem', fontWeight: '850', letterSpacing: '-0.02em' }}>
                {formatCurrency(Number(formData.amount) || 0)}
              </strong>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={onClose}
                style={{
                  padding: '9px 20px',
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
                disabled={isSubmitting || !formData.title || Number(formData.amount) <= 0}
                style={{
                  padding: '9px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  boxShadow: '0 4px 14px rgba(255, 107, 26, 0.3)',
                  cursor: isSubmitting || !formData.title || Number(formData.amount) <= 0 ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !formData.title || Number(formData.amount) <= 0 ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
