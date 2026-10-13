'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { RESOURCE_CATEGORIES, type Resource, type ResourceFormData, type ResourceCategory, type ResourceStatus } from '@/types';
import { createResource, updateResource } from '@/lib/actions/resources';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface ResourceModalProps {
  open: boolean;
  onClose: () => void;
  resourceToEdit?: Resource | null;
  onSuccess: () => void;
}

export function ResourceModal({
  open,
  onClose,
  resourceToEdit,
  onSuccess,
}: ResourceModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    description: '',
    category: 'meeting_room',
    location: '',
    capacity: null,
    status: 'active',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (resourceToEdit) {
      setFormData({
        name: resourceToEdit.name,
        description: resourceToEdit.description || '',
        category: resourceToEdit.category,
        location: resourceToEdit.location || '',
        capacity: resourceToEdit.capacity,
        status: resourceToEdit.status,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'meeting_room',
        location: '',
        capacity: null,
        status: 'active',
      });
    }
    setError('');
  }, [resourceToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Resource name is required');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (resourceToEdit) {
        res = await updateResource(resourceToEdit.id, formData);
      } else {
        res = await createResource(formData);
      }

      if (res.success) {
        addToast('success', res.message);
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to save resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={resourceToEdit ? 'Edit Resource' : 'Add New Resource'}
      description={
        resourceToEdit
          ? 'Update resource information and availability parameters.'
          : 'Create a new shared physical resource or equipment for booking.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Resource Name *
          </label>
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. Executive Boardroom A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              className="input text-sm"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ResourceCategory })
              }
            >
              {RESOURCE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Capacity (Persons)
            </label>
            <input
              type="number"
              min="0"
              className="input text-sm"
              placeholder="e.g. 12 (optional)"
              value={formData.capacity ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Location / Room Number *
          </label>
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. 4th Floor, East Wing, Room 402"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Equipment
          </label>
          <textarea
            className="input text-sm resize-none h-20"
            placeholder="e.g. Equipped with 4K HDMI TV, dual whiteboard, and conference mic."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Operational Status
          </label>
          <select
            className="input text-sm"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as ResourceStatus })
            }
          >
            <option value="active">Active (Available for booking)</option>
            <option value="inactive">Inactive (Temporarily suspended)</option>
          </select>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            {resourceToEdit ? 'Save Changes' : 'Create Resource'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
