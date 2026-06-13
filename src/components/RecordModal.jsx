import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react';

const RecordModal = ({ isOpen, onClose, onSave, recordToEdit = null }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sales: '',
    purchases: '',
    expenses: '',
    cash_in_hand: '',
    payment_in_account: '',
    profit_margin_percentage: 12.5,
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load editing record if provided
  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        date: recordToEdit.date,
        sales: recordToEdit.sales.toString(),
        purchases: recordToEdit.purchases.toString(),
        expenses: recordToEdit.expenses.toString(),
        cash_in_hand: recordToEdit.cash_in_hand.toString(),
        payment_in_account: recordToEdit.payment_in_account.toString(),
        profit_margin_percentage: recordToEdit.profit_margin_percentage || 12.5,
      });
    } else {
      // Default to today
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sales: '',
        purchases: '',
        expenses: '',
        cash_in_hand: '',
        payment_in_account: '',
        profit_margin_percentage: 12.5,
      });
    }
    setValidationError('');
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'profit_margin_percentage' ? parseFloat(value) : value,
    }));
  };

  // Calculations in real time
  const expensesNum = parseFloat(formData.expenses) || 0;
  const cashNum = parseFloat(formData.cash_in_hand) || 0;
  const accountNum = parseFloat(formData.payment_in_account) || 0;
  const salesNum = cashNum + accountNum; // Auto-calculate total revenue/sales
  const marginPercent = formData.profit_margin_percentage;

  const totalRevenueCalculated = salesNum;
  const grossProfitCalculated = salesNum * (marginPercent / 100);
  const netProfitCalculated = grossProfitCalculated - expensesNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.date) {
      setValidationError('Date is required.');
      return;
    }
    if (salesNum <= 0) {
      setValidationError('Total sales (Cash + Online Payment) must be a positive number.');
      return;
    }
    if (parseFloat(formData.purchases) < 0) {
      setValidationError('Purchases cannot be negative.');
      return;
    }
    if (expensesNum < 0) {
      setValidationError('Expenses cannot be negative.');
      return;
    }
    if (cashNum < 0 || accountNum < 0) {
      setValidationError('Cash and Account balances cannot be negative.');
      return;
    }

    // Optional Check: Warn or notice if Revenue doesn't match Sales (we won't block it, but let's encourage match)
    // Actually, letting Cash + Account = Total Revenue is exactly the user's rule.

    setIsSubmitting(true);
    const payload = {
      ...formData,
      sales: salesNum,
      purchases: parseFloat(formData.purchases) || 0,
      expenses: expensesNum,
      cash_in_hand: cashNum,
      payment_in_account: accountNum,
    };

    const result = await onSave(payload, recordToEdit?.id);
    setIsSubmitting(false);

    if (result && !result.success) {
      setValidationError(result.error || 'Failed to save record.');
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 6, 12, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        className="modal-content glass-card"
        style={{
          background: 'rgba(18, 21, 40, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          width: '90%',
          maxWidth: '540px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
          color: '#fff',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '0.5px', color: '#14e9b2' }}>
            {recordToEdit ? 'Edit Daily Record' : 'Add Daily Record'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div 
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#fb7185',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Date Picker */}
          <div>
            <label className="form-label">Date</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
              <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Sales */}
            <div>
              <label className="form-label">Sales (PKR) - Auto-calculated</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  name="sales"
                  placeholder="0"
                  value={salesNum || ''}
                  readOnly
                  className="form-input"
                  style={{ 
                    paddingLeft: '40px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    cursor: 'not-allowed' 
                  }}
                />
                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#14e9b2', opacity: 0.7 }} />
              </div>
            </div>

            {/* Purchases */}
            <div>
              <label className="form-label">Purchases (PKR)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  name="purchases"
                  placeholder="0"
                  value={formData.purchases}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div>
            <label className="form-label">Expenses (PKR)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number"
                name="expenses"
                placeholder="0"
                value={formData.expenses}
                onChange={handleChange}
                required
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
              <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#fb7185' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Cash in Hand */}
            <div>
              <label className="form-label">Cash in Hand (PKR)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  name="cash_in_hand"
                  placeholder="0"
                  value={formData.cash_in_hand}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#34d399' }} />
              </div>
            </div>

            {/* Payment in Account */}
            <div>
              <label className="form-label">Payment in Account (PKR)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number"
                  name="payment_in_account"
                  placeholder="0"
                  value={formData.payment_in_account}
                  onChange={handleChange}
                  required
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                />
                <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#22d3ee' }} />
              </div>
            </div>
          </div>

          {/* Profit Margin slider */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Percent size={14} style={{ color: '#facc15' }} />
                Estimated Profit Margin
              </label>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#facc15' }}>
                {marginPercent}%
              </span>
            </div>
            <input 
              type="range"
              name="profit_margin_percentage"
              min="10"
              max="15"
              step="0.5"
              value={formData.profit_margin_percentage}
              onChange={handleChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              <span>10.0%</span>
              <span>12.5%</span>
              <span>15.0%</span>
            </div>
          </div>

          {/* Summary Preview Box */}
          <div 
            style={{
              background: 'linear-gradient(90deg, rgba(20,233,178,0.05) 0%, rgba(250,204,21,0.05) 100%)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Calculated Total Revenue:</span>
              <strong style={{ color: '#22d3ee' }}>
                {new Intl.NumberFormat('en-PK').format(totalRevenueCalculated)} PKR
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Estimated Daily Net Profit:</span>
              <strong style={{ color: netProfitCalculated >= 0 ? '#facc15' : '#fb7185' }}>
                {new Intl.NumberFormat('en-PK').format(Math.round(netProfitCalculated))} PKR
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 2, padding: '12px', borderRadius: '10px', fontWeight: '700', filter: 'drop-shadow(0 4px 12px rgba(20, 233, 178, 0.2))' }}
            >
              {isSubmitting ? 'Saving...' : recordToEdit ? 'Save Changes' : 'Add Record'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RecordModal;
