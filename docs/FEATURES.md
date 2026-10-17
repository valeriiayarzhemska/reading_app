# Features & Requirements

Based on an analysis of the Readroom app screens. The design follows its visual style.

**Priorities**

| Tag | Meaning |
|---|---|
| **P0** | MVP: the app is useless without it |
| **P1** | Core experience: build right after MVP |
| **P2** | Nice to have: only if time allows |
| ✂️ | Skipped (see the end of the file) |

**Story format:** *As a reader, I want … so that …*, followed by acceptance criteria (AC) that define "done".

---

## Screen map

| Tab | Screens |
|---|---|
| **Shelves** (Полиці) | Social feed of posts, "who to read" suggestions, notifications |
| **Library** (Бібліотека) | Currently reading card, in-progress list, "want / read" tiles, search, add book, book details, reading timer |
| **Clubs** (Клуби) | My/all clubs, club chat, club info |
| **Profile** (Профіль) | Public profile ("Profile") + private stats ("Mine"): calendar, goals, achievements, collections, settings |

---

## Design notes

- **Background:** dark purple vertical gradient (deep indigo → violet).
- **Primary button:** peach → orange gradient, fully rounded, dark text.
- **Cards:** translucent, lighter purple, large radius (~20), subtle border ("glass").
- **Typography:** serif display font for titles (screen titles, book titles, big numbers); sans-serif for body text; small spaced uppercase labels ("ЗАРАЗ ЧИТАЮ", "ЦІЛІ").
- **Tab bar:** floating pill at the bottom, 4 icons with labels, the active one highlighted in peach.
- **Bottom sheets** for quick input (start session, day details, edit session).
- **Book covers** are the main visual element everywhere: lists, calendar cells, collections.

> Recreate the style with our own tokens (colors, fonts, spacing) in one theme file. Use our own app name and icon, not Readroom's branding.

---

## E1 — Design system & app shell

**DS-1 — Theme tokens** (P0)
As a developer, I want all colors, fonts, spacing and radii in one place so that screens look consistent.
- AC: `theme.ts` with colors (bg gradient, card, text primary/secondary, accent gradient), font families, spacing scale, radii.
- AC: Serif and sans fonts loaded via `expo-font`.
- 📚 Learn: design tokens, `expo-font`, `expo-linear-gradient`.

**DS-2 — Base components** (P0)
- AC: `Screen` (gradient background + safe area), `Card`, `PrimaryButton`, `SegmentedControl`, `TextField`, `BookCover`, `ProgressBar`, `ProgressRing`, `SectionLabel`.
- AC: Each component is used on at least one real screen (no unused components).

**DS-3 — App shell & navigation** (P0)
- AC: Floating tab bar with 4 tabs (Shelves, Library, Clubs, Profile). Unbuilt tabs show a "coming soon" placeholder.
- AC: Library is the default tab until the social features exist.
- 📚 Learn: Expo Router tabs + stacks, custom tab bar.

**DS-4 — Bottom sheet** (P0)
- AC: Reusable bottom sheet (used by start session, day details, edit session).
- 📚 Learn: `@gorhom/bottom-sheet` or Expo UI, gestures, Reanimated.

---

## E2 — Auth & account

**AUTH-1 — Sign in with Apple / Google** (P0)
As a reader, I want to sign in with one tap so that my library is saved to my account.
- AC: Apple (iOS) and Google sign-in; the backend verifies the provider token and issues our own JWT.
- AC: First sign-in creates `User` + `AuthAccount`; later sign-ins find the existing user.
- 📚 Learn: OAuth/OIDC, JWT access + refresh tokens, `expo-secure-store`.

**AUTH-2 — Onboarding: nickname** (P0)
- AC: After the first sign-in, pick a display name + nickname.
- AC: Nickname: Latin letters, digits, `.` and `_`, 3–30 chars, unique (checked live).

**AUTH-3 — Sign out / delete account** (P1)
- AC: Sign out clears tokens. Delete account removes all user data (required by the App Store).

---

## E3 — Library & books

**LIB-1 — Search books** (P0)
As a reader, I want to search by title or author so that I can add books quickly.
- AC: Search input with debounce (~300 ms); results show cover, title, author, page count.
- AC: Books already in my library are marked "In library ✓".
- AC: Results come from our API, which proxies Google Books / Open Library and caches books in our DB.
- 📚 Learn: debounce, React Query, external API integration, caching.

**LIB-2 — Add by ISBN** (P1)
- AC: "Not found? Add by ISBN" field; looks the book up by ISBN and opens its details.
- P2: scan the barcode with the camera.

**LIB-3 — Add book manually** (P1)
- AC: Form: title (required), author, pages, cover from gallery or camera (7:10 crop).
- AC: Manually added books are public: other readers find them in search (after Open Library / Google results) and can add them to their shelves.
- AC: If the creator deletes their account, the book stays (creator set to null).
- Before release: "Report" on hand-added books (App Store guideline 1.2 for user-generated content).
- 📚 Learn: forms + validation (react-hook-form + zod), image picker, file upload (S3/R2 presigned URL).

**LIB-4 — Shelf status** (P0)
As a reader, I want to mark a book as Want to read / Reading / Read.
- AC: Segmented control on the book screen; changing it updates the shelf instantly (optimistic update).
- AC: Setting *Reading* sets `startedAt`; setting *Read* sets `finishedAt`.

**LIB-5 — Library home** (P0)
- AC: Header with the total book count.
- AC: "Currently reading" card for the most recent book: cover, title, author, "day N" with the book, progress ring %, pages left, estimated time left, "Start session" button.
- AC: "Still in progress" horizontal list of other *Reading* books with % progress.
- AC: Tiles "N want" and "N read" with stacked covers, plus "N this year" on the read tile → open the full lists.

**LIB-6 — Book details** (P0)
- AC: Cover, title, author, publisher, series ("book 3 of …").
- AC: Stat row: pages, average rating (+ count), estimated time to finish, day N.
- AC: Status control (LIB-4), "Start reading with timer" button, edit button.
- AC: Progress bar "12% · page 92 of 768" with an "update" action (manual progress, no timer).
- AC: Total reading time for this book.
- AC: Description with "show more".
- P1: "N reading now" (other users with this book on *Reading*), similar books.

**LIB-7 — Private notes** (P2)
- AC: A "Draft" text field per book, visible only to me.

**LIB-8 — Time-left estimate** (P1)
- AC: Estimated time left = pages left ÷ my average reading speed (pages/min from my sessions). Falls back to a default speed (~1 page/min) when there's no history.
- 📚 Learn: deriving metrics from your own data.

---

## E4 — Reading timer & sessions

**TMR-1 — Start a session** (P0)
As a reader, I want to start a timer for a book so that my reading time is tracked.
- AC: Bottom sheet "From which page do you start?": format (Reading / Listening), unit (Pages / Percent), start value prefilled with the current progress.
- AC: In Percent mode, show "≈ N pages" under the input.

**TMR-2 — Timer screen** (P0)
- AC: Cover, title, author, big `00:00` timer, "page 90 · day 2 with the book", book progress bar.
- AC: Play / pause button. The minimize button returns to the app with a mini-timer still visible.
- AC: The timer keeps running when the app is backgrounded **or killed** (state stored in MMKV: book, start time, accumulated paused time).
- 📚 Learn: computing time from timestamps (never counting ticks), app state, persistence.

**TMR-3 — Finish a session** (P0)
- AC: On stop: "Which page did you stop at?" (or % / minutes for audio). Validation: end ≥ start, end ≤ total.
- AC: Saves a `ReadingSession` and updates the book progress. If progress hits 100%, offer to mark the book *Read*.

**TMR-4 — Offline & idempotent sync** (P0)
- AC: Sessions are saved locally first and synced when online.
- AC: Each session has a client-generated `clientId`; sending it twice never creates a duplicate.
- 📚 Learn: offline-first, retry queues, idempotency keys.

**TMR-5 — Log without a timer** (P1)
- AC: "Reading without a timer? Log pages" → enter minutes + pages for a date.

**TMR-6 — Quick thought during a session** (P2)
- AC: "Jot a thought" field on the timer screen, saved as a private note on the book.

**TMR-7 — "Still reading?" check** (P2)
- AC: After 1 hour, a local notification asks "Still reading?". Optional auto-stop setting.

---

## E5 — My reading: stats, calendar, goals

**STAT-1 — Totals** (P0)
- AC: Total hours read, books read, pages read.
- AC: Year stats: books this year, all-time total, average rating.

**STAT-2 — Monthly calendar** (P0)
As a reader, I want a calendar with the covers of the books I read each day.
- AC: Month grid (Mon–Sun) with covers of the books read that day (several books → split or stacked cell).
- AC: Month navigation (‹ ›) and a summary "N books this month · N pages".
- AC: Days are computed in the **user's timezone** (reading at 01:00 in Kyiv counts for that day, not the day before).
- API: `GET /me/calendar?month=2026-10`.
- 📚 Learn: SQL `GROUP BY` day, `AT TIME ZONE`, UTC vs local time.

**STAT-3 — Day details** (P0)
- AC: Tap a day → bottom sheet: books finished that day + list of sessions (book, minutes, pages).

**STAT-4 — Edit / delete a session** (P1)
- AC: Edit minutes and pages; delete the entry.
- AC: Only stats and the calendar change; the current position in the book does **not** change.

**STAT-5 — Year heatmap** (P1)
- AC: 12 small month grids, each day colored by reading intensity (minutes), with a summary "2026 · 19 books · 70 hours".
- 📚 Learn: data visualization, color scales.

**STAT-6 — Reading goal** (P1)
- AC: Create a yearly goal (number of books); progress bar "19 of 25 books" + "3 months until the end of the year".

**STAT-7 — Achievements** (P2)
- AC: Badges such as "In one sitting" (book finished in a single day), "Marathon", "4 per day", each showing the % of readers who have it.
- 📚 Learn: rule-based achievements, background jobs.

---

## E6 — Profile & social

**PRF-1 — Edit profile** (P0)
- AC: Photo (upload, or a monogram with a chosen color), name, nickname, bio (≤ 160 chars), up to 3 links (https only).

**PRF-2 — Public profile** (P1)
- AC: Avatar, name, @nickname, bio, links, follower/following counts, "Currently reading" card, "Four favorites", recently read books with ratings, reviews, collections.
- AC: Share profile (link).

**PRF-3 — Four favorites** (P1)
- AC: Choose exactly 4 books in order (tap covers to number them 1–4), shown on the profile.

**SOC-1 — Follow users** (P1)
- AC: Follow / unfollow; followers and following lists.
- P2: "Who to read" suggestions.

**SOC-2 — Rating & review** (P1)
- AC: Rate a book 1–10 and write a review; reviews are shown on the book page and my profile.
- AC: "Contains spoilers" flag: on the profile the text is hidden behind "Review with spoilers — opens on the book page".
- AC: The book's average rating is recalculated on each change.

**SOC-3 — Quotes** (P2)
- AC: Save quotes from a book (text + page); list on the book page.

---

## E7 — Collections

**COL-1 — Create a collection** (P1)
- AC: Title, description, books (add/remove/reorder). The cover is a collage of the first 4 covers.

**COL-2 — View a collection** (P1)
- AC: Collage, title, description, book count, author; book list. Like / save.

---

## E8 — Clubs (realtime chat)

**CLB-1 — Club list** (P1)
- AC: "My" / "All" toggle; each club shows its name, emoji/avatar, member count and last activity.
- AC: Create a club (name, description).

**CLB-2 — Club chat** (P1)
- AC: Realtime messages (text + photo), reply to a message (quoted preview), emoji reactions.
- AC: Paginated history (load older messages on scroll up).
- 📚 Learn: WebSockets (Socket.IO / NestJS gateways), pagination by cursor, optimistic UI.

**CLB-3 — Club info** (P1)
- AC: Description, host, member count, created date, leave button.
- P2: Quiet hours for notifications.

---

## E9 — Feed

**FEED-1 — Posts** (P2)
- AC: Write a text post; feed of posts from people I follow ("Subscriptions") or everyone ("All"); like + comment.

**FEED-2 — Notifications** (P2)
- AC: In-app notifications (new follower, like, reply) + push notifications.
- 📚 Learn: Expo push notifications, background jobs.

---

## E10 — Widgets & native

**NAT-1 — iOS Live Activity** (P1): the timer on the lock screen and in the Dynamic Island (`Text(timerInterval:)`).
**NAT-2 — iOS home screen widget** (P2): "Continue reading" with the current book and progress.
**NAT-3 — Android ongoing notification** (P1): a foreground service notification with the timer.
**NAT-4 — Android widget** (P2).
- 📚 Learn: Expo Modules API, Swift/SwiftUI, Kotlin, development builds.

---

## E11 — Settings

**SET-1 — Reading settings** (P2): no-timer mode, "Still reading?" check, auto-stop, daily reading reminder.
**SET-2 — Appearance** (P2): theme (dark/light), language (UK/EN).
**SET-3 — Import from Goodreads / StoryGraph CSV** (P2)
- 📚 Learn: CSV parsing, bulk insert, matching books by ISBN.

---

## ✂️ Skipped

| Feature | Why |
|---|---|
| PLUS subscription / paywall | Payments add a lot of complexity and teach little at this stage |
| Trends tab | Dropped entirely (no tab, no placeholder); needs lots of user data |
| Wishlist / price / "my copy" price / cart | Shopping features, not reading |
| Book types Fanfic / Samizdat | Edge case; "manual book" covers it |
| Alternative app icons, tab reordering, gendered forms of address, haptics setting | Polish; low learning value |
| Creator (BookTok) applications | Business feature |
| Bookmarking collections | Like is enough |

---

## Data model additions (beyond the Week 1 schema)

| Model | Purpose | Epic |
|---|---|---|
| `User` + `bio`, `links[]`, `monogramColor` | profile | E6 |
| `Book` + `publisher`, `description`, `seriesName`, `seriesIndex`, `isbn`, `createdById` (manual books) | book details | E3 |
| `UserBook.rating` → 1–10 (not 1–5) | the screens use /10 | E6 |
| `Review` (userBookId, text, hasSpoilers) | reviews | E6 |
| `Note` / `Quote` | private notes, quotes | E3/E6 |
| `Goal` (userId, year, targetBooks) | yearly goal | E5 |
| `Favorite` (userId, bookId, position 1–4) | four favorites | E6 |
| `Follow` (followerId, followingId) | social graph | E6 |
| `Collection`, `CollectionBook` | collections | E7 |
| `Club`, `ClubMember`, `Message`, `Reaction` | clubs | E8 |
| `Post`, `Comment`, `Like`, `Notification` | feed | E9 |
