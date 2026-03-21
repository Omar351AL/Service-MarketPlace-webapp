import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

const getResetErrorMessage = (error, t) => {
  if (error.code === 'OTP_INVALID') {
    return t('auth.otpInvalidError');
  }

  if (error.code === 'OTP_EXPIRED') {
    return t('auth.otpExpiredError');
  }

  if (error.code === 'OTP_ALREADY_USED') {
    return t('auth.otpAlreadyUsedError');
  }

  if (error.code === 'MAIL_NOT_CONFIGURED') {
    return t('auth.mailNotConfigured');
  }

  if (error.fieldErrors?.newPassword) {
    return t('auth.passwordMinLengthError');
  }

  if (error.fieldErrors?.confirmNewPassword) {
    return t('auth.passwordConfirmationError');
  }

  return t('auth.resetPasswordFailed');
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const initialEmail = searchParams.get('email') || '';
  const [formState, setFormState] = useState({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.resetPasswordEyebrow')}
        title={t('auth.resetPasswordTitle')}
        description={
          formState.email ? t('auth.resetPasswordNotice', { email: formState.email }) : null
        }
      />

      <section className="content-card auth-card">
        <form
          className="editor-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorMessage('');

            try {
              await api.resetPasswordWithOtp(formState);

              const message = t('auth.resetPasswordSuccess');
              setSuccessMessage(message);
              navigate('/login', {
                replace: true,
                state: {
                  message
                }
              });
            } catch (error) {
              setErrorMessage(getResetErrorMessage(error, t));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="field-group">
            <span>{t('auth.email')}</span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="field-group">
            <span>{t('auth.resetCode')}</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={formState.code}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  code: event.target.value.replace(/\D/g, '').slice(0, 6)
                }))
              }
              required
            />
          </label>

          <label className="field-group">
            <span>{t('auth.newPassword')}</span>
            <input
              type="password"
              value={formState.newPassword}
              onChange={(event) =>
                setFormState((current) => ({ ...current, newPassword: event.target.value }))
              }
              required
            />
          </label>

          <label className="field-group">
            <span>{t('auth.confirmNewPassword')}</span>
            <input
              type="password"
              value={formState.confirmNewPassword}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  confirmNewPassword: event.target.value
                }))
              }
              required
            />
          </label>

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? t('auth.resetPasswordLoading') : t('auth.resetPasswordAction')}
            </button>
            <p>
              <Link to="/login" className="ghost-link">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};
