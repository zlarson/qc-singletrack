import { HttpInterceptorFn } from '@angular/common/http';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Outgoing request:', req.method, req.url);
  console.log('Headers:', req.headers.keys().map(key => `${key}: ${req.headers.get(key)}`));
  
  return next(req);
};
