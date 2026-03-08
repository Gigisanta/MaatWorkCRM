// ============================================================
// MaatWork CRM — Drive Page
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Container } from "~/components/ui/Layout";
import { DriveBrowser } from "~/components/google/DriveBrowser";

export const Route = createFileRoute("/_app/drive")({
  component: DrivePage,
});

function DrivePage() {
  return (
    <Container className="py-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text font-display tracking-tight">Drive</h1>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-1">
          Access your Google Drive files directly from MaatWork
        </p>
      </motion.div>

      <DriveBrowser className="min-h-[600px]" />
    </Container>
  );
}
