// Contact Types
import type { Contact, PipelineStage, User, Tag } from '@prisma/client';

// Contact Relations
export interface ContactWithRelations extends Contact {
  tags: ContactTagWithTag[];
  pipelineStage: PipelineStage | null;
  assignedUser: Pick<User, 'id' | 'name' | 'email' | 'image'> | null;
  deals: DealWithStage[];
  tasks: TaskWithAssignee[];
  organization: { id: string; name: string };
  _count?: {
    deals: number;
    tasks: number;
  };
}

export interface ContactTagWithTag {
  id: string;
  contactId: string;
  tagId: string;
  tag: Pick<Tag, 'id' | 'name' | 'color' | 'icon'>;
}

export interface DealWithStage {
  id: string;
  title: string;
  value: number;
  stage: PipelineStage | null;
  assignedUser: Pick<User, 'id' | 'name' | 'email' | 'image'> | null;
  createdAt: Date;
}

export interface TaskWithAssignee {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedUser: Pick<User, 'id' | 'name' | 'email' | 'image'> | null;
  createdAt: Date;
}

// Contact Input/Update types (for API requests)
export interface ContactCreateInput {
  organizationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  emoji?: string | null;
  segment?: string | null;
  source?: string | null;
  pipelineStageId?: string | null;
  assignedTo?: string | null;
  tagIds?: string[];
}

export interface ContactUpdateInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  emoji?: string | null;
  segment?: string | null;
  source?: string | null;
  pipelineStageId?: string | null;
  assignedTo?: string | null;
}

// Contact filter types (for API queries)
export interface ContactFilters {
  organizationId: string;
  stage?: string | null;
  segment?: string | null;
  assignedTo?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
}

// Contact list item (optimized for lists)
export interface ContactListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  emoji: string;
  segment: string | null;
  source: string | null;
  organizationId: string;
  pipelineStageId: string | null;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: (Pick<Tag, 'id' | 'name' | 'color'> & { icon?: string | null })[];
  pipelineStage: Pick<PipelineStage, 'id' | 'name' | 'color' | 'order'> | null;
  assignedUser: Pick<User, 'id' | 'name' | 'email' | 'image'> | null;
  interactionCount: number;
  lastInteractionDate: string | null;
}
