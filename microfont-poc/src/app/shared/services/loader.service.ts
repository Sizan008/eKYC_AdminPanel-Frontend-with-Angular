import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private active = 0;
  private timeoutId: any = null;
  private readonly MAX_LOADING_TIME = 10000; 

  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  show() {
    this.active++;

    if (this.active === 1) {
      this._loading$.next(true);
      this.startTimeout();
    }
  }

  hide() {
    if (this.active > 0) this.active--;

    if (this.active === 0) {
      this.clearTimeout();
      this._loading$.next(false);
    }
  }

  reset() {
    this.active = 0;
    this.clearTimeout();
    this._loading$.next(false);
  }

  private startTimeout() {
    this.clearTimeout();

    this.timeoutId = setTimeout(() => {
      console.warn('Loader auto-hidden after 10 seconds');
      this.reset();
    }, this.MAX_LOADING_TIME);
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
