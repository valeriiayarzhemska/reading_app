import {
  DISPLAY_NAME_MAX_LENGTH,
  nicknameError,
  normalizeNickname,
  suggestNickname,
} from '@reading/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { ApiError } from '@/api/client';
import { completeOnboarding, useNicknameAvailability } from '@/api/users';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { state, updateUser } = useAuth();
  const initialName = state.status === 'signedIn' ? state.user.displayName : '';
  const [displayName, setDisplayName] = useState(initialName);
  const [nickname, setNickname] = useState(() => suggestNickname(initialName));

  const normalized = normalizeNickname(nickname);
  const formatError = normalized ? nicknameError(normalized) : null;
  const { isChecking, available, taken } = useNicknameAvailability(normalized);

  const submit = useMutation({
    mutationFn: () =>
      completeOnboarding({
        displayName: displayName.trim(),
        nickname: normalized,
      }),
    // The guard sees onboardedAt and switches to the app by itself
    onSuccess: updateUser,
  });

  const submitError =
    submit.error instanceof ApiError && submit.error.status === 409
      ? t('onboarding.nicknameTaken')
      : submit.error?.message;

  const canSubmit =
    displayName.trim().length > 0 && available && !submit.isPending;

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-between gap-8 px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2 pt-8">
            <Text variant="title">{t('onboarding.title')}</Text>

            <Text variant="muted" className="text-base">
              {t('onboarding.subtitle')}
            </Text>
          </View>

          <View className="gap-5">
            <TextField
              label={t('onboarding.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              autoComplete="name"
            />

            <View className="gap-1.5">
              <TextField
                label={t('onboarding.nickname')}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                error={
                  formatError
                    ? t(`onboarding.nicknameErrors.${formatError}`)
                    : undefined
                }
              />

              {!formatError && normalized ? (
                <NicknameStatus
                  isChecking={isChecking}
                  available={available}
                  taken={taken}
                />
              ) : null}
            </View>
          </View>

          <View className="gap-3">
            {submitError ? (
              <Text className="text-center text-danger">{submitError}</Text>
            ) : null}

            <Button
              title={t('onboarding.continue')}
              disabled={!canSubmit}
              loading={submit.isPending}
              onPress={() => submit.mutate()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function NicknameStatus({
  isChecking,
  available,
  taken,
}: {
  isChecking: boolean;
  available: boolean;
  taken: boolean;
}) {
  const { t } = useTranslation();

  if (isChecking) {
    return <Text variant="muted">{t('onboarding.checking')}</Text>;
  }

  if (available) {
    return (
      <Text className="text-sm text-success">{t('onboarding.available')}</Text>
    );
  }

  if (taken) {
    return (
      <Text className="text-sm text-danger">
        {t('onboarding.nicknameTaken')}
      </Text>
    );
  }

  return null;
}
