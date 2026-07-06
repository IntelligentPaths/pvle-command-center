// NextAuth v5 route handler — exposes /api/auth/* (sign-in, callback, session, csrf…).
// These endpoints are the ONLY public routes (see src/proxy.ts matcher).
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
