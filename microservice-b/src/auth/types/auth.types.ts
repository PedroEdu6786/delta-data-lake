export interface User {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest {
  user: User;
}
