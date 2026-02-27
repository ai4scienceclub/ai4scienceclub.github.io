# AI4Science Events Content

This folder powers the homepage calendar, upcoming events, and event-backed news.

## Structure

- `text/<series-slug>/<event-slug>.md`: event text and metadata (source of truth)
- `public/assets/events/photos/<series-slug>/<event-slug>/`: event photos

Standalone (non-event) news items live in:

- `src/data/news/<news-slug>.md`

## Naming Convention

- `series-slug`: lowercase, kebab-case (example: `foundation-talks`)
- `event-slug`: include date for easy sorting (example: `2026-03-18-kickoff-symposium`)

## Required Frontmatter Fields

- `title`
- `series`
- `startsAt` (ISO datetime with timezone, example: `2026-03-18T18:00:00+01:00`)
- `location`
- `summary`

## Optional Frontmatter Fields

- `endsAt`
- `articleTitle`
- `articleExcerpt`
- `publishedAt`
- `registrationUrl`
- `coverImage`
- `coverAlt`
- `tags` (array)
- `status` (`upcoming`, `past`, or `cancelled`)

## Photos

Store event photos inside the matching photo directory.

Example:

- text: `src/data/events/text/foundation-talks/2026-03-18-kickoff-symposium.md`
- photos: `public/assets/events/photos/foundation-talks/2026-03-18-kickoff-symposium/`
