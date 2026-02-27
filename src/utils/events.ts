type EventStatus = 'upcoming' | 'past' | 'cancelled';

type EventFrontmatter = {
	title: string;
	series: string;
	startsAt: string;
	endsAt?: string;
	location: string;
	summary: string;
	articleTitle?: string;
	articleExcerpt?: string;
	publishedAt?: string;
	registrationUrl?: string;
	coverImage?: string;
	coverAlt?: string;
	tags?: string[];
	status?: EventStatus;
	showInNews?: boolean;
};

type EventModule = {
	frontmatter: EventFrontmatter;
	default: unknown;
};

type StandaloneNewsFrontmatter = {
	title: string;
	excerpt: string;
	publishedAt: string;
	coverImage?: string;
	coverAlt?: string;
};

type StandaloneNewsModule = {
	frontmatter: StandaloneNewsFrontmatter;
	default: unknown;
};

export type EventItem = {
	title: string;
	slug: string;
	series: string;
	seriesSlug: string;
	startsAt: string;
	endsAt?: string;
	location: string;
	summary: string;
	articleTitle: string;
	articleExcerpt: string;
	articleUrl: string;
	publishedAt: string;
	registrationUrl?: string;
	coverImage?: string;
	coverAlt: string;
	tags: string[];
	status: EventStatus;
	showInNews: boolean;
	startDate: Date;
	endDate: Date;
	Content: unknown;
};

export type StandaloneNewsItem = {
	slug: string;
	title: string;
	excerpt: string;
	publishedAt: string;
	url: string;
	coverImage?: string;
	coverAlt?: string;
	Content: unknown;
};

export type NewsItem = {
	title: string;
	excerpt: string;
	publishedAt: string;
	url: string;
	source: 'event' | 'standalone';
};

export type CalendarDay = {
	isoDate: string;
	day: number;
	inCurrentMonth: boolean;
	isToday: boolean;
	events: EventItem[];
};

export type CalendarMonth = {
	monthLabel: string;
	weekdayLabels: string[];
	days: CalendarDay[];
	range: {
		start: Date;
		end: Date;
	};
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const eventModules = import.meta.glob('/src/data/events/text/**/*.md', {
	eager: true,
}) as Record<string, EventModule>;
const standaloneNewsModules = import.meta.glob('/src/data/news/*.md', {
	eager: true,
}) as Record<string, StandaloneNewsModule>;

function isValidDate(date: Date) {
	return !Number.isNaN(date.getTime());
}

function localIsoDate(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function parsePath(path: string) {
	const matches = path.match(/\/text\/([^/]+)\/([^/]+)\.md$/);
	if (!matches) return null;
	return {
		seriesSlug: matches[1],
		slug: matches[2],
	};
}

function parseStandaloneNewsPath(path: string) {
	const matches = path.match(/\/news\/([^/]+)\.md$/);
	if (!matches) return null;
	return {
		slug: matches[1],
	};
}

function normalizeStatus(frontmatterStatus: EventStatus | undefined, endDate: Date) {
	if (frontmatterStatus) return frontmatterStatus;
	return endDate.getTime() < Date.now() ? 'past' : 'upcoming';
}

function toEvent(path: string, module: EventModule): EventItem | null {
	const parsed = parsePath(path);
	if (!parsed) return null;

	const startDate = new Date(module.frontmatter.startsAt);
	const endDate = new Date(module.frontmatter.endsAt ?? module.frontmatter.startsAt);
	if (!isValidDate(startDate) || !isValidDate(endDate)) return null;

	const publishedDate = new Date(module.frontmatter.publishedAt ?? module.frontmatter.startsAt);
	const publishedAt = isValidDate(publishedDate)
		? module.frontmatter.publishedAt ?? module.frontmatter.startsAt
		: module.frontmatter.startsAt;

	return {
		title: module.frontmatter.title,
		slug: parsed.slug,
		series: module.frontmatter.series,
		seriesSlug: parsed.seriesSlug,
		startsAt: module.frontmatter.startsAt,
		endsAt: module.frontmatter.endsAt,
		location: module.frontmatter.location,
		summary: module.frontmatter.summary,
		articleTitle: module.frontmatter.articleTitle ?? module.frontmatter.title,
		articleExcerpt: module.frontmatter.articleExcerpt ?? module.frontmatter.summary,
		articleUrl: `/news/${parsed.seriesSlug}/${parsed.slug}`,
		publishedAt,
		registrationUrl: module.frontmatter.registrationUrl,
		coverImage: module.frontmatter.coverImage,
		coverAlt:
			module.frontmatter.coverAlt ??
			`Visual for ${module.frontmatter.title} from AI4Science Club Zurich`,
		tags: module.frontmatter.tags ?? [],
		status: normalizeStatus(module.frontmatter.status, endDate),
		showInNews: module.frontmatter.showInNews ?? true,
		startDate,
		endDate,
		Content: module.default,
	};
}

function toStandaloneNews(
	path: string,
	module: StandaloneNewsModule,
): StandaloneNewsItem | null {
	const parsed = parseStandaloneNewsPath(path);
	if (!parsed) return null;

	const publishedDate = new Date(module.frontmatter.publishedAt);
	if (!isValidDate(publishedDate)) return null;

	return {
		slug: parsed.slug,
		title: module.frontmatter.title,
		excerpt: module.frontmatter.excerpt,
		publishedAt: module.frontmatter.publishedAt,
		url: `/news/updates/${parsed.slug}`,
		coverImage: module.frontmatter.coverImage,
		coverAlt: module.frontmatter.coverAlt,
		Content: module.default,
	};
}

function getEventsByDate(events: EventItem[]) {
	const dateMap = new Map<string, EventItem[]>();
	for (const event of events) {
		const cursor = new Date(event.startDate);
		const end = new Date(event.endDate);
		cursor.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);

		while (cursor.getTime() <= end.getTime()) {
			const key = localIsoDate(cursor);
			const current = dateMap.get(key) ?? [];
			current.push(event);
			dateMap.set(key, current);
			cursor.setDate(cursor.getDate() + 1);
		}
	}
	return dateMap;
}

export function getAllEvents() {
	const events = Object.entries(eventModules)
		.map(([path, module]) => toEvent(path, module))
		.filter((event): event is EventItem => event !== null)
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

	return events;
}

export function getEventBySeriesAndSlug(seriesSlug: string, slug: string) {
	return getAllEvents().find(
		(event) => event.seriesSlug === seriesSlug && event.slug === slug,
	);
}

export function getUpcomingEvents(limit = 6) {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	return getAllEvents()
		.filter((event) => event.endDate.getTime() >= now.getTime() && event.status !== 'cancelled')
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
		.slice(0, limit);
}

export function getPastEvents(limit?: number) {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const pastEvents = getAllEvents()
		.filter((event) => event.endDate.getTime() < now.getTime() && event.status !== 'cancelled')
		.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

	return typeof limit === 'number' ? pastEvents.slice(0, limit) : pastEvents;
}

export function getStandaloneNews() {
	return Object.entries(standaloneNewsModules)
		.map(([path, module]) => toStandaloneNews(path, module))
		.filter((item): item is StandaloneNewsItem => item !== null)
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getStandaloneNewsBySlug(slug: string) {
	return getStandaloneNews().find((item) => item.slug === slug);
}

export function getLatestNews(limit = 6) {
	const pastEventNews: NewsItem[] = getPastEvents()
		.filter((event) => event.showInNews)
		.map((event) => ({
			title: event.articleTitle,
			excerpt: event.articleExcerpt,
			publishedAt: event.publishedAt,
			url: event.articleUrl,
			source: 'event',
		}));

	const standaloneNews: NewsItem[] = getStandaloneNews().map((item) => ({
		title: item.title,
		excerpt: item.excerpt,
		publishedAt: item.publishedAt,
		url: item.url,
		source: 'standalone',
	}));

	return [...pastEventNews, ...standaloneNews]
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
		.slice(0, limit);
}

export function getCalendarMonth(referenceDate = new Date()) {
	const currentYear = referenceDate.getFullYear();
	const currentMonth = referenceDate.getMonth();
	const monthStart = new Date(currentYear, currentMonth, 1);
	const monthEnd = new Date(currentYear, currentMonth + 1, 0);

	const offsetToMonday = (monthStart.getDay() + 6) % 7;
	const gridStart = new Date(monthStart);
	gridStart.setDate(monthStart.getDate() - offsetToMonday);

	const days: CalendarDay[] = [];
	const eventMap = getEventsByDate(
		getAllEvents().filter((event) => event.status !== 'cancelled'),
	);
	const todayIso = localIsoDate(new Date());

	for (let index = 0; index < 42; index += 1) {
		const date = new Date(gridStart);
		date.setDate(gridStart.getDate() + index);
		const isoDate = localIsoDate(date);

		days.push({
			isoDate,
			day: date.getDate(),
			inCurrentMonth:
				date.getMonth() === monthStart.getMonth() &&
				date.getFullYear() === monthStart.getFullYear(),
			isToday: isoDate === todayIso,
			events: eventMap.get(isoDate) ?? [],
		});
	}

	const monthLabel = new Intl.DateTimeFormat('en-CH', {
		month: 'long',
		year: 'numeric',
	}).format(monthStart);

	return {
		monthLabel,
		weekdayLabels: WEEKDAY_LABELS,
		days,
		range: {
			start: monthStart,
			end: monthEnd,
		},
	};
}

export function formatEventDate(date: Date) {
	return new Intl.DateTimeFormat('en-CH', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(date);
}

export function formatEventTime(date: Date) {
	return new Intl.DateTimeFormat('en-CH', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}
