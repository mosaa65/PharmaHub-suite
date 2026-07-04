import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, toggle, dir } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("success"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir={dir}>
      <button
        onClick={toggle}
        className="absolute top-4 end-4 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        {lang === "ar" ? "English" : "العربية"}
      </button>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-elegant mb-4">
            <Pill className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("appTagline")}</p>
        </div>

        <Card className="glass-card p-7 shadow-elegant">
          <h2 className="text-xl font-bold mb-1">
            {mode === "signin" ? t("welcomeBack") : t("createAccount")}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === "signin" ? t("signIn") : t("signUp")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? t("signIn") : t("signUp")}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? t("noAccount") : t("haveAccount")}{" "}
            <button
              className="text-primary font-semibold hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? t("signUp") : t("signIn")}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
