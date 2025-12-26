import { db } from "./db";
import {
  products, orders, orderItems,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CreateOrderRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem>;
  updateMenuItemStock(id: number, stockQuantity: number): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;

  getOrders(): Promise<(Order & { items: (OrderItem & { product: MenuItem | null })[] })[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: MenuItem | null })[] }) | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(products).orderBy(products.category);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(products).where(eq(products.id, id));
    return item;
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(products).values(insertItem).returning();
    return item;
  }

  async updateMenuItem(id: number, updates: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [item] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return item;
  }

  async updateMenuItemStock(id: number, stockQuantity: number): Promise<MenuItem> {
    const [item] = await db
      .update(products)
      .set({ stockQuantity })
      .where(eq(products.id, id))
      .returning();
    return item;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getOrders(): Promise<(Order & { items: (OrderItem & { product: MenuItem | null })[] })[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    const result = [];
    for (const order of allOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      
      const itemsWithProducts = [];
      for (const item of items) {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        itemsWithProducts.push({ ...item, product: product || null });
      }
      
      result.push({ ...order, items: itemsWithProducts });
    }
    return result;
  }

  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: MenuItem | null })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    
    const itemsWithProducts = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      itemsWithProducts.push({ ...item, product: product || null });
    }

    return { ...order, items: itemsWithProducts };
  }

  async createOrder(req: CreateOrderRequest): Promise<Order> {
    let total = 0;
    const productMap = new Map();
    
    for (const item of req.items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.menuItemId));
      if (!product) throw new Error(`Menu item ${item.menuItemId} not found`);
      if (!product.available) throw new Error(`${product.name} is not available`);
      if (product.stockQuantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
      
      productMap.set(item.menuItemId, product);
      total += Number(product.price) * item.quantity;
    }

    const [order] = await db.insert(orders).values({
      customerName: req.customerName,
      customerEmail: req.customerEmail,
      customerPhone: req.customerPhone || null,
      totalAmount: total.toString(),
      notes: req.notes,
      status: "pending",
      paymentStatus: "unpaid"
    }).returning();

    for (const item of req.items) {
      const product = productMap.get(item.menuItemId);
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.menuItemId,
        quantity: item.quantity,
        priceAtTime: product.price,
        specialRequests: item.specialRequests
      });
      
      await db.update(products)
        .set({ stockQuantity: product.stockQuantity - item.quantity })
        .where(eq(products.id, item.menuItemId));
    }

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ paymentStatus })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();
