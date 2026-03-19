import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { useI18n } from '../../i18n/useI18n.js';
import { useAuth } from '../hooks/useAuth.js';

const normalizeFieldErrors = (fieldErrors = {}) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );

const getLoginErrorState = (error, t) => {
  if (error.status === 401) {
    return {
      fieldErrors: {},
      formError: t('auth.invalidCredentials')
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

  return {
    fieldErrors: {},
    formError: t('auth.loginFailed')
  };
};

export const LoginPage = () => {
  const navigate = useNavigate();
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

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.loginEyebrow')}
        title={t('auth.loginTitle')}
        description={null}
      />

      <section className="content-card auth-card">
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

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

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
