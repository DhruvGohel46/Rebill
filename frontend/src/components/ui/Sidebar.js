import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

const Sidebar = ({
    isCollapsed,
    toggleCollapse,
    navItems = []
}) => {
    const { currentTheme, isDark } = useTheme();
    const { settings } = useSettings();
    const location = useLocation();
    const navigate = useNavigate();
    const restaurantName = settings?.shop_name || 'ReBill POS';

    // Generate acronym
    const getAcronym = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const acronym = getAcronym(restaurantName);

    const sidebarVariants = {
        expanded: { width: '260px' },
        collapsed: { width: '80px' }
    };

    const [lastTap, setLastTap] = React.useState(0);

    const handleDoubleTap = (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            toggleCollapse();
            e.preventDefault();
        }
        setLastTap(currentTime);
    };

    return (
        <motion.div
            initial={isCollapsed ? 'collapsed' : 'expanded'}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onDoubleClick={toggleCollapse}
            onTouchEnd={handleDoubleTap}
            className="glass-sidebar"
            style={{
                height: '100%',
                backgroundImage: 'radial-gradient(circle at 0% 50%, rgba(249,115,22,0.05), transparent 60%)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                flexShrink: 0,
                userSelect: 'none',
                position: 'relative',
                borderRadius: '0 var(--radius-sidebar) var(--radius-sidebar) 0',
                margin: 'var(--spacing-2) 0',
            }}
        >
            {/* Header / Logo Area */}
            <div style={{
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0' : '0 var(--spacing-6)',
                marginBottom: 'var(--spacing-2)'
            }}>
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="full-logo"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                fontSize: 'var(--text-xl)',
                                fontWeight: 'var(--font-semibold)',
                                letterSpacing: '0.3px',
                                color: 'var(--primary-500)',
                                cursor: 'default'
                            }}
                            whileHover={{ filter: 'brightness(1.1)' }}
                        >
                            {restaurantName}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="acronym-logo"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                fontSize: 'var(--text-xl)',
                                fontWeight: 'var(--font-semibold)',
                                color: 'var(--primary-500)',
                            }}
                        >
                            {acronym}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Items */}
            <div style={{
                flex: 1,
                padding: '0 var(--spacing-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-2)',
                overflowY: 'auto',
            }}>
                {navItems.map((item) => {
                    // Route-based active detection
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <motion.div
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            title={isCollapsed ? item.label : ''}
                            initial={false}
                            animate={{
                                backgroundColor: isActive ? 'var(--primary-500)' : 'transparent',
                                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                boxShadow: isActive
                                    ? 'var(--shadow-button)'
                                    : 'none',
                            }}
                            whileHover={!isActive ? {
                                x: 3,
                                backgroundColor: 'var(--glass-card)',
                                color: 'var(--text-primary)',
                                transition: { duration: 0.16 }
                            } : {
                                x: 3,
                                transition: { duration: 0.16 }
                            }}
                            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                width: '100%',
                                padding: 'var(--spacing-3) var(--spacing-4)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all var(--transition-normal) var(--ease-out)',
                                backdropFilter: 'var(--glass-blur)',
                                WebkitBackdropFilter: 'var(--glass-blur)',
                                border: '1px solid var(--glass-border)',
                            }}
                        >
                            {/* Icon Wrapper */}
                            <motion.span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    marginRight: isCollapsed ? 0 : 'var(--spacing-3)',
                                    color: 'currentColor'
                                }}
                                animate={isActive ? {
                                    scale: [1, 1.05, 1],
                                    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                } : { scale: 1 }}
                            >
                                {item.icon}
                            </motion.span>

                            {/* Label */}
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
                                            fontSize: 'var(--text-sm)',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Collapse Toggle */}
            <div style={{
                padding: 'var(--spacing-6)',
                display: 'flex',
                justifyContent: isCollapsed ? 'center' : 'flex-end',
            }}>
                <motion.button
                    onClick={toggleCollapse}
                    whileHover={{
                        backgroundColor: 'var(--glass-card)',
                        scale: 1.05
                    }}
                    whileTap={{ scale: 0.92 }}
                    className="rounded-lg"
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        transition: 'all var(--transition-normal) var(--ease-out)',
                        backdropFilter: 'var(--glass-blur)',
                        WebkitBackdropFilter: 'var(--glass-blur)',
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.4s cubic-bezier(.4,0,.2,1)'
                        }}
                    >
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
