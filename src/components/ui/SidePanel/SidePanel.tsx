import React, { type ReactNode } from 'react';
import styles from './SidePanel.module.css';

export interface SidePanelProps {
  /** Determines if the side panel is currently visible */
  isOpen: boolean;
  /** Callback triggered when the close button is clicked */
  onClose?: () => void;
  /** Optional title displayed at the top of the panel */
  title?: ReactNode;
  /** Optional actions displayed next to the close button */
  headerActions?: ReactNode;
  /** Rendered content inside the panel */
  children: ReactNode;
  /** Position of the drawer: 'left' | 'right' (default: 'right') */
  position?: 'left' | 'right' | 'bottom';
  /** Width of the panel (e.g. '300px', '25rem') */
  width?: string;
  /** Height of the panel (used only when position is 'bottom') */
  height?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  position = 'right',
  width = '350px',
  height = '350px',
}) => {
  const isVertical = position === 'left' || position === 'right';

  return (
    <aside
      className={`${styles.sidePanel} ${styles[position]} ${isOpen ? styles.open : ''}`}
      style={{
        ...(isVertical
          ? {
            maxWidth: isOpen ? width : '0px',
            width: isOpen ? width : '0px',
          }
          : {
            maxHeight: isOpen ? height : '0px',
            height: isOpen ? height : '0px',
          }
        ),
      }}
      aria-hidden={!isOpen}
    >
      <div className={styles.inner} style={isVertical ? { width } : { height }}>
        {(title || onClose || headerActions) && (
          <header className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {headerActions}
              {onClose && (
                <button
                  className={styles.closeButton}
                  onClick={onClose}
                  aria-label="Close panel"
                >
                  ×
                </button>
              )}
            </div>
          </header>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </aside>
  );
};
