export default function SelectInput({
  id,
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = "Select",
  error,
  className = "",
  disabled = false,
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
      <select
        id={id}
        className={`input ${error ? "input-error" : ""}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
