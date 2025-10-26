import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Users, Calendar, BarChart3 } from "lucide-react";
import AuthLanguageSelector from "@/components/auth-language-selector";

export default function AuthPage() {
  const { t } = useTranslation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "facilitator",
    language: "en",
  });
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ ...registerData, language: selectedLanguage });
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Language selector in top right */}
      <div className="absolute top-4 right-4 z-10">
        <AuthLanguageSelector
          onLanguageChange={handleLanguageChange}
          selectedLanguage={selectedLanguage}
        />
      </div>

      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {t("navigation.brand")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("navigation.tagline")}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">
                {t("common.buttons.signIn")}
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                {t("common.buttons.signUp")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.login.title")}</CardTitle>
                  <CardDescription>{t("auth.login.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">
                        {t("auth.login.username")}
                      </Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            username: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">
                        {t("auth.login.password")}
                      </Label>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({
                            ...loginData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending
                        ? t("auth.login.buttonLoading")
                        : t("auth.login.button")}
                    </Button>
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => setLocation("/forgot-password")}
                        className="text-sm"
                      >
                        {t("auth.forgotPassword.forgotLink")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.register.title")}</CardTitle>
                  <CardDescription>
                    {t("auth.register.subtitle")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">
                          {t("auth.register.firstName")}
                        </Label>
                        <Input
                          id="register-firstName"
                          data-testid="input-register-firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              firstName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">
                          {t("auth.register.lastName")}
                        </Label>
                        <Input
                          id="register-lastName"
                          data-testid="input-register-lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              lastName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">
                        {t("auth.register.email")}
                      </Label>
                      <Input
                        id="register-email"
                        data-testid="input-register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">
                        {t("auth.register.username")}
                      </Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">
                        {t("auth.register.password")}
                      </Label>
                      <Input
                        id="register-password"
                        data-testid="input-register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">
                        {t("auth.register.role")}
                      </Label>
                      <Select
                        value={registerData.role}
                        onValueChange={(value) =>
                          setRegisterData({ ...registerData, role: value })
                        }
                      >
                        <SelectTrigger data-testid="select-register-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facilitator">
                            {t("common.roles.facilitator")}
                          </SelectItem>
                          <SelectItem value="learner">
                            {t("common.roles.learner")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending
                        ? t("auth.register.buttonLoading")
                        : t("auth.register.button")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-primary/5 flex items-center justify-center p-4 lg:p-8 hidden lg:flex">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t("auth.hero.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("auth.hero.subtitle")}
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">
                  {t("auth.hero.features.workspaces.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.hero.features.workspaces.description")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-secondary mt-1" />
              <div>
                <h3 className="font-medium text-foreground">
                  {t("auth.hero.features.sprints.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.hero.features.sprints.description")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
              <BarChart3 className="h-5 w-5 text-accent mt-1" />
              <div>
                <h3 className="font-medium text-foreground">
                  {t("auth.hero.features.progress.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.hero.features.progress.description")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
              <GraduationCap className="h-5 w-5 text-chart-4 mt-1" />
              <div>
                <h3 className="font-medium text-foreground">
                  {t("auth.hero.features.childFriendly.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.hero.features.childFriendly.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
