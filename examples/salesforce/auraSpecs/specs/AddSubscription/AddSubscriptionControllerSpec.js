const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const AddSubscriptionController = require('../../../src/aura/AddSubscription/AddSubscriptionController.js');

describe('AddSubscriptionController', function() {

    global.$A= {
      get: sinon.stub().returns({fire: function() {return ''}}),
      enqueueAction:sinon.spy(),
      util: {toggleClass:sinon.spy()},
      localizationService: {formatDateUTC: sinon.spy()}
    };

    const helper = {
        doInitHelper : sinon.spy(),
        fetchOriginSubscriptionTypesHelper : sinon.spy(),
        fetchCost: sinon.spy(),
        helperonConfirm : sinon.spy(),
        onChangeActionHelper : sinon.spy()
    };

    const component = {
        set: sinon.stub(),
        find: sinon.stub().returns({get: function() {return ''},set: function() {return ''}}),
        get : sinon.stub().returns({'v.billingAccount': function() {return ''},'v.billingAccList': function() {return ''}})
    };

    const event = {
        getSource: sinon.spy(),
        getParam:  sinon.spy()
    };

    describe('doInit',function(){
        it('Getter Methods Invocation',function(){
            AddSubscriptionController.doInit(component, event, helper);
            expect(component.set).to.have.been.called;
            expect($A.localizationService.formatDateUTC).to.have.been.called;
        });
    });

    describe('navigateBack', function() {
        it('Setter Methods Invocation', function() {
            AddSubscriptionController.navigateBack(component, event, helper);
      			expect(component.set).to.have.been.called;
      			expect(component.find).to.have.been.called;
        });
    });

    describe('navigateForward', function() {
        it('Setter Methods Invocation', function() {
            AddSubscriptionController.navigateForward(component, event, helper);
      			expect(component.set).to.have.been.calledWith('v.isFirstPage',false);
      			expect(component.set).to.have.been.calledWith('v.billingActionVal','');
      			expect(component.get).to.have.been.calledWith('v.membership');
            expect(helper.fetchCost).to.have.been.called;
        });

    });

    describe('onConfirm', function() {
        it('Helper Methods Invocation', function() {
            AddSubscriptionController.onConfirm(component, event, helper);
			      expect(helper.helperonConfirm).to.have.been.called;
        });
    });

	describe('closeModal', function() {
        it('Events Invocation', function() {
            AddSubscriptionController.closeModal(component, event, helper);
		      	expect($A.get).to.have.been.called;
        });
    });

	describe('onChangeAction', function() {
        it('Helper Methods Invocation', function() {
            AddSubscriptionController.onChangeAction(component, event, helper);
		      	expect(helper.onChangeActionHelper).to.have.been.called;
        });
    });

});
