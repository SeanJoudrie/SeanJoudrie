"""Build a copy of the prototype for publishing as a claude.ai Artifact.

The Artifact host adds its own <!doctype>, <html>, <head> and <body>, so this
strips them from index.html and writes the page plus its assets to OUT.
index.html itself stays a complete page that opens by double-clicking.

Usage: python3 scripts/build-artifact.py OUT_DIR
"""
import pathlib
import re
import shutil
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)

html = (root / 'index.html').read_text()
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)

# The Artifact supplies charset, viewport and the tab icon.
head = re.sub(r'\s*<meta charset[^>]*>', '', head)
head = re.sub(r'\s*<meta name="viewport"[^>]*>', '', head)
head = re.sub(r'\s*<link rel="icon"[^>]*>', '', head)

(out / 'index.html').write_text(head.strip() + '\n' + body.strip() + '\n')
for name in ['styles.css', 'data.js', 'app.js']:
    shutil.copy(root / name, out / name)
print('Built', out)
