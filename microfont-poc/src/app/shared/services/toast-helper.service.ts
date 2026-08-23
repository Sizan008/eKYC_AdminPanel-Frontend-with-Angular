// src/app/services/app-toastr.service.ts
import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig, ActiveToast } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastHelperService {
  // global defaults we want to enforce
  private readonly defaults: Partial<IndividualConfig> = {
    positionClass: 'custom-toast-position',
    timeOut: 3000,
    progressBar: true,
    closeButton: true
  };

  constructor(private toastr: ToastrService) {}

  // Generic show wrapper
  show(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    const opts = { ...this.defaults, ...override };
    return this.toastr.show(message || '', title || '', opts);
  }

  success(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    const opts = { ...this.defaults, ...override };
    return this.toastr.success(message || '', title || '', opts);
  }

 notificationAlert(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
  const opts = {
    positionClass: 'notification-toast-position',
    timeOut: 3000,
    progressBar: true,
    closeButton: true,
    tapToDismiss: true,
    enableHtml: true,
    toastClass: 'ngx-toastr notification-alert-custom',
    titleClass: 'notification-title',
    messageClass: 'notification-message',
    ...override
  };
  return this.toastr.warning(message || '', title || '', opts);
}

  info(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    const opts = { ...this.defaults, ...override };
    return this.toastr.info(message || '', title || '', opts);
  }

  warning(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    const opts = { ...this.defaults, ...override };
    return this.toastr.warning(message || '', title || '', opts);
  }

  error(message?: string, title?: string, override?: Partial<IndividualConfig>): ActiveToast<any> {
    const opts = { ...this.defaults, ...override };
    return this.toastr.error(message || '', title || '', opts);
  }

}
