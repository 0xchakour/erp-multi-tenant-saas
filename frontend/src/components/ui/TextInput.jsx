export default function TextInput({
  id,
  label,
  hint,
  error,
  className = "",
  ...rest
}) {
  const describedBy = [
    hint && id ? `${id}-hint` : null,
    error && id ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`field ${className}`.trim()}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input
        id={id}
        className={`input ${error ? "input-error" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p id={id ? `${id}-hint` : undefined} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
