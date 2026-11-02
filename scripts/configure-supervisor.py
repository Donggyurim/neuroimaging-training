"""Add only the private workspace's public URL to the static sign-in entry."""
import argparse
import html
import os
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit


def validate_url(value):
    if not value or not value.strip():
        return None
    value = value.strip()
    url = urlsplit(value)
    if (url.scheme != "https" or not url.hostname or url.username or url.password
            or url.query or url.fragment or url.path not in ("", "/", "/review")
            or any(char.isspace() for char in value)):
        raise ValueError("SUPERVISOR_URL must be an HTTPS workspace URL, without credentials, query, or fragment")
    try:
        host = url.hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as error:
        raise ValueError("SUPERVISOR_URL has an invalid hostname") from error
    if len(host) > 253 or "." not in host or not all(
            re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", label)
            for label in host.split(".")):
        raise ValueError("SUPERVISOR_URL must have a valid public hostname")
    try:
        if url.port not in (None, 443):
            raise ValueError("SUPERVISOR_URL must use the standard HTTPS port")
    except ValueError as error:
        raise ValueError("SUPERVISOR_URL has an invalid HTTPS port") from error
    return urlunsplit(("https", host, url.path or "/", "", ""))


def configure(site_dir, value):
    url = validate_url(value)
    path = Path(site_dir) / "supervisor.html"
    content = path.read_text()
    if url:
        entry = ('<div id="supervisor-entry"><a class="action-link primary-action" '
                 f'href="{html.escape(url, quote=True)}" rel="noopener noreferrer">'
                 'Supervisor sign-in <i class="bi bi-arrow-right" aria-hidden="true"></i></a></div>')
    else:
        entry = '<div id="supervisor-entry"><p class="small-note">Sign-in setup pending.</p></div>'
    content, count = re.subn(r'<div id="supervisor-entry">.*?</div>', lambda match: entry, content, flags=re.S)
    if count != 1:
        raise ValueError("Expected exactly one supervisor sign-in entry")
    path.write_text(content)
    return bool(url)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-dir", type=Path, default=Path(__file__).resolve().parent.parent / "_site")
    args = parser.parse_args()
    enabled = configure(args.site_dir, os.environ.get("SUPERVISOR_URL"))
    print("Supervisor sign-in URL configured" if enabled else "Supervisor entry stays locked: no workspace URL configured")
