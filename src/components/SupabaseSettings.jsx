import React, { useState, useEffect } from 'react';
import { Database, Link, Link2Off, CheckCircle, HelpCircle, Copy, Check } from 'lucide-react';
import { getSupabaseSettings, saveSupabaseSettings, clearSupabaseSettings, isSupabaseConnected, reinitializeSupabase } from '../utils/db';

const SupabaseSettings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({ url: '', anonKey: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    setSettings(getSupabaseSettings());
    setIsConnected(isSupabaseConnected());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!settings.url || !settings.anonKey) {
      setMessage({ text: 'Both Supabase URL and Anon Key are required.', type: 'error' });
      return;
    }

    saveSupabaseSettings(settings);
    const success = reinitializeSupabase();
    
    if (success && isSupabaseConnected()) {
      setIsConnected(true);
      setMessage({ text: 'Supabase Connected Successfully!', type: 'success' });
      if (onSettingsChange) onSettingsChange();
    } else {
      setIsConnected(false);
      setMessage({ text: 'Failed to connect. Please verify your Supabase credentials.', type: 'error' });
    }
  };

  const handleDisconnect = () => {
    clearSupabaseSettings();
    reinitializeSupabase();
    setIsConnected(false);
    setSettings({ url: '', anonKey: '' });
    setMessage({ text: 'Disconnected. App returned to Demo Mode (LocalStorage).', type: 'info' });
    if (onSettingsChange) onSettingsChange();
  };

  const sqlSchema = `-- 1. Daily Records Ledger Table
create table daily_records (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  sales numeric not null default 0,
  purchases numeric not null default 0,
  expenses numeric not null default 0,
  cash_in_hand numeric not null default 0,
  payment_in_account numeric not null default 0,
  profit_margin_percentage numeric not null default 12.5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and public policies for daily_records
alter table daily_records enable row level security;
create policy "Allow public read access" on daily_records for select using (true);
create policy "Allow public insert" on daily_records for insert with check (true);
create policy "Allow public update" on daily_records for update using (true);
create policy "Allow public delete" on daily_records for delete using (true);

-- 2. Employees Database Table
create table employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  per_day_salary numeric not null default 0,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and public policies for employees
alter table employees enable row level security;
create policy "Allow public read access" on employees for select using (true);
create policy "Allow public insert" on employees for insert with check (true);
create policy "Allow public update" on employees for update using (true);
create policy "Allow public delete" on employees for delete using (true);

-- 3. Staff Attendance & Payroll Table
create table attendance (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('present', 'absent')),
  paid boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (employee_id, date)
);

-- Enable RLS and public policies for attendance
alter table attendance enable row level security;
create policy "Allow public read access" on attendance for select using (true);
create policy "Allow public insert" on attendance for insert with check (true);
create policy "Allow public update" on attendance for update using (true);
create policy "Allow public delete" on attendance for delete using (true);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Configuration Card */}
      <div 
        className="glass-card"
        style={{
          background: 'rgba(17, 20, 38, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} style={{ color: isConnected ? '#14e9b2' : '#facc15' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#fff' }}>
            Supabase Cloud Connection
          </h3>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '20px',
              marginLeft: 'auto',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: isConnected ? 'rgba(20, 233, 178, 0.1)' : 'rgba(250, 204, 21, 0.1)',
              color: isConnected ? '#14e9b2' : '#facc15',
              border: `1px solid ${isConnected ? 'rgba(20, 233, 178, 0.2)' : 'rgba(250, 204, 21, 0.2)'}`,
              boxShadow: isConnected ? '0 0 10px rgba(20, 233, 178, 0.1)' : 'none'
            }}
          >
            {isConnected ? 'Connected' : 'Demo Mode'}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.55)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
          By default, the dashboard runs in <strong>Demo Mode (LocalStorage)</strong> so it works instantly. 
          To save your real shop records permanently in the cloud (ideal for deploying on Vercel), enter your Supabase credentials below.
        </p>

        {message.text && (
          <div 
            style={{
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              background: message.type === 'success' ? 'rgba(20, 233, 178, 0.08)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${message.type === 'success' ? 'rgba(20, 233, 178, 0.2)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: message.type === 'success' ? '#34d399' : message.type === 'error' ? '#fb7185' : 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {message.type === 'success' ? <CheckCircle size={16} /> : <HelpCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Supabase URL</label>
            <input 
              type="url" 
              name="url"
              placeholder="https://your-project-id.supabase.co"
              value={settings.url}
              onChange={handleChange}
              disabled={isConnected}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Supabase Anon Key</label>
            <input 
              type="password" 
              name="anonKey"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={settings.anonKey}
              onChange={handleChange}
              disabled={isConnected}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {isConnected ? (
              <button 
                type="button" 
                onClick={handleDisconnect}
                className="btn btn-secondary"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Link2Off size={16} />
                Disconnect Database
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Link size={16} />
                Connect Cloud Sync
              </button>
            )}
          </div>
        </form>
      </div>

      {/* SQL Script Card */}
      <div 
        className="glass-card"
        style={{
          background: 'rgba(17, 20, 38, 0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff' }}>
            Supabase SQL Schema Setup
          </h3>
          <button 
            onClick={copyToClipboard}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#fff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {isCopied ? <Check size={14} style={{ color: '#14e9b2' }} /> : <Copy size={14} />}
            {isCopied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.55)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
          Copy and run the following script in the <strong>SQL Editor</strong> tab of your Supabase console to instantly create the required table and open-access security policy:
        </p>

        <pre 
          style={{
            background: 'rgba(5, 6, 12, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            padding: '16px',
            overflowX: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace, Courier New',
            color: '#34d399',
            maxHeight: '220px',
            margin: 0
          }}
        >
          {sqlSchema}
        </pre>
      </div>

    </div>
  );
};

export default SupabaseSettings;
