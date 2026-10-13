import { DEV_USERS } from '@reading/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signInDev } = useAuth();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDevSignIn(userId: string) {
    setPendingUserId(userId);
    setError(null);

    try {
      await signInDev(userId);
    } catch (e) {
      setError(
        t('auth.signInFailed', {
          message: e instanceof Error ? e.message : String(e),
        }),
      );
      setPendingUserId(null);
    }
  }

  return (
    <Screen edges={['top', 'bottom']} className="justify-between px-6 py-8">
      <View className="flex-1 justify-center gap-3">
        <Text variant="title" className="text-[40px] leading-[46px]">
          {t('auth.appName')}
        </Text>

        <Text variant="muted" className="text-base">
          {t('auth.tagline')}
        </Text>
      </View>

      <View className="gap-3">
        <Text variant="muted" className="text-center">
          {t('auth.providersSoon')}
        </Text>

        {error ? (
          <Text className="text-center text-danger">{error}</Text>
        ) : null}

        {__DEV__ ? (
          <View className="mt-4 gap-3">
            <Text variant="label" className="text-center">
              {t('auth.devSection')}
            </Text>

            {DEV_USERS.map((user) => (
              <Button
                key={user.id}
                title={t('auth.continueAs', { name: user.displayName })}
                variant="secondary"
                loading={pendingUserId === user.id}
                disabled={pendingUserId !== null}
                onPress={() => handleDevSignIn(user.id)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
