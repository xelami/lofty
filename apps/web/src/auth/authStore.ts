import { create } from "zustand"

import { apiFetch } from "../api/client"
import type { User } from "./types"

type AuthState = {
  user: User | null
  loading: boolean
  checkAuth: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  resendVerificationEmail: (email: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  checkAuth: async () => {
    try {
      const response = await apiFetch<{
        user: User
      }>("/auth/me")

      set({
        user: response.user,
        loading: false,
      })
    } catch {
      set({
        user: null,
        loading: false,
      })
    }
  },

  register: async (name, email, password) => {
    await apiFetch("/auth/register", {
      method: "POST",
      body: {
        name,
        email,
        password,
      },
    })
  },

  resendVerificationEmail: async (email) => {
    await apiFetch("/auth/resend-verification", {
      method: "POST",
      body: {
        email,
      },
    })
  },

  login: async (email, password) => {
    const response = await apiFetch<{
      user: User
    }>("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
      },
    })

    set({
      user: response.user,
    })
  },

  logout: async () => {
    await apiFetch("/auth/logout", {
      method: "POST",
    })

    set({
      user: null,
    })
  },
}))
