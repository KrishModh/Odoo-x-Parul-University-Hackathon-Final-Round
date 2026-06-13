import resend
from flask import current_app


def send_email(to, subject, html):
    api_key = current_app.config['RESEND_API_KEY']
    if not api_key:
        raise RuntimeError('RESEND_API_KEY is not configured.')
    resend.api_key = api_key
    return resend.Emails.send({
        'from': current_app.config.get('EMAIL_FROM', 'Crema POS <onboarding@resend.dev>'),
        'to': [to],
        'subject': subject,
        'html': html,
    })
