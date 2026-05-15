export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatNumber = (n: number, locale = 'en-US') => {
  return new Intl.NumberFormat(locale).format(n);
};

export const truncate = (str: string, maxLen: number) => {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
};
