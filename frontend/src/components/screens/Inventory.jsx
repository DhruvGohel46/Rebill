import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAPI, productsAPI, handleAPIError } from '../../api/api';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';
import GlobalSelect from '../ui/GlobalSelect';
import SearchBar from '../ui/SearchBar';
import '../../styles/Inventory.css';

// --- Icons ---
// --- Icons ---

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const ArchiveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const InventoryStats = ({ metrics }) => {
    const { isDark } = useTheme();

    const items = [
        { label: 'Total Products', value: metrics.totalItems, color: '#3B82F6' },
        { label: 'Low Stock', value: metrics.lowStock, color: metrics.lowStock > 0 ? '#F59E0B' : '#10B981' },
        { label: 'Inventory Value', value: `₹${metrics.totalValue.toLocaleString()}`, color: '#10B981' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="invStatsBar"
        >
            {items.map((item, i) => (
                <React.Fragment key={item.label}>
                    {i > 0 && <div className="invStatDivider" />}
                    <div className="invStatItem">
                        <div className="invStatDot" style={{ backgroundColor: item.color }} />
                        <span className="invStatLabel">{item.label}</span>
                        <span className="invStatValue">{item.value}</span>
                    </div>
                </React.Fragment>
            ))}
        </motion.div>
    );
};

const Inventory = () => {
    const { showSuccess, showError, showWarning, showConfirm } = useAlert();
    const { isDark } = useTheme();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        type: 'DIRECT_SALE',
        unit: 'piece',
        stock: 0,
        unit_price: 0,
        alert_threshold: 10,
        product_id: ''
    });

    useEffect(() => {
        loadInventory();
        loadProducts();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const res = await inventoryAPI.getAllInventory();
            setItems(res.data.inventory || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await productsAPI.getAllProducts({ include_inactive: true });
            setProducts(res.data.products || []);
        } catch (err) {
            console.error(err);
        }
    };

    // Metrics
    const metrics = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter(i => i.stock <= i.alert_threshold && i.stock > 0).length;
        const totalValue = items.reduce((acc, curr) => {
            // Basic estimate: for raw items use unit_price, for direct use product price
            let price = curr.unit_price || 0;
            if (curr.type === 'DIRECT_SALE' && curr.product_id) {
                const p = products.find(x => x.product_id === curr.product_id);
                if (p) price = p.price;
            }
            return acc + (curr.stock * price);
        }, 0);
        return { totalItems, lowStock, totalValue };
    }, [items, products]);

    // Filtering & Sorting
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'ALL' || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [items, searchTerm, filterType]);

    // Handlers
    const handleAddClick = () => {
        setSelectedItem(null);
        resetForm();
        setShowAddModal(true);
    };

    const handleRowClick = (item) => {
        if (item.is_locked) {
            showWarning('Item is locked (inactive product).');
            return;
        }
        setSelectedItem(item);
        setFormData({
            name: item.name,
            type: item.type,
            unit: item.unit,
            stock: item.stock,
            unit_price: item.unit_price || 0,
            alert_threshold: item.alert_threshold,
            product_id: item.product_id || ''
        });
        setShowAddModal(true);
    };

    const handleQuickStock = async (e, item, amount) => {
        e.stopPropagation(); // prevent row click
        if (item.is_locked) return;

        try {
            await inventoryAPI.adjustStock(item.id, amount);
            showSuccess('Stock updated');
            loadInventory();
        } catch (err) {
            showError('Failed to update stock');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const confirmed = await showConfirm({
            title: 'Delete Inventory Item',
            description: 'This item will be permanently removed from your inventory.',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            variant: 'danger',
        });
        if (!confirmed) return;
        try {
            await inventoryAPI.deleteInventory(id);
            showSuccess('Item deleted');
            loadInventory();
        } catch (err) {
            showError('Failed to delete');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let payload = { ...formData };
            // Name sync logic
            if (payload.type === 'DIRECT_SALE' && payload.product_id) {
                const p = products.find(x => x.product_id === payload.product_id);
                if (p) payload.name = p.name;
            }

            if (selectedItem) {
                await inventoryAPI.updateInventory(selectedItem.id, payload);
                showSuccess('Inventory updated');
            } else {
                await inventoryAPI.createInventory(payload);
                showSuccess('Inventory created');
            }
            setShowAddModal(false);
            loadInventory();
        } catch (err) {
            showError('Failed to save');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'DIRECT_SALE',
            unit: 'piece',
            stock: 0,
            unit_price: 0,
            alert_threshold: 10,
            product_id: ''
        });
    };

    // Render Helpers
    const getStockColor = (item) => {
        if (item.stock <= 0) return '#ef4444'; // Red
        if (item.stock <= item.alert_threshold) return '#f59e0b'; // Orange
        return '#22c55e'; // Green
    };

    return (
        <div className="invPage">
            <div className="invPageInner">

                {/* 1. Header Section */}
                {/* Note: In standard layout, header might be global, but for this contained module feel we put title here */}
                {/* If App.jsx has a header, we can hide this or integrate it. Assuming standalone feel for now. */}


                {/* 3. Main Container */}
                <motion.div
                    className="invMainContainer"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header Controls */}
                    <div className="invHeaderSection">
                        <div className="invTitleBlock">
                            <div className="invPageTitle">Inventory Management</div>
                            <div className="invPageDesc">Manage and track your stock levels</div>
                        </div>

                        <div className="invControlsRow">
                            <div style={{ width: '300px' }}>
                                <SearchBar
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    placeholder="Search inventory..."
                                />
                            </div>

                            <button className="invAddButton" onClick={handleAddClick}>
                                <PlusIcon /> Add Product
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar Integrated */}
                    <InventoryStats metrics={metrics} />

                    {/* Table */}
                    <div className="invTableWrapper">
                        <table className="invTable">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Product Name</th>
                                    <th style={{ width: '20%' }}>Stock Level</th>
                                    <th style={{ width: '25%' }}>Health</th>
                                    <th style={{ width: '10%' }}>Status</th>
                                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="invEmptyState">
                                                <div className="invEmptyIcon">📦</div>
                                                <h3>No inventory found</h3>
                                                <p>Try adjusting your search or add a new item.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <motion.tr
                                            key={item.id}
                                            className="invTableRow"
                                            onClick={() => handleRowClick(item)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <td>
                                                <div className="invProductName">{item.name}</div>
                                                <div className="invProductTag">
                                                    {item.type === 'DIRECT_SALE' ? 'DIRECT SALE' : 'MATERIAL'}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{item.stock}</span>
                                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{item.unit}s</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="invStockBarBG">
                                                    <motion.div
                                                        className="invStockBarFill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((item.stock / (item.max_stock_history || 100)) * 100, 100)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        style={{ backgroundColor: getStockColor(item) }}
                                                    />
                                                </div>
                                                {item.stock <= item.alert_threshold && (
                                                    <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                                                        Low Stock Alert
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`invBadge ${item.product_status === 'inactive' ? 'inactive' : 'active'}`}>
                                                    {item.product_status === 'inactive' ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="invActionGroup" style={{ justifyContent: 'flex-end', display: 'flex', gap: '4px' }}>
                                                    <button
                                                        className="invActionBtn"
                                                        onClick={(e) => handleQuickStock(e, item, -1)}
                                                        title="Quick Reduce -1"
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        className="invActionBtn"
                                                        onClick={(e) => handleQuickStock(e, item, 1)}
                                                        title="Quick Add +1"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        className="invActionBtn"
                                                        onClick={(e) => handleDelete(e, item.id)}
                                                        title="Delete"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="invFooter">
                        <span>Showing {filteredItems.length} products</span>
                        <span>All systems normal</span>
                    </div>
                </motion.div>
            </div>

            {/* Modal - Keeping simple structure for now, matching style would be ideal but functionally robust */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="invModalOverlay">
                        <motion.div
                            className="invModal card-zoom"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="invModalHeader">
                                <span className="invModalTitle">{selectedItem ? 'Edit Inventory' : 'Add Inventory'}</span>
                                <button className="invActionBtn" onClick={() => setShowAddModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleSave} className="invModalBody">
                                {/* Basic Form Fields */}
                                <div className="invFormGroup">
                                    <GlobalSelect
                                        label="Type"
                                        value={formData.type}
                                        onChange={(val) => setFormData({ ...formData, type: val })}
                                        options={[
                                            { label: 'Direct Sale Product', value: 'DIRECT_SALE' },
                                            { label: 'Raw Material', value: 'RAW_MATERIAL' }
                                        ]}
                                    />
                                </div>

                                {formData.type === 'DIRECT_SALE' ? (
                                    <div className="invFormGroup">
                                        <GlobalSelect
                                            label="Select Product"
                                            value={formData.product_id}
                                            onChange={(val) => setFormData({ ...formData, product_id: val })}
                                            options={products.filter(p => p.active).map(p => ({ label: p.name, value: p.product_id }))}
                                            placeholder="-- Select --"
                                        />
                                    </div>
                                ) : (
                                    <div className="invFormGroup">
                                        <label className="invLabel">Item Name</label>
                                        <input
                                            className="invInput"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="invFormGroup">
                                        <label className="invLabel">Current Stock</label>
                                        <input
                                            type="number"
                                            className="invInput"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="invFormGroup">
                                        <GlobalSelect
                                            label="Unit"
                                            value={formData.unit}
                                            onChange={(val) => setFormData({ ...formData, unit: val })}
                                            direction="top"
                                            options={[
                                                { label: 'Piece', value: 'piece' },
                                                { label: 'Kg', value: 'kg' },
                                                { label: 'Litre', value: 'litre' },
                                                { label: 'Packet', value: 'packet' },
                                                { label: 'Box', value: 'box' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div className="invFormGroup">
                                    <label className="invLabel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Low Stock Alert
                                        <span style={{
                                            background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
                                            color: isDark ? '#fbbf24' : '#d97706',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {formData.alert_threshold} units
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={formData.alert_threshold}
                                        onChange={e => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            height: '6px',
                                            background: isDark ? '#334155' : '#e2e8f0',
                                            borderRadius: '3px',
                                            accentColor: '#f59e0b',
                                            cursor: 'pointer',
                                            marginTop: '8px',
                                            appearance: 'auto'
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: isDark ? '#64748b' : '#94a3b8' }}>
                                        <span>1</span>
                                        <span>50</span>
                                        <span>100</span>
                                    </div>
                                </div>

                                <div className="invModalFooter" style={{ marginTop: '24px' }}>
                                    <button type="button" className="invBtn" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="invPrimaryBtn">Save Changes</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inventory;
