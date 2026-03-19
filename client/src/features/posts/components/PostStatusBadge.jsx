import { getLocalizedPostStatusLabel } from '../../../lib/utils/marketplaceDisplay.js';
import { useI18n } from '../../i18n/useI18n.js';

export const PostStatusBadge = ({ status }) => {
  const { t } = useI18n();
  const normalizedStatus = String(status || '').toLowerCase();

  return (
    <span className={`post-status post-status--${normalizedStatus}`}>
      {getLocalizedPostStatusLabel(status, t)}
    </span>
  );
};
