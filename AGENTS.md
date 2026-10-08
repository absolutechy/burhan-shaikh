# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains a single static portfolio page:

- `portfolio_viewer.html` - complete HTML document with inline CSS and JavaScript.
- No separate `src/`, `tests/`, or asset directories are present yet.

Keep related page sections grouped in the existing order: document metadata and fonts, global styles, section styles, HTML markup, configuration/data objects, then interaction scripts. If the project grows, move reusable CSS, JavaScript, and media into `assets/css/`, `assets/js/`, and `assets/img/`.

## Build, Test, and Development Commands

There is no package manager or build step. Open the page directly in a browser for local development:

```powershell
Start-Process .\portfolio_viewer.html
```

For a local server that better matches browser security behavior, run:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000/portfolio_viewer.html`.

## Coding Style & Naming Conventions

Use plain HTML, CSS, and vanilla JavaScript. Match the existing compact style: two-space indentation in nested blocks, CSS custom properties in `:root`, short utility selectors where already established, and `const`/`let` for JavaScript state. Keep project data in the existing `CONFIG`, `P`, `CASES`, and `GALLERY` objects rather than scattering repeated text through generated markup.

Prefer descriptive section and component class names for new UI (`case-viewer`, `viewer-thumb`) and avoid introducing frameworks unless the repository is intentionally restructured.

## Testing Guidelines

No automated tests are configured. Before submitting changes, manually verify:

- Desktop and mobile responsive layouts.
- Dark and light theme behavior.
- Project filtering, modal viewer, menu toggle, scroll progress, and contact `mailto:` form.
- Browser console has no runtime errors.

When adding JavaScript-heavy behavior, consider adding a small `tests/` or `playwright/` suite and document the command here.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no repository-specific commit convention can be inferred. Use concise imperative commit messages, for example `Update portfolio project viewer` or `Fix mobile navigation layout`.

Pull requests should include a short summary, testing notes, and screenshots or screen recordings for visual changes. Link related issues when available and call out any changes to public contact details, external links, or embedded fonts.

## Security & Configuration Tips

Keep personal details centralized in `CONFIG`. Review any external links, email addresses, and Google Fonts usage before publishing. Do not add secrets, API keys, or private portfolio assets directly to the HTML file.
