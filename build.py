#!/usr/bin/env python3
"""
Spooner Labs — static site builder
Reads data from data/*.yaml, renders Jinja2 templates, writes to dist/
Usage: python build.py
"""

import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
TEMPLATES_DIR = ROOT / "templates"
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"


def load_yaml(filename):
    path = DATA_DIR / filename
    with open(path) as f:
        return yaml.safe_load(f) or {}


def build():
    # ── Load data ────────────────────────────────────────────
    site = load_yaml("site.yaml")
    experiments = load_yaml("experiments.yaml") or []
    projects = load_yaml("projects.yaml") or []
    speaking = load_yaml("speaking.yaml")

    # ── Jinja2 env ───────────────────────────────────────────
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html"]),
    )

    # ── Prepare dist/ ────────────────────────────────────────
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir()

    # ── Copy static assets ───────────────────────────────────
    shutil.copy(ROOT / "site.css", DIST_DIR / "site.css")
    shutil.copy(ROOT / "logo.svg", DIST_DIR / "logo.svg")

    # Copy any other static assets if present
    for pattern in ("*.png", "*.jpg", "*.jpeg", "*.webp", "*.ico", "*.xml", "robots.txt", "sitemap.xml"):
        for f in ROOT.glob(pattern):
            shutil.copy(f, DIST_DIR / f.name)

    # ── Template context helpers ─────────────────────────────
    def ctx(**kwargs):
        """Merge site config + asset paths into every template context."""
        base = {
            "site": {
                **site,
                "css_path": "/site.css",
                "logo_path": "/logo.svg",
            },
            "experiments": experiments,
            "projects": projects,
            "speaking": speaking,
        }
        base.update(kwargs)
        return base

    # ── Render pages ─────────────────────────────────────────
    pages = [
        # (template,            output_path,                       extra_ctx)
        ("index.html",          "index.html",                      {}),
        ("about.html",          "about.html",                      {"active_page": "about"}),
        ("contact.html",        "contact.html",                    {}),
        ("speaking.html",       "speaking.html",                   {"active_page": "speaking"}),
        ("experiments.html",    "experiments/index.html",          {"active_page": "experiments"}),
        ("projects.html",       "projects/index.html",             {"active_page": "projects"}),
    ]

    for template_name, output_path, extra in pages:
        tmpl = env.get_template(template_name)
        html = tmpl.render(ctx(**extra))

        out = DIST_DIR / output_path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        print(f"  built  {output_path}")

    print(f"\nDone — {len(pages)} pages written to dist/")


if __name__ == "__main__":
    try:
        build()
    except Exception as e:
        print(f"Build failed: {e}", file=sys.stderr)
        sys.exit(1)
