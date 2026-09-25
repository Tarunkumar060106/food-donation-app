import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/landing/Nav";
import { photos } from "@/lib/photos";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <Logo />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </main>
      </div>
      <div className="relative hidden lg:block">
        <Image src={photos.volunteer.src} alt={photos.volunteer.alt} fill preload sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1813]/80 via-transparent to-transparent" />
        <p className="absolute inset-x-0 bottom-0 max-w-[30ch] p-12 text-3xl font-medium leading-tight tracking-tight text-[#e9f0ea]">
          Surplus food, rescued in minutes.
        </p>
      </div>
    </div>
  );
}
