import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getAllCompaniesForAdmin } from "@/services/admin.service";
import { AdminClient } from "@/components/admin/AdminClient";
import type { CompanyTenantRow } from "@/types";

export default async function AdminPortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  const companies = await getAllCompaniesForAdmin();

  const serialized: CompanyTenantRow[] = companies.map((comp) => {
    const owner = comp.users[0];
    const effectivePlanStatus =
      comp.planStatus === "TRIAL" && Date.now() > comp.trialEndsAt.getTime()
        ? "EXPIRED"
        : comp.planStatus;

    return {
      id: comp.id,
      name: comp.name,
      ownerName: owner?.name ?? "—",
      ownerEmail: owner?.email ?? "—",
      planStatus: effectivePlanStatus,
      createdAt: formatDate(comp.createdAt),
    };
  });

  return <AdminClient companies={serialized} adminName={session.user.name} />;
}
