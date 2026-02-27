# Content Management Guide

This repo now supports three separate workflows:

1. Upcoming events
2. Past events (also shown in News)
3. Standalone news (not tied to a past event)

## 1) Add an upcoming event

Create:

- `src/data/events/text/<series-slug>/<event-slug>.md`

Recommended slug format:

- `<event-slug>`: `YYYY-MM-DD-short-name`

Frontmatter template:

```md
---
title: "Your event title"
series: "Series name"
startsAt: "2026-06-11T18:00:00+01:00"
endsAt: "2026-06-11T20:00:00+01:00"
location: "Venue, Zurich"
summary: "Short summary for cards"
articleTitle: "Optional article title"
articleExcerpt: "Optional article excerpt"
publishedAt: "2026-05-20"
registrationUrl: "https://..."
coverImage: "/assets/events/photos/<series-slug>/<event-slug>/cover.jpg"
coverAlt: "Short image description"
tags:
  - Workshop
status: upcoming
---

Event/article text here.
```

Photos:

- `public/assets/events/photos/<series-slug>/<event-slug>/`

## 2) Add a past event (included in News)

Use the same event path:

- `src/data/events/text/<series-slug>/<event-slug>.md`

Set:

- `status: past`
- Keep `showInNews` as default (`true`) or set explicitly:
  - `showInNews: true`

This event will appear in:

- Past events list (`/our-events/past`)
- Latest news (`/news` and home news feed)

## 3) Add standalone news (not a past event)

Create:

- `src/data/news/<news-slug>.md`

Template:

```md
---
title: "Your news title"
excerpt: "Short summary for the news feed"
publishedAt: "2026-06-01"
coverImage: "/assets/images/brand/ai4science-banner-dark.svg"
coverAlt: "Optional image description"
---

News content here.
```

Route generated automatically:

- `/news/updates/<news-slug>`

## Notes

- Upcoming events do not appear in the News feed.
- Past events appear in News by default.
- If needed, hide a past event from News with:
  - `showInNews: false`
