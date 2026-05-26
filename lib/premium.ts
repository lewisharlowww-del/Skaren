export const premiumStorageKey = "skaren-premium-active";
export const supportAmountStorageKey = "skaren-support-amount-nok";
export const supporterBadgeStorageKey = "skaren-supporter-badge";

export function getAccountSupportStorageKeys(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      premium: premiumStorageKey,
      amount: supportAmountStorageKey,
      badge: supporterBadgeStorageKey
    };
  }

  return {
    premium: `${premiumStorageKey}:${normalizedEmail}`,
    amount: `${supportAmountStorageKey}:${normalizedEmail}`,
    badge: `${supporterBadgeStorageKey}:${normalizedEmail}`
  };
}

export function getSupporterBadge(amountNok: number) {
  if (amountNok >= 1000) return "Skaren Founder";
  if (amountNok >= 200) return "Founding Supporter";
  return "Supporter";
}

export function isPremiumMetadata(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.plan === "premium" || metadata?.premium === true || metadata?.supporter === true;
}

export function getStoredSupportStatus(email?: string | null) {
  const keys = getAccountSupportStorageKeys(email);
  const amount = Number(window.localStorage.getItem(keys.amount) ?? "0");

  return {
    isSupporter: window.localStorage.getItem(keys.premium) === "true",
    amountNok: Number.isFinite(amount) ? amount : 0,
    badge: window.localStorage.getItem(keys.badge) ?? getSupporterBadge(Number.isFinite(amount) ? amount : 0)
  };
}

export function saveStoredSupportStatus({ email, amountNok, badge }: { email?: string | null; amountNok: number; badge?: string }) {
  const keys = getAccountSupportStorageKeys(email);
  const resolvedBadge = badge ?? getSupporterBadge(amountNok);

  window.localStorage.setItem(keys.premium, "true");
  window.localStorage.setItem(keys.amount, String(amountNok));
  window.localStorage.setItem(keys.badge, resolvedBadge);
}
