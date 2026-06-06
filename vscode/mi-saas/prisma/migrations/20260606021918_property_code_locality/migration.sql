/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Property` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "locality" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");
