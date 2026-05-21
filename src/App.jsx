import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  PlusCircle, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Coins, 
  CreditCard, 
  Wallet,
  Sparkles,
  Info,
  LogOut,
  Menu,
  X
} from 'lucide-react';

import CanvasBackground from './components/CanvasBackground';
import KpiCard from './components/KpiCard';
import PerformanceCharts from './components/PerformanceCharts';
import DailyTable from './components/DailyTable';
import RecordModal from './components/RecordModal';
import SupabaseSettings from './components/SupabaseSettings';
import LoginScreen from './components/LoginScreen';

import { getRecords, addRecord, updateRecord, deleteRecord, isSupabaseConnected } from './utils/db';

function App() {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Session state loaded from LocalStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('qasim_shop_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Load records from DB / LocalStorage
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getRecords();
      setRecords(data);
      setDbConnected(isSupabaseConnected());
    } catch (e) {
      console.error('Error loading shop records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Securely redirect viewer if they try to access settings
  useEffect(() => {
    if (currentUser?.role === 'viewer' && activeTab === 'settings') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Sync state when settings are toggled
  const handleSettingsChange = () => {
    loadData();
  };

  // Unique list of YYYY-MM months from records for filter
  const getAvailableMonths = () => {
    const months = new Set();
    records.forEach(r => {
      if (r.date) {
        const monthPart = r.date.substring(0, 7); // "YYYY-MM"
        months.add(monthPart);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };

  // Filtering records based on selection
  const filteredRecords = records.filter(r => {
    if (selectedMonth === 'all') return true;
    return r.date && r.date.startsWith(selectedMonth);
  });

  // Calculate Aggregated Metrics
  const totals = filteredRecords.reduce((acc, r) => {
    const sales = r.sales || 0;
    const purchases = r.purchases || 0;
    const expenses = r.expenses || 0;
    const cash = r.cash_in_hand || 0;
    const bank = r.payment_in_account || 0;
    const margin = r.profit_margin_percentage || 12.5;

    // Gross profit margin calculation
    const grossProfit = sales * (margin / 100);
    // Net profit (removing expenses of each day)
    const netProfit = grossProfit - expenses;

    acc.sales += sales;
    acc.purchases += purchases;
    acc.expenses += expenses;
    acc.cashInHand += cash;
    acc.paymentInAccount += bank;
    acc.netProfit += netProfit;

    return acc;
  }, { sales: 0, purchases: 0, expenses: 0, cashInHand: 0, paymentInAccount: 0, netProfit: 0 });

  // Total Revenue = Cash in Hand + Payment in Account
  const totalRevenue = totals.cashInHand + totals.paymentInAccount;

  // Save (Create or Update)
  const handleSaveRecord = async (payload, id = null) => {
    if (currentUser?.role === 'viewer') {
      return { success: false, error: 'Access Denied: Viewers cannot add or modify records.' };
    }
    let result;
    if (id) {
      // Update
      result = await updateRecord(id, payload);
    } else {
      // Insert
      result = await addRecord(payload);
    }

    if (result && result.success) {
      await loadData();
    }
    return result;
  };

  // Delete
  const handleDeleteRecord = async (id) => {
    if (currentUser?.role === 'viewer') {
      alert('Access Denied: Viewers cannot delete records.');
      return;
    }
    if (window.confirm('Are you absolutely sure you want to delete this day record?')) {
      const result = await deleteRecord(id);
      if (result && result.success) {
        await loadData();
      } else {
        alert(result?.error || 'Failed to delete record.');
      }
    }
  };

  const handleEditRecordClick = (record) => {
    if (currentUser?.role === 'viewer') return;
    setRecordToEdit(record);
    setIsModalOpen(true);
  };

  const handleAddRecordClick = () => {
    if (currentUser?.role === 'viewer') return;
    setRecordToEdit(null);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('qasim_shop_user');
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const formatMonthLabel = (yyyyMM) => {
    if (yyyyMM === 'all') return 'All Months';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Auth Guard
  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <CanvasBackground />
        <LoginScreen onLogin={(user) => {
          localStorage.setItem('qasim_shop_user', JSON.stringify(user));
          setCurrentUser(user);
        }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Interactive Floating Particle Background */}
      <CanvasBackground />

      {/* Fixed Mobile Top Bar Header */}
      <header className="mobile-top-bar">
        <button 
          className="mobile-burger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="mobile-app-title">
          <Sparkles size={18} style={{ color: '#14e9b2', marginRight: '6px' }} />
          <span>Qasim Pan Shop</span>
        </div>

        <div 
          className="mobile-user-avatar"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentUser.color}20, ${currentUser.color}40)`,
            border: `2px solid ${currentUser.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: '800',
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
            boxShadow: `0 0 8px ${currentUser.color}30`,
            cursor: 'pointer'
          }}
          onClick={() => setIsMobileMenuOpen(true)}
          title={`${currentUser.name} - ${currentUser.title}`}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Backdrop Drawer Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Side Navigation Panel */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-title-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="sidebar-title" style={{ margin: 0 }}>
            <Sparkles size={24} style={{ color: '#14e9b2', filter: 'drop-shadow(0 0 8px #14e9b2)', flexShrink: 0 }} />
            Qasim Pan Shop
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '6px',
              display: 'none', // Toggle display: flex in media query
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Profile HUD */}
        <div 
          className="user-profile-hud"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background Glow */}
          <div 
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${currentUser.color}08 0%, transparent 70%)`,
              pointerEvents: 'none'
            }}
          />

          {/* Avatar with initial and glowing ring */}
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentUser.color}20, ${currentUser.color}40)`,
              border: `2px solid ${currentUser.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '18px',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 0 12px ${currentUser.color}30`,
              textShadow: `0 2px 4px rgba(0,0,0,0.5)`,
              flexShrink: 0
            }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>

          {/* User Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexGrow: 1, minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </span>
            <span 
              style={{
                fontSize: '10.5px',
                fontWeight: '700',
                color: currentUser.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '2px 8px',
                borderRadius: '100px',
                background: `${currentUser.color}15`,
                border: `1px solid ${currentUser.color}25`,
                alignSelf: 'flex-start',
                boxShadow: `0 2px 6px ${currentUser.color}08`
              }}
            >
              {currentUser.title}
            </span>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              alignSelf: 'center',
              outline: 'none'
            }}
            className="logout-btn"
            title="Logout session"
          >
            <LogOut size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('report'); setIsMobileMenuOpen(false); }}
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
          >
            <FileText size={18} />
            Daily Report Table
          </button>
          {currentUser?.role !== 'viewer' && !dbConnected && (
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={18} />
              Supabase Setup
            </button>
          )}
        </nav>

        {/* Database Status Widget in Sidebar (Clickable settings access when connected) */}
        {currentUser?.role !== 'viewer' && (
          <div 
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            style={{
              background: activeTab === 'settings' ? 'rgba(20, 233, 178, 0.05)' : 'rgba(255,255,255,0.02)',
              border: activeTab === 'settings' ? '1px solid rgba(20, 233, 178, 0.2)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = dbConnected ? '#14e9b2' : '#facc15';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = activeTab === 'settings' ? 'rgba(20, 233, 178, 0.05)' : 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = activeTab === 'settings' ? 'rgba(20, 233, 178, 0.2)' : 'rgba(255,255,255,0.05)';
            }}
            title="Click to view database connection details"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: dbConnected ? '#14e9b2' : '#facc15',
                  boxShadow: `0 0 8px ${dbConnected ? '#14e9b2' : '#facc15'}`
                }}
              />
              <span style={{ fontWeight: '600', color: '#fff' }}>
                {dbConnected ? 'Cloud Synced' : 'Demo Mode Active'}
              </span>
              {dbConnected && <Settings size={12} style={{ marginLeft: 'auto', opacity: 0.5, color: '#14e9b2' }} />}
            </div>
            <span style={{ fontSize: '11px', lineHeight: '1.4' }}>
              {dbConnected 
                ? 'Real-time database integration is live. Click to configure.' 
                : 'Records are saved locally. Connect Supabase in settings to sync.'
              }
            </span>
          </div>
        )}
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        
        {/* Navigation & Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="header-title">
              {activeTab === 'dashboard' && 'Business Overview'}
              {activeTab === 'report' && 'Daily Sales Ledger'}
              {activeTab === 'settings' && 'System Configuration'}
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {activeTab === 'dashboard' && 'Visual insights, key performance indicators, and shop earnings.'}
              {activeTab === 'report' && 'Full comprehensive database and search logs of all shop entries.'}
              {activeTab === 'settings' && 'Manage your Supabase connections and database configuration.'}
            </p>
          </div>

          {/* Header Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Months Filter (Visible in Dashboard and Reports) */}
            {activeTab !== 'settings' && (
              <div style={{ position: 'relative' }}>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-input"
                  style={{ width: '180px', paddingRight: '40px' }}
                >
                  <option value="all">All Time</option>
                  {getAvailableMonths().map(m => (
                    <option key={m} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* "+ Add Daily Record" Button */}
            {activeTab !== 'settings' && currentUser?.role !== 'viewer' && (
              <button 
                onClick={handleAddRecordClick}
                className="btn btn-primary"
              >
                <PlusCircle size={16} />
                Add Daily Record
              </button>
            )}
          </div>
        </header>

        {/* Demo Mode Notice Banner */}
        {currentUser?.role !== 'viewer' && !dbConnected && activeTab !== 'settings' && (
          <div 
            style={{
              background: 'linear-gradient(90deg, rgba(250,204,21,0.06) 0%, rgba(20,233,178,0.06) 100%)',
              border: '1px solid rgba(250,204,21,0.15)',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15' }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                You are currently using <strong>Demo Mode (LocalStorage)</strong>. Your changes will save locally. 
                Configure <strong>Supabase</strong> to back up and host online for free!
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '11.5px', borderRadius: '8px', borderColor: 'rgba(250,204,21,0.3)', color: '#facc15' }}
            >
              Set up Supabase
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading ? (
          <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  border: '3px solid rgba(255,255,255,0.05)', 
                  borderTopColor: '#14e9b2',
                  animation: 'spin 1s linear infinite'
                }} 
              />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Fetching shop ledger...</span>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        ) : (
          /* Core Tabs Router */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* TAB 1: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <>
                {/* 1. KPI Cards Grid */}
                <div className="kpis-grid">
                  <KpiCard 
                    title="Total Sales"
                    value={totals.sales}
                    icon={TrendingUp}
                    colorClass="teal"
                    subtitle="Gross customer revenue"
                  />
                  <KpiCard 
                    title="Purchases"
                    value={totals.purchases}
                    icon={ShoppingBag}
                    colorClass="purple"
                    subtitle="Inventory expenditures"
                  />
                  <KpiCard 
                    title="Expenses"
                    value={totals.expenses}
                    icon={DollarSign}
                    colorClass="rose"
                    subtitle="Rent, bills, shop costs"
                  />
                  <KpiCard 
                    title="Actual Net Profit"
                    value={totals.netProfit}
                    icon={Coins}
                    colorClass="gold"
                    subtitle="Net sales margin less expenses"
                  />
                  <KpiCard 
                    title="Cash in Hand"
                    value={totals.cashInHand}
                    icon={Wallet}
                    colorClass="emerald"
                    subtitle="Liquid register currency"
                  />
                  <KpiCard 
                    title="Payment in Account"
                    value={totals.paymentInAccount}
                    icon={CreditCard}
                    colorClass="cyan"
                    subtitle="Digital / bank transfers"
                  />
                  <KpiCard 
                    title="Total Revenue Balance"
                    value={totalRevenue}
                    icon={Sparkles}
                    colorClass="teal"
                    subtitle="Cash + Account digital split"
                  />
                </div>

                {/* 2. Visualizations and Graphs */}
                <PerformanceCharts records={filteredRecords} />
              </>
            )}

            {/* TAB 2: DAILY REPORT TABLE VIEW */}
            {activeTab === 'report' && (
              <DailyTable 
                records={filteredRecords} 
                onEdit={handleEditRecordClick} 
                onDelete={handleDeleteRecord} 
                userRole={currentUser?.role}
              />
            )}

            {/* TAB 3: SYSTEM SETTINGS VIEW */}
            {activeTab === 'settings' && currentUser?.role !== 'viewer' && (
              <SupabaseSettings onSettingsChange={handleSettingsChange} />
            )}

          </div>
        )}

      </main>

      {/* Record Creation & Modification Modal Overlay */}
      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        recordToEdit={recordToEdit}
      />
    </div>
  );
}

export default App;
