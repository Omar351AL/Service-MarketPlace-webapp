import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.forgotPasswordEyebrow')}
        title={t('auth.forgotPasswordTitle')}
        description={t('auth.forgotPasswordNotice')}
      />

      <section className="content-card auth-card">
        <form
          className="editor-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            try {
              await api.requestPasswordResetOtp({
                email,
                language
              });

              const message = t('auth.forgotPasswordSuccess');
              setSuccessMessage(message);
              navigate(`/reset-password?email=${encodeURIComponent(email)}`, {
                state: { message }
              });
            } catch (error) {
              if (error.code === 'MAIL_NOT_CONFIGURED') {
                setErrorMessage(t('auth.mailNotConfigured'));
              } else {
                setErrorMessage(t('auth.forgotPasswordFailed'));
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <label className="field-group">
            <span>{t('auth.email')}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? t('auth.forgotPasswordLoading') : t('auth.forgotPasswordAction')}
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
