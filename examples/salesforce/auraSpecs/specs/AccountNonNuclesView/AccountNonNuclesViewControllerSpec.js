const vm = require('vm');
const fs = require('fs');
const path = require('path');
const rootPath = process.cwd();

const $A = jasmine.createSpyObj('$A', ['enqueueAction', 'getCallback', 'get']);
$A.util = jasmine.createSpyObj('$A.util', ['addClass', 'hasClass', 'toggleClass']);

const Util = jasmine.createSpyObj('Util', ['handleSuccess', 'handleErrors', 'repairDate']);

const target = 'AccountNonNuclesView/AccountNonNuclesViewController.js';

const AccountNonNuclesViewController = vm.runInNewContext(
    fs.readFileSync(path.join(rootPath, '', 'aura', 'tsm', target)), {$A, Util}
);

describe("AccountNonNuclesViewController", function() {
	let component, event, helper;
    beforeEach(function() {
        component = jasmine.createSpyObj('component', ['set', 'find', 'get', 'getElement']);
        event = jasmine.createSpyObj('event', ['getSource', 'getParam']);        
        helper = jasmine.createSpyObj('helper', ['fetchAccount', 'createAccount']);

        // syp component methods
        Object.assign(component, {
        	find: jasmine.createSpy('find').and.returnValue([{
                showHelpMessageIfInvalid: ()=> {},
                get: ()=> ({ valid: true })
            }]),
	        get: jasmine.createSpy('get').and.callFake((arg)=> {
	        	if(arg == 'v.data') {
	                return {};
	            }
	        }),
	        getEvent: jasmine.createSpy('getEvent').and.returnValue(component),
	        setParams: jasmine.createSpy('setParams').and.returnValue(component),
	        fire: jasmine.createSpy('fire').and.returnValue(component),
        });

        // syp event methods
        Object.assign(event, {
        	getParam : jasmine.createSpy('getParam').and.returnValue(0),
        });

        // syp helper methods
        Object.assign(helper, {});

        // spy $A methods
        Object.assign($A, {});
    });

    describe('doInit', function() {
        it('should call helper fetchAccount', function() {
            AccountNonNuclesViewController.doInit(component, event, helper);
            expect(helper.fetchAccount).toHaveBeenCalledWith(component);
        });
    });

    describe('openCreateModal', function() {
        it('should open modal', function() {
            AccountNonNuclesViewController.openCreateModal(component, event, helper);
            expect(component.set).toHaveBeenCalledWith("v.isOpenCreateModal", true);
        });
    });

    describe('handleCreateClick', function() {
        it('should open modal', function() {
            debugger;
            AccountNonNuclesViewController.handleCreateClick(component, event, helper);
            expect(helper.createAccount).toHaveBeenCalledWith(component);
        });
    });
 })