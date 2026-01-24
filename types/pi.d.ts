export {};

declare global {
  interface PiInitOptions {
    version: string;
    sandbox?: boolean;
  }

  interface PiAuthResult {
    accessToken: string;
    user: {
      uid: string;
      username: string;
    };
  }

  interface PiPaymentData {
    amount: number;
    memo?: string;
    metadata?: Record<string, unknown>;
  }

  interface PiPaymentCallbacks {
    onReadyForServerApproval: (paymentId: string) => void;
    onReadyForServerCompletion: (paymentId: string) => void;
    onCancel?: () => void;
    onError?: (error: Error) => void;
  }

  interface Window {
    Pi?: {
      init?: (options: PiInitOptions) => void;
      authenticate: (scopes: string[]) => Promise<PiAuthResult>;
      createPayment: (
        data: PiPaymentData,
        callbacks: PiPaymentCallbacks
      ) => Promise<{ paymentId: string }>;
      logout?: () => void;
    };
    __pi_inited?: boolean;
  }
}
