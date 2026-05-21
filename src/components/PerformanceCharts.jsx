import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const PerformanceCharts = ({ records }) => {
  // Sort chronological for charts (ascending)
  const chartData = [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => {
      const grossProfit = r.sales * (r.profit_margin_percentage / 100);
      const netProfit = grossProfit - r.expenses;
      const totalRevenue = r.cash_in_hand + r.payment_in_account;

      return {
        dateLabel: new Date(r.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        sales: r.sales,
        purchases: r.purchases,
        expenses: r.expenses,
        netProfit: Math.round(netProfit),
        revenue: totalRevenue,
      };
    });

  // Calculate totals for payment method pie chart
  const totalCash = records.reduce((acc, r) => acc + (r.cash_in_hand || 0), 0);
  const totalAccount = records.reduce((acc, r) => acc + (r.payment_in_account || 0), 0);

  const paymentData = [
    { name: 'Cash in Hand', value: totalCash, color: '#34d399' },
    { name: 'Payment in Account', value: totalAccount, color: '#22d3ee' }
  ];

  // Custom tooltips with premium styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{
            background: 'rgba(12, 14, 28, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: '13px'
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{label}</p>
          {payload.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', margin: '4px 0', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.name}:</span>
              </span>
              <span style={{ fontWeight: '700', color: '#fff' }}>
                {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(item.value)} PKR
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasData = records.length > 0;

  return (
    <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width: '100%' }}>
      
      {/* 1. Daily Trends Chart */}
      <div 
        className="glass-card" 
        style={{
          background: 'rgba(17, 20, 38, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#fff', fontWeight: '600', letterSpacing: '0.5px' }}>
          Sales vs. Profit Performance
        </h3>
        <div style={{ flexGrow: 1, width: '100%', height: '280px', position: 'relative', minWidth: '0px' }}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14e9b2" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#14e9b2" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.3)" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Sales" 
                  stroke="#14e9b2" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="netProfit" 
                  name="Net Profit" 
                  stroke="#facc15" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)' }}>
              No data available for this month
            </div>
          )}
        </div>
      </div>

      {/* 2. Cash vs Account Distribution Chart */}
      <div 
        className="glass-card" 
        style={{
          background: 'rgba(17, 20, 38, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#fff', fontWeight: '600', letterSpacing: '0.5px' }}>
          Revenue Split (Cash vs Bank)
        </h3>
        <div style={{ flexGrow: 1, width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minWidth: '0px' }}>
          {hasData && (totalCash > 0 || totalAccount > 0) ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}44)` }} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${new Intl.NumberFormat('en-PK').format(value)} PKR`}
                  contentStyle={{
                    background: 'rgba(12, 14, 28, 0.85)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: '500' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)' }}>
              No transaction split data available
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default PerformanceCharts;
