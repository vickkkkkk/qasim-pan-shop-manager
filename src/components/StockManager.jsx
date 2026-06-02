import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Check, 
  X, 
  Sparkles,
  TrendingDown,
  RotateCcw,
  Tag,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  getBrands, 
  addBrand, 
  deleteBrand, 
  getProducts, 
  addProduct, 
  deleteProduct, 
  adjustProductQuantity 
} from '../utils/db';

const StockManager = ({ currentUser }) => {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Form states
  const [newBrandName, setNewBrandName] = useState('');
  const [newProduct, setNewProduct] = useState({
    brand_id: '',
    product_name: '',
    name: '',
    quantity: ''
  });

  // Inline brand toggle state inside add product modal
  const [isAddingBrandInline, setIsAddingBrandInline] = useState(false);
  const [inlineBrandName, setInlineBrandName] = useState('');

  // Toast / Feedback message
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  const isViewer = currentUser?.role === 'viewer';

  // Load Inventory Data
  const loadInventory = async () => {
    setLoading(true);
    try {
      const brandsData = await getBrands();
      const productsData = await getProducts();
      setBrands(brandsData);
      setProducts(productsData);
      
      // Auto-select first brand in form default
      if (brandsData.length > 0) {
        setNewProduct(prev => ({ ...prev, brand_id: brandsData[0].id }));
      }
    } catch (e) {
      console.error('Error loading inventory data:', e);
      showFeedback('Failed to load inventory data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  // Add Brand handler
  const handleAddBrandSubmit = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    if (!newBrandName.trim()) {
      showFeedback('Brand name is required.', 'error');
      return;
    }

    const result = await addBrand({ name: newBrandName });
    if (result.success) {
      showFeedback(`Brand "${newBrandName}" added successfully!`);
      setNewBrandName('');
      setIsBrandModalOpen(false);
      await loadInventory();
    } else {
      showFeedback(result.error || 'Failed to add brand.', 'error');
    }
  };

  // Add Brand Inline handler
  const handleAddBrandInline = async () => {
    if (isViewer) return;
    if (!inlineBrandName.trim()) {
      showFeedback('Brand name is required.', 'error');
      return;
    }

    const result = await addBrand({ name: inlineBrandName });
    if (result.success) {
      showFeedback(`Brand "${inlineBrandName}" added!`);
      const createdBrand = result.data;
      setInlineBrandName('');
      setIsAddingBrandInline(false);
      
      // Refresh list & select this brand
      const brandsData = await getBrands();
      setBrands(brandsData);
      setNewProduct(prev => ({ ...prev, brand_id: createdBrand.id }));
    } else {
      showFeedback(result.error || 'Failed to add brand.', 'error');
    }
  };

  // Add Product handler
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (isViewer) return;
    if (!newProduct.brand_id || !newProduct.product_name.trim() || !newProduct.name.trim()) {
      showFeedback('Brand, Product Name, and Size/Item are required.', 'error', 'error');
      return;
    }

    const result = await addProduct(newProduct);
    if (result.success) {
      showFeedback(`Product "${newProduct.product_name} - ${newProduct.name}" added successfully!`);
      setNewProduct(prev => ({
        ...prev,
        product_name: '',
        name: '',
        quantity: ''
      }));
      setIsProductModalOpen(false);
      await loadInventory();
    } else {
      showFeedback(result.error || 'Failed to add product.', 'error');
    }
  };

  // Delete Brand handler
  const handleDeleteBrandClick = async (brandId, brandName) => {
    if (isViewer) return;
    const confirmMessage = `Are you sure you want to delete "${brandName}"? THIS WILL ALSO DELETE ALL PRODUCTS UNDER THIS BRAND.`;
    if (window.confirm(confirmMessage)) {
      const result = await deleteBrand(brandId);
      if (result.success) {
        showFeedback(`Brand "${brandName}" deleted successfully.`);
        await loadInventory();
      } else {
        showFeedback(result.error || 'Failed to delete brand.', 'error');
      }
    }
  };

  // Delete Product handler
  const handleDeleteProductClick = async (prodId, prodName) => {
    if (isViewer) return;
    if (window.confirm(`Are you sure you want to delete the product "${prodName}"?`)) {
      const result = await deleteProduct(prodId);
      if (result.success) {
        showFeedback(`Product "${prodName}" removed.`);
        await loadInventory();
      } else {
        showFeedback(result.error || 'Failed to delete product.', 'error');
      }
    }
  };

  // Quick quantity adjustments (+ / - / Use 1)
  const handleAdjustQuantity = async (prodId, delta, prodName) => {
    if (isViewer) return;
    const result = await adjustProductQuantity(prodId, delta);
    if (result.success) {
      // Optimistic update of local UI state
      setProducts(prev => prev.map(p => {
        if (p.id === prodId) {
          return { ...p, quantity: Math.max(0, p.quantity + delta) };
        }
        return p;
      }));
      
      if (delta === -1 && result.data.quantity === 0) {
        showFeedback(`"${prodName}" is now out of stock!`, 'error');
      } else if (delta === -1 && result.data.quantity < 5) {
        showFeedback(`Low stock warning: "${prodName}" has ${result.data.quantity} left.`, 'warning');
      }
    } else {
      showFeedback('Failed to adjust quantity.', 'error');
    }
  };

  // Calculation Metrics
  const totalBrands = brands.length;
  const totalUniqueItems = products.length;
  const lowStockAlerts = products.filter(p => p.quantity > 0 && p.quantity < 5).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  // Filtered listing
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrandFilter === 'all' || p.brand_id === selectedBrandFilter;
    return matchesSearch && matchesBrand;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>

      {/* Summary KPI Meters */}
      <div className="kpis-grid">
        {/* KPI 1: Brands */}
        <div className="kpi-card teal">
          <div className="kpi-icon-wrapper">
            <Tag size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>Total Brands</span>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', marginTop: '4px' }}>
              {totalBrands}
            </span>
          </div>
          <span className="kpi-subtitle">Registered manufacturers</span>
        </div>

        {/* KPI 2: Products */}
        <div className="kpi-card purple">
          <div className="kpi-icon-wrapper">
            <Package size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>Unique Products</span>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', marginTop: '4px' }}>
              {totalUniqueItems}
            </span>
          </div>
          <span className="kpi-subtitle">Catalog configurations</span>
        </div>

        {/* KPI 3: Low Stock */}
        <div className="kpi-card gold">
          <div className="kpi-icon-wrapper">
            <AlertTriangle size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>Low Stock Items</span>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', marginTop: '4px' }}>
              {lowStockAlerts}
            </span>
          </div>
          <span className="kpi-subtitle">Under 5 units remaining</span>
        </div>

        {/* KPI 4: Out of Stock */}
        <div className="kpi-card rose">
          <div className="kpi-icon-wrapper">
            <TrendingDown size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>Out of Stock</span>
            <span style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', marginTop: '4px' }}>
              {outOfStockCount}
            </span>
          </div>
          <span className="kpi-subtitle">Empty stock ledger count</span>
        </div>
      </div>

      {/* Floating System Toast Notice */}
      {feedback.text && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'rgba(11, 13, 26, 0.9)',
            backdropFilter: 'blur(16px)',
            border: `1.5px solid ${feedback.type === 'error' ? 'rgba(251, 113, 133, 0.3)' : feedback.type === 'warning' ? 'rgba(250, 204, 21, 0.3)' : 'rgba(20, 233, 178, 0.3)'}`,
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 0 15px ${feedback.type === 'error' ? 'rgba(251, 113, 133, 0.1)' : feedback.type === 'warning' ? 'rgba(250, 204, 21, 0.1)' : 'rgba(20, 233, 178, 0.1)'}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontSize: '13.5px',
            fontWeight: '600'
          }}
        >
          {feedback.type === 'error' ? (
            <X size={16} style={{ color: 'var(--color-rose)' }} />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle size={16} style={{ color: 'var(--color-gold)' }} />
          ) : (
            <Check size={16} style={{ color: 'var(--theme-accent)' }} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Primary Actions bar */}
      <div 
        className="glass-card"
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          background: 'rgba(17, 20, 38, 0.3)'
        }}
      >
        {/* Left: Search and Filters */}
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '600px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'rgba(255,255,255,0.3)' 
              }} 
            />
            <input 
              type="text"
              placeholder="Search product or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Setup buttons */}
        {!isViewer && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsBrandModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '10px 18px', borderRadius: '10px' }}
            >
              <Plus size={14} />
              Add Brand
            </button>

            <button 
              onClick={() => {
                setNewProduct({
                  brand_id: brands[0]?.id || '',
                  product_name: '',
                  name: '',
                  quantity: ''
                });
                setIsProductModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '10px 18px', borderRadius: '10px' }}
            >
              <Plus size={14} />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          width: '100%'
        }}
      >
        
        {/* Products Table/Card View */}
        <div 
          className="glass-card"
          style={{
            padding: '24px',
            background: 'rgba(17, 20, 38, 0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--theme-accent)' }} />
              Active Inventory Levels
            </h3>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
              Showing {filteredProducts.length} of {totalUniqueItems} items
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  border: '3px solid rgba(255,255,255,0.05)', 
                  borderTopColor: 'var(--theme-accent)',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '12px' }}>
              <Package size={36} style={{ color: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '500' }}>
                {searchQuery || selectedBrandFilter !== 'all' ? 'No stock items match your filter criteria.' : 'Your stock inventory is empty. Add a product to get started.'}
              </span>
              {(searchQuery || selectedBrandFilter !== 'all') && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedBrandFilter('all'); }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', marginTop: '4px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand</th>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Name</th>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product Size / Item</th>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>In Stock</th>
                    <th style={{ padding: '14px 16px', fontSize: '12.5px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, index) => {
                    const isOutOfStock = p.quantity === 0;
                    const isLowStock = p.quantity > 0 && p.quantity < 5;

                    return (
                      <tr 
                        key={p.id}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                      >
                        {/* Brand Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', letterSpacing: '-0.2px' }}>
                            {p.brand_name}
                          </span>
                        </td>

                        {/* Product Name Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', fontWeight: '600' }}>
                            {p.product_name || p.brand_name}
                          </span>
                        </td>

                        {/* Product Size Column */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', fontWeight: '500' }}>
                            {p.name}
                          </span>
                        </td>

                        {/* Status badge Column */}
                        <td style={{ padding: '14px 16px' }}>
                          {isOutOfStock ? (
                            <span 
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: 'var(--color-rose)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '3px 8px',
                                borderRadius: '100px',
                                background: 'rgba(251, 113, 133, 0.12)',
                                border: '1px solid rgba(251, 113, 133, 0.2)'
                              }}
                            >
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span 
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: 'var(--color-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '3px 8px',
                                borderRadius: '100px',
                                background: 'rgba(250, 204, 21, 0.12)',
                                border: '1px solid rgba(250, 204, 21, 0.2)'
                              }}
                            >
                              Low Stock
                            </span>
                          ) : (
                            <span 
                              style={{
                                fontSize: '10.5px',
                                fontWeight: '700',
                                color: 'var(--theme-accent)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '3px 8px',
                                borderRadius: '100px',
                                background: 'var(--theme-accent-dim)',
                                border: '1px solid var(--theme-accent-border)'
                              }}
                            >
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Quantity Level Column */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '12px' 
                            }}
                          >
                            {!isViewer && (
                              <button
                                onClick={() => handleAdjustQuantity(p.id, -1, p.name)}
                                disabled={isOutOfStock}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.02)',
                                  color: isOutOfStock ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                                  cursor: isOutOfStock ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '800',
                                  fontSize: '14px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { if (!isOutOfStock) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                onMouseLeave={(e) => { if (!isOutOfStock) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                              >
                                -
                              </button>
                            )}
                            
                            <span 
                              style={{ 
                                fontSize: '16px', 
                                fontWeight: '800', 
                                color: isOutOfStock ? 'rgba(255, 255, 255, 0.3)' : isLowStock ? 'var(--color-gold)' : '#fff',
                                fontFamily: 'var(--font-display)',
                                minWidth: '32px',
                                display: 'inline-block'
                              }}
                            >
                              {p.quantity}
                            </span>

                            {!isViewer && (
                              <button
                                onClick={() => handleAdjustQuantity(p.id, 1, p.name)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.02)',
                                  color: 'rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '800',
                                  fontSize: '14px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--theme-accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Use / Consume / Trash controls */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* "Use 1" shortcut button */}
                            <button
                              onClick={() => handleAdjustQuantity(p.id, -1, p.name)}
                              disabled={isOutOfStock || isViewer}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid transparent',
                                background: isOutOfStock 
                                  ? 'rgba(255,255,255,0.02)' 
                                  : isViewer 
                                    ? 'rgba(255,255,255,0.02)' 
                                    : 'rgba(var(--theme-accent-rgb), 0.15)',
                                color: isOutOfStock 
                                  ? 'rgba(255,255,255,0.2)' 
                                  : isViewer 
                                    ? 'rgba(255,255,255,0.2)' 
                                    : 'var(--theme-accent)',
                                fontSize: '12px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                cursor: (isOutOfStock || isViewer) ? 'default' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                outline: 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (!isOutOfStock && !isViewer) {
                                  e.currentTarget.style.background = 'rgba(var(--theme-accent-rgb), 0.25)';
                                  e.currentTarget.style.boxShadow = '0 0 10px rgba(var(--theme-accent-rgb), 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isOutOfStock && !isViewer) {
                                  e.currentTarget.style.background = 'rgba(var(--theme-accent-rgb), 0.15)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                              className="stock-use-btn"
                            >
                              <Sparkles size={11} />
                              Use 1 Pet
                            </button>

                            {/* Trash button */}
                            {!isViewer && (
                              <button
                                onClick={() => handleDeleteProductClick(p.id, p.name)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'rgba(255,255,255,0.25)',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-rose)'; e.currentTarget.style.background = 'rgba(251, 113, 133, 0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'none'; }}
                                title="Delete product item"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Brands Collapsible Directory Card (Bottom Grid) */}
        <div 
          className="glass-card"
          style={{
            padding: '24px',
            background: 'rgba(17, 20, 38, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} style={{ color: 'var(--theme-accent)' }} />
            Registered Brands Directory ({totalBrands})
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {brands.map(b => {
              const productCountUnderBrand = products.filter(p => p.brand_id === b.id).length;
              return (
                <div
                  key={b.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{b.name}</span>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      {productCountUnderBrand} items
                    </span>
                  </div>

                  {!isViewer && (
                    <button
                      onClick={() => handleDeleteBrandClick(b.id, b.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        padding: '2px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-rose)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                      title={`Remove brand "${b.name}"`}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD PRODUCT */}
      {isProductModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 6, 12, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
          }}
          className="modal-overlay"
        >
          <div 
            className="glass-card modal-content"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'rgba(13, 15, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} style={{ color: 'var(--theme-accent)' }} />
                Add Product Item
              </h3>
              <button 
                onClick={() => { setIsProductModalOpen(false); setIsAddingBrandInline(false); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Brand Selection / Inline Creator */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Brand</label>
                  {!isAddingBrandInline ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingBrandInline(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--theme-accent)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        outline: 'none'
                      }}
                    >
                      + Create New Brand
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingBrandInline(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        outline: 'none'
                      }}
                    >
                      Cancel Brand Add
                    </button>
                  )}
                </div>

                {isAddingBrandInline ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      placeholder="e.g. Sprite, Pepsi, Shell"
                      value={inlineBrandName}
                      onChange={(e) => setInlineBrandName(e.target.value)}
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddBrandInline}
                      className="btn btn-primary"
                      style={{ padding: '0 16px', borderRadius: '10px' }}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={newProduct.brand_id}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, brand_id: e.target.value }))}
                    className="form-input"
                    required
                  >
                    {brands.length === 0 && <option value="">No brands available</option>}
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="form-label">Product Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Coke Zero Sugar, Pepsi Regular, Capstan"
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              {/* Product Size Name */}
              <div>
                <label className="form-label">Product Size / Item Type</label>
                <input 
                  type="text"
                  placeholder="e.g. Can, 350ml, 1.5L, Single Cigarette"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              {/* Initial Quantity */}
              <div>
                <label className="form-label">Initial Quantity in Stock</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewProduct(prev => ({ 
                      ...prev, 
                      quantity: val === '' ? '' : Math.max(0, parseInt(val) || 0) 
                    }));
                  }}
                  className="form-input"
                  required
                />
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setIsProductModalOpen(false); setIsAddingBrandInline(false); }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                  disabled={brands.length === 0 || isAddingBrandInline}
                >
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BRAND DIRECT */}
      {isBrandModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 6, 12, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
          }}
          className="modal-overlay"
        >
          <div 
            className="glass-card modal-content"
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'rgba(13, 15, 28, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} style={{ color: 'var(--theme-accent)' }} />
                Add Brand Registry
              </h3>
              <button 
                onClick={() => setIsBrandModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBrandSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Brand Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Sprite, Pepsi, Gold Leaf"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                >
                  Add Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockManager;
