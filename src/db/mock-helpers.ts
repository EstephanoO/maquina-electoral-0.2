export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
