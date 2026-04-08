# Portfolio Site

An Astro portfolio and publishing site with:

- photography
- one combined writing feed for blog posts, dev notes, and lists

## Content Structure

Add or edit content in these folders:

- `src/content/blog` for writing, dev notes, lists, and other small posts
- `src/content/photos`

Use tags in frontmatter to describe what kind of writing it is.

## Important Files

- `.pages.yml`: Pages CMS configuration for site settings, writing, photos, and image uploads
- `src/data/profile.json`: editable site settings, project links, and selected CV entries
- `src/data/site.ts`: route navigation and typed site settings bridge
- `src/layouts/Layout.astro`: global SEO and design shell
- `src/content.config.ts`: content collection schemas
- `src/pages/index.astro`: homepage

## Images

Pages CMS uploads images to `src/assets/images`. Use image paths like
`/src/assets/images/photos/example.jpg` in photo frontmatter so
`src/components/OptimizedImage.astro` can pass them through Astro's image
pipeline.

## Contact Form

The contact form is built for Cloudflare Pages Functions. It posts to
`/api/contact`, verifies Cloudflare Turnstile server-side, and sends email
through Resend.

Set these variables in Cloudflare Pages:

- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `CONTACT_SUBJECT_PREFIX`

Use `.env.example` for Astro build variables and copy `.dev.vars.example` to
`.dev.vars` for local Pages Functions testing. Do not commit `.dev.vars`.

## Cloudflare Pages

Cloudflare Pages build settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`
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
