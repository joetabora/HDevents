'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WeeklySummaryButton() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    const response = await fetch('/api/dashboard/weekly-summary', { method: 'GET' });

    if (!response.ok) {
      toast.error('Unable to generate weekly summary');
      setLoading(false);
      return;
    }

    const blob = await response.blob();
    const fileName = response.headers.get('x-report-filename') ?? 'weekly-summary.pdf';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Weekly summary generated');
    setLoading(false);
  }

  return (
    <Button
      type="button"
      variant="primary"
      loading={loading}
      onClick={() => {
        handleDownload().catch(() => {
          toast.error('Unable to generate weekly summary');
          setLoading(false);
        });
      }}
    >
      <FileDown className="h-4 w-4" />
      Generate Weekly Summary PDF
    </Button>
  );
}
