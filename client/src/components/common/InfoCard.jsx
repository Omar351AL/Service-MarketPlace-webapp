export const InfoCard = ({ title, value, caption }) => (
  <article className="info-card">
    <span className="info-card__caption">{caption}</span>
    <strong>{value}</strong>
    <p>{title}</p>
  </article>
);
