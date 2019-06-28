({
    accordianToggle : function(component,event) {
        var acc = component.find('socialAccordian');
        //for(var eachObject in acc)
        {
            //$A.util.toggleClass(acc[eachObject], 'slds-show');
            //$A.util.toggleClass(acc[eachObject], 'slds-hide');

            $A.util.toggleClass(acc, 'slds-show');
            $A.util.toggleClass(acc, 'slds-hide');
        }
    },
    searchCustomerData : function(component,event,helper) {
        var action, parameterObject;
        var dropdownConfig={};
        helper.showSpinner(component,event);
        //Creating a tost object
        var toastEvent = $A.get("e.force:showToast");
        //Handeling both the object trigger
        if(component.get("v.isAccountObject")){
            action = component.get("c.searchCustomerDataByAccountId");
            parameterObject = component.get("v.accountId");
        }else{
            action = component.get("c.searchCustomerData");
            parameterObject = component.get("v.caseId");
        }
        action.setParams({
            ID : parameterObject
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            helper.hideSpinner(component,event);
            if (state === "SUCCESS") {
                var storeResponse = response.getReturnValue();
                //Storing to the model
                var formattedString = JSON.parse(storeResponse).response[0];
                if(formattedString.dateCreated != null){
                    formattedString.dateCreated = formattedString.dateCreated.split("T")[0];
                }
                //Modifying the string for language and country
                if(formattedString.language !=null){
                    dropdownConfig["language"]=formattedString.language.split("_")[0];
                    dropdownConfig["language"]=formattedString.language.split("_")[0];
                    dropdownConfig["currentLanguage"] = component.get("v.WWCE")["Languages"][dropdownConfig.language];
                    dropdownConfig["currentCountry"] = component.get("v.WWCE")["Countries"][formattedString.country];
                    //Setting the temp language initially
                    component.set("v.tempLanguage", dropdownConfig.language);
                }
                //Checking for user value none
                if(formattedString.userValue == "none"){
                    formattedString.userValue == "NONE";
                    formattedString.oldCustomerValue = formattedString.userValue;
                }else{
                    formattedString.oldCustomerValue = formattedString.userValue;
                }
                component.set("v.accountDetailsModel", formattedString);
        				var newDob = component.get("v.accountDetailsModel.dob");
        				component.set("v.newDob",newDob);
                component.set("v.oldModel", JSON.stringify(formattedString));
                component.set("v.oldCustomerValue", formattedString.oldCustomerValue);
                //Turning on the flags for the toggle
                component.set("v.optInGlobal", formattedString.globalOptin);
                component.set("v.optInThirdParty", formattedString.thirdPartyOptin);
                if(formattedString.globalOptin == 'true'){
                    var optInGlobal = component.find('optInGlobalToggle');
                    optInGlobal.set('v.checked', true);
                }
                if(formattedString.thirdPartyOptin == 'true'){
                    var optInThirdParty = component.find('optInThirdPartyToggle');
                    optInThirdParty.set('v.checked', true);
                }
                //Formatting the persona string
                var listOfPerson = JSON.parse(storeResponse).response[0].personas;
                component.set("v.personaData", listOfPerson);
                component.set("v.selectConfig", dropdownConfig);
                component.set("v.oldLanguage", dropdownConfig.language);
                component.set('v.toResetPasswordEmail', formattedString.email);
            }
        		else{
                        var errorMessage = response.getError();
                        //Adding failure toast
                        toastEvent.setParams({
                            message: errorMessage[0].message,
                            type: "error"
                        });
                        toastEvent.fire();
             }
        });
        $A.enqueueAction(action);
    },

    saveCustomer: function(component, event,helper) {
        if(component.get("v.oldCustomerValue") != component.get("v.accountDetailsModel").userValue){
            helper.updateCustomerFlag(component,event,helper);
        }else{
            helper.saveAccountData(component,event,helper);
        }
    },

    saveAccountData : function(component,event,helper, callback) {
        var action = component.get("c.saveCustomer");
        var changeModel = component.get("v.accountDetailsModel");
        //Select the new country/language in the model
        //component.get("v.selectConfig").currentCountry = component.get("v.WWCE")["Countries"][component.get("v.accountDetailsModel").country];
        //component.get("v.selectConfig").currentLanguage = component.get("v.WWCE")["Languages"][component.get("v.tempLanguage")];
        changeModel.language = component.get("v.tempLanguage")+'_'+component.get("v.accountDetailsModel").country;

        //Creating a tost object
        var toastEvent = $A.get("e.force:showToast");
        if(component.get("v.Spinner") != true && component.get("v.parentEmailFlag") != true){ //TSM-3843 for the 2nd Condition
            helper.showSpinner(component,event);
        }

        //Parsing the data to map - As part of Spring 19 release salesforce issue
        changeModel = JSON.stringify(changeModel);

        action.setParams({
            data : changeModel,
            caseId : component.get("v.caseId"),
            accountId : component.get("v.accountId")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            //Hiding the spinner
            helper.hideSpinner(component,event);
            if (state === "SUCCESS") {
                //Calling update customer flag function
                component.set("v.updateFlag", "true");
				component.set("v.openUnderAgeModal",false);
                    component.set("v.openSpinner",false);
                //Adding success toast
                toastEvent.setParams({
                    message: "Account Info Edit Complete",
                    type: "success"
                });
                toastEvent.fire();
				component.getEvent("onSaveAccount").fire();
            }else{
                var errorMessage = response.getError();
                //Adding failure toast
                toastEvent.setParams({
                    message: errorMessage[0].message,
                    type: "error"
                });
                toastEvent.fire();
            }
            //Loading the Account Info again to refresh the UI
            //this.searchCustomerData(component,event,helper);
        });
        $A.enqueueAction(action);
    },
    // TSM 1912
    resetPasswordEmail :function(component,event,helper){
        var caseObject = component.get('v.caseObj');
        var action = component.get("c.resetPasswordForCustomer");
        var mapResetPassword = {};
        var accountDetails = component.get("v.accountDetailsModel");
        var channel;
        mapResetPassword["customerId"] = accountDetails.id;
        if(caseObject != null){
            mapResetPassword["caseId"] = caseObject.Id;
            if(caseObject.Current_Channel__c == undefined){
                mapResetPassword["channel"] = caseObject.Channel__c;
                channel = caseObject.Channel__c;
            }else{
            	mapResetPassword["channel"] = caseObject.Current_Channel__c;
            	channel = caseObject.Current_Channel__c;
            }
        }else{
            mapResetPassword["channel"] = 'account';
            channel = 'account';
        }
        mapResetPassword["email"] = accountDetails.email;
        mapResetPassword["fromAddress"] = $A.get("$Label.c.ORG_WIDE_EMAIL_ADDRESS");
        mapResetPassword["action"] = 'resetPasswordLinkAndToken';
        mapResetPassword["emailLocale"]=accountDetails.locale;
        mapResetPassword["language"] = accountDetails.language;
         action.setParams({
           mapResetPasswordDetails : mapResetPassword
        });
        //component.set('v.isResetPasswordOpen', false);
        //helper.showSpinner(component,event);
        component.set('v.isLoading', true);
        action.setCallback(this, function(response){
            component.set('v.isLoading', false);
            //helper.hideSpinner(component,event);
            var state = response.getState();
            //var successDetails = JSON.parse(response.getReturnValue());
            if (state === "SUCCESS"){
                //Util.handleSuccess(component, 'A Reset Password email has been sent1');
                var responseObject = response.getReturnValue();
				var parseResponse = JSON.parse(response.getReturnValue());
                var isSendEmail = parseResponse.response[0].isSendEmail;

				var toastEvent = $A.get("e.force:showToast");
                if( (channel != 'Email' || channel == 'account') && isSendEmail == true){
                    toastEvent.setParams({
                        title : 'A Reset Password email has been sent.',
                        message: ' ',
                        type: 'success'
                    });
                    toastEvent.fire();
                }else{
                    var toastEvent = $A.get("e.force:showToast")
                    toastEvent.setParams({
                        title : 'A Reset Password message will be sent',
                        message: 'The reset password link has been added to the outbound message and will be sent upon case save.',
                        duration:' 5000',
                        type: 'success',
                    });
                    toastEvent.fire();
					// Needed for Email type of email to send outbound details via component event.
					var outboundEmailDetails = component.getEvent("sendOutboundEmailIdEvt");
                    outboundEmailDetails.setParams({
                        "outbountEmailVO" : parseResponse.response[0]
                    });
                    outboundEmailDetails.fire();
                }
               component.set('v.isResetPasswordOpen', false);
            }else if(state == 'ERROR'){
                var toastEvent = $A.get("e.force:showToast")
                toastEvent.setParams({
                    title : 'Something went wrong.Please contact IT Team for the same.',
                    message: ' ',
                    duration:' 5000',
                    type: 'error',
                  });
                toastEvent.fire();
                component.set('v.isResetPasswordOpen', false);
            }
        });
        $A.enqueueAction(action);
    },
    updateCustomerFlag : function(component,event,helper) {
        var action = component.get("c.updateCustomerFlagData");
        var updateFlagData = {};
        var changeModel = component.get("v.accountDetailsModel");
        updateFlagData["customerId"]  = changeModel.id;
        updateFlagData["userId"]  = changeModel.id;
        updateFlagData["oldCustomerValue"]  = component.get("v.oldCustomerValue");
        updateFlagData["customerValue"]  = component.get("v.accountDetailsModel").userValue;
        updateFlagData["action"] = "updateAccountFlag";
        var accountEdit = component.get('v.accountInfoChange');
        var toastEvent = $A.get("e.force:showToast");
        //Starting spinner
        helper.showSpinner(component,event);
        action.setParams({
            flagUpdateData : updateFlagData,
            caseId : component.get("v.caseId"),
            accountId : component.get("v.accountId")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                if(accountEdit){
                    helper.saveAccountData(component,event,helper);
                }else{
                    //Calling update customer flag function
                    component.set("v.updateFlag", "true");
                    //Hiding the spinner
                    helper.hideSpinner(component,event);
                    //Adding success toast
                    toastEvent.setParams({
                        message: "Account Info Edit Complete",
                        type: "success"
                    });
                    toastEvent.fire();
                }
            }else{
                //Hiding the spinner
                helper.hideSpinner(component,event);
                //Adding success toast
                toastEvent.setParams({
                    message: "Account Info Edit Failed",
                    type: "error"
                });
                toastEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },

    showSpinner: function(component, event) {
        component.set("v.Spinner", true);
    },

    hideSpinner : function(component,event){
        component.set("v.Spinner", false);
    },

    showSocialSpinner: function(component, event) {
        component.set("v.socialSpinner", true);
    },

    hideSocialSpinner : function(component,event){
        component.set("v.socialSpinner", false);
    },

    populateWWCEObjects : function(component,event, helper){
        var WWCE={
            "States": {
                'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California', 'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska', 'NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania', 'RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont', 'VA':'Virginia','WA':'Washington', 'WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'
            },
            "Countries": {
                'US':'United States','AF':'Afghanistan','AL':'Albania','AX':'Aland Island','DZ':'Algeria','AS':'American Samoa','AD':'Andorra','AO':'Angola','AI':'Anguilla','AQ':'Antarctica', 'AG':'Antigua and Barbuda','AR':'Argentina','AM':'Armenia', 'AW':'Aruba','AU':'Australia', 'AT':'Austria','AZ':'Azerbaijan','BS':'Bahamas','BH':'Bahrain','BD':'Bangladesh','BB':'Barbados','BY':'Belarus','BE':'Belgium','BZ':'Belize','BJ':'Benin','BM':'Bermuda','BT':'Bhutan','BO':'Bolivia','BA':'Bosnia and Herzegovina','BW':'Botswana','BV':'Bouvet Island','BR':'Brazil','IO':'British Indian Ocean Territory (Chagos Archipelago)','VG':'British Virgin Islands','BN':'Brunei','BG':'Bulgaria','BF':'Burkina Faso','BI':'Burundi','KH':'Cambodia','CM':'Cameroon','CA':'Canada','CV':'Cape Verde','KY':'Cayman Islands','CF':'Central African Republic','TD':'Chad','CL':'Chile','CN':'China', 'CX':'Christmas Island','CC':'Cocos Islands', 'CO':'Colombia','KM':'Comoros','CG':'Congo,People\'s Republic of','CK':'Cook Islands','CR':'Costa Rica','HR':'Croatia','CY':'Cyprus', 'CZ':'Czech Republic','DK':'Denmark', 'DJ':'Djibouti','DM':'Dominica','DO':'Dominican Republic','TL':'East Timor','EC':'Ecuador','EG':'Egypt','SV':'El Salvador','GQ':'Equatorial Guinea','ER':'Eritrea', 'EE':'Estonia','ET':'Ethiopia','FO':'Faeroe Islands','FK':'Falkland Islands (Malvinas)','FJ':'Fiji','FI':'Finland','FR':'France','GF':'French Guiana','PF':'French Polynesia', 'TF':'French Southern Territories','GA':'Gabon','GM':'Gambia','GE':'Georgia','DE':'Germany','GH':'Ghana','GI':'Gibraltar','GR':'Greece','GL':'Greenland', 'GD':'Grenada','GP':'Guadaloupe', 'GU':'Guam','GT':'Guatemala','GN':'Guinea','GW':'Guinea-Bissau','GY':'Guyana,Republic of','HT':'Haiti','HM':'Heard and McDonald Islands', 'HN':'Honduras','HK':'Hong Kong', 'HU':'Hungary','IS':'Iceland','IN':'India','ID':'Indonesia','IQ':'Iraq','IE':'Ireland','IL':'Israel','IT':'Italy','CI':'Ivory Coast','JM':'Jamaica','JP':'Japan','JO':'Jordan','KZ':'Kazakhstan','KE':'Kenya', 'KI':'Kiribati','KW':'Kuwait', 'KG':'Kyrgyz Republic','LA':'Lao People\'s Democratic Republic','LV':'Latvia', 'LB':'Lebanon','LS':'Lesotho','LR':'Liberia','LI':'Liechtenstein','LT':'Lithuania','LU':'Luxembourg','MK':'Macedonia','MG':'Madagascar','MW':'Malawi', 'MY':'Malaysia','MV':'Maldives', 'ML':'Mali','MT':'Malta','MH':'Marshall Islands','MQ':'Martinique','MR':'Mauritania','MU':'Mauritius','YT':'Mayotte','MX':'Mexico','FM':'Micronesia', 'MD':'Moldova','MC':'Monaco', 'MN':'Mongolia','ME':'Montenegro', 'MS':'Montserrat','MA':'Morocco','MZ':'Mozambique','NA':'Namibia','NR':'Nauru', 'NP':'Nepal','NL':'Netherlands', 'AN':'Netherlands Antilles','NC':'New Caledonia','NZ':'New Zealand','NI':'Nicaragua','NE':'Niger','NG':'Nigeria','NU':'Niue','NF':'Norfolk Island','MP':'Northern Mariana Islands', 'NO':'Norway','OM':'Oman','PK':'Pakistan','PW':'Palau','PA':'Panama','PG':'Papua New Guinea','PY':'Paraguay','PE':'Peru','PH':'Philippines','PN':'Pitcairn Island','PL':'Poland', 'PT':'Portugal','PR':'Puerto Rico', 'QA':'Qatar','RE':'Reunion','RO':'Romania','RU':'Russian Federation','RW':'Rwanda', 'WS':'Samoa','SM':'San Marino', 'ST':'Sao Tome and Principe','SA':'Saudi Arabia','SN':'Senegal','RS':'Serbia','SC':'Seychelles','SL':'Sierra Leone','SG':'Singapore', 'SK':'Slovakia (Slovak Republic)','SI':'Slovenia','SB':'Solomon Islands','SO':'Somalia','ZA':'South Africa', 'KR':'South Korea','ES':'Spain', 'LK':'Sri Lanka','SH':'St. Helena','KN':'St. Kitts and Nevis','LC':'St. Lucia','PM':'St. Pierre and Miquelon','VC':'St. Vincent and the Grenadines','SR':'Suriname', 'SJ':'Svalbard &amp; Jan Mayen Islands','SZ':'Swaziland','SE':'Sweden','CH':'Switzerland','TW':'Taiwan','TJ':'Tajikistan','TZ':'Tanzania', 'TH':'Thailand','TG':'Togo', 'TK':'Tokelau','TO':'Tonga','TT':'Trinidad and Tobago','TN':'Tunisia','TR':'Turkey','TM':'Turkmenistan','TC':'Turks and Caicos Islands', 'TV':'Tuvalu','VI':'US Virgin Islands', 'UG':'Uganda','UA':'Ukraine','AE':'United Arab Emirates','GB':'United Kingdom','UM':'United States Minor Outlying Islands','UY':'Uruguay','UZ':'Uzbekistan', 'VU':'Vanuatu','VA':'Vatican City', 'VE':'Venezuela','VN':'Viet Nam','WF':'Wallis and Futuna Islands','EH':'Western Sahara','YE':'Yemen','ZM':'Zambia','ZW':'Zimbabwe'
            },
            "CountryCodes": { 'AF': '+93', 'AX': '+358', 'AL': '+355', 'DZ': '+213', 'AS': '+1', 'AD': '+376', 'AO': '+244', 'AI': '+1', 'AQ': '+672', 'AG': '+268', 'AR': '+54', 'AM': '+374', 'AW': '+297', 'AU': '+61', 'AT': '+43', 'AZ': '+994', 'BS': '+1', 'BH': '+973', 'BD': '+880', 'BB': '+1', 'BY': '+375', 'BE': '+32', 'BZ': '+501', 'BJ': '+229', 'BM': '+1', 'BT': '+975', 'BO': '+591', 'BA': '+387', 'BW': '+267', 'BV': '+47', 'BR': '+55', 'IO': '+246', 'VG': '+1', 'BN': '+673', 'BG': '+359', 'BF': '+226', 'BI': '+257', 'KH': '+855', 'CM': '+237', 'CA': '+1', 'CV': '+238', 'KY': '+1', 'CF': '+236', 'TD': '+235', 'CL': '+56', 'CN': '+86', 'CX': '+61', 'CC': '+891', 'CO': '+57', 'KM': '+269', 'CG': '+242', 'CK': '+682', 'CR': '+506', 'HR': '+385', 'CY': '+357', 'CZ': '+420', 'DK': '+45', 'DJ': '+253', 'DM': '+1', 'DO': '+1', 'TL': '+670', 'EC': '+593', 'EG': '+20', 'SV': '+503', 'GQ': '+240', 'ER': '+291', 'EE': '+372', 'ET': '+251', 'FO': '+298', 'FK': '+500', 'FJ': '+679', 'FI': '+358', 'FR': '+33', 'GF': '+594', 'PF': '+689', 'GA': '+241', 'GM': '+220', 'GE': '+995', 'DE': '+49', 'GH': '+233', 'GI': '+350', 'GR': '+30', 'GL': '+299', 'GD': '+1', 'GP': '+590', 'GU': '+1', 'GT': '+502', 'GN': '+224', 'GW': '+245', 'GY': '+592', 'HT': '+509', 'HN': '+504', 'HK': '+852', 'HU': '+36', 'IS': '+354', 'IN': '+91', 'ID': '+62', 'IQ': '+964', 'IE': '+353', 'IL': '+972', 'IT': '+39', 'CI': '+225', 'JM': '+1', 'JP': '+81', 'JO': '+962', 'KZ': '+7', 'KE': '+254', 'KI': '+686', 'KW': '+965', 'KG': '+996', 'LA': '+856', 'LV': '+371', 'LB': '+961', 'LS': '+266', 'LR': '+231', 'LI': '+423', 'LT': '+370', 'LU': '+352', 'MK': '+389', 'MG': '+261', 'MW': '+265', 'MY': '+60', 'MV': '+960', 'ML': '+223', 'MT': '+356', 'MH': '+692', 'MQ': '+596', 'MR': '+222', 'MU': '+230', 'YT': '+269', 'MX': '+52', 'FM': '+691', 'MD': '+373', 'MC': '+377', 'MN': '+976', 'ME': '+382', 'MS': '+1', 'MA': '+212', 'MZ': '+258', 'NA': '+264', 'NR': '+674', 'NP': '+977', 'NL': '+31', 'AN': '+599', 'NC': '+687', 'NZ': '+64', 'NI': '+505', 'NE': '+227', 'NG': '+234', 'NU': '+683', 'NF': '+672', 'MP': '+1', 'NO': '+47', 'OM': '+968', 'PK': '+92', 'PW': '+680', 'PA': '+507', 'PG': '+675', 'PY': '+595', 'PE': '+51', 'PH': '+63', 'PN': '+64', 'PL': '+48', 'PT': '+351', 'PR': '+1', 'QA': '+974', 'RE': '+262', 'RO': '+40', 'RU': '+7', 'RW': '+250', 'WS': '+685', 'SM': '+378', 'ST': '+239', 'SA': '+966', 'SN': '+221', 'RS': '+381', 'SC': '+248', 'SL': '+232', 'SG': '+65', 'SK': '+421', 'SI': '+386', 'SB': '+677', 'SO': '+252', 'ZA': '+27', 'KR': '+82', 'ES': '+34', 'LK': '+94', 'SH': '+290', 'KN': '+869', 'LC': '+1', 'PM': '+508', 'VC': '+1784', 'SR': '+597', 'SZ': '+268', 'SE': '+46', 'CH': '+41', 'TW': '+886', 'TJ': '+992', 'TZ': '+255', 'TH': '+66', 'TG': '+228', 'TK': '+690', 'TO': '+676', 'TT': '+1', 'TN': '+216', 'TR': '+90', 'TM': '+993', 'TC': '+1', 'TV': '+688', 'UG': '+256', 'UA': '+380', 'AE': '+971', 'GB': '+44', 'US': '+1', 'UY': '+598', 'VI': '+1', 'UZ': '+998', 'VU': '+678', 'VA': '+39', 'VE': '+58', 'VN': '+84', 'WF': '+681', 'EH': '+212', 'YE': '+967', 'ZM': '+260', 'ZW': '+263'
                            },
            "CountryCodeMinMax": {
                'US': {'Min':'10' ,'Max':'10' },'AF': {'Min':'9' ,'Max':'9' },'AL': {'Min':'3' ,'Max':'9' },'DZ': {'Min':'8' ,'Max':'9' },'AS': {'Min':'10' ,'Max':'10' },'AD': {'Min':'6' ,'Max':'9' },'AO': {'Min':'9' ,'Max':'9' },'AI': {'Min':'10' ,'Max':'10' },'AG': {'Min':'10' ,'Max':'10' },'AR': {'Min':'10' ,'Max':'10' },'AM': {'Min':'8' ,'Max':'8' },'AW': {'Min':'7' ,'Max':'7' },'AU': {'Min':'4' ,'Max':'15' },'AT': {'Min':'4' ,'Max':'13' },'AZ': {'Min':'8' ,'Max':'9' },'BS': {'Min':'10' ,'Max':'10' },'BH': {'Min':'8' ,'Max':'8' },'BD': {'Min':'6' ,'Max':'10' },'BB': {'Min':'10' ,'Max':'10' },'BY': {'Min':'9' ,'Max':'10' },'BE': {'Min':'8' ,'Max':'9' },'BZ': {'Min':'7' ,'Max':'7' },'BJ': {'Min':'8','Max':'8' },'BM': {'Min':'10' ,'Max':'10' },'BT': {'Min':'7' ,'Max':'8' },'BO': {'Min':'8' ,'Max':'8' },'BA': {'Min':'8' ,'Max':'8' },'BW': {'Min':'7' ,'Max':'8' },'BR': {'Min':'10' ,'Max':'10' },'VG': {'Min':'10' ,'Max':'10' },'BN': {'Min':'7' ,'Max':'7' },'BG': {'Min':'7' ,'Max':'9' },'BF': {'Min':'8' ,'Max':'8' },'BI': {'Min':'8' ,'Max':'8' },'KH': {'Min':'8' ,'Max':'8' },'CM': {'Min':'8' ,'Max':'8' },'CA': {'Min':'10' ,'Max':'10' },'CV': {'Min':'7' ,'Max':'7' },'KY': {'Min':'10' ,'Max':'10' },'CF': {'Min':'8' ,'Max':'8' },'TD': {'Min':'6' ,'Max':'7' },'CL': {'Min':'8' ,'Max':'9' },'CN': {'Min':'5' ,'Max':'12' },'CO': {'Min':'8' ,'Max':'10' },'KM': {'Min':'7' ,'Max':'7' },'CG': {'Min':'6' ,'Max':'7' },'CK': {'Min':'5' ,'Max':'5' },'CR': {'Min':'8' ,'Max':'8' },'HR': {'Min':'8' ,'Max':'12' },'CY': {'Min':'8' ,'Max':'11' },'CZ': {Min:'4' ,'Max':'12' },'DK': {'Min':'8' ,'Max':'8' },'DJ': {'Min':'6' ,'Max':'6' },'DM': {'Min':'10' ,'Max':'10' },'DO': {'Min':'10' ,'Max':'10' },'EC': {'Min':'8' ,'Max':'8' },'EG': {'Min':'7' ,'Max':'9' },'SV': {'Min':'7' ,'Max':'11' },'GQ': {'Min':'6' ,'Max':'6' },'ER': {'Min':'7' ,'Max':'7' },'EE': {'Min':'7' ,'Max':'10' },'ET': {'Min':'9' ,'Max':'9' },'FO': {'Min':'6' ,'Max':'6' },'FK': {'Min':'5','Max':'5' },'FJ': {'Min':'7' ,'Max':'7' },'FI': {'Min':'5' ,'Max':'12' },'FR': {'Min':'9' ,'Max':'9' },'GF': {'Min':'9' ,'Max':'9' },'PF': {'Min':'6' ,'Max':'6' },'GA': {'Min':'6' ,'Max':'7' },'GM': {'Min':'7' ,'Max':'7' },'GE': {'Min':'8' ,'Max':'8' },'DE': {'Min':'6' ,'Max':'13' },'GH': {'Min':'5' ,'Max':'9' },'GI': {'Min':'8' ,'Max':'8' },'GR': {'Min':'10' ,'Max':'10' },'GL': {'Min':'6' ,'Max':'6' },'GD': {'Min':'10' ,'Max':'10' },'GP': {'Min':'9' ,'Max':'9' },'GU': {'Min':'10' ,'Max':'10' },'GT': {'Min':'8' ,'Max':'8' },'GN': {'Min':'8' ,'Max':'8' },'GW': {'Min':'7' ,'Max':'7' },'GY': {'Min':'7' ,'Max':'7' },'HT': {'Min':'8' ,'Max':'8' },'HN': {'Min':'7' ,'Max':'8' },'HK': {'Min':'4' ,'Max':'9' },'HU': {'Min':'8' ,'Max':'9' },'IS': {'Min':'7' ,'Max':'9' },'IN': {'Min':'7' ,'Max':'10' },'ID': {'Min':'5' ,'Max':'10' },'IQ': {'Min':'8' ,'Max':'10' },'IE': {'Min':'7' ,'Max':'11' },'IL': {'Min':'8' ,'Max':'9' },'IT': {'Min':'1','Max':'11'},'JM': {'Min':'10' ,'Max':'10' },'JP': {'Min':'9' ,'Max':'10' },'JO': {'Min':'5' ,'Max':'9' },'KZ': {'Min':'10' ,'Max':'10' },'KE': {'Min':'6' ,'Max':'10' },'KI': {'Min':'5' ,'Max':'5' },'KW': {'Min':'7' ,'Max':'8' },'KG': {'Min':'9' ,'Max':'9' },'LA': {'Min':'8' ,'Max':'9' },'LV': {'Min':'7' ,'Max':'8' },'LB': {'Min':'7' ,'Max':'8' },'LS': {'Min':'8' ,'Max':'8' },'LR': {'Min':'7' ,'Max':'8' },'LI': {'Min':'7' ,'Max':'9' },'LT': {'Min':'8' ,'Max':'8' },'LU': {'Min':'4' ,'Max':'11' },'MG': {'Min':'9' ,'Max':'10' },'MW': {'Min':'7' ,'Max':'8' },'MY': {'Min':'7' ,'Max':'9' },'MV': {'Min':'7' ,'Max':'7' },'ML': {'Min':'8' ,'Max':'8' },'MT': {'Min':'8' ,'Max':'8' },'MH': {'Min':'7' ,'Max':'7' },'MQ': {'Min':'9' ,'Max':'9' },'MR': {'Min':'7' ,'Max':'7' },'MU': {'Min':'7' ,'Max':'7' },'MX': {'Min':'10' ,'Max':'10' },'FM': {'Min':'7' ,'Max':'7' },'MD': {'Min':'8' ,'Max':'8' },'MC': {'Min':'5' ,'Max':'9' },'MN': {'Min':'7' ,'Max':'8' },'ME': {'Min':'4' ,'Max':'12' },'MS': {'Min':'10' ,'Max':'10' },'MA': {'Min':'9' ,'Max':'9' },'MZ': {'Min':'8' ,'Max':'9' },'NA': {'Min':'6' ,'Max':'10' },'NR': {'Min':'4' ,'Max':'7' },'NP': {'Min':'8' ,'Max':'9' },'NL': {'Min':'9' ,'Max':'9' },'AN': {'Min':'6' ,'Max':'8' },'NC': {'Min':'6' ,'Max':'6' },'NZ': {'Min':'3' ,'Max':'10' },'NI': {'Min':'8' ,'Max':'8' },'NE': {'Min':'8' ,'Max':'8' },'NG': {'Min':'7' ,'Max':'10' },'NU': {'Min':'4' ,'Max':'4' },'MP': {'Min':'10' ,'Max':'10' },'NO': {'Min':'5' ,'Max':'8' },'OM': {'Min':'7' ,'Max':'8' },'PK': {'Min':'8' ,'Max':'11' },'PW': {'Min':'7' ,'Max':'7' },'PA': {'Min':'7' ,'Max':'8' },'PG': {'Min':'4' ,'Max':'11' },'PY': {'Min':'5' ,'Max':'9' },'PE': {'Min':'8' ,'Max':'11' },'PH': {'Min':'8' ,'Max':'10' },'PL': {'Min':'6' ,'Max':'9' },'PT': {'Min':'9' ,'Max':'11' },'PR': {'Min':'10' ,'Max':'10' },'QA': {'Min':'6' ,'Max':'10' },'RO': {'Min':'9' ,'Max':'9' },'RU': {'Min':'10' ,'Max':'10' },'RW': {'Min':'9' ,'Max':'9' },'WS': {'Min':'3' ,'Max':'7' },'SM': {'Min':'6' ,'Max':'10' },'ST': {'Min':'7' ,'Max':'7' },'SA': {'Min':'8' ,'Max':'9' },'SN': {'Min':'9' ,'Max':'9' },'RS': {'Min':'4' ,'Max':'12' },'SC': {'Min':'6' ,'Max':'6' },'SL': {'Min':'8' ,'Max':'8' },'SG': {'Min':'8' ,'Max':'12' },'SK': {'Min':'4' ,'Max':'9' },'SI': {'Min':'8' ,'Max':'8' },'SB': {'Min':'5' ,'Max':'5' },'SO': {'Min':'5' ,'Max':'8' },'ZA': {'Min':'9' ,'Max':'9' },'ES': {'Min':'9' ,'Max':'9' },'LK': {'Min':'9' ,'Max':'9' },'SR': {'Min':'6' ,'Max':'7' },'SZ': {'Min':'7' ,'Max':'8' },'SE': {'Min':'7' ,'Max':'13' },'CH': {'Min':'4' ,'Max':'12' },'TW': {'Min':'8' ,'Max':'9' },'TJ': {'Min':'9' ,'Max':'9' },'TZ': {'Min':'9' ,'Max':'9' },'TH': {'Min':'8' ,'Max':'9' },'TG': {'Min':'7' ,'Max':'7' },'TK': {'Min':'4' ,'Max':'4' },'TO': {'Min':'5' ,'Max':'7' },'TT': {'Min':'10' ,'Max':'10' },'TN': {'Min':'8' ,'Max':'8' },'TR': {'Min':'10' ,'Max':'10' },'TM': {'Min':'8' ,'Max':'8' },'TC': {'Min':'10' ,'Max':'10' },'TV': {'Min':'5' ,'Max':'6' },'VI': {'Min':'10' ,'Max':'10' },'UG': {'Min':'9' ,'Max':'9' },'UA': {'Min':'9' ,'Max':'9' },'AE': {'Min':'8' ,'Max':'9' },'GB': {'Min':'7' ,'Max':'10' },'UY': {'Min':'4' ,'Max':'11' },'UZ': {'Min':'9' ,'Max':'9' },'VU': {'Min':'5' ,'Max':'7' },'VA': {'Min':'11' ,'Max':'11' },'VE': {'Min':'10' ,'Max':'10' },'VN': {'Min':'7' ,'Max':'10' },'WF': {'Min':'6' ,'Max':'6' },'YE': {'Min':'6' ,'Max':'9' },'ZM': {'Min':'9' ,'Max':'9' },'ZW': {'Min':'5' ,'Max':'9' }, 'CX':{'Min':'4' ,'Max':'15'} ,'CI':{'Min':'8' ,'Max':'8'},'MK':{'Min':'8' ,'Max':'8'}
            },
            "Languages": {
                'ab':'Abkhazian', 'aa':'Afar', 'af':'Afrikaans', 'sq':'Albanian', 'am':'Amharic', 'ar':'Arabic', 'hy':'Armenian', 'as':'Assamese', 'ae':'Avestan', 'ay':'Aymara', 'az':'Azerbaijani', 'ba':'Bashkir', 'eu':'Basque', 'bn':'Bengali', 'dz':'Bhutani', 'bh':'Bihari', 'bi':'Bislama', 'bs':'Bosnian', 'br':'Breton', 'bg':'Bulgarian', 'my':'Burmese', 'be':'Byelorussian', 'km':'Cambodian', 'ca':'Catalan', 'ch':'Chamorro', 'ce':'Chechen', 'ny':'Chichewa', 'zh':'Chinese', 'cu':'Church', 'cv':'Chuvash', 'kw':'Cornish', 'co':'Corsican', 'hr':'Croatian', 'cs':'Czech', 'da':'Danish', 'nl':'Dutch', 'en':'English', 'eo':'Esperanto', 'et':'Estonian', 'fo':'Faeroese', 'fj':'Fiji', 'fi':'Finnish', 'fr':'French', 'fy':'Frisian', 'gd':'Gaelic', 'gl':'Galician', 'ka':'Georgian', 'de':'German', 'el':'Greek', 'kl':'Greenlandic', 'gn':'Guarani', 'gu':'Gujarati', 'ha':'Hausa', 'he':'Hebrew', 'hz':'Herero', 'hi':'Hindi', 'ho':'Hiri Motu', 'hu':'Hungarian', 'is':'Icelandic', 'io':'Ido', 'id':'Indonesian', 'ia':'Interlingua', 'ie':'Interlingue', 'iu':'Inuktitut', 'ik':'Inupiak', 'ga':'Irish', 'it':'Italian', 'ja':'Japanese', 'jv':'Javanese', 'kn':'Kannada', 'ks':'Kashmiri', 'kk':'Kazakh', 'ki':'Kikuyu', 'rw':'Kinyarwanda', 'ky':'Kirghiz', 'rn':'Kirundi', 'kv':'Komi', 'ko':'Korean', 'kj':'Kuanyama', 'ku':'Kurdish', 'lo':'Laothian', 'la':'Latin', 'lv':'Latvian', 'ln':'Lingala', 'lt':'Lithuanian', 'lb':'Luxembourgish', 'mk':'Macedonian', 'mg':'Malagasy', 'ms':'Malay', 'ml':'Malayalam', 'mt':'Maltese', 'gv':'Manx', 'mi':'Maori', 'mr':'Marathi', 'mh':'Marshallese', 'mo':'Moldavian', 'mn':'Mongolian', 'na':'Nauru', 'nv':'Navajo', 'ng':'Ndonga', 'ne':'Nepali', 'nd':'North Ndebele', 'se':'Northern Sami', 'no':'Norwegian', 'nb':'Norwegian Bokmål', 'nn':'Norwegian Nynorsk', 'oc':'Occitan', 'or':'Oriya', 'om':'Oromo', 'os':'Ossetian', 'pi':'Pali', 'ps':'Pashto', 'fa':'Persian', 'pl':'Polish', 'pt':'Portuguese', 'pa':'Punjabi', 'qu':'Quechua', 'rm':'Rhaeto-Romance', 'ro':'Romanian', 'ru':'Russian', 'sm':'Samoan', 'sg':'Sangro', 'sa':'Sanskrit', 'sc':'Sardinian', 'sr':'Serbian', 'sh':'Serbo-Croatian', 'st':'Sesotho', 'tn':'Setswana', 'sn':'Shona', 'sd':'Sindhi', 'si':'Singhalese', 'ss':'Siswati', 'sk':'Slovak', 'sl':'Slovenian', 'so':'Somali', 'nr':'South Ndebele', 'es':'Spanish', 'su':'Sudanese', 'sw':'Swahili', 'sv':'Swedish', 'tl':'Tagalog', 'ty':'Tahitian', 'tg':'Tajik', 'ta':'Tamil', 'tt':'Tatar', 'te':'Tegulu', 'th':'Thai', 'bo':'Tibetan', 'ti':'Tigrinya', 'to':'Tonga', 'ts':'Tsonga', 'tr':'Turkish', 'tk':'Turkmen', 'tw':'Twi', 'ug':'Uighur', 'uk':'Ukrainian', 'ur':'Urdu', 'uz':'Uzbek', 'vi':'Vietnamese', 'vo':'Volapuk', 'wa':'Walloon', 'cy':'Welsh', 'wo':'Wolof', 'xh':'Xhosa', 'yi':'Yiddish', 'yo':'Yoruba', 'za':'Zhuang', 'zu':'Zulu'
            }
        }
        component.set("v.WWCE", WWCE);
        //Consructing option and lables from the list for countries
        var countryArray=[]
        for(var eachKey in Object.keys(WWCE["Countries"])){
            var countryMap={};
            countryMap["value"]=Object.keys(WWCE["Countries"])[eachKey];
            countryMap["label"]=WWCE["Countries"][countryMap["value"]];
            countryArray.push(countryMap);
        }
        //Construction of map for language from the list of languages
        var languageArray=[]
        for(var eachKey in Object.keys(WWCE["Languages"])){
            var languageMap={};
            languageMap["value"]=Object.keys(WWCE["Languages"])[eachKey];
            languageMap["label"]=WWCE["Languages"][languageMap["value"]];
            languageArray.push(languageMap);
        }
        component.set("v.countryList", countryArray);
        component.set("v.languageList", languageArray);
    },
    optInSave: function(component, event, helper, globalOptin, thirdPartyOptin,optTypeMessage) {
        var action = component.get("c.saveOptIn");
        var currentModel = component.get("v.accountDetailsModel");
        var data={};
        data["id"] = currentModel.id;
        data["globalOptin"] = globalOptin;
        data["thirdPartyOptin"] = thirdPartyOptin;
        data["email"] = currentModel.email;
        data["customerId"] = component.get("v.nucleusId");
        helper.showSocialSpinner(component,event);
        var toastEvent = $A.get("e.force:showToast");
        action.setParams({
            data : data,
            caseId : component.get("v.caseId"),
            accountId : component.get("v.accountId")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var storeResponse = response.getReturnValue();
                var formattedString = JSON.parse(storeResponse).response[0];
                currentModel.globalOptin = formattedString.globalOptin;
                currentModel.thirdPartyOptin = formattedString.thirdPartyOptin;
                helper.hideSocialSpinner(component,event);
                //Adding success toast
                toastEvent.setParams({
                    message: optTypeMessage,
                    type: "success"
                });
                toastEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    //Adding the helper functionality to set temporary password as part of ticket TSM-1318
    setTemporaryPassword: function(component, helper) {
        var action = component.get("c.setTemporaryPassword");
        var currentModel = component.get("v.accountDetailsModel");
        var temporaryPassword = component.find("temporaryPassword").get("v.value");
        var toastEvent = $A.get("e.force:showToast");
        action.setParams({
            temporaryPassword : temporaryPassword,
            customerId : currentModel.id,
            caseId : component.get("v.caseId"),
            strAccountId: component.get("v.accountId")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var storeResponse = response.getReturnValue();
                component.set('v.isSetTemporaryPasswordOpen', false);
                //Adding success toast
                toastEvent.setParams({
                    message: "A temporary password has been created!",
                    type: "success"
                });
                toastEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    //Getting linked account
    getLinkedAccount: function(component, event, helper) {
        var action = component.get("c.getLinkedAccountByEmail");
        var selectedEmail = event.srcElement.innerText;
        var workspaceAPI = component.find("workspace");
        var toastEvent = $A.get("e.force:showToast");
        action.setParams({
            linkedEmail : selectedEmail,
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var storeResponse = response.getReturnValue();
                workspaceAPI.getEnclosingTabId().then(function(tabId) {
                    workspaceAPI.openSubtab({
                        parentTabId: tabId,
                        url: '/lightning/r/Account/'+storeResponse+'/view',
                        focus: true
                    });
                })
                .catch(function(error) {
                    console.log(error);
                });
            }else{
                //Adding success toast
                toastEvent.setParams({
                    message: "No Account found!",
                    type: "error"
                });
                toastEvent.fire();
            }
        });
        $A.enqueueAction(action);
    },
    //Getting age requirements
    getAgeRequirements: function(component, event, helper,fromDob) {
        var action = component.get("c.getPlayerAgeRequirements");
        var currentModel = component.get("v.accountDetailsModel");
        var currentAge = this.getAge(currentModel.dob);
        var toastEvent = $A.get("e.force:showToast");
        action.setParams({
            countryCode : currentModel.country,
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {

                const accountforms = component.find("accountform");
                const isFormAvaialble = Array.isArray(accountforms) && accountforms[3];

                if(currentAge <=0 && isFormAvaialble){
                    accountforms[3].setCustomValidity('Invalid Date of Birth');
                }
                else if(currentAge >0 && isFormAvaialble){
                    accountforms[3].setCustomValidity('');
                }
                if(isFormAvaialble){
                    accountforms[3].reportValidity();
                }

                var storeResponse = JSON.parse(response.getReturnValue()).response[0];
                if(currentAge < parseInt(storeResponse.minLegalRegistrationAge)&&currentAge>0&&currentAge!=0){
                    component.set("v.underAgeAccount", true);
                    //Adding warning toast
                    toastEvent.setParams({
                        message: "The change will convert the account into a minor account.",
                        type: "warning"
                    });
					if(fromDob==true)
                    toastEvent.fire();

                }else{
                    component.set("v.underAgeAccount", false);
                }
            }
        });
        $A.enqueueAction(action);
    },
    getAge: function(dateString)
    {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var month = today.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate()))
        {
            age--;
        }
        return age;
    },
    enableOrDisableSaveButton: function(component){
        var disableSave = component.get('v.disableSave');
        var fname = component.find("accountform")[0].get('v.value'),
            lname = component.find("accountform")[1].get('v.value'),
            persona = component.find("accountform")[2].get('v.value'),
            primaryEmail = component.find("accountform")[4].get('v.value'),
            country = component.find("accountform")[6].get('v.value'),
            language = component.find("accountform")[7].get('v.value'),
            customerValue = component.find("accountform")[0].get('v.value');

        if(fname !='' && lname !='' && persona !='' && primaryEmail !='' && country !='' && language !=''){
            component.set('v.disableSave', false);
        }
        else{
            component.set('v.disableSave', true);
        }
    },

	//TSM-1931
    // Checking Email Verified or Not
	updateEmailFlag: function (component, event, helper) {
        var caseId = component.get("v.caseId");
        var action = component.get("c.updateEmailCaseFlag");
        action.setParams({
            caseID: caseId
        });
        action.setCallback(this, function (response) {
            var state = response.getState();
            if (state === 'SUCCESS') {
                console.log('Check Email Status: '+response.getReturnValue());
            }
        });
        $A.enqueueAction(action);
    },

	updateSecondaryEmail : function(component, event,helper) {
        var action = component.get("c.updateSecondaryEmail");
        var accountDetails = component.get("v.accountDetailsModel");
        var requestObject = {};
        var toastEvent = $A.get("e.force:showToast");

        requestObject.AccountId = component.get("v.accountId");
        requestObject.customerId = accountDetails.id;
        requestObject.caseId = component.get("v.caseId");
        requestObject.secondaryEmail = accountDetails.secondaryEmail;
        requestObject.oldSecondaryEmail = component.get("v.secondaryOldEmailValue");

        action.setParams({
            reqParams : requestObject
        });

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                helper.saveCustomer(component, event, helper);
                toastEvent.setParams({
                    "message": "Secondary Email validated successfully!",
                    "type": "success"
                });
            } else {
                helper.saveCustomer(component, event, helper);
                var errors = response.getError();
                if (errors[0] && errors[0].message) {
                    toastEvent.setParams({
                        "message": errors[0].message,
                        "type" : "error"
                    });
                } else {
                    toastEvent.setParams({
                        "message": "Secondary Email couldn’t be validated!",
                        "type" : "error"
                    });
                }
            }
            toastEvent.fire();
        });
        $A.enqueueAction(action);
	},

    secondaryEmailVerification : function(component, event, helper) {
        var action = component.get("c.getSecondaryEmailCode");
        var accountDetails = component.get("v.accountDetailsModel");
        var toastEvent = $A.get("e.force:showToast");
        var requestObject = {};

        requestObject.AccountId = component.get("v.accountId");
        requestObject.customerId = accountDetails.id;
        requestObject.caseId = component.get("v.caseId");
        requestObject.secondaryEmail = accountDetails.secondaryEmail;

        action.setParams({
            reqParams : requestObject
        });

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.verificationCode", JSON.parse(response.getReturnValue()).response.securityCode);
                component.set("v.isEmailVerificationOpen", true);
                console.log("Secondary Email Verification Code Sent!");

            } else {
                helper.saveCustomer(component, event, helper);
                var errors = response.getError();
                if (errors[0] && errors[0].message) {
                    toastEvent.setParams({
                        "message": errors[0].message,
                        "type" : "error"
                    });
                    toastEvent.fire();
                } else {
                    console.log("Secondary Email Verification Code couldn’t Sent!");
                }
            }
        });
        $A.enqueueAction(action);
	},

    dltSecondaryEmail : function(component, event, helper) {
        var action = component.get("c.deleteSecondaryEmail");
        var accountDetails = component.get("v.accountDetailsModel");
        var toastEvent = $A.get("e.force:showToast");
        var requestObject = {};

        requestObject.AccountId = component.get("v.accountId");
        requestObject.customerId = accountDetails.id;
        requestObject.caseId = component.get("v.caseId");
        requestObject.secondaryEmail = component.get("v.secondaryOldEmailValue");

        action.setParams({
            reqParams : requestObject
        });

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                helper.saveCustomer(component, event, helper);
                toastEvent.setParams({
                    "message": "Secondary Email has been removed!",
                    "type": "success"
                });

            } else {
                helper.saveCustomer(component, event, helper);
                var errors = response.getError();
                if (errors[0] && errors[0].message) {
                    toastEvent.setParams({
                        "message": errors[0].message,
                        "type" : "error"
                    });
                } else {
                    toastEvent.setParams({
                        "message": "Secondary Email couldn’t remove!",
                        "type" : "error"
                    });
                }
            }
            toastEvent.fire();
        });
        $A.enqueueAction(action);
    },
	addPersona: function(component,event,helper){
        var personaName = component.get("v.personaName");
        var namespace = component.get("v.namespace");
        var caseObj= component.get("v.caseObj");
        var requestObject ={};
        var data = {};
        requestObject['caseId'] = caseObj.Id;
        requestObject['accountId'] = caseObj.AccountId;
        requestObject['customerId']= component.get("v.nucleusId");
        data['statusReasonCode']='NONE';
        data['namespace']=namespace;
        data['name']=personaName;
        data['displayName']=personaName;
        requestObject['data']=JSON.stringify(data);
        console.log('requestObject ::',requestObject, 'stringified ::', JSON.stringify(requestObject));
        var action=component.get("c.addPersona");
        var toastEvent = $A.get("e.force:showToast");
        var toastEventPartialError = $A.get("e.force:showToast");
        action.setParams({
            reqParameters:requestObject
        });
        action.setCallback(this,function(response){
            console.log('response  after addPersona ::', response.getReturnValue(), 'CallbackSatte ::', response.getState(), 'Error msg::',response.getError());
            if(response.getState()==='SUCCESS'){
                component.set("v.openSpinner",false);
            	component.set("v.newPersonaModal",false);
                component.set("v.personaName",'');
                component.find("addPersona")[1].set("v.value",'');
               this.searchCustomerData(component,event,helper);
           // var refreshEvent = component.getEvent("refreshPersonaGrid");
           //refreshEvent.fire();
           toastEvent.setParams({
                   "type":'success',
                   "message": "Persona successfully added."//response.getError()//
               });
               toastEvent.fire();


            }
            else if(response.getState()==='ERROR'){
                var errorMsg = response.getError()[0].message;
                console.log('errorMsg ::',errorMsg);
                if(errorMsg.includes("SOVEREIGN_RESPONSE:ERROR")){
                    console.log('error while adding persona ::', response.getError());
                    component.set("v.openSpinner",false);
                    component.set("v.newPersonaModal",false);
                    component.set("v.personaName",'');
                    component.find("addPersona")[1].set("v.value",'');
                    toastEvent.setParams({
                        "type":'error',
                        "message": "Something went wrong.Please contact your IT."//response.getError()//
                    });
                    toastEvent.fire();
                }
                else if(errorMsg.includes("SOVEREIGN_RESPONSE:SUCCESS")){
                    console.log('error while adding persona success::', response.getError());
                    component.set("v.openSpinner",false);
                    component.set("v.newPersonaModal",false);
                    component.set("v.personaName",'');
                    this.searchCustomerData(component,event,helper);
                    toastEvent.setParams({
                        "type":'success',
                        "message": "Persona successfully added"//response.getError()//
                    });
                    toastEventPartialError.setParams({
                        'type':'error',
                        'message':'Something went wrong in logging event. Contact your IT.'
                    })
                    toastEvent.fire();//firing success
                    toastEventPartialError.fire();//firing error
                }

            }
        });
        $A.enqueueAction(action);


    },
	setNamespaces: function(component,event,helper){
	   var action= component.get("c.getPersonaNameSpaces");
        action.setCallback(this,function(response){

            var jsonNameSpaces = response.getReturnValue();
            console.log('jsonNameSpaces ::',jsonNameSpaces);
            var parsedResponse = JSON.parse(jsonNameSpaces);
            console.log('nameSpaces array ::', parsedResponse[0]);
            var namaSpaceList =[];
            for(var i=0;i<parsedResponse.length;i++){
                namaSpaceList.push(parsedResponse[i].name);
            }
            var nameSpacesArray = Object.keys(namaSpaceList).map(function(key){
                var key1 = namaSpaceList[key].charAt(0).toUpperCase() + namaSpaceList[key].slice(1).toLowerCase(); //capitalize starting letter and remove caps of other letters
                var reasonLabelKey = key1.replace(/_/g, " "); //replacing underscores with spaces
                return {label: namaSpaceList[key], value: namaSpaceList[key]}
            });
            console.log('nameSpacesArray final ::',nameSpacesArray);
            component.set("v.personaNamespace",nameSpacesArray);
        });
        $A.enqueueAction(action);

    }
})
