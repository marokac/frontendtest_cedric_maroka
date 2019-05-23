import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

export type PanelDataType = { panelType: string, tileInstance?: any };

@Injectable()
export class TileService {
  private drawerOpenedId = new Subject<number>();
  private drawerClosedId = new Subject<number>();
  private actionsPopupOpenedId = new Subject<number>();
  private tileClosed: Subject<any> = new Subject();
  private panelType: Subject<PanelDataType> = new Subject<PanelDataType>();
  private getPanelComponent: Subject<string> = new Subject<string>();

  drawerOpened$ = this.drawerOpenedId.asObservable();
  drawerClosed$ = this.drawerClosedId.asObservable();
  tileClosed$   = this.tileClosed.asObservable();
  panelType$   = this.panelType.asObservable();

  getPanelComponent$   = this.getPanelComponent.asObservable();

  actionsPopupOpened$ = this.actionsPopupOpenedId.asObservable();

  // Backwards compatibility: CBNext
  public drawerIsOpen: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private tileContentUpdateId = new Subject<number>();
  tileContentUpdate$ = this.tileContentUpdateId.asObservable();
  private removeCustomPaddingId = new Subject<number>();
  removeCustomPadding$ = this.removeCustomPaddingId.asObservable();

  openDrawer(tileIndex: number) {
    this.drawerOpenedId.next(tileIndex);
  }

  closeDrawer(tileIndex: number) {
    // console.log('TileService: closeDrawer');
    this.drawerClosedId.next(tileIndex);

    // Added this here so everyone does not need to call it everytime a tile is closed
    this.drawerIsOpen.next(false);
  }

  actionsPopupOpened(tileIndex: number) {
    this.actionsPopupOpenedId.next(tileIndex);
  }

  // This does not seem to be used, but keep here for now (came with protoype code)
  closeTile() {
    this.tileClosed.next();
  }

  setPanelType(data: PanelDataType ) {
    this.panelType.next(data);
  }

  setPanelComponent(panelComponent: any) {
    this.getPanelComponent.next(panelComponent);
  }

  // Backwards compatiility: CB Next

  // Used this to update the Last Transaction field in beneficiary tiles
  updateTileContents(data: any) {
    console.log('updateTileContents for tileIndex and data is ', data);
    this.tileContentUpdateId.next(data);
  }

  removeCustomPadding(data) {
    this.removeCustomPaddingId.next(data);
  }
}
