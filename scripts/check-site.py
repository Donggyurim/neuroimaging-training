"""Check generated local links, assets, and HTML anchors without network calls."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self, content):
        super().__init__()
        self.links = []
        self.ids = set()
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        self.links.extend(attrs[key] for key in ("href", "src") if key in attrs)


def main():
    root = Path(__file__).resolve().parent.parent / "_site"
    pages = {path: Page(path.read_text()) for path in root.rglob("*.html")}
    if not pages:
        raise SystemExit("No rendered pages found. Run quarto render first.")
    errors = []
    for path, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            local = unquote(url.path)
            target = ((root / local.lstrip("/")) if local.startswith("/")
                      else (path.parent / local) if local else path).resolve()
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to(root):
                reason = "path outside the rendered site"
            elif not target.exists():
                reason = "missing file"
            elif (url.fragment and target in pages
                  and unquote(url.fragment) not in pages[target].ids):
                reason = "missing anchor"
            else:
                continue
            errors.append(f"{path.relative_to(root)}: {link} ({reason})")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"PASS: local links, assets, and anchors across {len(pages)} HTML pages")


if __name__ == "__main__":
    main()
