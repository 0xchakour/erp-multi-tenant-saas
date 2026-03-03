const STATUS_CLASS = {
  paid: "badge-paid",
  sent: "badge-sent",
  draft: "badge-draft",
  partially_paid: "badge-partially-paid",
  overdue: "badge-overdue",
  cancelled: "badge-cancelled",
};

export default function Badge({ status }) {
  const normalized = String(status ?? "").toLowerCase();
  const className = STATUS_CLASS[normalized] ?? "badge-default";
  const displayValue = normalized ? normalized.replace(/_/g, " ") : "unknown";

  return <span className={`badge ${className}`}>{displayValue}</span>;
}
