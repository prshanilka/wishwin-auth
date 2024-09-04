-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('Pending', 'Verified', 'Banned');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'Pending';
