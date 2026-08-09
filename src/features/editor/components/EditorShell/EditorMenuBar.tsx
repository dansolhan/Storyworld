import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Play } from 'lucide-react';
import type { MenuConfig } from '../../../../components/ui/MenuBar/MenuBar';
import { useEditorStore } from '../../store/useEditorStore';
import styles from './EditorMenuBar.module.css';

export interface EditorMenuBarProps {
  /** File / Story / View groups, rendered as sections of the wordmark menu. */
  menus: MenuConfig[];
  onPlay: () => void;
}

/**
 * The editor's 40px chrome.
 *
 * The design draws this bar bare — wordmark, story title, Play — with no
 * menu row. Rather than lose File, Story and View, the wordmark itself is the
 * menu trigger: the bar looks as designed and nothing becomes unreachable.
 */
export const EditorMenuBar: React.FC<EditorMenuBarProps> = ({ menus, onPlay }) => {
  const storyTitle = useEditorStore((state) => state.storyTitle);

  return (
    <header className={styles.bar}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={styles.wordmark} aria-label="Storyworld menu">
          Storyworld
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles.menu} align="start" sideOffset={6}>
            {menus.map((menu, menuIndex) => (
              <React.Fragment key={menu.label}>
                {menuIndex > 0 && <DropdownMenu.Separator className={styles.separator} />}
                <DropdownMenu.Label className={styles.menuHeading}>{menu.label}</DropdownMenu.Label>
                {menu.items.map((item, itemIndex) =>
                  item.divider ? (
                    <DropdownMenu.Separator
                      key={`divider-${menu.label}-${itemIndex}`}
                      className={styles.separator}
                    />
                  ) : (
                    <DropdownMenu.Item
                      key={item.label}
                      className={styles.menuItem}
                      onSelect={() => item.onClick?.()}
                    >
                      {item.label}
                    </DropdownMenu.Item>
                  )
                )}
              </React.Fragment>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <span className={styles.storyTitle}>{storyTitle}</span>

      <button type="button" className={styles.play} onClick={onPlay}>
        <Play className={styles.playIcon} aria-hidden="true" />
        Play
      </button>
    </header>
  );
};
