import type { AxiosError } from 'axios';
import { toast } from 'vue-sonner';

interface ApiErrorResponse {
  code: string;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

export function handleError(error: unknown): void {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;

    toast.error(data.code || 'Error', {
      description: data.message || 'An unexpected error occurred',
    });

    return;
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  toast.error('Error', {
    description: message,
  });
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
