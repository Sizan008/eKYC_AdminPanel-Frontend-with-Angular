import {Component, input, Signal, WritableSignal} from '@angular/core';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-expansion-panel-header',
  standalone: true,
  imports: [],
  templateUrl: './expansion-panel-header.html',
  styleUrl: './expansion-panel-header.scss'
})
export class ExpansionPanelHeader {

  // htmlElement = input.required<any>();
  panelTitle = input<string>();
  isOpenSignal = input.required<WritableSignal<boolean>>();
  private static nextId = 0;
  panelId = `expansion-header-${ExpansionPanelHeader.nextId++}`;

  togglePanel() {
    const sig = this.isOpenSignal();
    sig.set(!sig());
  }

  // togglePanel() {
  //   // const nativeEl = this.htmlElement().nativeElement as HTMLElement;
  //   // nativeEl.classList.toggle('hidden');
  //
  //   if (!this.htmlElement) return;
  //   const element = this.htmlElement();
  //
  //   const currentMaxHeight = window.getComputedStyle(element).maxHeight;
  //
  //   if (currentMaxHeight !== '0px') {
  //     // Hide
  //     element.style.transition = 'max-height 0.3s ease-out, opacity 0.3s ease-out';
  //     element.style.maxHeight = '0';
  //     element.style.opacity = '0';
  //     element.style.overflow = 'hidden';
  //   } else {
  //     // Show
  //     element.style.transition = 'max-height 0.3s ease-in, opacity 0.3s ease-in';
  //     element.style.maxHeight = element.scrollHeight + 'px';
  //     element.style.opacity = '1';
  //     element.style.overflow = 'visible';
  //   }
  //   // this.cd.detectChanges();
  // }

}
