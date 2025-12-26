import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertDeliveryOption } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useDeliveryOptions() {
  return useQuery({
    queryKey: [api.deliveryOptions.list.path],
    queryFn: async () => {
      const res = await fetch(api.deliveryOptions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch delivery options");
      return api.deliveryOptions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDeliveryOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertDeliveryOption) => {
      const res = await fetch(api.deliveryOptions.create.path, {
        method: api.deliveryOptions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create delivery option");
      return api.deliveryOptions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.deliveryOptions.list.path] });
      toast({ title: "Success", description: "Delivery option added" });
    },
  });
}
