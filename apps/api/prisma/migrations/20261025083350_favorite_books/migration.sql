-- CreateTable
CREATE TABLE "FavoriteBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "FavoriteBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteBook_userBookId_key" ON "FavoriteBook"("userBookId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteBook_userId_position_key" ON "FavoriteBook"("userId", "position");

-- AddForeignKey
ALTER TABLE "FavoriteBook" ADD CONSTRAINT "FavoriteBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteBook" ADD CONSTRAINT "FavoriteBook_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
