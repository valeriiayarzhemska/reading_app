import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { BookFormat, ProgressUnit } from '@reading/shared';

import { BookCover } from '@/components/ui/book-cover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/segmented-control';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';

import { i18n } from '@/i18n';
import { formatDate } from '@/lib/format';
import { COLORS } from '@/theme/colors';

const FORMAT_OPTIONS: SegmentOption<BookFormat>[] = [
  { value: BookFormat.PAPER, label: 'Paper' },
  { value: BookFormat.EBOOK, label: 'E-book' },
  { value: BookFormat.AUDIO, label: 'Audio' },
];

const UNIT_OPTIONS: SegmentOption<ProgressUnit>[] = [
  { value: ProgressUnit.PAGES, label: 'Pages' },
  { value: ProgressUnit.PERCENT, label: 'Percent' },
];

const SAMPLE_COVER = 'https://covers.openlibrary.org/b/id/14315081-M.jpg';

const PLURAL_SAMPLES = [1, 2, 5, 11, 21, 22, 25];
const SAMPLE_DATE = '2026-10-08T12:00:00.000Z';

// Fixed-language translators: shows both languages whatever is active
function TranslationsDemo() {
  const en = i18n.getFixedT('en');
  const uk = i18n.getFixedT('uk');

  return (
    <View className="gap-1">
      {PLURAL_SAMPLES.map((count) => (
        <View key={count} className="flex-row">
          <Text className="flex-1">{en('library.bookCount', { count })}</Text>

          <Text className="flex-1">{uk('library.bookCount', { count })}</Text>
        </View>
      ))}

      <View className="mt-2 flex-row">
        <Text variant="muted" className="flex-1">
          {formatDate(SAMPLE_DATE, 'en')}
        </Text>

        <Text variant="muted" className="flex-1">
          {formatDate(SAMPLE_DATE, 'uk')}
        </Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="label">{title}</Text>

      {children}
    </View>
  );
}

const DEMO_TOTAL_PAGES = 768;

function StartSessionSheetDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<BookFormat>(BookFormat.PAPER);
  const [unit, setUnit] = useState<ProgressUnit>(ProgressUnit.PAGES);
  const [start, setStart] = useState('90');

  const startNumber = Number(start) || 0;
  const approxPages = Math.round((startNumber / 100) * DEMO_TOTAL_PAGES);

  return (
    <>
      <Button
        title="Open “Start session” sheet"
        variant="secondary"
        onPress={() => setIsOpen(true)}
      />

      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          unit === ProgressUnit.PAGES
            ? 'Which page are you starting from?'
            : 'Which percent are you starting from?'
        }
        subtitle={`A Court of Mist and Fury · ${DEMO_TOTAL_PAGES} pages`}
      >
        <View className="gap-2">
          <Text variant="label">Format</Text>

          <SegmentedControl
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />
        </View>

        <View className="gap-2">
          <Text variant="label">Track progress in</Text>

          <SegmentedControl
            options={UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
          />
        </View>

        <View className="gap-1">
          <TextField
            inSheet
            value={start}
            onChangeText={setStart}
            keyboardType="number-pad"
          />

          {unit === ProgressUnit.PERCENT ? (
            <Text variant="muted" className="text-center">
              ≈ {approxPages} pages
            </Text>
          ) : null}
        </View>

        <Button title="Start reading" onPress={() => setIsOpen(false)} />
      </Sheet>
    </>
  );
}

export default function DesignScreen() {
  const [format, setFormat] = useState<BookFormat>(BookFormat.PAPER);
  const [unit, setUnit] = useState<ProgressUnit>(ProgressUnit.PAGES);
  const [title, setTitle] = useState('');

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-8 px-4 pb-12 pt-2">
        <Section title="Plurals & dates (EN / UK)">
          <TranslationsDemo />
        </Section>

        <Section title="Typography">
          <Text variant="title">Library</Text>

          <Text variant="heading">A Court of Mist and Fury</Text>

          <Text variant="body">Body text — Nunito Sans regular.</Text>

          <Text variant="muted">Muted text — authors, hints.</Text>

          <Text variant="label">Label · Reading now</Text>
        </Section>

        <Section title="Colors">
          <View className="flex-row flex-wrap gap-2">
            {Object.entries(COLORS).map(([name, value]) => (
              <View key={name} className="w-[30%] items-center gap-1">
                <View
                  className="h-10 w-full rounded-lg border border-border"
                  style={{ backgroundColor: value }}
                />

                <Text variant="muted" className="text-[10px]">
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Buttons">
          <Button title="Start session" onPress={() => {}} />

          <Button title="Secondary" variant="secondary" onPress={() => {}} />

          <Button title="Loading" loading onPress={() => {}} />

          <Button title="Disabled" disabled onPress={() => {}} />
        </Section>

        <Section title="Segmented control">
          <SegmentedControl
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />

          <SegmentedControl
            options={UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
          />

          <Text variant="muted">
            Selected: {format} · {unit}
          </Text>
        </Section>

        <Section title="Text field">
          <TextField
            label="Title"
            placeholder="Title of the book"
            value={title}
            onChangeText={setTitle}
          />

          <TextField
            label="Pages"
            placeholder="768"
            keyboardType="number-pad"
            error="Must be a positive number"
          />
        </Section>

        <Section title="Book covers">
          <View className="flex-row items-end gap-3">
            <BookCover uri={SAMPLE_COVER} title="Mist and Fury" size="sm" />

            <BookCover uri={SAMPLE_COVER} title="Mist and Fury" size="md" />

            <BookCover uri={SAMPLE_COVER} title="Mist and Fury" size="lg" />
          </View>

          <View className="flex-row items-end gap-3">
            <BookCover uri={null} title="fourth wing" size="sm" />

            <BookCover uri={null} title="fourth wing" size="md" />

            <BookCover uri={null} title="fourth wing" size="lg" />
          </View>
        </Section>

        <Section title="Progress">
          <ProgressBar value={0.12} />

          <ProgressBar value={0.76} />

          <View className="flex-row gap-4">
            <ProgressRing value={0.12}>
              <Text className="font-serif text-lg">12</Text>
            </ProgressRing>

            <ProgressRing value={0.43} size={80} strokeWidth={6}>
              <Text className="font-serif text-xl">43%</Text>
            </ProgressRing>

            <ProgressRing value={1}>
              <Text className="text-sm">✓</Text>
            </ProgressRing>
          </View>
        </Section>

        <Section title="Card">
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="label">Reading now</Text>

              <Text variant="label" className="text-accent">
                Day 2
              </Text>
            </View>

            <View className="flex-row gap-4">
              <BookCover uri={SAMPLE_COVER} title="Mist and Fury" size="md" />

              <View className="flex-1 gap-1">
                <Text variant="heading">A Court of Mist and Fury</Text>

                <Text variant="muted">Sarah J. Maas</Text>

                <View className="mt-2 flex-row items-center gap-3">
                  <ProgressRing value={0.12} size={52}>
                    <Text className="font-serif">12</Text>
                  </ProgressRing>

                  <Text variant="muted">678 pages left</Text>
                </View>
              </View>
            </View>

            <Button title="Start session" onPress={() => {}} />
          </Card>

          <Card strong>
            <Text>A strong card</Text>
          </Card>
        </Section>

        <Section title="Bottom sheet">
          <StartSessionSheetDemo />
        </Section>
      </ScrollView>
    </Screen>
  );
}
