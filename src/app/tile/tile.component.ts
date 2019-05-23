import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TileService } from './tile.service';
import { Subscription } from 'rxjs/Subscription';
import { PanelComponent } from './panels/panel.component';
// import { SmoothScrollService } from '../smooth-scroll.service';
// import { ErrorHandlerService, HANDLER_TYPE } from '../error-handler.service';
import { Tile } from './tile.model';
import { MessageBusService, message } from 'app/common/services/message-bus.service';
import { Utils} from 'app/core/utils/utils';
import { Translator } from 'angular-translator';
import { DataLossWarningService } from 'app/common/services/data-loss-warning.service';
import { TweenLite, Power2 } from 'gsap';
import 'gsap/ScrollToPlugin';
import 'gsap/CSSPlugin';
import { ScrollUtilService } from 'app/core/utils/scroll-util.service';

@Component({
  selector: 'tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  host: {
    '(document:click)': 'onOutsideClick($event)',
    '(document:touchend)': 'onOutsideClick($event)',
  }
})
export class TileComponent implements OnInit, OnDestroy, AfterViewInit {
  actionsDropdownIsOpen: boolean = false;
  actionsInDropdown: boolean = false;
  drawerIsOpen: boolean = false;
  tileIsOpen: boolean = false;
  // subscription: Subscription;
  tileIsHidden: boolean = false;
  lastScrollPos: number = 0;
  moreButtonKeyboardPressed: boolean = false;
  ariaLabel: string = '';
  moreIsShowing: boolean = false;
  dataBalancesIsShowing: boolean = false;
  needMoreLink: boolean = false;
  // Leaving this here for old code that still references this member variable.
  panelsService: any = null;
  actionCount: number;
  defaultAction: {};
  hasSingleAction: boolean = false;
  containerTabIndex: number = 0;

  MAX_ACTIONS: number = 4;
  MAX_CHARACTER_COUNT_TOTAL: number = 45;
  MORE_BUTTON_PROXY_CHARACTER_COUNT: number = 10;

  protected _panelComponent: Component | any;

  @Input() itemData: Tile;
  @Input() tileIndex: number;
  @ViewChild(PanelComponent) panelComponent;
  @ViewChild('dataBalances') dataBalancesEl;

  // Backwards compatiblity
  setFocus: boolean = false;
  @Input() itemIndex: number;
  @Output() drawerOpened = new EventEmitter();
  @Output() drawerClosed = new EventEmitter();
  drawerNoPadding: string = null;
  drawerNoLimitedWidth: string = null;
  focusOnCloseButton: boolean = false;
  subscription: Subscription = new Subscription();
  utils: Utils;
  updatingTileHeaderContent = false;
  translations: object = {};
  actionOverflowCount: number = 0;
  @ViewChild('tileSizerOne') tileSizerOne: ElementRef;
  @ViewChild('tileSizerContainerOne') tileSizerContainerOne: ElementRef;
  @ViewChild('tileSizerTwo') tileSizerTwo: ElementRef;
  @ViewChild('tileSizerContainerTwo') tileSizerContainerTwo: ElementRef;

  constructor( // private _smoothScroll: SmoothScrollService,
    private cdRef: ChangeDetectorRef,
    public _eref: ElementRef, private tileService: TileService,
    private messageBusService: MessageBusService,
    private translator: Translator,
    private scrollUtils: ScrollUtilService,
    private dataLossWarningService: DataLossWarningService,
    ) {

    // console.log('TileComponent: constructor and this.itemData >> ', this.itemData);

    // Detach change detection temporarily until needed again
    this.cdRef.detach();

    this.utils = new Utils();

    this.subscription.add(tileService.drawerOpened$.subscribe(
      drawerOpenedIndex => {
        // console.log('TileComponent: tileService.drawerOpened$.subscribe and drawerOpenedIndex >> ', drawerOpenedIndex);
        // console.log('TileComponent: tileService.drawerOpened$.subscribe and this.itemIndex >> ', this.itemIndex);
        this.setFocus = false;
        if (drawerOpenedIndex !== this.itemIndex) {
          this.tileIsHidden = true;
          this.detectChangeDetectionChanges();
        }
      }
    ));

    this.subscription.add(tileService.drawerClosed$.subscribe(
      drawerClosedIndex => {
        // console.log('TileComponent: tileService.drawerClosed$.subscribe');

        if (!this.tileIsHidden) {
          this.closeTile();
          this.setFocus = true;
        }
        this.tileIsHidden = false;
        this.detectChangeDetectionChanges();

      }
    ));

    this.subscription.add(tileService.tileClosed$.subscribe( _ => {
      // console.log('TileComponent: tileService.tileClosed$.subscribe');
      this.closeTile();
    }))

    // In some cases the custom padding was being used, and in that same drawer another scenario began where the padding was needed. Hence this was added.
    this.subscription.add(tileService.removeCustomPadding$.subscribe(
      data => {
        if (!this.tileIsHidden) {
          this.drawerNoPadding = null;

          // Should this be on it's own
          this.drawerNoLimitedWidth = null;
        }
      }
    ));

    // Subscribe to this to update content of ONLY the opened tile (requirement for beneficiary tiles)
    // This could be modified if content needs to be updated when the tile is not opened
    this.subscription.add(this.tileService.tileContentUpdate$.subscribe(
      data => {
        if (!this.tileIsHidden) {
          if (this.itemData.type == 'beneficiary') { // this will only happen for beneficiary tiles to update the last transaction subtitle
            this.itemData.fields[2]['title'] = data['myRef'];
            this.itemData.fields[3]['subtitle'] = this.utils.convertNumberToCurrency(data['amount']);
            this.itemData.fields[3]['title'] = data['date'];

            // in this particular case we need to update the tile data (the ref field as that gets reused in new transactions within the tile)
            this.updateTileData(data);

            this.detectChangeDetectionChanges();
          }
        }
      }
    ));

    // Subscribe to this to show loading message tiles when content is updating
    this.subscription.add(this.messageBusService.emittedMessage$.subscribe(
      data =>
      {
        if (!this.tileIsHidden) {
          // console.log('In subscribe of this.messageBusService.emittedMessage$ and data >> ', data);
        }

        if (data == message.tile_header_content_refresh_start) {
          this.updatingTileHeaderContent = true;
          this.detectChangeDetectionChanges();

        } else if (data == message.tile_header_content_refresh_end) {
          // purposefully displaying the loading message for 2 seconds temporarily
          // setTimeout(() => {
          //   this.updatingTileHeaderContent = false;
          //   this.detectChangeDetectionChanges();
          // }, 2000);

          this.updatingTileHeaderContent = false;
          this.detectChangeDetectionChanges();

        }

      }))

      // This was to display the action subitem popup
      this.subscription.add(tileService.actionsPopupOpened$.subscribe(
        actionsPopupOpened => {
          this.detectChangeDetectionChanges();
        }
      ));

      translator.waitForTranslation().then(() => {
        translator.observe([
          'common.label.more'
          ])
        .subscribe((translations) => {

            // The translator is a prmoise ehich still exists after the tile component has been destroyed
            // If the promise executed while the component  was destroyed, executing change detection within on a destroyed view breaks the app
            // So only execure change detection if we know the More label has not been set yet
            let doDetectChangeDetectionChanges = false;
            if (!this.translations['more']) {
              doDetectChangeDetectionChanges = true;
            }

            this.translations['more'] = translations[0];

            // Run change detection to pick up the More label change
            if (doDetectChangeDetectionChanges) {
              this.detectChangeDetectionChanges();
            }
        })
      })
  }

  ngOnInit() {
    // ErrorHandlerService.classDataValidator(this.itemData, ['type', 'fields', 'actions'], this);
    // console.log('TileComponent: init and this.itemData >> ', this.itemData);

    // Ensures undefined data errors don't occur
    if (this.itemData === undefined) {
      this.itemData = new Tile({
        type: '',
        fields: [],
        actions: [],
        actionsOverflow: [],
        actionsClosed: false,
        transitionIn: false,
        spinner: {isSpinnerGrey: true, showSpinner: false}
      });
    }

    if (this.itemData.type === 'beneficiary') {
      this.ariaLabel = 'Beneficiary ' + this.itemData.fields[0]['title'] + ' ' + this.itemData.fields[1]['title'];
    } else if (this.itemData.type === 'account') {
      this.ariaLabel = this.itemData.fields[0]['title'] + ' ' + this.itemData.fields[0]['subtitle'];
    } else {
      this.ariaLabel = this.itemData.fields[0]['title'];
    }

    if (this.itemData.fields.length > 1) {
      this.needMoreLink = true;
    }

    if (this.itemData.transitionIn) {
      setTimeout(() => {
        this.itemData.transitionIn = false;
      }, 300);
    }

    this.itemData.actions = this.setupActionData(this.itemData.actions);

    if (this.defaultAction) {
      this.containerTabIndex = -1;
    }

    // Set font sizes for certain fields
    // console.log('this.itemData >> ', this.itemData);
    if (this.itemData.type === 'account') {
      this.itemData.fields.forEach((field, index) => {
        // console.log('index >> ', index);
        if (index != 0) {
          if (field['title']) { // some accounts do not display the uncleared balance hence do not apply this rule if that balance is not found
            const len = field['title'].length;
            if (len > 20) {
              // set font size to 12px
              field['fieldSize'] = 'larger';
            } else if (len > 16) {
              // set font size to 14px
              field['fieldSize'] = 'large';
            } else {
              // set font size to 16px
              field['fieldSize'] = 'normal';
            }
            // console.log(field['title'], ' - ' , field['fieldSize'] , ' - len >> ', len);
          }

        }
      });
    }

    if (this.itemData.type === 'beneficiary') {
      let field = this.itemData.fields[2]; // reference field
      if (field['title']) {
        const len = field['title'].length;
        if (len > 20) {
          // set font size to 12px
          field['fieldSize'] = 'larger';
        } else if (len > 16) {
          // set font size to 14px
          field['fieldSize'] = 'large';
        } else {
          // set font size to 16px
          field['fieldSize'] = 'normal';
        }
      }

      // console.log(field['title'], ' - ' , field['fieldSize'] , ' - len >> ', len);
    }


    if (this.itemData.actions.length > 0) {
      this.itemData.actions = this.setupActionData(this.itemData.actions);

      // this.itemData.actions gets manipulated with the logic way down below
      // had to do this to restore this.itemData.actions if this component and it's data was reused
      if (this.itemData.actionsOverflow && this.itemData.actionsOverflow.length > 0) { // Remove overflow and add to actions
        // console.log('Overflow picked up');
        this.itemData.actionsOverflow.forEach(action => {
          this.itemData.actions.push(action);
        });
        this.itemData.actionsOverflow = [];
      }

      this.actionCount = this.itemData.actions.length;

      // Check if the text of first 3 elements is too long
      let wordCount = 0;
      if (this.actionCount > 2) {
        // console.log('this.itemData.actions >> ' , this.itemData.actions);


        for (let j = 0; j < 3; j++) {
          // console.log(j ,' -- ',this.itemData.actions[j]['title']);
          // console.log(j ,' -- ',this.itemData.actions[j]['title'].length);
          wordCount += this.itemData.actions[j]['title'].length;
          // console.log(j, ' -- ', wordCount);
        }

        wordCount += this.MORE_BUTTON_PROXY_CHARACTER_COUNT;
        // console.log('wordCount >> ' + wordCount);
        // console.log('this.MAX_CHARACTER_COUNT_TOTAL >> ' + this.MAX_CHARACTER_COUNT_TOTAL);

        if (wordCount > this.MAX_CHARACTER_COUNT_TOTAL) {
          this.MAX_ACTIONS = 1;
        }
        // console.log('this.MAX_ACTIONS >> ' + this.MAX_ACTIONS);

      }

      if (this.actionCount > this.MAX_ACTIONS) { // create new array for overflow dropdown

        // Check if history is not already in the correct position only for account tiles
        if (this.itemData.type === 'account') {
          let item = this.itemData.actions[this.MAX_ACTIONS - 2];
          if (!(item['type'] == 'history')) { // then ok leave it there
            for (let i: number = 0; i < this.itemData.actions.length; i ++) {
              if (this.itemData.actions[i]['type'] == 'history') {
                let tmp = this.itemData.actions[i];
                this.itemData.actions.splice(i, 1);
                this.itemData.actions.splice(this.MAX_ACTIONS - 2, 0, tmp);
                break;
              }
            }
          }
        }

        this.itemData.actionsOverflow = new Array<Object>();
        for (var i = this.MAX_ACTIONS - 1; i < this.actionCount; ++i) {
          this.itemData.actionsOverflow.push(this.itemData.actions[i]);
          this.actionOverflowCount ++;
        }
        this.itemData.actions.splice(this.MAX_ACTIONS - 1);
      } else { //Ensure history is at the end of the array

        // Check if history is not already in the correct position only for account tiles
        if (this.itemData.type === 'account') {
          let item = this.itemData.actions[this.itemData.actions.length - 1];
          if (!(item['type'] == 'history')) { // then ok leave it there
            for (let i: number = 0; i < this.itemData.actions.length; i ++) {
              if (this.itemData.actions[i]['type'] == 'history') {
                this.itemData.actions.push(this.itemData.actions[i]);
                this.itemData.actions.splice(i, 1);
                break;
              }
            }
          }
        }
      }
    }

    this.hasSingleAction = this.itemData.actions.length === 1;

    // Fire change detection once to render the init changes for this component
    this.detectChangeDetectionChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      // Set font sizes for certain fields

    // Dynamically modify font of account name
    if (this.itemData.type === 'account') {

      const tileSizerWidth =  this.tileSizerOne.nativeElement.offsetWidth;
      const tileSizerContainerWidth =  this.tileSizerContainerOne.nativeElement.offsetWidth;
      const diff = tileSizerContainerWidth - tileSizerWidth;

      // console.log('tileSizerContainerWidth >> ' + tileSizerContainerWidth);
      // console.log('tileSizerWidth >> ' + tileSizerWidth);
      // console.log('diff >> ' + diff);

      if (diff >= 0) {
        this.itemData.fields[0]['fieldSize'] = 'normal';
      } else if (diff < -42) {
        this.itemData.fields[0]['fieldSize'] = 'larger';
      } else if (diff < 0) {
        this.itemData.fields[0]['fieldSize'] = 'large';
      }
    }

    // Dynamically modify font of ben name
    if (this.itemData.type === 'beneficiary') {
      const tileSizerWidth =  this.tileSizerTwo.nativeElement.offsetWidth;
      const tileSizerContainerWidth =  this.tileSizerContainerTwo.nativeElement.offsetWidth;
      const diff = tileSizerContainerWidth - tileSizerWidth;

      /*
      console.log('TileComponent: ben title >> ' + this.itemData.fields[1]['title']);
      console.log('TileComponent: tileSizerContainerWidth >> ' + tileSizerContainerWidth);
      console.log('TileComponent: tileSizerWidth >> ' + tileSizerWidth);
      console.log('TileComponent: diff >> ' + diff);
      */

      if (diff >= 0) {
        this.itemData.fields[1]['fieldSize'] = 'normal';
      } else if (diff < -42) {
        this.itemData.fields[1]['fieldSize'] = 'larger';
      } else if (diff < 0) {
        this.itemData.fields[1]['fieldSize'] = 'large';
      }
    }
    // Fire change detection once to render the ngAfterViewInit changes for this component
    this.detectChangeDetectionChanges();
    });
  }

  setupActionData(actions) {
    for (const item of actions) {
      item['icon'] = item['icon'] || item['type'];

      let ariaLabel = '';

      // Todo: localize these ARIA strings
      if (this.itemData.type === 'account') {
        ariaLabel = item['title'] + ' using this account';
      } else if (this.itemData.type === 'beneficiary') {
        ariaLabel = item['title'] + ' to this beneficiary';
      } else {
        ariaLabel = '';
      }

      item['ariaLabel'] = ariaLabel;

      // Map subitems to their parent actions, so we know which component to open
      if (item['actions']) {
        for (const subItem of item['actions']) {
          subItem['parentType'] = item['type'];
        }
      }

      // Find default action if it's set
      if (item.default) {
        this.defaultAction = item;
      }
    }
    return actions;
  }

  onOutsideClick(e) {
    // console.log('TileComponent: onOutsideClick');
    if (!this._eref.nativeElement.contains(e.target)) {
      // console.log('TileComponent: onOutsideClick and contains target');
      this.actionsDropdownIsOpen = false;
    }

    if (this.dataBalancesEl) {
      if (!this.dataBalancesEl.nativeElement.contains(e.target)) {
        this.dataBalancesIsShowing = false;
      }
    }
    // This was the only way it worked, else actions popup took 2 clicks to close
    // To look at when time permits
    setTimeout(() => {
      this.detectChangeDetectionChanges();
    })
  }

  onMoreClick(e) {
    // This method handles the click event from the "More" button

    // Reattach change detection which will be used in this component and it's drawer within it's lifecycle
    this.cdRef.reattach();

    e.preventDefault();
    this.actionsDropdownIsOpen = !this.actionsDropdownIsOpen;
    // this.actionsDropdownIsOpen = false;

    // Set `moreButtonKeyboardPressed` to false, but only after a millisecond.
    // This gives the actions dropdown chance to set focus to the first element in the dropdown
    setTimeout(() => {
      this.moreButtonKeyboardPressed = false;
      this.detectChangeDetectionChanges();
    }, 10);
  }

  onMoreKeyboard(e) {
    // Reattach change detection which will be used in this component and it's drawer within it's lifecycle
    this.cdRef.reattach();

    // Setting this to true, sets in motion the eventual setting of focus to the
    // first element in the Actions dropdown
    this.moreButtonKeyboardPressed = true;
  }

  onOpenClick(e) {
    // Only gets called on mobile screen sizes via the `.tile__open` `<a>` element
    e.preventDefault();
    this.tileOpen();
  }

  closeTile() {
    this.drawerClose();
    this.tileClose();
  }

  onCloseClick(e) {
    // console.log('TileComponent: onCloseClick');
    e.preventDefault();
    if (this.dataLossWarningService.isDirtyFlag) {
      this.dataLossWarningService.getDirtyFlag().subscribe((res) => {
        if (res) {
          this.closeTile();
      this.tileService.closeDrawer(this.tileIndex);
        }
      })
    } else {
      this.closeTile();
      this.tileService.closeDrawer(this.tileIndex);
    }
  }

  onDefaultActionClick(e) {
    e.preventDefault();

    if (this.defaultAction) {
      this.drawerOpen(this.defaultAction);
    }
  }

  onDefaultActionDummyClick(e) {
    e.preventDefault();
    return false;
  }

  actionClick(actionItem) {
    // If a callback Function is set for this action, execute it and pass in "this.itemData"
    // A panel doesn't have to be opened if this is the case, hence the "return"
    if (actionItem.actionClickHandler) {
      actionItem.actionClickHandler(this.itemData);
      return;
    }
    this.drawerOpen(actionItem);
  }

  subActionClick(e) {
    this.actionsDropdownIsOpen = false;
  }

  drawerOpen(actionItem: any = this.defaultAction) {
    // console.log('TileComponent: drawerOpen and actionItem.componentData >> ', actionItem.componentData);
    // This method handles the click event emitted from ActionsComponent and can
    // get called directly

    // Reattach change detection which will be used in this component and it's drawer within it's lifecycle
    // No need to call change detection manually from here now (because it's reattached), as it was breaking when being called as
    // an eventEmitter from the action component
    this.cdRef.reattach();

    // After updating the account Tile after transactions, the panelData was not getting refreshed, so was using older balances
    actionItem['panelData'] = actionItem['componentData'];

    // Store the postion of the scrollbar
    // Moved this higher in method as it was storing the incorrect value (expanded tile state)
    this.lastScrollPos = window.pageYOffset;

    this.drawerOpened.emit();

    this.drawerIsOpen = true;

    // Inform TileService of the opened Tile Index
    // so we can hide all but current Tile
    this.tileService.openDrawer(this.itemIndex);
    this.actionsDropdownIsOpen = false;

    // Call loadComponent on current Tile's PanelComponent
    // This loads the relevant component into the Panel
    /*
    let panelType = actionItem.panel;
    if (actionItem.parentType) {
      panelType = actionItem.parentType;
    }
    */

    this.drawerNoPadding = null; // need to reset before any new action is clicked
    if (actionItem.drawerNoPadding != null) {
      this.drawerNoPadding = actionItem.drawerNoPadding;
    }

    this.drawerNoLimitedWidth = null; // need to reset before any new action is clicked
    if (actionItem.drawerNoLimitedWidth != null) {
      this.drawerNoLimitedWidth = actionItem.drawerNoLimitedWidth;
    }

    // const item = this.panelsService.getPanel(panelType, actionItem.data);
    // this.panelComponent.loadComponent(item, actionItem.data);
    this.panelComponent.loadComponent(actionItem);

    // TweenLite.set(window, { scrollTo: 0, delay: .2 });
    // TweenLite.to(window, .5, { scrollTo: 0, delay: .2, ease: Power2.easeOut });
    // this.lastScrollPos = window.pageYOffset;
    //this.lastScrollPos = window.pageYOffset;
    this.scrollUtils.scrollTo();
    if (actionItem.setFocusOnCloseButton) {
      this.focusOnCloseButton = true;
    }
  }



  drawerClose() {
    this.drawerIsOpen = false;
    this.focusOnCloseButton = false;

    // Enable scrolling behaviour on parent component data-loader (if exists)
    this.drawerClosed.emit();

    this.detectChangeDetectionChanges();

    // TweenLite.set(window, { scrollTo: this.lastScrollPos - 650, delay: .2 });
    // TweenLite.to(window, .5, { scrollTo: this.lastScrollPos, delay: .2, ease: Power2.easeOut });


    // Delay the start of the scroll animation, to give the tiles change to complete
    // the first part of the animation sequence: moving down from the position half-over
    // the header (.wrapper-tiles--tile-is-open)
    setTimeout(() => {
      // this._smoothScroll.smoothScroll(scrollStart, this.lastScrollPos, 600);
      window.scrollTo(0, this.lastScrollPos);
    }, 500);
  }

  tileOpen() {
    this.tileIsOpen = true;

    // If Tile has a single action, trigger that action
    if (this.itemData.actions.length === 1) {
      this.drawerOpen(this.itemData.actions[0]);
    }
  }

  tileClose() {
    this.panelComponent.clearContainer();
    this.tileIsOpen = false;
    this.itemData.actionsClosed = false;
    this.moreIsShowing = false;
    this.dataBalancesIsShowing = false;
    this.drawerIsOpen = false;
  }

  onShowMore(e) {
    e.preventDefault();
    this.moreIsShowing = true;
  }

  onShowLess(e) {
    e.preventDefault();
    this.moreIsShowing = false;
  }

  onShowBalancesClick(e) {
    console.log('TileComponent: onShowBalancesClick');
    e.preventDefault();
    this.dataBalancesIsShowing = true;

    // Hide more dropdown if showing
    if (this.actionsDropdownIsOpen) {
      this.actionsDropdownIsOpen = !this.actionsDropdownIsOpen;
    }
  }

  onHideBalancesClick(e) {
    console.log('TileComponent: onHideBalancesClick');
    e.preventDefault();
    this.dataBalancesIsShowing = false;
  }

  limitTitleLength(title) {
    if (this.itemData.fields.length > 1) {
      return (title + '').substring(0, this.itemData.titleLenghtLimit);
    } else {
      return (title + '').substring(0, 30);
    }
  }

  // Backwards compatibility below

  fireChangeDetection() {
    this.detectChangeDetectionChanges();
  }

  detectChangeDetectionChanges() {
    try{
      if (this.cdRef) {
        this.cdRef.detectChanges();
      }
    } catch(e) {
      console.log('Error caught when running change detection manually >> ' + e);
    }
  }

  updateTileData(data) {
    this.updateTileDataRef(data);
  }

  // Note this will not work if the data lives in sub items - not a requirement currently for ben tiles
  updateTileDataRef(data) {
    // console.log('TileComponent: updateTileDataRef and ref passed in is >> ', data);
    // console.log('TileComponent: updateTileDataRef and this >> ', this);

    const transactionType = data['transactionType'];

    // console.log('TileComponent: updateTileDataRef and transactionType >> ', transactionType);

    let found = false;

    const actionCount = this.itemData.actions.length;

    // console.log('TileComponent: checking in actions');
    for (let i = 0; i < actionCount; i ++) {
      // let benVO = this.itemData.actions[i]['componentData']['beneficiaryData']['beneficiaryDetailsVO'];
      let action = this.itemData.actions[i];


      if (action['type'] == transactionType) {
        // console.log('TileComponent: this.itemData >> ', this.itemData);
        // console.log('TileComponent: action >> ', action);
        found = true;
        // break;
        this.updateTileDataObjectWithRef(action['componentData'], data);
      }
    }

    if (!found) {
      // search in actionOverflow
      const actionOverflowCount = this.itemData.actionsOverflow.length;
      // console.log('TileComponent: checking in actionsOverflow');
      for (let i = 0; i < actionOverflowCount; i ++) {
        // let benVO = this.itemData.actions[i]['componentData']['beneficiaryData']['beneficiaryDetailsVO'];
        let action = this.itemData.actionsOverflow[i];


        if (action['type'] == transactionType) {
          // console.log('TileComponent: this.itemData >> ', this.itemData);
          // console.log('TileComponent: actionOverflow >> ', action);
          found = true;
          // break;
          this.updateTileDataObjectWithRef(action['componentData'], data);
        }



      }

    }
  }

  // Note: different transaction flows were implemented differently, hence the many transactiojn type checks below
  updateTileDataObjectWithRef(oldTileData, dataChanges) {
    // console.log('TileComponent: updateDataObjectWithRef');
    // console.log('TileComponent: updateDataObjectWithRef and oldTileData >> ', oldTileData);
    // console.log('TileComponent: updateDataObjectWithRef and dataChanges >> ', dataChanges);

    const myRef = dataChanges['myRef'];
    const transactionType = dataChanges['transactionType'];

    // console.log('TileComponent: updateDataObjectWithRef and transactionType >> ', transactionType);

    let beneficiaryDetailsVO;

    if (transactionType == 'pay') {
      beneficiaryDetailsVO= oldTileData['beneficiary']['beneficiaryDetailsVO']; // is like this in pay from top nav

      if (!beneficiaryDetailsVO && oldTileData['beneficiaryData']) {
        beneficiaryDetailsVO = oldTileData['beneficiaryData']['beneficiaryDetailsVO']; // is like this in ben pay from side nav
      }

      beneficiaryDetailsVO['sourceAccountReference'] = myRef;
    }

    if (transactionType == 'cashsend') {
      beneficiaryDetailsVO = oldTileData['beneficiary']['beneficiaryDetailsVO']; // is like this in cashsend from top nav
      beneficiaryDetailsVO['statementReference'] = myRef;
    }

    if (transactionType == 'buy') { // not required to update for buy as this value is not reused if the transaction is done again from the same tile

    }

    //beneficiaryDetailsVO['sourceAccountReference'] = myRef;
    // beneficiaryDetailsVO['statementReference'] = myRef;

  }

  ngOnDestroy() {
    //console.log('Will destroy');
    //console.log(this.cdRef);
    //if (!this.cdRef['destroyed']) {
    //  this.cdRef.detectChanges();
    //}
    //this.cdRef.detach();
    this.subscription.unsubscribe();
  }

  // This is to address tabbing. Still TODO
  actionKeyDownEvent(e) {
    // console.log('TileComponent: actionKeyDownEvent and e >> ', e);
    if (e.keyCode == 9 && e.shiftKey == false) { // tab
      // this.tabForward(e);
    } else if (e.keyCode == 9 && e.shiftKey == true) { // shift tab
      // this.tabBackward(e);
    }
  }
}
