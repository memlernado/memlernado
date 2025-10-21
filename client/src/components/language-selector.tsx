import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);

  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}/preferences`, {
        language,
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsChanging(false);
    },
    onError: () => {
      setIsChanging(false);
    },
  });

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === i18n.language) return;
    
    setIsChanging(true);
    
    // Change language immediately for better UX
    await i18n.changeLanguage(languageCode);
    
    // Update user preference in backend
    if (user?.id) {
      updateLanguageMutation.mutate(languageCode);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-2"
          disabled={isChanging}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center space-x-2"
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
