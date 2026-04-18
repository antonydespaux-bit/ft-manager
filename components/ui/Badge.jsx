'use client'

/**
 * <Badge> — pill label (catégorie, lieu, allergène, ratio, …).
 *
 * Couleurs toujours dynamiques (catégorie, FC, branding) → passées en props.
 *
 * Props :
 *   bg        : couleur de fond (string, requis)
 *   color     : couleur texte (string, requis)
 *   size      : 'sm' (11px, 2px 8px) | 'md' (défaut, 12px, 3px 12px) | 'lg' (12px, 4px 14px)
 *   border    : bordure optionnelle (ex. '0.5px solid #F09595')
 *   className : classes additionnelles
 *   style     : style inline additionnel (échappatoire)
 */
export function Badge({
  bg,
  color,
  size = 'md',
  border,
  className = '',
  style,
  children,
  ...rest
}) {
  const sizeClass =
    size === 'sm' ? 'sk-badge--sm' :
    size === 'lg' ? 'sk-badge--lg' :
    ''

  return (
    <span
      className={`sk-badge ${sizeClass} ${className}`.trim()}
      style={{
        background: bg,
        color,
        ...(border && { border }),
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  )
}
