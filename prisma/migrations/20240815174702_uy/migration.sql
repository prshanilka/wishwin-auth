/*
  Warnings:

  - The `district` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "District" AS ENUM ('Ampara', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Colombo', 'Gampaha', 'Kalutara', 'Galle', 'Hambantota', 'Matara', 'Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya', 'Kandy', 'Matale', 'NuwaraEliya', 'Kegalle', 'Ratnapura', 'Kurunegala', 'Puttalam');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "district",
ADD COLUMN     "district" "District";
