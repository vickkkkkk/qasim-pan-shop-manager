import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  PlusCircle, 
  Search, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Save, 
  Filter, 
  X,
  RefreshCw,
  Coins,
  Check,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getAttendance, 
  saveAttendance, 
  getAttendanceRangeReport, 
  payRemainingBalance 
} from '../utils/db';

const AttendanceManager = ({ currentUser }) => {
  const isAdmin = currentUser?.role !== 'viewer';

  // Tabs: 'daily', 'registry', 'reports'
  const [activeSubTab, setActiveSubTab] = useState('daily');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Tab 1: Daily Sheet State
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dailyAttendance, setDailyAttendance] = useState([]); // Array of daily records
  const [isDirty, setIsDirty] = useState(false);

  // Tab 2: Registry State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [empForm, setEmpForm] = useState({ name: '', per_day_salary: '', address: '' });

  // Tab 3: Reports State
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    // Default to 1st of current month
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportRows, setReportRows] = useState([]);

  // Load Employees list
  const loadEmployeesList = async () => {
    try {
      const list = await getEmployees();
      setEmployees(list);
      return list;
    } catch (e) {
      console.error(e);
      showFeedback('Failed to load employee list.', 'error');
    }
  };

  // Load Daily Attendance
  const loadDailySheet = async (dateVal, employeeList = employees) => {
    setLoading(true);
    try {
      const attRecords = await getAttendance(dateVal);
      
      // Match employees with active records or generate blank present/unpaid defaults
      const combined = employeeList.map(emp => {
        const record = attRecords.find(r => r.employee_id === emp.id);
        if (record) {
          return {
            employee_id: emp.id,
            name: emp.name,
            per_day_salary: emp.per_day_salary,
            status: record.status, // 'present', 'absent'
            paid: record.paid,     // boolean
            date: dateVal
          };
        } else {
          return {
            employee_id: emp.id,
            name: emp.name,
            per_day_salary: emp.per_day_salary,
            status: 'present', // default
            paid: false,       // default
            date: dateVal
          };
        }
      });
      
      setDailyAttendance(combined);
      setIsDirty(false);
    } catch (e) {
      console.error(e);
      showFeedback('Failed to load daily attendance.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Billing Range Report
  const loadRangeReport = async () => {
    if (startDate > endDate) {
      showFeedback('Start date cannot be greater than End date.', 'error');
      return;
    }
    setLoading(true);
    try {
      const rows = await getAttendanceRangeReport(startDate, endDate);
      setReportRows(rows);
    } catch (e) {
      console.error(e);
      showFeedback('Failed to load report analysis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading depending on active tab
  useEffect(() => {
    const init = async () => {
      const list = await loadEmployeesList();
      if (activeSubTab === 'daily') {
        await loadDailySheet(selectedDate, list);
      } else if (activeSubTab === 'reports') {
        await loadRangeReport();
      }
    };
    init();
  }, [activeSubTab]);

  // Date selection change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadDailySheet(newDate);
  };

  // Show status feedback helper
  const showFeedback = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Tab 1: Toggle Attendance Status
  const toggleAttendanceStatus = (empId) => {
    if (!isAdmin) return;
    setDailyAttendance(prev => 
      prev.map(item => {
        if (item.employee_id === empId) {
          const nextStatus = item.status === 'present' ? 'absent' : 'present';
          // If absent, automatically paid = false
          return {
            ...item,
            status: nextStatus,
            paid: nextStatus === 'present' ? item.paid : false
          };
        }
        return item;
      })
    );
    setIsDirty(true);
  };

  // Tab 1: Toggle Payment Paid/Unpaid Status
  const togglePaymentPaid = (empId) => {
    if (!isAdmin) return;
    setDailyAttendance(prev => 
      prev.map(item => {
        if (item.employee_id === empId && item.status === 'present') {
          return {
            ...item,
            paid: !item.paid
          };
        }
        return item;
      })
    );
    setIsDirty(true);
  };

  // Tab 1: Save daily attendance sheet
  const handleSaveDailySheet = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const payload = dailyAttendance.map(item => ({
        employee_id: item.employee_id,
        date: item.date,
        status: item.status,
        paid: item.paid
      }));

      const res = await saveAttendance(payload);
      if (res.success) {
        showFeedback('Daily attendance sheet updated successfully!', 'success');
        setIsDirty(false);
        // Refresh local sheet
        await loadDailySheet(selectedDate);
      } else {
        showFeedback(res.error || 'Failed to save daily sheet.', 'error');
      }
    } catch (e) {
      console.error(e);
      showFeedback('An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tab 2: Reset Form fields
  const openAddModal = () => {
    setEditingEmployee(null);
    setEmpForm({ name: '', per_day_salary: '', address: '' });
    setIsModalOpen(true);
  };

  // Tab 2: Open edit modal
  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      name: emp.name,
      per_day_salary: emp.per_day_salary.toString(),
      address: emp.address || ''
    });
    setIsModalOpen(true);
  };

  // Tab 2: Handle Save employee
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!empForm.name || !empForm.per_day_salary) {
      showFeedback('Employee name and daily wage rate are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (editingEmployee) {
        // Edit
        res = await updateEmployee(editingEmployee.id, empForm);
      } else {
        // Add
        res = await addEmployee(empForm);
      }

      if (res.success) {
        showFeedback(
          editingEmployee 
            ? 'Employee registry updated successfully!' 
            : 'Employee registered successfully!', 
          'success'
        );
        setIsModalOpen(false);
        await loadEmployeesList();
      } else {
        showFeedback(res.error || 'Failed to process employee registry.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Error writing to registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tab 2: Handle Delete employee
  const handleDeleteEmployee = async (empId, name) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove ${name} from the employee registry? All historical records will be deleted.`)) {
      setLoading(true);
      try {
        const res = await deleteEmployee(empId);
        if (res.success) {
          showFeedback('Employee removed from directory.', 'success');
          await loadEmployeesList();
        } else {
          showFeedback(res.error || 'Failed to delete employee.', 'error');
        }
      } catch (err) {
        console.error(err);
        showFeedback('Error editing database.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Tab 3: Settle all outstanding balance for employee in date range
  const handleClearBalance = async (empId, name, balance) => {
    if (!isAdmin) return;
    if (balance <= 0) return;
    
    if (window.confirm(`Mark all ${balance.toLocaleString()} PKR unpaid wages as PAID for ${name} from ${startDate} to ${endDate}?`)) {
      setLoading(true);
      try {
        const res = await payRemainingBalance(empId, startDate, endDate);
        if (res.success) {
          showFeedback(`Wages settled for ${name} in selected date range!`, 'success');
          await loadRangeReport();
        } else {
          showFeedback(res.error || 'Failed to update ledger.', 'error');
        }
      } catch (err) {
        console.error(err);
        showFeedback('Error connecting to database.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter registry employees by search query
  const filteredEmployees = employees.filter(emp => {
    return emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (emp.address && emp.address.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Calculate daily stats for sheet
  const dailyStats = dailyAttendance.reduce((acc, item) => {
    acc.total += 1;
    if (item.status === 'present') {
      acc.present += 1;
      if (item.paid) {
        acc.paidWages += item.per_day_salary;
        acc.paidCount += 1;
      } else {
        acc.unpaidWages += item.per_day_salary;
        acc.unpaidCount += 1;
      }
    } else {
      acc.absent += 1;
    }
    return acc;
  }, { total: 0, present: 0, absent: 0, paidWages: 0, unpaidWages: 0, paidCount: 0, unpaidCount: 0 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Interactive Sub Navigation */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '10px 16px', 
          borderRadius: '14px', 
          display: 'flex', 
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'rgba(17, 20, 38, 0.4)',
          border: '1px solid rgba(255,255,255,0.04)'
        }}
      >
        <button 
          onClick={() => setActiveSubTab('daily')}
          className={`btn ${activeSubTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <Calendar size={15} />
          Daily Attendance
        </button>
        <button 
          onClick={() => setActiveSubTab('registry')}
          className={`btn ${activeSubTab === 'registry' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <Users size={15} />
          Staff Registry
        </button>
        <button 
          onClick={() => setActiveSubTab('reports')}
          className={`btn ${activeSubTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <DollarSign size={15} />
          Billing & Payroll
        </button>

        {loading && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Global Alerts Feed */}
      {message.text && (
        <div 
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            background: message.type === 'success' ? 'rgba(20, 233, 178, 0.08)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(250, 204, 21, 0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(20, 233, 178, 0.2)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)'}`,
            color: message.type === 'success' ? '#14e9b2' : message.type === 'error' ? '#fb7185' : '#facc15',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB 1: DAILY ATTENDANCE & PAYROLL SHEET */}
      {/* ==================================================== */}
      {activeSubTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Filtering and Saving Panel */}
          <div className="attendance-header-card">
            <div className="attendance-header-controls">
              <Calendar size={18} style={{ color: '#14e9b2' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Select Logs Date:</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={handleDateChange}
                className="form-input"
                style={{ width: '170px', padding: '6px 12px', fontSize: '13px' }}
              />
            </div>

            {isAdmin && (
              <button 
                onClick={handleSaveDailySheet}
                className={`btn ${isDirty ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  boxShadow: isDirty ? '0 0 12px rgba(20,233,178,0.2)' : 'none',
                  border: isDirty ? '1px solid #14e9b2' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Save size={16} />
                Save Daily Logs
                {isDirty && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff', marginLeft: '2px', display: 'inline-block' }} />}
              </button>
            )}
          </div>

          {/* KPI Mini-Summaries */}
          <div className="attendance-kpis-grid">
            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(17,20,38,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(20,233,178,0.1)', color: '#14e9b2' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Present Staff</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {dailyStats.present} <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.4)' }}>/ {dailyStats.total}</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(17,20,38,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', color: '#fb7185' }}>
                <X size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Absent Staff</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {dailyStats.absent}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(17,20,38,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Check size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Wages Paid Today</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {dailyStats.paidWages.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: '600' }}>PKR</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(17,20,38,0.3)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(250,204,21,0.1)', color: '#facc15' }}>
                <Coins size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Unpaid wages</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#facc15', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {dailyStats.unpaidWages.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: '600' }}>PKR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Attendance Grid Sheet */}
          <div 
            className="glass-card" 
            style={{
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'rgba(17, 20, 38, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="compact-mobile-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Employee Details</th>
                    <th className="hide-on-mobile" style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Wage Rate (PKR)</th>
                    <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Attendance logs</th>
                    <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Daily Payroll Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        No staff members found in the directory. Please navigate to the <strong>Staff Registry</strong> to register your employees.
                      </td>
                    </tr>
                  ) : (
                    dailyAttendance.map((item, idx) => {
                      const isPresent = item.status === 'present';
                      return (
                        <tr 
                          key={item.employee_id} 
                          style={{ 
                            borderBottom: idx === dailyAttendance.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            background: isPresent ? 'rgba(255,255,255,0.005)' : 'rgba(244,63,94,0.015)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div 
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: '700',
                                  fontSize: '14px'
                                }}
                              >
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{item.name}</div>
                                <div className="hide-on-mobile" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Registered Staff Member</div>
                                <div className="show-on-mobile-block" style={{ fontSize: '11px', color: 'var(--color-teal)', marginTop: '2px' }}>
                                  Rate: {item.per_day_salary.toLocaleString()} PKR / Day
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="hide-on-mobile" style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-display)' }}>
                            {item.per_day_salary.toLocaleString()} <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>PKR / Day</span>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            <button 
                              onClick={() => toggleAttendanceStatus(item.employee_id)}
                              disabled={!isAdmin}
                              style={{
                                background: isPresent ? 'rgba(20,233,178,0.12)' : 'rgba(244,63,94,0.12)',
                                border: `1px solid ${isPresent ? 'rgba(20,233,178,0.3)' : 'rgba(244,63,94,0.3)'}`,
                                color: isPresent ? '#14e9b2' : '#fb7185',
                                padding: '6px 16px',
                                borderRadius: '30px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: isAdmin ? 'pointer' : 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                minWidth: '100px',
                                justifyContent: 'center',
                                outline: 'none',
                                textShadow: isPresent ? '0 0 8px rgba(20,233,178,0.2)' : 'none',
                                boxShadow: isPresent ? '0 0 10px rgba(20,233,178,0.05)' : 'none',
                                transition: 'all 0.2s'
                              }}
                              className="attendance-badge"
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle size={12} />
                                  Present
                                </>
                              ) : (
                                <>
                                  <X size={12} />
                                  Absent
                                </>
                              )}
                            </button>
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                            {isPresent ? (
                              <button 
                                onClick={() => togglePaymentPaid(item.employee_id)}
                                disabled={!isAdmin}
                                style={{
                                  background: item.paid ? 'rgba(16,185,129,0.12)' : 'rgba(250,204,21,0.12)',
                                  border: `1px solid ${item.paid ? 'rgba(16,185,129,0.3)' : 'rgba(250,204,21,0.3)'}`,
                                  color: item.paid ? '#10b981' : '#facc15',
                                  padding: '6px 16px',
                                  borderRadius: '30px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: isAdmin ? 'pointer' : 'not-allowed',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  minWidth: '100px',
                                  justifyContent: 'center',
                                  outline: 'none',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {item.paid ? (
                                  <>
                                    <Check size={12} />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Coins size={12} />
                                    Unpaid
                                  </>
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Absence Gated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB 2: STAFF REGISTRY */}
      {/* ==================================================== */}
      {activeSubTab === 'registry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Header bar */}
          <div className="attendance-header-card">
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
              <input 
                type="text"
                placeholder="Search staff registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', fontSize: '13px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            </div>

            {isAdmin && (
              <button 
                onClick={openAddModal}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px' }}
              >
                <UserPlus size={16} />
                Register New Employee
              </button>
            )}
          </div>

          {/* Employees List Grid */}
          <div 
            className="glass-card"
            style={{
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'rgba(17, 20, 38, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="compact-mobile-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Employee Profile</th>
                    <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Daily Salary Rate</th>
                    <th className="hide-on-mobile" style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Address</th>
                    {isAdmin && <th style={{ padding: '16px 24px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 4 : 3} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        No staff matching your search filter was found.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, idx) => (
                      <tr 
                        key={emp.id} 
                        style={{ 
                          borderBottom: idx === filteredEmployees.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                          background: 'rgba(255,255,255,0.002)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div 
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(20,233,178,0.1) 0%, rgba(20,233,178,0.2) 100%)',
                                border: '1px solid rgba(20,233,178,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#14e9b2',
                                fontWeight: '700',
                                fontSize: '14px',
                                textShadow: '0 0 8px rgba(20,233,178,0.3)',
                                boxShadow: '0 0 8px rgba(20,233,178,0.08)'
                              }}
                            >
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#fff' }}>{emp.name}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Award size={12} style={{ color: '#14e9b2' }} />
                                Registered Staff
                              </div>
                              <div className="show-on-mobile-block" style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={11} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                                    {emp.address || 'No address logged'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-display)' }}>
                          {emp.per_day_salary.toLocaleString()} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>PKR</span>
                        </td>
                        <td className="hide-on-mobile" style={{ padding: '16px 24px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp.address}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                            <span>{emp.address || 'No address logged'}</span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                onClick={() => openEditModal(emp)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', outline: 'none' }}
                                title="Edit employee details"
                              >
                                <Edit3 size={13} style={{ color: '#14e9b2' }} />
                              </button>
                              <button 
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.1)', background: 'rgba(244,63,94,0.02)', outline: 'none' }}
                                title="Remove employee from directory"
                              >
                                <Trash2 size={13} style={{ color: '#fb7185' }} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Employee Glassmorphic Modal */}
          {isModalOpen && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(4, 5, 12, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
            >
              <div 
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '440px',
                  background: 'rgba(17, 20, 38, 0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
              >
                {/* Modal Title bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} style={{ color: '#14e9b2' }} />
                    {editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', display: 'flex', outline: 'none' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEmployee} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Employee Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Ali Khan"
                      value={empForm.name}
                      onChange={(e) => setEmpForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Daily wage rate (PKR)</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 1500"
                      value={empForm.per_day_salary}
                      onChange={(e) => setEmpForm(prev => ({ ...prev, per_day_salary: e.target.value }))}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Home Address</label>
                    <textarea 
                      placeholder="Address details..."
                      value={empForm.address}
                      onChange={(e) => setEmpForm(prev => ({ ...prev, address: e.target.value }))}
                      className="form-input"
                      rows="3"
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '12px', borderRadius: '10px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Save size={15} />
                      Save details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB TAB 3: DATE-RANGE BILLING & PAYROLL REPORTS */}
      {/* ==================================================== */}
      {activeSubTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Date Selector range block */}
          <div className="attendance-header-card">
            <div className="attendance-header-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Start Date:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                  style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>End Date:</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                  style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                />
              </div>
            </div>

            <button 
              onClick={loadRangeReport}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px' }}
            >
              <Filter size={15} />
              Filter Range
            </button>
          </div>

          {/* Analysis Grid */}
          <div 
            className="glass-card" 
            style={{
              padding: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'rgba(17, 20, 38, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="compact-mobile-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Employee</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Present Days</th>
                    <th className="hide-on-mobile" style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' }}>Absent Days</th>
                    <th className="hide-on-mobile" style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Total Earned</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Paid Amount</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Remaining Unpaid</th>
                    {isAdmin && <th style={{ padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        No records found in this date range. Verify that attendance has been marked for these dates.
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row, idx) => {
                      const hasBalance = row.remainingBalance > 0;
                      return (
                        <tr 
                          key={row.employeeId} 
                          style={{ 
                            borderBottom: idx === reportRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            background: hasBalance ? 'rgba(250,204,21,0.005)' : 'rgba(255,255,255,0.002)'
                          }}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{row.name}</div>
                              <div className="hide-on-mobile" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                Rate: {row.perDaySalary.toLocaleString()} PKR / Day
                              </div>
                              <div className="show-on-mobile-block" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                Rate: {row.perDaySalary.toLocaleString()} PKR • Earned: {row.totalEarned.toLocaleString()} PKR
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                            {row.presentDays}
                          </td>
                          <td className="hide-on-mobile" style={{ padding: '16px 20px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.4)' }}>
                            {row.absentDays}
                          </td>
                          <td className="hide-on-mobile" style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-display)' }}>
                            {row.totalEarned.toLocaleString()} <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>PKR</span>
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700', color: '#10b981', fontFamily: 'var(--font-display)' }}>
                            {row.paidWages.toLocaleString()} <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>PKR</span>
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '800', color: hasBalance ? '#facc15' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)' }}>
                            {row.remainingBalance.toLocaleString()} <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>PKR</span>
                          </td>
                          {isAdmin && (
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              {hasBalance ? (
                                <button 
                                  onClick={() => handleClearBalance(row.employeeId, row.name, row.remainingBalance)}
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '11.5px',
                                    borderColor: 'rgba(250,204,21,0.3)',
                                    color: '#facc15',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    outline: 'none',
                                    background: 'rgba(250,204,21,0.03)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(250,204,21,0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(250,204,21,0.03)';
                                  }}
                                >
                                  <Coins size={12} />
                                  Settle Wages
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle size={12} />
                                  All Paid
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

    </div>
  );
};

export default AttendanceManager;
