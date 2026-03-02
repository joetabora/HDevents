import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Card className="max-w-xl">
      <h2 className="text-lg font-semibold text-[#FAFAFA]">Not Found</h2>
      <p className="mt-2 text-sm text-[#A1A1AA]">The requested page could not be found.</p>
      <Link href="/" className="mt-4 inline-block">
        <Button variant="ghost">Return to dashboard</Button>
      </Link>
    </Card>
  );
}
