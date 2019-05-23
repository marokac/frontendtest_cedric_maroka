/*******************************************************************************
 * @author Phakamani Mkulise
 * Proxy for the BalanceEnquiryGetAllBalancesProxy Service Operation
 *******************************************************************************/

import { Injectable } from '@angular/core';
import { HttpProxyService } from 'app/core/services/http-proxy.service';
import { Observable } from 'rxjs/Observable';
import { EsfResponseHeader, PaginationContext } from 'app/core/services/esf-response-header.interface';
export { EsfResponseHeader }

export interface RegularBeneficiaryManagementAddRegularBeneficiaryRequest {
    bankNameOrInstitutionName: string;
    sourceAccountReference: string;
    targetAccountReference: string;
    clearingCodeOrInstitutionCode: string;
    targetAccountType: string; // [ "NONE", "CURRENT_ACCOUNT", "SAVINGS_ACCOUNT", "TRANSMISSION_ACCOUNT", "HOME_LOAN", "ONLINE_SHARE_TRADING" ]
    beneficiaryName: string;
    targetAccountNumber: string;
    beneficiaryNotification: object;
    typeOfBeneficiary: string;
    instructionType: string;
    ownNotification: object;
}

export interface RegularBeneficiaryManagementAddRegularBeneficiaryResponse {
    typeOfBeneficiary:  string; // [ "I", "E", "B" ]
    instructionType:  string; // [ "VP", "OOP", "PPI", "PPE", "PPO", "CLI", "CLR", "XFR", "MPP", "PTP", "ATC", "SO" ]
    sourceAccountReference:  string;
    targetAccountReference:  string;
    targetAccountNumber:  string;
    beneficiaryName:  string;
    bankNameOrInstitutionName:  string;
    clearingCodeOrInstitutionCode:  string;
    targetAccountType:  string; // [ "NONE", "CURRENT_ACCOUNT", "SAVINGS_ACCOUNT", "TRANSMISSION_ACCOUNT", "HOME_LOAN", "ONLINE_SHARE_TRADING" ]
    beneficiaryNotification:  object;
    ownNotification: object
    lastMaintenanceDateAndTime:  string;
    cifKey:  string;
    tieBreaker:  string;
    beneficiaryNumber:  0;
    uniqueEFTNumber:  string;
    header: EsfResponseHeader;
}

const serviceName = 'RegularBeneficiaryManagementFacade';
const requestContentType = 'application/json; charset=UTF-8';

@Injectable()
export class RegularBeneficiaryManagementProxyService {
    constructor(private serviceProxy: HttpProxyService) { }

    public addRegularBeneficiary(requestInput?: RegularBeneficiaryManagementAddRegularBeneficiaryRequest, overrideHeaderAttributes?: any, requestPaginationContext?: PaginationContext)
    : Observable<RegularBeneficiaryManagementAddRegularBeneficiaryResponse> {
    const theResponse = this.serviceProxy.invokeRequest(serviceName, 'AddRegularBeneficiary', requestInput, overrideHeaderAttributes, requestPaginationContext, requestContentType)
    .map((response) => response as RegularBeneficiaryManagementAddRegularBeneficiaryResponse);

    return theResponse;
    }
}
