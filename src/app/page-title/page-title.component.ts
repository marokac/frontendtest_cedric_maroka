import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { SessionService } from 'app/common/services/session.service';
import { Translator } from 'angular-translator';
import { TimeUtilsService } from '../../services/utils/time-utils.service';

@Component({
  selector: 'page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.scss']
})
export class PageTitleComponent implements OnInit {
  @Input() data: { title: string, subtitle: string, pageType?: string }
  @Input() title
  @Input() subTitle
  @Input() isdrawerOpen;
  public surephrase: string;
  public hours = new Date().getHours();
  public greeting: string[] = ['Good morning', 'Good afternoon', 'Good evening'];
  public welcome = 'Welcome';
  public welcomeMessage;
  public clientName;
  public dateTime;
  public  finalDate
  translations: object = {};
  constructor(private sessionService: SessionService,
    private translator: Translator,
    private timeUtilsService: TimeUtilsService) {
    if (this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_SUREPHRASE !== undefined) {
      this.surephrase = this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_SUREPHRASE;
    }

    this.clientName = this.getClientName();
    translator.waitForTranslation().then(() => {
      translator.observe([
        'common.label.surePhrase',
        'common.label.greetingmorning',
        'common.label.greetingafternoon',
        'common.label.greetingevening',
        'common.label.welcome'
      ]).subscribe((translations) => {
        this.greeting[0] = translations[1];
        this.greeting[1] = translations[2];
        this.greeting[2] = translations[3];
        this.welcome = translations[4];
        this.getGreeting(this.hours);
      })
    })
  }

  ngOnInit() {
    this.getDate();
    setInterval(() => {
      this.getDate();
    }, 1000)
  }

  getDate() {
    if (!this.timeUtilsService.translationIsComplete) {
     this.timeUtilsService.translationComplete.subscribe(() => {
        const todaysDateTime = this.timeUtilsService.getDateTimeFormatted(' |');
        const dayWeek = this.timeUtilsService.getDayOfWeekName();
        this.dateTime = dayWeek + ', ' + todaysDateTime;
      })
    } else {
      const todaysDateTime = this.timeUtilsService.getDateTimeFormatted(' |');
        const dayWeek = this.timeUtilsService.getDayOfWeekName();
        this.dateTime = dayWeek + ', ' + todaysDateTime;
    }
  }

  getClientName() {
    return this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_INITIALS + ' ' +
      this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_SURNAME.charAt(0).toUpperCase() +
      this.sessionService.serverClientDataBridge.SERVER_DATA_BRIDGE_SURNAME.slice(1).toLowerCase()
  }

  getGreeting(hours: any) {

    if (this.sessionService.getLoginAttempts()) {
      this.welcomeMessage = this.welcome + ' ' + this.clientName;
    } else {
      if (hours >= 0 && hours < 12) {
        this.welcomeMessage = this.greeting[0] + ' ' + this.clientName;
      } else if (hours >= 12 && hours < 17) {
        this.welcomeMessage = this.greeting[1] + ' ' + this.clientName;
      } else if (hours >= 17 && hours < 24) {
        this.welcomeMessage = this.greeting[2] + ' ' + this.clientName;
      }
    }
  }
}
