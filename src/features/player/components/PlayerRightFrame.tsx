import React from 'react';
import { Inventory } from './Inventory/Inventory';
import { StatusDataDisplay } from './StatusDataDisplay/StatusDataDisplay';
import styles from '../Player.module.css';

export const PlayerRightFrame: React.FC = () => {
  return (
    <div className={styles.rightFrame}>
      <StatusDataDisplay />
      <Inventory />
    </div>
  );
};
