-- CreateTable
CREATE TABLE "JtlCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "JtlParentProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vaterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productType" TEXT,
    "description" TEXT,
    "skuPrefix" TEXT,
    "categoryId" INTEGER NOT NULL,
    CONSTRAINT "JtlParentProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JtlCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JtlVariant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kindId" TEXT,
    "sku" TEXT NOT NULL,
    "color" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "image" TEXT,
    "gallery" TEXT,
    "parentId" INTEGER NOT NULL,
    CONSTRAINT "JtlVariant_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "JtlParentProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JtlCategory_handle_key" ON "JtlCategory"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "JtlParentProduct_vaterId_key" ON "JtlParentProduct"("vaterId");

-- CreateIndex
CREATE UNIQUE INDEX "JtlVariant_sku_key" ON "JtlVariant"("sku");
