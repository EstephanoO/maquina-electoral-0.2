export type InfoUser = {
  username: string;
  name: string;
  email: string;
};

export const INFO_EMAIL_DOMAIN = "info.gob";
export const INFO_ADMIN_EMAIL = `admin@${INFO_EMAIL_DOMAIN}`;

export const INFO_USERS: InfoUser[] = [
  { username: "dania", name: "Dania", email: `dania@${INFO_EMAIL_DOMAIN}` },
  { username: "milagros", name: "Milagros", email: `milagros@${INFO_EMAIL_DOMAIN}` },
  { username: "jazmin", name: "Jazmin", email: `jazmin@${INFO_EMAIL_DOMAIN}` },
  { username: "naomi", name: "Naomi", email: `naomi@${INFO_EMAIL_DOMAIN}` },
  { username: "reghina", name: "Reghina", email: `reghina@${INFO_EMAIL_DOMAIN}` },
];

const infoUserEmailSet = new Set(INFO_USERS.map((user) => user.email.toLowerCase()));
const infoUsernameSet = new Set(INFO_USERS.map((user) => user.username.toLowerCase()));
const emailDomainSuffix = `@${INFO_EMAIL_DOMAIN}`;

export const isInfoUserEmail = (email?: string | null) => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === INFO_ADMIN_EMAIL) return true;
  if (normalized.endsWith(emailDomainSuffix)) return true;
  return infoUserEmailSet.has(normalized);
};

export const isInfoAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return email.trim().toLowerCase() === INFO_ADMIN_EMAIL;
};

export const getInfoLoginEmail = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("@")) {
    return isInfoUserEmail(normalized) ? normalized : null;
  }
  if (infoUsernameSet.has(normalized)) return `${normalized}@${INFO_EMAIL_DOMAIN}`;
  if (!/^[a-z0-9._-]+$/.test(normalized)) return null;
  return `${normalized}@${INFO_EMAIL_DOMAIN}`;
};
