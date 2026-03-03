export default function EmptyState({
  title = "No results found",
  description = "Try changing filters or clearing your search.",
  action = null,
}) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-description">{description}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
