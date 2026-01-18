import { http, HttpResponse, delay } from 'msw';

const existingUsernames = ['admin', 'user', 'test', 'john', 'jane'];

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
];
