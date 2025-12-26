import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { useDeliveryOptions, useCreateDeliveryOption } from "@/hooks/use-delivery-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Truck, Clock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeliveryOptionSchema, type InsertDeliveryOption } from "@shared/schema";

export default function AdminDelivery() {
  const { data: options, isLoading } = useDeliveryOptions();
  const { mutate: createOption, isPending } = useCreateDeliveryOption();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InsertDeliveryOption>({
    resolver: zodResolver(insertDeliveryOptionSchema),
    defaultValues: {
      name: "",
      carrier: "",
      price: "0",
      estimatedDays: 1,
    }
  });

  const onSubmit = (data: InsertDeliveryOption) => {
    createOption(data, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
      }
    });
  };

  return (
    <AdminLayout title="Delivery Options">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage shipping carriers and rates.</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Option
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Delivery Option</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Option Name</Label>
                <Input {...form.register("name")} placeholder="Standard Shipping" />
              </div>
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input {...form.register("carrier")} placeholder="FedEx / UPS / DHL" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" {...form.register("price")} />
                </div>
                <div className="space-y-2">
                  <Label>Est. Days</Label>
                  <Input type="number" {...form.register("estimatedDays", { valueAsNumber: true })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Option
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {options?.map((option) => (
          <Card key={option.id} className="shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <span className="font-bold text-xl">${Number(option.price).toFixed(2)}</span>
              </div>
              <h3 className="font-bold text-lg">{option.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{option.carrier}</p>
              
              <div className="flex items-center text-sm text-muted-foreground bg-muted p-2 rounded">
                <Clock className="h-4 w-4 mr-2" />
                <span>{option.estimatedDays} {option.estimatedDays === 1 ? 'day' : 'days'} delivery</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {options?.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground">No delivery options configured.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
