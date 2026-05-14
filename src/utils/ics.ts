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
	if (event.registrationUrl) descriptionParts.push(`Register: ${event.registrationUrl}`);
	descriptionParts.push(`More info: ${articleUrl}`);
	const description = descriptionParts.join('\n');

	return [
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${formatUtc(event.startDate)}`,
		`DTSTART:${formatUtc(event.startDate)}`,
		`DTEND:${formatUtc(event.endDate)}`,
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
