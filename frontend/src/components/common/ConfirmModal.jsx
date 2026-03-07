/**
 * ConfirmModal — Premium confirmation dialog for destructive actions
 */
import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// ─── Default Icons ───
const TrashIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const AlertTriangleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const InfoCircleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const DEFAULT_ICONS = {
    danger: TrashIcon,
    warning: AlertTriangleIcon,
    primary: InfoCircleIcon,
    info: InfoCircleIcon,
};

const ConfirmModal = ({
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'danger',
    icon: CustomIcon,
    onConfirm,
    onCancel,
}) => {
    const Icon = CustomIcon || DEFAULT_ICONS[variant] || TrashIcon;

    // Keyboard: Enter = confirm, Escape = cancel
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            onConfirm();
        }
    }, [onCancel, onConfirm]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Map variant to button class
    const btnVariantClass = `rb-confirm__btn--${variant}`;
    const iconVariantClass = variant === 'danger' || variant === 'primary'
        ? `rb-confirm__icon--${variant}`
        : `rb-confirm__icon--${variant}`;

    return (
        <motion.div
            className="rb-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}
        >
            <motion.div
                className="rb-confirm-card liquid-glass-card"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '90%',
                    maxWidth: '440px',
                    padding: 'var(--spacing-8)',
                    borderRadius: '20px',
                    background: 'rgba(22, 26, 32, 0.8)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: variant === 'danger' ? '1px solid rgba(239, 68, 68, 0.2)' : 
                           variant === 'warning' ? '1px solid rgba(245, 158, 11, 0.2)' :
                           variant === 'primary' ? '1px solid rgba(255, 106, 0, 0.2)' :
                           '1px solid rgba(14, 165, 233, 0.2)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                }}
            >
                {/* Icon + Title Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-4)',
                    marginBottom: 'var(--spacing-5)'
                }}>
                    <div className={`rb-confirm__icon ${iconVariantClass}`} style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: variant === 'danger' ? 'rgba(239, 68, 68, 0.12)' :
                                  variant === 'warning' ? 'rgba(245, 158, 11, 0.12)' :
                                  variant === 'primary' ? 'rgba(255, 106, 0, 0.12)' :
                                  'rgba(14, 165, 233, 0.12)',
                        color: variant === 'danger' ? 'var(--error-500)' :
                               variant === 'warning' ? 'var(--warning-500)' :
                               variant === 'primary' ? 'var(--primary-500)' :
                               'var(--info-500)',
                        flexShrink: 0
                    }}>
                        <Icon />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="rb-confirm__title" style={{
                            margin: 0,
                            color: 'var(--text-primary)',
                            fontSize: 'var(--text-xl)',
                            fontWeight: 'var(--font-semibold)',
                            letterSpacing: '0.2px',
                            lineHeight: '1.3'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: 'var(--spacing-1) 0 0 0',
                            color: 'var(--text-tertiary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-medium)'
                        }}>
                            {variant === 'danger' ? 'Destructive action' :
                             variant === 'warning' ? 'Please confirm' :
                             variant === 'primary' ? 'Action required' :
                             'Information'}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <p className="rb-confirm__description" style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-base)',
                        lineHeight: '1.6',
                        margin: '0 0 var(--spacing-6) 0',
                        fontWeight: 'var(--font-normal)'
                    }}>
                        {description}
                    </p>
                )}

                {/* Actions */}
                <div className="rb-confirm__actions" style={{
                    display: 'flex',
                    gap: 'var(--spacing-3)',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        className="rb-confirm__btn rb-confirm__btn--cancel"
                        onClick={onCancel}
                        style={{
                            padding: 'var(--spacing-3) var(--spacing-5)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-medium)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--glass-card)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-normal) var(--ease-out)'
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={`rb-confirm__btn ${btnVariantClass}`}
                        onClick={onConfirm}
                        autoFocus
                        style={{
                            padding: 'var(--spacing-3) var(--spacing-5)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-semibold)',
                            borderRadius: 'var(--radius-lg)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all var(--transition-normal) var(--ease-out)',
                            background: variant === 'danger' ? 'var(--error-500)' :
                                      variant === 'warning' ? 'var(--warning-500)' :
                                      variant === 'primary' ? 'var(--primary-500)' :
                                      'var(--info-500)',
                            color: 'white',
                            boxShadow: variant === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.25)' :
                                     variant === 'warning' ? '0 4px 12px rgba(245, 158, 11, 0.25)' :
                                     variant === 'primary' ? '0 4px 12px rgba(255, 106, 0, 0.25)' :
                                     '0 4px 12px rgba(14, 165, 233, 0.25)'
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ConfirmModal;
