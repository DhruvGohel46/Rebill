/**
 * =============================================================================
 * MAIN APPLICATION COMPONENT - APP.JSX
 * =============================================================================
 * 
 * ROLE: Central application entry point and routing controller
 * 
 * RESPONSIBILITIES:
 * - Theme management and dark/light mode switching
 * - Screen navigation between POS, Analytics, and Management modules
 * - Bill notification system with auto-dismiss functionality
 * - Global layout structure and responsive design
 * - State management for current screen and bill notifications
 * 
 * KEY FEATURES:
 * - ThemeProvider wrapper for consistent theming
 * - Navigation system with screen state management
 * - Bill creation notification with glassmorphism design
 * - Auto-dismiss notifications (5 seconds)
 * - Responsive layout with proper spacing
 * 
 * SCREENS:
 * - 'pos': Point of Sale / Billing interface
 * - 'summary': Analytics dashboard with reports
 * - 'management': Product management system
 * 
 * COMPONENTS USED:
 * - WorkingPOSInterface: Main billing/POS functionality
 * - Reports: Analytics and reporting dashboard
 * - ProductManagement: Product CRUD operations
 * 
 * STATE MANAGEMENT:
 * - currentScreen: Active screen identifier
 * - lastBill: Bill notification data for display
 * - Theme context integration
 * 
 * DESIGN PATTERNS:
 * - Functional component with hooks
 * - Conditional rendering based on screen state
 * - Framer Motion animations for notifications
 * - Theme-aware styling throughout
 * =============================================================================
 */
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AlertProvider, useAlert } from './context/AlertContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { useTheme } from './context/ThemeContext';
import './styles/typography.css'; // Import global typography system
import { useAnimation } from './hooks/useAnimation';
import { formatCurrency } from './utils/api';
import './styles/fonts.css';
import './styles/global.css';

// Import screens
import WorkingPOSInterface from './components/screens/Bill';
import Analytics from './components/screens/Analytics';
import ProductManagement from './components/screens/Management';
import Inventory from './components/screens/Inventory';
import Settings from './components/screens/Settings';
import Reminders from './components/screens/Reminders';
import { settingsAPI } from './api/settings';
import { setCurrencySymbol } from './utils/api';
import NotificationSystem from './components/system/NotificationSystem';

// Worker Pages
// Worker Pages
import WorkersDashboard from './components/workers/WorkersPage';
import WorkerList from './components/workers/WorkerList';
import WorkerProfile from './components/workers/WorkerProfile';
import Attendance from './components/workers/Attendance';
import SalaryManager from './components/workers/SalaryManager';
import { workerAPI } from './api/workers';

// Import UI components
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import Sidebar from './components/ui/Sidebar';
import { darkTheme } from './styles/theme';

function AppContent() {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const { settings } = useSettings();
  const { pageVariants, pageTransition } = useAnimation();

  const { addToast, showSuccess: alertSuccess } = useAlert();

  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [posKey, setPosKey] = useState(0);
  const notificationRef = React.useRef(null);
  const [showAttendancePrompt, setShowAttendancePrompt] = useState(false);

  // Check Attendance & Salary on Mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 1. Attendance Check
        const status = await workerAPI.checkAttendanceStatus();
        if (!status.is_marked) {
          setShowAttendancePrompt(true);
        }

        // 2. Salary Day Check
        if (settings?.salary_day) {
          const today = new Date();
          if (today.getDate() === parseInt(settings.salary_day)) {
            const salaryStatus = await workerAPI.checkMonthlySalaryStatus(today.getMonth() + 1, today.getFullYear());
            if (salaryStatus.data && !salaryStatus.data.all_paid) {
              setSalaryNotification(true);
            }
          }
        }
      } catch (e) {
        console.error("Status check failed", e);
      }
    };

    // Delay slightly to ensure settings are loaded (though text might pop in)
    // or rely on settings dependency
    if (settings?.salary_day) {
      checkStatus();
    } else {
      // Initial check without settings, or just wait for settings to load
      setTimeout(checkStatus, 3000);
    }
  }, [settings?.salary_day]);

  const [salaryNotification, setSalaryNotification] = useState(false);

  // Initial Stock Check
  useEffect(() => {
    // Small delay to ensure backend is ready and settings loaded
    const timer = setTimeout(() => {
      if (notificationRef.current) {
        notificationRef.current.checkStock();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Settings are now loaded globally by SettingsProvider

  const getActiveTab = (pathname) => {
    if (pathname === '/') return 'pos';
    if (pathname.startsWith('/analytics')) return 'summary';
    if (pathname.startsWith('/analytics')) return 'summary';
    if (pathname.startsWith('/management')) return 'management';
    if (pathname.startsWith('/workers')) return 'workers';
    if (pathname.startsWith('/inventory')) return 'inventory';
    if (pathname.startsWith('/reminders')) return 'reminders';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'pos';
  };

  const currentScreen = getActiveTab(location.pathname);

  const navItems = [
    {
      id: 'pos',
      label: 'Bill',
      path: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'summary',
      label: 'Analytics',
      path: '/analytics',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'workers',
      label: 'Workers',
      path: '/workers',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      )
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/inventory',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'management',
      label: 'Management',
      path: '/management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },

    {
      id: 'reminders',
      label: 'Reminders',
      path: '/reminders',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
  ];

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  });

  const headerEnter = {
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.24, ease: [0, 0, 0.2, 1] },
  };

  const handleBillCreated = (bill) => {
    addToast({
      type: 'success',
      title: 'Bill Created Successfully!',
      description: `Bill #${bill.bill_no} — Total: ${formatCurrency(bill.total)}`,
      duration: 5000,
    });
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      backgroundColor: 'transparent',
      color: currentTheme.colors.text.primary,
      fontFamily: currentTheme.typography.fontFamily.primary,
      overflow: 'hidden',
    }}>
      {/* Search Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        navItems={navItems}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          whileHover={{ filter: 'brightness(1.05)' }}
          className="glass-header"
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-6)',
            zIndex: 40,
            flexShrink: 0,
            transition: 'filter var(--transition-normal) var(--ease-out)',
          }}
        >
          {/* Left Side - New Bill Button */}
          <div style={{ width: '200px' }}>
            <motion.button
              whileHover={{
                transform: 'var(--hover-lift)',
                boxShadow: 'var(--shadow-button-hover)'
              }}
              whileTap={{
                transform: 'var(--active-scale)'
              }}
              onClick={() => {
                setPosKey(prev => prev + 1);
                navigate('/');
              }}
              className="liquid-glass-button"
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
              }}
            >
              Start New Bill
            </motion.button>
          </div>

          {/* Center - Title */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-semibold)',
                letterSpacing: '0.3px',
                color: 'var(--primary-500)',
                textShadow: '0 0 12px rgba(249,115,22,0.25)',
                margin: 0,
                cursor: 'default',
                transition: 'opacity var(--transition-normal) var(--ease-out)',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              ReBill
              <span style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-normal)',
                color: 'var(--text-secondary)',
                opacity: 0.65,
                marginLeft: 'var(--spacing-2)'
              }}>
                ({settings.shop_name || 'Burger Bhau'})
              </span>
            </h1>
          </div>

          {/* Right Side - Date & Theme */}
          <div style={{
            width: '200px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'var(--spacing-4)'
          }}>
            {/* Date Chip */}
            <div
              className="rounded-pill"
              style={{
                padding: 'var(--spacing-2) var(--spacing-3)',
                backgroundColor: 'var(--glass-card)',
                border: '1px solid var(--glass-border)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                cursor: 'default',
                transition: 'background var(--transition-normal) var(--ease-out)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-header)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-card)'}
            >
              {todayLabel}
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{
                backgroundColor: 'var(--glass-header)'
              }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="rounded-lg"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                border: 'none',
                backgroundColor: 'var(--glass-card)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                transition: 'all var(--transition-normal) var(--ease-out)',
              }}
            >
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          display: 'flex', // Enable flex for children to stretch
          flexDirection: 'column',
          minHeight: 0,
          margin: 0,
          padding: 0,
          overflow: 'hidden', // Disable global scroll, handle per-screen
          position: 'relative'
        }}>
          <Routes>
            <Route path="/" element={<WorkingPOSInterface key={posKey} onBillCreated={handleBillCreated} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/management" element={<ProductManagement />} />

            {/* Worker Routes */}
            <Route path="/workers" element={<WorkersDashboard />} />
            <Route path="/workers/list" element={<WorkerList />} /> {/* Optional alias if needed, but dashboard is main entry */}
            <Route path="/workers/:id" element={<WorkerProfile />} />
            <Route path="/workers/attendance" element={<Attendance />} />
            <Route path="/workers/salary" element={<SalaryManager />} />

            <Route path="/reminders" element={<Reminders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<WorkingPOSInterface key={posKey} onBillCreated={handleBillCreated} />} />
          </Routes>
        </main>


      </div> {/* End Main Content Area */}

      {/* Global Notification System */}
      <NotificationSystem ref={notificationRef} />

      {/* Startup Attendance Prompt */}
      <AnimatePresence>
        {showAttendancePrompt && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="liquid-glass-card"
              style={{
                padding: 'var(--spacing-8)',
                maxWidth: '420px',
                width: '90%',
                borderRadius: '20px',
                border: '1px solid rgba(255, 140, 0, 0.2)',
                background: 'rgba(22, 26, 32, 0.8)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-5)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255, 140, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  ⏰
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-semibold)',
                    letterSpacing: '0.2px',
                    lineHeight: '1.3'
                  }}>
                    Mark Attendance?
                  </h2>
                  <p style={{
                    margin: 'var(--spacing-1) 0 0 0',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)'
                  }}>
                    Daily reminder
                  </p>
                </div>
              </div>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                margin: '0 0 var(--spacing-6) 0',
                fontWeight: 'var(--font-normal)'
              }}>
                You haven't marked worker attendance for today yet. Would you like to do it now?
              </p>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-3)', 
                justifyContent: 'flex-end' 
              }}>
                <Button
                  variant="ghost"
                  onClick={() => setShowAttendancePrompt(false)}
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  Later
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowAttendancePrompt(false);
                    navigate('/workers/attendance');
                  }}
                  style={{ 
                    background: 'var(--primary-500)', 
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    boxShadow: '0 4px 12px rgba(255, 106, 0, 0.25)'
                  }}
                >
                  Yes, Mark Now
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Salary Day Notification */}
      <AnimatePresence>
        {salaryNotification && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="liquid-glass-card"
              style={{
                padding: 'var(--spacing-8)',
                maxWidth: '420px',
                width: '90%',
                borderRadius: '20px',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                background: 'rgba(22, 26, 32, 0.8)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-5)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(76, 175, 80, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  💰
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-semibold)',
                    letterSpacing: '0.2px',
                    lineHeight: '1.3'
                  }}>
                    It's Salary Day!
                  </h2>
                  <p style={{
                    margin: 'var(--spacing-1) 0 0 0',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)'
                  }}>
                    Monthly reminder
                  </p>
                </div>
              </div>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-base)',
                lineHeight: '1.6',
                margin: '0 0 var(--spacing-6) 0',
                fontWeight: 'var(--font-normal)'
              }}>
                Today is designated salary day. Would you like to review and process worker salaries now?
              </p>
              <div style={{ 
                display: 'flex', 
                gap: 'var(--spacing-3)', 
                justifyContent: 'flex-end' 
              }}>
                <Button
                  variant="ghost"
                  onClick={() => setSalaryNotification(false)}
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  Later
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSalaryNotification(false);
                    navigate('/workers/salary');
                  }}
                  style={{ 
                    background: 'var(--success-500)', 
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.25)'
                  }}
                >
                  Go to Salary Manager
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <SettingsProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </SettingsProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
