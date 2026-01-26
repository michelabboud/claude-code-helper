/**
 * TaskForm Component
 * Phase 3: Frontend - React/Next.js
 *
 * Form for creating and editing tasks.
 * Should trigger: react-nextjs-expert, design-system-guardian
 */

'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface User {
  id: string;
  name: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
}

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  projectId: string;
  teamMembers?: User[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-gray-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-500' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
];

export function TaskForm({
  initialData,
  projectId,
  teamMembers = [],
  onSubmit,
  onCancel,
  isEdit = false,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'TODO',
    priority: initialData?.priority || 'MEDIUM',
    assigneeId: initialData?.assigneeId || '',
    dueDate: initialData?.dueDate || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        placeholder="Enter task title"
        autoFocus
      />

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter task description (optional)"
          rows={4}
          className={cn(
            'block w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.description
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          )}
        />
        {errors.description && (
          <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Status and Priority row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignee and Due Date row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Assignee */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Assignee
          </label>
          <select
            value={formData.assigneeId}
            onChange={(e) => handleChange('assigneeId', e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
