export const LoadingPanel = ({ title = 'Loading', description = 'Please wait a moment.' }) => (
  <section className="placeholder-panel">
    <span className="eyebrow">Loading</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </section>
);
