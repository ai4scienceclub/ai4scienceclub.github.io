import type { APIRoute } from 'astro';
import { getAllEvents } from '../utils/events';
import { buildIcsCalendar } from '../utils/ics';

export const GET: APIRoute = ({ site }) => {
	const events = getAllEvents().filter((event) => event.status !== 'cancelled');
	const baseUrl = site ?? new URL('http://localhost:4321/');
	return new Response(buildIcsCalendar(events, baseUrl), {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'inline; filename="ai4science-events.ics"',
		},
	});
};
