// notification-detail-modal.component.ts
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { InAppNotification } from '../../../services/novu.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notification-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
           (click)="$event.stopPropagation()">

        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold">Notification Details</h2>
            <button (click)="close.emit()" class="p-2 hover:bg-white/20 rounded-lg transition">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <p class="text-sm text-gray-500 font-medium">Subject</p>
            <p class="text-lg font-semibold text-gray-900 mt-1">{{ notification.subject }}</p>
          </div>

          <div>
            <p class="text-sm text-gray-500 font-medium">Message</p>
            <p class="text-gray-700 mt-1 whitespace-pre-wrap">{{ notification.content }}</p>
          </div>


          @if(notification.redirect?.url){
                    <div >
          <p class="text-sm text-gray-500 font-medium">Link</p>

          <div class="flex gap-2 mt-1">
            <input
              type="text"
             [value]="
  notification.redirect?.url?.startsWith('http')
    ? notification.redirect?.url
    : (environment.apiBaseUrl + notification.redirect?.url)
"

              readonly
              class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 cursor-pointer"
              (click)="openRedirect(notification.redirect)"
            />

            <button
              (click)="openRedirect(notification.redirect)"
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </div>
          </div>
          }




          <div class="flex items-center justify-between pt-4 border-t">
            <p class="text-sm text-gray-500">
              {{ formatTime(notification.createdAt) }}
            </p>
            <span class="text-xs px-3 py-1 rounded-full"
                  [class.bg-blue-100]="!notification.read"
                  [class.bg-gray-100]="notification.read"
                  [class.text-blue-700]="!notification.read"
                  [class.text-gray-600]="notification.read">
              {{ notification.read ? 'Read' : 'Unread' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationDetailModalComponent {
  @Input() notification: InAppNotification;
  @Output() close = new EventEmitter<void>();
 environment = environment; 
  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  }

        openRedirect(redirect?: { url?: string; target?: string }) {
          if (!redirect?.url) return;

          let finalUrl = redirect.url;

          // Only prepend base URL if it's relative
          if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = `${environment.apiBaseUrl}${finalUrl}`;
          }

          const target = redirect.target || '_blank';

          window.open(finalUrl, target, 'noopener,noreferrer');
        }



}
