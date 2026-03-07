/**
 * =============================================================================
 * ANALYTICS DASHBOARD — REDESIGNED
 * =============================================================================
 *
 * Two-tab layout: Report (default) | Transactions
 *   - Report: KPI bar, Day/Week/Month range toggle, interactive bar + pie charts,
 *             download section (daily/monthly/weekly Excel)
 *   - Transactions: sortable table of all bills with Edit/Cancel actions
 *
 * Dependencies: recharts, framer-motion, react-icons
 * =============================================================================
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Sector
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import api, { summaryAPI, reportsAPI, billingAPI, getLocalDateString } from '../../utils/api';
import { formatCurrency, handleAPIError, downloadFile } from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import GlobalDatePicker from '../ui/GlobalDatePicker';
import PageContainer from '../layout/PageContainer';
import {
  IoBarChartOutline,
  IoReceiptOutline,
  IoDownloadOutline,
  IoCalendarOutline,
  IoRefreshOutline,
  IoTodayOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCloseCircleOutline,
} from 'react-icons/io5';
import '../../styles/Analytics.css';

// ─── Color palette for charts ───
const CHART_COLORS = [
  '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F43F5E', '#14B8A6',
  '#A855F7', '#FB923C', '#22D3EE', '#84CC16', '#E11D48',
];

// ─── Custom Tooltip for Bar Chart ───
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{d.name}</div>
      <div className="analytics-tooltip-value">
        Amount: {formatCurrency(d.total_amount)}
      </div>
      <div className="analytics-tooltip-value">
        Qty: {d.quantity} units
      </div>
    </div>
  );
};

// ─── Custom Active Shape for Pie Chart ───
const renderActiveShape = (props) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent
  } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 4px 12px ${fill}55)`, transition: 'all 0.3s ease' }}
      />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--text-primary)"
        style={{ fontSize: '0.82rem', fontWeight: 700 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-secondary)"
        style={{ fontSize: '0.75rem', fontWeight: 600 }}>
        {formatCurrency(payload.total_amount)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="var(--text-secondary)"
        style={{ fontSize: '0.7rem' }}>
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

// ─── KPI Stat Bar ───
const AnalyticsStats = ({ stats }) => {
  const items = [
    { label: 'Net Sales', value: formatCurrency(stats.total_sales || 0), color: '#10B981' },
    { label: 'Total Orders', value: stats.total_bills || 0, color: '#3B82F6' },
    { label: 'Avg. Value', value: formatCurrency(stats.average_bill_value || 0), color: '#F59E0B' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="analytics-stats-bar"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <div className="analytics-stat-divider" />}
          <div className="analytics-stat-item">
            <div className="analytics-stat-dot" style={{ backgroundColor: item.color }} />
            <span className="analytics-stat-label">{item.label}</span>
            <span className="analytics-stat-value">{item.value}</span>
          </div>
        </React.Fragment>
      ))}
    </motion.div>
  );
};

// ─── Helpers ───
function getWeekDates(refDate) {
  const d = new Date(refDate + 'T00:00:00');
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    dates.push(dd.toISOString().split('T')[0]);
  }
  return dates;
}

function getMonthDates(refDate) {
  const d = new Date(refDate + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (ds > todayStr) break;
    dates.push(ds);
  }
  return dates;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const { currentTheme, isDark } = useTheme();
  const navigate = useNavigate();

  // ─── Tabs ───
  const [activeTab, setActiveTab] = useState('report');
  const tabs = [
    { id: 'report', label: 'Report', icon: IoBarChartOutline },
    { id: 'transactions', label: 'Transactions', icon: IoReceiptOutline },
  ];

  // ─── Summary / Product Sales ───
  const [summary, setSummary] = useState(null);
  const [productSales, setProductSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Range toggle ───
  const [viewRange, setViewRange] = useState('day');       // 'day' | 'week' | 'month'
  const [rangeProductSales, setRangeProductSales] = useState([]);
  const [rangeSummary, setRangeSummary] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  // ─── Reports / Download ───
  const [downloading, setDownloading] = useState({});
  const [dailyReportDate, setDailyReportDate] = useState(getLocalDateString());
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exportYear] = useState(new Date().getFullYear());
  const [exportWeekDate, setExportWeekDate] = useState(getLocalDateString());

  // ─── Bills / Transactions ───
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [selectedBillDate, setSelectedBillDate] = useState(getLocalDateString());
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // ─── Clear Data Modal ───
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [showClearPassword, setShowClearPassword] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  // ─── Cancel Bill Modal ───
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // ─── Pie chart active sector ───
  const [activePieIndex, setActivePieIndex] = useState(-1);

  const safeSummary = summary || {};

  // ═══════════════ DATA LOADING ═══════════════

  useEffect(() => {
    loadSummary(selectedDate);
    loadProductSales(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadBills(selectedBillDate);
  }, [selectedBillDate]);

  // Aggregate range data when viewRange or selectedDate changes
  useEffect(() => {
    if (viewRange === 'day') {
      setRangeProductSales(productSales);
      setRangeSummary(summary);
    } else {
      loadRangeData();
    }
  }, [viewRange, selectedDate, productSales, summary]);

  async function loadSummary(date) {
    try {
      setLoading(true);
      setError('');
      const response = date
        ? await summaryAPI.getSummaryForDate(date)
        : await summaryAPI.getTodaySummary();
      setSummary(response.data.summary);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductSales(date) {
    try {
      const url = date
        ? `/api/summary/product-sales?date=${date}`
        : '/api/summary/product-sales';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setProductSales(data.product_sales);
      }
    } catch (err) {
      console.error('Error loading product sales:', err);
    }
  }

  async function loadRangeData() {
    try {
      setRangeLoading(true);
      const dates = viewRange === 'week'
        ? getWeekDates(selectedDate)
        : getMonthDates(selectedDate);

      // Fetch product sales for each date and aggregate
      const allProducts = {};
      let totalSales = 0;
      let totalBills = 0;

      await Promise.all(dates.map(async (d) => {
        try {
          const [psRes, sumRes] = await Promise.all([
            fetch(`/api/summary/product-sales?date=${d}`).then(r => r.json()),
            summaryAPI.getSummaryForDate(d).then(r => r.data.summary).catch(() => null),
          ]);

          if (psRes.success && psRes.product_sales) {
            psRes.product_sales.forEach(p => {
              if (allProducts[p.product_id]) {
                allProducts[p.product_id].quantity += p.quantity;
                allProducts[p.product_id].total_amount += Number(p.total_amount);
              } else {
                allProducts[p.product_id] = { ...p, total_amount: Number(p.total_amount) };
              }
            });
          }

          if (sumRes) {
            totalSales += Number(sumRes.total_sales || 0);
            totalBills += Number(sumRes.total_bills || 0);
          }
        } catch { /* skip failed days */ }
      }));

      const aggregated = Object.values(allProducts).sort((a, b) => b.total_amount - a.total_amount);
      setRangeProductSales(aggregated);
      setRangeSummary({
        total_sales: totalSales,
        total_bills: totalBills,
        average_bill_value: totalBills > 0 ? totalSales / totalBills : 0,
      });
    } catch (err) {
      console.error('Error loading range data:', err);
    } finally {
      setRangeLoading(false);
    }
  }

  async function loadBills(date) {
    try {
      setLoadingBills(true);
      const targetDate = date || new Date().toISOString().split('T')[0];
      const response = await api.get(`/api/bill/date/${targetDate}`);
      if (response.data.success) {
        const sorted = response.data.bills.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA || b.bill_no - a.bill_no;
        });
        setBills(sorted);
      }
    } catch (err) {
      console.error('Error loading bills:', err);
    } finally {
      setLoadingBills(false);
    }
  }

  // ═══════════════ HANDLERS ═══════════════

  const handleEditBill = (bill) => {
    if (bill.status === 'CANCELLED') return;
    navigate('/bill', { state: { bill } });
  };

  const handleCancelBillConfirm = async () => {
    try {
      if (!selectedBill) return;
      const response = await billingAPI.cancelBill(selectedBill.bill_no);
      if (response.data.success) {
        setShowCancelConfirm(false);
        setSelectedBill(null);
        await Promise.all([
          loadBills(selectedBillDate),
          loadSummary(selectedDate),
          loadProductSales(selectedDate),
        ]);
      }
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const handleDownload = async (reportType, reportName, filename, date = null) => {
    try {
      setDownloading(prev => ({ ...prev, [reportType]: true }));
      setError('');
      let response;
      if (reportType === 'excel') {
        response = await reportsAPI.exportTodayExcel('detailed', date);
      } else if (reportType === 'csv') {
        response = await reportsAPI.exportTodayCSV();
      }
      if (response && response.data) downloadFile(response.data, filename);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setDownloading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const handleMonthlyExport = async () => {
    try {
      setDownloading(prev => ({ ...prev, monthly: true }));
      setError('');
      const response = await reportsAPI.exportMonthlyExcel(exportMonth, exportYear);
      if (response && response.data) {
        downloadFile(response.data, `Monthly_Sales_Report_${String(exportMonth).padStart(2, '0')}_${exportYear}.xlsx`);
      }
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setDownloading(prev => ({ ...prev, monthly: false }));
    }
  };

  const handleWeeklyExport = async () => {
    try {
      setDownloading(prev => ({ ...prev, weekly: true }));
      setError('');
      const response = await reportsAPI.exportWeeklyExcel(exportWeekDate);
      const d = new Date(exportWeekDate);
      const day = d.getDay() || 7;
      if (day !== 1) d.setHours(-24 * (day - 1));
      const start = new Date(d);
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      const sStr = `${String(start.getDate()).padStart(2, '0')}${String(start.getMonth() + 1).padStart(2, '0')}${start.getFullYear()}`;
      const eStr = `${String(end.getDate()).padStart(2, '0')}${String(end.getMonth() + 1).padStart(2, '0')}${end.getFullYear()}`;
      const filename = `Weekly_Sales_Report_${sStr}_to_${eStr}.xlsx`;
      if (response && response.data) downloadFile(response.data, filename);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setDownloading(prev => ({ ...prev, weekly: false }));
    }
  };

  const handleClearBills = async () => {
    try {
      setClearingData(true);
      setError('');
      const response = await fetch('/api/bill/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: clearPassword }),
      });
      const result = await response.json();
      if (response.ok) {
        setShowClearConfirm(false);
        setClearPassword('');
        await loadSummary(selectedDate);
        await loadProductSales(selectedDate);
        await loadBills(selectedBillDate);
      } else {
        throw new Error(result.message || 'Failed to clear bills data');
      }
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setClearingData(false);
    }
  };

  // ─── Sort helpers ───
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedBills = useMemo(() => {
    const arr = [...bills];
    const { key, direction } = sortConfig;
    arr.sort((a, b) => {
      let aVal, bVal;
      switch (key) {
        case 'bill_no':
          aVal = a.bill_no; bVal = b.bill_no; break;
        case 'created_at':
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime(); break;
        case 'total_amount':
          aVal = Number(a.total_amount); bVal = Number(b.total_amount); break;
        case 'status':
          aVal = a.status || 'ACTIVE'; bVal = b.status || 'ACTIVE'; break;
        case 'items':
          aVal = a.items?.length || 0; bVal = b.items?.length || 0; break;
        default:
          return 0;
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [bills, sortConfig]);

  // ─── Time formatting ───
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const d = new Date(timestamp.replace(' ', 'T'));
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return timestamp; }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.replace(' ', 'T')).toLocaleDateString();
    } catch { return timestamp.split(' ')[0]; }
  };

  // Decide which data to render in charts
  const chartProductSales = viewRange === 'day' ? productSales : rangeProductSales;
  const chartSummary = viewRange === 'day' ? safeSummary : (rangeSummary || safeSummary);

  // ═══════════════ RENDER ═══════════════

  // Loading skeleton
  if (loading && !summary) {
    return (
      <PageContainer>
        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton height="60px" width="35%" borderRadius="16px" />
            <div style={{ display: 'flex', gap: '12px' }}>
              <Skeleton height="44px" width="120px" borderRadius="12px" />
              <Skeleton height="44px" width="120px" borderRadius="12px" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
            <Skeleton height="380px" borderRadius="16px" />
            <Skeleton height="380px" borderRadius="16px" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error && !summary) {
    return (
      <PageContainer>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '32px',
        }}>
          <div style={{
            background: 'var(--surface-primary)', border: '1px solid var(--error-500, #ef4444)',
            borderRadius: '14px', padding: '32px', textAlign: 'center', maxWidth: '400px',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--error-500, #ef4444)', marginBottom: '8px' }}>
              Error Loading Data
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {error}
            </div>
            <Button onClick={() => { setError(''); loadSummary(selectedDate); }} variant="primary" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* ════════════════ HEADER ════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="analytics-header-glass"
      >
        <div className="analytics-header-top">
          {/* Left: Title + Tabs */}
          <div className="analytics-header-left">
            <h1 className="analytics-title">Analytics</h1>
            <div className="analytics-tab-bar">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`analytics-tab-btn ${activeTab === tab.id ? 'analytics-tab-btn--active' : ''}`}
                  whileTap={{ scale: 0.97 }}
                >
                  <tab.icon size={17} />
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="analytics-actions">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setShowClearConfirm(true)}
                variant="error"
                size="lg"
                style={{
                  background: 'var(--error-500, #EF4444)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <IoTrashOutline size={18} />
                Clear Data
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => { loadSummary(selectedDate); loadProductSales(selectedDate); }}
                variant="primary"
                size="lg"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IoRefreshOutline size={18} />
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>

        <AnalyticsStats stats={chartSummary} />
      </motion.div>

      {/* ════════════════ TAB CONTENT ════════════════ */}
      <div className="analytics-tab-content">
        <AnimatePresence mode="wait">
          {/* ──────────── REPORT TAB ──────────── */}
          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Range Toggle + Date Picker */}
              <div className="analytics-range-bar">
                <div className="analytics-range-toggle">
                  {['day', 'week', 'month'].map((r) => (
                    <button
                      key={r}
                      className={`range-btn ${viewRange === r ? 'range-btn--active' : ''}`}
                      onClick={() => setViewRange(r)}
                    >
                      {r === 'day' ? '1 Day' : r === 'week' ? '1 Week' : '1 Month'}
                    </button>
                  ))}
                </div>
                <div className="analytics-range-date">
                  <IoCalendarOutline size={18} color="var(--text-secondary)" />
                  <GlobalDatePicker
                    value={selectedDate}
                    onChange={(val) => setSelectedDate(val)}
                    placeholder="Select Date"
                    className="report-select-override"
                  />
                </div>
              </div>

              {/* Charts Grid */}
              {rangeLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '28px' }}>
                  <Skeleton height="380px" borderRadius="16px" />
                  <Skeleton height="380px" borderRadius="16px" />
                </div>
              ) : chartProductSales.length > 0 ? (
                <div className="analytics-charts-grid">
                  {/* Bar Chart */}
                  <motion.div
                    className="analytics-chart-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h3 className="chart-card-title">Product Sales</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={chartProductSales.slice(0, 15)}
                        margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                          angle={-40}
                          textAnchor="end"
                          interval={0}
                          height={70}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                          tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        />
                        <RechartsTooltip content={<BarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="total_amount" radius={[6, 6, 0, 0]} animationDuration={800}>
                          {chartProductSales.slice(0, 15).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Pie Chart */}
                  <motion.div
                    className="analytics-chart-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h3 className="chart-card-title">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={chartProductSales}
                          dataKey="total_amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, i) => setActivePieIndex(i)}
                          onMouseLeave={() => setActivePieIndex(-1)}
                          animationDuration={800}
                        >
                          {chartProductSales.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{
                            background: 'var(--surface-primary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>
              ) : (
                <div className="analytics-empty" style={{ marginBottom: '28px' }}>
                  <div className="analytics-empty-icon">📊</div>
                  <h3>No Sales Data</h3>
                  <p>
                    {viewRange === 'day'
                      ? 'No product sales for this date. Start creating bills to see insights here.'
                      : `No product sales found for this ${viewRange}. Try a different date range.`}
                  </p>
                </div>
              )}

              {/* Download Reports Section */}
              <motion.div
                className="analytics-download-section"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3 className="analytics-download-title">Download Reports</h3>
                <div className="analytics-download-grid">
                  {/* Daily */}
                  <div className="download-card">
                    <div className="download-card-header">
                      <div className="download-card-icon download-card-icon--daily">
                        <IoCalendarOutline size={22} />
                      </div>
                      <div>
                        <h4 className="download-card-name">Daily Report</h4>
                        <p className="download-card-desc">Sales summary for selected date</p>
                      </div>
                    </div>
                    <div className="download-card-controls">
                      <span className="download-card-label">Select Date</span>
                      <GlobalDatePicker
                        value={dailyReportDate}
                        onChange={(val) => setDailyReportDate(val)}
                        placeholder="Select Date"
                        className="report-select-override"
                      />
                    </div>
                    <button
                      className="download-card-btn"
                      onClick={() => handleDownload('excel', 'detailed', `sales_report_${dailyReportDate}.xlsx`, dailyReportDate)}
                      disabled={downloading.excel}
                    >
                      <IoDownloadOutline size={16} />
                      {downloading.excel ? 'Downloading...' : 'Download Report'}
                    </button>
                  </div>

                  {/* Monthly */}
                  <div className="download-card">
                    <div className="download-card-header">
                      <div className="download-card-icon download-card-icon--monthly">
                        <IoCalendarOutline size={22} />
                      </div>
                      <div>
                        <h4 className="download-card-name">Monthly Report</h4>
                        <p className="download-card-desc">Full month sales analysis</p>
                      </div>
                    </div>
                    <div className="download-card-controls">
                      <span className="download-card-label">Select Month</span>
                      <GlobalDatePicker
                        type="month"
                        value={exportMonth}
                        onChange={(val) => setExportMonth(val)}
                        placeholder="Select Month"
                        className="report-select-override"
                      />
                    </div>
                    <button
                      className="download-card-btn"
                      onClick={handleMonthlyExport}
                      disabled={downloading.monthly}
                    >
                      <IoDownloadOutline size={16} />
                      {downloading.monthly ? 'Downloading...' : 'Download Monthly'}
                    </button>
                  </div>

                  {/* Weekly */}
                  <div className="download-card">
                    <div className="download-card-header">
                      <div className="download-card-icon download-card-icon--weekly">
                        <IoCalendarOutline size={22} />
                      </div>
                      <div>
                        <h4 className="download-card-name">Weekly Report</h4>
                        <p className="download-card-desc">Selected week analysis</p>
                      </div>
                    </div>
                    <div className="download-card-controls">
                      <span className="download-card-label">Select Reference Date</span>
                      <GlobalDatePicker
                        value={exportWeekDate}
                        onChange={(val) => setExportWeekDate(val)}
                        placeholder="Select Date"
                        className="report-select-override"
                      />
                    </div>
                    <button
                      className="download-card-btn"
                      onClick={handleWeeklyExport}
                      disabled={downloading.weekly}
                    >
                      <IoDownloadOutline size={16} />
                      {downloading.weekly ? 'Downloading...' : 'Download Weekly'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ──────────── TRANSACTIONS TAB ──────────── */}
          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="transactions-header">
                <div className="transactions-title-row">
                  <div className="transactions-accent" />
                  <h2 className="transactions-title">
                    Transactions
                  </h2>
                  <span className="transactions-badge">
                    {selectedBillDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedBillDate}
                    {' · '}{bills.length} bills
                  </span>
                </div>
                <div className="transactions-controls">
                  <button
                    onClick={() => setSelectedBillDate(new Date().toISOString().split('T')[0])}
                    className={`transactions-today-btn ${selectedBillDate === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
                  >
                    <IoTodayOutline size={15} />
                    Today
                  </button>
                  <input
                    type="date"
                    value={selectedBillDate}
                    onChange={(e) => setSelectedBillDate(e.target.value)}
                    className="transactions-date-input"
                  />
                  <button
                    onClick={() => loadBills(selectedBillDate)}
                    className="transactions-refresh-btn"
                    disabled={loadingBills}
                  >
                    <IoRefreshOutline
                      size={15}
                      style={{ animation: loadingBills ? 'spin 1s linear infinite' : 'none' }}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Table */}
              {bills.length > 0 ? (
                <motion.div
                  className="transactions-table-wrap"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        {[
                          { key: 'bill_no', label: 'Bill #' },
                          { key: 'created_at', label: 'Date / Time' },
                          { key: 'items', label: 'Items' },
                          { key: 'total_amount', label: 'Amount' },
                          { key: 'status', label: 'Status' },
                          { key: null, label: 'Actions' },
                        ].map((col) => (
                          <th
                            key={col.label}
                            onClick={() => col.key && handleSort(col.key)}
                            className={sortConfig.key === col.key ? 'sorted' : ''}
                            style={col.key ? {} : { cursor: 'default' }}
                          >
                            {col.label}
                            {col.key && (
                              <span className={`sort-arrow ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'sort-arrow--desc' : ''}`}>
                                ▲
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBills.map((bill) => {
                        const isCancelled = bill.status === 'CANCELLED';
                        const statusText = (!bill.status || bill.status === 'ACTIVE') ? 'CONFIRMED' : bill.status;
                        return (
                          <tr
                            key={bill.bill_no}
                            className={isCancelled ? 'cancelled-row' : ''}
                            onClick={() => !isCancelled && handleEditBill(bill)}
                            style={{ cursor: isCancelled ? 'default' : 'pointer' }}
                          >
                            <td style={{ fontWeight: 700 }}>{bill.bill_no}</td>
                            <td>
                              <div>{formatDate(bill.created_at)}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {formatTime(bill.created_at)}
                              </div>
                            </td>
                            <td>{bill.items?.length || 0}</td>
                            <td style={{ fontWeight: 700 }}>{formatCurrency(bill.total_amount)}</td>
                            <td>
                              <span className={`status-badge ${isCancelled ? 'status-badge--cancelled' : 'status-badge--confirmed'}`}>
                                {statusText}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button
                                  className="table-action-btn edit"
                                  onClick={(e) => { e.stopPropagation(); handleEditBill(bill); }}
                                  disabled={isCancelled}
                                >
                                  <IoCreateOutline size={13} />
                                  Edit
                                </button>
                                <button
                                  className="table-action-btn cancel"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBill(bill);
                                    setShowCancelConfirm(true);
                                  }}
                                  disabled={isCancelled}
                                >
                                  <IoCloseCircleOutline size={13} />
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon">🧾</div>
                  <h3>{loadingBills ? 'Loading transactions...' : 'No bills found'}</h3>
                  <p>
                    {loadingBills
                      ? 'Please wait while we fetch the latest data.'
                      : `No transactions for ${selectedBillDate === new Date().toISOString().split('T')[0] ? 'today' : selectedBillDate}. Your transaction history will appear here once orders are processed.`}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════ CLEAR DATA MODAL ════════════════ */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            className="pmOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowClearConfirm(false); setClearPassword(''); }}
          >
            <motion.div
              className="pmDialog"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pmDialogTitle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Clear All Data?
              </div>
              <div className="pmDialogBody">
                This will permanently delete all bills and sales data. This action cannot be undone.
                <div style={{ marginTop: '16px', position: 'relative' }}>
                  <input
                    type={showClearPassword ? 'text' : 'password'}
                    className="pmInput"
                    placeholder="Enter password to confirm"
                    value={clearPassword}
                    onChange={(e) => setClearPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleClearBills()}
                    autoFocus
                    style={{ width: '100%', textAlign: 'center', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowClearPassword(!showClearPassword)}
                    style={{
                      position: 'absolute', right: '8px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center', opacity: 0.6,
                    }}
                  >
                    {showClearPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.826M9.363 5.365A9.466 9.466 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.658 2.366M6.632 6.632A9.466 9.466 0 005 12s3 7 7 7a9.466 9.466 0 005.368-1.632" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="pmDialogActions">
                <button
                  className="pmDialogBtn"
                  onClick={() => { setShowClearConfirm(false); setClearPassword(''); }}
                >
                  Cancel
                </button>
                <button className="pmDialogBtn pmDialogBtnPrimary" onClick={handleClearBills}>
                  {clearingData ? 'Clearing...' : 'Clear All Data'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════ CANCEL BILL MODAL ════════════════ */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
            }}
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'var(--surface-primary)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                border: '1px solid var(--border-primary)',
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0,0,0,0.5)'
                  : '0 25px 50px -12px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IoTrashOutline size={22} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
                    Cancel Bill
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Caution: This affects sales reports
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Are you sure you want to cancel <strong>Bill #{selectedBill?.bill_no}</strong>?
                </p>
                <ul style={{ margin: '12px 0 0 12px', paddingLeft: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <li>Bill amount will be deducted from sales totals.</li>
                  <li>Bill status will change to "CANCELLED".</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowCancelConfirm(false)}
                  variant="secondary"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 500,
                  }}
                >
                  Keep Bill
                </Button>
                <Button
                  onClick={handleCancelBillConfirm}
                  variant="secondary"
                  style={{
                    background: 'var(--error-500, #EF4444)',
                    border: '1px solid var(--error-500, #EF4444)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <IoTrashOutline size={16} />
                  Confirm Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Analytics;
