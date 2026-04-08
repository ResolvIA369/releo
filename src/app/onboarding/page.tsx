"use client";

import { useRouter } from "next/navigation";
import { ProfileSetup } from "@/features/onboarding/components/ProfileSetup";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <ProfileSetup onComplete={() => router.replace("/dashboard")} />
  );
}
