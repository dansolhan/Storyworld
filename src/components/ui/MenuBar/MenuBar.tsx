import React, { useState, useRef } from 'react';
import { Popover } from '../Popover/Popover';
import styles from './MenuBar.module.css';

export interface MenuItems {
  label?: string;
  onClick?: () => void;
  divider?: boolean;
}

export interface MenuConfig {
  label: string;
  items: MenuItems[];
}

interface MenuBarProps {
  menus: MenuConfig[];
}

export const MenuBar: React.FC<MenuBarProps> = ({ menus }) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (index: number) => {
    setActiveMenuIndex(activeMenuIndex === index ? null : index);
  };

  const closeMenu = () => {
    setActiveMenuIndex(null);
  };

  return (
    <div className={styles.menuBar} ref={menuBarRef}>
      {menus.map((menu, index) => {
        const isActive = activeMenuIndex === index;
        return (
          <div key={menu.label} className={styles.menuItemContainer}>
            <button
              className={`${styles.menuButton} ${isActive ? styles.active : ''}`}
              onClick={() => handleMenuClick(index)}
              onMouseEnter={() => {
                if (activeMenuIndex !== null) {
                  setActiveMenuIndex(index);
                }
              }}
            >
              {menu.label}
            </button>
            {isActive && menuBarRef.current && (
              <Popover
                isOpen={true}
                onClose={closeMenu}
                x={menuBarRef.current.children[index].getBoundingClientRect().left}
                y={menuBarRef.current.children[index].getBoundingClientRect().bottom}
                className={styles.popoverOverride}
              >
                <div className={styles.dropdownMenu} onClick={e => e.stopPropagation()}>
                  {menu.items.map((item, i) => {
                    if (item.divider) {
                      return <div key={`div-${i}`} className={styles.divider} />;
                    }
                    return (
                      <button
                        key={item.label}
                        className={styles.dropdownItem}
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick();
                          }
                          closeMenu();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </Popover>
            )}
          </div>
        );
      })}
    </div>
  );
};
