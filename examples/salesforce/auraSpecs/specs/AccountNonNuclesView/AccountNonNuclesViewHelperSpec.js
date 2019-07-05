const vm = require('vm');
const fs = require('fs');
const path = require('path');
const rootPath = process.cwd();

const $A = jasmine.createSpyObj('$A', ['enqueueAction', 'getCallback', 'get']);
$A.util = jasmine.createSpyObj('$A.util', ['addClass', 'hasClass', 'toggleClass']);

const Util = jasmine.createSpyObj('Util', ['handleSuccess', 'handleErrors', 'repairDate']);

const target = 'AccountNonNuclesView/AccountNonNuclesViewHelper.js';

const AccountNonNuclesViewHelper = vm.runInNewContext(
    fs.readFileSync(path.join(rootPath, '', 'aura', 'tsm', target)), {$A, Util}
);

describe("AccountNonNuclesViewHelper", function() {
	let component, event, helper, action, response, responseState, responseData;
    beforeEach(function() {
        component = jasmine.createSpyObj('component', ['set', 'find', 'get', 'getElement']);
        event = jasmine.createSpyObj('event', ['getSource', 'getParam']);        
        helper = jasmine.createSpyObj('helper', ['']);
        action = jasmine.createSpyObj('action', ['setParams']);
        response = jasmine.createSpyObj('response', ['getState', 'getReturnValue']);

        // syp component methods
        Object.assign(component, {
        	find: jasmine.createSpy('find').and.returnValue({
	            get: ()=> {}
	        }),
	        get: jasmine.createSpy('get').and.callFake((arg)=> {
	        	if(arg == 'v.accountId') {
	                return "12345";
	            }else if(arg == 'v.caseId') {
                    return "56789";
                }else if(arg == 'v.newAccount') {
                    return { a: 10 };
                }else if(arg == 'c.getCaseAccountDetails' || arg == 'c.createSFAccount'){
                    return action;
                }
	        }),
	        getEvent: jasmine.createSpy('getEvent').and.returnValue(component),
	        setParams: jasmine.createSpy('setParams').and.returnValue(component),
	        fire: jasmine.createSpy('fire').and.returnValue(component),
            setCallback: jasmine.createSpy('setCallback').and.returnValue(component),
        });

        // syp event methods
        Object.assign(event, {
        	getParam : jasmine.createSpy('getParam').and.returnValue(0),
        });

        // syp helper methods
        Object.assign(helper, {});

        // syp action methods
        Object.assign(action, {
            setCallback: jasmine.createSpy('setCallback').and.callFake((arg, arg1)=> {
                if(typeof arg1 == 'function'){
                    arg1.call(AccountNonNuclesViewHelper, response);
                }
            })
        });

        Object.assign(response, {
            getState: ()=> responseState,
            getReturnValue: ()=> responseData
        });

        // spy $A methods
        Object.assign($A, {
            get: jasmine.createSpy('get').and.returnValue($A),
            fire: jasmine.createSpy('fire').and.returnValue($A)
        });
    });

    describe('fetchAccount', function() {
        it('should call correct apex method', function() {
            AccountNonNuclesViewHelper.fetchAccount(component);
            expect(component.get).toHaveBeenCalledWith('c.getCaseAccountDetails');
            expect(action.setParams).toHaveBeenCalledWith({ strAccountId: "12345", strCaseId: "56789" });
            expect(component.set).toHaveBeenCalledWith("v.isLoading", true);
        });

        it('should set options on success by hiding loading', function() {
            responseState = "SUCCESS";
            responseData = { accountDetail: 'a-c-d', caseDetail: 'c-d' }

            AccountNonNuclesViewHelper.fetchAccount(component);
            expect(component.set).toHaveBeenCalledWith("v.isLoading", false);
            expect(component.set).toHaveBeenCalledWith("v.accountDetail", 'a-c-d');
            expect(component.set).toHaveBeenCalledWith("v.caseDetail", 'c-d');
        });

        it('should set options on failure by hiding loading', function() {
            responseState = "FAILED";

            AccountNonNuclesViewHelper.fetchAccount(component);            
            expect(Util.handleErrors).toHaveBeenCalledWith(component, response);
        });
    });

    describe('createAccount', function() {
        it('should call correct apex method', function() {
            AccountNonNuclesViewHelper.createAccount(component);
            expect(component.get).toHaveBeenCalledWith('c.createSFAccount');
            expect(action.setParams).toHaveBeenCalledWith({
                strData: JSON.stringify({ a: 10 }),
                strCaseId: "56789"
            });
            expect(component.set).toHaveBeenCalledWith("v.isSaving", true);
        });

        it('should set options on success by hiding loading', function() {
            responseState = "SUCCESS";
            responseData = { }

            AccountNonNuclesViewHelper.createAccount(component);
            expect(component.set).toHaveBeenCalledWith("v.isSaving", false);
            expect(component.set).toHaveBeenCalledWith("v.isOpenCreateModal", false);
            expect(component.getEvent).toHaveBeenCalledWith("onSaveAccount");
        });

        it('should set options on failure by hiding loading', function() {
            responseState = "FAILED";

            AccountNonNuclesViewHelper.createAccount(component);            
            expect(Util.handleErrors).toHaveBeenCalledWith(component, response);
        });
    });
 })