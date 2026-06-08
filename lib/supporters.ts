// Stripe supporters has been removed from Skaren.
// This stub prevents build errors from orphaned API route imports.

export async function upsertSupporterRecord(..._args: unknown[]): Promise<null> {
  return null;
}

export async function updateSupporterRecordByStripeIds(..._args: unknown[]): Promise<null> {
  return null;
}

export async function getSupporterRecordForUser(..._args: unknown[]): Promise<null> {
  return null;
}

export function getSupporterStatusFromAmount(_amountNok: number): string {
  return "inactive";
}

export function getSupporterBadgeFromRecord(): string {
  return "Supporter";
}

export function supporterStatusIsActive(_status?: string | null): boolean {
  return false;
}

export type SupporterStatus = "supporter" | "founding_supporter" | "skaren_founder" | "active" | "past_due" | "canceled" | "inactive";
export type SupporterRecord = { user_id: string };
