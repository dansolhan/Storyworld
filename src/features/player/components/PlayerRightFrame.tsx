import React from 'react';
import { Inventory } from './Inventory/Inventory';
import { StatusDataDisplay } from './StatusDataDisplay/StatusDataDisplay';
import styles from '../Player.module.css';

export interface PlayerRightFrameProps {
  /** The one quiet way out during play, per the design's ledger header. */
  onExit?: () => void;
}

/**
 * The verso: the reader's ledger on the facing page.
 *
 * It holds the single exit as well, which is why the player no longer carries a
 * header bar or a floating stop button — the design's ending is deliberately bare,
 * and three competing ways out is what that is reacting against.
 */
export const PlayerRightFrame: React.FC<PlayerRightFrameProps> = ({ onExit }) => (
  <aside className={styles.rightFrame}>
    <div className={styles.ledgerHead}>
      <span className={styles.ledgerKicker}>The reader’s ledger</span>
      {onExit && (
        <button type="button" className={styles.ledgerExit} onClick={onExit}>
          Exit
        </button>
      )}
    </div>

    <StatusDataDisplay />
    <Inventory />
  </aside>
);
