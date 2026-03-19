import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { useI18n } from '../../i18n/useI18n.js';
import { useAuth } from '../hooks/useAuth.js';

const normalizeFieldErrors = (fieldErrors = {}) =>
  Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );

const getRegisterErrorState = (error, t) => {
  const normalizedFieldErrors = normalizeFieldErrors(error.fieldErrors);
  const nextFieldErrors = {};

  if (normalizedFieldErrors.name) {
    nextFieldErrors.name = t('auth.nameLengthError');
  }

  if (normalizedFieldErrors.email) {
    nextFieldErrors.email = t('auth.emailInvalidError');
  }

  if (normalizedFieldErrors.password) {
    nextFieldErrors.password = t('auth.passwordMinLengthError');
  }

  if (error.status === 409) {
    nextFieldErrors.email = t('auth.emailExistsError');
  }

  if (Object.keys(nextFieldErrors).length > 0) {
    const firstErrorMessage = nextFieldErrors.password || nextFieldErrors.email || nextFieldErrors.name;

    return {
      fieldErrors: nextFieldErrors,
      formError: firstErrorMessage || t('auth.fixFields')
    };
  }

  return {
    fieldErrors: {},
    formError: t('auth.registerFailed')
  };
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const { register } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preservedRedirect = searchParams.get('redirect');
  const loginUrl = preservedRedirect
    ? `/login?redirect=${encodeURIComponent(preservedRedirect)}`
    : '/login';

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.registerEyebrow')}
        title={t('auth.registerTitle')}
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
              await register(formState);
              navigate('/');
            } catch (error) {
              const nextErrorState = getRegisterErrorState(error, t);
              setFieldErrors(nextErrorState.fieldErrors);
              setErrorMessage(nextErrorState.formError);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="field-group">
            <span>{t('auth.name')}</span>
            <input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              required
            />
            {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
          </label>

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
              {isSubmitting ? t('auth.registerLoading') : t('auth.registerAction')}
            </button>
            <p>
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to={loginUrl} className="ghost-link">
                {t('auth.loginHere')}
              </Link>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
};
