-- Single-store clean-up: SAMRUX sells directly, so the seller, payout,
-- commission and review tables from the original schema are removed.

-- DropForeignKey
ALTER TABLE "Seller" DROP CONSTRAINT "Seller_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "SellerVerification" DROP CONSTRAINT "SellerVerification_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "SellerFollow" DROP CONSTRAINT "SellerFollow_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "SellerFollow" DROP CONSTRAINT "SellerFollow_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_payoutId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_authorId_fkey";

-- DropForeignKey
ALTER TABLE "MessageThread" DROP CONSTRAINT "MessageThread_sellerId_fkey";

-- DropIndex
DROP INDEX "Product_sellerId_idx";

-- DropIndex
DROP INDEX "OrderLine_sellerId_idx";

-- DropIndex
DROP INDEX "MessageThread_sellerId_updatedAt_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "sellerId";

-- AlterTable
ALTER TABLE "OrderLine" DROP COLUMN "sellerId",
DROP COLUMN "sellerName";

-- AlterTable
ALTER TABLE "MessageThread" DROP COLUMN "sellerId";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "readBySeller",
ADD COLUMN     "readBySupport" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Seller";

-- DropTable
DROP TABLE "SellerVerification";

-- DropTable
DROP TABLE "SellerFollow";

-- DropTable
DROP TABLE "LedgerEntry";

-- DropTable
DROP TABLE "Payout";

-- DropTable
DROP TABLE "CommissionRule";

-- DropTable
DROP TABLE "Review";

