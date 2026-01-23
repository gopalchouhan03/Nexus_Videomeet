import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import '../../styles/layouts.css';
import { Avatar } from '../common/index.jsx';

/**
 * Main App Layout with Navigation
 */
export const AppLayout = ({ children, showNav = true }) => {
  const navigate = useNavigate();
  const { handleLogout } = React.useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const handleLogoutClick = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      {showNav && (
        <nav className="app-navbar">
          <div className="navbar-container">
            {/* Logo */}
            <div
              className="navbar-logo"
              onClick={() => navigate('/home')}
              role="button"
            >
              <span className="logo-icon">▶</span>
              NEXUS
            </div>

            {/* Desktop Navigation */}
            <div className="navbar-menu-desktop">
              <button
                className="nav-link"
                onClick={() => navigate('/home')}
              >
                Dashboard
              </button>
              <button
                className="nav-link"
                onClick={() => navigate('/history')}
              >
                History
              </button>
            </div>

            {/* User Menu */}
            <div className="navbar-user">
              <div className="profile-menu">
                <button
                  className="profile-button"
                  onClick={() =>
                    setProfileMenuOpen(!profileMenuOpen)
                  }
                >
                  <Avatar initials="U" size="sm" />
                </button>

                {profileMenuOpen && (
                  <div className="profile-dropdown">
                    <button className="dropdown-item">Settings</button>
                    <button className="dropdown-item">Profile</button>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogoutClick}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="navbar-toggle"
              onClick={() =>
                setMobileMenuOpen(!mobileMenuOpen)
              }
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="navbar-menu-mobile">
              <button
                className="nav-link mobile"
                onClick={() => {
                  navigate('/home');
                  setMobileMenuOpen(false);
                }}
              >
                Dashboard
              </button>
              <button
                className="nav-link mobile"
                onClick={() => {
                  navigate('/history');
                  setMobileMenuOpen(false);
                }}
              >
                History
              </button>
              <button
                className="nav-link mobile logout"
                onClick={() => {
                  handleLogoutClick();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      )}

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
};

/**
 * Auth Layout (Centered, No Nav)
 */
export const AuthLayout = ({ children, showLogo = true }) => {
  const navigate = useNavigate();

  return (
    <div className="auth-layout">
      <div className="auth-background">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
        <div className="auth-blob auth-blob-3"></div>
      </div>

      {showLogo && (
        <button
          className="auth-logo"
          onClick={() => navigate('/')}
        >
          <span>▶</span> NEXUS
        </button>
      )}

      <div className="auth-container">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
};

/**
 * Video Meeting Layout
 */
export const VideoLayout = ({ children, controls = null }) => {
  return (
    <div className="video-layout">
      <div className="video-main">{children}</div>
      {controls && <div className="video-controls-bar">{controls}</div>}
    </div>
  );
};

export default AppLayout;
