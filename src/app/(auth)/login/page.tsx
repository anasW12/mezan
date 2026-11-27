import React from "react";
import { isGoogleOAuthEnabled } from "@/lib/auth";
import { LoginClient } from "@/components/auth/LoginClient";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <LoginClient
      isGoogleEnabled={isGoogleOAuthEnabled}
      authError={params?.error}
    />
  );
}
