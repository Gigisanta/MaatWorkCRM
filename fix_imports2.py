import re

with open('apps/web/app/routes/_app/contacts/index.tsx', 'r') as f:
    content = f.read()

# Replace all imports with a clean version
clean_imports = """import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, Check, Mail, MoreVertical, Phone, Search, Sparkles, Users } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Container } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import { DataTable } from "~/components/ui/Table";
import {
  useContacts,
  useCreateContactMutation,
  useDeleteContactMutation,
  useUpdateContactMutation,
} from "~/lib/hooks/use-crm";
import { cn } from "~/lib/utils";"""

pattern = re.compile(r'import \{ createFileRoute \}.*?import \{ cn \} from "~/lib/utils";', re.DOTALL)
new_content = pattern.sub(clean_imports, content)

with open('apps/web/app/routes/_app/contacts/index.tsx', 'w') as f:
    f.write(new_content)
