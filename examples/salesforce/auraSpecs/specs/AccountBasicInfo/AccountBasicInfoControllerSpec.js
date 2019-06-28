const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

var $A = { util: sinon.spy()};

const AccountBasicInfoController = require('../../../src/aura/AccountBasicInfo/AccountBasicInfoController.js');

describe('AccountBasicInfoController', function() {

    const helper = {
      searchCustomerData: sinon.spy(),
      accordianToggle: sinon.spy(),
      populateWWCEObjects: sinon.spy(),
      helperFun: sinon.spy(),
      saveCustomer: sinon.spy(),
      setNamespaces: sinon.spy(),
      optInSave : sinon.spy(),
      enableOrDisableSaveButton :sinon.spy(),
      getAgeRequirements: sinon.spy()
    };
    const component = {
      find: sinon.stub().returns({get: function() {return ''},set: function() {return ''}}),
      set: sinon.spy(),
      get: sinon.stub().returns({globalOptin: function() {return ''},thirdPartyOptin: function() {return ''}}),
      getElement: sinon.spy()
    };
    const event = {
      getSource: sinon.stub().returns({get: function() {return ''},set: function() {return ''}}),
      getParam:  sinon.spy()
    };

    describe('doInit', function() {
        it('will call the helper method searchCustomerData', function() {
            AccountBasicInfoController.doInit(component, event, helper);
            expect(helper.populateWWCEObjects).to.have.been.called;
            expect(helper.searchCustomerData).to.have.been.called;
            // Below was missing
            expect(helper.setNamespaces).to.have.been.called;
        });
    });

    describe('toggleAccordian', function() {
        it('will call the helper method accordianToggle', function() {
            AccountBasicInfoController.toggleAccordian(component, event, helper);
            expect(helper.accordianToggle).to.have.been.called;
        });
    });

    describe('toggleSocialEvent', function() {
        it('will toggle the social events', function() {
            AccountBasicInfoController.toggleSocialEvent(component, event, helper);
            expect(component.find).to.have.been.called;
            expect(global.$A.util.toggleClass).to.have.been.called;
        });
    });

    describe('toggleAction', function() {
        it('will toggle the social events', function() {
           AccountBasicInfoController.toggleAction(component, event, helper);
           expect(helper.optInSave).to.have.been.called;
        });
    });

    describe('openEditView', function() {
        it('will toggle between open and view of the dialog', function() {
            AccountBasicInfoController.openEditView(component, event, helper);
            expect(component.set).to.have.been.calledWith('v.isOpen',false);
            expect(component.set).to.have.been.calledWith('v.isEdit',true);
        });
    });

    describe('handleCountryChange', function() {
        it('will update the country model based on the combobox selection', function() {
            AccountBasicInfoController.handleCountryChange(component, event, helper);
            expect(component.get).to.have.been.called;
        });
    });

    describe('handleLanguageChange', function() {
        it('will update the language model based on the combobox selection', function() {
            AccountBasicInfoController.handleLanguageChange(component, event, helper);
            expect(component.get).to.have.been.called;
        });
    });

    describe('toggleProcessing', function() {
        it('will toggle the process data function poopover', function() {
            AccountBasicInfoController.toggleProcessing(component, event, helper);
            expect(component.find).to.have.been.called;
        });
    });

    describe('stopProcessing', function() {
        it('will stop toggle the process data function poopover', function() {
            AccountBasicInfoController.stopProcessing(component, event, helper);
            expect(component.find).to.have.been.called;
        });
    });
});
