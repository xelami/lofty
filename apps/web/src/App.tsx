import { Navigate, Route, Routes } from "react-router-dom"

import { AuthBootstrap } from "./auth/AuthBootstrap"
import { useAuthStore } from "./auth/authStore"

import { LoginPage } from "./pages/LoginPage"
import { DesktopsPage } from "./pages/DesktopsPage"
import { DesktopPage } from "./pages/DesktopPage"
import { RegisterPage } from "./pages/RegisterPage"
import { VerifyEmail } from "./pages/VerifyEmail"
import { IndexPage } from "./pages/IndexPage"
import { SettingsPage } from "./pages/SettingsPage"
import { ResetPasswordPage } from "./pages/ResetPassword"
import { VerifyPasswordChangePage } from "./pages/VerifyPasswordChange"

function App() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

  return (
    <>
      <AuthBootstrap />

      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Loading...
        </div>
      ) : (
        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<IndexPage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/desktops" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<IndexPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/desktops" element={<DesktopsPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/verify-password-change"
                element={<VerifyPasswordChangePage />}
              />
              <Route path="/desktops/:desktopId" element={<DesktopPage />} />
              <Route path="*" element={<Navigate to="/desktops" replace />} />
            </>
          )}
        </Routes>
      )}
    </>
  )
}

export default App
