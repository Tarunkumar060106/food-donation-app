"use client";

import dynamic from "next/dynamic";

function FormSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12" aria-label="Loading form">
      <div className="grid content-start gap-5 lg:col-span-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-[10px] bg-sage" />
        ))}
      </div>
      <div className="aspect-square animate-pulse rounded-2xl bg-sage lg:col-span-6" />
    </div>
  );
}

/** The form reads the viewer's clock for default times, so it renders in the browser only. */
export const DonationFormClient = dynamic(() => import("./DonationForm").then((m) => m.DonationForm), {
  ssr: false,
  loading: FormSkeleton,
});
