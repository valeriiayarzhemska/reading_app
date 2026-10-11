import type en from './locales/en';

// Other languages may add plural forms English doesn't have
// (Ukrainian: book_one / book_few / book_many / book_other)
type PluralExtras = {
  [key: `${string}_${'zero' | 'two' | 'few' | 'many'}`]: string;
};

type TranslationShape<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
} & PluralExtras;

// Every key in English must exist here: a missing translation is a TS error
export type Translation = TranslationShape<typeof en>;
