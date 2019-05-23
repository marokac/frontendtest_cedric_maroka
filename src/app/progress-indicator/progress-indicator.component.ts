import { Component, OnInit, Input } from '@angular/core';
import { Step } from './step.model';


@Component({
  selector: 'progress-indicator',
  templateUrl: './progress-indicator.component.html',
  styleUrls: ['./progress-indicator.component.scss']
})
export class ProgressIndicatorComponent implements OnInit {
  @Input() data: Step[];
  currentStep: number;
  totalSteps: number;

  constructor() {
  }

  ngOnInit() {
    this.totalSteps = this.data.length;
    this.setStep(1);
  }

  setStep(num: number) {
    this.currentStep = num;

    // Reset all states
    for (let i = 0; i < this.totalSteps; i++) {
      this.data[i].isComplete = false;
      this.data[i].isCurrent = false;
    }

    // Set previous steps to 'complete'
    for (let i = 0; i < num; i++) {
      this.data[i].isComplete = true;
    }

    // Set specified step to 'current'
    this.data[num - 1].isCurrent = true;
  }

  stepNext() {
    const nextStep = this.currentStep + 1;
    if (nextStep <= this.totalSteps) {
      this.setStep(nextStep);
    }
  }

  stepBack() {
    const nextStep = this.currentStep - 1;
    if (nextStep > 0) {
      this.setStep(nextStep);
    }
  }

}
