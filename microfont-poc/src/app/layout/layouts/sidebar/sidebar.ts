import { Component, HostListener, inject } from '@angular/core';
import { MenuDrawer } from './drawers/menu-drawer/menu-drawer';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Search } from '../navbar/actions/search/search';
import { Observable, Subscription } from 'rxjs';

import { ModuleDrawer } from './drawers/module-drawer/module-drawer';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';

import { ProfileDrawer } from './drawers/profile-drawer/profile-drawer';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NovuService } from '../../../shared/services/novu.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { ToastHelperService } from '../../../shared/services/toast-helper.service';
import { SidebarService } from '../../service/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MenuDrawer,
    ModuleDrawer,
    TitleCasePipe,
    CommonModule,
    ProfileDrawer,
    RouterLink,
    Search
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  // Existing properties
  activeItem: string = '';
  drawerOpen: boolean = false;
  drawerType: string = '';
  http = inject(HttpClient);
  fb = inject(FormBuilder);
  router = inject(Router);
  errorMessage: string = '';
  logoutError: boolean = false;
  isLoading: boolean = false;
  coreBaseUrl = environment.apiBaseUrl;
  activeTheme: string = localStorage.getItem('selectedTheme') || '';
  public notifications$: Observable<number>;
  public messages$: Observable<number>;
  isMobile = false;
  toastr = inject(ToastHelperService);
  // New property for sidebar expansion
  sidebarExpanded: boolean = false;
  isMobileOpen: boolean = false;
  private subs = new Subscription();
  private themeSub?: Subscription;
  private previousCount: number = 0;
  constructor(private themeService: ThemeService,
    public authService: AuthService,
    private sidebarService: SidebarService, public notificationService: NotificationService, private novuService: NovuService
  ) {
    this.notifications$ = this.novuService.getUnreadCount();
    this.messages$ = this.notificationService.messages$;

  }

  // Toggle sidebar expansion (Gmail-style)
  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    this.sidebarService.setSidebarState(this.sidebarExpanded);
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  ngOnInit(): void {
    //  Subscribe to theme changes
    this.themeSub = this.themeService.currentTheme$.subscribe(themeId => {
      this.activeTheme = themeId;

    });

    this.subs.add(
      this.sidebarService.sidebarExpanded$.subscribe(expanded => {
        this.sidebarExpanded = expanded;
        console.log('Sidebar expanded:', expanded);
      })
    );

    this.subs.add(
      this.sidebarService.drawerOpen$.subscribe(open => {
        this.drawerOpen = open;
      })
    );

    this.subs.add(
      this.notifications$.subscribe(count => {
        if (count > this.previousCount) {
          this.toastr.notificationAlert(`🔔 You have new notification(s)!`);
        }
        this.previousCount = count;
      })
    );
    this.handleResize();
    console.log('Active Theme in Sidebar:', this.activeTheme);
  }


  @HostListener('window:resize')
  handleResize(): void {
    const width = window.innerWidth;
    this.isMobileOpen = width < 768;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Close drawer when clicking outside of it
    const drawerElement = document.querySelector('.drawer-container');
    const menuButton = document.querySelector('[data-drawer-trigger="Menu"]');
    const moduleButton = document.querySelector('[data-drawer-trigger="Modules"]');
    const profileButton = document.querySelector('[data-drawer-trigger="Profile"]');

    if (this.drawerOpen && drawerElement &&
      !drawerElement.contains(target) &&
      !menuButton?.contains(target) &&
      !moduleButton?.contains(target) &&
      !profileButton?.contains(target)) {
      this.closeDrawer();
    }

    // Close mobile sidebar when clicking outside of it
    const sidebarElement = document.querySelector('.sidebar-container');
    const sidebarToggleButton = document.querySelector('[data-sidebar-toggle]');

    if (this.sidebarExpanded && this.isMobileOpen && sidebarElement &&
      !sidebarElement.contains(target) &&
      !sidebarToggleButton?.contains(target)) {
      this.toggleSidebar();
    }
  }
  onResize() {
    this.checkIfMobile();
  }
  checkIfMobile() {
    this.isMobile = window.innerWidth < 768;
  }
  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }
  doLogout() {
    this.logoutError = false;
    this.errorMessage = '';
    this.isLoading = true;

    // Get the token from storage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!token) {
      console.warn('No token found, clearing storage and redirecting');
      this.clearStorageAndRedirect();
      return;
    }

    // Create the logout payload with session information
    const logoutPayload = this.generatePayload();

    // Create headers with Bearer token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('Logout request with token:', token);
    console.log('Logout payload:', logoutPayload);

    // Make POST request to logout endpoint with payload
    this.http.post(this.coreBaseUrl, logoutPayload, { headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('Logout response', response);

        // Clear storage and redirect after successful logout
        this.clearStorageAndRedirect();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Logout error:', error);

        // Even if the API call fails, clear local storage and redirect
        // This ensures user can't access protected routes with stale token
        this.clearStorageAndRedirect();

        // Optional: Show error message if needed
        this.logoutError = true;
        this.errorMessage = 'Logout completed (with possible server error)';
      }
    });
  }
  private clearStorageAndRedirect() {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Navigate to login page
    this.router.navigateByUrl('/login');

    // Optional: Reload the page to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
  // Existing methods
  setActiveItem(item: string): void {
    if (item == 'logout') this.doLogout();
    const EXCLUDED_PAGES = ['modules', 'profile'] as const;
    if(!EXCLUDED_PAGES.includes(item as any)){

      localStorage.setItem('currentPageName', item);
    }
    this.activeItem = item;
  }


  closeDrawer() {
    this.sidebarService.closeDrawer();
  }
  toggleDrawer(type: string): void {
    if (this.drawerType === type && this.drawerOpen) {
      this.sidebarService.closeDrawer();
    } else {
      this.drawerType = type;
      this.sidebarService.openDrawer();
    }
  }
  generatePayload(): any {
    const currentDateTime = new Date().toISOString();
    console.log("session ID", sessionStorage.getItem('sessionId'));

    return {
      "userId": sessionStorage.getItem('userId'),
      "terminalIp": "192.168.20.69",
      "browser": this.getBrowserName(),
      "sessionId": sessionStorage.getItem('sessionId'),
      "sessionTerminalIp": "192.168.10.127",
      "loginAt": "2025-08-21T10:30:00",
      "logOutAt": currentDateTime
    };
  }
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}
