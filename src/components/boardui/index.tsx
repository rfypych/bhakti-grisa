import React from 'react';
import { X, Check, AlertTriangle, Info, ShieldCheck, ChevronRight } from 'lucide-react';

/**
 * BoardUI Component Library (https://github.com/BoardUI/boardui)
 * 1:1 implementation of BoardUI foundations, tokens, typography, and components:
 * - Inter (optical size axis) + JetBrains Mono
 * - Primary electric blue gradient (`bg-button-primary`)
 * - FooterStatCard (`rounded-2xl bg-background-secondary-default p-2` + `bg-background-inner-default shadow-card`)
 * - Chip (`bg-status-lime-background`, `bg-status-yellow-background`, `bg-status-rose-background`, `bg-status-blue-background`)
 * - SegmentedControl (`bg-segmented-control-background` + `bg-segmented-control-selected-background shadow-2xs`)
 * - Breadcrumb, Avatar, Badge, Kbd, Modal
 */

export function BoardLogo({
  size = 28,
  rounded = 'circle',
  className = '',
}: {
  size?: number;
  rounded?: 'circle' | 'square';
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center ${
        rounded === 'circle' ? 'rounded-full' : 'rounded-[8px]'
      } bg-button-primary text-white shadow-xs ring-1 ring-inset ring-white/25 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-[58%] h-[58%]"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="8" height="8" rx="2.2" fill="currentColor" />
        <rect x="13" y="3" width="8" height="8" rx="2.2" fill="currentColor" fillOpacity="0.65" />
        <rect x="3" y="13" width="8" height="8" rx="2.2" fill="currentColor" fillOpacity="0.65" />
        <rect x="13" y="13" width="8" height="8" rx="2.2" fill="currentColor" />
      </svg>
    </span>
  );
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
export type AvatarColor = 'neutral' | 'blue' | 'lime' | 'pink';

export function BoardAvatar({
  size = 'md',
  color = 'neutral',
  src,
  alt,
  initials,
  className = '',
}: {
  size?: AvatarSize;
  color?: AvatarColor;
  src?: string;
  alt?: string;
  initials?: string;
  className?: string;
}) {
  const sizeMap: Record<AvatarSize, string> = {
    xs: 'size-5 text-[10px] leading-[15px] font-semibold',
    sm: 'size-6 text-caption-1-semibold tracking-normal',
    md: 'size-8 text-headline-semibold',
    lg: 'size-9 text-[18px] leading-6 font-semibold',
  };
  const colorMap: Record<AvatarColor, string> = {
    neutral: 'bg-avatar-neutral-background text-text-secondary',
    blue: 'bg-emerald-200 text-emerald-900',
    lime: 'bg-lime-200 text-lime-700',
    pink: 'bg-pink-200 text-pink-500',
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none ${sizeMap[size]} ${colorMap[color]} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt ?? ''} className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export function BoardBadge({
  color = 'neutral',
  children,
  className = '',
}: {
  color?: 'primary' | 'neutral';
  children: React.ReactNode;
  className?: string;
}) {
  const colorClass =
    color === 'primary'
      ? 'bg-accent-400 text-white'
      : 'bg-badge-neutral-background text-text-secondary';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm px-1 py-px text-caption-1-semibold tracking-normal whitespace-nowrap ${colorClass} ${className}`}
    >
      {children}
    </span>
  );
}

export type ChipColor =
  | 'orange'
  | 'lime'
  | 'rose'
  | 'yellow'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'neutral'
  | 'gray'
  | 'soft';

export function BoardChip({
  variant = 'bold',
  color = 'neutral',
  children,
  className = '',
}: {
  variant?: 'bold' | 'subtle' | 'caption';
  color?: ChipColor;
  children: React.ReactNode;
  className?: string;
}) {
  const variantMap = {
    bold: 'py-0.5 text-body-medium',
    subtle: 'py-1 text-body-medium',
    caption: 'py-1 text-caption-1-medium',
  };
  const colorMap: Record<ChipColor, string> = {
    orange: 'bg-status-orange-background text-status-orange-text',
    lime: 'bg-status-lime-background text-status-lime-text',
    rose: 'bg-status-rose-background text-status-rose-text',
    yellow: 'bg-status-yellow-background text-status-yellow-text',
    cyan: 'bg-status-cyan-background text-status-cyan-text',
    blue: 'bg-status-blue-background text-status-blue-text',
    purple: 'bg-status-purple-background text-status-purple-text',
    neutral: 'bg-background-tertiary-default text-text-secondary',
    gray: 'bg-background-secondary-default text-text-primary',
    soft: 'bg-background-secondary-default text-text-secondary',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-1.5 whitespace-nowrap transition-[padding,font-size] duration-200 ease ${variantMap[variant]} ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function BoardKbd({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={`inline-flex items-center justify-center rounded-full bg-kbd-background px-1.5 py-0.5 font-sans text-caption-1-semibold tracking-normal whitespace-nowrap text-kbd-foreground ${className}`}
    >
      {children}
    </kbd>
  );
}

export function BoardBreadcrumb({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex w-full items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <ol className="flex items-center gap-2.5 px-1">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
            )}
            {item}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

export function BoardBreadcrumbItem({
  children,
  href,
  onClick,
  current = false,
  icon,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  current?: boolean;
  icon?: React.ReactNode;
}) {
  if (current) {
    return (
      <li
        aria-current="page"
        className="flex items-center gap-1.5 text-caption-1-medium whitespace-nowrap text-text-secondary"
      >
        {icon && <span className="size-4 shrink-0 flex items-center justify-center">{icon}</span>}
        {children}
      </li>
    );
  }
  const cls =
    '-mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-caption-1-medium whitespace-nowrap text-text-tertiary transition-colors duration-150 ease hover:bg-background-primary-hover hover:text-text-secondary cursor-pointer';
  return (
    <li className="flex items-center">
      {onClick ? (
        <button type="button" onClick={onClick} className={cls}>
          {icon}
          {children}
        </button>
      ) : href ? (
        <a href={href} className={cls}>
          {icon}
          {children}
        </a>
      ) : (
        <span className={cls}>
          {icon}
          {children}
        </span>
      )}
    </li>
  );
}

export interface BoardSurfaceProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'inner';
  as?: 'div' | 'section' | 'article';
}

export function BoardSurface({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  as: Component = 'div',
}: BoardSurfaceProps) {
  const padMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6 sm:p-7',
  };
  const variantMap = {
    default: 'bg-background-primary-default border border-border-table rounded-2xl',
    secondary: 'bg-background-secondary-default rounded-2xl',
    inner: 'bg-background-inner-default rounded-2lg shadow-card',
  };
  return (
    <Component className={`${variantMap[variant]} ${padMap[padding]} ${className}`}>
      {children}
    </Component>
  );
}

export interface BoardStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  metaItems?: string[];
  accentTone?: 'default' | 'teal' | 'amber' | 'crimson';
  icon?: React.ReactNode;
  deltaLabel?: string;
}

/**
 * 1:1 BoardUI `FooterStatCard` (from `components/application/dashboard/stat-cards.tsx`):
 * - Outer `rounded-2xl bg-background-secondary-default p-2`
 * - Top `size-10 rounded-2lg bg-linear-to-b` gradient icon tile + info icon
 * - Headline `text-display-4-medium text-text-primary tabular-nums`
 * - Inner white footer band `rounded-2lg bg-background-inner-default py-1.5 pe-1.5 ps-2.5 shadow-card` with DeltaPill
 */
export function BoardStatCard({
  label,
  value,
  subtext,
  metaItems,
  accentTone = 'default',
  icon,
  deltaLabel,
}: BoardStatCardProps) {
  const iconGradientMap = {
    default: 'bg-linear-to-b from-emerald-500 to-emerald-600 text-white',
    teal: 'bg-linear-to-b from-teal-500 to-teal-600 text-white',
    amber: 'bg-linear-to-b from-orange-400 to-orange-500 text-white',
    crimson: 'bg-linear-to-b from-pink-500 to-pink-600 text-white',
  };

  const pillToneMap = {
    default: 'bg-status-lime-background text-status-lime-text',
    teal: 'bg-status-blue-background text-status-blue-text',
    amber: 'bg-status-yellow-background text-status-yellow-text',
    crimson: 'bg-status-rose-background text-status-rose-text',
  };

  const footerText =
    subtext || (metaItems && metaItems.length > 0 ? metaItems[0] : 'Data terverifikasi aktif');
  const pillText =
    deltaLabel ||
    (metaItems && metaItems.length > 1
      ? metaItems[1]
      : accentTone === 'crimson'
        ? 'Prioritas'
        : accentTone === 'amber'
          ? 'Pantau'
          : '+100% Aktif');

  return (
    <div className="flex min-w-0 flex-col justify-between gap-3.5 rounded-2xl bg-background-secondary-default p-2">
      <div className="flex flex-col gap-4 px-2 pt-2">
        <div className="flex items-start justify-between">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-2lg shadow-2xs ${iconGradientMap[accentTone]}`}
          >
            {icon ? (
              <span className="[&>svg]:size-5 [&>svg]:text-white">{icon}</span>
            ) : (
              <ShieldCheck className="size-5 text-white" />
            )}
          </div>
          <span
            className="inline-flex size-5 items-center justify-center text-foreground-icon-tertiary"
            aria-hidden="true"
          >
            <Info className="size-4" />
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-body-medium text-text-secondary truncate">{label}</p>
          <p className="animate-number-fade text-display-4-medium whitespace-nowrap text-text-primary tabular-nums">
            {value}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-2lg bg-background-inner-default py-1.5 pe-1.5 ps-2.5 shadow-card">
        <span className="truncate text-body-2-medium text-text-secondary">{footerText}</span>
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-caption-1-medium whitespace-nowrap ${pillToneMap[accentTone]}`}
        >
          {pillText}
        </span>
      </div>
    </div>
  );
}

export interface BoardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

/**
 * 1:1 BoardUI `Button` (from `components/base/buttons/button.tsx`):
 * - `primary`: `bg-button-primary text-text-white shadow-xs`
 * - `secondary` / `outline`: `bg-background-primary-default text-text-primary border border-border-button-default shadow-xs hover:bg-background-primary-hover hover:border-border-button-hover`
 * - `ghost`: `bg-button-ghost-background text-button-ghost-foreground hover:bg-button-ghost-hover`
 * - `danger`: `bg-button-danger text-text-white shadow-xs`
 */
export function BoardButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  ...props
}: BoardButtonProps) {
  const variantStyles = {
    primary:
      'bg-button-primary text-text-white shadow-xs disabled:text-button-primary-disabled-foreground disabled:shadow-none',
    secondary:
      'bg-background-primary-default text-text-primary border border-border-button-default shadow-xs hover:bg-background-primary-hover hover:border-border-button-hover active:bg-background-primary-active active:border-border-button-active disabled:bg-background-primary-disabled disabled:text-text-tertiary disabled:shadow-none',
    outline:
      'bg-background-primary-default text-text-primary border border-border-button-default shadow-xs hover:bg-background-primary-hover hover:border-border-button-hover active:bg-background-primary-active active:border-border-button-active disabled:bg-background-primary-disabled disabled:text-text-tertiary disabled:shadow-none',
    ghost:
      'bg-button-ghost-background text-button-ghost-foreground hover:bg-button-ghost-hover active:bg-button-ghost-active disabled:bg-button-ghost-disabled disabled:text-button-ghost-disabled-foreground',
    danger:
      'bg-button-danger text-text-white shadow-xs disabled:text-foreground-disabled-danger disabled:shadow-none',
  };

  const sizeStyles = {
    sm: 'h-8 rounded-lg px-2.5 py-1.5 text-body-medium gap-1.5',
    md: 'h-9 rounded-2lg px-3 py-2 text-body-medium gap-1.5',
    lg: 'h-10 rounded-2lg px-4 py-2 text-body-medium gap-2',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center whitespace-nowrap overflow-hidden font-sans select-none cursor-pointer button-press-motion outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring disabled:cursor-not-allowed shrink-0 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="inline-flex items-center justify-center px-0.5 shrink-0">{children}</span>
    </button>
  );
}

export interface BoardSegmentedControlProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (val: T) => void;
  ariaLabel?: string;
}

/**
 * 1:1 BoardUI `SegmentedControl` (from `components/base/segmented-control/segmented-control.tsx`):
 * - Track: `bg-segmented-control-background p-1 rounded-2lg gap-0.5`
 * - Selected: `bg-segmented-control-selected-background shadow-2xs text-body-medium text-text-primary rounded-md`
 */
export function BoardSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter kategori',
}: BoardSegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative inline-flex flex-wrap items-center gap-0.5 rounded-2lg bg-segmented-control-background p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative z-10 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-center whitespace-nowrap transition-all duration-200 ease outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring ${
              active
                ? 'bg-segmented-control-selected-background text-body-medium text-text-primary shadow-2xs'
                : 'text-body-regular text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={`rounded-sm px-1 py-px text-caption-1-semibold tabular-nums ${
                  active
                    ? 'bg-background-tertiary-default text-text-primary'
                    : 'bg-badge-neutral-background text-text-tertiary'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface BoardCalloutProps {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
}

export function BoardCallout({
  tone = 'info',
  title,
  description,
  action,
}: BoardCalloutProps) {
  const styles = {
    info: 'bg-background-secondary-default border-border-button-default text-text-primary',
    warning:
      'bg-status-yellow-background/45 border-amber-300/70 dark:border-amber-800/60 text-text-primary',
    danger:
      'bg-status-rose-background/45 border-rose-300/70 dark:border-rose-800/60 text-text-primary',
    success:
      'bg-status-lime-background/45 border-lime-300/70 dark:border-lime-800/60 text-text-primary',
  };

  const iconWrap = {
    info: 'bg-status-blue-background text-status-blue-text',
    warning: 'bg-status-yellow-background text-status-yellow-text',
    danger: 'bg-status-rose-background text-status-rose-text',
    success: 'bg-status-lime-background text-status-lime-text',
  };

  const icons = {
    info: <Info className="size-4 shrink-0" />,
    warning: <AlertTriangle className="size-4 shrink-0" />,
    danger: <AlertTriangle className="size-4 shrink-0" />,
    success: <Check className="size-4 shrink-0" />,
  };

  return (
    <div
      className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${styles[tone]}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-2lg ${iconWrap[tone]}`}
        >
          {icons[tone]}
        </span>
        <div>
          <h4 className="text-body-medium text-text-primary">{title}</h4>
          <div className="text-body-2-regular text-text-secondary mt-0.5">{description}</div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function BoardModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: BoardModalProps) {
  if (!isOpen) return null;

  const widthMap = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="board-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
    >
      <div
        className={`bg-background-primary-default border border-border-button-default rounded-3xl w-full ${widthMap[maxWidth]} max-h-[90vh] flex flex-col overflow-hidden shadow-dropdown`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-separator-border">
          <div>
            <h3 id="board-modal-title" className="text-headline-semibold text-text-primary">
              {title}
            </h3>
            {subtitle && <p className="text-caption-1-regular text-text-tertiary mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="inline-flex size-8 items-center justify-center rounded-2lg border border-border-button-default bg-background-primary-default text-foreground-icon-secondary hover:bg-background-primary-hover transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

/**
 * 1:1 BoardUI `Chip` status indicator
 */
export function BoardStatusLabel({
  tone,
  label,
}: {
  tone: 'nominal' | 'warning' | 'danger' | 'muted';
  label: string;
}) {
  const colorMap: Record<'nominal' | 'warning' | 'danger' | 'muted', ChipColor> = {
    nominal: 'lime',
    warning: 'yellow',
    danger: 'rose',
    muted: 'neutral',
  };

  return (
    <BoardChip variant="bold" color={colorMap[tone]}>
      {label}
    </BoardChip>
  );
}

export function BoardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-background-secondary-default p-8 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-2lg bg-background-inner-default shadow-card text-foreground-icon-secondary">
        <ShieldCheck className="size-5" />
      </div>
      <h4 className="text-body-medium text-text-primary">{title}</h4>
      <p className="text-body-2-regular text-text-tertiary max-w-md mx-auto mt-1">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
