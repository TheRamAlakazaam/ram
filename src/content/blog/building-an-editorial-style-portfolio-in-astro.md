---
title: Building An Editorial-Style Portfolio In Astro
description: Separating photography, essays, dev logs, and notes without making the site feel fragmented.
publishDate: 2026-03-10
tags:
  - astro
  - architecture
  - design
featured: true
---

The trick with a portfolio like this is not the homepage. It is the publishing
model behind it.

Photography wants a different frame than a dev note. Long-form essays need a
different tone than a quick list. The site works better when those formats are
separate in the file system, but still connected through navigation, design,
and internal links.

Astro is a good fit because the content model stays simple. Each collection has
its own schema, each route can be prerendered, and the site remains easy to
deploy anywhere that can host static files.
