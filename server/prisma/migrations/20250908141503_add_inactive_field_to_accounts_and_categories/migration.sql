-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "inactive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "inactive" BOOLEAN NOT NULL DEFAULT false;
