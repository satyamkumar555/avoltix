import { z } from "zod";

export const SKU_PATTERN = /^[A-Z]{3}-[A-Z]{2,4}-[A-Z]{2,4}-\d{4}$/; // e.g. AVX-DEV-ARD-0001

export const productSchema = z
  .object({
    sku: z.string().regex(SKU_PATTERN, "SKU format: AVX-DEV-ARD-0001"),
    name: z.string().min(2).max(160),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    shortDescription: z.string().max(300).default(""),
    categoryId: z.string().min(1),
    brand: z.string().optional(),
    mpn: z.string().optional(),
    price: z.number().int().positive(), // paise
    mrp: z.number().int().positive(), // paise
    stock: z.number().int().min(0),
    reserved: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).default(5),
    minOrderQty: z.number().int().min(1).default(1),
    status: z.enum(["draft", "published", "archived"]),
    thumbnail: z.string().url().optional(),
  })
  .refine((p) => p.price <= p.mrp, { message: "Selling price cannot exceed MRP", path: ["price"] });

export type ProductInput = z.infer<typeof productSchema>;
export type Product = ProductInput & { id: string };

/** Stock status is derived from inventory, never entered manually. */
export function stockStatus(p: Pick<Product, "stock" | "reserved" | "lowStockThreshold">) {
  const available = p.stock - p.reserved;
  if (available <= 0) return "out_of_stock" as const;
  if (available <= p.lowStockThreshold) return "low_stock" as const;
  return "in_stock" as const;
}
