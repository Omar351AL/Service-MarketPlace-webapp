export const PageIntro = ({ eyebrow, title, description, actions, layout = 'default' }) => (
  <section className="hero-card">
    <div className={layout === 'split' ? 'hero-card__content hero-card__content--split' : 'hero-card__content'}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      {layout === 'split' ? (
        <div className="hero-card__headline-row">
          <h1>{title}</h1>
          {actions ? <div className="hero-card__actions hero-card__actions--inline">{actions}</div> : null}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      {description ? <p>{description}</p> : null}
      {layout !== 'split' && actions ? <div className="hero-card__actions">{actions}</div> : null}
    </div>
  </section>
);
