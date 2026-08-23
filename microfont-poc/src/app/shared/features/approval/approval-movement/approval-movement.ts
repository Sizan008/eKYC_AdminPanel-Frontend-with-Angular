import {
  Component,
  EnvironmentInjector,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  OnInit,
  inject,
  WritableSignal,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { ComponentRegistry } from '../component-registry';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ApprovalService } from '../../../services/approval-service';
import { HighlightService } from '../../../services/highlight.service';
import { BUTTON_VISIBILITY } from '../../../constant/button-signals.constant';
import { ExpansionPanelHeader } from '../../../common-components/expansion-panel-header/expansion-panel-header';
import { FormControlHighlightDirective } from '../../../directives/form-control-highlight.directive';
import { InputTextBox } from '../../../common-components/input-types/input-text-box/input-text-box';
import { ApprovalRequest } from '../../../models/approval';
import { GenericButton } from '../../../common-components/generic-component-type/generic-button/generic-button';
import { UserService } from '../../../../core/user/user.service';
import { User } from '../../../../core/user/user.types';

type DiffMap = Record<string, boolean>;

@Component({
    selector: 'app-approval-movement',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIcon, ExpansionPanelHeader, FormsModule],
    templateUrl: './approval-movement.html',
    styleUrl: './approval-movement.scss'
})
export class ApprovalMovement implements OnInit, AfterViewInit {

  @ViewChild('dynamicHostLeft', { read: ViewContainerRef, static: false })
    private hostLeft!: ViewContainerRef;

    @ViewChild('dynamicHostRight', { read: ViewContainerRef, static: false })
    private hostRight!: ViewContainerRef;
    toastr = inject(ToastrService);
    data: any;
    private diffMap: DiffMap = {};
    private setId: number;
    private approvalRequest: ApprovalRequest;
    userId: string = '';
    officeId: string = '';
    rejectReason: string = '';

    businessHeaderPanel: WritableSignal<boolean> = signal(true);
    constructor(
        private registry: ComponentRegistry,
        private env: EnvironmentInjector,
        private approvalService: ApprovalService,
        private router: Router,
        private location: Location,
        private hl: HighlightService,
        private userService: UserService
    ) {
        const nav = this.router.getCurrentNavigation();
        this.data = nav?.extras.state?.['data'] || null;

        BUTTON_VISIBILITY.set({
            save: false,
            update: false,
            view: false,
            delete: false,
            exit: false,
            reset: false
        });
    }

    ngOnInit(): void {
        if (!this.data) return;

        if (typeof this.data === 'string') {
            try {
                this.data = JSON.parse(this.data);
                console.log(' Parsed data from string:', this.data);
            } catch (e) {
                console.error(' Invalid JSON in router state:', e);
                return;
            }
        }

         this.userService.user$.subscribe((user: User) => {
              this.userId = user.username;
              this.officeId = user.officeId;
            });

        this.setId = this.data.setId;

        console.log('user id : ', this.userId);
        console.log('data line movement : ', this.data);
        this.data.currentUxContent = this.data.currentContext || this.safeParse(this.data.currentUxContent);
        this.data.previousUxContent = this.data.previousContext || this.safeParse(this.data.previousUxContent);
        console.log('data line currentUxContent : ', this.data.currentUxContent) ;
        console.log('data line previousUxContent : ', this.data.previousUxContent );
        if (this.data?.currentUxContent) {
            this.diffMap = buildDiffMap(this.data.previousUxContent, this.data.currentUxContent, []);
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.renderBoth());
    }
    // Safe parser helper
    safeParse(value: any): any {
        if (!value) return {};
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            console.warn('Failed to parse JSON:', value, e);
            return {};
        }
    }
    // approval-movement.component.ts

    // approval-movement.component.ts

    // approval-movement.component.ts

    private renderBoth(): void {
        if (!this.data) return;

        // Parse JSON if needed
        if (typeof this.data.currentUxContent === 'string') {
            this.data.currentUxContent = JSON.parse(this.data.currentUxContent);
        }
        if (typeof this.data.previousUxContent === 'string') {
            this.data.previousUxContent = JSON.parse(this.data.previousUxContent);
        }

        // Compute diff map
        const diffMap = buildDiffMap(
            this.data.previousUxContent,
            this.data.currentUxContent,
            []
        );

        const isBothhost = !!(this.hostLeft && this.hostRight);

        // Render LEFT (Change Request) with highlightMap
        this.createInto(this.data.selector, this.hostLeft, this.data.currentUxContent, true, isBothhost, diffMap);

        // Render RIGHT (Previous) WITHOUT highlightMap
        if (this.hasPreviousContent() && this.hostRight) {
            const sel = this.data.previousUxContent.selector || this.data.selector;
            this.createInto(sel, this.hostRight, this.data.previousUxContent, isBothhost, true); // no map
        }
    }

   hasPreviousContent(): boolean {
        const prev = this.data?.previousUxContent;
        if (!prev) return false;
        // Treat empty objects/arrays as missing
        if (Array.isArray(prev)) {
            return prev.length > 0;
        }
        if (typeof prev === 'object') {
            return Object.keys(prev).length > 0;
        }
        return !!prev;
    }

    private createInto(
        selector: string,
        host: ViewContainerRef,
        data: any,
        isView: boolean,
        isBothhost: boolean,
        highlightMap?: Record<string, boolean> // optional
    ): void {
        const compType = this.registry.resolve(selector);
        if (!compType) return;

        host.clear();
        const ref = host.createComponent(compType, { environmentInjector: this.env });
        console.log(' viewObject : ', data);
        ref.setInput('viewObject', data);
        console.log(' isView : ', isView);
        ref.setInput('isViewDetails', isView);
        ref.setInput('isApprovalView', isBothhost);

        // Only pass highlightMap if provided
        if (highlightMap) {
            ref.setInput('highlightMap', highlightMap);
        }

        (ref.instance as any).viewData = data;
        (ref.instance as any).isView = isView;
        (ref.instance as any).isApprovalView = isBothhost;
        if (highlightMap) (ref.instance as any).highlightMap = highlightMap;

    }

    onApprove() {
        this.approvalService.performApprovalOperation({
            officeId: Number(this.officeId),
            appId: 1,
            setId: this.setId,
            approvalLevel: 0,
            nextApprovalLevel: 1,
            remarks: this.rejectReason,
            userId: this.userId,
            approvalFlag: 1
        }).subscribe({
            next: res => {
                this.toastr.success('Approved successfully');
                this.router.navigate(['/poc/approval-items']);
            },
            error: err => {
                console.error('Approval failed:', err);
                this.toastr.error('Approval Failed Due to : ', err.error.message);
            }
        });
    }
    onReject() {
        if (this.rejectReason == "") {
            this.toastr.warning('Remarks Required!');
        }
        else {
            this.approvalService.performApprovalOperation({
                officeId: Number(this.officeId),
                appId: 1,
                setId: this.setId,
                approvalLevel: 0,
                nextApprovalLevel: 1,
                remarks: this.rejectReason,
                userId: this.userId,
                approvalFlag: 2
            }).subscribe({
                next: res => {
                  this.toastr.error('Reject successfully');
                    this.router.navigate(['/poc/approval-items']);
                },
                error: err => {
                    console.error('Reject failed:', err);
                    this.toastr.error('Reject Failed Due to : ', err.error.message);

                }
            });
        }

    }

    onSendBack() {
        if (this.rejectReason == "") {
            this.toastr.warning('Remarks Required!');
        }
        else {
            this.approvalService.performApprovalOperation({
                officeId: Number(this.officeId),
                appId: 1,
                setId: this.setId,
                approvalLevel: 0,
                nextApprovalLevel: 1,
                remarks: this.rejectReason,
                userId: this.userId,
                approvalFlag: 3
            }).subscribe({
                next: res => {
                    console.log('Approval success:');
                    this.toastr.success('Approved successfully');
                    this.router.navigate(['/poc/approval-items']);
                },
                error: err => {
                    console.error('Approval failed:', err);
                    this.toastr.error('Approval Failed Due to : ', err);

                }
            });
        }

    }

    goBack() {
        this.location.back();
    }


}

/** Deep diff helper */
function buildDiffMap(
    a: any,
    b: any,
    ignorePaths: string[] = [],
    base: string = ''
): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    const ignore = new Set(ignorePaths);

    const isObj = (x: any) => x !== null && typeof x === 'object';
    const isArr = Array.isArray;
    const mark = (p: string) => !ignore.has(p) && (map[p] = true);

    const walk = (x: any, y: any, path: string) => {
        if (Object.is(x, y)) return;
        if (!isObj(x) || !isObj(y) || (isArr(x) !== isArr(y))) {
            mark(path);
            return;
        }
        if (isArr(x) && isArr(y)) {
            if (x.length !== y.length) {
                mark(path);
                return;
            }
            for (let i = 0; i < x.length; i++) walk(x[i], y[i], path ? `${path}[${i}]` : `[${i}]`);
            return;
        }
        const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
        for (const k of keys) {
            const child = path ? `${path}.${k}` : k;
            if (!(k in x) || !(k in y)) {
                mark(child);
                continue;
            }
            walk(x[k], y[k], child);
        }
    };

    walk(a, b, base);
    return map;
}
