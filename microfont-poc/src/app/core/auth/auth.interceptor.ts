import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError, finalize } from 'rxjs';
import { LoaderService } from '../../shared/services/loader.service';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

    const loader = inject(LoaderService);

    // If request asks to skip loader (header) or is an address search, don't show loader
    const skipLoaderHeader = req.headers.get?.('X-Skip-Loader') === 'true';
    const isAddressSearch = req.url.includes('/address-mv/');
    const shouldShowLoader = !skipLoaderHeader && !isAddressSearch;

    if (shouldShowLoader) {
        // 👉 Show loader before request
        loader.show();
    }

    const newReq = req.clone({
        headers: req.headers
            .set('Authorization', 'Bearer ' + sessionStorage.getItem('access_token'))
            .set('branchId', '1')
    });

    // If caller requested skipping loader, remove the header before forwarding
    const forwardedReq = newReq.headers.get?.('X-Skip-Loader') ? newReq.clone({ headers: newReq.headers.delete('X-Skip-Loader') }) : newReq;

    return next(forwardedReq).pipe(
        catchError((error) => {
            return throwError(() => error);
        }),

        // 👉 Hide loader only if we showed it
        finalize(() => {
            if (shouldShowLoader) loader.hide();
        })
    );
};
