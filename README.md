# Portfolio Site

An Astro portfolio and publishing site with:

- photography
- one combined writing feed for blog posts, dev notes, and lists

## Content Structure

Add or edit content in these folders:

- `src/content/blog` for blog posts, dev notes, lists, and other small posts
- `src/content/photos`

Use tags in frontmatter to describe what kind of entry it is. Keep titles,
descriptions, dates, locations, and image alt text filled in; the content
schemas now reject blank required fields so CMS mistakes fail early.

## Important Files

- `.pages.yml`: Pages CMS configuration for site settings, writing, photos, and image uploads
- `src/data/profile.json`: editable site settings, project links, and selected CV entries
- `src/data/pages.json`: editable navigation and page copy used by Pages CMS
- `src/data/site.ts`: route navigation and typed site settings bridge
- `src/layouts/Layout.astro`: global SEO and design shell
- `src/content.config.ts`: content collection schemas
- `src/pages/index.astro`: homepage

## Images

Pages CMS uploads images to `src/assets/images`. Use image paths like
`/src/assets/images/photos/example.jpg` in photo frontmatter so
`src/components/OptimizedImage.astro` can pass them through Astro's image
pipeline.

For larger photo batches, resize and dedupe exports locally before opening
Pages CMS. This keeps the CMS media browser responsive and avoids one commit per
full-size camera export:

```bash
npm run images:prep -- ~/Pictures/exports --album new-york-city-in-not-film
```

The command writes WebP files to `src/assets/images/photos/<album>`, limits the
long edge to 1800px, skips exact duplicates, and prints ready-to-paste gallery
paths. Use `--max 1600 --quality 72` for smaller CMS previews, or
`--dry-run` to preview the work without writing files.

## Photography Albums

Photography entries are album-first. Each item in `src/content/photos` can
include:

- one `coverImage`
- optional `coverAlt`
- a `gallery` array for the full collection
- optional body copy for notes, context, or captions

The `/photography` page lists albums, and each album page renders the gallery.

## Contact Form

The contact form posts directly to Web3Forms from the browser.

The current access key is wired into the contact page, and you can override it
at build time with:

- `PUBLIC_WEB3FORMS_ACCESS_KEY`

Use `.env.example` for Astro build variables. No Cloudflare Pages Function
secrets are required for the current contact setup.

## Cloudflare Pages

Cloudflare Pages build settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: not required for the current site
- Package manager: npm, using `package-lock.json`

Local Cloudflare preview:

```bash
npm run cf:dev
```

Deploy with Wrangler:

```bash
npm run cf:deploy
```

## Local Commands

```bash
npm run dev
npm run build
npm run type-check
```

## SEO Notes

- Set `SITE_URL=https://theramalakazaam.com` in your environment before deploying.
- Set `APP_ENV=production` when you want the site indexed.
- The site already includes canonical tags, structured data, a sitemap, and robots handling.
- Photo pages use their cover image for social previews when one is available.
- Optional CMS fields can be left blank; blank optional dates and image fields are normalized during content validation.
