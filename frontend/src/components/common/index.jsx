import React from 'react';
import { CloseIcon } from '../../icons/index';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon = null,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin">⌛</span>
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="btn-icon" />}
          {children}
        </>
      )}
    </button>
  );
};

export const Avatar = ({
  src = null,
  initials = '?',
  size = 'md',
  status = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`avatar avatar-${size} ${className}`} {...props}>
      {src ? (
        <img src={src} alt="User avatar" />
      ) : (
        <div className="avatar-initials">{initials}</div>
      )}
      {status && <div className={`avatar-status avatar-status-${status}`} />}
    </div>
  );
};

export const Card = ({
  children,
  header = null,
  footer = null,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <div className={`card card-${variant} ${className}`} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-content">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`} {...props}>
      {children}
    </span>
  );
};

/**
 * Input Field Component
 */
export const Input = ({
  label = null,
  error = null,
  icon: Icon = null,
  size = 'md',
  type = 'text',
  ...props
}) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" />}
        <input
          type={type}
          className={`input input-${size} ${error ? 'input-error' : ''} ${Icon ? 'input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export const Modal = ({
  open = false,
  onClose = () => {},
  title = null,
  children,
  footer = null,
  size = 'md',
  className = '',
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal modal-${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="modal-content">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const Tooltip = ({
  content,
  position = 'top',
  children,
  className = '',
}) => {
  return (
    <div className={`tooltip-wrapper ${className}`}>
      {children}
      <div className={`tooltip tooltip-${position}`}>{content}</div>
    </div>
  );
};

export const Spinner = ({ size = 'md', color = 'primary' }) => {
  return (
    <div className={`spinner spinner-${size} spinner-${color}`}>
      <div className="spinner-inner"></div>
    </div>
  );
};

export const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose = () => {},
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type} animate-slide-in`}>
      <span>{message}</span>
    </div>
  );
};

export const Chip = ({
  label,
  onDelete = null,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`chip chip-${variant} chip-${size} ${className}`}>
      {label}
      {onDelete && (
        <button className="chip-delete" onClick={onDelete}>
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export const Toggle = ({
  checked = false,
  onChange = () => {},
  disabled = false,
  size = 'md',
  label = null,
}) => {
  return (
    <label className={`toggle-wrapper ${size}`}>
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-slider"></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
};

export const Divider = ({ orientation = 'horizontal', className = '' }) => {
  return (
    <div
      className={`divider divider-${orientation} ${className}`}
      role="separator"
    />
  );
};

export const Stack = ({
  direction = 'vertical',
  spacing = 'base',
  children,
  className = '',
  ...props
}) => {
  const dirClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const spacingClass = `gap-${spacing}`;

  return (
    <div className={`flex ${dirClass} ${spacingClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Container = ({
  children,
  maxWidth = 'lg',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`container container-${maxWidth} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
