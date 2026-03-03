export default function Button({
  type = "button",
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const computedClassName =
    `btn btn-${variant} ${fullWidth ? "btn-full" : ""} ${className}`.trim();

  return (
    <button
      type={type}
      className={computedClassName}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
