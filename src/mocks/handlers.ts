import { http, HttpResponse, delay } from 'msw';

const existingUsernames = ['admin', 'user', 'test', 'john', 'jane'];

const cities = [
  'Tokyo',
  'Toronto',
  'Taipei',
  'Tallinn',
  'Tampa',
  'Osaka',
  'Oslo',
  'Ottawa',
  'Oxford',
  'Paris',
  'Prague',
  'Portland',
  'Perth',
  'Berlin',
  'Barcelona',
  'Bangkok',
  'Boston',
  'Budapest',
];

export const handlers = [
  http.get('/api/check-username', async ({ request }) => {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    await delay(500);

    if (!username) {
      return HttpResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const taken = existingUsernames.includes(username.toLowerCase());
    return HttpResponse.json({ taken });
  }),

  http.get('/api/cities', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    await delay(200);

    if (q.length < 2) {
      return HttpResponse.json([]);
    }

    const results = cities.filter((c) => c.toLowerCase().startsWith(q.toLowerCase()));
    return HttpResponse.json(results);
  }),
];
