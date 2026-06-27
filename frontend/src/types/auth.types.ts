export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
  designation: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationId?: string;
}

export interface ApiError {
  message: string;
}
