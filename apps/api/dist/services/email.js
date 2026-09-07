import { Resend } from "resend";
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
}
const resend = new Resend(resendApiKey);
const from = process.env.RESEND_FROM ?? "LOFTY <onboarding@resend.dev>";
const appUrl = process.env.APP_URL ?? "http://localhost:5173";
export async function sendPasswordChangeEmail({ email, name, token, }) {
    const passwordChangeUrl = `${appUrl}/verify-password-change?token=${encodeURIComponent(token)}`;
    const { data, error } = await resend.emails.send({
        from,
        to: email,
        subject: "Confirm your LOFTY password change",
        html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 560px;
        margin: 0 auto;
        padding: 40px 24px;
        color: #0f172a;
      ">
        <div style="
          width: 48px;
          height: 48px;
          line-height: 48px;
          text-align: center;
          border-radius: 12px;
          background: #0f172a;
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 24px;
        ">
          L
        </div>

        <h1 style="
          font-size: 24px;
          margin: 0 0 16px;
        ">
          Confirm your password change
        </h1>

        <p style="
          color: #475569;
          line-height: 1.6;
          margin-bottom: 8px;
        ">
          Hi ${escapeHtml(name)},
        </p>

        <p style="
          color: #475569;
          line-height: 1.6;
        ">
          Someone requested a password change for your LOFTY account.
          Click the button below to confirm the change.
        </p>

        <div style="margin: 32px 0;">
          <a
            href="${passwordChangeUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              border-radius: 10px;
              background: #0f172a;
              color: white;
              text-decoration: none;
              font-weight: 600;
            "
          >
            Confirm password change
          </a>
        </div>

        <p style="
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        ">
          This link will expire after 1 hour.
        </p>

        <p style="
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 32px;
        ">
          If you didn't request this password change, you can safely ignore
          this email. Your current password will remain unchanged.
        </p>
      </div>
    `,
    });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
export async function sendDesktopInvitation({ recipientEmail, recipientName, inviterName, desktopName, desktopId, role, }) {
    const desktopUrl = `${appUrl}/desktops/${desktopId}`;
    const roleLabel = role === "editor" ? "Editor" : "Viewer";
    const { data, error } = await resend.emails.send({
        from,
        to: recipientEmail,
        subject: `${inviterName} invited you to ${desktopName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">
          You've been invited to a lofty
        </h1>

        <p style="color: #475569;">
          Hi ${escapeHtml(recipientName)},
        </p>

        <p style="color: #475569;">
          <strong>${escapeHtml(inviterName)}</strong> has added you
          to the lofty <strong>${escapeHtml(desktopName)}</strong>.
        </p>

        <div style="
          margin: 24px 0;
          padding: 16px;
          border-radius: 12px;
          background: #f1f5f9;
        ">
          <div style="font-size: 14px; color: #64748b;">
            Your role
          </div>

          <div style="margin-top: 4px; font-weight: 600;">
            ${roleLabel}
          </div>
        </div>

        <a
          href="${desktopUrl}"
          style="
            display: inline-block;
            padding: 12px 18px;
            border-radius: 10px;
            background: #0f172a;
            color: white;
            text-decoration: none;
            font-weight: 600;
          "
        >
          Open lofty
        </a>

        <p style="
          margin-top: 32px;
          font-size: 13px;
          color: #94a3b8;
        ">
          You received this email because you were added to a lofty.
        </p>
      </div>
    `,
    });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
export async function sendVerificationEmail({ email, name, token, }) {
    const emailUrl = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const { data, error } = await resend.emails.send({
        from,
        to: email,
        subject: "Verify your LOFTY email",
        html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 560px;
        margin: 0 auto;
        padding: 40px 24px;
        color: #0f172a;
      ">
        <div style="
          width: 48px;
          height: 48px;
          line-height: 48px;
          text-align: center;
          border-radius: 12px;
          background: #0f172a;
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 24px;
        ">
          D
        </div>

        <h1 style="
          font-size: 24px;
          margin: 0 0 16px;
        ">
          Verify your email
        </h1>

        <p style="
          color: #475569;
          line-height: 1.6;
          margin-bottom: 8px;
        ">
          Hi ${escapeHtml(name)},
        </p>

        <p style="
          color: #475569;
          line-height: 1.6;
        ">
          Thanks for creating a LOFTY account. Please verify your email
          address to activate your account.
        </p>

        <div style="margin: 32px 0;">
          <a
            href="${emailUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              border-radius: 10px;
              background: #0f172a;
              color: white;
              text-decoration: none;
              font-weight: 600;
            "
          >
            Verify email address
          </a>
        </div>

        <p style="
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        ">
          This verification link will expire after 24 hours.
        </p>

        <p style="
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
          margin-top: 32px;
        ">
          If you didn't create a lofty account, you can safely ignore
          this email.
        </p>
      </div>
    `,
    });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
