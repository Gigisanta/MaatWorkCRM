// ============================================================
// MaatWork CRM — Google Drive Browser Component
// ============================================================

import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Download,
  FileIcon,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Image,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Table,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
}

interface DriveBrowserProps {
  className?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/vnd.google-apps.folder") {
    return Folder;
  }
  if (mimeType.includes("image")) {
    return Image;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return Table;
  }
  if (mimeType.includes("presentation") || mimeType.includes("slides")) {
    return Presentation;
  }
  if (mimeType.includes("document") || mimeType.includes("pdf")) {
    return FileText;
  }
  return FileIcon;
};

const getFileColor = (mimeType: string) => {
  if (mimeType === "application/vnd.google-apps.folder") {
    return "text-primary bg-primary/10";
  }
  if (mimeType.includes("image")) {
    return "text-pink-500 bg-pink-500/10";
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "text-success bg-success/10";
  }
  if (mimeType.includes("presentation") || mimeType.includes("slides")) {
    return "text-warning bg-warning/10";
  }
  if (mimeType.includes("document")) {
    return "text-info bg-info/10";
  }
  return "text-text-muted bg-surface-hover";
};

export function DriveBrowser({ className }: DriveBrowserProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "My Drive" }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const {
    data: files,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["google-drive-files", currentFolder, isSearching ? searchQuery : null],
    queryFn: async () => {
      const url = new URL("/api/google/drive/files", window.location.origin);
      if (currentFolder) {
        url.searchParams.set("folderId", currentFolder);
      }
      if (isSearching && searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      return response.json() as Promise<DriveFile[]>;
    },
    enabled: !!searchQuery || !isSearching,
  });

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
    setIsSearching(false);
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1].id);
    setIsSearching(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    }
  };

  const goHome = () => {
    setCurrentFolder(null);
    setBreadcrumb([{ id: null, name: "My Drive" }]);
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <Card className={cn("border-border bg-surface", className)}>
      <CardHeader className="border-b border-border bg-surface-hover px-4 py-3">
        <Stack direction="row" align="center" justify="between" className="w-full">
          <CardTitle className="text-lg font-bold text-text flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Google Drive
          </CardTitle>
          <Stack direction="row" gap="xs">
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <Upload className="w-4 h-4 mr-1" /> Upload
            </Button>
            <Button variant="primary" size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-1" /> New Folder
            </Button>
          </Stack>
        </Stack>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            type="search"
            placeholder="Search files in Drive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface/50"
          />
        </form>

        <div className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" onClick={goHome} className="h-7 px-2">
            <Home className="w-4 h-4" />
          </Button>
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-text-muted" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToBreadcrumb(index)}
                className={cn("h-7 px-2", index === breadcrumb.length - 1 && "text-primary font-medium")}
              >
                {item.name}
              </Button>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : isSearching ? (
          <div className="text-sm text-text-muted mb-2">Search results for "{searchQuery}"</div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files?.map((file) => {
            const IconComponent = getFileIcon(file.mimeType);
            const colorClass = getFileColor(file.mimeType);

            return (
              <div
                key={file.id}
                className="group p-3 border border-border rounded-lg hover:bg-surface-hover hover:border-primary/30 transition-all cursor-pointer"
                onClick={() =>
                  file.mimeType === "application/vnd.google-apps.folder"
                    ? navigateToFolder(file.id, file.name)
                    : window.open(file.webViewLink, "_blank")
                }
              >
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", colorClass)}>
                    {file.mimeType === "application/vnd.google-apps.folder" ? (
                      <Folder className="w-6 h-6" />
                    ) : (
                      <IconComponent className="w-6 h-6" />
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {file.mimeType !== "application/vnd.google-apps.folder" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-text truncate">{file.name}</p>
                {file.modifiedTime && (
                  <p className="text-xs text-text-muted mt-1">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                )}
              </div>
            );
          })}
        </div>

        {files?.length === 0 && !isLoading && (
          <div className="text-center py-12 text-text-muted">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{isSearching ? "No files found" : "This folder is empty"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
