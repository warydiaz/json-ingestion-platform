import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    const expectedKey = process.env.API_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException('API_KEY is not configured');
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
