import { Link } from 'react-router-dom';

import { useI18n } from '../../features/i18n/useI18n.js';
import { PageIntro } from './PageIntro.jsx';

export const NotFoundPage = () => {
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="404"
        title={t('notFound.title')}
        description={t('notFound.description')}
        actions={
          <Link to="/" className="button">
            {t('notFound.action')}
          </Link>
        }
      />
    </div>
  );
};
