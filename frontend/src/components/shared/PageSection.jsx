export default function PageSection({ title, description, actions, children }) {
  return (
    <section className="page-section">
      <header className="section-header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </header>

      <div className="section-content">{children}</div>
    </section>
  );
}
