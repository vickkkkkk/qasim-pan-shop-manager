import React from 'react';

const KpiCard = ({ title, value, icon: Icon, colorClass, subtitle, suffix = 'PKR' }) => {
  // Mapping for custom colors & glows
  const colorMap = {
    teal: {
      border: 'rgba(20, 233, 178, 0.15)',
      glow: 'rgba(20, 233, 178, 0.1)',
      text: '#14e9b2',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(20, 233, 178, 0.08), transparent 80%)'
    },
    purple: {
      border: 'rgba(147, 51, 234, 0.15)',
      glow: 'rgba(147, 51, 234, 0.1)',
      text: '#a855f7',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(147, 51, 234, 0.08), transparent 80%)'
    },
    rose: {
      border: 'rgba(244, 63, 94, 0.15)',
      glow: 'rgba(244, 63, 94, 0.1)',
      text: '#fb7185',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(244, 63, 94, 0.08), transparent 80%)'
    },
    gold: {
      border: 'rgba(234, 179, 8, 0.15)',
      glow: 'rgba(234, 179, 8, 0.1)',
      text: '#facc15',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(234, 179, 8, 0.08), transparent 80%)'
    },
    emerald: {
      border: 'rgba(16, 185, 129, 0.15)',
      glow: 'rgba(16, 185, 129, 0.1)',
      text: '#34d399',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(16, 185, 129, 0.08), transparent 80%)'
    },
    cyan: {
      border: 'rgba(6, 182, 212, 0.15)',
      glow: 'rgba(6, 182, 212, 0.1)',
      text: '#22d3ee',
      bgGlow: 'radial-gradient(80px circle at 0px 0px, rgba(6, 182, 212, 0.08), transparent 80%)'
    }
  };

  const currentTheme = colorMap[colorClass] || colorMap.teal;

  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div 
      className="kpi-card"
      style={{
        position: 'relative',
        background: 'rgba(17, 20, 38, 0.45)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s, box-shadow 0.3s',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = currentTheme.text;
        e.currentTarget.style.boxShadow = `0 12px 40px 0 rgba(0, 0, 0, 0.3), 0 0 16px 0 ${currentTheme.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = currentTheme.border;
        e.currentTarget.style.boxShadow = `0 8px 32px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)`;
      }}
    >
      {/* Glow highlight background */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: currentTheme.bgGlow,
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <span 
          style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'rgba(255, 255, 255, 0.55)', 
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          {title}
        </span>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `rgba(${colorClass === 'teal' ? '20, 233, 178' : colorClass === 'purple' ? '147, 51, 234' : colorClass === 'rose' ? '244, 63, 94' : colorClass === 'gold' ? '234, 179, 8' : colorClass === 'emerald' ? '16, 185, 129' : '6, 182, 212'}, 0.1)`,
            color: currentTheme.text,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', zIndex: 1, marginTop: '4px' }}>
        <span 
          style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#ffffff',
            fontFamily: '"Outfit", sans-serif',
            letterSpacing: '-0.5px'
          }}
        >
          {formattedValue}
        </span>
        {suffix && (
          <span 
            style={{ 
              fontSize: '13px', 
              fontWeight: '500', 
              color: 'rgba(255, 255, 255, 0.4)' 
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {subtitle && (
        <span 
          style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.35)', 
            zIndex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginTop: '2px'
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default KpiCard;
