import type { APIRoute } from 'astro';
import { getAllEvents, getEventBySeriesAndSlug } from '../../../utils/events';
import { buildIcsCalendar } from '../../../utils/ics';

export function getStaticPaths() {
	return getAllEvents()
		.filter((event) => event.status !== 'cancelled')
		.map((event) => ({
			params: { series: event.seriesSlug, slug: event.slug },
		}));
}

export const GET: APIRoute = ({ params, site }) => {
	const event = getEventBySeriesAndSlug(params.series ?? '', params.slug ?? '');
	if (!event) return new Response('Not found', { status: 404 });
	const baseUrl = site ?? new URL('http://localhost:4321/');
	return new Response(buildIcsCalendar([event], baseUrl), {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
		},
	});
};
