'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming Input exists for search/filter
import { BuyerForm } from './BuyerForm'; // Import the form component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Assuming these exist for modal

// Define the Buyer type based on the schema and database structure
interface Buyer {
  id: string;
  customer_id: string;
  buyer_name: string;
  designation?: string;
  email?: string;
  mobile?: string;
  opening_balance?: number;
  is_active: boolean;
  created_at: string;
}

interface BuyerListProps {
  initialCustomerId?: string; // Optional customer_id to filter by initially
}

export function BuyerList({ initialCustomerId }: BuyerListProps) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = useState<string>(initialCustomerId || '');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | undefined>(undefined);

  const router = useRouter();

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterCustomerId ? `/api/buyers?customer_id=${filterCustomerId}` : '/api/buyers';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch buyers: ${response.statusText}`);
      }
      const data: Buyer[] = await response.json();
      setBuyers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCustomerId]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this buyer?')) {
      return;
    }
    try {
      const response = await fetch(`/api/buyers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete buyer: ${response.statusText}`);
      }
      // Refresh the list after successful deletion
      fetchBuyers();
      router.refresh(); // Invalidate Next.js cache
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setIsFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedBuyer(undefined);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    fetchBuyers();
  };

  if (loading) return <div>Loading buyers...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Buyer Master</h2>
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>Add New Buyer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedBuyer ? 'Edit Buyer' : 'Create New Buyer'}</DialogTitle>
            </DialogHeader>
            {/* Assuming a default customer_id for new buyers if none is filtered, or handle this more robustly */}
            {filterCustomerId && (
              <BuyerForm
                initialData={selectedBuyer}
                customer_id={filterCustomerId}
                onSuccess={handleFormSuccess}
              />
            )}
            {!filterCustomerId && !selectedBuyer && (
                <p className="text-red-500">Please select a customer to add a new buyer.</p>
            )}
            {!filterCustomerId && selectedBuyer && (
                <BuyerForm
                    initialData={selectedBuyer}
                    customer_id={selectedBuyer.customer_id} // Use existing customer_id for editing
                    onSuccess={handleFormSuccess}
                />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Customer Filter */}
      <div>
        <Label htmlFor="filterCustomerId">Filter by Customer ID (UUID)</Label>
        <div className="flex space-x-2">
          <Input
            id="filterCustomerId"
            placeholder="e.g., a1b2c3d4-e5f6-7890-1234-567890abcdef"
            value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={fetchBuyers}>Apply Filter</Button>
          <Button variant="outline" onClick={() => { setFilterCustomerId(''); fetchBuyers(); }}>Clear Filter</Button>
        </div>
      </div>


      {buyers.length === 0 ? (
        <p>No buyers found.</p>
      ) : (
        <div className="border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buyers.map((buyer) => (
                <tr key={buyer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {buyer.buyer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {buyer.customer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {buyer.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {buyer.mobile || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {buyer.is_active ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(buyer)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(buyer.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
