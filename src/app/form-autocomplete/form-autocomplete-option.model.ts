export class FormAutoCompleteOption {
  constructor(
    public label: string = '',
    public value: string = '',
    public hasFocus: boolean = false,
    public filterOptionValues: boolean = false,
    public subLabel: string = '',
    public iipeligible?: boolean
  ) { }
}
