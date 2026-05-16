export const config = {
  matcher: '/(.*)',
};

export default function middleware(request: Request): Response | undefined {
  const user = process.env.BASIC_AUTH_USER ?? '';
  const pass = process.env.BASIC_AUTH_PASS ?? '';

  if (!user || !pass) return undefined;

  const expected = `Basic ${btoa(`${user}:${pass}`)}`;
  const header = request.headers.get('authorization');

  if (header === expected) return undefined;

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="chriseldred.co.uk preview"',
      'Cache-Control': 'no-store',
    },
  });
}
