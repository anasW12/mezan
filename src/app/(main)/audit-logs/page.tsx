import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tenantWhere } from "@/lib/tenant";
import { serializeAuditLog } from "@/lib/serializers";
import { getAuditLogsByCompany } from "@/services/audit.service";
import { AuditLogsClient } from "@/components/audit-logs/AuditLogsClient";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const { companyId } = tenantWhere(session);
  const logs = await getAuditLogsByCompany(companyId);

  return <AuditLogsClient logs={logs.map(serializeAuditLog)} />;
}
