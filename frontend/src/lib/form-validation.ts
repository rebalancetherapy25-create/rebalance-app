export type FormErrors<T extends string = string> = Partial<Record<T, string>>;

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getErrorMessages<T extends string>(errors: FormErrors<T>) {
  return Object.values(errors).filter((value): value is string => Boolean(value));
}

export function hasErrors<T extends string>(errors: FormErrors<T>) {
  return getErrorMessages(errors).length > 0;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
    fallback
  );
}
