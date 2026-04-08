import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Mock next/server ─────────────────────────────────────────────────────────
// Must be declared as `var` so it is accessible (hoisted undefined) when
// the vi.mock factory below references it. The factory creates the actual mock.
var MockNextRequest: typeof import('next/server').NextRequest;
var mockHeadersEntries: Array<[string, string]> = [];

// Minimal NextRequest mock — enough for the route handlers to call:
//   request.headers.get(), request.nextUrl.searchParams, request.json()
MockNextRequest = (function (
  this: {
    url: URL;
    headers: Headers;
    nextUrl: URL;
    ip?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  },
  input: URL | RequestInfo,
  init?: RequestInit
) {
  this.url = input instanceof URL ? input : new URL(typeof input === 'string' ? input : (input as Request).url);
  this.headers = new Headers(init?.headers as Record<string, string> | undefined);
  this.nextUrl = this.url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this.cookies = { get: vi.fn().mockReturnValue(null), getAll: vi.fn().mockReturnValue([]) } as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this.clone = vi.fn().mockReturnValue(this) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this.json = vi.fn().mockImplementation(async () => ({})) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this.text = vi.fn().mockImplementation(async () => '') as any;
  mockHeadersEntries = [...this.headers.entries()];
} as any);

vi.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: {
    json: vi.fn((data: unknown, init?: ResponseInit) => {
      var status = init?.status ?? 200;
      var headerRecord: Record<string, string> = {};
      if (init?.headers) {
        // Support Headers instance or plain object
        if (init.headers instanceof Headers) {
          for (var [k, v] of init.headers.entries()) { headerRecord[k] = v; }
        } else if (Array.isArray(init.headers)) {
          for (var [k, v] of init.headers) { headerRecord[k] = v; }
        } else {
          headerRecord = init.headers as Record<string, string>;
        }
      }
      headerRecord['content-type'] = 'application/json';
      return new Response(JSON.stringify(data), {
        status,
        headers: headerRecord,
      });
    }),
  },
}));

// ─── Mock next/navigation ─────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ─── Mock next-themes ─────────────────────────────────────────────────────────
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Mock React Query ──────────────────────────────────────────────────────────
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isLoading: false }),
}));
