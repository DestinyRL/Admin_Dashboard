import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronDown, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Order, OrderItem, MenuItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: (OrderItem & { menuItem: MenuItem | null })[];
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      return apiRequest.patch(`/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order updated" });
    },
    onError: () => {
      toast({ title: "Error", variant: "destructive" });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
    }: {
      orderId: number;
      paymentStatus: string;
    }) => {
      return apiRequest.patch(`/api/orders/${orderId}/payment`, {
        paymentStatus,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Payment status updated" });
    },
    onError: () => {
      toast({ title: "Error", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "preparing":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (isLoading) return <div className="p-4">Loading orders...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Kitchen Orders</h1>

      {(orders as OrderWithItems[]).length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No orders yet</p>
        </Card>
      ) : (
      <div className="space-y-3">
        {(orders as OrderWithItems[]).map((order) => (
          <Card
            key={order.id}
            className="p-4 hover-elevate cursor-pointer"
            onClick={() =>
              setExpandedOrder(
                expandedOrder === order.id ? null : order.id
              )
            }
            data-testid={`card-order-${order.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(order.status)}
                  <h3 className="font-semibold">
                    Order #{order.id} - {order.customerName}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.customerPhone} • ${Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <Badge
                    variant={
                      order.paymentStatus === "paid"
                        ? "default"
                        : "destructive"
                    }
                    data-testid={`badge-payment-${order.id}`}
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    expandedOrder === order.id ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {expandedOrder === order.id && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                        data-testid={`text-order-item-${item.menuItemId}`}
                      >
                        <span>
                          {item.menuItem?.name || "Unknown"} x{item.quantity}
                        </span>
                        <span>${Number(item.priceAtTime).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {order.specialRequests && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Notes: {order.specialRequests}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Order Status
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["pending", "accepted", "preparing", "ready", "completed"].map(
                        (s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={
                              order.status === s ? "default" : "outline"
                            }
                            onClick={() =>
                              updateStatusMutation.mutate({
                                orderId: order.id,
                                status: s,
                              })
                            }
                            data-testid={`button-status-${s}-${order.id}`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Payment
                    </label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          order.paymentStatus === "paid"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            orderId: order.id,
                            paymentStatus: "paid",
                          })
                        }
                        data-testid={`button-payment-paid-${order.id}`}
                      >
                        Mark Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updatePaymentMutation.mutate({
                            orderId: order.id,
                            paymentStatus: "failed",
                          })
                        }
                        data-testid={`button-payment-failed-${order.id}`}
                      >
                        Failed
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}

function Badge({
  children,
  variant,
  ...props
}: {
  children: React.ReactNode;
  variant?: string;
  [key: string]: any;
}) {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
        variant === "destructive"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
      }`}
      {...props}
    >
      {children}
    </span>
  );
}
