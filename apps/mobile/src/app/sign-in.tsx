import { DEV_USERS } from '@reading/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

// 'google' or a dev user's ID: which button shows the spinner
type Pending = string | null;

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signInWithGoogle, signInDev } = useAuth();
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, signIn: () => Promise<void>) {
    setPending(key);
    setError(null);

    try {
      await signIn();
    } catch (e) {
      setError(
        t('auth.signInFailed', {
          message: e instanceof Error ? e.message : String(e),
        }),
      );
    } finally {
      // On success this screen unmounts; on cancel or error the buttons unlock
      setPending(null);
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
        <Button
          title={t('auth.continueWithGoogle')}
          loading={pending === 'google'}
          disabled={pending !== null}
          onPress={() => run('google', signInWithGoogle)}
        />

        {error ? (
          <Text className="text-center text-danger">{error}</Text>
        ) : null}

        {__DEV__ ? (
          <View className="mt-6 gap-3">
            <Text variant="label" className="text-center">
              {t('auth.devSection')}
            </Text>

            {DEV_USERS.map((user) => (
              <Button
                key={user.id}
                title={t('auth.continueAs', { name: user.displayName })}
                variant="secondary"
                loading={pending === user.id}
                disabled={pending !== null}
                onPress={() => run(user.id, () => signInDev(user.id))}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
