import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Sparkles, Key, Crown, ShieldAlert, Award } from 'lucide-react';

const ACCOUNTS = [
  { username: 'waqar', name: 'Waqar', password: 'waqar123', role: 'admin', title: 'Director', color: '#14e9b2', icon: Crown },
  { username: 'faraz', name: 'Faraz', password: 'faraz123', role: 'sub-admin', title: 'CEO', color: '#818cf8', icon: Award },
  { username: 'hafeez', name: 'Hafeez', password: 'hafeez123', role: 'viewer', title: 'Big Boss', color: '#facc15', icon: Sparkles }
];

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate subtle network delay for visual premium feel
    setTimeout(() => {
      const match = ACCOUNTS.find(
        (acc) => acc.username.toLowerCase() === username.trim().toLowerCase() && acc.password === password
      );

      setIsSubmitting(false);

      if (match) {
        // Successful login
        const userData = {
          username: match.username,
          name: match.name,
          role: match.role,
          title: match.title,
          color: match.color
        };
        onLogin(userData);
      } else {
        setError('Invalid username or password. Check credentials below.');
      }
    }, 850);
  };

  const handleAutofill = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: '20px',
        zIndex: 100,
        position: 'relative'
      }}
    >
      <div 
        className="glass-card login-card"
        style={{
          background: 'rgba(15, 18, 36, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          color: '#fff'
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(20, 233, 178, 0.1)',
              border: '1px solid rgba(20, 233, 178, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#14e9b2',
              boxShadow: '0 0 20px rgba(20, 233, 178, 0.15)',
              marginBottom: '8px'
            }}
          >
            <Crown size={28} style={{ filter: 'drop-shadow(0 0 6px #14e9b2)' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', fontFamily: '"Outfit", sans-serif', letterSpacing: '0.5px' }}>
            Qasim Pan Shop
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,0.5)' }}>
            Business Check &amp; Balance Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fb7185',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.2s'
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '11.5px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '44px' }}
                required
                disabled={isSubmitting}
              />
              <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11.5px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                required
                disabled={isSubmitting}
              />
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              fontSize: '14.5px',
              fontWeight: '700', 
              marginTop: '8px',
              filter: 'drop-shadow(0 4px 12px rgba(20, 233, 178, 0.2))' 
            }}
          >
            {isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <span>Verifying...</span>
              </div>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
