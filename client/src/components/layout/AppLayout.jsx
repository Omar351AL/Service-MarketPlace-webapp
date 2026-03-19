import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Compass,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MoonStar,
  FolderKanban,
  Settings2,
  Sun,
  UserCircle2,
  X
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/hooks/useAuth.js';
import { useChatUnread } from '../../features/chat/hooks/useChatUnread.js';
import { useI18n } from '../../features/i18n/useI18n.js';
import { useTheme } from '../../features/theme/useTheme.js';
import { resolveApiAssetUrl } from '../../lib/api/client.js';
import { formatNumber } from '../../lib/utils/format.js';

export const AppLayout = () => {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { totalUnreadCount, hasUnreadMessages } = useChatUnread();

  const navigate = useNavigate();
  const location = useLocation();

  const accountMenuRef = useRef(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false
  );

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/browse', label: t('nav.browse'), icon: Compass }
  ];

  const accountMenuItems = useMemo(
    () => [
      { key: 'account', label: t('nav.accountSettings'), icon: Settings2, to: '/account' },
      { key: 'posts', label: t('nav.myPosts'), icon: FolderKanban, to: '/create-post' },
      { key: 'messages', label: t('nav.inbox'), icon: Mail, to: '/messages' },
      ...(isAdmin
        ? [{ key: 'admin', label: t('nav.admin'), icon: LayoutDashboard, to: '/admin' }]
        : []),
      { key: 'logout', label: t('nav.logout'), icon: LogOut, action: 'logout' }
    ],
    [isAdmin, t]
  );

  const formatUnreadCount = (count) => (count > 99 ? '99+' : formatNumber(count));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 760px)');
    const handleViewportChange = (event) => setIsMobileViewport(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen || isMobileViewport) {
      return undefined;
    }

    const handleOutsidePointer = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsidePointer);
    document.addEventListener('touchstart', handleOutsidePointer, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
    };
  }, [isAccountMenuOpen, isMobileViewport]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return undefined;
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isMobileViewport || !isAccountMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAccountMenuOpen, isMobileViewport]);

  const closeAccountMenu = () => {
    setIsAccountMenuOpen(false);
  };

  const handleAccountMenuAction = (item) => {
    closeAccountMenu();

    if (item.action === 'logout') {
      logout();
      navigate('/login');
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  };

  const renderAccountMenuItem = (item, variant = 'menu') => {
    const isMessagesItem = item.key === 'messages';

    return (
      <button
        key={item.key}
        type="button"
        className={variant === 'drawer' ? 'account-menu__item account-menu__item--drawer' : 'account-menu__item'}
        onClick={() => handleAccountMenuAction(item)}
      >
        <item.icon size={variant === 'drawer' ? 18 : 17} />
        <span>{item.label}</span>
        {isMessagesItem && totalUnreadCount > 0 ? (
          <span
            className="account-menu__badge"
            aria-label={t('chat.unreadCountLabel', { count: totalUnreadCount })}
          >
            {formatUnreadCount(totalUnreadCount)}
          </span>
        ) : null}
      </button>
    );
  };

  const renderMobileDrawer = () => {
    if (!isAuthenticated || !isMobileViewport || !isAccountMenuOpen) {
      return null;
    }

    return createPortal(
      <div
        className="account-layer"
        role="presentation"
        aria-hidden={!isAccountMenuOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeAccountMenu();
          }
        }}
        onTouchStart={(event) => {
          if (event.target === event.currentTarget) {
            closeAccountMenu();
          }
        }}
      >
        <div
          className="account-drawer-backdrop"
          onClick={closeAccountMenu}
          aria-hidden="true"
        />

        <aside
          className="account-drawer"
          aria-modal="true"
          role="dialog"
          aria-label={t('nav.accountHub')}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="account-drawer__header">
            <div className="account-drawer__identity">
              {user?.avatarUrl ? (
                <img
                  src={resolveApiAssetUrl(user.avatarUrl)}
                  alt={user.name}
                  className="account-chip__avatar-image"
                />
              ) : (
                <span className="account-chip__avatar">
                  {user?.name?.slice(0, 1).toUpperCase() || <UserCircle2 size={16} />}
                </span>
              )}

              <div className="account-chip__text">
                <strong>{user?.name ?? t('nav.profileFallback')}</strong>
                <small>{t('nav.accountHub')}</small>
              </div>
            </div>

            <button
              type="button"
              className="icon-link"
              onClick={closeAccountMenu}
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="account-drawer__menu">
            {accountMenuItems.map((item) => renderAccountMenuItem(item, 'drawer'))}
          </div>
        </aside>
      </div>,
      document.body
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar__inner">
          <nav className="topbar__nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
                onClick={closeAccountMenu}
              >
                <item.icon size={17} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="topbar__actions">
            <div className="topbar__controls">
              <div className="language-switch" aria-label={t('common.language')}>
                <button
                  type="button"
                  className={
                    language === 'en'
                      ? 'language-switch__button language-switch__button--active'
                      : 'language-switch__button'
                  }
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>

                <button
                  type="button"
                  className={
                    language === 'ar'
                      ? 'language-switch__button language-switch__button--active'
                      : 'language-switch__button'
                  }
                  onClick={() => setLanguage('ar')}
                >
                  AR
                </button>
              </div>

              <button
                type="button"
                className={theme === 'light' ? 'mode-toggle mode-toggle--light' : 'mode-toggle'}
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
                title={theme === 'dark' ? t('theme.lightMode') : t('theme.darkMode')}
              >
                <span className="mode-toggle__track">
                  <span className="mode-toggle__sky mode-toggle__sky--day" />
                  <span className="mode-toggle__sky mode-toggle__sky--night" />
                  <span className="mode-toggle__thumb">
                    <Sun size={15} className="mode-toggle__thumb-icon mode-toggle__thumb-icon--sun" />
                    <MoonStar size={15} className="mode-toggle__thumb-icon mode-toggle__thumb-icon--moon" />
                  </span>
                </span>
              </button>
            </div>

            {isAuthenticated ? (
              <div className="topbar__session" ref={accountMenuRef}>
                <button
                  type="button"
                  className={
                    isAccountMenuOpen
                      ? 'account-chip account-chip--trigger account-chip--active'
                      : 'account-chip account-chip--trigger'
                  }
                  title={t('nav.accountHub')}
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={t('nav.accountHub')}
                >
                  {user?.avatarUrl ? (
                    <img
                      src={resolveApiAssetUrl(user.avatarUrl)}
                      alt={user.name}
                      className="account-chip__avatar-image"
                    />
                  ) : (
                    <span className="account-chip__avatar">
                      {user?.name?.slice(0, 1).toUpperCase() || <UserCircle2 size={16} />}
                    </span>
                  )}

                  <span className="account-chip__text">
                    <strong>{user?.name ?? t('nav.profileFallback')}</strong>
                    <small>{t('nav.accountHub')}</small>
                  </span>

                  {hasUnreadMessages ? (
                    <span
                      className="account-chip__badge"
                      aria-label={t('chat.unreadCountLabel', { count: totalUnreadCount })}
                    >
                      {formatUnreadCount(totalUnreadCount)}
                    </span>
                  ) : null}

                  <ChevronDown size={16} className="account-chip__caret" />
                </button>

                {!isMobileViewport && isAccountMenuOpen ? (
                  <div className="account-menu" role="menu">
                    {accountMenuItems.map((item) => renderAccountMenuItem(item))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="topbar__guest">
                <Link to="/login" className="ghost-link" onClick={closeAccountMenu}>
                  {t('nav.login')}
                </Link>

                <Link
                  to="/register"
                  className="button button--small"
                  onClick={closeAccountMenu}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {renderMobileDrawer()}

      <main
        className={
          location.pathname.startsWith('/messages')
            ? 'container main-content main-content--chat'
            : 'container main-content'
        }
      >
        <Outlet />
      </main>
    </div>
  );
};
