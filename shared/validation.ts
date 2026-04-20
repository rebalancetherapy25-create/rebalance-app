export type FormErrors<T extends string = string> = Partial<Record<T, string>>;

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getErrorMessages<T extends string>(errors: Partial<Record<T, string | undefined>>) {
  return Object.values(errors).filter((value): value is string => Boolean(value));
}

export function hasErrors<T extends string>(errors: Partial<Record<T, string | undefined>>) {
  return getErrorMessages(errors).length > 0;
}

type ApiErrorShape = {
  error?: string;
  message?: string;
};

type AxiosLikeError = {
  response?: {
    data?: ApiErrorShape;
  };
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  const responseError = (error as AxiosLikeError)?.response?.data;
  return responseError?.error || responseError?.message || fallback;
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
