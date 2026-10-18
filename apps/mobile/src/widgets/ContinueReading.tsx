import {
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  aspectRatio,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  resizable,
  tint,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Saved by iOS with the snapshot and drawn even when the app is closed.
// Texts arrive translated: the widget can't use the app's i18n.
export interface ContinueReadingProps {
  // null: nothing on the Reading shelf, the widget invites to start
  userBookId: string | null;
  title: string;
  author: string;
  coverPath: string | null;
  // 0–1, null when the book's length is unknown
  fraction: number | null;
  // "page 92 of 828"
  progressLabel: string;
  // "≈ 8 h 20 min", null until there's a reading speed
  timeLeftLabel: string | null;
  // "READING NOW"
  headerLabel: string;
  emptyTitle: string;
  emptyText: string;
}

// The home screen widget, compiled into the widget extension by the
// 'widget' directive (same rules as the Live Activity: nothing from outside
// the function and no comments inside it, since it becomes a one-line string).
// Sizes: systemSmall (cover, title, progress) and systemMedium (the
// "Reading now" card). A tap opens the book, or the app when it's empty.
const ContinueReading = (
  props: ContinueReadingProps,
  environment: WidgetEnvironment,
) => {
  'widget';

  const accent = '#F0A877';
  const fg = '#F4EFFF';
  const muted = '#B9AEDB';
  const isSmall = environment.widgetFamily === 'systemSmall';
  const url = props.userBookId
    ? `readingapp://book/${props.userBookId}`
    : 'readingapp://';
  const container = [containerBackground('#1A1333', 'widget'), widgetURL(url)];

  const cover = (width: number, height: number) =>
    props.coverPath ? (
      <Image
        uiImage={props.coverPath}
        modifiers={[
          resizable(),
          aspectRatio({ contentMode: 'fill' }),
          frame({ width, height }),
          clipShape('roundedRectangle', 6),
        ]}
      />
    ) : (
      <Image
        systemName="book.closed.fill"
        size={width * 0.5}
        color={accent}
        modifiers={[frame({ width, height })]}
      />
    );

  const percent =
    props.fraction === null ? '' : `${Math.round(props.fraction * 100)}%`;

  if (!props.userBookId) {
    return (
      <VStack spacing={6} modifiers={container}>
        <Image systemName="book.closed.fill" size={28} color={accent} />

        <Text
          modifiers={[
            font({ weight: 'semibold', size: 15 }),
            foregroundStyle(fg),
          ]}
        >
          {props.emptyTitle}
        </Text>

        <Text
          modifiers={[font({ size: 12 }), lineLimit(3), foregroundStyle(muted)]}
        >
          {props.emptyText}
        </Text>
      </VStack>
    );
  }

  if (isSmall) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={container}>
        <HStack>
          {cover(40, 58)}

          <Spacer />

          <Text
            modifiers={[
              font({ design: 'serif', size: 22 }),
              foregroundStyle(fg),
            ]}
          >
            {percent}
          </Text>
        </HStack>

        <Spacer />

        <Text
          modifiers={[
            font({ weight: 'semibold', size: 13 }),
            lineLimit(2),
            foregroundStyle(fg),
          ]}
        >
          {props.title}
        </Text>

        {props.fraction === null ? null : (
          <ProgressView value={props.fraction} modifiers={[tint(accent)]} />
        )}
      </VStack>
    );
  }

  return (
    <HStack spacing={14} modifiers={container}>
      {cover(72, 106)}

      <VStack alignment="leading" spacing={4}>
        <Text
          modifiers={[
            font({ weight: 'bold', size: 10 }),
            foregroundStyle(accent),
          ]}
        >
          {props.headerLabel}
        </Text>

        <Text
          modifiers={[
            font({ design: 'serif', weight: 'semibold', size: 17 }),
            lineLimit(2),
            foregroundStyle(fg),
          ]}
        >
          {props.title}
        </Text>

        <Text
          modifiers={[font({ size: 12 }), lineLimit(1), foregroundStyle(muted)]}
        >
          {props.author}
        </Text>

        <Spacer />

        {props.fraction === null ? null : (
          <ProgressView value={props.fraction} modifiers={[tint(accent)]} />
        )}

        <HStack>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
            {props.progressLabel}
          </Text>

          <Spacer />

          <Text modifiers={[font({ size: 11 }), foregroundStyle(muted)]}>
            {props.timeLeftLabel ?? percent}
          </Text>
        </HStack>
      </VStack>
    </HStack>
  );
};

export default createWidget('ContinueReading', ContinueReading);
