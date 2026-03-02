export function getAllowedAppPasswords(): string[] {
  const listFromEnv = (process.env.APP_PASSWORDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const singlePassword = process.env.APP_PASSWORD?.trim();

  if (singlePassword) {
    listFromEnv.push(singlePassword);
  }

  return Array.from(new Set(listFromEnv));
}

export function isAllowedPassword(password?: string | null): boolean {
  if (!password) {
    return false;
  }

  return getAllowedAppPasswords().includes(password);
}
