import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload"; // Updated import name
import { Plus, Edit2, Trash2, X, Upload, AlertCircle } from "lucide-react";
import type { MenuItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Soups", "Rice & Grains", "Proteins", "Sides", "Swallows", "Snacks", "Desserts", "Beverages"];

interface FormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  available: boolean;
  stockQuantity: number;
  sku: string;
}

export default function AdminInventoryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
    available: true,
    stockQuantity: 0,
    sku: "",
  });

  // REMOVED: const [uploadingImage, setUploadingImage] = useState(false);
  // The line above was causing the "Already Declared" error.

  const { uploadFile, isUploading: uploadingImage } = useCloudinaryUpload({
    onSuccess: (url) => {
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast({ title: "Image uploaded successfully" });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/menu"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const sku = data.sku || data.name.toLowerCase().replace(/\s+/g, "-");
      return apiRequest("POST", "/api/menu", {
        ...data,
        sku,
        stockQuantity: parseInt(data.stockQuantity.toString()),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/menu"] });
      resetForm();
      setIsAddDialogOpen(false);
      toast({ title: "Product added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!editingItem) throw new Error("No item selected");
      const { sku, ...updateData } = data;
      return apiRequest("PUT", `/api/menu/${editingItem.id}`, {
        ...updateData,
        stockQuantity: parseInt(data.stockQuantity.toString()),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/menu"] });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/menu"] });
      setDeleteConfirmId(null);
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
      available: true,
      stockQuantity: 0,
      sku: "",
    });
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      imageUrl: item.imageUrl,
      category: item.category,
      available: item.available,
      stockQuantity: item.stockQuantity,
      sku: item.sku,
    });
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Call the hook function directly
    await uploadFile(file);
  };

  const handleSubmitAdd = () => {
    if (!formData.name || !formData.description || !formData.price || !formData.imageUrl || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including image",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = () => {
    if (!formData.name || !formData.description || !formData.price || !formData.imageUrl || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  const groupedByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Inventory Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">Manage your food menu items and stock levels</p>
          </div>
          <Button
            onClick={handleAddClick}
            size="lg"
            className="gap-2 w-full md:w-auto"
            data-testid="button-add-product"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Button>
        </div>

        {Object.entries(groupedByCategory).length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Button onClick={handleAddClick} variant="outline">
              Add your first product
            </Button>
          </Card>
        ) : (
          Object.entries(groupedByCategory).map(([category, categoryItems]) => (
            <div key={category} className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover-elevate transition-all"
                    data-testid={`card-inventory-${item.id}`}
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 md:p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-xl md:text-2xl font-bold text-primary">
                            ₦{Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Stock</p>
                          <p className={`text-xl md:text-2xl font-bold ${
                            item.stockQuantity === 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                          }`}>
                            {item.stockQuantity}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.available ? "bg-green-500" : "bg-red-500"
                        }`} />
                        <span className="text-sm font-medium">
                          {item.available ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditClick(item)}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs md:text-sm"
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirmId(item.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs md:text-sm text-destructive hover:text-destructive"
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new menu item for your inventory</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name *</label>
              <Input
                placeholder="e.g., Margherita Pizza"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description *</label>
              <Textarea
                placeholder="e.g., Fresh mozzarella, tomato, and basil"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Price (₦) *</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="2500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  data-testid="input-price"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Qty *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="20"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  data-testid="input-stock"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category *</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Product Image *</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  data-testid="input-image-file"
                />
              </label>
              {formData.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden bg-muted">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
              {uploadingImage && <p className="text-xs text-muted-foreground mt-2">Uploading...</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available-add"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="rounded"
                data-testid="input-available"
              />
              <label htmlFor="available-add" className="text-sm font-medium">
                Available for purchase
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={createMutation.isPending || uploadingImage}
              data-testid="button-submit-add"
            >
              {createMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name *</label>
              <Input
                placeholder="e.g., Margherita Pizza"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description *</label>
              <Textarea
                placeholder="e.g., Fresh mozzarella, tomato, and basil"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
                data-testid="input-edit-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Price (₦) *</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="2500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  data-testid="input-edit-price"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Qty *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="20"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-stock"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category *</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Product Image *</label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to change image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  data-testid="input-edit-image-file"
                />
              </label>
              {formData.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden bg-muted">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
              {uploadingImage && <p className="text-xs text-muted-foreground mt-2">Uploading...</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="available" className="text-sm font-medium">
                Available for purchase
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending || uploadingImage}
              data-testid="button-submit-edit"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
