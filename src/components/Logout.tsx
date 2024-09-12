import { useAuth } from '@services/hooks/auth';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

export function Logout() {
  const auth = useAuth();
  const { t } = useTranslation('NavigationBar');
  return auth.isAuthenticated ? <Button onClick={() => auth.logout()}>{t('logout')}</Button> : null;
}
