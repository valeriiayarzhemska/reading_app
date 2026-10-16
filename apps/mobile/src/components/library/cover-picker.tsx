import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import {
  pickImage,
  prepareCover,
  type CoverSource,
} from '@/library/cover-image';
import { COLORS } from '@/theme/colors';

const WIDTH = 112;
const HEIGHT = 160;

interface CoverPickerProps {
  // Local file:// URI of the prepared JPEG
  uri: string | undefined;
  onChange: (uri: string | undefined) => void;
}

export function CoverPicker({ uri, onChange }: CoverPickerProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(source: CoverSource) {
    setIsMenuOpen(false);
    setError(null);

    try {
      const picked = await pickImage(source);

      if (picked.status === 'denied') {
        setError(t('addBook.cover.cameraDenied'));
      }

      if (picked.status !== 'picked') {
        return;
      }

      setIsPreparing(true);
      onChange(await prepareCover(picked.uri));
    } catch {
      setError(t('addBook.cover.failed'));
    } finally {
      setIsPreparing(false);
    }
  }

  function remove() {
    setIsMenuOpen(false);
    onChange(undefined);
  }

  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={() => setIsMenuOpen(true)}
        disabled={isPreparing}
        accessibilityRole="button"
        accessibilityLabel={
          uri ? t('addBook.cover.change') : t('addBook.cover.add')
        }
        style={{ width: WIDTH, height: HEIGHT }}
        className="items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card active:opacity-70"
      >
        {isPreparing ? (
          <ActivityIndicator color={COLORS.fg} />
        ) : uri ? (
          <Image
            source={uri}
            style={{ width: WIDTH, height: HEIGHT }}
            contentFit="cover"
          />
        ) : (
          <View className="items-center gap-1.5">
            <Feather name="camera" size={22} color={COLORS.fgMuted} />

            <Text variant="muted" className="text-xs">
              {t('addBook.cover.add')}
            </Text>
          </View>
        )}
      </Pressable>

      {error ? (
        <Text className="text-center text-sm text-danger">{error}</Text>
      ) : null}

      <Sheet
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={t('addBook.cover.title')}
      >
        <Button
          title={t('addBook.cover.takePhoto')}
          onPress={() => choose('camera')}
        />

        <Button
          title={t('addBook.cover.chooseFromLibrary')}
          variant="secondary"
          onPress={() => choose('library')}
        />

        {uri ? (
          <Pressable
            onPress={remove}
            className="items-center py-2 active:opacity-60"
          >
            <Text className="text-danger">{t('addBook.cover.remove')}</Text>
          </Pressable>
        ) : null}
      </Sheet>
    </View>
  );
}
