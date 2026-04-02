import React from 'react';
import styles from '../BlueprintRenderer.module.css';

interface InteractiveTokenProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}

export const InteractiveToken: React.FC<InteractiveTokenProps> = ({ children, onClick }) => {
  return (
    <span 
      className={styles.interactiveToken} 
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {children}
    </span>
  );
};
