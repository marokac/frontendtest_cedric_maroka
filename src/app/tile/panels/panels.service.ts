import { Injectable, Type } from '@angular/core';
// import { PayPanelComponent } from '../../tile-panels/pay-panel.component';
// import { BuyPanelComponent } from '../../tile-panels/buy-panel.component';
// import { HistoryPanelComponent } from '../../tile-panels/history-panel.component';
// import { TransferPanelComponent } from '../../tile-panels/transfer-panel.component';
// import { PanelItem } from './panel-item';
// import { NoticeOfPaymentComponent } from '../../tile-panels/notice-of-payment.component';
// import { CashsendHistoryPanelComponent } from '../../tile-panels/cashsend-history-panel.component';
//  import { ErrorHandlerService, HANDLER_TYPE } from '../../error-handler.service';

import { PayPanelComponent } from './placeholder-components/pay-panel.component';
import { BuyPanelComponent } from './placeholder-components/buy-panel.component';
import { HistoryPanelComponent } from './placeholder-components/history-panel.component';
import { CashSendPanelComponent } from './placeholder-components/cashsend-panel.component';
import { TransferPanelComponent } from './placeholder-components/transfer-panel.component';
import { PanelItem } from './panel-item';
import { ViewTransferComponent } from 'app/process/modules/cb-app/transfer/view-transfer/view-transfer.component'


@Injectable()
export class PanelsService {
  private panels: Map<string, PanelItem>;

  constructor() {
    this.panels = new Map();
    this.panels.set('buy', new PanelItem(BuyPanelComponent, {test: 'BuyPanelDataData'}));
    this.panels.set('prepaid-mobile', new PanelItem(BuyPanelComponent, {test: 'Prepaid mobile'}));
    this.panels.set('prepaid-electricity', new PanelItem(BuyPanelComponent, {test: 'Prepaid electricity'}));
    this.panels.set('pay', new PanelItem(PayPanelComponent, {test: 'BuyPanelDataData' }));
    this.panels.set('telkom-landline', new PanelItem(PayPanelComponent, {test: 'Telkom Landline' }));
    this.panels.set('history', new PanelItem(HistoryPanelComponent, {test: 'HistoryPanelComponentData' }));
    // this.panels.set('transfer', new PanelItem(TransferPanelComponent, {test: 'TransferPanelComponent' }));
    // this.panels.set('notice-of-payment', new PanelItem(NoticeOfPaymentComponent, {test: 'TransferPanelComponent' }));
    // this.panels.set('cashsend-history', new PanelItem(CashsendHistoryPanelComponent));
    // this.panels.set('cashsend', new PanelItem(CashsendHistoryPanelComponent));
  }

  getPanel(type: string, data: any) {
    const panel = this.panels.get(type);

    if (panel === undefined) {
      return;
    }

    if (data) {
      panel.setData(data);
    }

    return panel;
  }

  setPanel(type: string, panelItem: Type<any>, data: object) {
    this.panels.set(type, new PanelItem(panelItem, data));
  }
}
