import { GatewayRequest, GatewayResponse } from '../adapters/IProtocolAdapter';
import { RouteConfig } from '../config/routes';


export interface IRequestRouter {

  registerRoute(config: RouteConfig): void;


  route(request: GatewayRequest, userId?: string): Promise<GatewayResponse>;

 
  getRouteForPath(path: string): RouteConfig | null;
}
