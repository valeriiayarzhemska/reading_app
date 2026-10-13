// The source of truth: other languages are type-checked against this shape
const en = {
  tabs: {
    feed: 'Shelves',
    library: 'Library',
    clubs: 'Clubs',
    profile: 'Profile',
  },
  common: {
    retry: 'Retry',
    comingSoon: 'Coming soon',
  },
  library: {
    title: 'Library',
    bookCount_one: '{{count}} book',
    bookCount_other: '{{count}} books',
    addBook: '+ Add a book',
    empty: 'Your shelf is empty.',
    loadError: 'Could not load your shelf: {{message}}',
    sections: {
      READING: 'Reading now',
      WANT_TO_READ: 'Want to read',
      READ: 'Read',
      ABANDONED: 'Abandoned',
    },
    progressPage: 'page {{current}} of {{total}}',
    progressPageUnknownTotal: 'page {{current}}',
    startedOn: 'started {{date}}',
  },
  search: {
    title: 'Search',
    placeholder: 'Title or author',
    onShelf: 'On shelf ✓',
    add: '+ Add',
    adding: 'Adding…',
    alreadyOnShelf: 'This book is already on your shelf',
    failed: 'Search failed: {{message}}',
    nothingFound: 'Nothing found',
    pageCount_one: '{{count}} page',
    pageCount_other: '{{count}} pages',
  },
  placeholders: {
    feed: 'Posts from readers you follow.',
    clubs: 'Reading clubs with real-time chat.',
    profile: 'Your stats, calendar, goals and settings.',
  },
  profile: {
    language: 'Language',
    signOut: 'Sign out',
  },
  auth: {
    appName: 'Reading App',
    tagline: 'Track your reading, one page at a time.',
    devSection: 'Development',
    continueAs: 'Continue as {{name}}',
    providersSoon: 'Sign in with Apple and Google is coming next.',
    signInFailed: 'Could not sign in: {{message}}',
  },
};

export default en;
