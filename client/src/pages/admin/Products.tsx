import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, type Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";

export default function AdminProducts() {
  const { data: products, isLoading } = useProducts();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      sku: "",
      stockQuantity: 0,
      imageUrl: "",
      category: "",
    }
  });

  const onSubmit = (data: InsertProduct) => {
    if (editingProduct) {
      updateProduct({ id: editingProduct.id, ...data }, {
        onSuccess: () => {
          setIsOpen(false);
          setEditingProduct(null);
          form.reset();
        }
      });
    } else {
      createProduct(data, {
        onSuccess: () => {
          setIsOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
      category: product.category,
    });
    setIsOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    form.reset({
      name: "",
      description: "",
      price: "",
      sku: "",
      stockQuantity: 0,
      imageUrl: "",
      category: "",
    });
    setIsOpen(true);
  };

  return (
    <AdminLayout title="Inventory Management">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage your product catalog and stock levels.</p>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} placeholder="Product Name" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input {...form.register("sku")} placeholder="SKU-123" />
                  {form.formState.errors.sku && <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...form.register("description")} placeholder="Product description..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" {...form.register("price")} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" {...form.register("stockQuantity", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input {...form.register("category")} placeholder="Electronics" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="space-y-3">
                  <CloudinaryUploader
                    onUpload={(url) => form.setValue("imageUrl", url)}
                    disabled={isCreating || isUpdating}
                  />
                  <div className="text-xs text-muted-foreground">
                    Or paste an image URL:
                  </div>
                  <div className="flex gap-2">
                    <Input {...form.register("imageUrl")} placeholder="https://..." />
                    {form.watch("imageUrl") && (
                      <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border">
                        <img src={form.watch("imageUrl")} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="relative h-48 bg-muted">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                  SKU: {product.sku}
                </div>
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                  <span className="font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground">{product.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.stockQuantity > 10 ? "bg-green-100 text-green-700" : 
                    product.stockQuantity > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {product.stockQuantity} in stock
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="h-3 w-3 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Are you sure you want to delete this product?")) {
                      deleteProduct(product.id);
                    }
                  }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
