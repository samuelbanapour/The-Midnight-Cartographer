# Landing page — The Midnight Cartographer

A single, self-contained marketing page for the game. No build step, no
dependencies (only Google Fonts over CDN). Built to match the in-game palette
(`#1a0e05` ground, `#d4a017` amber) and fonts (Spectral / Kalam).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page — hero, live countdown to launch, features, tip explainer, FAQ. Inline CSS + JS. |
| `owl.svg` | The amber owl mark (favicon + hero art), matching the app icon. |
| `social-card.svg` | 1200×630 Open Graph / Twitter card. |
| `.nojekyll` | Tells GitHub Pages to serve files verbatim (no Jekyll processing). |

## What it does

- **Live countdown** to **Jun 8, 2026, 8:00 PM PDT** (`2026-06-09T03:00:00Z`).
  When the clock hits zero the countdown swaps to a green "The shop is open"
  badge and the CTA relabels to "Download now" — no redeploy needed.
- The **Get it on the Amazon Appstore** button uses the package deep link
  `https://www.amazon.com/gp/mas/dl/android?p=com.midnightcartographer.game`,
  which resolves to the live listing automatically once the app publishes.

## Deploy with GitHub Pages (free, ~2 minutes)

1. Push this `docs/` folder to the default branch (or merge the feature branch).
2. In the repo on GitHub: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Set **Branch** to your default branch and the folder to **`/docs`**, then
   **Save**.
5. Wait ~1 minute. Your page is live at
   `https://<your-username>.github.io/the-midnight-cartographer/`.

> The deep-link button works from any host, so you can also drop these files on
> Netlify, Vercel, Cloudflare Pages, or itch.io with zero changes.

## Updating after launch

Once Amazon assigns an ASIN, you can optionally swap the button `href` to the
cleaner canonical URL `https://www.amazon.com/dp/<ASIN>` in `index.html`. The
package deep link will keep working either way.

## Social card as PNG (optional)

`social-card.svg` renders the share image. Most platforms (Slack, Discord,
iMessage) read SVG Open Graph images fine; a few (older Facebook/Twitter
crawlers) prefer PNG. To produce a PNG version:

```bash
# with rsvg-convert (librsvg)
rsvg-convert -w 1200 -h 630 docs/social-card.svg -o docs/social-card.png
# …then point og:image / twitter:image in index.html at social-card.png
```
