import resend
from flask import current_app


def send_email(to, subject, html):
    api_key = current_app.config['RESEND_API_KEY']
    if not api_key:
        raise RuntimeError('RESEND_API_KEY is not configured.')
    resend.api_key = api_key
    return resend.Emails.send({
        'from': current_app.config.get('EMAIL_FROM', 'Velluto Cafe <noreply@krishmodh.site>'),
        'to': [to],
        'subject': subject,
        'html': html,
    })


def send_otp_email(*, to, name, otp_code):
    subject = 'Verify your Velluto Cafe account'
    html = f"""
    <div style="font-family:Arial,sans-serif;background:#f7f3ee;padding:32px;color:#3b2b22;">
      <div style="max-width:560px;margin:0 auto;background:#fffdf9;border-radius:20px;padding:36px;border:1px solid #eadfd2;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;color:#a87857;font-weight:700;">VELLUTO CAFE</p>
        <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;">Verify your email</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#6e635c;">
          Hi {name}, use the verification code below to finish creating your account. The code expires in 5 minutes.
        </p>
        <div style="margin:0 0 24px;padding:18px 20px;border-radius:16px;background:#f3ebe3;border:1px solid #e4d5c6;text-align:center;">
          <span style="display:block;font-size:32px;letter-spacing:0.4em;font-weight:700;color:#49352a;">{otp_code}</span>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#8a7b70;">
          If you did not request this account, you can safely ignore this email.
        </p>
      </div>
    </div>
    """
    return send_email(to, subject, html)
