import {
  Button,
  HStack,
  Image,
  Link,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  aspectRatio,
  background,
  buttonStyle,
  clipShape,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  resizable,
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
  // file:// path of the cover in the shared App Group folder: the widget
  // runs in its own process and can't read the app's files or the network
  coverPath: string | null;
}

// Button targets, reported to the app by addUserInteractionListener
export const TOGGLE_TARGET = 'toggle';
// The stop button opens the app: finishing asks for the end page
export const FINISH_URL = 'readingapp://timer?finish=1';

// The layout iOS draws on the Lock Screen and in the Dynamic Island. The
// 'widget' directive makes expo-widgets compile it into the widget extension:
// it runs inside iOS, not in our app, so no hooks, nothing from outside the
// function (colors and the URL are written out inside it).
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

  const isPaused = props.pausedAtMs !== null;
  const accent = environment.isLuminanceReduced ? '#FFFFFF' : '#F0A877';
  const fg = '#F4EFFF';
  const muted = '#B9AEDB';
  const timerInterval = {
    lower: new Date(props.timerStartMs),
    upper: new Date(props.timerStartMs + 24 * 60 * 60 * 1000),
  };
  const pauseTime = isPaused ? new Date(props.pausedAtMs ?? 0) : undefined;

  const timer = (size: number, color: string) => (
    <Text
      timerInterval={timerInterval}
      countsDown={false}
      pauseTime={pauseTime}
      modifiers={[
        font({ design: 'serif', weight: 'light', size }),
        monospacedDigit(),
        foregroundStyle(color),
      ]}
    />
  );

  const cover = (width: number, height: number) =>
    props.coverPath ? (
      <Image
        uiImage={props.coverPath}
        modifiers={[
          resizable(),
          aspectRatio({ contentMode: 'fill' }),
          frame({ width, height }),
          clipShape('roundedRectangle', 5),
        ]}
      />
    ) : (
      <Image
        systemName="book.closed.fill"
        size={width * 0.6}
        color={accent}
        modifiers={[frame({ width, height })]}
      />
    );

  const circleButton = (icon: 'play.fill' | 'pause.fill' | 'stop.fill') => (
    <Image
      systemName={icon}
      size={15}
      color={fg}
      modifiers={[
        frame({ width: 40, height: 40 }),
        background('#FFFFFF26'),
        clipShape('circle'),
      ]}
    />
  );

  const progress = (
    <VStack spacing={4}>
      {props.fraction === null ? null : (
        <ProgressView value={props.fraction} modifiers={[tint(accent)]} />
      )}

      <HStack>
        <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>
          {props.progressLabel}
        </Text>

        <Spacer />

        {props.fraction === null ? null : (
          <Text modifiers={[font({ size: 13 }), foregroundStyle(muted)]}>
            {`${Math.round(props.fraction * 100)}%`}
          </Text>
        )}
      </HStack>
    </VStack>
  );

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          padding({ horizontal: 16, vertical: 12 }),
          activityBackgroundTint('#1A1333E6'),
        ]}
      >
        <HStack spacing={12}>
          {cover(36, 52)}

          <VStack alignment="leading" spacing={3}>
            <Text
              modifiers={[
                font({ weight: 'bold', size: 17 }),
                lineLimit(1),
                foregroundStyle(fg),
              ]}
            >
              {props.title}
            </Text>

            <Text
              modifiers={[
                font({ size: 14 }),
                lineLimit(1),
                foregroundStyle(muted),
              ]}
            >
              {props.author}
            </Text>
          </VStack>

          <Spacer />

          <Button target="toggle" modifiers={[buttonStyle('plain')]}>
            {circleButton(isPaused ? 'play.fill' : 'pause.fill')}
          </Button>

          <Link destination="readingapp://timer?finish=1">
            {circleButton('stop.fill')}
          </Link>
        </HStack>

        {timer(38, '#DCD4EE')}

        {progress}
      </VStack>
    ),
    compactLeading: (
      <Image
        systemName={isPaused ? 'pause.fill' : 'book.closed.fill'}
        color={accent}
      />
    ),
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
    minimal: (
      <Image
        systemName={isPaused ? 'pause.fill' : 'book.closed.fill'}
        color={accent}
      />
    ),
    expandedLeading: cover(36, 52),
    expandedTrailing: (
      <HStack spacing={8}>
        <Button target="toggle" modifiers={[buttonStyle('plain')]}>
          {circleButton(isPaused ? 'play.fill' : 'pause.fill')}
        </Button>

        <Link destination="readingapp://timer?finish=1">
          {circleButton('stop.fill')}
        </Link>
      </HStack>
    ),
    expandedCenter: (
      <VStack alignment="leading" spacing={2}>
        <Text
          modifiers={[
            font({ weight: 'semibold', size: 15 }),
            lineLimit(1),
            foregroundStyle(fg),
          ]}
        >
          {props.title}
        </Text>

        {timer(28, fg)}
      </VStack>
    ),
    expandedBottom: progress,
  };
};

export default createLiveActivity('ReadingActivity', ReadingActivity);
