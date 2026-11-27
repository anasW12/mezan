import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma, runTransaction } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "@/lib/auth.config";

export const isGoogleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
);

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          company: {
            select: {
              id: true,
              planStatus: true,
              trialEndsAt: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        planStatus: user.company?.planStatus ?? null,
        trialEndsAt: user.company?.trialEndsAt.toISOString() ?? null,
      };
    },
  }),
  ...(isGoogleOAuthEnabled
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }
      return Boolean(user.email?.trim());
    },
    async jwt(params) {
      const token = authConfig.callbacks?.jwt
        ? await authConfig.callbacks.jwt(params)
        : params.token;

      if (!token) {
        return null;
      }

      if (params.account?.provider === "google" && params.user?.email) {
        const email = params.user.email.trim().toLowerCase();
        const displayName =
          params.user.name?.trim() || email.split("@")[0] || "صاحب العمل";

        let dbUser = await prisma.user.findUnique({
          where: { email },
          include: {
            company: {
              select: {
                id: true,
                planStatus: true,
                trialEndsAt: true,
              },
            },
          },
        });

        if (!dbUser) {
          const trialDays = Number(process.env.TRIAL_DURATION_DAYS ?? "14");
          const trialEndsAt = new Date(
            Date.now() + trialDays * 24 * 60 * 60 * 1000
          );
          const defaultCurrency = process.env.DEFAULT_CURRENCY ?? "EGP";

          dbUser = await runTransaction(async (tx) => {
            const company = await tx.company.create({
              data: {
                name: `شركة ${displayName}`,
                currency: defaultCurrency,
                planStatus: "TRIAL",
                trialEndsAt,
              },
            });

            const createdUser = await tx.user.create({
              data: {
                name: displayName,
                email,
                passwordHash: "__GOOGLE_OAUTH__",
                role: "OWNER",
                companyId: company.id,
              },
              include: {
                company: {
                  select: {
                    id: true,
                    planStatus: true,
                    trialEndsAt: true,
                  },
                },
              },
            });

            await tx.safe.create({
              data: {
                companyId: company.id,
                name: "الخزينة الرئيسية",
                balance: 0,
                isDefault: true,
              },
            });

            return createdUser;
          });
        }

        token.id = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.role = dbUser.role;
        token.companyId = dbUser.companyId;
        token.planStatus = dbUser.company?.planStatus ?? null;
        token.trialEndsAt = dbUser.company?.trialEndsAt.toISOString() ?? null;
      }

      return token;
    },
  },
});
