import { Request, Response } from 'express';

export interface IProtocolAdapter {
  name: string;
  initialize(): Promise<void>;
  proxyRequest(req: Request, res: Response, targetUrl: string): Promise<void>;
  shutdown(): Promise<void>;
}
