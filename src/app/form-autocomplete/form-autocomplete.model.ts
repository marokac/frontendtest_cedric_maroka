import { FormAutoCompleteOption } from './form-autocomplete-option.model';

export class FormAutoComplete {
  constructor(
    public name: string = '',
    public label: string = '',
    public icon: string = '',
    public maxlength?: any,
    public options: FormAutoCompleteOption[] = [],
    public disabled: boolean = false,
    public isInvalid: boolean = false,
    public isWarning: boolean = false,
    public placeholder: string = 'Select',
    public info: string = '',
    public infoLink?: {
      label: string, link: string, parameters?: string
    },
    public moreInfo: string = '',
    public data?: any,
    public openOnLoad?: boolean,
    public closeOnError?: boolean,
    public filterOptionValues?: boolean,
    public showMinMaxValues?: boolean,
    public minLabel?: string,
    public maxLabel?: string,
    public minValue?: string,
    public maxValue?: string,
    public tooltipText?: string,
    public iconRight: boolean = false,
    public textAlign: string = 'left',
    public spinner: boolean = false,
    public currencySymbol: boolean = false,
    public amountInputValueRight?: boolean
  ) { }
}
