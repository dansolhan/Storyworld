import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** What the tooltip says. */
  content: React.ReactNode;
  /** The thing it describes — usually a button. */
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/** Long enough not to fire while the pointer is only passing over. */
const DELAY_MS = 200;

/**
 * A hover-or-focus explanation.
 *
 * On Radix rather than a `title` attribute or a CSS-only panel, because a tooltip
 * has to work for more than a mouse: this one opens on keyboard focus, closes on
 * Escape, and is wired to its trigger with `aria-describedby` so a screen reader
 * reads the explanation as part of the control rather than as loose text.
 *
 * The trigger must be focusable — pass a `button`, not a `span`.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top' }) => (
  <RadixTooltip.Provider delayDuration={DELAY_MS}>
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className={styles.content} side={side} sideOffset={6} collisionPadding={12}>
          {content}
          <RadixTooltip.Arrow className={styles.arrow} width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  </RadixTooltip.Provider>
);
