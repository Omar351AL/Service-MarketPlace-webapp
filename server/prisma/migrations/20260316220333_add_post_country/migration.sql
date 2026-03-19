-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE INDEX "Post_country_idx" ON "Post"("country");
