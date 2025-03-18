import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'group border-border bg-background text-foreground rounded-md shadow-lg p-4',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90 text-sm',
          cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/90 text-sm',
          closeButton: 'text-foreground/50 hover:text-foreground',
          success: 'border-green-500 [&>div>div]:text-green-500',
          error: 'border-destructive [&>div>div]:text-destructive',
          info: 'border-blue-500 [&>div>div]:text-blue-500',
          warning: 'border-amber-500 [&>div>div]:text-amber-500',
        },
      }}
    />
  );
}
