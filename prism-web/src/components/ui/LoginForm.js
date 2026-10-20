"use client";

import { useState } from "react";
import AuthLayout from "@/components/ui/AuthLayout";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20";

export default function LoginForm({
  logoSubtitle,
  title,
  description,
  emailPlaceholder,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  error,
  loading,
  onSubmit,
  footer,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const variant = logoSubtitle?.toUpperCase().includes("SUPERADMIN") ? "superadmin" : "supervisor";

  return (
    <AuthLayout logoSubtitle={logoSubtitle} variant={variant}>
      <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
      <p className="mb-8 mt-2 text-sm text-gray-500">{description}</p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={emailPlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wide text-gray-600">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {showPassword ? (
                  <>
                    <path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-3.2 4.2" />
                    <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.2" />
                    <path d="m2 2 20 20" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>

        {footer}
      </form>
    </AuthLayout>
  );
}