export const EmptyState = ({ title, description, action }) => (
  <section className="empty-state">
    <h2>{title}</h2>
    <p>{description}</p>
    {action ? <div>{action}</div> : null}
  </section>
);
