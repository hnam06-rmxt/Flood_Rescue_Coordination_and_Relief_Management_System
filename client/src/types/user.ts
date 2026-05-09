export type UserProfile = {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  status: string | null;
  role: string | null;
  lastLoginAt: string | null;
};
