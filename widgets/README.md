# QSO Widget

This repository includes a tiny embeddable widget to display small table-like stats from a JSON data source (for example `qso.json`).

How it works
- Place a container element where you want the table to appear:

  <div class="qso-widget" data-src="https://kjsnw.github.io/qso-arc-map/qso.json"></div>

- Include the widget script served from your GitHub Pages site:

  <script src="https://kjsnw.github.io/qso-arc-map/widgets/widget.js"></script>

Hosting notes
- GitHub Pages can serve these files; either:
  - Move `widgets/` into a `docs/` folder and enable Pages from the `main` branch `/docs` folder, or
  - Enable Pages on the repository root (or a `gh-pages` branch) so `https://kjsnw.github.io/qso-arc-map/widgets/widget.js` is reachable.

Embedding on external sites (QRZ)
- The simplest approach is embedding using the `<div class="qso-widget">` + `<script>` loader above (no iframe). This requires the host page to allow external scripts.
- If QRZ does not permit external scripts, use an `<iframe>` that points to a small HTML page hosted on your Pages site. Example:

  <iframe src="https://kjsnw.github.io/qso-arc-map/widgets/embed.html" width="320" height="120" style="border:0;" loading="lazy"></iframe>

- The iframe-hosted page runs the widget script inside the iframe and, by default, fetches `../qso.json`. Adjust the path or sizing as needed.

Horizontal widget
- For a horizontal, full-width stat bar (good to place under or above your map), use the `data-layout="horizontal"` attribute. If embedding via iframe, point to `embed-horizontal.html`:

  <iframe src="https://kjsnw.github.io/qso-arc-map/widgets/base-stats.html" width="800" height="72" style="border:0;" loading="lazy"></iframe>

The horizontal widget shows: `QSOs` (count), `Longest (mi)` (rounded), and `Longest Call` (call sign).

Security and CORS
- Ensure your GitHub Pages site is public so QRZ visitors can fetch the JSON and the widget script. The browser will enforce CORS; serving both JSON and the widget from the same GitHub Pages origin avoids most issues.

Next steps
- I can: move `widgets/` into `docs/` to make it Pages-ready, update `embed-example.html` to a real hosted path, or build a variant that inlines CSS for different sizing. Which would you like?
