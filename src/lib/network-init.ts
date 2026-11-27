import dns from "node:dns";
import net from "node:net";

let initialized = false;

export function ensureIpv4NetworkConfig() {
  if (initialized) return;
  initialized = true;
  try {
    dns.setDefaultResultOrder("ipv4first");
    net.setDefaultAutoSelectFamilyAttemptTimeout(3000);
  } catch {
    // Ignore on runtimes where dns/net defaults are locked
  }
}

ensureIpv4NetworkConfig();
