-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionBook" (
    "collectionId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CollectionBook_pkey" PRIMARY KEY ("collectionId","bookId")
);

-- CreateTable
CREATE TABLE "CollectionLike" (
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionLike_pkey" PRIMARY KEY ("userId","collectionId")
);

-- CreateIndex
CREATE INDEX "Collection_userId_createdAt_idx" ON "Collection"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionBook_bookId_idx" ON "CollectionBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionBook_collectionId_position_key" ON "CollectionBook"("collectionId", "position");

-- CreateIndex
CREATE INDEX "CollectionLike_collectionId_idx" ON "CollectionLike"("collectionId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBook" ADD CONSTRAINT "CollectionBook_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionBook" ADD CONSTRAINT "CollectionBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionLike" ADD CONSTRAINT "CollectionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionLike" ADD CONSTRAINT "CollectionLike_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
