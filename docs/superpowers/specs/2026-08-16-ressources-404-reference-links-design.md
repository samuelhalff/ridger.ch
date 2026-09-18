# Resources 404 Reference Links Design

## Goal

Replace confirmed 404 Zefix links in every resource locale, including links
embedded in article content and structured references, with the official, live
Zefix search landing page while preserving the article structure and language
coverage.

## Scope

- Update only the three confirmed 404 URL values found in resource article
  content and `Articles[].references`.
- Apply the replacement consistently in `de`, `en`, `es`, `fr`, and `pt`.
- Use the French Zefix landing page already used by the resource corpus:
  `https://zefix.ch/fr/search/entity/welcome`.
- Leave transient 400/502 responses unchanged because they are not confirmed 404s.

## Validation

- Confirm the replacement URL returns HTTP 200.
- Confirm no old 404 URL remains in any locale.
- Run the project lint, test, and production build commands required for content
  changes where the environment supports them.
- Commit the content change and push the current `main` branch to `origin`.
