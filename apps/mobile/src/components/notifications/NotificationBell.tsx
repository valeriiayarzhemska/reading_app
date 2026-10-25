import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';

import { useUnreadCount } from '@/api/notifications';

// 🔔 in the Shelves header, with the number of unread notifications
export function NotificationBell() {
  const { t } = useTranslation();
  const { data: count = 0 } = useUnreadCount();

  return (
    <View>
      <IconButton
        icon="bell"
        label={t('notifications.title')}
        onPress={() => router.push('/notifications')}
      />

      {count > 0 ? (
        <View
          pointerEvents="none"
          className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1"
        >
          <Text className="font-sans-bold text-[11px] text-accent-fg">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
