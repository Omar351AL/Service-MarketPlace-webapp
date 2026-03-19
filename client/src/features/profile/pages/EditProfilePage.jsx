import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, KeyRound, Mail, Trash2, Upload, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api, resolveApiAssetUrl } from '../../../lib/api/client.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useI18n } from '../../i18n/useI18n.js';

const MAX_AVATAR_SIZE_MB = 5;
const allowedAvatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const buildValidationErrors = ({ name, email, bio }, t) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = t('profile.nameRequiredError');
  } else if (name.trim().length < 2) {
    errors.name = t('profile.nameLengthError');
  }

  if (!email.trim()) {
    errors.email = t('profile.emailRequiredError');
  } else if (!isValidEmail(email.trim())) {
    errors.email = t('profile.emailInvalidError');
  }

  if (bio.trim().length > 400) {
    errors.bio = t('profile.bioLongError');
  }

  return errors;
};

const buildPasswordValidationErrors = ({ currentPassword, newPassword, confirmNewPassword }, t) => {
  const errors = {};

  if (!currentPassword.trim()) {
    errors.currentPassword = t('profile.currentPasswordRequiredError');
  }

  if (!newPassword.trim()) {
    errors.newPassword = t('profile.newPasswordRequiredError');
  } else if (newPassword.trim().length < 8) {
    errors.newPassword = t('profile.newPasswordLengthError');
  }

  if (!confirmNewPassword.trim()) {
    errors.confirmNewPassword = t('profile.confirmNewPasswordRequiredError');
  } else if (confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = t('profile.confirmNewPasswordMatchError');
  }

  return errors;
};

const normalizeFieldErrors = (fieldErrors = {}) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );

const localizePasswordFieldErrors = (fieldErrors = {}, t) => {
  const normalizedFieldErrors = normalizeFieldErrors(fieldErrors);
  const localizedErrors = {};

  Object.entries(normalizedFieldErrors).forEach(([key, message]) => {
    const normalizedMessage = String(message || '').toLowerCase();

    if (key === 'currentPassword' && normalizedMessage.includes('incorrect')) {
      localizedErrors.currentPassword = t('profile.currentPasswordIncorrectError');
      return;
    }

    if (key === 'currentPassword' && normalizedMessage.includes('not available')) {
      localizedErrors.currentPassword = t('profile.passwordChangeUnavailableError');
      return;
    }

    if (key === 'newPassword' && normalizedMessage.includes('different')) {
      localizedErrors.newPassword = t('profile.passwordSameAsCurrentError');
      return;
    }

    if (key === 'confirmNewPassword') {
      localizedErrors.confirmNewPassword = t('profile.confirmNewPasswordMatchError');
      return;
    }

    localizedErrors[key] = message;
  });

  return localizedErrors;
};

const localizePasswordErrorMessage = (error, t) => {
  const normalizedMessage = String(error?.message || '').toLowerCase();

  if (normalizedMessage.includes('current password is incorrect')) {
    return t('profile.currentPasswordIncorrectError');
  }

  if (normalizedMessage.includes('different from the current password')) {
    return t('profile.passwordSameAsCurrentError');
  }

  if (normalizedMessage.includes('not available for this account')) {
    return t('profile.passwordChangeUnavailableError');
  }

  return error?.message || '';
};

export const EditProfilePage = () => {
  const inputRef = useRef(null);
  const { t } = useI18n();
  const { setSession, token, user } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    bio: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setFormState({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || ''
    });
    setAvatarFile(null);
    setRemoveAvatar(false);
    setFieldErrors({});
    setErrorMessage('');
    setPasswordState({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setPasswordFieldErrors({});
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

  const currentAvatarUrl = useMemo(() => {
    if (removeAvatar) {
      return '';
    }

    if (avatarPreviewUrl) {
      return avatarPreviewUrl;
    }

    return user?.avatarUrl ? resolveApiAssetUrl(user.avatarUrl) : '';
  }, [avatarPreviewUrl, removeAvatar, user?.avatarUrl]);

  const handleAvatarSelection = (event) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    const nextFieldErrors = {};

    if (!allowedAvatarMimeTypes.has(nextFile.type)) {
      nextFieldErrors.avatar = t('profile.avatarTypeError');
    } else if (nextFile.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      nextFieldErrors.avatar = t('profile.avatarSizeError', { size: MAX_AVATAR_SIZE_MB });
    }

    if (nextFieldErrors.avatar) {
      setFieldErrors((current) => ({ ...current, ...nextFieldErrors }));
      event.target.value = '';
      return;
    }

    setAvatarFile(nextFile);
    setRemoveAvatar(false);
    setFieldErrors((current) => ({ ...current, avatar: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = buildValidationErrors(formState, t);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setErrorMessage(t('posts.fixFields'));
      setSuccessMessage('');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = new FormData();
      payload.append('name', formState.name.trim());
      payload.append('email', formState.email.trim());
      payload.append('bio', formState.bio.trim());
      payload.append('removeAvatar', removeAvatar ? 'true' : 'false');

      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const response = await api.updateOwnProfile(payload, token);

      setSession({
        token,
        user: response.data
      });
      setAvatarFile(null);
      setRemoveAvatar(false);
      setSuccessMessage(t('profile.accountUpdated'));
    } catch (error) {
      setFieldErrors(normalizeFieldErrors(error.fieldErrors));
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = buildPasswordValidationErrors(passwordState, t);

    if (Object.keys(validationErrors).length > 0) {
      setPasswordFieldErrors(validationErrors);
      setPasswordErrorMessage(t('posts.fixFields'));
      setPasswordSuccessMessage('');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordFieldErrors({});
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');

    try {
      await api.changeOwnPassword(
        {
          currentPassword: passwordState.currentPassword,
          newPassword: passwordState.newPassword,
          confirmNewPassword: passwordState.confirmNewPassword
        },
        token
      );

      setPasswordState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setPasswordSuccessMessage(t('profile.passwordUpdated'));
    } catch (error) {
      const localizedFieldErrors = localizePasswordFieldErrors(error.fieldErrors, t);
      setPasswordFieldErrors(localizedFieldErrors);
      setPasswordErrorMessage(
        Object.values(localizedFieldErrors)[0] || localizePasswordErrorMessage(error, t)
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('profile.accountSettingsEyebrow')}
        title={t('profile.accountSettingsTitle')}
        description={null}
        actions={
          <Link to={`/users/${user?.id || ''}`} className="ghost-link">
            {t('common.viewProfile')}
          </Link>
        }
      />

      <section className="content-card auth-card account-page__card">
        <form className="editor-form account-page__form" onSubmit={handleSubmit}>
          <div className="account-avatar-panel">
            <div className="account-avatar-panel__preview">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt={formState.name || t('nav.profileFallback')} className="account-avatar-panel__image" />
              ) : (
                <span className="account-avatar-panel__fallback">
                  {formState.name?.slice(0, 1).toUpperCase() || <UserCircle2 size={26} />}
                </span>
              )}
            </div>

            <div className="account-avatar-panel__content">
              <div>
                <h2>{t('profile.photoTitle')}</h2>
                <p>{t('profile.photoHint')}</p>
              </div>

              <div className="account-avatar-panel__actions">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={handleAvatarSelection}
                />

                <button
                  type="button"
                  className="button button--small"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload size={16} />
                  {t('profile.changePhoto')}
                </button>

                {(avatarFile || user?.avatarUrl) && !removeAvatar ? (
                  <button
                    type="button"
                    className="button button--small button--muted"
                    onClick={() => {
                      setAvatarFile(null);
                      setRemoveAvatar(true);
                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    {t('profile.removePhoto')}
                  </button>
                ) : null}
              </div>

              {fieldErrors.avatar ? <p className="field-error">{fieldErrors.avatar}</p> : null}
            </div>
          </div>

          <div className="editor-grid">
            <label className="field-group">
              <span>{t('auth.name')}</span>
              <input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
            </label>

            <label className="field-group">
              <span>{t('auth.email')}</span>
              <div className="account-field account-field--icon">
                <Mail size={17} />
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </div>
              {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
            </label>
          </div>

          <label className="field-group">
            <span>{t('profile.bio')}</span>
            <textarea
              rows="5"
              value={formState.bio}
              onChange={(event) =>
                setFormState((current) => ({ ...current, bio: event.target.value }))
              }
              placeholder={t('profile.bioPlaceholder')}
            />
            {fieldErrors.bio ? <span className="field-error">{fieldErrors.bio}</span> : null}
          </label>

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={isSubmitting}>
              <Camera size={16} />
              {isSubmitting ? t('common.saving') : t('profile.saveAccount')}
            </button>
          </div>
        </form>
      </section>

      <section className="content-card auth-card account-page__card account-page__card--password">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('profile.accountSettingsEyebrow')}</span>
            <h2>{t('profile.passwordSectionTitle')}</h2>
            <p>{t('profile.passwordSectionDescription')}</p>
          </div>
        </div>

        <form className="editor-form account-page__form" onSubmit={handlePasswordSubmit}>
          <div className="editor-grid">
            <label className="field-group">
              <span>{t('profile.currentPassword')}</span>
              <input
                type="password"
                value={passwordState.currentPassword}
                onChange={(event) =>
                  setPasswordState((current) => ({
                    ...current,
                    currentPassword: event.target.value
                  }))
                }
                autoComplete="current-password"
                required
              />
              {passwordFieldErrors.currentPassword ? (
                <span className="field-error">{passwordFieldErrors.currentPassword}</span>
              ) : null}
            </label>

            <label className="field-group">
              <span>{t('profile.newPassword')}</span>
              <input
                type="password"
                value={passwordState.newPassword}
                onChange={(event) =>
                  setPasswordState((current) => ({
                    ...current,
                    newPassword: event.target.value
                  }))
                }
                autoComplete="new-password"
                required
              />
              {passwordFieldErrors.newPassword ? (
                <span className="field-error">{passwordFieldErrors.newPassword}</span>
              ) : null}
            </label>
          </div>

          <label className="field-group">
            <span>{t('profile.confirmNewPassword')}</span>
            <input
              type="password"
              value={passwordState.confirmNewPassword}
              onChange={(event) =>
                setPasswordState((current) => ({
                  ...current,
                  confirmNewPassword: event.target.value
                }))
              }
              autoComplete="new-password"
              required
            />
            {passwordFieldErrors.confirmNewPassword ? (
              <span className="field-error">{passwordFieldErrors.confirmNewPassword}</span>
            ) : null}
          </label>

          {passwordErrorMessage ? <p className="error-message">{passwordErrorMessage}</p> : null}
          {passwordSuccessMessage ? <p className="success-message">{passwordSuccessMessage}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button button--muted" disabled={isUpdatingPassword}>
              <KeyRound size={16} />
              {isUpdatingPassword ? t('common.saving') : t('profile.savePassword')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
