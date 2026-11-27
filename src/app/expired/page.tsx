import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpiredClient } from "@/components/auth/ExpiredClient";

export default async function ExpiredPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  let companyName = "شركتك";
  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, planStatus: true, trialEndsAt: true },
    });

    if (company) {
      companyName = company.name;
      const isTrialValid =
        company.planStatus === "TRIAL" &&
        Date.now() <= company.trialEndsAt.getTime();
      if (company.planStatus === "ACTIVE" || isTrialValid) {
        if (session.user.planStatus !== company.planStatus) {
          return <ExpiredClient companyName={companyName} />;
        }
        redirect("/dashboard");
      }
    }
  }

  return <ExpiredClient companyName={companyName} />;
}
