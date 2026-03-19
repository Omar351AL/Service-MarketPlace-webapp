export const PlaceholderPanel = ({ title, description, badge }) => (
  <section className="placeholder-panel">
    {badge ? <span className="eyebrow">{badge}</span> : null}
    <h2>{title}</h2>
    <p>{description}</p>
  </section>
);
