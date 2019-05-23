  //  The icon field is not required. If not send no icon will be displayed,
  //  But set the align parameter value to left to ensure the input is properly aligned to left
export class FormInput {
  constructor(
    public name: string = '',
    public maxlength: string = '',
    public label: string = '',
    public placeholder: string = '',
    public icon: string = '',
    public align: string = '',
    public info: string = '',
    public moreInfo: string = '',
    public type: string = '',
    public infoLink: {
      label: string, link: string, parameters?: string
    },
    public hideLabel: boolean = false,
    public disabled: boolean = false,
    public isInvalid: boolean = false,
    public isWarning: boolean = false,
    public tabindex: string = '',
    public formGroupName: string = 'beneficiaryNotification',
    public iconRight: boolean = false,
    public currencySymbol: boolean = false,
    public trim?: boolean,
    public tooltipText?: string,
    public altLabel?: string
  ) { }
}
