import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniTimer, MINI_TIMER_HEIGHT } from '@/components/timer/mini-timer';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';
import { useActiveSession } from '@/timer/use-active-session';

type IconName = ComponentProps<typeof Feather>['name'];

const ICONS: Record<string, IconName> = {
  feed: 'layers',
  index: 'book-open',
  clubs: 'message-circle',
  profile: 'user',
};

const BAR_HEIGHT = 64;
const BAR_GAP = 12;

// The bar floats over the content, so scrollable screens pad their bottom by this
export function useTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  const { session } = useActiveSession();
  const miniTimer = session ? MINI_TIMER_HEIGHT + BAR_GAP / 2 : 0;

  return Math.max(bottom, BAR_GAP) + BAR_HEIGHT + BAR_GAP + miniTimer;
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-4 right-4 gap-1.5"
      style={{ bottom: Math.max(bottom, BAR_GAP) }}
    >
      <MiniTimer />

      <View
        accessibilityRole="tablist"
        className="flex-row items-center rounded-full border border-border bg-tab-bar px-2"
        style={{ height: BAR_HEIGHT }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;

          function onPress() {
            // Emitted first so a screen can intercept it (e.g. scroll to top)
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              className="flex-1 items-center gap-0.5"
            >
              <View
                className={cn(
                  'h-8 w-12 items-center justify-center rounded-full',
                  isFocused && 'bg-accent/20',
                )}
              >
                <Feather
                  name={ICONS[route.name] ?? 'circle'}
                  size={20}
                  color={isFocused ? COLORS.accent : COLORS.fgFaint}
                />
              </View>

              <Text
                className={cn(
                  'text-[10px]',
                  isFocused
                    ? 'font-sans-bold text-accent'
                    : 'font-sans text-fg-faint',
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
