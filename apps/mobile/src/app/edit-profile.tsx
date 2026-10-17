import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { useMutation } from '@tanstack/react-query';

import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  linkError,
  LINKS_MAX_COUNT,
  nicknameError,
  normalizeNickname,
  type Me,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { ApiError } from '@/api/client';
import {
  updateProfile,
  useNicknameAvailability,
  type ProfileChanges,
} from '@/api/users';
import { useAuth } from '@/auth/AuthContext';

// Only fields that actually changed are sent: PATCH means "change these"
function diff(
  user: Me,
  form: Required<Omit<ProfileChanges, 'timezone'>>,
): ProfileChanges {
  const changes: ProfileChanges = {};

  if (form.displayName !== user.displayName) {
    changes.displayName = form.displayName;
  }

  if (form.nickname !== user.nickname) {
    changes.nickname = form.nickname;
  }

  if (form.bio !== (user.bio ?? '')) {
    changes.bio = form.bio;
  }

  if (form.links.join('\n') !== user.links.join('\n')) {
    changes.links = form.links;
  }

  return changes;
}

export default function EditProfileScreen() {
  const { state, updateUser } = useAuth();

  // The route is only reachable when signed in (Stack.Protected)
  if (state.status !== 'signedIn') {
    return null;
  }

  return <EditProfileForm user={state.user} onSaved={updateUser} />;
}

function EditProfileForm({
  user,
  onSaved,
}: {
  user: Me;
  onSaved: (user: Me) => void;
}) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [nickname, setNickname] = useState(user.nickname);
  const [bio, setBio] = useState(user.bio ?? '');
  const [links, setLinks] = useState(user.links);

  const normalized = normalizeNickname(nickname);
  const nicknameFormatError = normalized ? nicknameError(normalized) : null;
  const nicknameUnchanged = normalized === user.nickname;
  const { isChecking, available, taken } = useNicknameAvailability(normalized);

  const filledLinks = links.map((link) => link.trim()).filter(Boolean);
  const linkErrors = links.map((link) =>
    link.trim() ? linkError(link.trim()) : null,
  );

  const changes = diff(user, {
    displayName: displayName.trim(),
    nickname: normalized,
    bio: bio.trim(),
    links: filledLinks,
  });

  const save = useMutation({
    mutationFn: () => updateProfile(changes),
    onSuccess: (updated) => {
      onSaved(updated);
      router.back();
    },
  });

  const canSave =
    Object.keys(changes).length > 0 &&
    displayName.trim().length > 0 &&
    !nicknameFormatError &&
    (nicknameUnchanged || available) &&
    linkErrors.every((error) => error === null) &&
    !save.isPending;

  const saveError =
    save.error instanceof ApiError && save.error.status === 409
      ? t('onboarding.nicknameTaken')
      : save.error?.message;

  function setLink(index: number, value: string) {
    setLinks((current) =>
      current.map((link, i) => (i === index ? value : link)),
    );
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index));
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-10 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label={t('onboarding.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={DISPLAY_NAME_MAX_LENGTH}
          />

          <View className="gap-1.5">
            <TextField
              label={t('onboarding.nickname')}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
              error={
                nicknameFormatError
                  ? t(`onboarding.nicknameErrors.${nicknameFormatError}`)
                  : undefined
              }
            />

            {!nicknameFormatError && !nicknameUnchanged ? (
              <Text
                className={
                  available
                    ? 'text-sm text-success'
                    : taken
                      ? 'text-sm text-danger'
                      : 'text-sm text-fg-muted'
                }
              >
                {isChecking
                  ? t('onboarding.checking')
                  : available
                    ? t('onboarding.available')
                    : taken
                      ? t('onboarding.nicknameTaken')
                      : ''}
              </Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <TextField
              label={t('editProfile.bio')}
              placeholder={t('editProfile.bioPlaceholder')}
              value={bio}
              onChangeText={setBio}
              maxLength={BIO_MAX_LENGTH}
              multiline
              style={{ minHeight: 96, textAlignVertical: 'top' }}
            />

            <Text variant="muted" className="text-right text-xs">
              {bio.length}/{BIO_MAX_LENGTH}
            </Text>
          </View>

          <View className="gap-3">
            <Text variant="label">{t('editProfile.links')}</Text>

            {links.map((link, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <TextField
                  className="flex-1"
                  placeholder={t('editProfile.linkPlaceholder')}
                  value={link}
                  onChangeText={(value) => setLink(index, value)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  error={
                    linkErrors[index]
                      ? t(`editProfile.linkErrors.${linkErrors[index]}`)
                      : undefined
                  }
                />

                <Pressable
                  onPress={() => removeLink(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('editProfile.removeLink')}
                  className="h-[52px] w-10 items-center justify-center active:opacity-60"
                >
                  <Text className="text-xl text-fg-muted">×</Text>
                </Pressable>
              </View>
            ))}

            {links.length < LINKS_MAX_COUNT ? (
              <Pressable
                onPress={() => setLinks((current) => [...current, 'https://'])}
                className="self-start py-1 active:opacity-60"
              >
                <Text className="font-sans-semibold text-accent">
                  {t('editProfile.addLink')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {saveError ? (
            <Text className="text-center text-danger">{saveError}</Text>
          ) : null}

          <Button
            title={t('editProfile.save')}
            disabled={!canSave}
            loading={save.isPending}
            onPress={() => save.mutate()}
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
