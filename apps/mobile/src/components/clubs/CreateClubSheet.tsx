import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  CLUB_COLORS,
  CLUB_DESCRIPTION_MAX,
  CLUB_NAME_MAX,
  type ClubColor,
  type ClubDetail,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useCreateClub } from '@/api/clubs';
import { cn } from '@/lib/cn';

interface CreateClubSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (club: ClubDetail) => void;
}

export function CreateClubSheet({
  open,
  onClose,
  onCreated,
}: CreateClubSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ClubColor>(CLUB_COLORS[0]);
  const [wasOpen, setWasOpen] = useState(open);
  const create = useCreateClub();

  // Every open starts a new room from scratch
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setName('');
      setDescription('');
      setColor(CLUB_COLORS[0]);
      create.reset();
    }
  }

  function submit() {
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        color,
      },
      { onSuccess: onCreated },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('clubs.create.title')}
      subtitle={t('clubs.create.hint')}
    >
      <TextField
        inSheet
        value={name}
        onChangeText={setName}
        placeholder={t('clubs.create.name')}
        maxLength={CLUB_NAME_MAX}
      />

      <TextField
        inSheet
        value={description}
        onChangeText={setDescription}
        placeholder={t('clubs.create.description')}
        maxLength={CLUB_DESCRIPTION_MAX}
        multiline
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <View className="gap-2">
        <Text variant="label">{t('clubs.create.color')}</Text>

        <View accessibilityRole="radiogroup" className="flex-row gap-3">
          {CLUB_COLORS.map((swatch) => (
            <Pressable
              key={swatch}
              onPress={() => setColor(swatch)}
              accessibilityRole="radio"
              accessibilityState={{ selected: swatch === color }}
              className={cn(
                'h-11 w-11 rounded-full active:opacity-70',
                swatch === color && 'border-[3px] border-white',
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </View>
      </View>

      {create.error ? (
        <Text className="text-center text-danger">{create.error.message}</Text>
      ) : null}

      <Button
        title={t('clubs.create.submit')}
        disabled={name.trim() === ''}
        loading={create.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}
