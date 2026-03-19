import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { LoadingPanel } from '../../../components/common/LoadingPanel.jsx';
import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { formatDate } from '../../../lib/utils/format.js';
import {
  getLocalizedCategoryName,
  getLocalizedPostLocation,
  getLocalizedPostStatusLabel
} from '../../../lib/utils/marketplaceDisplay.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';

const USER_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'BLOCKED'];
const POST_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD'];

const buildVisiblePages = (meta) => {
  const page = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, start + 2);
  const adjustedStart = Math.max(1, end - 2);

  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
};

const StatCard = ({ label, value, caption }) => (
  <article className="info-card">
    <span className="info-card__caption">{label}</span>
    <strong>{value}</strong>
    <p>{caption}</p>
  </article>
);

const UserStatusPill = ({ status, role }) => {
  const { t } = useI18n();

  return (
    <div className="admin-status-row">
      <span className={`status-pill admin-status-pill admin-status-pill--${status.toLowerCase()}`}>
        {t(`status.${status.toLowerCase()}`)}
      </span>
      <span className="status-pill admin-role-pill">{t(`status.${role.toLowerCase()}`)}</span>
    </div>
  );
};

const PostStatusPill = ({ status }) => {
  const { t } = useI18n();

  return (
    <span className={`post-status post-status--${status.toLowerCase()}`}>
      {getLocalizedPostStatusLabel(status, t)}
    </span>
  );
};

const AdminPagination = ({ meta, onChangePage }) => {
  const { t } = useI18n();
  const currentPage = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;
  const visiblePages = buildVisiblePages(meta);

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="button button--small button--muted"
        onClick={() => onChangePage(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        {t('common.previous')}
      </button>

      <div className="admin-pagination__pages" aria-label={t('admin.pageLabel', { page: currentPage, pageCount: totalPages })}>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={
              pageNumber === currentPage
                ? 'admin-pagination__page admin-pagination__page--active'
                : 'admin-pagination__page'
            }
            onClick={() => onChangePage(pageNumber)}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="button button--small button--muted"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        {t('common.next')}
      </button>
    </div>
  );
};

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersResponse, setUsersResponse] = useState({ data: [], meta: null });
  const [postsResponse, setPostsResponse] = useState({ data: [], meta: null });
  const [userFilters, setUserFilters] = useState({
    q: '',
    status: 'ALL',
    page: 1
  });
  const [postFilters, setPostFilters] = useState({
    q: '',
    status: 'ALL',
    page: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [busyUserId, setBusyUserId] = useState('');
  const [busyPostId, setBusyPostId] = useState('');
  const [busyChatUserId, setBusyChatUserId] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [statsData, usersData, postsData] = await Promise.all([
          api.getAdminStats(token),
          api.getAdminUsers(token, {
            q: userFilters.q,
            status: userFilters.status === 'ALL' ? undefined : userFilters.status,
            page: userFilters.page
          }),
          api.getAdminPosts(token, {
            q: postFilters.q,
            status: postFilters.status === 'ALL' ? undefined : postFilters.status,
            page: postFilters.page
          })
        ]);

        if (ignore) {
          return;
        }

        setStats(statsData.data);
        setUsersResponse(usersData);
        setPostsResponse(postsData);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [postFilters.page, postFilters.q, postFilters.status, reloadNonce, token, userFilters.page, userFilters.q, userFilters.status]);

  const handleUserStatusChange = async (targetUserId, status) => {
    setBusyUserId(targetUserId);
    setErrorMessage('');
    setActionMessage('');

    try {
      const response = await api.updateAdminUserStatus(targetUserId, { status }, token);
      setReloadNonce((current) => current + 1);
      setActionMessage(t('admin.userUpdated', { status: t(`status.${response.data.status.toLowerCase()}`) }));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyUserId('');
    }
  };

  const handlePostStatusChange = async (postId, status) => {
    setBusyPostId(postId);
    setErrorMessage('');
    setActionMessage('');

    try {
      const response = await api.updateAdminPostStatus(postId, { status }, token);
      setReloadNonce((current) => current + 1);
      setActionMessage(
        t('admin.postUpdated', {
          status: getLocalizedPostStatusLabel(response.data.status, t)
        })
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyPostId('');
    }
  };

  const handleStartAdminChat = async (targetUserId) => {
    setBusyChatUserId(targetUserId);
    setErrorMessage('');
    setActionMessage('');

    try {
      const response = await api.createConversation(
        {
          participantUserId: targetUserId
        },
        token
      );

      navigate(`/messages?conversation=${encodeURIComponent(response.data.id)}`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyChatUserId('');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="page-stack">
        <LoadingPanel
          title={t('common.loading')}
          description={t('admin.description')}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        description={null}
        actions={<span className="status-pill status-pill--authenticated">{t('nav.signedInAs', { name: user?.name })}</span>}
      />

      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {actionMessage ? <p className="success-message">{actionMessage}</p> : null}

      {stats ? (
        <section className="stats-grid">
          <StatCard label={t('admin.users')} value={stats.users.total} caption={t('admin.usersCaption', { active: stats.users.active, blocked: stats.users.blocked })} />
          <StatCard label={t('admin.posts')} value={stats.posts.total} caption={t('admin.postsCaption', { active: stats.posts.active, hidden: stats.posts.hidden })} />
          <StatCard label={t('admin.archivedPosts')} value={stats.posts.archived} caption={t('admin.archivedCaption', { sold: stats.posts.sold })} />
          <StatCard label={t('admin.chat')} value={stats.chat.conversations} caption={t('admin.chatCaption', { messages: stats.chat.messages })} />
        </section>
      ) : null}

      <section className="content-card admin-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('admin.users')}</span>
            <h2>{t('admin.userModerationTitle')}</h2>
            <p>{t('admin.userModerationDescription')}</p>
          </div>
        </div>

        <form className="filters-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field-group">
            <span>{t('admin.searchUsers')}</span>
            <input
              value={userFilters.q}
              onChange={(event) =>
                setUserFilters((current) => ({ ...current, q: event.target.value, page: 1 }))
              }
              placeholder={t('admin.searchUsersPlaceholder')}
            />
          </label>

          <label className="field-group">
            <span>{t('common.status')}</span>
            <select
              value={userFilters.status}
              onChange={(event) =>
                setUserFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
              }
            >
                  {USER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? t('common.allStatuses') : t(`status.${option.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </label>
        </form>

        {usersResponse.data.length === 0 ? (
          <EmptyState
            title={t('admin.noUsersTitle')}
            description={t('admin.noUsersDescription')}
          />
        ) : (
          <div className="admin-list admin-list--scroll">
            {usersResponse.data.map((entry) => {
              const isActionDisabled = busyUserId === entry.id || entry.role === 'ADMIN';
              const isChatDisabled =
                busyChatUserId === entry.id || entry.id === user?.id || entry.status === 'BLOCKED';

              return (
                <article key={entry.id} className="admin-card">
                  <div className="admin-card__header">
                    <div>
                      <h3>{entry.name}</h3>
                      <p>{entry.email}</p>
                    </div>
                    <UserStatusPill status={entry.status} role={entry.role} />
                  </div>

                  <div className="admin-card__meta">
                    <span>{t('admin.joined', { date: formatDate(entry.createdAt) })}</span>
                    <span>{t('admin.postsCount', { count: entry._count.posts })}</span>
                    <span>{t('admin.messagesCount', { count: entry._count.sentMessages })}</span>
                  </div>

                  <div className="admin-card__actions">
                    <button
                      type="button"
                      className="button button--small button--muted"
                      onClick={() => handleStartAdminChat(entry.id)}
                      disabled={isChatDisabled}
                    >
                      {busyChatUserId === entry.id ? t('admin.openingChat') : t('admin.chatAction')}
                    </button>
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() => handleUserStatusChange(entry.id, 'ACTIVE')}
                      disabled={isActionDisabled || entry.status === 'ACTIVE'}
                    >
                      {t('admin.activate')}
                    </button>
                    <button
                      type="button"
                      className="button button--small button--muted"
                      onClick={() => handleUserStatusChange(entry.id, 'BLOCKED')}
                      disabled={isActionDisabled || entry.status === 'BLOCKED'}
                    >
                      {t('admin.block')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <AdminPagination
          meta={usersResponse.meta}
          onChangePage={(page) => setUserFilters((current) => ({ ...current, page }))}
        />
      </section>

      <section className="content-card admin-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('admin.posts')}</span>
            <h2>{t('admin.postModerationTitle')}</h2>
            <p>{t('admin.postModerationDescription')}</p>
          </div>
        </div>

        <form className="filters-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field-group">
            <span>{t('admin.searchPosts')}</span>
            <input
              value={postFilters.q}
              onChange={(event) =>
                setPostFilters((current) => ({ ...current, q: event.target.value, page: 1 }))
              }
              placeholder={t('admin.searchPostsPlaceholder')}
            />
          </label>

          <label className="field-group">
            <span>{t('common.status')}</span>
            <select
              value={postFilters.status}
              onChange={(event) =>
                setPostFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
              }
            >
              {POST_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? t('common.allStatuses') : getLocalizedPostStatusLabel(option, t)}
                </option>
              ))}
            </select>
          </label>
        </form>

        {postsResponse.data.length === 0 ? (
          <EmptyState
            title={t('admin.noPostsTitle')}
            description={t('admin.noPostsDescription')}
          />
        ) : (
          <div className="admin-list admin-list--scroll">
            {postsResponse.data.map((entry) => (
              <article key={entry.id} className="admin-card">
                <div className="admin-card__header">
                  <div>
                    <h3>{entry.title}</h3>
                    <p>
                      {getLocalizedCategoryName(entry.category, language)} • {getLocalizedPostLocation(entry, language, t)}
                    </p>
                  </div>
                  <PostStatusPill status={entry.status} />
                </div>

                <div className="admin-card__meta">
                  <span>{t('admin.seller', { name: entry.user.name })}</span>
                  <span>
                    {t('admin.sellerStatus', {
                      status: t(`status.${entry.user.status.toLowerCase()}`)
                    })}
                  </span>
                  <span>{t('admin.updated', { date: formatDate(entry.updatedAt) })}</span>
                </div>

                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => handlePostStatusChange(entry.id, 'ACTIVE')}
                    disabled={busyPostId === entry.id || entry.status === 'ACTIVE'}
                  >
                    {t('admin.activate')}
                  </button>
                  <button
                    type="button"
                    className="button button--small button--muted"
                    onClick={() => handlePostStatusChange(entry.id, 'HIDDEN')}
                    disabled={busyPostId === entry.id || entry.status === 'HIDDEN'}
                  >
                    {t('admin.hide')}
                  </button>
                  <button
                    type="button"
                    className="button button--small button--muted"
                    onClick={() => handlePostStatusChange(entry.id, 'ARCHIVED')}
                    disabled={busyPostId === entry.id || entry.status === 'ARCHIVED'}
                  >
                    {t('admin.archive')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <AdminPagination
          meta={postsResponse.meta}
          onChangePage={(page) => setPostFilters((current) => ({ ...current, page }))}
        />
      </section>
    </div>
  );
};
