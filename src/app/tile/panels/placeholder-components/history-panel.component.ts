import { Component, Input } from '@angular/core';
import { PanelContentComponent } from '../panel-content.interface';

@Component({
  template: `
    <div>
      <h4>HistoryPanelComponent</h4>
      {{data.test}}
    </div>
  `
})
export class HistoryPanelComponent implements PanelContentComponent {
  @Input() data: any;
}
