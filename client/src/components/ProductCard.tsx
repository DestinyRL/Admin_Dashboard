import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const inStock = product.stockQuantity > 0;

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <Card className="h-full overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
           {/* Fallback image if URL is missing or broken */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
             <ShoppingCart className="w-12 h-12 opacity-20" />
          </div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
            onError={(e) => {
              // Hide broken image, show fallback
              (e.target as HTMLImageElement).style.opacity = '0';
            }}
          />
          {!inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 backdrop-blur-sm">
              <span className="font-bold text-destructive border-2 border-destructive px-4 py-1 rounded-full uppercase tracking-widest text-sm transform -rotate-12">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{product.category}</p>
              <h3 className="font-display font-bold text-lg leading-tight line-clamp-2">{product.name}</h3>
            </div>
            <div className="text-right">
              <span className="block font-bold text-lg text-primary">${Number(product.price).toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto">
          <Button 
            className="w-full shadow-lg shadow-primary/20" 
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            {inStock ? (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add to Cart
              </>
            ) : (
              "Unavailable"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
