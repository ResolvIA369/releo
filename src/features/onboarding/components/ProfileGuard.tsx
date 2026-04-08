"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/shared/store/useAppStore";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const status = useAppStore((s) => s.profileStatus);
  const router = useRouter();

  useEffect(() => {
    if (status === "missing") {
      router.replace("/onboarding");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-text-muted">Cargando...</p>
      </div>
    );
  }

  if (status === "missing") {
    return null;
  }

  return <>{children}</>;
}
