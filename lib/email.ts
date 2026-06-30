import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

interface SendNotificationEmailParams {
  to: string;
  subject: string;
  qaOfficialName: string;
  courseName: string;
  alertReason: string;
  actionUrl: string;
}

export async function sendQANotificationEmail({
  to,
  subject,
  qaOfficialName,
  courseName,
  alertReason,
  actionUrl,
}: SendNotificationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured. Email skipped.");
    return;
  }

  try {
    await resend.emails.send({
      from: "Uniqualis QA System <qa@uniqualis.com>",
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Action Required: Flagged Evaluation</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #374151; font-size: 16px;">Dear ${qaOfficialName},</p>
            <p style="color: #374151; font-size: 16px;">
              An evaluation for <strong>${courseName}</strong> has been flagged by our automated system for manual review.
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
              <p style="color: #991b1b; margin: 0; font-weight: bold;">Reason for Flag:</p>
              <p style="color: #b91c1c; margin: 8px 0 0 0;">${alertReason}</p>
            </div>
            <a href="${actionUrl}" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 16px;">
              Review Evaluation
            </a>
          </div>
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Uniqualis Quality Assurance Platform</p>
          </div>
        </div>
      `,
    });
    console.log(`Notification email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}
