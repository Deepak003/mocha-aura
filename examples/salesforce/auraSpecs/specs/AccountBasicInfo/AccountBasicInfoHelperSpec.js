const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
var assert = require('assert');
chai.use(sinonChai);

var AccountBasicInfoHelper = require('../../../src/aura/AccountBasicInfo/AccountBasicInfoHelper.js');

describe('AccountBasicInfoHelper', function() {

    const helper = {
      updateCustomerFlag: sinon.spy(),
      saveAccountData: sinon.spy(),
      populateWWCEObjects: sinon.spy(),
      showSpinner: sinon.spy(),
      hideSpinner: sinon.spy(),
      showSocialSpinner: sinon.spy(),
      hideSocialSpinner: sinon.spy()
    };
    const component = {
      find: sinon.stub(),
      set: sinon.stub(),
      get: sinon.stub(),
      getElement: sinon.stub()
    };
    const event = {
      getSource: sinon.stub(),
      getParam: sinon.stub()
    };
    global.$A= {
      get:sinon.spy(),
      enqueueAction:sinon.spy(),
      util: {toggleClass:sinon.spy()}
    };
    const action = {
      setCallback: sinon.spy(),
      setParams : sinon.spy()
    };
    const callback = sinon.spy();
    const currentModel = {
      id: sinon.spy(),
      email : sinon.spy()
    };
    const changeModel = {
      language: sinon.spy()
    };

    describe('accordianToggle', function() {
        beforeEach(function() {
            // Not Required
        });
        it('will open and close the accordian on click', function() {
            AccountBasicInfoHelper.accordianToggle(component, event);
            expect(component.find).to.have.been.calledWith('socialAccordian');
            expect(global.$A.util.toggleClass).to.have.been.called;
        });
    });

    describe('searchCustomerData', function() {
        beforeEach(function() {
          // Old Code
          //AccountBasicInfoHelper.searchCustomerData(component, event, helper);
        });
        it('should call the backend method searchCustomerData and set necessary variables', function() {
            component.get.withArgs('c.searchCustomerDataByAccountId').returns(action);
            component.get.withArgs('c.searchCustomerData').returns(action);
            AccountBasicInfoHelper.searchCustomerData(component, event, helper);
            expect(component.get).to.have.been.calledWith('c.searchCustomerData');
            expect(global.$A.get).to.have.been.calledWith('e.force:showToast');
            expect(component.get).to.have.been.calledWith('v.isAccountObject');
            //Old Test Case Code
            //expect((component.get).callCount()).toEqual(3);
            //expect(component.set.callCount()).toEqual(10);
        });
    });

    /*describe('saveCustomer', function() {
        beforeEach(function() {
            AccountBasicInfoHelper.saveCustomer(component, event, helper);
        });
        it('should call the backend method saveCustomer and set necessary variables', function(done) {
            expect(helper.updateCustomerFlag).toHaveBeenCalled();
            expect(helper.saveAccountData).toHaveBeenCalled();

        });
    });*/

    describe('saveAccountData', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.saveAccountData(component, event,helper, callback);
        });
        it('should call the backend method saveAccountData and set necessary variables', function() {
            component.get.withArgs('c.saveCustomer').returns(action);
            component.get.withArgs('v.accountDetailsModel').returns(changeModel);
            AccountBasicInfoHelper.saveAccountData(component, event,helper, callback);
            expect(helper.showSpinner).to.have.been.called;
            expect(global.$A.get).to.have.been.calledWith('e.force:showToast');
            //expect(helper.hideSpinner).to.have.been.called;
            //expect(helper.showSpinner).toHaveBeenCalled();
            //expect(helper.hideSpinner).toHaveBeenCalled();
            //expect(component.get.calls.count()).toEqual(11);
            //expect(component.set.calls.count()).toEqual(1);
        });
    });

    describe('updateCustomerFlag', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.updateCustomerFlag(component, event,helper, callback);
        });
        it('should call the backend method updateCustomerFlagData and set necessary variables', function() {
            component.get.withArgs('c.updateCustomerFlagData').returns(action);
            component.get.withArgs('v.accountDetailsModel').returns(changeModel);
            AccountBasicInfoHelper.updateCustomerFlag(component, event,helper, callback);
            expect(helper.showSpinner).to.have.been.called;
            expect(global.$A.get).to.have.been.calledWith('e.force:showToast');
            //expect(component.get.calls.count()).toEqual(4);
        });
    });

    describe('showSpinner', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.showSpinner(component, event);
        });
        it('should show the spinner', function() {
            AccountBasicInfoHelper.showSpinner(component, event);
            expect(component.set).to.have.been.called;
        });
    });

    describe('hideSpinner', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.hideSpinner(component, event);
        });
        it('should hode the spinner', function() {
            AccountBasicInfoHelper.hideSpinner(component, event);
            expect(component.set).to.have.been.called;
        });
    });

    describe('showSocialSpinner', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.showSocialSpinner(component, event);
        });
        it('should show social spinner', function() {
            AccountBasicInfoHelper.showSocialSpinner(component, event);
            expect(component.set).to.have.been.called;
        });
    });

    describe('hideSocialSpinner', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.hideSocialSpinner(component, event);
        });
        it('should hide social spinner', function() {
            AccountBasicInfoHelper.hideSocialSpinner(component, event);
            expect(component.set).to.have.been.called;
        });
    });

    describe('populateWWCEObjects', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.populateWWCEObjects(component, event, helper);
        });
        it('should populate WWCE Objects', function() {
            AccountBasicInfoHelper.populateWWCEObjects(component, event, helper);
            expect(component.set).to.have.been.called;
        });
    });

    describe('optInSave', function() {
        beforeEach(function() {
            //AccountBasicInfoHelper.optInSave(component, event, helper, globalOptin, thirdPartyOptin);
        });
        it('perform opt in save function', function() {
            const globalOptin = sinon.spy();
            const thirdPartyOptin = sinon.spy();
            component.get.withArgs('c.saveOptIn').returns(action);
            component.get.withArgs('v.accountDetailsModel').returns(currentModel);
            AccountBasicInfoHelper.optInSave(component, event, helper, globalOptin, thirdPartyOptin);
            expect(component.get).to.have.been.called;
            expect(helper.showSocialSpinner).to.have.been.called;
        });
    });

});
