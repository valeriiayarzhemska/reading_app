import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BookRowProps {
  title: string;
  authors: string[];
  coverUrl: string | null;
  subtitle?: string;
  action?: ReactNode;
}

export function BookRow({
  title,
  authors,
  coverUrl,
  subtitle,
  action,
}: BookRowProps) {
  return (
    <View style={styles.row}>
      {coverUrl ? (
        <Image source={coverUrl} style={styles.cover} contentFit="cover" />
      ) : (
        // Manual books have no cover: show the first letter instead
        <View style={[styles.cover, styles.placeholder]}>
          <Text style={styles.placeholderText}>{title.charAt(0)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.authors} numberOfLines={1}>
          {authors.join(', ')}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  cover: {
    width: 48,
    height: 70,
    borderRadius: 4,
  },
  placeholder: {
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#666',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  authors: {
    color: '#666',
  },
  subtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
});
