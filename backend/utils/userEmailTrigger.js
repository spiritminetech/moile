import { sendEmailNotification } from "./emailService.js";

/**
 * Trigger user creation email
 * DOES NOT modify emailService
 */
export const triggerUserCreationMail = async ({
  email,
  password,
  company,
  role,
}) => {
  const subject = "Your account has been created";

  const html = `
    <h3>User Account Created</h3>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${password}</p>
    <p><strong>Company:</strong> ${company}</p>
    <p><strong>Role:</strong> ${role}</p>
    <p>Please login and change your password.</p>
  `;

  return await sendEmailNotification(email, subject, html);
};
