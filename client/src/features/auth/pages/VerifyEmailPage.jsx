import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../../../components/common/PageIntro.jsx';
import { api } from '../../../lib/api/client.js';
import { useI18n } from '../../i18n/useI18n.js';

const getOtpErrorMessage = (error, t) => {
  if (error.code === 'OTP_INVALID') {
    return t('auth.otpInvalidError');
  }

  if (error.code === 'OTP_EXPIRED') {
    return t('auth.otpExpiredError');
  }

  if (error.code === 'OTP_ALREADY_USED') {
    return t('auth.otpAlreadyUsedError');
  }

  if (error.code === 'OTP_RESEND_COOLDOWN') {
    const seconds = error.payload?.details?.retryAfterSeconds ?? 60;
    return t('auth.resendCooldownError', { seconds });
  }

  if (error.code === 'MAIL_NOT_CONFIGURED') {
    return t('auth.mailNotConfigured');
  }

  return t('auth.verificationFailed');
};

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useI18n();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canSubmit = useMemo(() => email.trim() && code.trim().length === 6, [code, email]);

  return (
    <div className="page-stack auth-page">
      <PageIntro
        eyebrow={t('auth.verifyEmailEyebrow')}
        title={t('auth.verifyEmailTitle')}
        description={email ? t('auth.verifyEmailNotice', { email }) : null}
      />

      <section className="content-card auth-card">
        <form
          className="editor-form"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!email) {
              setErrorMessage(t('auth.emailInvalidError'));
              return;
            }

            setIsSubmitting(true);
            setErrorMessage('');
            setSuccessMessage('');

            try {
              await api.verifyEmailOtp({
                email,
                code
              });

              const message = t('auth.verificationSuccess');
              setSuccessMessage(message);
              navigate('/login', {
                replace: true,
                state: {
                  message
                }
              });
            } catch (error) {
              setErrorMessage(getOtpErrorMessage(error, t));
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

          <label className="field-group">
            <span>{t('auth.verificationCode')}</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.verificationCodeHint')}
              required
            />
          </label>

          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? t('auth.verifyEmailLoading') : t('auth.verifyEmailAction')}
            </button>

            <button
              type="button"
              className="button button--muted"
              disabled={isResending || !email}
              onClick={async () => {
                if (!email) {
                  setErrorMessage(t('auth.emailInvalidError'));
                  return;
                }

                setIsResending(true);
                setErrorMessage('');
                setSuccessMessage('');

                try {
                  await api.resendVerificationOtp({
                    email,
                    language
                  });
                  setSuccessMessage(t('auth.resendSuccess'));
                } catch (error) {
                  setErrorMessage(getOtpErrorMessage(error, t));
                } finally {
                  setIsResending(false);
                }
              }}
            >
              {isResending ? t('auth.resendLoading') : t('auth.resendCode')}
            </button>
          </div>

          <p>
            <Link to="/login" className="ghost-link">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
};
