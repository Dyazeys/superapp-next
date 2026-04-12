import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08)_0%,rgba(255,255,255,0)_56%)] p-6">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95">
        <CardHeader>
          <CardTitle>Sign in to SuperApp</CardTitle>
          <CardDescription>
            Login untuk membuka dashboard operasional dan seluruh modul ERP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
