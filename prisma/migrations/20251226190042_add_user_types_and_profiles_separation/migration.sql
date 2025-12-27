/*
  Warnings:

  - You are about to drop the column `client_id` on the `audits` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the `_MenuPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RolePermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserRoles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `menus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organization_id` to the `audits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internal_profile_id` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_role` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMINISTRADOR', 'GERENTE', 'AUDITOR');

-- DropForeignKey
ALTER TABLE "_AuditAuditors" DROP CONSTRAINT "_AuditAuditors_B_fkey";

-- DropForeignKey
ALTER TABLE "_MenuPermissions" DROP CONSTRAINT "_MenuPermissions_A_fkey";

-- DropForeignKey
ALTER TABLE "_MenuPermissions" DROP CONSTRAINT "_MenuPermissions_B_fkey";

-- DropForeignKey
ALTER TABLE "_RolePermissions" DROP CONSTRAINT "_RolePermissions_A_fkey";

-- DropForeignKey
ALTER TABLE "_RolePermissions" DROP CONSTRAINT "_RolePermissions_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserRoles" DROP CONSTRAINT "_UserRoles_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserRoles" DROP CONSTRAINT "_UserRoles_B_fkey";

-- DropForeignKey
ALTER TABLE "audits" DROP CONSTRAINT "audits_client_id_fkey";

-- DropForeignKey
ALTER TABLE "audits" DROP CONSTRAINT "audits_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "menus" DROP CONSTRAINT "menus_parent_id_fkey";

-- AlterTable
ALTER TABLE "audits" DROP COLUMN "client_id",
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "user_id",
ADD COLUMN     "internal_profile_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "current_role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "type" "UserType" NOT NULL;

-- DropTable
DROP TABLE "_MenuPermissions";

-- DropTable
DROP TABLE "_RolePermissions";

-- DropTable
DROP TABLE "_UserRoles";

-- DropTable
DROP TABLE "menus";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "roles";

-- CreateTable
CREATE TABLE "internal_profiles" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "roles" TEXT[],
    "department" TEXT,
    "employee_code" TEXT,
    "hire_date" TIMESTAMP(3),

    CONSTRAINT "internal_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_profiles" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "job_title" TEXT,
    "department" TEXT,
    "organizational_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "external_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "values" TEXT,
    "website" TEXT,
    "tax_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "internal_profiles_user_id_key" ON "internal_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_profiles_employee_code_key" ON "internal_profiles"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "external_profiles_user_id_key" ON "external_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_profiles_organizational_email_key" ON "external_profiles"("organizational_email");

-- CreateIndex
CREATE INDEX "external_profiles_organization_id_idx" ON "external_profiles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_tax_id_key" ON "organizations"("tax_id");

-- AddForeignKey
ALTER TABLE "internal_profiles" ADD CONSTRAINT "internal_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_profiles" ADD CONSTRAINT "external_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "internal_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_internal_profile_id_fkey" FOREIGN KEY ("internal_profile_id") REFERENCES "internal_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuditAuditors" ADD CONSTRAINT "_AuditAuditors_B_fkey" FOREIGN KEY ("B") REFERENCES "internal_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
