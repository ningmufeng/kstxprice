import React, { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext({ toast: () => {} });

export const ToastProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const toast = useCallback(({ title, description, variant }) => {
    const id = Date.now();
    const message = { id, title, description, variant };
    setMessages(prev => [...prev, message]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 3000);
    if (typeof window !== 'undefined') {
      // 简单控制台输出，避免构建期报错
      console.log(`[Toast:${variant || 'default'}]`, title, description || '');
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* 简易浮层渲染，非SSR依赖 */}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
        {messages.map(m => (
          <div key={m.id} style={{
            marginTop: 8,
            background: m.variant === 'destructive' ? '#fee2e2' : '#eff6ff',
            color: '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: 200
          }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
            {m.description && <div style={{ fontSize: 12, opacity: 0.8 }}>{m.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export const Button = ({ children, onClick, className = '', variant = 'default', disabled = false, ...rest }) => {
  const background = variant === 'outline' ? 'transparent' : '#2563eb';
  const color = variant === 'outline' ? '#2563eb' : '#ffffff';
  const border = '1px solid #2563eb';
  const opacity = disabled ? 0.5 : 1;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={className}
      style={{
        background,
        color,
        border,
        borderRadius: 6,
        padding: '8px 12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity,
        fontWeight: 500
      }}
      {...rest}
    >
      {children}
    </button>
  );
};


