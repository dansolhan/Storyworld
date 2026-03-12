import React from 'react';
import { MenuBar, type MenuConfig } from '../components/ui/MenuBar/MenuBar';

interface MainLayoutProps {
  mode: 'dashboard' | 'editor' | 'player';
  menus: MenuConfig[];
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ mode, menus, children }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {mode !== 'dashboard' && <MenuBar menus={menus} />}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};
