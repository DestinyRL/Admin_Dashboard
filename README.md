# OrderFlow Admin | Kitchen & Logistics Management

OrderFlow Admin is a specialized fulfillment platform designed to synchronize kitchen inventory with real-time customer ordering. It provides a centralized hub for managing the entire lifecycle of a food order, from the first click to the final delivery.

## 🥘 Key Features

- **Inventory Management:** Real-time tracking of kitchen stock levels. Automatically prevents "out of stock" orders on the customer app.
- **Order Processing:** A unified feed for incoming orders from the OrderFlow app with status updates (Pending, Cooking, Ready).
- **Logistics & Delivery Dispatch:** - Assign specific delivery methods to orders.
  - Monitor "who" is delivering "what."
  - Track delivery performance and timing.
- **Supply Alerts:** Notifications when inventory items drop below a critical threshold.

## ⚙️ Technical Architecture

- **Dashboard:** React/Vite/Tailwind for a fast, responsive admin experience.
- **App Integration:** Webhook or API-based connection to the OrderFlow Customer App.
- **Monitoring:** Live updates using WebSockets (Socket.io) to ensure the kitchen sees orders the second they are placed.

## 🛠️ Operational Setup

1. **Inventory Setup:** Log in and populate the `Inventory` section with current stock levels to enable items on the consumer app.
2. **Order Flow:**
   Incoming orders appear in the `Live Orders` tab. Change status to `Preparing` to notify the customer.
3. **Dispatch:**
   Once an order is `Ready`, select the delivery personnel or method. The system logs the timestamp for delivery tracking.

## 🚀 live link

- **URL:** https://orderflow-admin-dashboard.onrender.com/?v=21
## 📝 Roadmap
- [ ] Integration with automated thermal printers for kitchen tickets.
- [ ] AI-based ingredient forecasting based on sales history.
- [ ] Driver-specific mobile view for delivery confirmation.
