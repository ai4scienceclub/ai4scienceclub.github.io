import type { EventItem } from './events';

const CRLF = '\r\n';
const PRODID = '-//AI4Science Club Zurich//Events//EN';
const CALENDAR_NAME = 'AI4Science Club Zurich';

function escapeText(value: string) {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\r?\n/g, '\\n')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;');
}

function formatUtc(date: Date) {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function foldLine(line: string) {
	if (line.length <= 75) return line;
	let result = line.slice(0, 75);
	let rest = line.slice(75);
	while (rest.length > 74) {
		result += `${CRLF} ${rest.slice(0, 74)}`;
		rest = rest.slice(74);
	}
	if (rest.length) result += `${CRLF} ${rest}`;
	return result;
}

function eventToVEventLines(event: EventItem, site: URL): string[] {
	const uid = `${event.seriesSlug}-${event.slug}@ai4science.ch`;
	const articleUrl = new URL(event.articleUrl, site).toString();
	const descriptionParts = [event.summary];
	const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(event.startsAt);
	if (dateOnly) descriptionParts.push('Time to be announced; this is a full-day calendar placeholder.');
	if (event.registrationUrl) descriptionParts.push(`Register: ${event.registrationUrl}`);
	descriptionParts.push(`More info: ${articleUrl}`);
	const description = descriptionParts.join('\n');
	let dateLines = [
		`DTSTART:${formatUtc(event.startDate)}`,
		`DTEND:${formatUtc(event.endDate)}`,
	];
	if (dateOnly) {
		const end = new Date(`${(event.endsAt ?? event.startsAt).slice(0, 10)}T00:00:00Z`);
		end.setUTCDate(end.getUTCDate() + 1);
		dateLines = [
			`DTSTART;VALUE=DATE:${event.startsAt.replace(/-/g, '')}`,
			`DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, '')}`,
			'TRANSP:TRANSPARENT',
		];
	}

	return [
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${formatUtc(event.startDate)}`,
		...dateLines,
		`SUMMARY:${escapeText(event.title)}`,
		`DESCRIPTION:${escapeText(description)}`,
		`LOCATION:${escapeText(event.location)}`,
		`URL:${articleUrl}`,
		'END:VEVENT',
	];
}

export function buildIcsCalendar(events: EventItem[], site: URL) {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${PRODID}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(CALENDAR_NAME)}`,
		'X-WR-TIMEZONE:Europe/Zurich',
		...events.flatMap((event) => eventToVEventLines(event, site)),
		'END:VCALENDAR',
	];
	return lines.map(foldLine).join(CRLF) + CRLF;
}
