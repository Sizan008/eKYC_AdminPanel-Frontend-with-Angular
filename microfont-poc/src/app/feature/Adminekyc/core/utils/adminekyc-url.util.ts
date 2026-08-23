import { ADMINEKYC_API_BASE_URL } from '../constants/adminekyc-api.constants';

export function toAdminekycStaticUrl(url?: string | null): string {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${ADMINEKYC_API_BASE_URL}${url}`;
  }

  return `${ADMINEKYC_API_BASE_URL}/${url}`;
}