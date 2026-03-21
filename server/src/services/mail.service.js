import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let transporterPromise = null;

const assertMailConfig = () => {
  if (
    !env.MAIL_HOST ||
    !env.MAIL_PORT ||
    !env.MAIL_USER ||
    !env.MAIL_PASSWORD ||
    !env.MAIL_FROM
  ) {
    throw new ApiError(503, 'Email delivery is not configured.', null, 'MAIL_NOT_CONFIGURED');
  }
};

const getTransporter = async () => {
  assertMailConfig();

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_SECURE ?? env.MAIL_PORT === 465,
        auth: {
          user: env.MAIL_USER,
          pass: env.MAIL_PASSWORD
        }
      })
    );
  }

  return transporterPromise;
};

const buildOtpEmailContent = ({ language, name, code, minutes, type }) => {
  const isArabic = language === 'ar';
  const greetingName = name?.trim() || (isArabic ? 'المستخدم' : 'there');

  if (type === 'PASSWORD_RESET') {
    return {
      subject: isArabic ? 'رمز إعادة تعيين كلمة المرور' : 'Password reset code',
      text: isArabic
        ? `مرحبًا ${greetingName},\n\nرمز إعادة تعيين كلمة المرور هو: ${code}\nينتهي هذا الرمز خلال ${minutes} دقيقة.\n\nإذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.`
        : `Hi ${greetingName},\n\nYour password reset code is: ${code}\nThis code expires in ${minutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
      html: isArabic
        ? `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1f2937">
            <p>مرحبًا ${greetingName}،</p>
            <p>رمز إعادة تعيين كلمة المرور هو:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
            <p>ينتهي هذا الرمز خلال ${minutes} دقيقة.</p>
            <p>إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.</p>
          </div>`
        : `<div style="font-family:Arial,sans-serif;line-height:1.8;color:#1f2937">
            <p>Hi ${greetingName},</p>
            <p>Your password reset code is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
            <p>This code expires in ${minutes} minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>`
    };
  }

  return {
    subject: isArabic ? 'رمز تأكيد البريد الإلكتروني' : 'Email verification code',
    text: isArabic
      ? `مرحبًا ${greetingName},\n\nرمز تأكيد البريد الإلكتروني هو: ${code}\nينتهي هذا الرمز خلال ${minutes} دقيقة.\n\nأدخل الرمز لإكمال تفعيل حسابك.`
      : `Hi ${greetingName},\n\nYour email verification code is: ${code}\nThis code expires in ${minutes} minutes.\n\nEnter the code to finish activating your account.`,
    html: isArabic
      ? `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1f2937">
          <p>مرحبًا ${greetingName}،</p>
          <p>رمز تأكيد البريد الإلكتروني هو:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
          <p>ينتهي هذا الرمز خلال ${minutes} دقيقة.</p>
          <p>أدخل الرمز لإكمال تفعيل حسابك.</p>
        </div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.8;color:#1f2937">
          <p>Hi ${greetingName},</p>
          <p>Your email verification code is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
          <p>This code expires in ${minutes} minutes.</p>
          <p>Enter the code to finish activating your account.</p>
        </div>`
  };
};

export const sendOtpEmail = async ({ email, language = 'en', name, code, minutes, type }) => {
  const transporter = await getTransporter();
  const content = buildOtpEmailContent({
    language,
    name,
    code,
    minutes,
    type
  });

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html
  });
};
