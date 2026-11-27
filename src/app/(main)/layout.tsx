import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getCachedCompanyLayoutMeta,
  invalidateCompanyMeta,
} from "@/lib/company-cache";
import { prisma } from "@/lib/prisma";
import { MainShell } from "@/components/layout/MainShell";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  let companyName = "شركتي";
  if (session.user.companyId) {
    const company = await getCachedCompanyLayoutMeta(session.user.companyId);

    if (!company) {
      redirect("/login");
    }

    const trialEndsMs = Date.parse(company.trialEndsAt);
    if (
      company.planStatus === "TRIAL" &&
      !Number.isNaN(trialEndsMs) &&
      Date.now() > trialEndsMs
    ) {
      await prisma.company.update({
        where: { id: company.id },
        data: { planStatus: "EXPIRED" },
      });
      invalidateCompanyMeta(company.id);
      redirect("/expired");
    }

    if (company.planStatus === "EXPIRED") {
      redirect("/expired");
    }

    companyName = company.name;
  }

  return (
    <MainShell
      userName={session.user.name}
      userEmail={session.user.email}
      companyName={companyName}
      isAdmin={session.user.role === "PLATFORM_ADMIN"}
    >
      {children}
    </MainShell>
  );
}
