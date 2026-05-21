import React, { useState } from 'react';
import { Search, Edit, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const DailyTable = ({ records, onEdit, onDelete, userRole }) => {
  const isViewer = userRole === 'viewer';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handles sort toggles
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for new columns
    }
    setCurrentPage(1);
  };

  // Searching filter logic
  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const formattedDate = new Date(r.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      r.date.includes(searchTerm) ||
      formattedDate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate Net Profit helper for sorting
  const getNetProfit = (r) => {
    const gross = r.sales * (r.profit_margin_percentage / 100);
    return gross - r.expenses;
  };

  // Sorting logic
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'netProfit') {
      aVal = getNetProfit(a);
      bVal = getNetProfit(b);
    } else if (sortField === 'totalRevenue') {
      aVal = (a.cash_in_hand || 0) + (a.payment_in_account || 0);
      bVal = (b.cash_in_hand || 0) + (b.payment_in_account || 0);
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' 
        ? (aVal || 0) - (bVal || 0) 
        : (bVal || 0) - (aVal || 0);
    }
  });

  // Pagination bounds
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  const formatPKR = (num) => {
    return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.round(num)) + ' PKR';
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    // Headers
    const headers = [
      'Date', 'Sales', 'Purchases', 'Expenses', 
      'Cash In Hand', 'Payment In Account', 'Total Revenue', 
      'Profit Margin %', 'Net Profit'
    ];
    
    // Rows
    const rows = sortedRecords.map(r => {
      const netProfit = getNetProfit(r);
      const totalRev = r.cash_in_hand + r.payment_in_account;
      return [
        r.date, r.sales, r.purchases, r.expenses,
        r.cash_in_hand, r.payment_in_account, totalRev,
        r.profit_margin_percentage, Math.round(netProfit)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Qasim_Pan_Shop_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="glass-card"
      style={{
        background: 'rgba(17, 20, 38, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Table Filters Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search records by date (e.g. YYYY-MM-DD or Month)..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="form-input"
            style={{ paddingLeft: '40px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
        </div>

        <button 
          onClick={handleExportCSV}
          disabled={sortedRecords.length === 0}
          className="btn btn-secondary"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 16px', 
            fontSize: '13px',
            borderRadius: '10px',
            whiteSpace: 'nowrap'
          }}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Responsive Glass Table Wrapper */}
      <div style={{ overflowX: 'auto', width: '100%', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th onClick={() => handleSort('date')} className="sortable-th">
                Date <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('sales')} className="sortable-th">
                Sales <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('purchases')} className="sortable-th">
                Purchases <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('expenses')} className="sortable-th">
                Expenses <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('cash_in_hand')} className="sortable-th">
                Cash in Hand <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('payment_in_account')} className="sortable-th">
                In Account <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('totalRevenue')} className="sortable-th">
                Total Rev <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('profit_margin_percentage')} className="sortable-th">
                Margin <ArrowUpDown size={12} />
              </th>
              <th onClick={() => handleSort('netProfit')} className="sortable-th">
                Net Profit <ArrowUpDown size={12} />
              </th>
              {!isViewer && <th style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((r, index) => {
                const netProfit = getNetProfit(r);
                const totalRevenue = (r.cash_in_hand || 0) + (r.payment_in_account || 0);

                return (
                  <tr 
                    key={r.id || index}
                    className="table-row"
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#14e9b2', fontWeight: '600' }}>
                      {formatPKR(r.sales)}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)' }}>
                      {formatPKR(r.purchases)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#fb7185' }}>
                      {formatPKR(r.expenses)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#34d399' }}>
                      {formatPKR(r.cash_in_hand)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#22d3ee' }}>
                      {formatPKR(r.payment_in_account)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#818cf8', fontWeight: '600' }}>
                      {formatPKR(totalRevenue)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#facc15', fontWeight: '600' }}>
                      {r.profit_margin_percentage}%
                    </td>
                    <td style={{ padding: '14px 16px', color: netProfit >= 0 ? '#f59e0b' : '#fb7185', fontWeight: '700' }}>
                      {formatPKR(netProfit)}
                    </td>
                    {!isViewer && (
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => onEdit(r)}
                            style={{
                              background: 'rgba(20, 233, 178, 0.1)',
                              color: '#14e9b2',
                              border: 'none',
                              borderRadius: '6px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#14e9b2';
                              e.currentTarget.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(20, 233, 178, 0.1)';
                              e.currentTarget.style.color = '#14e9b2';
                            }}
                            title="Edit record"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => onDelete(r.id)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              color: '#fb7185',
                              border: 'none',
                              borderRadius: '6px',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f43f5e';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                              e.currentTarget.style.color = '#fb7185';
                            }}
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isViewer ? "9" : "10"} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.3)' }}>
                  No records match your query. Add a new record or modify filters!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Panel */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedRecords.length)} of {sortedRecords.length} records
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: '600' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTable;
