import { currentUser } from './auth';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requireAdminApi() {
  const user = await currentUser();

  if (!user) {
    throw new ApiError('Authentication required.', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError('This account is not active.', 403);
  }

  if (user.role !== 'ADMIN') {
    throw new ApiError('Administrator access is required.', 403);
  }

  return user;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return Response.json({ error: 'Something went wrong.' }, { status: 500 });
}
