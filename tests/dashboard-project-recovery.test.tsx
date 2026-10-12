// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
let container: HTMLDivElement;
let root: Root;
const byText = (text: string) => [...container.querySelectorAll('*')].find(el => el.textContent === text && el.children.length === 0) as HTMLElement | undefined;
const screen = {
  getByText: (text: string) => { const el = byText(text); if (!el) throw Error(`Missing ${text}`); return el; },
  queryByText: (text: string) => byText(text) ?? null,
  queryByRole: (role: string) => container.querySelector(`[role="${role}"]`),
  getByPlaceholderText: (text: string) => container.querySelector(`input[placeholder="${text}"]`) as HTMLInputElement,
  findByText: async (text: string) => { await flush(); return screen.getByText(text); },
  findByRole: async (role: string) => { await flush(); return screen.queryByRole(role); },
};
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); }
async function render(node: React.ReactNode) { await act(async () => { root.render(node); }); }
const fireEvent = {
  click: async (el: HTMLElement) => { await act(async () => { el.click(); }); },
  change: async (el: HTMLInputElement, event: { target: { value: string } }) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, event.target.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  },
};

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  params: new URLSearchParams(),
  ensureConfig: vi.fn(), client: vi.fn(), getUser: vi.fn(), request: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router, useSearchParams: () => mocks.params }));
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }));
vi.mock('@/lib/supabase/client', () => ({ createClient: mocks.client, ensureSupabaseConfig: mocks.ensureConfig }));
vi.mock('@/lib/wonderspace/browser-project-fetch', () => ({ fetchAuthenticatedProject: mocks.request }));
vi.mock('@/components/dashboard/WonderSpaceDashboardPanel', () => ({ default: () => null }));
vi.mock('../apps/web/app/(workspace)/dashboard/components/ProjectDeleteButton', () => ({ default: () => null }));
import DashboardPage from '../apps/web/app/(workspace)/dashboard/page';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  mocks.params = new URLSearchParams();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner', email: 'mike@example.test' } } });
  mocks.ensureConfig.mockResolvedValue({ url: 'https://runtime.supabase.co', anonKey: 'public-key' });
  mocks.client.mockReturnValue({ auth: { getUser: mocks.getUser } });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

it('awaits runtime config and recovers from a structured loading error without a false empty state', async () => {
  let configured = false;
  mocks.ensureConfig.mockImplementation(async () => { configured = true; });
  mocks.client.mockImplementation(() => {
    expect(configured).toBe(true);
    return { auth: { getUser: mocks.getUser } };
  });
  mocks.request.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Login required' } }), { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ projects: [] })));
  await render(<DashboardPage />);
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Login required'));
  expect(screen.queryByText('Create your first project')).toBeNull();
  expect(screen.queryByText('[object Object]')).toBeNull();
  await fireEvent.click(screen.getByText('Retry loading projects'));
  expect(await screen.findByText('Create your first project')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('shows nested creation errors and opens the persisted project after a successful retry', async () => {
  mocks.params = new URLSearchParams('create=project');
  mocks.request.mockResolvedValueOnce(new Response(JSON.stringify({ projects: [] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Login required' } }), { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ project: { id: 'saved-id', name: 'fff', tool: 'workspace' } }), { status: 201 }));
  await render(<DashboardPage />);
  await screen.findByText('Create your first project');
  await fireEvent.change(screen.getByPlaceholderText('My new project'), { target: { value: 'fff' } });
  await fireEvent.click(screen.getByText('Create Project'));
  await screen.findByText('Login required');
  expect(mocks.router.push).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByText('Create Project'));
  await flush();
  expect(mocks.router.push).toHaveBeenCalledWith('/dashboard/projects/saved-id');
  expect(screen.getByText('fff')).toBeTruthy();
});

it('still loads projects when the optional asset request fails', async () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Assets offline'));
  mocks.request.mockResolvedValueOnce(new Response(JSON.stringify({ projects: [{ id: 'existing', name: 'Existing project', tool: 'workspace' }] })));
  await render(<DashboardPage />);
  expect(await screen.findByText('Existing project')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
