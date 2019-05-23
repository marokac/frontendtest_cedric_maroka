import { Component, Input } from '@angular/core';
import { PanelContentComponent } from '../panel-content.interface';

@Component({
  template: `
    <div>
      <h4>CashSendPanelComponent</h4>
      {{data.test}}
    </div>
  `
})
export class CashSendPanelComponent implements PanelContentComponent {
  @Input() data: any;
}
