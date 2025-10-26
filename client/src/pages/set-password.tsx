import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";

export default function SetPassword() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError(t("messages.setPassword.passwordRequired"));
      return;
    }

    if (password.length < 6) {
      setError(t("messages.setPassword.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("messages.setPassword.passwordsDontMatch"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: t("messages.setPassword.passwordSet"),
          description: t("messages.setPassword.passwordSetDescription"),
        });
          setLocation("/dashboard");
      } else {
        setError(data.message || t("messages.setPassword.passwordSetFailed"));
      }
    } catch (error) {
      console.error("Error setting password:", error);
      setError(t("messages.setPassword.passwordSetFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  if (success) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div>
                  <h2 className="text-xl font-semibold">{t("messages.setPassword.passwordSet")}</h2>
                  <p className="text-muted-foreground mt-2">
                    {t("messages.setPassword.passwordSetDescription")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>{t("messages.setPassword.title")}</span>
            </CardTitle>
            <CardDescription>
              {t("messages.setPassword.description", { name: user.firstName })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">{t("messages.setPassword.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("messages.setPassword.passwordPlaceholder")}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("messages.setPassword.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("messages.setPassword.confirmPasswordPlaceholder")}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("messages.setPassword.settingPassword")}
                  </>
                ) : (
                  t("messages.setPassword.setPasswordButton")
                )}
              </Button>
            </form>

            <div className="mt-4 text-xs text-muted-foreground">
              <p>{t("messages.setPassword.requirements.title")}</p>
              <ul className="ml-4 space-y-1">
                <li>• {t("messages.setPassword.requirements.minLength")}</li>
                <li>• {t("messages.setPassword.requirements.strongPassword")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
