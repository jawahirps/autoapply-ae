import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import Optional


def extract_email_from_description(description: str) -> Optional[str]:
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(pattern, description or "")
    return matches[0] if matches else None


def generate_cover_letter(resume: dict, job: dict) -> str:
    name = resume.get("name") or "Applicant"
    title = job.get("title") or "the position"
    company = job.get("company") or "your company"
    skills = ", ".join((resume.get("skills") or [])[:5])

    return f"""Dear Hiring Manager,

I am writing to express my strong interest in the {title} position at {company}.
With my background in {skills}, I am confident in my ability to contribute effectively to your team.

Throughout my career, I have developed expertise in the areas most relevant to this role.
I am particularly drawn to this opportunity because it aligns with my professional goals
and allows me to bring my skills in {skills} to a dynamic team.

I have attached my resume for your review and would welcome the opportunity to discuss
how my experience can benefit {company}. I am available for an interview at your earliest convenience.

Thank you for your time and consideration.

Warm regards,
{name}
"""


def send_email_application(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    to_email: str,
    resume: dict,
    job: dict,
    resume_file_path: str,
    cover_letter: Optional[str] = None,
) -> bool:
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Subject"] = f"Application for {job.get('title', 'Open Position')} – {resume.get('name', '')}"

        body = cover_letter or generate_cover_letter(resume, job)
        msg.attach(MIMEText(body, "plain"))

        # Attach resume
        if resume_file_path and Path(resume_file_path).exists():
            with open(resume_file_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            filename = Path(resume_file_path).name
            part.add_header("Content-Disposition", f"attachment; filename={filename}")
            msg.attach(part)

        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email failed: {e}")
        return False
