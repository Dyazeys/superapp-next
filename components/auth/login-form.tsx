"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmitDisabled = pending || login.trim().length === 0 || password.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      login,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setError("Email atau password tidak valid.");
      setPending(false);
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="login" className="text-slate-700">
          Username / Email
        </Label>
        <Input
          id="login"
          name="login"
          type="text"
          autoComplete="username"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          required
          placeholder="owner atau ops-auth@company.internal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Masukkan password"
            className="pr-16"
          />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="absolute top-1/2 right-1 -translate-y-1/2 px-2"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="text-xs text-slate-500">Gunakan kredensial dari password manager tim.</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <Button type="submit" className="h-9 w-full" disabled={isSubmitDisabled}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
