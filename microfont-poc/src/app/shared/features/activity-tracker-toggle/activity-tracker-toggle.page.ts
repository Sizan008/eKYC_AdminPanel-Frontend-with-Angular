import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GlobalActivityTrackerService } from '../../services/global-activity-tracker.service';
import { GenericSwitch } from '../../common-components/generic-component-type/generic-switch/generic-switch';

@Component({
  selector: 'app-activity-tracker-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GenericSwitch],
  templateUrl: './activity-tracker-toggle.page.html',
  styleUrls: ['./activity-tracker-toggle.page.scss'],
})
export class ActivityTrackerTogglePage implements OnInit {
  frm!: FormGroup;
  switchControlName = 'trackerSwitch';
  
  constructor(
    private fb: FormBuilder,
    private activityTracker: GlobalActivityTrackerService
  ) {}

  ngOnInit() {
    // Initialize form group
    this.frm = this.fb.group({
      [this.switchControlName]: [this.getStoredTrackerState()],
    });

    // Subscribe to switch changes
    const control = this.frm.get(this.switchControlName);
    control?.valueChanges.subscribe((value: boolean) => {
      // Save state to localStorage
      localStorage.setItem('trackerEnabled', value ? 'true' : 'false');

      // Enable or disable tracker
      if (value) {
        this.activityTracker.enable();
      } else {
        this.activityTracker.disable();
      }
    });
  }

  // Load initial state from localStorage
  private getStoredTrackerState(): boolean {
    console.log(localStorage.getItem('trackerEnabled'));
    return localStorage.getItem('trackerEnabled') === 'true';
  }
}
