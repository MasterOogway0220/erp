'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming this exists
import { createBuyerSchema } from '@/lib/validations/schemas';
import { useRouter } from 'next/navigation';

type BuyerFormValues = z.infer<typeof createBuyerSchema>;

interface BuyerFormProps {
  initialData?: BuyerFormValues & { id: string }; // For editing existing buyer
  customer_id: string; // The customer this buyer belongs to
  onSuccess?: () => void;
}

export function BuyerForm({ initialData, customer_id, onSuccess }: BuyerFormProps) {
  const router = useRouter();
  const form = useForm<BuyerFormValues>({
    resolver: zodResolver(createBuyerSchema),
    defaultValues: initialData || {
      customer_id: customer_id,
      buyer_name: '',
      designation: '',
      email: '',
      mobile: '',
      opening_balance: 0,
      is_active: true,
    },
  });

  const onSubmit = async (values: BuyerFormValues) => {
    try {
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/buyers/${initialData.id}` : '/api/buyers';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle success
      console.log('Buyer saved successfully!', values);
      form.reset(values); // Reset form with new values
      if (onSuccess) {
        onSuccess();
      }
      router.refresh(); // Refresh the page to show updated data

    } catch (error: any) {
      console.error('Failed to save buyer:', error.message);
      // You might want to display an error message to the user
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Customer ID - Hidden field, set by parent component */}
      <input type="hidden" {...form.register('customer_id')} />

      {/* Buyer Name */}
      <div>
        <Label htmlFor="buyer_name">Buyer Name</Label>
        <Input
          id="buyer_name"
          {...form.register('buyer_name')}
          placeholder="John Doe"
          className={form.formState.errors.buyer_name ? 'border-red-500' : ''}
        />
        {form.formState.errors.buyer_name && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.buyer_name.message}</p>
        )}
      </div>

      {/* Designation */}
      <div>
        <Label htmlFor="designation">Designation</Label>
        <Input
          id="designation"
          {...form.register('designation')}
          placeholder="Sales Manager"
          className={form.formState.errors.designation ? 'border-red-500' : ''}
        />
        {form.formState.errors.designation && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.designation.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="john.doe@example.com"
          className={form.formState.errors.email ? 'border-red-500' : ''}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Mobile */}
      <div>
        <Label htmlFor="mobile">Mobile</Label>
        <Input
          id="mobile"
          {...form.register('mobile')}
          placeholder="+91-9876543210"
          className={form.formState.errors.mobile ? 'border-red-500' : ''}
        />
        {form.formState.errors.mobile && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.mobile.message}</p>
        )}
      </div>

      {/* Opening Balance */}
      <div>
        <Label htmlFor="opening_balance">Opening Balance</Label>
        <Input
          id="opening_balance"
          type="number"
          step="0.01"
          {...form.register('opening_balance', { valueAsNumber: true })}
          className={form.formState.errors.opening_balance ? 'border-red-500' : ''}
        />
        {form.formState.errors.opening_balance && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.opening_balance.message}</p>
        )}
      </div>

      {/* Is Active Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={form.watch('is_active')}
          onCheckedChange={(checked) => form.setValue('is_active', checked as boolean)}
        />
        <Label htmlFor="is_active">Is Active</Label>
      </div>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Buyer' : 'Create Buyer'}
      </Button>
    </form>
  );
}
