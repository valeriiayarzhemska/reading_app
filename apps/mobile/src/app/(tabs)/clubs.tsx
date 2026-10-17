import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ComingSoon';

export default function ClubsScreen() {
  const { t } = useTranslation();

  return (
    <ComingSoon title={t('tabs.clubs')} description={t('placeholders.clubs')} />
  );
}
