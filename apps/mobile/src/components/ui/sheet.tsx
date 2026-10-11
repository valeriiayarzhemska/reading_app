import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/theme/colors';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

// The library is imperative (ref.present() / ref.dismiss()); this wrapper
// gives screens a declarative open/onClose API instead.
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const wasOpen = useRef(false);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else if (wasOpen.current) {
      // Never dismiss a sheet that was never presented: the library marks it
      // DISMISSING and then silently ignores every later present()
      ref.current?.dismiss();
    }

    wasOpen.current = open;
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        style={[props.style, { backgroundColor: COLORS.backdrop }]}
        opacity={1}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      // Fires for swipe-down and backdrop taps too, keeping `open` in sync
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: COLORS.sheet, borderRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: COLORS.fgFaint, width: 40 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView
        style={{
          gap: 20,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: Math.max(bottom, 16) + 8,
        }}
      >
        {title ? (
          <View className="gap-1">
            <Text variant="heading" className="text-2xl">
              {title}
            </Text>

            {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
          </View>
        ) : null}

        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
