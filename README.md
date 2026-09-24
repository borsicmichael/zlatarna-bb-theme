# Zlatarna BB – Shopify theme

A Shopify Online Store 2.0 theme for [zlatarna-bb.si](https://zlatarna-bb.si). It matches the Zlatarna BB design boards (desktop homepage, mobile homepage, product page).

## Install

- **Upload as a ZIP:** Online Store → Themes → Add theme → Upload zip file.
- **Connect to GitHub:** Online Store → Themes → Add theme → Connect from GitHub. Pick this repo and the `main` branch. Shopify then syncs every push, and edits made in the theme editor are committed back to the repo.

## Set up after install

1. **Menus**
   - The header uses `main-menu`.
   - In the footer, pick the *Nakit*, *Pomoč* and *Pravno* menus. You can also pick an extra, shorter menu that replaces them on mobile.
2. **Collections:** in both *Zavihki z izdelki* sections on the homepage, choose a collection for each tab. Until you do, the tabs show placeholder panels named from the "Imena za predogled" field.
3. **Chains:** add a product option (for example "Debelina verižice") with one variant per thickness. The price is set per variant.
4. **Subtitle under the product title:** create a product metafield `custom.subtitle` (single-line text).
5. **Images:** upload photos for the two image bands and the two ring tiles.

## Structure

| Folder | Contents |
| --- | --- |
| `layout/` | `theme.liquid`, `password.liquid` |
| `sections/` | Homepage sections, header/footer groups, and the product, collection, cart, search, blog and page sections |
| `snippets/` | Logo (built-in SVG), icons, product panel/card, section spacing |
| `assets/` | `base.css`, `theme.js`, hero video + poster, feature illustrations |
| `templates/` | JSON templates, plus `gift_card.liquid` |
| `locales/` | `sl.default.json`, `en.json` |

## Fonts

The theme loads Playfair Display (headings and body), Manrope (tabs, labels, product details) and Montserrat (logo wordmark) from Google Fonts.
