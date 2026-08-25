CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');

CREATE TABLE "FeedbackPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FeedbackPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedbackComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FeedbackComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeedbackPost_status_updatedAt_idx" ON "FeedbackPost"("status", "updatedAt");
CREATE INDEX "FeedbackPost_authorId_createdAt_idx" ON "FeedbackPost"("authorId", "createdAt");
CREATE INDEX "FeedbackComment_postId_createdAt_idx" ON "FeedbackComment"("postId", "createdAt");

ALTER TABLE "FeedbackPost" ADD CONSTRAINT "FeedbackPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackComment" ADD CONSTRAINT "FeedbackComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedbackPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackComment" ADD CONSTRAINT "FeedbackComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
