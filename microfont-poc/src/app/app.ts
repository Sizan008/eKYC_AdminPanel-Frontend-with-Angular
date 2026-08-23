import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme.service';
import { GlobalActivityTrackerService } from './shared/services/global-activity-tracker.service';
import { NovuService } from './shared/services/novu.service';
import { LoaderService } from './shared/services/loader.service';
import { Title } from '@angular/platform-browser';
import pkg from '../../package.json';

import { environment } from '../environments/environment';
import { LoaderComponent } from './shared/common-components/loader/loader.component';
import { AuthService } from './core/auth/auth.service';
import { UserService } from './core/user/user.service';
import { User } from './core/user/user.types';
import { SidebarService } from './layout/service/sidebar.service';
import { ButtonUtils } from './shared/constant/button-signals.constant';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CommonModule],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'LdsComponentProject';
  authService = inject(AuthService);
  userId: string;
  private userService = inject(UserService);
  constructor(private themeService: ThemeService,
    public loaderService: LoaderService,
    private router: Router,
    private activityTracker: GlobalActivityTrackerService,
    private rootTitle: Title,
    private sidebarService: SidebarService,
    private novuService: NovuService) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      const resetRoutes = ['/', '/landing/home', '/dashboard'];

      if (resetRoutes.includes(url)) {
        ButtonUtils.resetAll();
      }
    });
  }



  async ngOnInit() {
    const isAuthenticated = await this.authService.init();
    const currentPath = window.location.pathname;

    if (isAuthenticated) {
      this.authService.decodeToken();

      // Load resources with debugging
      this.authService.getResources().subscribe({
        next: (res) => {
          localStorage.setItem('resourceList', JSON.stringify(res));

          // Verify storage
          const storedResources = localStorage.getItem('resourceList');

          // Notify that resourceList is ready
          this.sidebarService.notifyResourceListReady();
        },
        error: (error) => {
          console.error('Error loading resources:', error);
          localStorage.setItem('resourceList', '[]');
          this.sidebarService.notifyResourceListReady();
        }
      });

      // Load applications with debugging
      this.authService.getUserWiseApplications().subscribe({
        next: (res) => {


          localStorage.setItem('appList', JSON.stringify(res));


          // Verify storage
          const storedAppList = localStorage.getItem('appList');

          // Detect module after appList is loaded
          this.detectAndSetModuleByPort();

          // Notify navbar to recompute logo now that appList is available
          this.sidebarService.notifyAppListReady();
        },
        error: (error) => {
          console.error('Error loading applications:', error);
          localStorage.setItem('appList', '[]');
          this.sidebarService.notifyAppListReady();
        }
      });

    } else {
      this.authService.login();
    }

    this.userService.user$.subscribe((user: User) => {
      this.userId = user.username;
    });

    this.rootTitle.setTitle(pkg.name || 'Default Title');

    const userIdinit = this.userId;
    if (userIdinit) {
      console.log('Novu initializing for user:', userIdinit);
      await this.novuService.init(userIdinit, environment.novu_identifier);
    } else {
      this.authService.login();
    }
  }


  private detectAndSetModuleByPort() {
    setTimeout(() => {
      try {
        const currentPort = window.location.port;
        const appList = localStorage.getItem('appList');

        if (appList) {
          const parsedAppList = JSON.parse(appList);
          const matchingModule = parsedAppList.find((app: any) => {
            if (app.appUri && (environment.appId === app.appId)) {
              console.log(app.appId);
              const urlMatch = app.appUri.match(/:(\d+)/);
              return urlMatch && urlMatch[1] === currentPort;
            }
            return false;
          });

          if (matchingModule) {
            localStorage.setItem('selectedModuleName', matchingModule.appName);
          }
        }
      } catch (error) {
        console.error('Error in app module detection:', error);
      }
    }, 500); // Longer delay to ensure everything is loaded

  }
}


