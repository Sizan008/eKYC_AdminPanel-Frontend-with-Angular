// notification-popover.component.ts
import { Component, EventEmitter, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { InAppNotification, NovuService } from '../../../services/novu.service';

@Component({
  selector: 'app-notification-popover',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="popover-container">
      <!-- Simplified Background -->
      <div class="bg-gradient"></div>

      <!-- Header -->
      <div class="popover-header">
        <div class="header-content">
          <div class="header-icon-wrapper">
            <mat-icon class="header-icon">notifications_active</mat-icon>
          </div>
          <div class="header-text">
            <h3 class="header-title">Notifications</h3>
            <p class="header-count">
              <span class="count-badge" [class.has-unread]="unreadCount > 0">{{ unreadCount }}</span>
              {{ unreadCount === 1 ? 'unread' : 'unread' }}
            </p>
          </div>
        </div>
        <button
          *ngIf="unreadCount > 0"
          (click)="markAllAsRead()"
          class="mark-all-btn"
          title="Mark all as read">
          <mat-icon>done_all</mat-icon>
          <span>Clear</span>
        </button>
      </div>

      <!-- Body -->
      <div class="popover-body">
        <!-- Empty State -->
        <div *ngIf="notifications.length === 0" class="empty-state">
          <div class="empty-icon-wrapper">
            <mat-icon class="empty-icon">check_circle</mat-icon>
          </div>
          <h4 class="empty-title">All Caught Up!</h4>
          <p class="empty-text">No new notifications</p>
        </div>

        <!-- Notifications List -->
        <div *ngFor="let notif of notifications; trackBy: trackByNotificationId"
             class="notification-card"
             [class.unread]="!notif.read"
             (click)="openDetail.emit(notif)">

          <div class="card-content">
            <!-- Status Indicator -->
            <div class="status-indicator" [class.unread]="!notif.read"></div>

            <!-- Main Content -->
            <div class="content-section">
              <div class="content-header">
                <h4 class="notification-title">{{ notif.subject || 'Notification' }}</h4>
                <div class="action-buttons">
                  <button
                    *ngIf="!notif.read"
                    (click)="$event.stopPropagation(); markAsRead(notif._id)"
                    class="action-btn mark-read"
                    title="Mark as read">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button
                    (click)="$event.stopPropagation(); deleteNotification(notif._id)"
                    class="action-btn delete"
                    title="Delete">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
              <p class="notification-content">{{ notif.content }}</p>
              <div class="notification-footer">
                <span class="time-badge">{{ formatTime(notif.createdAt) }}</span>
                <span class="type-badge" [attr.data-type]="getNotificationType(notif)">
                  {{ getNotificationType(notif) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="popover-footer" *ngIf="notifications.length > 0">
        <button class="view-all-btn" (click)="viewAllNotifications()">
          <span>View All Notifications</span>
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      display: block;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    // Optimized CSS Variables
    :host {
      --primary: #6366f1;
      --primary-light: #818cf8;
      --secondary: #ec4899;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --info: #3b82f6;
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --text-primary: #0f172a;
      --text-secondary: #64748b;
      --border: #e2e8f0;
    }

    // Main Container - Simplified
    .popover-container {
      width: 420px;
      max-height: 600px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow:
        0 20px 40px -12px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
      overflow: hidden;
      position: relative;

      @media (max-width: 480px) {
        width: 100vw;
        max-width: 420px;
        border-radius: 16px;
      }
    }

    // Minimal Background
    .bg-gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: linear-gradient(135deg,
        rgba(99, 102, 241, 0.06) 0%,
        rgba(236, 72, 153, 0.06) 100%);
      pointer-events: none;
    }

    // Header - Streamlined
    .popover-header {
      position: relative;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--border);
      z-index: 1;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .header-icon-wrapper {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 12px;
    }

    .header-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: white;
    }

    .header-text {
      flex: 1;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 2px 0;
      letter-spacing: -0.01em;
    }

    .header-count {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 400;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border-radius: 9px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;

      &.has-unread {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
      }
    }

    .mark-all-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: var(--primary-light);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    // Body - Optimized Scrolling
    .popover-body {
      max-height: 420px;
      overflow-y: auto;
      padding: 4px;

      // Simplified scrollbar
      scrollbar-width: thin;
      scrollbar-color: var(--primary) transparent;

      &::-webkit-scrollbar {
        width: 5px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 3px;
      }
    }

    // Empty State - Minimal
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon-wrapper {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg,
        rgba(99, 102, 241, 0.1),
        rgba(236, 72, 153, 0.1));
      border-radius: 50%;
    }

    .empty-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--primary);
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }

    .empty-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    // Notification Card - Performance Optimized
    .notification-card {
      position: relative;
      margin: 6px;
      padding: 14px;
      background: white;
      border-radius: 14px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.2s ease;
      will-change: transform;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: var(--primary);

        .action-buttons {
          opacity: 1;
        }
      }

      &:active {
        transform: scale(0.99);
      }

      &.unread {
        background: linear-gradient(135deg,
          rgba(99, 102, 241, 0.04),
          rgba(236, 72, 153, 0.04));
        border-left: 3px solid var(--primary);
        padding-left: 11px;

        .status-indicator {
          background: var(--primary);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
        }
      }
    }

    .card-content {
      display: flex;
      gap: 12px;
    }

    // Status Indicator - Simplified
    .status-indicator {
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-top: 6px;
      background: var(--border);
      border-radius: 50%;
      transition: all 0.2s ease;

      &.unread {
        background: var(--primary);
        box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
      }
    }

    // Content Section
    .content-section {
      flex: 1;
      min-width: 0;
    }

    .content-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.4;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .action-btn {
      width: 26px;
      height: 26px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: var(--text-secondary);
        transition: color 0.15s ease;
      }

      &:hover {
        transform: scale(1.08);
      }

      &.mark-read:hover {
        background: rgba(16, 185, 129, 0.1);
        mat-icon {
          color: var(--success);
        }
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        mat-icon {
          color: var(--error);
        }
      }
    }

    .notification-content {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .time-badge {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .type-badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &[data-type="info"] {
        background: rgba(59, 130, 246, 0.1);
        color: var(--info);
      }

      &[data-type="success"] {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
      }

      &[data-type="warning"] {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }

      &[data-type="error"] {
        background: rgba(239, 68, 68, 0.1);
        color: var(--error);
      }
    }

    // Footer - Simplified
    .popover-footer {
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .view-all-btn {
      width: 100%;
      padding: 11px 16px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        transition: transform 0.2s ease;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);

        mat-icon {
          transform: translateX(2px);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }

    // Performance optimization
    * {
      box-sizing: border-box;
    }
  `]
})
export class NotificationPopoverComponent implements OnInit, OnDestroy {
  private novuService = inject(NovuService);
  private destroy$ = new Subject<void>();

  notifications: InAppNotification[] = [];
  unreadCount = 0;

  @Output() openDetail = new EventEmitter<InAppNotification>();
  @Output() closePopover = new EventEmitter<void>();
  @Output() viewAll = new EventEmitter<void>();

  ngOnInit() {
    this.novuService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifs => {
        this.notifications = notifs;
      });

    this.novuService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  markAsRead(id: string) {
    this.novuService.markAsRead(id);
  }

  markAllAsRead() {
    this.novuService.markAllAsRead();
  }

  deleteNotification(id: string) {
    this.novuService.deleteNotification(id);
  }

  viewAllNotifications() {
    this.viewAll.emit();
    this.closePopover.emit();
  }

  getNotificationType(notification: InAppNotification): string {
    const subject = notification.subject?.toLowerCase() || '';
    const content = notification.content?.toLowerCase() || '';

    if (subject.includes('error') || content.includes('error') ||
        subject.includes('failed') || content.includes('failed')) {
      return 'error';
    }

    if (subject.includes('warning') || content.includes('warning') ||
        subject.includes('alert') || content.includes('alert')) {
      return 'warning';
    }

    if (subject.includes('success') || content.includes('success') ||
        subject.includes('completed') || content.includes('completed') ||
        subject.includes('approved') || content.includes('approved')) {
      return 'success';
    }

    return 'info';
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  trackByNotificationId(index: number, notification: InAppNotification): string {
    return notification._id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
