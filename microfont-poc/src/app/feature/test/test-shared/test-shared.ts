import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { InputTextBox } from '../../../shared/common-components/input-types/input-text-box/input-text-box';

@Component({
  selector: 'app-test-shared',
  standalone: true,
  imports: [
    InputTextBox
  ],
  templateUrl: './test-shared.html',
  styleUrl: './test-shared.scss',
})
export class TestShared {
  testForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.testForm = this.fb.group({
      transactionReference: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
    });
  }
}