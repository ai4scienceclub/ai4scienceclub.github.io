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

type ZurichDateTimeParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

type IsoDateParts = {
	year: number;
	month: number;
	day: number;
};

const EVENT_TIME_ZONE = 'Europe/Zurich';
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ISO_DATE_TIME_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?(?:Z|[+-]\d{2}:\d{2})?$/;

const ZURICH_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-CA', {
	timeZone: EVENT_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false,
});

const ZURICH_OFFSET_FORMATTER = new Intl.DateTimeFormat('en-US', {
	timeZone: EVENT_TIME_ZONE,
	timeZoneName: 'shortOffset',
	hour: '2-digit',
	hour12: false,
});

const EVENT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CH', {
	timeZone: EVENT_TIME_ZONE,
	day: '2-digit',
	month: 'short',
	year: 'numeric',
});

const EVENT_TIME_FORMATTER = new Intl.DateTimeFormat('en-CH', {
	timeZone: EVENT_TIME_ZONE,
	hour: '2-digit',
	minute: '2-digit',
});

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-CH', {
	timeZone: EVENT_TIME_ZONE,
	month: 'long',
	year: 'numeric',
});

const eventModules = import.meta.glob('/src/data/events/text/**/*.md', {
	eager: true,
}) as Record<string, EventModule>;
const standaloneNewsModules = import.meta.glob('/src/data/news/*.md', {
	eager: true,
}) as Record<string, StandaloneNewsModule>;

function isValidDate(date: Date) {
	return !Number.isNaN(date.getTime());
}

function padTwo(value: number) {
	return String(value).padStart(2, '0');
}

function utcIsoDate(date: Date) {
	const year = date.getUTCFullYear();
	const month = padTwo(date.getUTCMonth() + 1);
	const day = padTwo(date.getUTCDate());
	return `${year}-${month}-${day}`;
}

function parseIsoDateParts(isoDate: string): IsoDateParts | null {
	const [yearRaw, monthRaw, dayRaw] = isoDate.split('-');
	const year = Number.parseInt(yearRaw ?? '', 10);
	const month = Number.parseInt(monthRaw ?? '', 10);
	const day = Number.parseInt(dayRaw ?? '', 10);
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

	const normalized = new Date(Date.UTC(year, month - 1, day));
	if (
		normalized.getUTCFullYear() !== year ||
		normalized.getUTCMonth() + 1 !== month ||
		normalized.getUTCDate() !== day
	) {
		return null;
	}

	return { year, month, day };
}

function isoDateToUtcDate(isoDate: string) {
	const parts = parseIsoDateParts(isoDate);
	if (!parts) return null;
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function isoDateToUtcNoon(isoDate: string) {
	const parts = parseIsoDateParts(isoDate);
	if (!parts) return null;
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

function addDaysToIsoDate(isoDate: string, dayDelta: number) {
	const date = isoDateToUtcDate(isoDate);
	if (!date) return null;
	date.setUTCDate(date.getUTCDate() + dayDelta);
	return utcIsoDate(date);
}

function parseZurichDateTimeParts(input: string): ZurichDateTimeParts | null {
	const matches = input.match(ISO_DATE_TIME_PATTERN);
	if (!matches) return null;

	const year = Number.parseInt(matches[1] ?? '', 10);
	const month = Number.parseInt(matches[2] ?? '', 10);
	const day = Number.parseInt(matches[3] ?? '', 10);
	const hour = Number.parseInt(matches[4] ?? '0', 10);
	const minute = Number.parseInt(matches[5] ?? '0', 10);
	const second = Number.parseInt(matches[6] ?? '0', 10);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day) ||
		!Number.isInteger(hour) ||
		!Number.isInteger(minute) ||
		!Number.isInteger(second)
	) {
		return null;
	}
	if (month < 1 || month > 12) return null;
	if (day < 1 || day > 31) return null;
	if (hour < 0 || hour > 23) return null;
	if (minute < 0 || minute > 59) return null;
	if (second < 0 || second > 59) return null;

	const normalized = new Date(Date.UTC(year, month - 1, day));
	if (
		normalized.getUTCFullYear() !== year ||
		normalized.getUTCMonth() + 1 !== month ||
		normalized.getUTCDate() !== day
	) {
		return null;
	}

	return {
		year,
		month,
		day,
		hour,
		minute,
		second,
	};
}

function getZurichOffsetMinutes(date: Date) {
	const offsetPart = ZURICH_OFFSET_FORMATTER.formatToParts(date).find(
		(part) => part.type === 'timeZoneName',
	)?.value;
	if (!offsetPart) return null;
	if (offsetPart === 'GMT') return 0;

	const matches = offsetPart.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
	if (!matches) return null;

	const sign = matches[1] === '+' ? 1 : -1;
	const hours = Number.parseInt(matches[2] ?? '0', 10);
	const minutes = Number.parseInt(matches[3] ?? '0', 10);
	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;

	return sign * (hours * 60 + minutes);
}

function getZurichDateTimeParts(date: Date): ZurichDateTimeParts | null {
	const parts = ZURICH_DATE_TIME_FORMATTER.formatToParts(date);
	const valueMap: Partial<ZurichDateTimeParts> = {};

	for (const part of parts) {
		if (
			part.type === 'year' ||
			part.type === 'month' ||
			part.type === 'day' ||
			part.type === 'hour' ||
			part.type === 'minute' ||
			part.type === 'second'
		) {
			const value = Number.parseInt(part.value, 10);
			if (!Number.isInteger(value)) return null;
			valueMap[part.type] = value;
		}
	}

	if (
		typeof valueMap.year !== 'number' ||
		typeof valueMap.month !== 'number' ||
		typeof valueMap.day !== 'number' ||
		typeof valueMap.hour !== 'number' ||
		typeof valueMap.minute !== 'number' ||
		typeof valueMap.second !== 'number'
	) {
		return null;
	}

	return valueMap as ZurichDateTimeParts;
}

function fromZurichLocalDateTime(parts: ZurichDateTimeParts) {
	const targetUtcMs = Date.UTC(
		parts.year,
		parts.month - 1,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second,
	);

	let candidateUtcMs = targetUtcMs;
	for (let index = 0; index < 4; index += 1) {
		const offsetMinutes = getZurichOffsetMinutes(new Date(candidateUtcMs));
		if (offsetMinutes === null) return null;

		const adjustedUtcMs = targetUtcMs - offsetMinutes * 60_000;
		if (adjustedUtcMs === candidateUtcMs) break;
		candidateUtcMs = adjustedUtcMs;
	}

	const resolvedDate = new Date(candidateUtcMs);
	const roundTrip = getZurichDateTimeParts(resolvedDate);
	if (!roundTrip) return null;
	if (
		roundTrip.year !== parts.year ||
		roundTrip.month !== parts.month ||
		roundTrip.day !== parts.day ||
		roundTrip.hour !== parts.hour ||
		roundTrip.minute !== parts.minute ||
		roundTrip.second !== parts.second
	) {
		return null;
	}

	return resolvedDate;
}

function parseAsZurichDateTime(input: string) {
	const parsed = parseZurichDateTimeParts(input.trim());
	if (!parsed) return null;
	return fromZurichLocalDateTime(parsed);
}

function parseDateWithZurichFallback(input: string) {
	return parseAsZurichDateTime(input) ?? new Date(input);
}

function comparableTimestamp(input: string) {
	const parsedDate = parseDateWithZurichFallback(input);
	return isValidDate(parsedDate) ? parsedDate.getTime() : Number.NEGATIVE_INFINITY;
}

function zurichIsoDate(date: Date) {
	const parts = getZurichDateTimeParts(date);
	if (!parts) return utcIsoDate(date);
	return `${parts.year}-${padTwo(parts.month)}-${padTwo(parts.day)}`;
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

	const startDate = parseAsZurichDateTime(module.frontmatter.startsAt);
	const endDate = parseAsZurichDateTime(
		module.frontmatter.endsAt ?? module.frontmatter.startsAt,
	);
	if (!startDate || !endDate) return null;

	const publishedDate = parseDateWithZurichFallback(
		module.frontmatter.publishedAt ?? module.frontmatter.startsAt,
	);
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

	const publishedDate = parseDateWithZurichFallback(module.frontmatter.publishedAt);
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
		let cursorIsoDate = zurichIsoDate(event.startDate);
		const endIsoDate = zurichIsoDate(event.endDate);

		while (cursorIsoDate <= endIsoDate) {
			const key = cursorIsoDate;
			const current = dateMap.get(key) ?? [];
			current.push(event);
			dateMap.set(key, current);
			const nextIsoDate = addDaysToIsoDate(cursorIsoDate, 1);
			if (!nextIsoDate) break;
			cursorIsoDate = nextIsoDate;
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
	const todayIsoDate = zurichIsoDate(new Date());

	return getAllEvents()
		.filter(
			(event) => zurichIsoDate(event.endDate) >= todayIsoDate && event.status !== 'cancelled',
		)
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
		.slice(0, limit);
}

export function getPastEvents(limit?: number) {
	const todayIsoDate = zurichIsoDate(new Date());

	const pastEvents = getAllEvents()
		.filter((event) => zurichIsoDate(event.endDate) < todayIsoDate && event.status !== 'cancelled')
		.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

	return typeof limit === 'number' ? pastEvents.slice(0, limit) : pastEvents;
}

export function getStandaloneNews() {
	return Object.entries(standaloneNewsModules)
		.map(([path, module]) => toStandaloneNews(path, module))
		.filter((item): item is StandaloneNewsItem => item !== null)
		.sort((a, b) => comparableTimestamp(b.publishedAt) - comparableTimestamp(a.publishedAt));
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
		.sort((a, b) => comparableTimestamp(b.publishedAt) - comparableTimestamp(a.publishedAt))
		.slice(0, limit);
}

export function getCalendarMonth(referenceDate = new Date()) {
	const safeReferenceDate = isValidDate(referenceDate) ? referenceDate : new Date();
	const referenceParts = getZurichDateTimeParts(safeReferenceDate);
	const currentYear = referenceParts?.year ?? safeReferenceDate.getUTCFullYear();
	const currentMonth = referenceParts?.month ?? safeReferenceDate.getUTCMonth() + 1;
	const monthStartIsoDate = `${currentYear}-${padTwo(currentMonth)}-01`;
	const monthStart =
		isoDateToUtcDate(monthStartIsoDate) ?? new Date(Date.UTC(currentYear, currentMonth - 1, 1));
	const monthEnd = new Date(Date.UTC(currentYear, currentMonth, 0));
	if (!isValidDate(monthEnd)) {
		return {
			monthLabel: MONTH_LABEL_FORMATTER.format(monthStart),
			weekdayLabels: WEEKDAY_LABELS,
			days: [],
			range: {
				start: monthStart,
				end: monthStart,
			},
		};
	}

	const offsetToMonday = (monthStart.getUTCDay() + 6) % 7;
	const gridStartIsoDate = addDaysToIsoDate(monthStartIsoDate, -offsetToMonday) ?? monthStartIsoDate;

	const days: CalendarDay[] = [];
	const eventMap = getEventsByDate(
		getAllEvents().filter((event) => event.status !== 'cancelled'),
	);
	const todayIsoDate = zurichIsoDate(new Date());

	for (let index = 0; index < 42; index += 1) {
		const isoDate = addDaysToIsoDate(gridStartIsoDate, index);
		const isoDateParts = isoDate ? parseIsoDateParts(isoDate) : null;
		if (!isoDate || !isoDateParts) continue;

		days.push({
			isoDate,
			day: isoDateParts.day,
			inCurrentMonth:
				isoDateParts.month === currentMonth && isoDateParts.year === currentYear,
			isToday: isoDate === todayIsoDate,
			events: eventMap.get(isoDate) ?? [],
		});
	}

	const monthLabelReference = isoDateToUtcNoon(monthStartIsoDate);
	const monthLabel = monthLabelReference
		? MONTH_LABEL_FORMATTER.format(monthLabelReference)
		: MONTH_LABEL_FORMATTER.format(monthStart);

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
	return EVENT_DATE_FORMATTER.format(date);
}

export function formatEventTime(date: Date) {
	return EVENT_TIME_FORMATTER.format(date);
}
