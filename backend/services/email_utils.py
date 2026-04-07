"""
services/email_utils.py
Email sending helpers: OTP and content-removal notifications.
"""
import os
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

EMAIL_SENDER   = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_otp_email(recipient_email: str, otp: str, user_name: str) -> None:
    """Send a 6-digit OTP for password reset via Gmail SMTP SSL."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        raise RuntimeError(
            "Email credentials not configured. "
            "Set EMAIL_SENDER and EMAIL_PASSWORD in your .env file."
        )

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;
                background:#141627;padding:32px;border-radius:12px;">
        <h2 style="color:#33CCCC;margin:0 0 8px;">Smart Itinerary Planner</h2>
        <p style="color:#D0D2EB;margin:0 0 8px;">Hi {user_name},</p>
        <p style="color:#D0D2EB;margin:0 0 24px;">
            You requested a password reset. Use the OTP below:
        </p>
        <div style="background:#252845;border:2px solid #33CCCC;border-radius:10px;
                    padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;
                         color:#33CCCC;font-family:monospace;">{otp}</span>
        </div>
        <p style="color:#7B809A;font-size:13px;margin:0 0 8px;">
            This OTP expires in <strong style="color:#D0D2EB;">10 minutes</strong>.
        </p>
        <p style="color:#7B809A;font-size:13px;margin:0;">
            If you did not request this, you can safely ignore this email.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Smart Itinerary Password Reset OTP"
    msg["From"]    = EMAIL_SENDER
    msg["To"]      = recipient_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, recipient_email, msg.as_string())

    logger.info(f"OTP email sent to {recipient_email}")


def send_content_removal_email(
    recipient_email: str,
    user_name: str,
    content_type: str,
    post_title: str,
    report_reason: str,
) -> None:
    """Send a moderation notification when content is removed by an admin."""
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        logger.warning("Email credentials not configured — skipping removal notification.")
        return

    is_comment = content_type == "comment"
    subject    = (
        f"Your {'comment' if is_comment else 'post'} has been removed "
        "— Smart Itinerary Planner"
    )
    headline = "Your comment has been removed" if is_comment else "Your post has been removed"
    blurb    = (
        f'Your comment on the post <strong style="color:#D0D2EB;">"{post_title}"</strong> '
        "was reviewed by our moderation team and has been permanently removed."
        if is_comment else
        f'Your post titled <strong style="color:#D0D2EB;">"{post_title}"</strong> '
        "was reviewed by our moderation team and has been permanently removed."
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0F1120;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F1120;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#141627;border-radius:16px;border:1px solid #252845;overflow:hidden;">

        <tr>
          <td style="background:linear-gradient(135deg,#1a1f3a,#141627);
                     padding:28px 36px 20px;border-bottom:1px solid #252845;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0;font-size:20px;font-weight:800;color:#33CCCC;">
                  Smart Itinerary Planner</p>
                <p style="margin:4px 0 0;font-size:12px;color:#7B809A;
                           text-transform:uppercase;letter-spacing:0.5px;">
                  Community Standards Notice</p>
              </td>
              <td align="right">
                <div style="width:36px;height:36px;background:rgba(255,107,107,0.12);
                            border:1px solid rgba(255,107,107,0.3);border-radius:50%;
                            text-align:center;line-height:36px;font-size:18px;">&#9888;</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#EAECF8;">{headline}</p>
            <p style="margin:0 0 24px;font-size:13px;color:#7B809A;">Hi {user_name},</p>
            <p style="margin:0 0 20px;font-size:14px;color:#A8AABD;line-height:1.7;">{blurb}</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#1E2240;border-left:3px solid #FF6B6B;
                           border-radius:0 8px 8px 0;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#FF6B6B;
                             text-transform:uppercase;letter-spacing:0.8px;">Reason for removal</p>
                  <p style="margin:0;font-size:14px;color:#D0D2EB;line-height:1.6;">
                    {report_reason}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:14px;color:#A8AABD;line-height:1.7;">
              We apply our <span style="color:#33CCCC;">Community Guidelines</span> to all content.
              If you believe this was a mistake, please reply to this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#0F1120;padding:20px 36px;border-top:1px solid #252845;">
            <p style="margin:0;font-size:11px;color:#4A4D6A;text-align:center;">
              &copy; {datetime.utcnow().year} Smart Itinerary Planner &nbsp;&middot;&nbsp;
              Automated message — please do not reply directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Smart Itinerary Planner <{EMAIL_SENDER}>"
    msg["To"]      = recipient_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, recipient_email, msg.as_string())
        logger.info(f"Content removal email sent to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to send removal email to {recipient_email}: {e}")