import { Component, effect, signal, WritableSignal } from '@angular/core';
import { Save } from './actions/save/save';
import { View } from './actions/view/view';
import { Delete } from './actions/delete/delete';
import { Reset } from './actions/reset/reset';
import { Exit } from './actions/exit/exit';
import { Update } from './actions/update/update';

import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CustomAction } from './actions/custom-action/custom-action';
import { BUTTON_VISIBILITY, ONCLICK_SAVE_NEXT, ONCLICK_UPDATE_NEXT, ButtonUtils } from '../../../shared/constant/button-signals.constant';
import { SidebarService } from '../../service/sidebar.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  imports: [
    Save,
    View,
    Delete,
    Reset,
    Exit,
    Update,
    CustomAction
  ],
  templateUrl: './navbar.html',
  standalone: true,
  styleUrl: './navbar.scss'
})
export class Navbar {

  buttons = BUTTON_VISIBILITY;
  onClickSaveNext = ONCLICK_SAVE_NEXT;
  onClickUpdateNext = ONCLICK_UPDATE_NEXT;
  toggleMenu: boolean = false;
  sidebarExpanded: boolean = false;
  moduleName = signal('');
  moduleLogo = signal('/asset/logos/default.png');
  currentPageName = signal('');
  constructor(private sidebarService: SidebarService, private router: Router, private http: HttpClient) {
    // this.sidebarService.selectedModuleName$.subscribe(name => {
    //   this.moduleName.set(name);
    // });
    this.moduleName.set(environment.appName);
    this.sidebarService.currentPageName$.subscribe(pageName => {
      this.currentPageName.set(pageName);
      console.log('Navbar page name updated to:', pageName);
    });
  }

  ngOnInit() {
    // Compute module logo (may be default if appList isn't in localStorage yet)
    this.moduleLogo.set(this.computeModuleLogo());

    // Recompute logo when appList becomes available (first login, API loads after init)
    this.sidebarService.appListReady$.subscribe(() => {
      this.moduleLogo.set(this.computeModuleLogo());
    });

    // Update page name when resourceList becomes available
    this.sidebarService.resourceListReady$.subscribe(() => {
      this.updatePageNameFromRoute();
    });

    // Proactively initialize page name from local storage to prevent flashing empty
    // when a page is manually reloaded
    this.sidebarService.initializePageName();
    
    // Attempt to resolve immediately in case resources are already available
    const currentUrl = this.router.url;
    if (currentUrl.includes('/landing/home')) {
      this.sidebarService.setCurrentPageName('');
    } else {
      this.updatePageNameFromRoute();
    }

    // Subscribe for subsequent in-app navigations
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || this.router.url;

        if (url.includes('/landing/home')) {
          this.sidebarService.setCurrentPageName('');
          return;
        }

        this.updatePageNameFromRoute(url);
      });
  }




  private updatePageNameFromRoute(urlOverride?: string) {
    try {
      const currentUrl = urlOverride || this.router.url;
      console.log('Current URL:', currentUrl);

      const resourceListString = localStorage.getItem('resourceList');
      if (!resourceListString) {
        console.log('No resourceList found');
        return;
      }

      const resourceList = JSON.parse(resourceListString);

      // Find matching function based on current route
      const matchingFunction = resourceList.find((item: any) => {
        if (!item?.attributes?.functionName) return false;
        
        const currentPath = currentUrl.split('?')[0].toLowerCase();
        
        // Match against routePath
        const routePathStr = Array.isArray(item.routePath) ? item.routePath[0] : item.routePath;
        if (routePathStr) {
           const normRoutePath = (routePathStr.startsWith('/') ? routePathStr : '/' + routePathStr).toLowerCase();
           if (currentPath === normRoutePath || currentPath.startsWith(normRoutePath + '/')) {
              return true;
           }
        }
        
        // Match against uris
        const urisStr = Array.isArray(item.uris) ? item.uris[0] : item.uris;
        if (urisStr) {
           const normUris = (urisStr.startsWith('/') ? urisStr : '/' + urisStr).toLowerCase();
           if (currentPath === normUris || currentPath.startsWith(normUris + '/')) {
              return true;
           }
        }

        // Fallback to functionId
        if (item?.attributes?.functionId) {
          const functionId = item.attributes.functionId.toLowerCase();
          return currentPath.includes(functionId) ||
            currentPath.includes(functionId.replace(/[^a-z0-9]/g, '')) ||
            this.isRouteMatch(currentPath, functionId);
        }
        
        return false;
      });

      if (matchingFunction) {
        this.sidebarService.setCurrentPageName(
          matchingFunction.attributes.functionName
        );
      } else {
        // Clear stale page name when no match is found for the new route
        // EXCEPT on initial load where resourceList or Angular routing might be out of sync
        // Instead of aggressively clearing, we leave whatever was restored from localStorage,
        // because we explicitly clear for the home page elsewhere.
      }


    } catch (error) {
      console.error('Error updating page name from route:', error);
      this.currentPageName.set(' ');
    }
  }

  private isRouteMatch(currentPath: string, functionId: string): boolean {
    // Custom matching logic - adjust based on your needs
    const routeSegments = currentPath.split('/').filter(segment => segment);
    const lastSegment = routeSegments[routeSegments.length - 1] || '';

    return lastSegment.includes(functionId.toLowerCase()) ||
      functionId.toLowerCase().includes(lastSegment);
  }

  // private startModuleNameWatcher() {
  //   // Check immediately
  //   this.updateModuleFromStorage();

  //   // Then check every 100ms for 5 seconds after login
  //   let checkCount = 0;
  //   const maxChecks = 50; // 5 seconds

  //   const watcher = setInterval(() => {
  //     this.updateModuleFromStorage();
  //     checkCount++;

  //     if (checkCount >= maxChecks) {
  //       clearInterval(watcher);
  //       console.log('Module name watcher stopped');
  //     }
  //   }, 100);
  // }

  // private updateModuleFromStorage() {
  //   const storedModuleName = localStorage.getItem('selectedModuleName');

  //   if (storedModuleName && storedModuleName !== this.moduleName()) {
  //     this.moduleName.set(storedModuleName);
  //     console.log('Navbar module updated to:', storedModuleName);
  //   }
  // }


  //  detectModuleByPort() {
  //     // Quick fix for string-only localStorage
  //     const appListString = localStorage.getItem('appList');
  //     const selectedModuleName = localStorage.getItem('selectedModuleName');

  //     if (selectedModuleName) {
  //       this.moduleName.set(selectedModuleName);
  //       this.sidebarService.setSelectedModuleName(selectedModuleName);
  //     } else if (appListString && appListString === 'Sentinel') {
  //       this.moduleName.set('Sentinel');
  //       this.sidebarService.setSelectedModuleName('Sentinel');
  //       localStorage.setItem('selectedModuleName', 'Sentinel');
  //     } else {
  //       this.moduleName.set('Nexo');
  //     }

  //   }
  private computeModuleLogo(): string {
    const appListString = localStorage.getItem('appList');
    const defaultLogo = '/asset/logos/default.png';

    if (!appListString) {
      return defaultLogo;
    }

    //  CASE 1: appList is just a string like "Sentinel"
    if (!appListString.trim().startsWith('[')) {
      console.warn('appList is not JSON, treating as module name:', appListString);
      return `/asset/logos/${this.apporSlug(appListString)}.png`;
    }

    try {
      const appList = JSON.parse(appListString);
      console.log('appList ', appList);
      const currentModule = appList.find(
        (m: any) => m.appId == environment.appId
      );

      if (currentModule?.appId) {
        return `/asset/logos/${currentModule.appId}.png`;
      }

      return defaultLogo;

    } catch (err) {
      console.error('Error parsing appList:', err);
      return defaultLogo;
    }
  }

  // optional helper
  private apporSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '');
  }


  navigateToHome() {
    console.log('Navigating to home page');
    this.router.navigate(['landing/home']);
    this.sidebarService.setCurrentPageName('');
  }
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
    console.log('Navbar toggle clicked');
  }

  // Helper methods for button state checking
  isButtonVisible(buttonKey: keyof import('../../../shared/models/button.actions.model').ButtonActionsModel): boolean {
    return ButtonUtils.isButtonVisible(buttonKey);
  }

  isButtonEnabled(buttonKey: keyof import('../../../shared/models/button.actions.model').ButtonActionsModel): boolean {
    return ButtonUtils.isButtonEnabled(buttonKey);
  }
}
