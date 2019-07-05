({
    doInit : function(component, event, helper) {
        var today = $A.localizationService.formatDateUTC(new Date(), "MMM/DD/YY");
        component.set('v.today', today);
        
        helper.doInitHelper(component, event, helper);
        helper.fetchOriginSubscriptionTypesHelper(component, event, helper);
    },
    navigateBack :  function(component, event, helper) {
        component.set('v.isFirstPage',true);
        component.find("memberActions").set('v.value',component.get('v.memberActionVal'));
        component.find("billingActions").set('v.value',component.get('v.billingActionVal'));
    },
    navigateForward : function(component, event, helper) {
        component.set("v.preferredBilling", component.find('billingActions').get('v.value'));
        helper.fetchCost(component, event, helper);
        component.set('v.isFirstPage',false);
        component.set('v.memberActionVal',component.find("memberActions").get("v.value"));
        component.set('v.billingActionVal',component.find("billingActions").get("v.value"));
        var billingAccount = component.get('v.billingAccount');
        var billingAccList = component.get('v.billingAccList');
        var membership = component.get("v.membership");
        var index;
        for(var i=0;i<billingAccount.length;i++){
            if(billingAccount[i].value == component.find("billingActions").get("v.value")){
                index = i;
        		component.set('v.billingAccLabel',billingAccount[i].label);
            }
        }
        for(var i=0;i<billingAccList.length;i++){
            if(billingAccList[i].id == component.find("billingActions").get("v.value")){
        		component.set('v.cardType',billingAccList[i].billingAccountType);
                if(billingAccList[i].cardType == 'Paypal')
        			component.set('v.paymentAgreementId',billingAccList[i].cardNumber);
            }
        }
        for(var i=0;i<membership.length;i++){
            if(membership[i].value == component.find("memberActions").get("v.value")){
                index = i;
        		component.set('v.memberActionLabel',membership[i].label);
            }
        }
        //component.set('v.billingAccLabel',billingAccount[index].label);

    },
    onConfirm: function(component, event, helper) {
        component.set("v.isDisabled",true);
        helper.helperonConfirm(component, event, helper);
    },
    closeModal : function(component, event, helper) {
        var appEvent = $A.get("e.c:AddSubscriptionEvent");
        appEvent.fire();
    },
    onChangeAction : function(component, event, helper) {
        helper.onChangeActionHelper(component, event, helper);
    }
})