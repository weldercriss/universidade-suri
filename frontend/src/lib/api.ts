export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem("suri_token");
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = new URL(path.startsWith("http") ? path : `${API_BASE_URL}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, val);
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro na requisição da API");
  }

  return response.json() as Promise<T>;
}

/** Upload de arquivo via multipart/form-data */
export async function apiUpload<T = any>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = localStorage.getItem("suri_token");
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // NÃO setar Content-Type: o browser define com o boundary do multipart

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, { method: "POST", headers, body: formData });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro no upload");
  }

  return response.json() as Promise<T>;
}
