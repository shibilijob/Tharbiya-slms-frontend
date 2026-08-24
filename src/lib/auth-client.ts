import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export interface BetterAuthCustomUser {
  id: string;
  name: string;
  email: string;
  role?: 'PARENT' | 'MUALLIM' | 'SADHR_MUALLIM';
  phone?: string;
  designation?: string;
  madrasaName?: string;
  assignedClasses?: string;
  assignedSubjects?: string;
  studentIds?: string;
  avatar?: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  plugins: [
    usernameClient(),
  ],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  getSession,
} = authClient;
