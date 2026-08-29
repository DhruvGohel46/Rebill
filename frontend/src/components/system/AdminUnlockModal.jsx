import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAuthStatus } from '../../api/auth';
import { IoLockClosed, IoClose, IoBackspaceOutline, IoCheckmark } from 'react-icons/io5';

const PinDots = ({ length, filled, shake, isDark }) => (
  <motion.div
    style={{
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '12px 20px',
      borderRadius: '16px',
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#F8FAFC',
      border: isDark ? '1px solid #282B33' : '1px solid #E2E8F0',
      margin: '18px 0 20px',
    }}
    animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
    transition={{ duration: 0.4 }}
  >
    {[...Array(length)].map((_, i) => {
      const isFilled = i < filled;
      return (
        <motion.div
          key={i}
          animate={{
            scale: isFilled ? 1.15 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: isFilled
              ? '1.5px solid #FF8A00'
              : isDark
              ? '1.5px solid rgba(255, 255, 255, 0.2)'
              : '1.5px solid #CBD5E1',
            background: isFilled
              ? 'linear-gradient(135deg, #FF8A00, #FF6500)'
              : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : '#E2E8F0',
            boxShadow: isFilled ? '0 0 12px rgba(255, 122, 0, 0.45)' : 'none',
            transition: 'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
          }}
        />
      );
    })}
  </motion.div>
);

const Numpad = ({ onKey, onDelete, onSubmit, canSubmit, isLoading, isDark }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const getNumberBtnStyle = () => ({
    height: 54,
    borderRadius: 16,
    border: isDark ? '1px solid #2C2F36' : '1.5px solid #CBD5E1',
    background: isDark ? '#1E2127' : '#FFFFFF',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: isDark ? '0 2px 6px rgba(0,0,0,0.25)' : '0 2px 5px rgba(15, 23, 42, 0.04)',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {keys.map((n) => (
        <motion.button
          key={n}
          whileHover={{ y: -1, background: isDark ? '#262A32' : '#F8FAFC', borderColor: isDark ? '#3E434E' : '#94A3B8' }}
          whileTap={{ scale: 0.93 }}
          onClick={() => onKey(n.toString())}
          disabled={isLoading}
          style={getNumberBtnStyle()}
        >
          {n}
        </motion.button>
      ))}

      {/* Delete / Backspace Button */}
      <motion.button
        whileHover={{
          y: -1,
          background: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
          borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
        }}
        whileTap={{ scale: 0.93 }}
        onClick={onDelete}
        disabled={isLoading}
        style={{
          height: 54,
          borderRadius: 16,
          border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1.5px solid #FECACA',
          background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
          color: isDark ? '#F87171' : '#EF4444',
          fontSize: 20,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 5px rgba(15, 23, 42, 0.03)',
          transition: 'all 0.15s ease',
        }}
        aria-label="Delete"
      >
        <IoBackspaceOutline size={22} />
      </motion.button>

      {/* Digit 0 */}
      <motion.button
        whileHover={{ y: -1, background: isDark ? '#262A32' : '#F8FAFC', borderColor: isDark ? '#3E434E' : '#94A3B8' }}
        whileTap={{ scale: 0.93 }}
        onClick={() => onKey('0')}
        disabled={isLoading}
        style={getNumberBtnStyle()}
        aria-label="Digit 0"
      >
        0
      </motion.button>

      {/* Submit / Unlock Button */}
      <motion.button
        whileHover={canSubmit ? { y: -1, filter: 'brightness(1.08)' } : {}}
        whileTap={canSubmit ? { scale: 0.93 } : {}}
        onClick={onSubmit}
        disabled={!canSubmit || isLoading}
        style={{
          height: 54,
          borderRadius: 16,
          border: canSubmit
            ? '1.5px solid #FF8A00'
            : isDark
            ? '1px solid #23262D'
            : '1.5px solid #E2E8F0',
          background: canSubmit
            ? 'linear-gradient(135deg, #FF8A00, #FF6500)'
            : isDark
            ? '#181A1F'
            : '#F1F5F9',
          color: canSubmit
            ? '#FFFFFF'
            : isDark
            ? '#4B5563'
            : '#94A3B8',
          fontSize: 20,
          fontWeight: 800,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: canSubmit ? '0 4px 14px rgba(255, 122, 0, 0.4)' : 'none',
          transition: 'all 0.15s ease',
        }}
        aria-label="Unlock"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%' }}
          />
        ) : (
          <IoCheckmark size={24} style={{ opacity: canSubmit ? 1 : 0.4 }} />
        )}
      </motion.button>
    </div>
  );
};

export default function AdminUnlockModal() {
  const { isUnlockOpen, closeUnlock, unlockAdminWithPin, pendingPath } = useAuth();
  const { isDark } = useTheme();
  const { showError, showSuccess } = useAlert();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinLength, setPinLength] = useState(4); // Default to 4, will be updated from status
  const submitRef = useRef(null);

  // Fetch actual PIN length when modal opens
  useEffect(() => {
    if (isUnlockOpen) {
      getAuthStatus().then(status => {
        if (status.pin_length) {
          setPinLength(status.pin_length);
        }
      }).catch(err => console.error('Failed to fetch PIN length:', err));
    }
  }, [isUnlockOpen]);

  const canSubmit = useMemo(() => pin.length >= pinLength, [pin.length, pinLength]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }, []);

  const handleKey = useCallback((digit) => {
    setPin((p) => (p.length < pinLength ? p + digit : p));
  }, [pinLength]);

  const handleDelete = useCallback(() => {
    setPin((p) => p.slice(0, -1));
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setPin('');
    closeUnlock();
  }, [closeUnlock, isLoading]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      showError(`PIN must be ${pinLength} digits`);
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      const res = await unlockAdminWithPin(pin);
      if (res.success) {
        showSuccess('Admin unlocked');
        setPin('');
        setIsLoading(false);
        return;
      }
      showError('Incorrect PIN');
      triggerShake();
      setPin('');
      setIsLoading(false);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Unlock failed';
      showError(msg);
      triggerShake();
      setPin('');
      setIsLoading(false);
    }
  }, [canSubmit, pin, pinLength, showError, showSuccess, triggerShake, unlockAdminWithPin]);

  submitRef.current = handleSubmit;

  // Auto-submit when PIN length matches
  useEffect(() => {
    if (pin.length === pinLength) {
      const t = setTimeout(() => submitRef.current?.(), 200);
      return () => clearTimeout(t);
    }
  }, [pin, pinLength]);

  // Keyboard support while modal open
  useEffect(() => {
    if (!isUnlockOpen) return;
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Enter') submitRef.current?.();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose, handleDelete, handleKey, isUnlockOpen]);

  return (
    <AnimatePresence>
      {isUnlockOpen && (
        <motion.div
          key="admin-unlock-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: 18,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 'min(390px, 92vw)',
              borderRadius: 24,
              border: isDark ? '1px solid #2C2F36' : '1px solid #CBD5E1',
              background: isDark ? '#16181D' : '#FFFFFF',
              boxShadow: isDark
                ? '0 24px 60px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                : '0 20px 50px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(203, 213, 225, 0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 22px 16px',
              borderBottom: isDark ? '1px solid #23262D' : '1px solid #E2E8F0',
              background: isDark ? '#1A1D23' : '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #FF8A00, #FF6500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    <IoLockClosed size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      Owner Access Required
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {pendingPath ? `Unlock to open ${pendingPath}` : 'Enter Owner PIN to switch role'}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, background: isDark ? '#2E323D' : '#E2E8F0' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: isDark ? '1px solid #323640' : '1.5px solid #CBD5E1',
                    background: isDark ? '#22252C' : '#FFFFFF',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(15, 23, 42, 0.05)',
                  }}
                  aria-label="Close"
                >
                  <IoClose size={18} />
                </motion.button>
              </div>
            </div>

            {/* Content / Numpad Area */}
            <div style={{ padding: '18px 22px 22px' }}>
              <PinDots length={pinLength} filled={pin.length} shake={shake} isDark={isDark} />
              <Numpad
                onKey={handleKey}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
                canSubmit={canSubmit}
                isLoading={isLoading}
                isDark={isDark}
              />
              <div style={{
                marginTop: 16,
                fontSize: 12,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                Tip: Press <kbd style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: isDark ? '#22252C' : '#E2E8F0',
                  border: isDark ? '1px solid #323640' : '1px solid #CBD5E1',
                  color: 'var(--text-secondary)'
                }}>Esc</kbd> to close • Type PIN on keyboard
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

