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
