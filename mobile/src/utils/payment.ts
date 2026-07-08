import { Platform } from 'react-native';

export type RazorpayCheckoutOptions = {
  description: string;
  image: string;
  currency: string;
  key: string;
  amount: number;
  name: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: { color: string };
};

export type RazorpayCheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const loadRazorpayWebCheckout = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Razorpay web checkout is not available in this runtime.'));
  }
  if ((window as any).Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Could not load Razorpay checkout.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async (
  options: RazorpayCheckoutOptions,
): Promise<RazorpayCheckoutResult> => {
  if (Platform.OS === 'web') {
    await loadRazorpayWebCheckout();

    return new Promise((resolve, reject) => {
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        reject(new Error('Razorpay checkout failed to initialize.'));
        return;
      }

      const checkout = new Razorpay({
        ...options,
        handler: (response: any) => {
            // Web handler returns the response directly
            resolve(response);
        },
        modal: {
          ondismiss: () => reject({ code: 2, description: 'Payment cancelled.' }),
        },
      });
      checkout.open();
    });
  }

  const razorpayModule = require('react-native-razorpay');
  const RazorpayCheckout = razorpayModule.default || razorpayModule;
  return RazorpayCheckout.open(options);
};
