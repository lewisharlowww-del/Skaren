/**
 * EAN-13 / EAN-8 check-digit validation.
 *
 * Typing 13 digits off a pack is error-prone, and a wrong digit produces a
 * lookup miss that looks exactly like "we don't have this product" — which is
 * the one thing Skaren must never say by mistake. Validating locally catches
 * the typo before the request goes out.
 */

/** Sum of digits weighted 1,3,1,3… from the right, excluding the check digit. */
function checksum(digits: number[]): number {
  const body = digits.slice(0, -1);
  const weighted = body
    .reverse()
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (weighted % 10)) % 10;
}

export function isValidEan(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13 && digits.length !== 8) return false;
  const nums = digits.split("").map(Number);
  return checksum([...nums]) === nums[nums.length - 1];
}

/**
 * Live state for the manual-entry field: nothing to say until the code is long
 * enough to check, then either valid or a specific complaint.
 */
export function eanState(value: string): "empty" | "typing" | "valid" | "invalid" {
  const digits = value.replace(/\D/g, "");
  if (!digits.length) return "empty";
  if (digits.length !== 13 && digits.length !== 8) return "typing";
  return isValidEan(digits) ? "valid" : "invalid";
}
