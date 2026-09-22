"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (orderId) {
      router.replace(`/orders/${orderId}`);
    }
  }, [orderId, router]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-40 w-full" />
      </div>
    </AppLayout>
  );
}
