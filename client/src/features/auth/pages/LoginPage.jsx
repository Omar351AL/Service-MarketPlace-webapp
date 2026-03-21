import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { useI18n } from '../../i18n/useI18n.js';
import { useAuth } from '../hooks/useAuth.js';

const normalizeFieldErrors = (fieldErrors = {}) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );

const getLoginErrorState = (error, t) => {
  if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
    return {
      fieldErrors: {},
      formError: t('auth.invalidCredentials')
    };
  }

  if (error.code === 'EMAIL_NOT_VERIFIED') {
    return {
      fieldErrors: {},
      formError: t('auth.emailNotVerified')
    };
  }

  if (error.code === 'ACCOUNT_BLOCKED') {
    return {
      fieldErrors: {},
      formError: t('auth.accountBlocked')
    };
  }

  const normalizedFieldErrors = normalizeFieldErrors(error.fieldErrors);

  if (normalizedFieldErrors.email) {
    const emailError = t('auth.emailInvalidError');
    return {
      fieldErrors: { email: emailError },
      formError: emailError
    };
  }

  if (normalizedFieldErrors.password) {
    return {
      fieldErrors: { password: t('auth.invalidCredentials') },
      formError: t('auth.invalidCredentials')
    };
  }

  if (error.code === 'MAIL_NOT_CONFIGURED') {
    return {
      fieldErrors: {},
      formError: t('auth.mailNotConfigured')
    };
  }

  return {
    fieldErrors: {},
    formError: t('auth.loginFailed')
  };
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preservedRedirect = searchParams.get('redirect');
  const registerUrl = preservedRedirect
    ? `/register?redirect=${encodeURIComponent(preservedRedirect)}`
    : '/register';
  const forgotPasswordUrl = '/forgot-password';
  const successMessage = location.state?.message || '';

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.loginEyebrow')}
        title={t('auth.loginTitle')}
        description={null}
      />

      <section className="content-card auth-card">
        {successMessage ? <p className="success-message">{successMessage}</p> : null}

        <form
          className="editor-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorMessage('');
            setFieldErrors({});

            try {
              await login(formState);
              navigate('/');
            } catch (error) {
              const nextErrorState = getLoginErrorState(error, t);
              setFieldErrors(nextErrorState.fieldErrors);
              setErrorMessage(nextErrorState.formError);
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
            {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
          </label>

          <label className="field-group">
            <span>{t('auth.password')}</span>
            <input
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
          </label>

          <div className="auth-secondary-link-row">
            <Link to={forgotPasswordUrl} className="ghost-link">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {errorMessage ? (
            <div className="auth-feedback-stack">
              <p className="error-message">{errorMessage}</p>
              {errorMessage === t('auth.emailNotVerified') && formState.email ? (
                <Link
                  to={`/verify-email?email=${encodeURIComponent(formState.email)}`}
                  className="ghost-link"
                >
                  {t('auth.goToVerification')}
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? t('auth.loginLoading') : t('auth.loginAction')}
            </button>
            <p>
              {t('auth.noAccount')}{' '}
              <Link to={registerUrl} className="ghost-link">
                {t('auth.registerHere')}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};
