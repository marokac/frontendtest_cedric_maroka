export class ListSearchInput {
  constructor(
    public name: string = '',
    public placeholder: string = '',
    public charLimit: number = 1,
    public width: number = 326,
    public disabled: boolean = false,
    public tooltipText?: string
  ) { }
}
