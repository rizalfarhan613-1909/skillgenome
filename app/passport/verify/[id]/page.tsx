import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerifyPassportContent } from "@/components/passport/VerifyPassportContent";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

const PASSPORT_ID_PATTERN = /^[A-Za-z0-9]{12}$/;

async function VerifyRoute({ params }: VerifyPageProps) {
  const { id } = await params;

  if (!PASSPORT_ID_PATTERN.test(id)) {
    notFound();
  }

  return <VerifyPassportContent passportId={id} />;
}

/** Menyediakan shell dan boundary streaming untuk rute verifikasi passport. */
export default function VerifyPassportPage({ params }: VerifyPageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-72 animate-pulse rounded bg-glass" />
          <div className="h-64 animate-pulse rounded-lg bg-glass" />
          <p className="sr-only" role="status">
            Memuat verifikasi passport...
          </p>
        </main>
      }
    >
      <VerifyRoute params={params} />
    </Suspense>
  );
}
