// ============================================================
// MaatWork CRM — Edit Team Modal Component
// UI/UX REFINED BY JULES v2
// ============================================================

import { motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Input } from "~/components/ui/Input";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { cn } from "~/lib/utils";

export function EditTeamModal({
  teamId,
  isOpen,
  onClose,
  onSave,
  initialName = "",
  initialDescription = "",
}: {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(name, description);
      } else {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Edit Team</ModalTitle>
        </ModalHeader>

        <div className="space-y-6">
          <Input
            id="team-name"
            label="Team Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter team name..."
            className="w-full"
          />

          <Input
            id="team-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter team description..."
            className="w-full"
          />
        </div>

        <ModalFooter>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-lg bg-surface-hover border border-border transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
