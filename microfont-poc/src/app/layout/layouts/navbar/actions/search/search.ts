import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserAccessItem } from '../../../../../core/auth/login/login';
import { SidebarService } from '../../../../service/sidebar.service';

@Component({
    selector: 'app-search',
    imports: [],
    templateUrl: './search.html',
    standalone: true,
    styleUrl: './search.scss'
})
export class Search implements OnInit {

    userAccessList: any[] = [];
    toastr = inject(ToastrService);

    constructor(
        private router: Router,
        private sidebarService: SidebarService
    ) { }

    ngOnInit(): void {
        this.sidebarService.resourceListReady$.subscribe(() => {
            this.loadUserAccessList();
        });
        // Load immediately if already available
        this.loadUserAccessList();
    }

    loadUserAccessList(): void {
      let resourceListString = localStorage.getItem('resourceList');
      if(!resourceListString){
        this.userAccessList = [];
        return;
      }
      let resourceList = JSON.parse(resourceListString);
      const menuItems: UserAccessItem[] = resourceList.filter((item:any) =>
        item?.attributes?.functionType !== 'R'
      ).map((m: any) => ({
        FunctionId: m.attributes.functionId,
        FunctionName: m.attributes.functionName,
        HOFunctionFlag: '0',
        AllowMaintAddFlag: '1',
        AllowMaintEditFlag: '1',
        AllowMaintDelFlag: '0',
        AllowMaintViewFlag: '1',
        AllowMaintAuthFlag: '1',
        AllowProcessFlag: '1',
        AllowReportViewFlag: '1',
        AllowReportPrintFlag: '1',
        AllowReportGenFlag: '1',
        AllowAnyOfficeOpsFlag: '1',
        ModuleId: m.attributes.moduleId,
        ModuleName: m.attributes.moduleName,
        AppRoute: m.uris,
        routePath: m.routePath,
        ItemType: 'F',
        QuickRouteNo: m.attributes.quickRoute,
        IsFinancial: '0'
      }));

        this.userAccessList = menuItems;
    }
    catch (error:any) {
      console.error('Error parsing resourceList from localStorage:', error);
      this.userAccessList = [];
      return;
    }

    handleFastPath(input: any) {
        const enteredCode = input.value.trim();
        if (!enteredCode) return;
        const match = this.userAccessList.find(
            x => x.QuickRouteNo.toString().toLowerCase() === enteredCode.toLowerCase()
        );

        if (match) {
            this.router.navigate([match.routePath]);
        } else {
            this.toastr.warning('Invalid Route Number.', 'Invalid');
        }

        input.value = '';
    }

}
