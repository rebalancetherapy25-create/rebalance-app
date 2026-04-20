type ToastFn = (options: any) => void;

export const toastValidationErrors = (toast: ToastFn, items: string[], title = 'Please review the form') => {
  if (!items.length) return;
  toast({
    title,
    variant: 'destructive',
    items,
  });
};

export const toastApiError = (toast: ToastFn, description: string, title = 'Something went wrong') => {
  toast({
    title,
    description,
    variant: 'destructive',
  });
};

export const toastSuccess = (toast: ToastFn, description: string, title = 'Done') => {
  toast({
    title,
    description,
  });
};
