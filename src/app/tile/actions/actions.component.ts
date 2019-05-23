import { Component, OnInit, Input, Output, EventEmitter, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';
import { TileService } from '../tile.service';

@Component({
  selector: 'actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onOutsideClick($event)',
    '(document:touchend)': 'onOutsideClick($event)',
  },
})
export class ActionsComponent implements OnInit {
  @Input() itemData: {type: string, fields: Array<Object>, actions: Array<Object>, actionsOverflow: Array<Object>, actionsClosed: boolean};
  @Output() actionClickEvent = new EventEmitter<Object>();
  @Output() subActionClickEvent = new EventEmitter<Object>();
  @Input() moreButtonKeyboardPressed: boolean;
  @Output() keyDownEvent = new EventEmitter<Object>();
  @Input() tileIndex: number;
  @ViewChild('dropdown') dropdown;

  subscription: Subscription;
  currentPopup: any;

  @Input('actionsDropdownIsOpen')
  set actionsDropdownIsOpen(open: boolean) {
    // When this var changes to true, check if the dropdown was opened
    // via the keyboard. If it was, set focus to the first `tile__action-item`
    if (open) {
      if (this.moreButtonKeyboardPressed) {
        // Setting focus after a short timeout, to give screenreaders a chance to get
        // ready for focus change. Symptom became apparent while testing using the "Vox" extension
        setTimeout(() => {
          this.elRef.nativeElement.getElementsByClassName('tile__action-item')[0].focus();
          /*
            // This goes to first action on tile, not first action in dropdown
            // this.elRef.nativeElement.getElementsByClassName('tile__action-item')[0].focus();

            console.log('ActionsComponent: actionsDropdownIsOpen and this >> ', this);
            this.elRef.nativeElement.getElementsByClassName('tile__action-item--overflow')[0].focus();

          */
        }, 100);
      }
    }
  }

  constructor(private elRef: ElementRef, private tileService: TileService) {
    // This Subscription closes any open actions popups if an actions popup on
    // another Tile is opened
    this.subscription = tileService.actionsPopupOpened$.subscribe(
      popupOpenedIndex => {
        if (popupOpenedIndex !== this.tileIndex) {
          if (this.currentPopup) {
            this.hidePopup(this.currentPopup);
          }
        }
      }
    );
  }

  ngOnInit() {}

  onActionClick(e, item) {
    e.preventDefault();
    // The below line was like this before the Resonance changes
    e.stopPropagation();

    // Check if item has sub items. If so, show/hide the actions popup
    if (item.actions) {
      this.subActionClickEvent.emit(item);
      let showNewPopup = true;

      if (this.currentPopup) {
        if (item === this.currentPopup) {
          // If the item clicked on is the current item, don't do anything else
          showNewPopup = false;
        }
        this.hidePopup(this.currentPopup);
      }

      if (showNewPopup) {
        this.showPopup(item, e);
      }

    } else {
      this.emitClickEventAndCloseDropdown(item);
    }
  }

  onSubItemClick(item) {
    this.emitClickEventAndCloseDropdown(item);
  }

  emitClickEventAndCloseDropdown(item) {
    this.actionClickEvent.emit(item);

    // If no actionClickHandler is set, we will be opening the Panel, so close the actions
    if (!item.actionClickHandler) {
      this.itemData.actionsClosed = true;
    }
  }

  showPopup(item, el) {
    this.currentPopup = item;
    this.currentPopup.popupIsShowing = true;

    // Inform TileService of the opened actions popup's parent Tile Index
    // so we can close all popups but the current one
    this.tileService.actionsPopupOpened(this.tileIndex);
  }

  hidePopup(item) {
    // console.log('ActionsComponent: hidePopup and item >> ', item);
    if (item) {
      item.popupIsShowing = false;
      this.currentPopup = null;
    }
  }

  onOutsideClick(e) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.hidePopup(this.currentPopup);
    }
  }

  onKeyDown(e) {
    // console.log('ActionsComponent and e >> ', e);
    this.keyDownEvent.emit(e);
  }
}
