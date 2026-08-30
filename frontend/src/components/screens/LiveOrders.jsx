import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { billingAPI, formatCurrency } from '../../utils/api';
import { printerService } from '../../services/printerService';
import PageContainer from '../layout/PageContainer';
import {
  IoReceiptOutline,
  IoGitMergeOutline,
  IoCloseOutline,
  IoRefreshOutline,
  IoTimeOutline,
  IoRestaurantOutline,
  IoBagHandleOutline,
  IoArrowBack,
  IoArrowUndoOutline,
  IoCashOutline,
  IoCardOutline,
  IoQrCodeOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoLayersOutline,
  IoAdd,
  IoPersonOutline,
  IoSearchOutline
} from 'react-icons/io5';
import '../../styles/LiveOrders.css';

// ── Draggable & Droppable Order Card Component ─────────────────────────────
const DraggableOrderCard = ({
  order,
  isMergedGroup,
  isSelected,
  onToggleSelect,
  onSettleClick,
  onSplitClick,
  onPrintClick,
  isDark,
  memberBills = [],
}) => {
  const cardId = isMergedGroup ? `group-${order.id}` : `bill-${order.id}`;

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: cardId,
    data: { order, isMergedGroup },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: cardId,
    data: { order, isMergedGroup },
  });

  const setCombinedRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.75 : 1,
      }
    : undefined;

  const isPending = (order.amount_pending || 0) > 0;
  const isPartial = (order.amount_paid || 0) > 0 && isPending;

  return (
    <div
      ref={setCombinedRef}
      style={{
        ...style,
        background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
        border: isDark
          ? isMergedGroup
            ? '1.5px solid rgba(139, 92, 246, 0.4)'
            : isPending
            ? '1px solid rgba(245, 158, 11, 0.35)'
            : '1px solid rgba(255, 255, 255, 0.08)'
          : isPending
          ? '1.5px solid #FCD34D'
          : '1.5px solid #E2E8F0',
        boxShadow: isDark
          ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      }}
      {...attributes}
      {...listeners}
      className={`order-card ${isMergedGroup ? 'is-merged' : ''} ${isOver ? 'drag-over' : ''} ${
        isSelected ? 'selected' : ''
      }`}
    >
      {/* ── Top Header: Checkbox + Enlarged Token + Status Pill ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(order.id, isMergedGroup);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#FF6B1A' }}
          />

          {isMergedGroup ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IoGitMergeOutline size={18} style={{ color: '#A78BFA' }} />
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#A78BFA', letterSpacing: '-0.01em' }}>
                Group ({order.member_bill_ids?.length || 0} Bills)
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  color: isDark ? '#94A3B8' : '#64748B',
                  letterSpacing: '0.06em'
                }}
              >
                TOKEN
              </span>
              <span
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}
              >
                {order.today_token || order.bill_no}
              </span>
            </div>
          )}
        </div>

        {/* High-Contrast Payment Status Capsule */}
        {isMergedGroup ? (
          <span className="status-pill-merged">
            <IoLayersOutline size={13} /> MERGED
          </span>
        ) : isPartial ? (
          <span className="status-pill-partial">
            <IoFlashOutline size={13} /> PARTIAL
          </span>
        ) : isPending ? (
          <span className="status-pill-pending">
            <IoTimeOutline size={13} /> PENDING
          </span>
        ) : (
          <span className="status-pill-paid">
            <IoCheckmarkCircle size={13} /> PAID
          </span>
        )}
      </div>

      {/* ── Order Type (Dine-In / Table / Takeaway) & Customer Tag ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
        <div>
          {order.order_type === 'takeaway' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FEF3C7',
                color: '#D97706',
                fontWeight: 850,
                fontSize: '0.82rem',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FDE68A'
              }}
            >
              <IoBagHandleOutline size={15} /> Takeaway
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: isDark ? 'rgba(59, 130, 246, 0.14)' : '#DBEAFE',
                color: '#2563EB',
                fontWeight: 850,
                fontSize: '0.84rem',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE'
              }}
            >
              <IoRestaurantOutline size={15} /> {order.table_no ? `Table ${order.table_no}` : 'Dine-In'}
            </span>
          )}
        </div>

        {order.customer_name && (
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 750,
              color: isDark ? '#E2E8F0' : '#1E293B',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <IoPersonOutline size={14} style={{ color: isDark ? '#94A3B8' : '#64748B', flexShrink: 0 }} />
            <span>{order.customer_name}</span>
          </span>
        )}
      </div>

      {/* ── Amounts Breakdown Box (High Contrast & Clear Visibility) ── */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: '14px',
          background: isDark ? '#141518' : '#F8FAFC',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
          <span style={{ color: isDark ? '#A1A1AA' : '#64748B', fontWeight: 650 }}>Collected (Paid):</span>
          <span style={{ fontWeight: 900, color: '#10B981', fontFamily: 'monospace', fontSize: '0.90rem' }}>
            {formatCurrency(order.amount_paid || 0)}
          </span>
        </div>

        {isPending && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <span style={{ color: isDark ? '#A1A1AA' : '#64748B', fontWeight: 650 }}>Pending Amount:</span>
            <span style={{ fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace', fontSize: '0.92rem' }}>
              {formatCurrency(order.amount_pending || 0)}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.92rem',
            fontWeight: 900,
            color: isDark ? '#FFFFFF' : '#0F172A',
            paddingTop: '6px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #E2E8F0',
            marginTop: '2px'
          }}
        >
          <span>Total Bill:</span>
          <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#FF6B1A' }}>
            {formatCurrency(order.total_amount || 0)}
          </span>
        </div>
      </div>

      {/* ── Items Preview (High-Contrast Text) ── */}
      {!isMergedGroup && order.items && order.items.length > 0 && (
        <div className="card-items-preview">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="card-item-row"
              style={{
                color: isDark ? '#F1F5F9' : '#0F172A',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.04)',
                paddingBottom: '3px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ fontWeight: 850, color: '#FF6B1A', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                  {item.quantity}×
                </span>
                <span style={{ fontWeight: 650, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name || item.product_name}
                </span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 750, color: isDark ? '#CBD5E1' : '#475569', flexShrink: 0 }}>
                {formatCurrency((item.price || 0) * (item.quantity || 1))}
              </span>
            </div>
          ))}
        </div>
      )}

      {isMergedGroup && memberBills && memberBills.length > 0 && (
        <div className="card-items-preview">
          {memberBills.map((b, idx) => (
            <div
              key={idx}
              className="card-item-row"
              style={{
                color: isDark ? '#F1F5F9' : '#0F172A',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.04)',
                paddingBottom: '3px'
              }}
            >
              <span style={{ fontWeight: 650, fontSize: '0.84rem' }}>
                Token #{b.today_token || b.bill_no} ({b.table_no ? `T${b.table_no}` : 'Takeaway'})
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 750, color: isDark ? '#CBD5E1' : '#475569' }}>
                {formatCurrency(b.total_amount || 0)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Card Action Buttons ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: 'auto',
          paddingTop: '6px'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isPending && (
          <button
            type="button"
            onClick={() => onSettleClick(order, isMergedGroup)}
            style={{
              flex: 1,
              height: '38px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 850,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.18s ease'
            }}
          >
            <IoCashOutline size={16} /> Settle ({formatCurrency(order.amount_pending || order.total_amount)})
          </button>
        )}

        {isMergedGroup && (
          <button
            type="button"
            onClick={() => onSplitClick(order)}
            style={{
              padding: '0 14px',
              height: '38px',
              borderRadius: '12px',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
              background: isDark ? '#1C1D22' : '#F1F5F9',
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Split group back into individual bills"
          >
            <IoArrowUndoOutline size={15} /> Split
          </button>
        )}


      </div>
    </div>
  );
};

// ── Main Live Orders Board Screen ──────────────────────────────────────────
export default function LiveOrders() {
  const { isDark } = useTheme();
  const { showSuccess, showWarning, showError } = useAlert();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [mergeGroups, setMergeGroups] = useState([]);
  const [versionHash, setVersionHash] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state
  const [mergeModalData, setMergeModalData] = useState(null);
  const [settleModalData, setSettleModalData] = useState(null);
  const [settlePayments, setSettlePayments] = useState([{ method: 'CASH', amount: 0 }]);
  const [splitModalGroup, setSplitModalGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ── Fetch Live Orders with Version Hash Polling ──
  const fetchLiveOrders = useCallback(async (currentVer = '') => {
    try {
      const res = await billingAPI.getLiveOrders(currentVer);
      if (res.status === 200 && res.data?.success) {
        setBills(res.data.bills || []);
        setMergeGroups(res.data.merge_groups || []);
        setVersionHash(res.data.version_hash || '');
      }
    } catch (err) {
      if (err.response?.status !== 304) {
        console.error('Error fetching live orders:', err);
      }
    }
  }, []);

  // Polling every 2.5 seconds
  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(() => {
      fetchLiveOrders(versionHash);
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchLiveOrders, versionHash]);

  // ── KPI Summary Calculations ──
  const stats = useMemo(() => {
    let totalVal = 0;
    let paidVal = 0;
    let pendingVal = 0;

    const groupedBillIds = new Set();
    mergeGroups.forEach((g) => {
      totalVal += g.total_amount || 0;
      paidVal += g.amount_paid || 0;
      pendingVal += g.amount_pending || 0;
      (g.member_bill_ids || []).forEach((id) => groupedBillIds.add(id));
    });

    bills.forEach((b) => {
      if (!groupedBillIds.has(b.id)) {
        totalVal += b.total_amount || 0;
        paidVal += b.amount_paid || 0;
        pendingVal += b.amount_pending || 0;
      }
    });

    const openOrdersCount = mergeGroups.length + bills.filter((b) => !groupedBillIds.has(b.id)).length;
    const pendingCount = mergeGroups.filter((g) => (g.amount_pending || 0) > 0).length +
      bills.filter((b) => !groupedBillIds.has(b.id) && (b.amount_pending || 0) > 0).length;
    const paidCount = openOrdersCount - pendingCount;

    return { totalVal, paidVal, pendingVal, openOrdersCount, pendingCount, paidCount };
  }, [bills, mergeGroups]);

  // ── Filtered items ──
  const filteredItems = useMemo(() => {
    const groupedBillIds = new Set();
    mergeGroups.forEach((g) => {
      (g.member_bill_ids || []).forEach((id) => groupedBillIds.add(id));
    });

    const standaloneBills = bills.filter((b) => !groupedBillIds.has(b.id));

    let all = [
      ...mergeGroups.map((g) => ({ ...g, isGroup: true })),
      ...standaloneBills.map((b) => ({ ...b, isGroup: false })),
    ];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter((item) => {
        const token = (item.today_token || item.bill_no || '').toString();
        const table = (item.table_no || '').toLowerCase();
        const name = (item.customer_name || '').toLowerCase();
        return token.includes(q) || table.includes(q) || name.includes(q);
      });
    }

    return all;
  }, [bills, mergeGroups, searchQuery]);

  // ── Drag & Drop Merge Handler ──
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceData = active.data.current;
    const targetData = over.data.current;

    if (!sourceData || !targetData) return;

    let billIds = [];
    if (sourceData.isMergedGroup) {
      billIds.push(...(sourceData.order.member_bill_ids || []));
    } else {
      billIds.push(sourceData.order.id);
    }

    if (targetData.isMergedGroup) {
      billIds.push(...(targetData.order.member_bill_ids || []));
    } else {
      billIds.push(targetData.order.id);
    }

    billIds = Array.from(new Set(billIds));

    setMergeModalData({
      source: sourceData.order,
      target: targetData.order,
      billIds,
    });
  };

  const handleConfirmMerge = async () => {
    if (!mergeModalData?.billIds || mergeModalData.billIds.length < 2) return;
    try {
      setActionLoading(true);
      const res = await billingAPI.mergeOrders(mergeModalData.billIds);
      if (res.data?.success) {
        showSuccess('Orders merged successfully!');
        setMergeModalData(null);
        setSelectedIds(new Set());
        fetchLiveOrders();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to merge orders');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSettle = (order, isMergedGroup) => {
    setSettleModalData({ order, isMergedGroup });
    setSettlePayments([{ method: 'CASH', amount: order.amount_pending || order.total_amount || 0 }]);
  };

  const handleConfirmSettle = async () => {
    if (!settleModalData) return;
    try {
      setActionLoading(true);
      if (settleModalData.isMergedGroup) {
        await billingAPI.settleMergeGroup(settleModalData.order.id, settlePayments);
      } else {
        await billingAPI.settleBill(settleModalData.order.id, settlePayments);
      }
      showSuccess('Payment settled successfully!');
      setSettleModalData(null);
      fetchLiveOrders();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to settle payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSplit = async () => {
    if (!splitModalGroup) return;
    try {
      setActionLoading(true);
      await billingAPI.splitMergeGroup(splitModalGroup.id);
      showSuccess('Merge group split successfully!');
      setSplitModalGroup(null);
      fetchLiveOrders();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to split group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSelect = (id, isGroup) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = isGroup ? `g-${id}` : `b-${id}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMergeSelected = () => {
    let billIds = [];
    selectedIds.forEach((key) => {
      if (key.startsWith('g-')) {
        const gid = key.replace('g-', '');
        const grp = mergeGroups.find((g) => g.id === gid);
        if (grp) billIds.push(...(grp.member_bill_ids || []));
      } else {
        const bid = parseInt(key.replace('b-', ''), 10);
        billIds.push(bid);
      }
    });

    billIds = Array.from(new Set(billIds));
    if (billIds.length < 2) {
      showWarning('Select at least 2 orders to merge');
      return;
    }

    setMergeModalData({ billIds });
  };

  return (
    <PageContainer>
      <div className="live-orders-page-wrap">
        {/* ─── Unified Top Header with Merged Compact Stats (24px Continuous Curved Glass) ─── */}
        <div
          style={{
            padding: '14px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? 'linear-gradient(165deg, #18191D 0%, #111215 100%)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
            borderRadius: '24px',
            boxShadow: isDark
              ? '0 10px 30px -8px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Left: Back Button & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 750,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
                background: isDark ? '#16171B' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#0F172A',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <IoArrowBack size={16} /> Back to Billing
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="live-pulse-dot" />
              <h1
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  margin: 0,
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap'
                }}
              >
                Live Board
              </h1>
            </div>
          </div>

          {/* Center / Middle: Single Total Pending Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '12px',
                background: isDark ? 'rgba(255, 107, 26, 0.08)' : 'rgba(255, 107, 26, 0.06)',
                border: isDark ? '1px solid rgba(255, 107, 26, 0.28)' : '1.5px solid rgba(255, 107, 26, 0.22)',
                fontSize: '0.86rem'
              }}
            >
              <IoTimeOutline size={16} style={{ color: '#FF6B1A' }} />
              <span style={{ color: isDark ? '#E2E8F0' : '#475569', fontWeight: 750 }}>Total Pending:</span>
              <span style={{ fontWeight: 900, color: '#FF6B1A', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                {formatCurrency(stats.pendingVal)}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fetchLiveOrders()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '36px',
                padding: '0 12px',
                borderRadius: '12px',
                fontSize: '0.80rem',
                fontWeight: 750,
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
                background: isDark ? '#16171B' : '#FFFFFF',
                color: isDark ? '#94A3B8' : '#64748B',
                cursor: 'pointer'
              }}
              title="Refresh Live Board"
            >
              <IoRefreshOutline size={15} /> Sync
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 107, 26, 0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              <IoAdd size={16} /> New Bill
            </button>
          </div>
        </div>

        {/* ─── Search & Actions Bar ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '40px',
              padding: '0 14px',
              borderRadius: '12px',
              background: isDark ? '#16171B' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #CBD5E1',
              color: isDark ? '#94A3B8' : '#64748B',
              minWidth: '280px',
              maxWidth: '400px',
              flex: 1
            }}
          >
            <IoSearchOutline size={17} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search token, table, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: isDark ? '#FFFFFF' : '#0F172A',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Merge Selected Action */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {selectedIds.size >= 2 && (
              <button
                type="button"
                onClick={handleMergeSelected}
                style={{
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
                }}
              >
                <IoGitMergeOutline size={16} /> Merge Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* ─── Order Board Drag-and-Drop Canvas ─── */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '60px 30px',
                textAlign: 'center',
                background: isDark ? '#16171B' : '#FFFFFF',
                border: isDark ? '2px dashed rgba(255, 255, 255, 0.08)' : '2px dashed #CBD5E1',
                borderRadius: '24px',
                color: isDark ? '#94A3B8' : '#64748B',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <IoReceiptOutline size={48} style={{ opacity: 0.3 }} />
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#FFFFFF' : '#0F172A' }}>
                No active orders matching this filter
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '400px' }}>
                Create bills or mark them as pending on the Billing screen to track and manage them live here.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  marginTop: '6px',
                  padding: '8px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#FF6B1A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                + Create New Bill
              </button>
            </div>
          ) : (
            <div className="live-board-grid">
              {filteredItems.map((item) => {
                const memberBills = item.isGroup
                  ? (item.member_bill_ids || [])
                      .map((id) => bills.find((b) => b.id === id))
                      .filter(Boolean)
                  : [];

                return (
                  <DraggableOrderCard
                    key={item.isGroup ? `g-${item.id}` : `b-${item.id}`}
                    order={item}
                    isMergedGroup={item.isGroup}
                    isSelected={selectedIds.has(item.isGroup ? `g-${item.id}` : `b-${item.id}`)}
                    onToggleSelect={handleToggleSelect}
                    onSettleClick={handleOpenSettle}
                    onSplitClick={(grp) => setSplitModalGroup(grp)}
                    onPrintClick={(b) => printerService.printBill(b)}
                    isDark={isDark}
                    memberBills={memberBills}
                  />
                );
              })}
            </div>
          )}
        </DndContext>

        {/* ─── Merge Confirmation Modal (24px Obsidian Glass) ─── */}
        {mergeModalData && (
          <div className="live-modal-overlay">
            <div
              className="live-modal-dialog"
              style={{
                background: isDark ? '#16171B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850, display: 'flex', alignItems: 'center', gap: '8px', color: '#FF6B1A' }}>
                  <IoGitMergeOutline size={20} />
                  Confirm Table / Order Merge
                </h3>
                <button
                  type="button"
                  onClick={() => setMergeModalData(null)}
                  style={{ background: 'none', border: 'none', color: isDark ? '#94A3B8' : '#64748B', cursor: 'pointer' }}
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.84rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                Merging these orders collapses them into one unified card. Both Paid and Pending amounts are preserved.
              </p>

              <table className="merge-table-comparison">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {mergeModalData.billIds.map((bid) => {
                    const b = bills.find((x) => x.id === bid);
                    if (!b) return null;
                    return (
                      <tr key={bid}>
                        <td>Token #{b.today_token || b.bill_no} ({b.table_no ? `T${b.table_no}` : 'Takeaway'})</td>
                        <td style={{ color: '#10B981', fontWeight: 750 }}>{formatCurrency(b.amount_paid || 0)}</td>
                        <td style={{ color: '#F59E0B', fontWeight: 750 }}>{formatCurrency(b.amount_pending || 0)}</td>
                        <td style={{ fontWeight: 850 }}>{formatCurrency(b.total_amount || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMergeModalData(null)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
                    background: isDark ? '#1C1D22' : '#F1F5F9',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmMerge}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF6B1A 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 107, 26, 0.35)'
                  }}
                >
                  {actionLoading ? 'Merging...' : 'Confirm & Merge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Settle Modal (24px Obsidian Glass) ─── */}
        {settleModalData && (
          <div className="live-modal-overlay">
            <div
              className="live-modal-dialog"
              style={{
                background: isDark ? '#16171B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850, display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                  <IoCashOutline size={20} />
                  Settle Payment
                </h3>
                <button
                  type="button"
                  onClick={() => setSettleModalData(null)}
                  style={{ background: 'none', border: 'none', color: isDark ? '#94A3B8' : '#64748B', cursor: 'pointer' }}
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              <div style={{ padding: '12px 16px', borderRadius: '14px', background: isDark ? '#1C1D22' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', color: isDark ? '#94A3B8' : '#64748B', fontWeight: 700 }}>Due Balance to Settle:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace' }}>
                  {formatCurrency(settleModalData.order.amount_pending || settleModalData.order.total_amount)}
                </span>
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'CASH', label: 'Cash', icon: <IoCashOutline size={16} /> },
                    { id: 'ONLINE', label: 'UPI / QR', icon: <IoQrCodeOutline size={16} /> },
                    { id: 'CARD', label: 'Card', icon: <IoCardOutline size={16} /> }
                  ].map((m) => {
                    const isSelected = settlePayments[0]?.method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const amt = settleModalData.order.amount_pending || settleModalData.order.total_amount;
                          setSettlePayments([{ method: m.id, amount: amt }]);
                        }}
                        style={{
                          height: '42px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #10B981' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
                          background: isSelected ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : isDark ? '#1C1D22' : '#F8FAFC',
                          color: isSelected ? '#10B981' : isDark ? '#94A3B8' : '#64748B',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSettleModalData(null)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
                    background: isDark ? '#1C1D22' : '#F1F5F9',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmSettle}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {actionLoading ? 'Settling...' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Split Confirmation Modal ─── */}
        {splitModalGroup && (
          <div className="live-modal-overlay">
            <div
              className="live-modal-dialog"
              style={{
                background: isDark ? '#16171B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1.5px solid #CBD5E1',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 850, display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                <IoArrowUndoOutline size={20} />
                Split Merged Table Group?
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: isDark ? '#94A3B8' : '#64748B' }}>
                This will un-merge the group and restore all individual order cards back to the board.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSplitModalGroup(null)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1.5px solid #CBD5E1',
                    background: isDark ? '#1C1D22' : '#F1F5F9',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmSplit}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#F59E0B',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: actionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {actionLoading ? 'Splitting...' : 'Yes, Split Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
