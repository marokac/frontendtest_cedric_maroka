import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[panel-container]',
})
export class PanelDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
