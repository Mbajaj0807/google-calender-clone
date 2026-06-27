export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
  designation: string;
  timezone: string;
  organizationId: string | null;
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

// Trimmed projection returned by GET /users/organization and GET /users/:id
// (password hash stripped server-side; matches the .select() in user.controller.js)
export interface OrgMember {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
  designation: string;
  dateOfBirth?: string;
}