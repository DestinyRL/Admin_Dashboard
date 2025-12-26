import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/hooks/use-cart";
import { useDeliveryOptions } from "@/hooks/use-delivery-options";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { data: deliveryOptions, isLoading: loadingDelivery } = useDeliveryOptions();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    customerName: user ? `${user.firstName} ${user.lastName}` : "",
    customerEmail: user ? (user.email || "") : "",
    address: "",
    deliveryOptionId: 0,
  });

  const [success, setSuccess] = useState(false);

  const selectedDelivery = deliveryOptions?.find(opt => opt.id === formData.deliveryOptionId);
  const finalTotal = total + (selectedDelivery ? Number(selectedDelivery.price) : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deliveryOptionId) return;

    createOrder({
      ...formData,
      items: items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
    }, {
      onSuccess: () => {
        setSuccess(true);
        clearCart();
        setTimeout(() => setLocation("/"), 5000);
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-display font-bold text-green-700 mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground mb-8">
              Thank you for your purchase. We've sent a confirmation email to {formData.customerEmail}.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Back to Store
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      required 
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      value={formData.customerEmail}
                      onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address</Label>
                  <Input 
                    id="address" 
                    required 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Options</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDelivery ? (
                  <div className="py-4 flex justify-center"><Loader2 className="animate-spin" /></div>
                ) : (
                  <RadioGroup 
                    value={String(formData.deliveryOptionId)} 
                    onValueChange={val => setFormData({...formData, deliveryOptionId: Number(val)})}
                  >
                    {deliveryOptions?.map(option => (
                      <div key={option.id} className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                        <RadioGroupItem value={String(option.id)} id={`opt-${option.id}`} />
                        <div className="flex-1 cursor-pointer pl-2" onClick={() => setFormData({...formData, deliveryOptionId: option.id})}>
                          <div className="flex justify-between items-center mb-1">
                            <Label htmlFor={`opt-${option.id}`} className="font-semibold text-base cursor-pointer">{option.name} ({option.carrier})</Label>
                            <span className="font-bold">${Number(option.price).toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Estimated delivery: {option.estimatedDays} days</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.product.name}</span>
                      <span>${(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{selectedDelivery ? `$${Number(selectedDelivery.price).toFixed(2)}` : '--'}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Total</span>
                  <div className="text-right">
                    <span className="font-bold text-2xl text-primary">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6 h-12 text-base shadow-lg shadow-primary/25" 
                  disabled={!formData.deliveryOptionId || isPending}
                  onClick={handleSubmit}
                >
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  {isPending ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
