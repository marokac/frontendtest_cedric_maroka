import { FormAccountDropdownOption } from './form-account-dropdown-option.model';

export class FormAccountDropdown {
  constructor(
    public name: string = '',
    public label: string = '',
    public icon: string = '',
    public options: FormAccountDropdownOption[] = [],
    public disabled: boolean = false,
    public highlight: boolean = false,
    public isInvalid: boolean = false,
    public placeholder: string = 'Select',
    public selectedAccount: any = '',
    public tooltipText?: string,
    public hideBalance?: boolean
) { }
}
