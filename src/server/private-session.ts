import type { NextRequest, NextResponse } from 'next/server';

export const PRIVATE_COOKIE = 'hts_private';
const COOKIE_PATH = '/api/writing/private';

export function privateTokenFrom(request: NextRequest): string | null {
  return request.cookies.get(PRIVATE_COOKIE)?.value ?? null;
}

/** Session cookie only: it is not kept after the browser closes. */
export function setPrivateCookie(
  request: NextRequest,
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(PRIVATE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: COOKIE_PATH,
  });
  return response;
}

export function clearPrivateCookie(response: NextResponse): NextResponse {
  response.cookies.set(PRIVATE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 0,
  });
  return response;
}
