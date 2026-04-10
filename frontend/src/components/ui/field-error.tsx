import { AlertCircle } from "lucide-react";

type FieldErrorProps = {
  message?: string;
};

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </p>
  );
}
