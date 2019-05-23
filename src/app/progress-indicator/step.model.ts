export class Step {
  public title: string;
  public isCurrent: boolean;
  public isComplete: boolean;

  constructor(args) {
    this.title = args.title;
    this.isCurrent = args.isCurrent;
    this.isComplete = args.isComplete;
  }
}
