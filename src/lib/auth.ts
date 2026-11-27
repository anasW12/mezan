import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma, runTransaction } from "@/lib/prisma";
import { loginSchema, normalizeEmail } from "@/lib/validations/auth";
import { authConfig } from "@/lib/auth.config";

export const GOOGLE_OAUTH_SENTINEL = "__GOOGLE_OAUTH__";

// Precomputed dummy bcrypt hash so missing/Google-only accounts spend constant time during login checks
const DUMMY_BCRYPT_HASH =
  "$2b$12$C6UzMDM.H6dfI/f/IKxGhu6S9u5g8Q8q6W5yZ6p5kN3L9E4b7eX2e";

export const isGoogleOAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
);

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

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

      const email = normalizeEmail(parsed.data.email);
      const { password } = parsed.data;

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

      if (
        !user ||
        !user.passwordHash ||
        user.passwordHash === GOOGLE_OAUTH_SENTINEL
      ) {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
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
          authorization: {
            params: {
              prompt: "select_account",
            },
          },
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }
      const isEmailVerified =
        profile && typeof profile.email_verified === "boolean"
          ? profile.email_verified
          : false;
      return Boolean(isEmailVerified && user.email?.trim());
    },
    async jwt(params) {
      const token = authConfig.callbacks?.jwt
        ? await authConfig.callbacks.jwt(params)
        : params.token;

      if (!token) {
        return null;
      }

      if (
        params.account?.provider === "google" &&
        params.user?.email &&
        params.profile?.email_verified === true
      ) {
        const email = normalizeEmail(params.user.email);
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

          try {
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
                  passwordHash: GOOGLE_OAUTH_SENTINEL,
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
          } catch (error) {
            if (!isUniqueConstraintError(error)) {
              throw error;
            }
            dbUser = await prisma.user.findUnique({
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
          }
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
          token.planStatus = dbUser.company?.planStatus ?? null;
          token.trialEndsAt = dbUser.company?.trialEndsAt.toISOString() ?? null;
        }
      }

      return token;
    },
  },
});
