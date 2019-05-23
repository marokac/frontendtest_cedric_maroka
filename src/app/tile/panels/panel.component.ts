import { Component, ViewChild, ComponentFactoryResolver, OnInit, Input } from '@angular/core';

import { PanelDirective } from './panel.directive';
import { PanelContentComponent } from './panel-content.interface';
import { TileService } from '../tile.service';
// import { ErrorHandlerService , HANDLER_TYPE } from '../../error-handler.service';
import { Tile } from '../tile.model';

@Component({
  selector: 'panel',
  templateUrl: './panel.component.html',
})
export class PanelComponent implements OnInit {
  @ViewChild(PanelDirective) panelContainer: PanelDirective;
  @Input() itemData: Tile;

  constructor(private tileService: TileService, private _componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit() {
    // Set the component we want to load from the panels service map
    this.tileService.panelType$.subscribe( data => {
      // First make sure this is the subscription for the relevant PanelComponent instance
      if (data.tileInstance.itemData === this.itemData) {
        try {
          if (data.tileInstance.panelsService) {
            // Use the panels service for the current tile instance so that this can be used on any project.
            this.tileService.setPanelComponent(data.tileInstance.panelsService.getPanel(data.panelType, {test: ''}));
          }
        } catch (e) {
          // ErrorHandlerService._handlingType(HANDLER_TYPE.WARNING, `Failed to get tile instance or panel type. This may have been caused by a lack of a 'panelsService' or 'panelComponent' for the triggered action. See ${e}`);
        }
      }
    });
  }

  loadComponent(item, data?: any) {
    this.clearContainer();

    const viewContainerRef = this.panelContainer.viewContainerRef;
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(item.componentType);

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<PanelContentComponent>componentRef.instance).data = item.panelData;
  }

  clearContainer() {
    const viewContainerRef = this.panelContainer.viewContainerRef;
    viewContainerRef.clear();
  }
}
