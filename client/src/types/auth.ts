export type RegisterPayload = {
  fullName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type AuthResponsePayload = {
  message: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export type SessionTokens = Pick<AuthResponsePayload, "accessToken" | "refreshToken" | "tokenType">;
