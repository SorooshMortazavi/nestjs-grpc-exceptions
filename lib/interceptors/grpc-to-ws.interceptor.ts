import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class GrpcToWsInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((err) => {
        if (
          !(
            typeof err === 'object' &&
            'details' in err &&
            err.details &&
            typeof err.details === 'string'
          )
        )
          return throwError(() => err);

        const exception = JSON.parse(err.details) as {
          error: string | object;
          type: string;
          exceptionName: string;
        };

        if (exception.exceptionName !== RpcException.name)
          return throwError(() => err);

        return throwError(() => new WsException(exception.error));
      }),
    );
  }
}
