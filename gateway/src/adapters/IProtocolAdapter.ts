export type Protocol = 'http' | 'websocket' | 'grpc';


export interface GatewayRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  protocol: Protocol;
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}

export interface IProtocolAdapter {
  name: string;
  initialize(): Promise<void>;

  handleRequest(request: GatewayRequest): Promise<GatewayResponse>;

  shutdown(): Promise<void>;
}
