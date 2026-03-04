'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnnualIntelligenceReportButton({ year }: { year: number }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    const response = await fetch(`/api/dashboard/annual-intelligence?year=${year}`, {
      method: 'GET'
    });

    if (!response.ok) {
      toast.error('Unable to generate annual intelligence report');
      setLoading(false);
      return;
    }

    const blob = await response.blob();
    const fileName = response.headers.get('x-report-filename') ?? `annual-intelligence-${year}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Annual intelligence report generated');
    setLoading(false);
  }

  return (
    <Button
      type="button"
      variant="primary"
      loading={loading}
      onClick={() => {
        handleDownload().catch(() => {
          setLoading(false);
          toast.error('Unable to generate annual intelligence report');
        });
      }}
    >
      <FileDown className="h-4 w-4" />
      Generate Annual Intelligence Report
    </Button>
  );
}
