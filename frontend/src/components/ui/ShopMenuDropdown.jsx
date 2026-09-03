import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * ShopMenuDropdown
 * ─────────────────────────────────────────────────────────────────────────────
 * Fused Folder-Tab Dropdown with Unified Outer Shadow:
 *  • Unified Drop-Shadow: Filter drop-shadow applied to the composite alpha mask
 *    of the open button tab, curvy fillet, and panel, casting one continuous
 *    shadow around the entire outer perimeter (including the open button in the header).
 *  • Zero Internal Dividing Lines: Transparent overlap with identical solid colors.
 *  • Clean Gap Below Header: Panel roof positioned at top: 63px (10px lower).
 *  • Completely Borderless: No outlines on button, curve, or panel.
 *  • App Theme Orange: Vibrant orange on active routes, glowing active dots, and label.
 *  • Naked Icons & Borderless Logo: Professional, sleek aesthetics.
 */

const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();

const ShopMenuDropdown = ({ navItems = [], onNavigate }) => {
    const { isDark } = useTheme();
    const { settings } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);
    const [tabWidth, setTabWidth] = useState(78);

    const shopName = settings?.shop_name || 'InfoOS POS';
    const logoUrl = settings?.logo_url || null;
    const initials = getInitials(shopName);

    // Measure exact button width so the curvy edge connects at the exact pixel
    useLayoutEffect(() => {
        if (buttonRef.current) {
            setTabWidth(buttonRef.current.offsetWidth);
        }
    }, [open, logoUrl, initials]);

    // Outside-click listener
    const handleOutsideClick = useCallback((e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
            setOpen(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [open, handleOutsideClick]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Navigation handler
    const handleNav = (item) => {
        setOpen(false);
        if (typeof onNavigate === 'function') onNavigate(item);
        else navigate(item.path);
    };

    const isItemActive = (item) =>
        location.pathname === item.path ||
        (item.path !== '/' && location.pathname.startsWith(item.path));

    // Solid surface background — strictly identical across button, eraser, fillet, and panel
    const surfaceBg = isDark ? '#141720' : '#FFFFFF';

    // Unified drop-shadow tracing the outer perimeter of the entire fused shape (including the open button)
    const fusedDropShadow = isDark
        ? 'drop-shadow(0 24px 48px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 18px rgba(249, 115, 22, 0.20))'
        : 'drop-shadow(0 18px 36px rgba(15, 23, 42, 0.16)) drop-shadow(0 2px 8px rgba(15, 23, 42, 0.08))';

    return (
        <div
            ref={wrapperRef}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'flex-start',
                flexShrink: 0,
                zIndex: 200,
                width: `${tabWidth}px`,
                height: '40px', // Keeps header row height and layout completely fixed
            }}
        >
            {/* ── CLOSED STATE: TRIGGER BUTTON ─────────────────────────── */}
            {!open && (
                <button
                    ref={buttonRef}
                    id="shop-menu-tab-btn"
                    onClick={() => setOpen(true)}
                    title={shopName}
                    style={{
                        height: '40px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxSizing: 'border-box',
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderRadius: '12px',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'background 0.15s ease',
                    }}
                    aria-expanded={false}
                    aria-haspopup="true"
                >
                    {/* Menu Symbol */}
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#F1F5F9' : '#1E293B',
                        flexShrink: 0,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="6" x2="20" y2="6" />
                            <line x1="4" y1="12" x2="15" y2="12" />
                            <line x1="4" y1="18" x2="20" y2="18" />
                        </svg>
                    </span>

                    {/* Borderless Logo / Initials */}
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={shopName}
                            style={{
                                width: '29px',
                                height: '29px',
                                borderRadius: '7px',
                                objectFit: 'cover',
                                display: 'block',
                                border: 'none',
                            }}
                        />
                    ) : (
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            userSelect: 'none',
                            lineHeight: 1,
                        }}>
                            {initials}
                        </span>
                    )}
                </button>
            )}

            {/* ── OPEN STATE: FUSED COMPOSITE SHAPE WITH UNIFIED SHADOW ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 200,
                            // Projects unified shadow around button tab, curvy arc, and panel:
                            filter: fusedDropShadow,
                            pointerEvents: 'auto',
                        }}
                    >
                        {/* 1. Open Button Tab Lid (in Header) */}
                        <div
                            id="shop-menu-tab-btn"
                            onClick={() => setOpen(false)}
                            title="Close Menu"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${tabWidth}px`,
                                height: '64px',
                                padding: '0 12px',
                                paddingBottom: '24px', // Keeps icon/logo aligned in upper 40px
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                                background: surfaceBg,
                                borderRadius: '14px 14px 0 0',
                                border: 'none',
                                outline: 'none',
                                zIndex: 10,
                                userSelect: 'none',
                            }}
                        >
                            {/* Close Symbol X with Theme Glow */}
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary-500)',
                                filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))',
                                flexShrink: 0,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </span>

                            {/* Borderless Logo / Initials */}
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={shopName}
                                    style={{
                                        width: '29px',
                                        height: '29px',
                                        borderRadius: '7px',
                                        objectFit: 'cover',
                                        display: 'block',
                                        border: 'none',
                                    }}
                                />
                            ) : (
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: 'var(--primary-500)',
                                    userSelect: 'none',
                                    lineHeight: 1,
                                }}>
                                    {initials}
                                </span>
                            )}
                        </div>

                        {/* 2. Seam Eraser (Zero Dividing Line) */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '62px',
                                left: 0,
                                width: `${tabWidth}px`,
                                height: '4px',
                                background: surfaceBg,
                                zIndex: 9,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* 3. Curvy Fillet Arc (Bridges Button into Panel Roof) */}
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            style={{
                                position: 'absolute',
                                left: `${tabWidth - 1}px`,
                                top: '47px', // 63px - 16px = 47px
                                zIndex: 11,
                                pointerEvents: 'none',
                            }}
                        >
                            <path
                                d="M 0,0 A 16,16 0 0,0 16,16 L 0,16 Z"
                                fill={surfaceBg}
                            />
                        </svg>

                        {/* 4. Dropdown Panel Body */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '63px',
                                left: 0,
                                minWidth: '256px',
                                maxWidth: '304px',
                                zIndex: 8,
                                borderRadius: '0 16px 16px 16px',
                                background: surfaceBg,
                                border: 'none',
                                outline: 'none',
                                maxHeight: 'min(640px, calc(100vh - 85px))',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDark ? 'rgba(249,115,22,0.3) transparent' : 'rgba(0,0,0,0.12) transparent',
                            }}
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div style={{ padding: '8px' }}>
                                {/* Shop Header Row with App Theme Orange */}
                                <div style={{
                                    padding: '6px 10px 10px',
                                    marginBottom: '4px',
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}>
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={shopName}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                flexShrink: 0,
                                                border: 'none',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            background: isDark ? 'rgba(249, 115, 22, 0.16)' : '#FFF7ED',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '13px',
                                            fontWeight: 800,
                                            color: 'var(--primary-500)',
                                            flexShrink: 0,
                                        }}>
                                            {initials}
                                        </div>
                                    )}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--primary-500)', // App Theme Orange
                                            lineHeight: 1.2,
                                        }}>
                                            Navigation
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            letterSpacing: '-0.01em',
                                        }}>
                                            {shopName}
                                        </div>
                                    </div>
                                </div>

                                {/* Nav Items List (Clean Naked Icons with App Theme Orange Accents) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {navItems.map((item, idx) => (
                                        <NavRow
                                            key={item.id}
                                            item={item}
                                            index={idx}
                                            active={isItemActive(item)}
                                            isDark={isDark}
                                            onClick={() => handleNav(item)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── NavRow (CLEAN NAKED ICONS WITH APP THEME ORANGE ACCENTS) ────────────────

const NavRow = ({ item, active, isDark, onClick }) => {
    return (
        <motion.button
            role="menuitem"
            onClick={onClick}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                border: active
                    ? (isDark ? '1px solid rgba(249, 115, 22, 0.45)' : '1px solid #FF8A00')
                    : '1px solid transparent',
                background: active
                    ? (isDark
                        ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(249, 115, 22, 0.08) 100%)'
                        : '#FFF7ED')
                    : 'transparent',
                color: active
                    ? 'var(--primary-500)'
                    : (isDark ? 'var(--text-secondary)' : '#334155'),
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: active ? 650 : 500,
                boxSizing: 'border-box',
                position: 'relative',
                transition: 'background 0.15s ease, color 0.15s ease, border 0.15s ease',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';
                    e.currentTarget.style.color = isDark ? 'var(--text-primary)' : '#0F172A';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDark ? 'var(--text-secondary)' : '#334155';
                }
            }}
        >
            {/* Clean Naked Icon (NO box edges, NO background tiles) */}
            <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                flexShrink: 0,
                color: active ? 'var(--primary-500)' : (isDark ? 'var(--text-secondary)' : '#475569'),
                transition: 'color 0.15s ease',
                lineHeight: 1,
            }}>
                {item.icon}
            </span>

            {/* Label */}
            <span style={{ whiteSpace: 'nowrap', flex: 1, letterSpacing: '-0.01em' }}>
                {item.label}
            </span>

            {/* Lock indicator for admin-protected items in worker mode */}
            {item.isLocked && (
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        opacity: 0.4,
                        flexShrink: 0,
                        marginLeft: active ? '0' : 'auto',
                    }}
                    title="Admin PIN required"
                >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            )}

            {/* Glowing Theme Orange Active Dot */}
            {active && (
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary-500)',
                    boxShadow: '0 0 8px rgba(249, 115, 22, 0.7)',
                    flexShrink: 0,
                    marginLeft: item.isLocked ? '6px' : 'auto',
                }} />
            )}
        </motion.button>
    );
};

export default ShopMenuDropdown;
