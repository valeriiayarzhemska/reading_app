-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN     "finishedPrecision" "DatePrecision" NOT NULL DEFAULT 'DAY';
