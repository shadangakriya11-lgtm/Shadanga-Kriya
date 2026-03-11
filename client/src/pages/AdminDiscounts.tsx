import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Percent, Calendar, Tag, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { getCachedToken } from '@/lib/api';
import { useCourses } from '@/hooks/useApi';

interface DiscountCode {
  id: string;
  code: string;
  discount_percent: number;
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  max_usage: number | null;
  created_by_name: string;
  course_count: number;
  courses: Array<{ id: string; title: string; price: number }>;
  created_at: string;
}

export default function AdminDiscounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '',
    expiresAt: '',
    courseIds: [] as string[],
    maxUsage: '',
  });

  const queryClient = useQueryClient();

  // Fetch all courses for selection
  const { data: coursesData } = useCourses({ noPagination: 'true' });
  const allCourses = coursesData?.courses || [];

  // Fetch discount codes
  const { data: discountsData, isLoading } = useQuery({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts?includeExpired=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch discount codes');
      return response.json();
    },
  });

  // Create discount code
  const createDiscount = useMutation({
    mutationFn: async (data: any) => {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create discount code');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code created successfully',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update discount code
  const updateDiscount = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update discount code');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code updated successfully',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete discount code
  const deleteDiscount = useMutation({
    mutationFn: async (id: string) => {
      const token = getCachedToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/discounts/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to delete discount code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      toast({
        title: 'Success',
        description: 'Discount code deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete discount code',
        variant: 'destructive',
      });
    },
  });

  const discountCodes: DiscountCode[] = discountsData?.discountCodes || [];

  // Helper function to check if discount is expired
  const isExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

  // Filter by search query
  const searchFiltered = discountCodes.filter((discount) =>
    discount.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate active and expired codes
  const activeDiscounts = searchFiltered.filter((discount) => !isExpired(discount.expires_at));
  const expiredDiscounts = searchFiltered.filter((discount) => isExpired(discount.expires_at));

  // Debug log to see what's happening
  console.log('Total discount codes:', discountCodes.length);
  console.log('Active discounts:', activeDiscounts.length);
  console.log('Expired discounts:', expiredDiscounts.length);
  if (discountCodes.length > 0) {
    console.log('Sample discount:', discountCodes[0]);
  }

  // Combine: active first, then expired
  const filteredDiscounts = [...activeDiscounts, ...expiredDiscounts];

  const handleOpenDialog = (discount?: DiscountCode) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        discountPercent: discount.discount_percent.toString(),
        expiresAt: new Date(discount.expires_at).toISOString().slice(0, 16),
        courseIds: discount.courses?.map(c => c.id) || [],
        maxUsage: discount.max_usage?.toString() || '',
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        discountPercent: '',
        expiresAt: '',
        courseIds: [],
        maxUsage: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDiscount(null);
    setFormData({
      code: '',
      discountPercent: '',
      expiresAt: '',
      courseIds: [],
      maxUsage: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.discountPercent || !formData.expiresAt || formData.courseIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one course',
        variant: 'destructive',
      });
      return;
    }

    const discountPercent = parseFloat(formData.discountPercent);
    
    if (isNaN(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      toast({
        title: 'Validation Error',
        description: 'Discount percentage must be between 0.01 and 100',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      code: formData.code.toUpperCase(),
      discountPercent: discountPercent,
      expiresAt: new Date(formData.expiresAt).toISOString(),
      courseIds: formData.courseIds,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
    };

    if (editingDiscount) {
      updateDiscount.mutate({ id: editingDiscount.id, data });
    } else {
      createDiscount.mutate(data);
    }
  };

  const handleDeleteDiscount = (id: string) => {
    if (confirm('Are you sure you want to delete this discount code?')) {
      deleteDiscount.mutate(id);
    }
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="lg:ml-64">
        <AdminHeader title="Discount Codes" subtitle="Manage course discount codes" />
        
        <main className="p-4 lg:p-6">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discount codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Discount Code
            </Button>
          </div>

          {/* Discount Codes List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No discount codes found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Discount Codes */}
              {activeDiscounts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    Active Codes ({activeDiscounts.length})
                  </h3>
                  <div className="grid gap-4">
                    {activeDiscounts.map((discount) => {
                      const expired = isExpired(discount.expires_at);
                      
                      return (
                        <div
                          key={discount.id}
                          className="bg-card rounded-xl border border-border/50 p-5 shadow-soft"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg text-foreground">{discount.code}</h3>
                                <Badge variant={expired ? 'locked' : discount.is_active ? 'active' : 'pending'}>
                                  {expired ? 'Expired' : discount.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Percent className="h-4 w-4" />
                                  <span>{discount.discount_percent}% off</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Expires: {new Date(discount.expires_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-4 w-4" />
                                  <span>{discount.course_count} course{discount.course_count !== 1 ? 's' : ''}</span>
                                </div>
                                {discount.max_usage && (
                                  <div>
                                    <span>Used: {discount.usage_count}/{discount.max_usage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(discount)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDiscount(discount.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {discount.courses && discount.courses.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-2">Applicable Courses:</p>
                              <div className="flex flex-wrap gap-2">
                                {discount.courses.map((course) => (
                                  <Badge key={course.id} variant="outline" className="text-xs">
                                    {course.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expired Discount Codes */}
              {expiredDiscounts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    Expired Codes ({expiredDiscounts.length})
                  </h3>
                  <div className="grid gap-4">
                    {expiredDiscounts.map((discount) => {
                      const expired = isExpired(discount.expires_at);
                      
                      return (
                        <div
                          key={discount.id}
                          className="bg-card rounded-xl border border-border/50 p-5 shadow-soft opacity-60"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-lg text-foreground">{discount.code}</h3>
                                <Badge variant={expired ? 'locked' : discount.is_active ? 'active' : 'pending'}>
                                  {expired ? 'Expired' : discount.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Percent className="h-4 w-4" />
                                  <span>{discount.discount_percent}% off</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Expires: {new Date(discount.expires_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tag className="h-4 w-4" />
                                  <span>{discount.course_count} course{discount.course_count !== 1 ? 's' : ''}</span>
                                </div>
                                {discount.max_usage && (
                                  <div>
                                    <span>Used: {discount.usage_count}/{discount.max_usage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(discount)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDiscount(discount.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          
                          {discount.courses && discount.courses.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-2">Applicable Courses:</p>
                              <div className="flex flex-wrap gap-2">
                                {discount.courses.map((course) => (
                                  <Badge key={course.id} variant="outline" className="text-xs">
                                    {course.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER50"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="discountPercent">Discount Percent (%) *</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={formData.discountPercent}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow decimals between 0.01-100
                    if (value === '' || (parseFloat(value) > 0 && parseFloat(value) <= 100)) {
                      setFormData({ ...formData, discountPercent: value });
                    }
                  }}
                  placeholder="50"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter a value between 1 and 100</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiresAt">Expires At *</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="maxUsage">Max Usage (optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  min="1"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Select Courses * (at least one)</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                {allCourses.map((course: any) => (
                  <div key={course.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={formData.courseIds.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <label
                      htmlFor={`course-${course.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {course.title} - ₹{course.price}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.courseIds.length} course{formData.courseIds.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createDiscount.isPending || updateDiscount.isPending}
              >
                {createDiscount.isPending || updateDiscount.isPending
                  ? 'Saving...'
                  : editingDiscount
                  ? 'Update'
                  : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
