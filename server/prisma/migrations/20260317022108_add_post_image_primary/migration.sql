-- AlterTable
ALTER TABLE "PostImage" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PostImage_postId_isPrimary_idx" ON "PostImage"("postId", "isPrimary");
