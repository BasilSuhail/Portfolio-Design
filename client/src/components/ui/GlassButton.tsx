import { ReactNode } from 'react';
import './GlassButton.css';

interface GlassButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  color?: 'blue' | 'purple' | 'green' | 'neutral';
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export default function GlassButton({
  children,
  icon,
  color = 'neutral',
  href,
  onClick,
  disabled = false,
  className = '',
}: GlassButtonProps) {
  const colorClass = color !== 'neutral' ? `glass-btn--${color}` : '';
  const disabledClass = disabled ? 'glass-btn--disabled' : '';

  const content = (
    <>
      {icon && <span className="glass-btn__icon">{icon}</span>}
      <span className="glass-btn__text">{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`glass-btn ${colorClass} ${disabledClass} ${className}`}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`glass-btn ${colorClass} ${disabledClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
