export default function Card({ title, value, helper }) {
  return (
    <article className="metric-card">
      <p className="metric-title">{title}</p>
      <p className="metric-value">{value}</p>
      {helper ? <p className="metric-helper">{helper}</p> : null}
    </article>
  );
}
