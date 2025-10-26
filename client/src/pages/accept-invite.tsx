import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react";

interface InviteVerification {
  message: string;
  workspaceName: string;
  inviterName: string;
}

interface AcceptResponse {
  message: string;
  isNewUser: boolean;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    language: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

export default function AcceptInvite() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<AcceptResponse | null>(null);

  const token = location.split('/').pop();

  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
  }, [token]);

  const verifyInvitation = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invitations/verify/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setInviteData(data);
      } else {
        setError(data.message || "Invalid invitation");
      }
    } catch (error) {
      console.error("Error verifying invitation:", error);
      setError("Failed to verify invitation");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!token) return;
    
    setAccepting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/invitations/accept/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data: AcceptResponse = await response.json();
      
      if (response.ok) {
        setSuccess(data);
      
        
        toast({
          title: "Welcome!",
          description: `Successfully joined ${data.workspace.name}`,
        });
        
        // Redirect based on whether it's a new user
        if (data.isNewUser) {
          // Redirect to set password page
          setTimeout(() => {
            window.location.href = "/set-password";
          }, 2000);
        } else {
          // Redirect to workspace
          setTimeout(() => {
            window.location.href = `/workspace/${data.workspace.id}`;
          }, 2000);
        }
      } else {
        setError(data.message || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{t("messages.acceptInvite.verifying")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>{t("messages.acceptInvite.invalidInvitation")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button 
                onClick={() => setLocation("/")} 
                className="w-full"
                variant="outline"
              >
                {t("messages.acceptInvite.goHome")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold">{t("messages.acceptInvite.welcome", { workspaceName: success.workspace.name })}</h2>
                <p className="text-muted-foreground mt-2">
                  {success.isNewUser 
                    ? t("messages.acceptInvite.accountCreated")
                    : t("messages.acceptInvite.addedToWorkspace")
                  }
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                <span>{t("messages.acceptInvite.invitedBy", { name: `${success.user.firstName} ${success.user.lastName}` })}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {t("messages.acceptInvite.redirecting", { 
                  action: success.isNewUser 
                    ? t("messages.acceptInvite.redirectingToPassword")
                    : t("messages.acceptInvite.redirectingToWorkspace")
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>{t("messages.acceptInvite.title")}</span>
          </CardTitle>
          <CardDescription>
            {t("messages.acceptInvite.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">{t("messages.acceptInvite.workspaceName", { name: inviteData.workspaceName })}</h3>
            <p className="text-sm text-muted-foreground">
              {t("messages.acceptInvite.invitedBy", { name: inviteData.inviterName })}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">
              {t("messages.acceptInvite.features.title")}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• {t("messages.acceptInvite.features.viewTasks")}</li>
              <li>• {t("messages.acceptInvite.features.trackProgress")}</li>
              <li>• {t("messages.acceptInvite.features.collaborate")}</li>
              <li>• {t("messages.acceptInvite.features.planSprints")}</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={acceptInvitation}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("messages.acceptInvite.accepting")}
                </>
              ) : (
                t("messages.acceptInvite.acceptButton")
              )}
            </Button>
            <Button 
              onClick={() => setLocation("/")} 
              variant="outline"
              className="flex-1"
            >
              {t("messages.acceptInvite.declineButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
