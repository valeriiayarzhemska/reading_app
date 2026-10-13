// Seeded by `pnpm db:seed`; sign in as them with POST /auth/dev-login
// (development only), without Apple/Google.
export const DEV_USERS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nickname: 'alice',
    displayName: 'Alice',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nickname: 'bob',
    displayName: 'Bob',
  },
] as const;
