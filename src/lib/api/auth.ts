const normalizeList = (value?: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const isOriginAllowed = (origin: string | null) => {
  if (!origin) return true;
  const allowlist = normalizeList(process.env.API_ALLOWED_ORIGINS);
  if (allowlist.length === 0) return true;
  return allowlist.includes(origin);
};

export const isApiKeyValid = (request: Request) => {
  const apiKey = request.headers.get("x-api-key")?.trim();
  const allowedApiKeys = normalizeList(process.env.API_PUBLIC_KEYS);
  if (allowedApiKeys.length === 0) return true;
  return apiKey ? allowedApiKeys.includes(apiKey) : false;
};
