		({
    doInitHelper : function(component, event, helper) {
        var billingAccounts = component.get('v.billingAccList');
        var result =[];
        for(let i=0; i < billingAccounts.length; i++){
            var resArr={};
            var cardNo = billingAccounts[i].accountNumber.substr(billingAccounts[i].accountNumber.length - 4 , 
                                                                 billingAccounts[i].accountNumber.length);
            if(billingAccounts[i].cardNumber != '' ){
                if(billingAccounts[i].billingAccountType != 'paypal' && billingAccounts[i].billingAccountType != 'EACashWallet'){
                    resArr['label'] =  billingAccounts[i].type + ' ('+ cardNo +') '
                    + 'Exp '+ billingAccounts[i].expirationMonth +'/'+billingAccounts[i].expirationYear;
                }
               /* else if(billingAccounts[i].billingAccountType == 'EACashWallet'){
                    resArr['label'] =  billingAccounts[i].type  + ' Bal $'+billingAccounts[i].balance; 
                }*/
                    else{
                        resArr['label'] =  billingAccounts[i].type; 
                    }
                resArr['value'] = billingAccounts[i].id;
                resArr['type'] = billingAccounts[i].billingAccountType;
                resArr['cardNumber'] = billingAccounts[i].cardNumber;
                result.push(resArr);
            }
            
            /*if(billingAccounts[i].cardNumber != '' ){
                resArr['label'] =  billingAccounts[i].type + ' ('+ cardNo +') '
                  + 'Exp '+ billingAccounts[i].expirationMonth +'/'+billingAccounts[i].expirationYear;
                resArr['value'] = billingAccounts[i].id;
                result.push(resArr);
            }*/
        }
        component.set('v.billingAccount', result);
    },
    fetchOriginSubscriptionTypesHelper: function(component, event, helper) {
        var action = component.get("c.fetchOriginSubscriptionTypes"); 
        action.setCallback(this, function(response) {
            var state = response.getState();
            var storeResponse = response.getReturnValue();
            if (state === "SUCCESS") {
                var result =[];
                for(let i=0; i < storeResponse.length; i++){
                    var resArr={};
                    resArr['label'] =  storeResponse[i].Name;
                    resArr['value'] = storeResponse[i].Catalog_Offer_ID__c;
                    result.push(resArr);
                }
                component.set("v.membership", result);
            }
        });
        $A.enqueueAction(action);
    },
    fetchCost: function(component, event, helper){
        var action = component.get("c.fetchCostOfNewSubscription");
        action.setParams({
            newOfferId: component.find("memberActions").get("v.value"),
            billingAccountId: component.find("billingActions").get("v.value")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            var storeResponse = response.getReturnValue();
            if (state === "SUCCESS") {
                // component.set("v.membershipCost" , storeResponse);
                var strToBeAppended = '/Month*';
                var membershipCost = storeResponse;
                var formattedMembershipCost = membershipCost+strToBeAppended
                component.set("v.membershipCost" , formattedMembershipCost);
            }
        });
        $A.enqueueAction(action);
    },
    helperonConfirm: function(component, event, helper) {
        var getRequestMap = {};
        getRequestMap["offerId"] = component.get("v.memberActionVal");
        getRequestMap["offerName"] = component.get("v.memberActionLabel");
        getRequestMap["customerId"] = component.get("v.nucleusId");
        getRequestMap["billingAccountId"] = component.get("v.billingActionVal");
        getRequestMap["paymentAgreementId"] = component.get("v.paymentAgreementId");    //if billing account is Paypal 
        getRequestMap["billingAccountType"] = component.get("v.cardType");      //creditCard, Cash card
		getRequestMap["caseId"] = component.get("v.caseId");
		getRequestMap["isCreateCRMEvent"] = 'TRUE';
        getRequestMap["newMembershipPrice"] = component.get("v.membershipCost");
        getRequestMap["accountId"] = component.get('v.accountId');

        var action = component.get("c.purchaseNewOriginSubsription");
         action.setParams({ 
             mapRequestParams : getRequestMap
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            var storeResponse = response.getReturnValue();
            if (state === "SUCCESS") {
                var appCloseEvent = $A.get("e.c:AddSubscriptionEvent");
                var appEvent = $A.get("e.c:RefreshSubscription");
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    type: 'success',
                    message: storeResponse
                });
                toastEvent.fire();
                appEvent.fire();
                appCloseEvent.fire();
            }
            else{
                var appCloseEvent = $A.get("e.c:AddSubscriptionEvent");
                var appEvent = $A.get("e.c:RefreshSubscription");
                var toastEvent = $A.get("e.force:showToast");
                toastEvent.setParams({
                    type: 'error',
                    message: storeResponse
                });
                toastEvent.fire();
                appEvent.fire();
                appCloseEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    onChangeActionHelper : function(component, event, helper){
        if ( component.find("memberActions").get("v.value") != null ) {
            var billingAccountId = '';            
            var billingAccounts = component.get('v.billingAccList');
            console.log(billingAccounts);
            var result =[];
            console.log(billingAccounts.length);
            
            for ( let i=0; i < billingAccounts.length; i++ ) {
                if ( billingAccounts[i].billingAccountType == 'EACashWallet' ) {
                   billingAccountId = billingAccounts[i].id;
                }
            }
            
            if ( billingAccountId != '' ) {
                var action = component.get("c.fetchCostOfNewSubscription");
                console.log(component.find("memberActions").get("v.value"));
                
                action.setParams({
                    newOfferId: component.find("memberActions").get("v.value"),
                    billingAccountId: billingAccountId
                });
                action.setCallback(this, function(response) {
                    var state = response.getState();
                    var storeResponse = response.getReturnValue();
                    console.log(storeResponse); 
                    if (state === "SUCCESS") {
                        console.log(storeResponse);
                        component.set("v.membershipCost" , storeResponse);                        
                        var membershipCost = storeResponse;
                        
                        for ( let i=0; i < billingAccounts.length; i++ ) {
                            var resArr={};
                            var cardNo = billingAccounts[i].accountNumber.substr(billingAccounts[i].accountNumber.length - 4 , 
                                                                                 billingAccounts[i].accountNumber.length);
                            if(billingAccounts[i].cardNumber != '' ){
                                if(billingAccounts[i].billingAccountType != 'paypal' && billingAccounts[i].billingAccountType != 'EACashWallet'){
                                    resArr['label'] =  billingAccounts[i].type + ' ('+ cardNo +') '
                                    + 'Exp '+ billingAccounts[i].expirationMonth +'/'+billingAccounts[i].expirationYear;
                                } else if(billingAccounts[i].billingAccountType == 'EACashWallet' && 
                                          membershipCost != undefined && 
                                          billingAccounts[i].balance < membershipCost.substr(0, membershipCost.length - 3)){
                                    resArr['label'] =  billingAccounts[i].type  + '(Insufficient funds)';                            
                                    component.set('v.disableEACashWallet', true);
                                } else{
                                        resArr['label'] =  billingAccounts[i].type; 
                                    }
                                resArr['value'] = billingAccounts[i].id;
                                resArr['type'] = billingAccounts[i].billingAccountType;
                                resArr['cardNumber'] = billingAccounts[i].cardNumber;
                                result.push(resArr);
                            }
                        }            
                        
                        console.log(result);
                        component.set('v.billingAccount', result);
                    }
                });
                $A.enqueueAction(action);           
                
            }
        }
         console.log('onChangeActionHelper billing action ::: '+ component.find("billingActions").get("v.value"));
        if(component.find("memberActions").get("v.value")!=null && component.find("billingActions").get("v.value")!=null 
           && component.find("billingActions").get("v.value")!=''){
            component.set('v.enableNextButton',false);
        }
        else{
            component.set('v.enableNextButton',true);
        }
    }
})