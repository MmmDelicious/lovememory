import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Mail, Heart, Crown, Shield, HelpCircle, BarChart3, Gamepad2 } from 'lucide-react';
import styles from './UserDropdown.module.css';
interface UserData {
  first_name?: string;
  last_name?: string;
  email: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
}
interface UserDropdownProps {
  user: UserData;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}
const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayName = user.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.email;
  const getAvatarContent = () => {
    if (user.avatarUrl) {
      return <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImage} />;
    }
    const initials = user.first_name 
      ? (user.first_name[0] + (user.last_name?.[0] || '')).toUpperCase()
      : user.email[0].toUpperCase();
    return <span className={styles.avatarText}>{initials}</span>;
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };
  return (
    <div className={styles.userDropdown} ref={dropdownRef}>
      <button 
        className={styles.avatarButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Меню пользователя"
      >
        {getAvatarContent()}
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
          <div className={styles.divider} />
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/profile'))}
          >
            <User size={16} />
            <span>Профиль</span>
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/settings'))}
          >
            <Settings size={16} />
            <span>Настройки</span>
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/insights'))}
          >
            <BarChart3 size={16} />
            <span>Аналитика</span>
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/games'))}
          >
            <Gamepad2 size={16} />
            <span>Игры</span>
          </button>
          <div className={styles.divider} />
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/premium'))}
          >
            <Crown size={16} />
            <span>Премиум</span>
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/help'))}
          >
            <HelpCircle size={16} />
            <span>Помощь</span>
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(() => onNavigate('/privacy'))}
          >
            <Shield size={16} />
            <span>Конфиденциальность</span>
          </button>
          <div className={styles.divider} />
          <button 
            className={styles.dropdownItem}
            onClick={() => handleItemClick(onLogout)}
          >
            <LogOut size={16} />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default UserDropdown;

