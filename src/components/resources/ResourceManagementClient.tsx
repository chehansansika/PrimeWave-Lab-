'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Power,
  Layers,
  MapPin,
  Users,
  CalendarPlus,
  AlertTriangle,
} from 'lucide-react';
import type { Resource, Profile, ResourceCategory, ResourceStatus } from '@/types';
import { RESOURCE_CATEGORIES } from '@/types';
import { getCategoryLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { ResourceModal } from './ResourceModal';
import { toggleResourceStatus } from '@/lib/actions/resources';
import { useToast } from '@/components/ui/toast';

interface ResourceManagementClientProps {
  initialResources: Resource[];
  profile: Profile | null;
}

export function ResourceManagementClient({
  initialResources,
  profile,
}: ResourceManagementClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const isAdmin = profile?.role === 'administrator';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Status toggle confirmation dialog
  const [statusDialogItem, setStatusDialogItem] = useState<Resource | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Filtered resources
  const filteredResources = initialResources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.description && res.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || res.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setIsModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusDialogItem) return;

    setStatusUpdating(true);
    const newStatus: ResourceStatus = statusDialogItem.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await toggleResourceStatus(statusDialogItem.id, newStatus);
      if (res.success) {
        addToast('success', res.message);
        router.refresh();
      } else {
        addToast('error', res.message);
      }
    } catch {
      addToast('error', 'Failed to update resource status.');
    } finally {
      setStatusUpdating(false);
      setStatusDialogItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Resources</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, and book shared facilities, conference rooms, and equipment.
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm shrink-0">
            <Plus className="w-4 h-4" />
            Add New Resource
          </button>
        )}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input pl-9 text-sm"
              placeholder="Search by resource name, location, or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 w-full md:w-44">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
              <select
                className="input text-xs"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="w-full md:w-36">
              <select
                className="input text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No resources found"
          description={
            searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No resources match your search and filter criteria. Try adjusting your query.'
              : 'There are currently no resources registered in the system.'
          }
          actionLabel={isAdmin ? 'Add Resource' : undefined}
          onAction={isAdmin ? handleOpenAdd : undefined}
        />
      ) : (
        <div className="table-container shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Resource Details</th>
                <th>Category</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="transition-colors">
                  <td className="max-w-xs">
                    <div className="font-semibold text-slate-900">{resource.name}</div>
                    {resource.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {resource.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      {getCategoryLabel(resource.category)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{resource.location}</span>
                    </div>
                  </td>
                  <td>
                    {resource.capacity ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{resource.capacity} seats</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td>
                    <Badge status={resource.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {resource.status === 'active' && (
                        <Link
                          href={`/reservations/new?resourceId=${resource.id}`}
                          className="btn btn-secondary btn-sm text-xs py-1 px-2.5"
                          title="Book this resource"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Book</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(resource)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Resource"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setStatusDialogItem(resource)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              resource.status === 'active'
                                ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={resource.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {isAdmin && (
        <ResourceModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resourceToEdit={editingResource}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={!!statusDialogItem}
        onClose={() => setStatusDialogItem(null)}
        title={
          statusDialogItem?.status === 'active'
            ? `Deactivate "${statusDialogItem?.name}"?`
            : `Activate "${statusDialogItem?.name}"?`
        }
        description={
          statusDialogItem?.status === 'active'
            ? 'Deactivating this resource prevents employees from booking it for future time slots.'
            : 'Activating this resource will make it immediately available for employees to reserve.'
        }
        confirmLabel={statusDialogItem?.status === 'active' ? 'Deactivate' : 'Activate'}
        confirmVariant={statusDialogItem?.status === 'active' ? 'danger' : 'primary'}
        onConfirm={handleConfirmToggleStatus}
        loading={statusUpdating}
      />
    </div>
  );
}
