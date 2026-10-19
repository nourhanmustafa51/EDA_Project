"""emailer.py - Send the PDF report by email using Python's smtplib (Gmail SMTP).

Settings are read from the .env file:
    EMAIL_SENDER=your.address@gmail.com
    EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx     (a Gmail App Password, NOT your normal password)
    EMAIL_RECIPIENTS=first@example.com,second@example.com
"""
import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587  # STARTTLS


def build_message(pdf_path, log=None):
    """Create the email (subject, body and the PDF attachment)."""
    sender = os.getenv("EMAIL_SENDER", "").strip()
    recipients = [r.strip() for r in os.getenv("EMAIL_RECIPIENTS", sender).split(",") if r.strip()]
    if not sender:
        raise RuntimeError("EMAIL_SENDER is missing in the .env file.")
    if not recipients:
        raise RuntimeError("EMAIL_RECIPIENTS is missing in the .env file.")

    log = log or {}
    name = log.get("file", os.path.basename(pdf_path))

    lines = [f"Hello,", "", f"The automated analysis of '{name}' has finished. "
             f"The full report is attached as a PDF.", ""]
    if log:
        lines += [
            "Quick summary:",
            f"- Rows: {log.get('rows_before')} -> {log.get('rows_after')}",
            f"- Duplicate rows removed: {log.get('duplicates_removed')}",
            f"- Columns dropped: {', '.join(log.get('columns_dropped', [])) or 'none'}",
            f"- Cleaning decisions recorded: {len(log.get('decision_table', []))}",
            "",
        ]
    lines += ["This email was sent automatically by the EDA report pipeline."]

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = f"Automated EDA Report: {name}"
    msg.set_content("\n".join(lines))

    with open(pdf_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application", subtype="pdf",
                           filename=os.path.basename(pdf_path))
    return msg


def send_report(pdf_path, log=None):
    """Send the report. Raises a clear error message if something is wrong."""
    password = os.getenv("EMAIL_APP_PASSWORD", "").replace(" ", "")
    if not password:
        raise RuntimeError("EMAIL_APP_PASSWORD is missing in the .env file.")

    msg = build_message(pdf_path, log)
    last_error = None

    # Try port 587 (STARTTLS) first, then port 465 (SSL) in case 587 is blocked
    for port, use_ssl in ((587, False), (465, True)):
        try:
            if use_ssl:
                server = smtplib.SMTP_SSL(SMTP_HOST, port, timeout=30)
            else:
                server = smtplib.SMTP(SMTP_HOST, port, timeout=30)
                server.starttls()
            with server:
                server.login(msg["From"], password)
                server.send_message(msg)
            print(f"[emailer] Sent '{os.path.basename(pdf_path)}' to {msg['To']} (port {port})")
            return
        except smtplib.SMTPAuthenticationError as exc:
            raise RuntimeError(
                "Gmail rejected the login. Check EMAIL_SENDER and use an App Password "
                "(2-Step Verification must be on).") from exc
        except (smtplib.SMTPException, OSError) as exc:
            last_error = exc
            print(f"[emailer] Port {port} failed: {exc}")

    raise RuntimeError(
        f"Could not send the email on ports 587 or 465: {last_error}. "
        "Check your internet connection, VPN, firewall or antivirus (email protection).")


if __name__ == "__main__":
    # Quick test:  python emailer.py outputs/reports/titanic_report.pdf
    import sys

    if len(sys.argv) < 2:
        print("Usage: python emailer.py <path-to-pdf>")
        sys.exit(1)
    send_report(sys.argv[1])
