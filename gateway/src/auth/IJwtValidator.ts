import { TokenPayload } from '../types/tokenPayload';

export interface IJwtValidator {
  validate(token: string): Promise<TokenPayload | null>;
  extractUserId(token: string): string | null;
  checkBlacklist(jti: string): Promise<boolean>;
}
