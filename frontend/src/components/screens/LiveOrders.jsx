import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import {
  IoReceiptOutline,
  IoPrintOutline,
  IoGitMergeOutline,
  IoCheckmarkDoneOutline,
  IoCloseOutline,
  IoRefreshOutline,
  IoTimeOutline,
  IoRestaurantOutline,
  IoBagHandleOutline,
  IoFlashOutline,
  IoArrowUndoOutline,
  IoCashOutline,
  IoCardOutline,
  IoQrCodeOutline
} from 'react-icons/io5';
import Button from '../ui/Button';
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

  // Combine refs
  const setCombinedRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: isDragging ? 0.7 : 1,
      }
    : undefined;

  const paymentStatus = order.payment_status || (order.amount_pending === 0 ? 'paid' : 'pending');
  const isPending = (order.amount_pending || 0) > 0;
  const isPaid = (order.amount_pending || 0) === 0;

  return (
    <div
      ref={setCombinedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`order-card status-${paymentStatus} ${isMergedGroup ? 'is-merged' : ''} ${
        isOver ? 'drag-over' : ''
      } ${isSelected ? 'selected' : ''}`}
    >
      {/* Header Info */}
      <div className="order-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(order.id, isMergedGroup);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#F97316' }}
          />
          {isMergedGroup ? (
            <span className="merged-badge">
              <IoGitMergeOutline style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Merged ({order.member_bill_ids?.length || 0})
            </span>
          ) : (
            <span className="token-pill">
              Token #{order.today_token || order.bill_no}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {order.order_type === 'takeaway' ? (
            <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', color: '#F59E0B' }}>
              <IoBagHandleOutline size={13} /> Takeaway
            </span>
          ) : (
            <span className="table-tag">
              <IoRestaurantOutline size={13} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
              {order.table_no ? `Table ${order.table_no}` : 'Dine-In'}
            </span>
          )}
        </div>
      </div>

      {/* Customer / Note */}
      {order.customer_name && (
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #94A3B8)' }}>
          👤 {order.customer_name}
        </div>
      )}

      {/* Amounts Breakdown Box */}
      <div className="amount-row-container">
        <div className="amount-split-line">
          <span>Collected (Paid):</span>
          <span className="paid-val">{formatCurrency(order.amount_paid || 0)}</span>
        </div>
        <div className="amount-split-line">
          <span>Pending:</span>
          <span className="pending-val">{formatCurrency(order.amount_pending || 0)}</span>
        </div>
        <div className="amount-total-line">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94A3B8)' }}>Total:</span>
          <span>{formatCurrency(order.total_amount || 0)}</span>
        </div>
      </div>

      {/* Items Preview */}
      {!isMergedGroup && order.items && order.items.length > 0 && (
        <div className="card-items-preview">
          {order.items.map((item, idx) => (
            <div key={idx} className="card-item-row">
              <span>{item.quantity}x {item.name || item.product_name}</span>
              <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="order-card-actions" onPointerDown={(e) => e.stopPropagation()}>
        {isPending ? (
          <button
            type="button"
            className="action-btn-settle"
            onClick={() => onSettleClick(order, isMergedGroup)}
          >
            <IoCheckmarkDoneOutline size={16} /> Settle ₹{(order.amount_pending || 0).toFixed(2)}
          </button>
        ) : (
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 800, padding: '6px 0' }}>
            ✓ Settled & Paid
          </div>
        )}

        {isMergedGroup ? (
          <button
            type="button"
            className="action-btn-icon"
            title="Un-merge orders"
            onClick={() => onSplitClick(order)}
          >
            <IoArrowUndoOutline size={15} color="#EF4444" />
          </button>
        ) : (
          <button
            type="button"
            className="action-btn-icon"
            title="Print receipt / KOT"
            onClick={() => onPrintClick(order)}
          >
            <IoPrintOutline size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main LiveOrders Screen ──────────────────────────────────────────────────
export default function LiveOrders() {
  const { isDark } = useTheme();
  const { showSuccess, showWarning, showError } = useAlert();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [mergeGroups, setMergeGroups] = useState([]);
  const [versionHash, setVersionHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'merged' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals state
  const [mergeModalData, setMergeModalData] = useState(null); // { source, target } or { billsToMerge }
  const [settleModalData, setSettleModalData] = useState(null); // { order, isMergedGroup }
  const [settlePayments, setSettlePayments] = useState([{ method: 'CASH', amount: 0 }]);
  const [splitModalGroup, setSplitModalGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag distance before triggering drag
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
    } finally {
      setLoading(false);
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

    // Grouped bill IDs so we don't double count
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

    return { totalVal, paidVal, pendingVal, openOrdersCount };
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

    // Filter chip
    if (activeFilter === 'pending') {
      all = all.filter((item) => (item.amount_pending || 0) > 0);
    } else if (activeFilter === 'merged') {
      all = all.filter((item) => item.isGroup);
    } else if (activeFilter === 'paid') {
      all = all.filter((item) => (item.amount_pending || 0) === 0);
    }

    // Search query
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
  }, [bills, mergeGroups, activeFilter, searchQuery]);

  // ── Drag & Drop Merge Handler ──
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceData = active.data.current;
    const targetData = over.data.current;

    if (!sourceData || !targetData) return;

    // Collect all bill IDs from both cards
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

    // Open confirmation modal with preview
    setMergeModalData({
      source: sourceData.order,
      target: targetData.order,
      billIds,
    });
  };

  // ── Confirm Merge API Call ──
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

  // ── Confirm Settle API Call ──
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
        // Standalone bill settle: merge it or update payment
        // We can create a 1-item merge group or settle directly
        await billingAPI.mergeOrders([settleModalData.order.id, settleModalData.order.id]).then(r => {
          return billingAPI.settleMergeGroup(r.data.merge_group.id, settlePayments);
        });
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

  // ── Split (Un-merge) API Call ──
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

  // ── Multi-select toggle ──
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
      } else if (key.startsWith('b-')) {
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
    <div className="live-orders-container">
      {/* ── Top Header ── */}
      <div className="live-header">
        <div className="live-title-area">
          <div className="live-pulse-dot" />
          <h1 className="live-title">Live Orders</h1>
          <button
            type="button"
            className="action-btn-icon"
            onClick={() => fetchLiveOrders()}
            title="Refresh Live Orders"
          >
            <IoRefreshOutline size={18} />
          </button>
        </div>

        {/* Top KPIs */}
        <div className="live-stats-bar">
          <div className="stat-badge total">
            <span>Orders:</span>
            <span className="stat-val">{stats.openOrdersCount}</span>
          </div>
          <div className="stat-badge paid">
            <span>Collected:</span>
            <span className="stat-val">{formatCurrency(stats.paidVal)}</span>
          </div>
          <div className="stat-badge pending">
            <span>Pending:</span>
            <span className="stat-val">{formatCurrency(stats.pendingVal)}</span>
          </div>
          <div className="stat-badge total">
            <span>Total:</span>
            <span className="stat-val">{formatCurrency(stats.totalVal)}</span>
          </div>
        </div>
      </div>

      {/* ── Filter Chips & Action Controls ── */}
      <div className="live-controls-row">
        <div className="live-filter-chips">
          {['all', 'pending', 'merged', 'paid'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedIds.size >= 2 && (
            <Button
              variant="primary"
              onClick={handleMergeSelected}
              icon={<IoGitMergeOutline size={16} />}
              style={{ height: '36px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800 }}
            >
              Merge Selected ({selectedIds.size})
            </Button>
          )}

          <input
            type="text"
            className="live-search-input"
            placeholder="🔍 Search token, table, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Order Board Drag-and-Drop Canvas ── */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {filteredItems.length === 0 ? (
          <div className="live-empty-state">
            <IoReceiptOutline size={48} style={{ opacity: 0.3 }} />
            <h3 style={{ margin: 0, fontWeight: 700 }}>No live orders matching filter</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Create bills or mark them as pending to view them live on this board.
            </p>
          </div>
        ) : (
          <div className="live-board-grid">
            {filteredItems.map((item) => (
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
              />
            ))}
          </div>
        )}
      </DndContext>

      {/* ── Merge Confirmation Modal ── */}
      {mergeModalData && (
        <div className="live-modal-overlay">
          <div className="live-modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="live-modal-title">
                <IoGitMergeOutline style={{ verticalAlign: 'middle', marginRight: '6px', color: '#F97316' }} />
                Confirm Order Merge
              </h3>
              <button
                type="button"
                className="action-btn-icon"
                onClick={() => setMergeModalData(null)}
              >
                <IoCloseOutline size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #94A3B8)' }}>
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
                      <td style={{ color: '#10B981' }}>{formatCurrency(b.amount_paid || 0)}</td>
                      <td style={{ color: '#F59E0B' }}>{formatCurrency(b.amount_pending || 0)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(b.total_amount || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setMergeModalData(null)}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 700 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={actionLoading}
                onClick={handleConfirmMerge}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 800 }}
              >
                {actionLoading ? 'Merging...' : 'Confirm & Merge'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settle Modal ── */}
      {settleModalData && (
        <div className="live-modal-overlay">
          <div className="live-modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="live-modal-title">
                <IoCheckmarkDoneOutline style={{ verticalAlign: 'middle', marginRight: '6px', color: '#10B981' }} />
                Settle Payment
              </h3>
              <button
                type="button"
                className="action-btn-icon"
                onClick={() => setSettleModalData(null)}
              >
                <IoCloseOutline size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Amount to Settle:</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#F59E0B', fontFamily: 'monospace' }}>
                  {formatCurrency(settleModalData.order.amount_pending || settleModalData.order.total_amount || 0)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'CASH', label: 'Cash', icon: <IoCashOutline size={16} /> },
                  { id: 'UPI', label: 'UPI / QR', icon: <IoQrCodeOutline size={16} /> },
                  { id: 'CARD', label: 'Card', icon: <IoCardOutline size={16} /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSettlePayments([{ method: m.id, amount: settleModalData.order.amount_pending }])}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: settlePayments[0]?.method === m.id ? '2px solid #10B981' : '1px solid var(--glass-border)',
                      background: settlePayments[0]?.method === m.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSettleModalData(null)}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 700 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={actionLoading}
                onClick={handleConfirmSettle}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 800, background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                {actionLoading ? 'Processing...' : 'Complete Settlement'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Split (Un-merge) Confirmation Modal ── */}
      {splitModalGroup && (
        <div className="live-modal-overlay">
          <div className="live-modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="live-modal-title" style={{ color: '#EF4444' }}>
                <IoArrowUndoOutline style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Un-merge Group
              </h3>
              <button
                type="button"
                className="action-btn-icon"
                onClick={() => setSplitModalGroup(null)}
              >
                <IoCloseOutline size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #94A3B8)' }}>
              Are you sure you want to un-merge this group? The member bills will separate back into individual cards on the board.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setSplitModalGroup(null)}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 700 }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={actionLoading}
                onClick={handleConfirmSplit}
                style={{ height: '42px', borderRadius: '10px', fontWeight: 800 }}
              >
                {actionLoading ? 'Splitting...' : 'Un-merge Group'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
