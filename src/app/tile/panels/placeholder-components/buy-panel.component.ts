import { Component, Input } from '@angular/core';
import { PanelContentComponent } from '../panel-content.interface';

@Component({
  template: `
    <div>
      <h4>BuyPanelComponent</h4>
      {{data.test}}
    </div>
  `
})
export class BuyPanelComponent implements PanelContentComponent {
  @Input() data: any;
}
