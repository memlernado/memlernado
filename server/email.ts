import * as brevo from '@getbrevo/brevo';
import { EmailTemplateLoader } from './email-template-loader';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY must be set for email functionality");
}

if (!process.env.BASE_URL) {
  throw new Error("BASE_URL must be set for email links");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const baseUrl = process.env.BASE_URL;

export async function sendWelcomeEmail(email: string, firstName: string, language: string = 'en'): Promise<void> {
  const template = EmailTemplateLoader.loadTemplate(language, 'welcome');
  const renderedTemplate = EmailTemplateLoader.renderTemplate(template, { firstName });
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = renderedTemplate.subject;
  sendSmtpEmail.htmlContent = renderedTemplate.htmlContent;
  sendSmtpEmail.textContent = renderedTemplate.textContent;
  sendSmtpEmail.sender = { name: "Memlernado", email: "hello@support.memlernado.com" };
  sendSmtpEmail.to = [{ email, name: firstName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Welcome email sent to ${email} in ${language}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetToken: string, language: string = 'en'): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const template = EmailTemplateLoader.loadTemplate(language, 'password-reset');
  const renderedTemplate = EmailTemplateLoader.renderTemplate(template, { firstName, resetUrl });
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = renderedTemplate.subject;
  sendSmtpEmail.htmlContent = renderedTemplate.htmlContent;
  sendSmtpEmail.textContent = renderedTemplate.textContent;
  sendSmtpEmail.sender = { name: "Memlernado", email: "noreply@memlernado.com" };
  sendSmtpEmail.to = [{ email, name: firstName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Password reset email sent to ${email} in ${language}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}
