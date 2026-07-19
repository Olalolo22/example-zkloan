export interface AttestationRequest {
  inflow0: number;
  inflow1: number;
  inflow2: number;
  inflow3: number;
  inflow4: number;
  inflow5: number;
  liquidAssets: number;
  monthlyDebtService: number;
  userPubKeyHash: string; // bigint as decimal string
}

export interface AttestationResponse {
  signature: {
    announcement: { x: string; y: string }; // bigint as decimal strings
    response: string;
  };
  message: {
    inflow0: string;
    inflow1: string;
    inflow2: string;
    inflow3: string;
    inflow4: string;
    inflow5: string;
    liquidAssets: string;
    monthlyDebtService: string;
    userPubKeyHash: string;
  };
}

export interface ProviderInfoResponse {
  providerId: number;
  publicKey: { x: string; y: string };
}

export interface HealthResponse {
  status: string;
  providerId: number;
}
