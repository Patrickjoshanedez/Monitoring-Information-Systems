import React, { createContext, useState, useEffect } from 'react';
import RoleSelectModal from '../../components/auth/RoleSelectModal';

export const RoleModalContext = createContext({ open: () => {} });

export const RoleModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('openRoleModal', handler);
    return () => window.removeEventListener('openRoleModal', handler);
  }, []);

  return (
    <RoleModalContext.Provider value={{ open: () => setOpen(true), close: () => setOpen(false) }}>
      {children}
      <RoleSelectModal open={open} onClose={() => setOpen(false)} />
    </RoleModalContext.Provider>
  );
};

export default RoleModalContext;
