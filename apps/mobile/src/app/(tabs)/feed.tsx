import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/coming-soon';

export default function FeedScreen() {
  const { t } = useTranslation();

  return (
    <ComingSoon title={t('tabs.feed')} description={t('placeholders.feed')} />
  );
}
