import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";


// Hardcoded credentials
const ADMIN_USERNAME = "admin_orderflow";
const ADMIN_PASSWORD = "admin";
const ADMIN_TOKEN = "admin-token-123";

// Simple authentication middleware
const isAuthenticated: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token === ADMIN_TOKEN) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerObjectStorageRoutes(app);

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({
          token: ADMIN_TOKEN,
          user: { id: "1", username: ADMIN_USERNAME, name: "Admin" }
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    res.json({ id: "1", username: ADMIN_USERNAME, name: "Admin" });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out" });
  });

  // Menu Items
  app.get(api.menu.list.path, async (req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.get(api.menu.get.path, async (req, res) => {
    const item = await storage.getMenuItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  });

  app.post(api.menu.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.menu.create.input.parse(req.body);
      const item = await storage.createMenuItem(input);
      res.status(201).json(item);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
       }
       throw err;
    }
  });

  app.put(api.menu.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.menu.update.input.parse(req.body);
      const item = await storage.updateMenuItem(Number(req.params.id), input);
      if (!item) return res.status(404).json({ message: "Menu item not found" });
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.menu.updateStock.path, isAuthenticated, async (req, res) => {
    try {
      const { stockQuantity } = api.menu.updateStock.input.parse(req.body);
      const item = await storage.updateMenuItemStock(Number(req.params.id), stockQuantity);
      if (!item) return res.status(404).json({ message: "Menu item not found" });
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.menu.toggleAvailable.path, isAuthenticated, async (req, res) => {
    try {
      const { available } = api.menu.toggleAvailable.input.parse(req.body);
      const item = await storage.updateMenuItem(Number(req.params.id), { available });
      if (!item) return res.status(404).json({ message: "Menu item not found" });
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.delete(api.menu.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteMenuItem(Number(req.params.id));
    res.status(204).send();
  });

  // Orders
  app.get(api.orders.list.path, isAuthenticated, async (req, res) => {
    const ordersData = await storage.getOrders();
    res.json(ordersData);
  });

  app.get(api.orders.get.path, isAuthenticated, async (req, res) => {
     const order = await storage.getOrder(Number(req.params.id));
     if (!order) return res.status(404).json({ message: "Order not found" });
     res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.patch(api.orders.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
       const { status } = api.orders.updateStatus.input.parse(req.body);
       const order = await storage.updateOrderStatus(Number(req.params.id), status);
       if (!order) return res.status(404).json({ message: "Order not found" });
       res.json(order);
    } catch (err) {
       if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
       throw err;
    }
  });

  app.patch(api.orders.updatePayment.path, isAuthenticated, async (req, res) => {
    try {
       const { paymentStatus } = api.orders.updatePayment.input.parse(req.body);
       const order = await storage.updateOrderPaymentStatus(Number(req.params.id), paymentStatus);
       if (!order) return res.status(404).json({ message: "Order not found" });
       res.json(order);
    } catch (err) {
       if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
       throw err;
    }
  });

  app.post("/api/seed", isAuthenticated, async (req, res) => {
    await seedDatabase();
    res.json({ message: "Database seeded" });
  });

  seedDatabase().catch(() => {
    console.log("Database seeding will run on first request");
  });

  return httpServer;
}

async function seedDatabase() {
  try {
    const items = await storage.getMenuItems();
    if (items.length === 0) {
      console.log("Seeding database with menu items...");
      await storage.createMenuItem({
        name: "Margherita Pizza",
        description: "Fresh mozzarella, tomato, and basil",
        price: "12.99",
        imageUrl: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80",
        category: "Pizzas",
        available: true,
        stockQuantity: 20
      });
      await storage.createMenuItem({
        name: "Caesar Salad",
        description: "Crispy romaine, parmesan, croutons",
        price: "9.99",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        category: "Salads",
        available: true,
        stockQuantity: 15
      });
      await storage.createMenuItem({
        name: "Pasta Carbonara",
        description: "Egg, bacon, pecorino cheese",
        price: "14.99",
        imageUrl: "https://images.unsplash.com/photo-1612874742237-415c69f18133?w=800&q=80",
        category: "Pasta",
        available: true,
        stockQuantity: 18
      });
      await storage.createMenuItem({
        name: "Grilled Salmon",
        description: "Fresh salmon with lemon butter sauce",
        price: "18.99",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        category: "Main Courses",
        available: true,
        stockQuantity: 12
      });
      await storage.createMenuItem({
        name: "Tiramisu",
        description: "Classic Italian dessert",
        price: "6.99",
        imageUrl: "https://images.unsplash.com/photo-1571877227200-a0fb08a01a09?w=800&q=80",
        category: "Desserts",
        available: true,
        stockQuantity: 25
      });
      await storage.createMenuItem({
        name: "Iced Tea",
        description: "Refreshing iced tea",
        price: "2.99",
        imageUrl: "https://images.unsplash.com/photo-1556742055-eb5f1e59bed1?w=800&q=80",
        category: "Beverages",
        available: true,
        stockQuantity: 50
      });
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.log("Seeding will be attempted again");
  }
}
