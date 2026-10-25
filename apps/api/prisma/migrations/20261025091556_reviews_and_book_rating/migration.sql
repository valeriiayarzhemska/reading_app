-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "ratingAvg" DOUBLE PRECISION,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "hasSpoilers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_userBookId_key" ON "Review"("userBookId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "UserBook_bookId_idx" ON "UserBook"("bookId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Written by hand: ratings given before this migration count too. From now
-- on the app keeps these columns up to date.
UPDATE "Book" b
SET "ratingAvg" = r.avg, "ratingCount" = r.count
FROM (
  SELECT "bookId", AVG("rating") AS avg, COUNT(*)::int AS count
  FROM "UserBook"
  WHERE "rating" IS NOT NULL
  GROUP BY "bookId"
) r
WHERE b."id" = r."bookId";
