import React from "react";
import { isGoogleOAuthEnabled } from "@/lib/auth";
import { LoginClient } from "@/components/auth/LoginClient";

export default function LoginPage() {
  return <LoginClient isGoogleEnabled={isGoogleOAuthEnabled} />;
}
