import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertWorkspaceSchema } from "@shared/schema";

const createWorkspaceFormSchema = insertWorkspaceSchema.pick({
  name: true,
  description: true,
});

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceFormSchema>;

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceFormData) => {
      const res = await apiRequest("POST", "/api/workspaces", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: t('common.buttons.save'),
        description: t('messages.success.workspaceCreated'),
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t('common.buttons.error'),
        description: error.message || t('messages.error.workspaceCreateFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateWorkspaceFormData) => {
    createWorkspaceMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle data-testid="title-create-workspace">{t('modals.workspace.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('modals.workspace.createDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.workspace.workspaceName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('modals.workspace.workspaceNamePlaceholder')}
                      data-testid="input-workspace-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.workspace.workspaceDescription')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('modals.workspace.workspaceDescriptionPlaceholder')}
                      className="min-h-[80px]"
                      data-testid="input-workspace-description"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-workspace"
                disabled={createWorkspaceMutation.isPending}
              >
                {t('modals.workspace.cancel')}
              </Button>
              <Button 
                type="submit" 
                data-testid="button-create-workspace-confirm"
                disabled={createWorkspaceMutation.isPending}
              >
                {createWorkspaceMutation.isPending ? t('modals.workspace.creating') : t('modals.workspace.createWorkspace')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}