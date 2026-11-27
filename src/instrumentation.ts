export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureIpv4NetworkConfig } = await import("@/lib/network-init");
    ensureIpv4NetworkConfig();
  }
}
