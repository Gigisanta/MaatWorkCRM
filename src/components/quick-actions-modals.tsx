'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQuickActions } from '@/lib/quick-actions-context';
import { useAuth } from '@/lib/auth-context';
import { CreateContactModal } from '@/app/contacts/components/create-contact-modal';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { FeedbackDialog } from '@/components/feedback-dialog';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface PipelineStagesResponse {
  stages: PipelineStage[];
}

export function QuickActionsModals() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || null;
  const { createContactOpen, setCreateContactOpen, createTaskOpen, setCreateTaskOpen, feedbackOpen, setFeedbackOpen } = useQuickActions();

  // Fetch pipeline stages for create contact modal
  const { data: stagesData } = useQuery<PipelineStagesResponse>({
    queryKey: ['pipeline-stages', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/pipeline-stages?organizationId=${organizationId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar etapas');
      return response.json();
    },
    enabled: !!organizationId,
  });

  const stages = stagesData?.stages || [];

  return (
    <>
      <CreateContactModal
        open={createContactOpen}
        onClose={() => setCreateContactOpen(false)}
        stages={stages}
        organizationId={organizationId}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </>
  );
}
