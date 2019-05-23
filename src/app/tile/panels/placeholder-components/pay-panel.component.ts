import { Component, Input } from '@angular/core';
import { PanelContentComponent } from '../panel-content.interface';

@Component({
  template: `
    <div>
      <h4>Pay Panel Component</h4>
      {{data.test}}
    </div>
  `
})
export class PayPanelComponent implements PanelContentComponent {
  @Input() data: any;
}

