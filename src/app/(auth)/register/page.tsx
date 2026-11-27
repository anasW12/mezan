import React from "react";
import { isGoogleOAuthEnabled } from "@/lib/auth";
import { RegisterClient } from "@/components/auth/RegisterClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegisterClient isGoogleEnabled={isGoogleOAuthEnabled} />;
}
