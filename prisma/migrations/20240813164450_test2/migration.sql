/*
  Warnings:

  - The values [User,Developer] on the enum `Roles` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Roles_new" AS ENUM ('Admin', 'Student');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Roles_new" USING ("role"::text::"Roles_new");
ALTER TYPE "Roles" RENAME TO "Roles_old";
ALTER TYPE "Roles_new" RENAME TO "Roles";
DROP TYPE "Roles_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'Student';
