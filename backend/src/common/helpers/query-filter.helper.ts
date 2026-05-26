export const getQueryString = (query: unknown, key: string): string => {
  if (!query || typeof query !== 'object') return '';
  const value = (query as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getQueryBoolean = (query: unknown, key: string): boolean | undefined => {
  const value = getQueryString(query, key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildLocalizedSearchFilter = (search: string, fields: string[]) => {
  if (!search) return {};
  const regex = new RegExp(escapeRegex(search), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};
