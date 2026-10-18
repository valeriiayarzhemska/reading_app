import {
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

// Sent to iOS as JSON, so dates travel as epoch milliseconds
export interface ReadingActivityProps {
  title: string;
  author: string;
  // startedAt + all finished pauses: counting up from here gives the reading
  // time, the same math as the in-app timer
  timerStartMs: number;
  // Set while paused: the timer shows the time at this moment and stops
  pausedAtMs: number | null;
  // "164 / 896", "12%", "45 min"
  progressLabel: string;
  // 0–1, null when the book's length is unknown
  fraction: number | null;
}

// The layout iOS draws on the Lock Screen and in the Dynamic Island. The
// 'widget' directive makes expo-widgets compile it into the widget extension:
// it runs inside iOS, not in our app, so no hooks, no imports used inside,
// nothing from outside the function (colors are written out here).
// The seconds tick on their own: SwiftUI's timer text counts from
// timerStartMs, so the app doesn't need to send updates every second. The
// timer's upper end is a day later: the API rejects longer sessions anyway.
// No comments INSIDE the function: it's turned into a one-line string, where
// a // comment would cut off everything after it.
const ReadingActivity = (
  props: ReadingActivityProps,
  environment: LiveActivityEnvironment,
) => {
  'widget';

  const accent = environment.isLuminanceReduced ? '#FFFFFF' : '#F0A877';
  const muted = '#B9AEDB';
  const timerInterval = {
    lower: new Date(props.timerStartMs),
    upper: new Date(props.timerStartMs + 24 * 60 * 60 * 1000),
  };
  const pauseTime =
    props.pausedAtMs === null ? undefined : new Date(props.pausedAtMs);
  const icon = props.pausedAtMs === null ? 'book.fill' : 'pause.fill';

  const timer = (size: number) => (
    <Text
      timerInterval={timerInterval}
      countsDown={false}
      pauseTime={pauseTime}
      modifiers={[
        font({ design: 'serif', size }),
        monospacedDigit(),
        foregroundStyle('#F4EFFF'),
      ]}
    />
  );

  const progress = (
    <VStack spacing={4}>
      {props.fraction === null ? null : (
        <ProgressView value={props.fraction} modifiers={[tint(accent)]} />
      )}

      <HStack>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
          {props.progressLabel}
        </Text>

        <Spacer />

        {props.fraction === null ? null : (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>
            {`${Math.round(props.fraction * 100)}%`}
          </Text>
        )}
      </HStack>
    </VStack>
  );

  return {
    banner: (
      <VStack spacing={10} modifiers={[padding({ all: 16 })]}>
        <HStack spacing={12}>
          <Image systemName={icon} size={26} color={accent} />

          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({ weight: 'semibold', size: 16 }),
                lineLimit(1),
                foregroundStyle('#F4EFFF'),
              ]}
            >
              {props.title}
            </Text>

            <Text
              modifiers={[
                font({ size: 13 }),
                lineLimit(1),
                foregroundStyle(muted),
              ]}
            >
              {props.author}
            </Text>
          </VStack>

          <Spacer />
        </HStack>

        <HStack>
          {timer(34)}

          <Spacer />
        </HStack>

        {progress}
      </VStack>
    ),
    compactLeading: <Image systemName={icon} color={accent} />,
    compactTrailing: (
      <Text
        timerInterval={timerInterval}
        countsDown={false}
        pauseTime={pauseTime}
        modifiers={[
          font({ size: 14 }),
          monospacedDigit(),
          frame({ width: 52 }),
          foregroundStyle(accent),
        ]}
      />
    ),
    minimal: <Image systemName={icon} color={accent} />,
    expandedLeading: <Image systemName={icon} size={24} color={accent} />,
    expandedTrailing: timer(22),
    expandedCenter: (
      <Text modifiers={[font({ weight: 'semibold', size: 15 }), lineLimit(1)]}>
        {props.title}
      </Text>
    ),
    expandedBottom: progress,
  };
};

export default createLiveActivity('ReadingActivity', ReadingActivity);
