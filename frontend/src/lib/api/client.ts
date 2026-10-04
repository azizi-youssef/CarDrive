/**
 * Base client pour communiquer avec le backend CarDrive (Express.js)
 * URL de base : NEXT_PUBLIC_API_URL (défaut : http://localhost:4000)
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: { field: string; message: string }[];
  meta?: { total: number; limit?: number; offset?: number };
};

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      success: false,
      error: json.error ?? `Erreur ${res.status}`,
      details: json.details,
    };
  }

  return json as ApiResponse<T>;
}

export { apiFetch, API_BASE };
