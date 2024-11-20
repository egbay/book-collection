/*
  Warnings:

  - The `rating` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "rating",
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Review"
ADD CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5);

-- DropEnum
DROP TYPE "Rating";
