import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// Wrap handler to add detailed error logging
async function authHandler(request: Request) {
  const url = new URL(request.url);
  console.info('[NextAuth] Handler called:', {
    method: request.method,
    pathname: url.pathname,
    search: url.search.slice(0, 200),
  });

  try {
    const response = await handler(request);
    console.info('[NextAuth] Handler response status:', response.status);
    return response;
  } catch (error) {
    console.error('[NextAuth] Handler error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
    });
    throw error;
  }
}

export { authHandler as GET, authHandler as POST };
