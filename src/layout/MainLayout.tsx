import React from 'react';
import styles from './MainLayout.module.css';

export interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * The app's viewport frame. It deliberately owns no chrome: the editor draws
 * its own menu bar as part of its shell, and the player is a full-surface
 * reading view. A shared menu bar here previously appeared over the player too,
 * where its Data entries pointed at managers the player never mounts.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
