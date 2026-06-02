import { createClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_DB_KEY = 'qasim_pan_shop_db_records';
const SETTINGS_KEY = 'qasim_pan_shop_supabase_settings';

// Built-in default Supabase cloud credentials
const DEFAULT_URL = 'https://whmdxujnjdwportxaloi.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobWR4dWpuamR3cG9ydHhhbG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTY5MzMsImV4cCI6MjA5NDc5MjkzM30.LWdQ3MxIPYEWHd56gCczS7efQUIet_oVtzbdlH4jpxQ';

export const getSupabaseSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we only use saved credentials if they actually contain valid non-empty values
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
    // Default fallback is always your active Supabase cloud database
    return { url: DEFAULT_URL, anonKey: DEFAULT_ANON_KEY };
  } catch (e) {
    return { url: DEFAULT_URL, anonKey: DEFAULT_ANON_KEY };
  }
};

export const saveSupabaseSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const clearSupabaseSettings = () => {
  localStorage.removeItem(SETTINGS_KEY);
};

// Initialize client if credentials exist
let supabase = null;
const settings = getSupabaseSettings();
if (settings.url && settings.anonKey) {
  try {
    supabase = createClient(settings.url, settings.anonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

// Check if we are connected to Supabase
export const isSupabaseConnected = () => {
  return supabase !== null;
};

// Helper: Generate rich realistic demo data for first-time use
const generateDemoData = () => {
  const demoRecords = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  // Generate records for the past 20 days
  for (let i = 1; i <= Math.min(20, today.getDate()); i++) {
    const dayDate = new Date(year, month, i);
    const dateString = dayDate.toISOString().split('T')[0];

    // Seed variables based on day of week to make data organic
    const dayOfWeek = dayDate.getDay();
    const salesBase = 8000 + (dayOfWeek * 800) + (i % 3 === 0 ? 1500 : 0);
    const sales = Math.round(salesBase);
    const purchases = Math.round(sales * 0.45 + (i % 2 === 0 ? 500 : 0));
    const expenses = Math.round(400 + (dayOfWeek === 0 ? 600 : 0) + (i % 4 === 0 ? 250 : 0));
    
    // Profit margin between 10% and 15%
    const margin = 11.5 + (i % 7) * 0.5; // ranges from 11.5% to 15%
    
    // Revenue split
    const cashShare = 0.4 + (i % 5) * 0.08; // 40% to 72% cash
    const cashInHand = Math.round(sales * cashShare);
    const paymentInAccount = sales - cashInHand;

    demoRecords.push({
      id: `demo-rec-${i}`,
      date: dateString,
      sales,
      purchases,
      expenses,
      cash_in_hand: cashInHand,
      payment_in_account: paymentInAccount,
      profit_margin_percentage: parseFloat(margin.toFixed(1)),
      created_at: new Date(dayDate.getTime() + 43200000).toISOString() // Mid-day
    });
  }

  // Also seed a couple of records for the previous month (to show month switching works)
  const prevMonthDate = new Date(year, month - 1, 1);
  if (prevMonthDate) {
    const prevYear = prevMonthDate.getFullYear();
    const prevMon = prevMonthDate.getMonth();
    for (let i = 15; i <= 18; i++) {
      const dayDate = new Date(prevYear, prevMon, i);
      const dateString = dayDate.toISOString().split('T')[0];
      const sales = 9500 + i * 100;
      const purchases = Math.round(sales * 0.46);
      const expenses = 500;
      const margin = 12.0;
      const cashInHand = Math.round(sales * 0.5);
      const paymentInAccount = sales - cashInHand;

      demoRecords.push({
        id: `demo-prev-${i}`,
        date: dateString,
        sales,
        purchases,
        expenses,
        cash_in_hand: cashInHand,
        payment_in_account: paymentInAccount,
        profit_margin_percentage: margin,
        created_at: new Date(dayDate.getTime() + 43200000).toISOString()
      });
    }
  }

  // Sort descending by date
  return demoRecords.sort((a, b) => b.date.localeCompare(a.date));
};

// Retrieve records from DB or LocalStorage fallback
export const getRecords = async () => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Supabase query failed, falling back to LocalStorage:', e);
    }
  }

  // LocalStorage Fallback
  let localData = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
  if (!localData) {
    const demo = generateDemoData();
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(demo));
    return demo;
  }
  
  try {
    return JSON.parse(localData).sort((a, b) => b.date.localeCompare(a.date));
  } catch (e) {
    const demo = generateDemoData();
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(demo));
    return demo;
  }
};

// Add record
export const addRecord = async (record) => {
  const newRecord = {
    ...record,
    sales: parseFloat(record.sales) || 0,
    purchases: parseFloat(record.purchases) || 0,
    expenses: parseFloat(record.expenses) || 0,
    cash_in_hand: parseFloat(record.cash_in_hand) || 0,
    payment_in_account: parseFloat(record.payment_in_account) || 0,
    profit_margin_percentage: parseFloat(record.profit_margin_percentage) || 12.5,
  };

  if (isSupabaseConnected()) {
    try {
      // Remove local client id generator if any before pushing to supabase
      const { id, ...supabaseRecord } = newRecord;
      const { data, error } = await supabase
        .from('daily_records')
        .insert([supabaseRecord])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase insert failed:', e);
      return { success: false, error: e.message || 'Supabase Insert Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const records = await getRecords();
    
    // Check if record for this date already exists (unique date check)
    const exists = records.some(r => r.date === newRecord.date);
    if (exists) {
      return { success: false, error: `A record for the date ${newRecord.date} already exists!` };
    }

    const createdRecord = {
      ...newRecord,
      id: `local-rec-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    records.push(createdRecord);
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(records));
    return { success: true, data: createdRecord };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

// Update record
export const updateRecord = async (id, updatedFields) => {
  const parsedFields = {
    ...updatedFields,
    sales: parseFloat(updatedFields.sales) || 0,
    purchases: parseFloat(updatedFields.purchases) || 0,
    expenses: parseFloat(updatedFields.expenses) || 0,
    cash_in_hand: parseFloat(updatedFields.cash_in_hand) || 0,
    payment_in_account: parseFloat(updatedFields.payment_in_account) || 0,
    profit_margin_percentage: parseFloat(updatedFields.profit_margin_percentage) || 12.5,
  };

  if (isSupabaseConnected()) {
    try {
      const { id: dummyId, created_at, ...updateData } = parsedFields;
      const { data, error } = await supabase
        .from('daily_records')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase update failed:', e);
      return { success: false, error: e.message || 'Supabase Update Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const records = await getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, error: 'Record not found.' };
    }

    // Check date uniqueness if changed
    if (parsedFields.date && parsedFields.date !== records[index].date) {
      const exists = records.some(r => r.date === parsedFields.date && r.id !== id);
      if (exists) {
        return { success: false, error: `A record for the date ${parsedFields.date} already exists!` };
      }
    }

    const updatedRecord = {
      ...records[index],
      ...parsedFields
    };
    records[index] = updatedRecord;
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(records));
    return { success: true, data: updatedRecord };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

// Delete record
export const deleteRecord = async (id) => {
  if (isSupabaseConnected()) {
    try {
      const { error } = await supabase
        .from('daily_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Supabase delete failed:', e);
      return { success: false, error: e.message || 'Supabase Delete Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const records = await getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

// Try Re-initializing client when settings change
export const reinitializeSupabase = () => {
  const newSettings = getSupabaseSettings();
  if (newSettings.url && newSettings.anonKey) {
    try {
      supabase = createClient(newSettings.url, newSettings.anonKey);
      return true;
    } catch (e) {
      console.error('Reinitialization failed:', e);
      supabase = null;
      return false;
    }
  } else {
    supabase = null;
    return false;
  }
};

// ==========================================
// EMPLOYEES & ATTENDANCE OPERATIONS
// ==========================================

const EMPLOYEES_KEY = 'qasim_pan_shop_employees';
const ATTENDANCE_KEY = 'qasim_pan_shop_attendance';

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'Ali Khan', per_day_salary: 1500, address: 'Main Bazar, Shop 4, Sector G' },
  { id: 'emp-2', name: 'Bilal Ahmad', per_day_salary: 1200, address: 'Street 12, House 42, Sector F' },
  { id: 'emp-3', name: 'Usman Farooq', per_day_salary: 1800, address: 'Near Bilal Mosque, Block C' }
];

const generateDemoAttendance = () => {
  const attendance = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Generate for the past 12 days
  for (let d = 1; d <= 12; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];

    // Ali Khan: present 9 days, 7 paid, 2 unpaid
    if (d <= 9) {
      attendance.push({
        id: `att-ali-${d}`,
        employee_id: 'emp-1',
        date: dateStr,
        status: 'present',
        paid: d <= 7
      });
    } else {
      attendance.push({
        id: `att-ali-${d}`,
        employee_id: 'emp-1',
        date: dateStr,
        status: 'absent',
        paid: false
      });
    }

    // Bilal Ahmad: present 8 days, 8 paid, 0 unpaid
    if (d <= 8) {
      attendance.push({
        id: `att-bil-${d}`,
        employee_id: 'emp-2',
        date: dateStr,
        status: 'present',
        paid: true
      });
    } else {
      attendance.push({
        id: `att-bil-${d}`,
        employee_id: 'emp-2',
        date: dateStr,
        status: 'absent',
        paid: false
      });
    }

    // Usman Farooq: present 10 days, 6 paid, 4 unpaid
    if (d <= 10) {
      attendance.push({
        id: `att-usm-${d}`,
        employee_id: 'emp-3',
        date: dateStr,
        status: 'present',
        paid: d <= 6
      });
    } else {
      attendance.push({
        id: `att-usm-${d}`,
        employee_id: 'emp-3',
        date: dateStr,
        status: 'absent',
        paid: false
      });
    }
  }
  return attendance;
};

const getRawAttendance = async () => {
  let localData = localStorage.getItem(ATTENDANCE_KEY);
  if (!localData) {
    const demo = generateDemoAttendance();
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(demo));
    return demo;
  }
  try {
    return JSON.parse(localData);
  } catch (e) {
    const demo = generateDemoAttendance();
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(demo));
    return demo;
  }
};

export const getEmployees = async () => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Supabase getEmployees failed, falling back to LocalStorage:', e);
    }
  }

  // LocalStorage Fallback
  let localData = localStorage.getItem(EMPLOYEES_KEY);
  if (!localData) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }
  try {
    return JSON.parse(localData);
  } catch (e) {
    return DEFAULT_EMPLOYEES;
  }
};

export const addEmployee = async (employee) => {
  const newEmp = {
    ...employee,
    per_day_salary: parseFloat(employee.per_day_salary) || 0
  };

  if (isSupabaseConnected()) {
    try {
      const { id, ...supabaseEmp } = newEmp; // Allow UUID generation by database
      const { data, error } = await supabase
        .from('employees')
        .insert([supabaseEmp])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase addEmployee failed:', e);
      return { success: false, error: e.message || 'Supabase Insert Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const employees = await getEmployees();
    const createdEmp = {
      ...newEmp,
      id: `emp-${Date.now()}`
    };
    employees.push(createdEmp);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    return { success: true, data: createdEmp };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const updateEmployee = async (id, updatedFields) => {
  const parsedFields = {
    ...updatedFields,
    per_day_salary: parseFloat(updatedFields.per_day_salary) || 0
  };

  if (isSupabaseConnected()) {
    try {
      const { id: dummyId, created_at, ...updateData } = parsedFields;
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase updateEmployee failed:', e);
      return { success: false, error: e.message || 'Supabase Update Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const employees = await getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: 'Employee not found.' };
    }
    const updated = {
      ...employees[index],
      ...parsedFields
    };
    employees[index] = updated;
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    return { success: true, data: updated };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const deleteEmployee = async (id) => {
  if (isSupabaseConnected()) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Supabase deleteEmployee failed:', e);
      return { success: false, error: e.message || 'Supabase Delete Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const employees = await getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(filtered));

    // Also clean up local attendance records for this employee
    const attendance = await getRawAttendance();
    const filteredAttendance = attendance.filter(a => a.employee_id !== id);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filteredAttendance));

    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const getAttendance = async (date) => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (error) throw error;
      return data;
    } catch (e) {
      console.error(`Supabase getAttendance failed for ${date}:`, e);
    }
  }

  // LocalStorage Fallback
  const raw = await getRawAttendance();
  return raw.filter(a => a.date === date);
};

export const saveAttendance = async (records) => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'employee_id,date' })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      console.error('Supabase saveAttendance failed:', e);
      return { success: false, error: e.message || 'Supabase Upsert Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const raw = await getRawAttendance();
    records.forEach(rec => {
      const index = raw.findIndex(a => a.employee_id === rec.employee_id && a.date === rec.date);
      if (index !== -1) {
        raw[index] = {
          ...raw[index],
          status: rec.status,
          paid: rec.paid
        };
      } else {
        raw.push({
          ...rec,
          id: `att-loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        });
      }
    });
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(raw));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const getAttendanceRangeReport = async (startDate, endDate) => {
  const employees = await getEmployees();
  let attendance = [];

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      attendance = data;
    } catch (e) {
      console.error('Supabase range report failed, falling back to LocalStorage:', e);
      const raw = await getRawAttendance();
      attendance = raw.filter(a => a.date >= startDate && a.date <= endDate);
    }
  } else {
    const raw = await getRawAttendance();
    attendance = raw.filter(a => a.date >= startDate && a.date <= endDate);
  }

  return employees.map(emp => {
    const empAtt = attendance.filter(a => a.employee_id === emp.id);
    const presentDays = empAtt.filter(a => a.status === 'present').length;
    const absentDays = empAtt.filter(a => a.status === 'absent').length;

    const totalEarned = presentDays * emp.per_day_salary;
    const paidWages = empAtt.filter(a => a.status === 'present' && a.paid).length * emp.per_day_salary;
    const remainingBalance = totalEarned - paidWages;

    return {
      employeeId: emp.id,
      name: emp.name,
      perDaySalary: emp.per_day_salary,
      address: emp.address || 'N/A',
      presentDays,
      absentDays,
      totalEarned,
      paidWages,
      remainingBalance
    };
  });
};

export const payRemainingBalance = async (employeeId, startDate, endDate) => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update({ paid: true })
        .eq('employee_id', employeeId)
        .eq('status', 'present')
        .gte('date', startDate)
        .lte('date', endDate)
        .select();

      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Supabase payRemainingBalance failed:', e);
      return { success: false, error: e.message || 'Supabase Update Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const raw = await getRawAttendance();
    raw.forEach((a, index) => {
      if (
        a.employee_id === employeeId &&
        a.date >= startDate &&
        a.date <= endDate &&
        a.status === 'present'
      ) {
        raw[index].paid = true;
      }
    });
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(raw));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

// ==========================================
// STOCK INVENTORY OPERATIONS (BRANDS & PRODUCTS)
// ==========================================

const BRANDS_KEY = 'qasim_pan_shop_brands';
const PRODUCTS_KEY = 'qasim_pan_shop_products';

const DEFAULT_BRANDS = [
  { id: 'brand-1', name: 'Coca-Cola' },
  { id: 'brand-2', name: 'PepsiCo' },
  { id: 'brand-3', name: 'Shezan' },
  { id: 'brand-4', name: 'Gold Leaf' },
  { id: 'brand-5', name: 'Capstan' }
];

const DEFAULT_PRODUCTS = [
  { id: 'prod-1', brand_id: 'brand-1', name: 'Zero Sugar Can', quantity: 24 },
  { id: 'prod-2', brand_id: 'brand-1', name: 'Regular Can', quantity: 48 },
  { id: 'prod-3', brand_id: 'brand-1', name: '1.5L PET', quantity: 12 },
  { id: 'prod-4', brand_id: 'brand-1', name: '500ml PET', quantity: 30 },
  
  { id: 'prod-5', brand_id: 'brand-2', name: 'Can', quantity: 36 },
  { id: 'prod-6', brand_id: 'brand-2', name: '1.5L PET', quantity: 15 },
  { id: 'prod-7', brand_id: 'brand-2', name: '345ml Bottle', quantity: 24 },
  
  { id: 'prod-8', brand_id: 'brand-3', name: 'Mango Juice Box', quantity: 40 },
  
  { id: 'prod-9', brand_id: 'brand-4', name: 'Single Cigarette', quantity: 200 },
  { id: 'prod-10', brand_id: 'brand-4', name: 'Pack of 20', quantity: 15 },
  
  { id: 'prod-11', brand_id: 'brand-5', name: 'Single Cigarette', quantity: 120 },
  { id: 'prod-12', brand_id: 'brand-5', name: 'Pack of 20', quantity: 10 }
];

export const getBrands = async () => {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Supabase getBrands failed, falling back to LocalStorage:', e);
    }
  }

  // LocalStorage Fallback
  let localData = localStorage.getItem(BRANDS_KEY);
  if (!localData) {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(DEFAULT_BRANDS));
    return DEFAULT_BRANDS;
  }
  try {
    return JSON.parse(localData);
  } catch (e) {
    return DEFAULT_BRANDS;
  }
};

export const addBrand = async (brand) => {
  const newBrand = {
    ...brand,
    name: brand.name.trim()
  };

  if (isSupabaseConnected()) {
    try {
      const { id, ...supabaseBrand } = newBrand;
      const { data, error } = await supabase
        .from('brands')
        .insert([supabaseBrand])
        .select();
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase addBrand failed:', e);
      return { success: false, error: e.message || 'Supabase Insert Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const brands = await getBrands();
    const exists = brands.some(b => b.name.toLowerCase() === newBrand.name.toLowerCase());
    if (exists) {
      return { success: false, error: `Brand "${newBrand.name}" already exists!` };
    }
    const createdBrand = {
      ...newBrand,
      id: `brand-${Date.now()}`
    };
    brands.push(createdBrand);
    localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
    return { success: true, data: createdBrand };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const deleteBrand = async (id) => {
  if (isSupabaseConnected()) {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Supabase deleteBrand failed:', e);
      return { success: false, error: e.message || 'Supabase Delete Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const brands = await getBrands();
    const filteredBrands = brands.filter(b => b.id !== id);
    localStorage.setItem(BRANDS_KEY, JSON.stringify(filteredBrands));

    // Cascade delete products under this brand
    const products = await getProductsRaw();
    const filteredProducts = products.filter(p => p.brand_id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filteredProducts));

    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

const getProductsRaw = async () => {
  let localData = localStorage.getItem(PRODUCTS_KEY);
  if (!localData) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(localData);
  } catch (e) {
    return DEFAULT_PRODUCTS;
  }
};

export const getProducts = async () => {
  if (isSupabaseConnected()) {
    try {
      // Query products joined with brands
      const { data, error } = await supabase
        .from('products')
        .select('*, brands(name)')
        .order('name', { ascending: true });
      if (error) throw error;
      
      // Map to consistent format
      return data.map(p => ({
        ...p,
        brand_name: p.brands ? p.brands.name : 'Unknown Brand'
      }));
    } catch (e) {
      console.error('Supabase getProducts failed, falling back to LocalStorage:', e);
    }
  }

  // LocalStorage Fallback
  const products = await getProductsRaw();
  const brands = await getBrands();
  return products.map(p => {
    const brand = brands.find(b => b.id === p.brand_id);
    return {
      ...p,
      brand_name: brand ? brand.name : 'Unknown Brand'
    };
  });
};

export const addProduct = async (product) => {
  const newProduct = {
    ...product,
    name: product.name.trim(),
    quantity: parseInt(product.quantity) || 0
  };

  if (isSupabaseConnected()) {
    try {
      const { id, ...supabaseProduct } = newProduct;
      const { data, error } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select('*, brands(name)');
      if (error) throw error;
      return { 
        success: true, 
        data: {
          ...data[0],
          brand_name: data[0].brands ? data[0].brands.name : 'Unknown Brand'
        } 
      };
    } catch (e) {
      console.error('Supabase addProduct failed:', e);
      return { success: false, error: e.message || 'Supabase Insert Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const products = await getProductsRaw();
    const exists = products.some(p => p.brand_id === newProduct.brand_id && p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (exists) {
      return { success: false, error: `This item already exists under this brand!` };
    }
    const createdProduct = {
      ...newProduct,
      id: `prod-${Date.now()}`
    };
    products.push(createdProduct);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    
    const brands = await getBrands();
    const brand = brands.find(b => b.id === createdProduct.brand_id);
    return { 
      success: true, 
      data: {
        ...createdProduct,
        brand_name: brand ? brand.name : 'Unknown Brand'
      } 
    };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const adjustProductQuantity = async (id, delta) => {
  if (isSupabaseConnected()) {
    try {
      const { data: current, error: getErr } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', id)
        .single();
      if (getErr) throw getErr;

      const newQty = Math.max(0, (current.quantity || 0) + delta);

      const { data, error } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', id)
        .select();
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (e) {
      console.error('Supabase adjustProductQuantity failed:', e);
      return { success: false, error: e.message || 'Supabase Update Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const products = await getProductsRaw();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Product not found.' };
    }
    products[index].quantity = Math.max(0, (products[index].quantity || 0) + delta);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return { success: true, data: products[index] };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};

export const deleteProduct = async (id) => {
  if (isSupabaseConnected()) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Supabase deleteProduct failed:', e);
      return { success: false, error: e.message || 'Supabase Delete Error' };
    }
  }

  // LocalStorage Fallback
  try {
    const products = await getProductsRaw();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'LocalStorage writing failed.' };
  }
};


