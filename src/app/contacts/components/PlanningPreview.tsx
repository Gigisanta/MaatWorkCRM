'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PlanningPreviewProps {
  html: string | null;
  isGenerating: boolean;
  onGeneratePreview?: () => void;
}

export function PlanningPreview({ html, isGenerating, onGeneratePreview }: PlanningPreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleCopyHtml = async () => {
    if (!html) {
      toast.error('No hay HTML para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(html);
      toast.success('HTML copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar el HTML');
    }
  };

  const handleDownloadPdf = () => {
    if (!html || !iframeRef.current?.contentWindow) {
      toast.error('No hay contenido para imprimir');
      return;
    }

    try {
      // Use the iframe's content window to trigger print
      const printContent = iframeRef.current.contentWindow;
      printContent?.focus();
      printContent?.print();
    } catch (error) {
      toast.error('Error al imprimir. Intenta descargar el HTML e imprimir desde tu navegador.');
    }
  };

  const handleDownloadHtml = () => {
    if (!html) {
      toast.error('No hay HTML para descargar');
      return;
    }

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plan-financiero.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('HTML descargado');
    } catch (error) {
      toast.error('Error al descargar el HTML');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Vista Previa del Plan</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyHtml}
            disabled={!html}
            className="glass border-white/10"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copiar HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadHtml}
            disabled={!html}
            className="glass border-white/10"
          >
            <Download className="w-4 h-4 mr-1" />
            Descargar HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={!html}
            className="glass border-white/10"
          >
            <FileText className="w-4 h-4 mr-1" />
            Imprimir PDF
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-slate-900/50 min-h-[500px]">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
              <p className="text-slate-400">Generando vista previa...</p>
            </div>
          </div>
        ) : html ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              className="w-full h-[600px] border-0"
              title="Plan Financiero Preview"
              sandbox="allow-same-origin"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="text-6xl opacity-20">📊</div>
              <p className="text-slate-500">
                Haz clic en &quot;Vista Previa&quot; para generar la previsualizacion del plan financiero
              </p>
              {onGeneratePreview && (
                <Button
                  onClick={onGeneratePreview}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  Generar Vista Previa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
