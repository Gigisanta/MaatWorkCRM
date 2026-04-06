'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types

// Basic contact (kept for backward compatibility)
export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  emoji: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

// Deal - kept for backward compatibility
export interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  contactId: string | null;
  stageId: string | null;
  assignedTo: string | null;
  contact: Contact | null;
  assignedUser: User | null;
  stage: PipelineStage | null;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  wipLimit: number | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  _count?: {
    contacts: number;
    deals: number;
  };
}

// Product (formerly Deal/Tag) - maps to Tag model
// Note: value and expectedCloseDate were Deal fields, not Tag fields
// They are optional here for backward compatibility with UI code
export interface Product {
  id: string;
  name: string;
  color: string;
  value?: number;
  expectedCloseDate?: string | null;
}

// Contact with products (tags)
export interface ContactWithProducts {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  emoji: string;
  pipelineStageId: string | null;
  tags: Product[];
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Stage with contacts (not deals)
export interface StageWithContacts extends PipelineStage {
  contacts: ContactWithProducts[];
}

// StageWithDeals - kept for backward compatibility
export interface StageWithDeals extends PipelineStage {
  deals: Deal[];
}

// Default organization ID for demo purposes
const DEFAULT_ORG_ID = 'demo-org';

// Fetch stages
async function fetchStages(organizationId: string): Promise<PipelineStage[]> {
  const response = await fetch(`/api/pipeline-stages?organizationId=${organizationId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch stages');
  const data = await response.json();
  return data.stages;
}

// Fetch deals
async function fetchDeals(organizationId: string): Promise<Deal[]> {
  const response = await fetch(`/api/deals?organizationId=${organizationId}&limit=100`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch deals');
  const data = await response.json();
  return data.deals;
}

// Fetch contacts
async function fetchContacts(organizationId: string, search: string): Promise<Contact[]> {
  const response = await fetch(`/api/contacts?organizationId=${organizationId}&search=${encodeURIComponent(search)}&limit=20`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch contacts');
  const data = await response.json();
  return data.contacts;
}

// Fetch contacts with products (tags)
async function fetchContactsWithProducts(organizationId: string): Promise<ContactWithProducts[]> {
  const response = await fetch(`/api/contacts?organizationId=${organizationId}&limit=100`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch contacts');
  const data = await response.json();
  return data.contacts || [];
}

// Fetch users for assignee select
async function fetchUsers(organizationId: string): Promise<User[]> {
  const response = await fetch(`/api/users?organizationId=${organizationId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch users');
  const data = await response.json();
  return data.users || [];
}

// Move deal to another stage
async function moveDeal(dealId: string, data: { toStageId: string; organizationId: string }): Promise<Deal> {
  const response = await fetch(`/api/deals/${dealId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to move deal');
  return response.json();
}

// Move contact to another stage
async function moveContact(contactId: string, data: { pipelineStageId: string }): Promise<ContactWithProducts> {
  const response = await fetch(`/api/contacts/${contactId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to move contact');
  return response.json();
}

// Create deal
async function createDeal(data: {
  organizationId: string;
  title: string;
  contactId?: string;
  stageId?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
}): Promise<Deal> {
  const response = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create deal');
  return response.json();
}

// Update deal
async function updateDeal(dealId: string, data: {
  title?: string;
  contactId?: string;
  stageId?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
}): Promise<Deal> {
  const response = await fetch(`/api/deals/${dealId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update deal');
  return response.json();
}

// Delete deal
async function deleteDeal(dealId: string): Promise<void> {
  const response = await fetch(`/api/deals/${dealId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete deal');
}

// Hooks
export function useStages(organizationId: string = DEFAULT_ORG_ID) {
  return useQuery({
    queryKey: ['stages', organizationId],
    queryFn: () => fetchStages(organizationId),
    enabled: !!organizationId,
  });
}

export function useDeals(organizationId: string = DEFAULT_ORG_ID) {
  return useQuery({
    queryKey: ['deals', organizationId],
    queryFn: () => fetchDeals(organizationId),
    enabled: !!organizationId,
  });
}

export function useContacts(organizationId: string = DEFAULT_ORG_ID, search: string = '') {
  return useQuery({
    queryKey: ['contacts', organizationId, search],
    queryFn: () => fetchContacts(organizationId, search),
    enabled: !!organizationId,
  });
}

export function useContactsWithProducts(organizationId: string = DEFAULT_ORG_ID) {
  return useQuery({
    queryKey: ['contactsWithProducts', organizationId],
    queryFn: () => fetchContactsWithProducts(organizationId),
    enabled: !!organizationId,
  });
}

export function useUsers(organizationId: string = DEFAULT_ORG_ID) {
  return useQuery({
    queryKey: ['users', organizationId],
    queryFn: () => fetchUsers(organizationId),
    enabled: !!organizationId,
  });
}

export function usePipelineData(organizationId: string = DEFAULT_ORG_ID) {
  const stagesQuery = useStages(organizationId);
  const contactsQuery = useContactsWithProducts(organizationId);

  const stagesWithContacts: StageWithContacts[] = React.useMemo(() => {
    if (!stagesQuery.data || !contactsQuery.data) return [];

    return stagesQuery.data.map(stage => ({
      ...stage,
      contacts: contactsQuery.data.filter(contact => contact.pipelineStageId === stage.id),
    }));
  }, [stagesQuery.data, contactsQuery.data]);

  return {
    stages: stagesWithContacts,
    isLoading: stagesQuery.isLoading || contactsQuery.isLoading,
    error: stagesQuery.error || contactsQuery.error,
    refetch: () => {
      stagesQuery.refetch();
      contactsQuery.refetch();
    },
  };
}

export function useMoveContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, pipelineStageId }: {
      contactId: string;
      pipelineStageId: string;
    }) => moveContact(contactId, { pipelineStageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactsWithProducts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contacto movido exitosamente');
    },
    onError: (error) => {
      toast.error('Error al mover el contacto: ' + error.message);
    },
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, toStageId, organizationId }: {
      dealId: string;
      toStageId: string;
      organizationId: string;
    }) => moveDeal(dealId, { toStageId, organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal movido exitosamente');
    },
    onError: (error) => {
      toast.error('Error al mover el deal: ' + error.message);
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear el deal: ' + error.message);
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, data }: { dealId: string; data: Parameters<typeof updateDeal>[1] }) =>
      updateDeal(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal actualizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar el deal: ' + error.message);
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el deal: ' + error.message);
    },
  });
}
