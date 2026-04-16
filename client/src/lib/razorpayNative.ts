import { registerPlugin } from '@capacitor/core';

export interface RazorpayVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type NativeCheckoutResult = {
  response?: unknown;
} & Record<string, unknown>;

interface NativeCheckoutPlugin {
  open(options: Record<string, unknown>): Promise<NativeCheckoutResult>;
}

const NativeRazorpayCheckout = registerPlugin<NativeCheckoutPlugin>('Checkout');

const tryParseJson = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const toObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'string') {
    return tryParseJson(value) ?? {};
  }

  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  return {};
};

const asString = (value: unknown): string => {
  return typeof value === 'string' ? value : '';
};

export const extractRazorpayCheckoutResponse = (
  rawResult: unknown,
): RazorpayVerificationPayload => {
  const envelope = toObject(rawResult);
  const nested = toObject(envelope.response);
  const source = Object.keys(nested).length > 0 ? nested : envelope;

  const razorpay_order_id = asString(source.razorpay_order_id);
  const razorpay_payment_id = asString(source.razorpay_payment_id);
  const razorpay_signature = asString(source.razorpay_signature);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Unable to parse Razorpay payment response from native checkout');
  }

  return {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  };
};

export const getNativeCheckoutErrorMessage = (error: unknown): string => {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : '';

  if (!rawMessage) {
    return 'Native Razorpay checkout failed';
  }

  const parsed = tryParseJson(rawMessage);
  if (!parsed) {
    return rawMessage;
  }

  if (typeof parsed.description === 'string' && parsed.description.trim()) {
    return parsed.description;
  }

  if (typeof parsed.message === 'string' && parsed.message.trim()) {
    return parsed.message;
  }

  return rawMessage;
};

export const isNativeCheckoutCancelled = (message: string): boolean => {
  return /cancel|dismiss/i.test(message);
};

export const openNativeRazorpayCheckout = (options: Record<string, unknown>) => {
  return NativeRazorpayCheckout.open(options);
};
