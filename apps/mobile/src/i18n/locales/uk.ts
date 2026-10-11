import type { Translation } from '../types';

const uk: Translation = {
  tabs: {
    feed: 'Полиці',
    library: 'Бібліотека',
    clubs: 'Клуби',
    profile: 'Профіль',
  },
  common: {
    retry: 'Спробувати ще',
    comingSoon: 'Скоро буде',
  },
  library: {
    title: 'Бібліотека',
    bookCount_one: '{{count}} книжка',
    bookCount_few: '{{count}} книжки',
    bookCount_many: '{{count}} книжок',
    bookCount_other: '{{count}} книжки',
    addBook: '+ Додати книжку',
    empty: 'На полиці поки порожньо.',
    loadError: 'Не вдалося завантажити полицю: {{message}}',
    sections: {
      READING: 'Читаю зараз',
      WANT_TO_READ: 'Хочу прочитати',
      READ: 'Прочитано',
      ABANDONED: 'Покинуто',
    },
    progressPage: 'сторінка {{current}} з {{total}}',
    progressPageUnknownTotal: 'сторінка {{current}}',
    startedOn: 'почато {{date}}',
  },
  search: {
    title: 'Пошук',
    placeholder: 'Назва або автор',
    onShelf: 'На полиці ✓',
    add: '+ Додати',
    adding: 'Додаю…',
    alreadyOnShelf: 'Ця книжка вже на вашій полиці',
    failed: 'Пошук не вдався: {{message}}',
    nothingFound: 'Нічого не знайдено',
    pageCount_one: '{{count}} сторінка',
    pageCount_few: '{{count}} сторінки',
    pageCount_many: '{{count}} сторінок',
    pageCount_other: '{{count}} сторінки',
  },
  placeholders: {
    feed: 'Дописи читачів, на яких ви підписані.',
    clubs: 'Читацькі клуби з чатом у реальному часі.',
    profile: 'Ваша статистика, календар, цілі та налаштування.',
  },
  profile: {
    language: 'Мова',
  },
};

export default uk;
