// Temporary users until real auth (Stage 3). Created by `pnpm db:seed`.
// Fixed IDs so you can use them in Postman / curl as the x-user-id header.
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

export const DEFAULT_DEV_USER_ID = DEV_USERS[0].id;
