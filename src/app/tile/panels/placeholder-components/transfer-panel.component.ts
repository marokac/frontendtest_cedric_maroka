import { Component, Input } from '@angular/core';
import { PanelContentComponent } from '../panel-content.interface';

@Component({
  template: `
    <div>
      <h4>TransferPanelComponent</h4>
      {{data.test}}
    </div>
  `
})
export class TransferPanelComponent implements PanelContentComponent {
  @Input() data: any;
}
