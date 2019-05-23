// import { BaseModel } from '../app.base-model.component';

export class Tile {
  public fields: Array<Object>;
  public actions: Array<Object>;
  public actionsClosed?: boolean;
  public transitionIn?: boolean;
  public spinner?: { isSpinnerGrey?: boolean, showSpinner?: boolean };
  public moreLabel?: string = 'More';
  public tileCloseLabel?: string = 'Close';
  public actionsOverflow?: Array<Object>;
  public titleLenghtLimit?: number;
  public accentColourClass?: string;

  // Backwards compatibilty
  public prioritizeBalances?: boolean;
  public id?: Object;
  public setFocus?: boolean;
  public type?: string;

  constructor( args: Tile ) {

    // Backwards compatiblity
    this.type = args.type;
    this.id = args.id;
    this.fields = args.fields;
    this.actions = args.actions;
    this.prioritizeBalances = args.prioritizeBalances;
    this.actionsClosed = args.actionsClosed;
    this.setFocus = args.setFocus;

    if (args.accentColourClass) {
      this.accentColourClass = args.accentColourClass;
    }

    if (args.spinner) {
      if (!args.spinner.hasOwnProperty('isSpinnerGrey')) {
        args.spinner['isSpinnerGrey'] = true;
      }

      if (!args.spinner.hasOwnProperty('showSpinner')) {
        args.spinner.showSpinner = false;
      }
    }

    if (!args.hasOwnProperty('actionsClosed')) {
      args.actionsClosed = false
    }

    if (!args.hasOwnProperty('transitionIn')) {
      args.transitionIn = false;
    }
    /*
    BaseModel.BaseModelInstance()
		.baseModelPropertyMapper(this, args)
    .baseErrorHandler(this , args, ['type', 'fields', 'actions'], BaseModel.HandlerType().EXCEPTION);
    */
  }
}
