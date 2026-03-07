/**
 * =============================================================================
 * POINT OF SALE / BILLING INTERFACE - BILL.JSX
 * =============================================================================
 * 
 * ROLE: Main Point of Sale (POS) system for product billing and order management
 * 
 * RESPONSIBILITIES:
 * - Product catalog display with category filtering
 * - Shopping cart management and order processing
 * - Bill creation with multiple payment options
 * - Real-time order calculations and tax handling
 * - Product search and selection interface
 * - Print and save bill functionality
 * 
 * KEY FEATURES:
 * - Product grid with hover effects and category indicators
 * - Dynamic shopping cart with add/remove/update operations
 * - Multiple payment methods (Cash, Card, UPI)
 * - Real-time total calculations with tax
 * - Bill printing and saving capabilities
 * - Responsive design for tablets and desktops
 * 
 * COMPONENTS:
 * - ProductCard: Individual product display with hover effects
 * - ShoppingCart: Order management interface
 * - PaymentModal: Payment method selection
 * - BillPreview: Bill preview before printing
 * 
 * STATE MANAGEMENT:
 * - orderItems: Current shopping cart items
 * - selectedCategory: Active product category filter
 * - searchQuery: Product search functionality
 * - paymentMethod: Selected payment option
 * 
 * API INTEGRATION:
 * - productsAPI: Product catalog management
 * - billingAPI: Bill creation and management
 * - formatCurrency: Currency formatting utility
 * 
 * DESIGN PATTERNS:
 * - Functional component with multiple hooks
 * - Event-driven architecture for user interactions
 * - Theme-aware styling with hover states
 * - Framer Motion animations for interactions
 * - Responsive grid layout for products
 * 
 * USER WORKFLOW:
 * 1. Select products from catalog
 * 2. Add to shopping cart
 * 3. Review order and select payment method
 * 4. Create and save/print bill
 * 5. Auto-navigate back to products
 * =============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useAlert } from '../../context/AlertContext';
import { productsAPI, billingAPI, categoriesAPI } from '../../utils/api';
import { handleAPIError, formatCurrency } from '../../utils/api';
import { CATEGORY_COLORS } from '../../utils/constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import SearchBar from '../ui/SearchBar';
import '../../styles/Management.css';




const TrashIcon = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
    <path d="M3 6H5H21M8 6V20C8 21.1046 8.89543 22 10 22H14C15.1046 22 16 21.1046 16 20V6M19 6V20C19 21.1046 19.1046 22 18 22H10C8.89543 22 8 21.1046 8 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11L14 11M10 15L14 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WorkingPOSInterface = ({ onBillCreated }) => {
  const { currentTheme, isDark } = useTheme();
  const { settings } = useSettings();
  const showImages = settings?.show_product_images !== 'false';
  const { showSuccess } = useAlert();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'All Items' }]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit Mode State
  const location = useLocation();
  const navigate = useNavigate();
  const [editingBill, setEditingBill] = useState(null);

  // Ref to prevent multiple rapid clicks
  const lastClickTime = useRef(0);

  useEffect(() => {
    loadProducts();
    loadCategories();

    // Check for edit mode
    if (location.state?.bill) {
      const bill = location.state.bill;
      setEditingBill(bill);
      setOrderItems(bill.items || []);
    }
  }, [location.state]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      // Request stock data for alerts
      const response = await productsAPI.getAllProducts({ include_stock: true });
      setProducts(response.data.products || []);
    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAllCategories();
      const dynamicCategories = response.data.categories || [];
      setCategories([
        { id: 'all', name: 'All Items' },
        ...dynamicCategories.map(c => ({ id: c.id, name: c.name }))
      ]);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'all' ||
      product.category_id === selectedCategory ||
      product.category === selectedCategory;
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleAddItem = (product, event) => {
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (product.stock_status === 'Out of Stock') return;

    const now = Date.now();

    // Prevent multiple clicks within 200ms
    if (now - lastClickTime.current < 200) {
      return;
    }

    lastClickTime.current = now;

    setOrderItems(prev => {
      const existingIndex = prev.findIndex(item => item.product_id === product.product_id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.product_id !== productId));
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.product_id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add items to the order');
      return;
    }

    try {
      setError('');

      const billData = {
        products: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        print: false,
        customer_name: editingBill ? editingBill.customer_name : ''
      };

      if (editingBill) {
        await billingAPI.updateBill(editingBill.bill_no, billData);
        showSuccess('Bill updated successfully');
        navigate('/analytics');
      } else {
        const response = await billingAPI.createBill(billData);
        setOrderItems([]);
        if (onBillCreated) {
          onBillCreated({
            bill_no: response.data.bill.bill_no,
            total: calculateTotal()
          });
        }
        // Refresh stock levels
        loadProducts();
      }

    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const handleSaveAndPrintOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add items to the order');
      return;
    }

    try {
      setError('');

      const billData = {
        products: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        print: true,
        customer_name: editingBill ? editingBill.customer_name : ''
      };

      if (editingBill) {
        await billingAPI.updateBill(editingBill.bill_no, billData);
        // Print logic for update if needed - assumed API handles it if 'print: true' or separate call
        // But backend update_bill doesn't seem to have print logic integrated yet in previous step.
        // Wait, update_bill method in backend didn't handle printing. 
        // So for "Update & Print", we might need to call print separately.

        await billingAPI.printBill(editingBill.bill_no); // Call print explicitly

        showSuccess('Bill updated and printed');
        navigate('/analytics');
      } else {
        const response = await billingAPI.createBill(billData);
        setOrderItems([]);
        if (onBillCreated) {
          onBillCreated({
            bill_no: response.data.bill.bill_no,
            total: calculateTotal()
          });
        }
        // Refresh stock levels
        loadProducts();
      }

    } catch (err) {
      const apiError = handleAPIError(err);
      setError(apiError.message);
    }
  };

  const handleClearClick = () => {
    if (orderItems.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const confirmClear = () => {
    setOrderItems([]);
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  const mainContainerStyle = {
    display: 'flex',
    height: '100%',
    backgroundColor: 'transparent', // Allow global background to show through
    fontFamily: currentTheme.typography.fontFamily.primary,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const leftSidebarStyle = {
    width: '240px', // Slightly wider for better text fit
    backgroundColor: 'var(--glass-sidebar)',
    borderRight: '1px solid var(--glass-border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    zIndex: 2,
  };

  const middleSectionStyle = {
    flex: 1,
    padding: currentTheme.spacing[6],
    overflowY: 'auto',
    height: '100%',
    backgroundColor: currentTheme.colors.background, // Global background
  };

  // rightSectionStyle is unused now as we inlined it to fix nesting, but keeping for safety if referenced elsewhere or cleanup later.
  const rightSectionStyle = {
    width: '400px',
    backgroundColor: currentTheme.colors.surface,
    borderLeft: `1px solid ${currentTheme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  return (
    <div style={mainContainerStyle}>
      <div style={leftSidebarStyle}>
        <div style={{
          padding: 'var(--spacing-5)',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search items..."
          />
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--spacing-3)',
        }}>
          <h4 style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-3)',
            paddingLeft: 'var(--spacing-2)',
            fontWeight: 'var(--font-semibold)'
          }}>Categories</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  whileHover={!isActive ? { 
                    backgroundColor: 'var(--glass-card)',
                    transform: 'translateX(4px)'
                  } : {
                    transform: 'translateX(2px)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg liquid-glass-card"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    padding: '0 var(--spacing-3)',
                    backgroundColor: isActive ? 'var(--primary-500)' : 'transparent',
                    border: isActive ? '1px solid var(--primary-500)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-normal) var(--ease-out)',
                    textAlign: 'left',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '12px',
                        bottom: '12px',
                        width: '4px',
                        backgroundColor: 'var(--text-inverse)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      }}
                    />
                  )}

                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--text-inverse)' : 'var(--glass-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? 'var(--primary-500)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    transition: 'all var(--transition-normal) var(--ease-out)',
                    border: isActive ? '2px solid var(--text-inverse)' : '1px solid var(--glass-border)',
                    boxShadow: isActive ? 'none' : 'var(--shadow-button)',
                  }}>
                    {category.name.charAt(0)}
                  </div>

                  <span style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  }}>
                    {category.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={middleSectionStyle}>
        <div style={{
          padding: 0, // Handled by Grid gap
          minHeight: 'calc(100% - 1rem)',
        }}>
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: currentTheme.spacing[4],
            }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  height: '240px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  borderRadius: '16px',
                  animation: 'pulse 1.5s infinite'
                }} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: currentTheme.spacing[12],
              color: currentTheme.colors.text.secondary,
              height: '100%',
              textAlign: 'center'
            }}>
              {/* Empty State - Same as before but cleaner */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: currentTheme.colors.text.primary, marginBottom: '8px' }}>
                No products found
              </h3>
              <p style={{ fontSize: '14px', color: currentTheme.colors.text.secondary }}>
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, staggerChildren: 0.05 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: currentTheme.spacing[4],
                paddingBottom: currentTheme.spacing[8],
              }}
            >
              {filteredProducts.map((product) => (
                <Card
                  key={product.product_id}
                  hover={true}
                  padding="none"
                  onClick={(e) => handleAddItem(product, e)}
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: product.stock_status === 'Out of Stock' ? 'not-allowed' : 'pointer',
                    opacity: product.stock_status === 'Out of Stock' ? 0.6 : 1,
                  }}
                >
                  <div style={{ padding: '14px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Image Container - Human Quality */}
                    <div style={{
                      aspectRatio: '1/1', // Square
                      width: '100%',
                      marginBottom: '14px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F6F7F9',
                      padding: '18px', // Breathing space
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {product.stock_status === 'Out of Stock' && (
                        <div style={{
                          position: 'absolute', top: '8px', left: '8px',
                          backgroundColor: '#EF4444', color: 'white',
                          fontSize: '10px', fontWeight: 700,
                          padding: '4px 8px', borderRadius: '4px', zIndex: 10
                        }}>OUT</div>
                      )}

                      {product.image_filename ? (
                        <img
                          src={productsAPI.getImageUrl(product.image_filename)}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: currentTheme.colors.text.muted }}>No Image</span>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: currentTheme.colors.text.primary,
                        margin: '0 0 4px 0',
                        lineHeight: 1.3,
                      }}>
                        {product.name}
                      </h4>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#FF6A00', // Signature Orange
                        }}>
                          {formatCurrency(product.price)}
                        </span>

                        {/* Add Button - Signature Element */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          style={{
                            width: '32px', height: '32px',
                            backgroundColor: '#FF6A00',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(255,106,0,0.3)',
                            color: 'white'
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div style={{
        width: '400px',
        backgroundColor: isDark ? '#15161A' : '#FFFFFF', // Secondary Surface
        borderLeft: `1px solid ${currentTheme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.06)', // Depth to split screen
        zIndex: 5
      }}>
        <div style={{
          flex: 1,
          padding: currentTheme.spacing[4],
          overflowY: 'auto',
          // No border bottom here, we want it clean
        }}>
          {/* Header for Right Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: currentTheme.spacing[4],
            paddingBottom: currentTheme.spacing[3],
            borderBottom: `1px solid ${currentTheme.colors.border}`,
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.colors.text.primary,
            }}>
              {editingBill ? `Editing #${editingBill.bill_no}` : 'Current Bill'}
              <span style={{ fontSize: '13px', color: currentTheme.colors.text.tertiary, fontWeight: 500, marginLeft: '8px' }}>
                {orderItems.length} items
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearClick}
              disabled={orderItems.length === 0}
              style={{
                color: orderItems.length === 0 ? currentTheme.colors.text.disabled : (isDark ? '#ef4444' : '#dc2626'),
                opacity: orderItems.length === 0 ? 0.5 : 1,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <TrashIcon color="currentColor" />
              <span style={{ fontSize: '0.8rem' }}>Clear All</span>
            </Button>
          </div>

          {orderItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: currentTheme.spacing[8],
              color: currentTheme.colors.text.secondary,
              height: '60%'
            }}>
              {/* Bobbing Animation */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                style={{
                  width: '64px', height: '64px',
                  borderRadius: '16px',
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#F6F7F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </motion.div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: currentTheme.colors.text.primary }}>
                Your cart is empty
              </div>
              <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
                Add items to create a bill
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                fontSize: currentTheme.typography.fontSize.xs,
                fontWeight: currentTheme.typography.fontWeight.semibold,
                color: currentTheme.colors.text.secondary,
                marginBottom: currentTheme.spacing[3],
                paddingBottom: currentTheme.spacing[2],
                borderBottom: `1px solid ${currentTheme.colors.border}`,
                letterSpacing: currentTheme.typography.letterSpacing.wide,
              }}>
                <div>ITEMS</div>
                <div style={{ textAlign: 'center' }}>QTY.</div>
                <div style={{ textAlign: 'right' }}>PRICE</div>
              </div>

              {orderItems.map((item) => (
                <div key={item.product_id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  alignItems: 'center',
                  padding: `${currentTheme.spacing[2]} 0`,
                  borderBottom: `1px solid ${currentTheme.colors.border}`,
                }}>
                  <div>
                    <div style={{
                      fontSize: currentTheme.typography.fontSize.sm,
                      fontWeight: currentTheme.typography.fontWeight.medium,
                      color: currentTheme.colors.text.primary,
                    }}>
                      {item.name}
                    </div>
                    <div style={{
                      fontSize: currentTheme.typography.fontSize.xs,
                      color: currentTheme.colors.text.secondary,
                    }}>
                      {formatCurrency(item.price)} each
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: currentTheme.spacing[1],
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        style={{ minWidth: '28px', padding: '0' }}
                      >
                        −
                      </Button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        style={{ minWidth: '28px', padding: '0' }}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          borderTop: `1px solid ${currentTheme.colors.border}`,
          padding: currentTheme.spacing[4],
        }}>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: currentTheme.spacing[3],
            padding: '16px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F6F7F9', // Glass-like strip
            borderRadius: '12px',
            border: isDark ? '1px solid rgba(255,255,255,0.03)' : 'none'
          }}>
            <span style={{
              fontSize: '14px',
              color: currentTheme.colors.text.secondary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Total Amount</span>
            <span style={{
              fontSize: '24px',
              fontFamily: 'monospace', // Tabular nums
              fontWeight: 700,
              color: currentTheme.colors.text.primary
            }}>
              {formatCurrency(calculateTotal())}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <Button variant="secondary" onClick={handleSaveOrder} size="lg" fullWidth>
              {editingBill ? 'Update' : 'Save Bill'}
            </Button>
            <Button variant="primary" onClick={handleSaveAndPrintOrder} size="lg" fullWidth>
              {editingBill ? 'Update & Print' : 'Save & Print'}
            </Button>
          </div>
        </div>
      </div>

      {
        error && (
          <div style={{
            position: 'fixed',
            bottom: currentTheme.spacing[4],
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
          }}>
            <Card variant="error" padding="md">
              <div style={{
                fontSize: currentTheme.typography.fontSize.sm,
                color: currentTheme.colors.error[600],
                fontWeight: currentTheme.typography.fontWeight.medium,
              }}>{error}</div>
            </Card>
          </div>
        )
      }

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            className="pmOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelClear}
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
                Clear Current Bill?
              </div>
              <div className="pmDialogBody">
                This will remove all items from the current order. This action cannot be undone.
              </div>
              <div className="pmDialogActions">
                <button className="pmDialogBtn" onClick={cancelClear}>
                  Cancel
                </button>
                <button className="pmDialogBtn pmDialogBtnPrimary" onClick={confirmClear}>
                  Yes, Clear Bill
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default WorkingPOSInterface;
