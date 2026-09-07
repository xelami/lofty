import { useEffect } from "react"

import { useAuthStore } from "./authStore"

export function AuthBootstrap() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return null
}
