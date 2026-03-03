export default function Alert({ variant = "info", children, onClose }) {
  const role = variant === "danger" ? "alert" : "status";

  return (
    <div className={`alert alert-${variant}`} role={role}>
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          x
        </button>
      ) : null}
    </div>
  );
}
