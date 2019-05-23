import { Injectable, Injector, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpErrorResponse, } from '@angular/common/http';

import { ESFMessageHeaderModel, PaginationContext } from './esf-message-header.model';
import { SessionService } from 'app/common/services/session.service';
import { TimeUtilsService } from 'app/common/services/utils/time-utils.service';
import { Translator, TranslatorContainer } from 'angular-translator';

import { Observable } from 'rxjs';
import { Utils } from 'app/core/utils/utils';

@Injectable()
export class HttpProxyService {
  private httpHeaders = new HttpHeaders();
  private isAsynchronous = true; // TODO : abhs281 Implement setter and expose interface to change this.
  //  private timeUtilsService
  private utils: Utils;
  translations: object = {};

  constructor(
    private http: HttpClient,
    private sessionService: SessionService,
    private timeUtilsService: TimeUtilsService,
    private translator: Translator
  ) {
    translator.waitForTranslation().then(() => {
      translator.observe(['common.network.unavailable.timeout',
                          'common.network.unavailable.parsererror',
                          'common.network.unavailable.abort',
                          'common.network.unavailable.default']).subscribe((translations) => {
                                this.translations['Timeout'] = translations[0];
                                this.translations['ParseError'] = translations[1];
                                this.translations['Abort'] = translations[2];
                                this.translations['Default'] = translations[3];
                              })
    })
  }

  public invokeRequest(
    serviceName: string,
    operationName: string,
    requestInput: Object,
    overrideHeaderAttributes: Object,
    requestPaginationContext: PaginationContext,
    requestContentType: string
  ) {
    this.utils = new Utils();
    const serviceURL =
      this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_BASE_URL +
      this.sessionService.globalConfig.GLOBAL_EXPRESS_SERVICE_ROOT_CONTEXT +
      '/' +
      serviceName +
      operationName +
      '.exp';

    this.httpHeaders.append('Content-Type', requestContentType);

    let requestMessage = {};
    if (requestInput) {
      requestMessage = requestInput;
    }

    const esfMessageHeader = this.sessionService.esfHeader.getHeader();

    if (!this.utils.isUndefined(requestPaginationContext)) {
      esfMessageHeader.paginationContext = requestPaginationContext;
    } else {
      const defaultPaginationContext = new PaginationContext();
      defaultPaginationContext.BatchSize = 0;
      defaultPaginationContext.BatchSizeLimit = 0;
      defaultPaginationContext.MoreToCome = false;
      defaultPaginationContext.RecordIdentity = '0';
      defaultPaginationContext.TotalNumberOfRecords = 0;
      esfMessageHeader.paginationContext = defaultPaginationContext;
    }

    // Always set Application Scope header properties

    esfMessageHeader.applicationId = this.sessionService.globalConfig.GLOBAL_EXPRESS_APPLICATION_ID;

    esfMessageHeader.service = serviceName;
    esfMessageHeader.operation = operationName;
    esfMessageHeader.timestamp = this.timeUtilsService.getCurrentTimeStamp(); // 'YYYY-MM-DD HH:mm:ss'
    esfMessageHeader.channel = 'I';
    requestMessage['header'] = esfMessageHeader;

    if (navigator.onLine) {
      return this.http
        .post(serviceURL, requestMessage, { headers: this.httpHeaders })
        .map((result: Response) => {
          const response: any = this.processResponse(result);
          const resultMessageHeader = response.header;
          const esfStatusCode = resultMessageHeader.statuscode;

          // Check if ESFMessage has an error status and throw error.
          // This should always be a business defined error.
          if (esfStatusCode !== '0') {
            console.log('ESFProtocolServiceProxy: Returning error response message to caller', response);
            throw response;
          } else {
            return response;
          }
        })
        // Catch http errors and handle.
        .catch((err) => {
          return Observable.throw(this.handleError(err));
        }
        );
    } else {
      return Observable.throw(this.handleError({ status: 0 }));
      //      Observable.throw('Browser Offline'); // TODO: should pop up dialogue for retry.,
    }
  }
private processResponse(response: Response) {
    const responseMessage: any = response;

    this.setSessionHeader(responseMessage);
    return responseMessage;
  }

  private setSessionHeader(responseMessage) {
    const resultMessageHeader = responseMessage.header;
    const esfStatusCode = resultMessageHeader.statuscode;

    console.log(
      'ESFProtocolServiceProxy: Response contains a valid ESF Protocol Message with statusCode: ' +
      esfStatusCode,
      responseMessage
    );
    // Server has detected a secuirty violation and we need to force a logoff
    if (esfStatusCode === '9999') {
      const redirectURL = responseMessage.redirectURL
        ? responseMessage.redirectURL
        : this.sessionService.globalConfig.GLOBAL_EXPRESS_ABANDON_SHIP_PAGE;
      console.log(
        'ESFProtocolServiceProxy: Response statusCode indicates a secuirty error therefore redirecting to: ' +
        redirectURL
      );
      window.location.replace(redirectURL); // Enforce redirect.
    }

    console.log(
      'ServiceProxy: Updating User Session with response header attributes'
    );

    const esfHeader = new ESFMessageHeaderModel();



    if (resultMessageHeader.nonce) {
      if (this.isAsynchronous) {
        esfHeader.Nonce = resultMessageHeader.nonce;
      }
    }
    if (resultMessageHeader.wfpt) {
      esfHeader.Wfpt = resultMessageHeader.wfpt;
    }
    if (resultMessageHeader.xfpt) {
      esfHeader.Xfpt = resultMessageHeader.xfpt;
    }
    if (resultMessageHeader.jsessionid) {
      esfHeader.Jsessionid = resultMessageHeader.jsessionid;
    }
    if (resultMessageHeader.esessionid) {
      esfHeader.Esessionid = resultMessageHeader.esessionid;
    }
    if (resultMessageHeader.brand) {
      esfHeader.Brand = resultMessageHeader.brand;
    }
    if (resultMessageHeader.organization) {
      esfHeader.Organization = resultMessageHeader.organization;
    }
    if (resultMessageHeader.language) {
      esfHeader.Language = resultMessageHeader.language;
    }
    if (resultMessageHeader.UserNumber) {
      esfHeader.UserNumber = resultMessageHeader.userNumber;
    }
    if (resultMessageHeader.accessAccount) {
      esfHeader.AccessAccount = resultMessageHeader.accessAccount;
    }
    if (resultMessageHeader.sourceip) {
      esfHeader.Sourceip = resultMessageHeader.sourceip;
    }
    if (resultMessageHeader.userAgent) {
      esfHeader.UserAgent = resultMessageHeader.userAgent;
    }
    if (resultMessageHeader.channel) {
      esfHeader.Channel = resultMessageHeader.channel;
    }
    if (resultMessageHeader.channel) {
    }

    console.log('ESFHeader to save in session: ', esfHeader);

    // Sharan - Seed the Server Timestamp variable in TimeUtils with the timestamp returned from the Server - when the status code is 0 or non zero
    if (resultMessageHeader.timestamp) {
      //      this.timeUtilsService = this.injector.get(TimeUtilsService)

      this.timeUtilsService.setServerTime(resultMessageHeader.timestamp);
    }

    //    esfHeader.Timestamp = header.timestamp;

    this.sessionService.esfHeader = esfHeader;
  }

  /**
   * Handle any error from an http request.
   * Check for HTTP errors and ESFMessage error then handle as string.
   * @param error {Response|any }Http Response Object or any other error
   */
  private handleError(error: any) {
    console.error('ServiceProxy : ErrorThrown: ' + error);

    // handle http errors
    if (!error || !error.header) {
      let errorMessage = '';
      const errorDetails = { errorCode: 0, };
      // this is http error. in case no status set status to 0 in order to have network unavailable error displayed.
    if ( !error.status) { error = { status: 0 }; };
    switch (error.status) {
      case 408: // timeout
        errorDetails.errorCode = 1;
        errorMessage = this.translations['Timeout'];
        console.log('timeout   errorMessage: ' + errorMessage);
        break;
      case 400: // parseerror
        errorDetails.errorCode = 2;
        errorMessage = this.translations['ParserError'];
        console.log('parsererror   errorMessage: ' + errorMessage);
        break;
      case 500: // abort
        errorDetails.errorCode = 3;
        errorMessage = this.translations['Abort'];
        console.log('abort   errorMessage: ' + errorMessage);
        break;
      default:
        errorDetails.errorCode = 4;
        errorMessage = this.translations['Default'];
        console.log('Default  errorMessage: ' + errorMessage);
        break;
    }
    const errorResponseMessage = { header: {} };
    const header = { statuscode: '1', resultMessages: [{ 'responseSeverity': 'S', 'responseMessage': errorMessage }] };
    errorResponseMessage.header = header;
    return errorResponseMessage
  }

  return error;
}
}
