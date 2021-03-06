const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const helper = require('../../../src/aura/EventDuration/EventDurationHelper');

describe('EventDuration', function() {
  describe('EventDurationHelper', function() {
    it('buildTimezoneObj make apex controller call', function() {

      const component = {
        get: sinon.stub()
      }
      const action = {
        setCallback: sinon.spy(function(){;})
      }
      global.$A = { enqueueAction: sinon.spy()}
      component.get.withArgs('c.getEventTimezones').returns(action);

      helper.buildTimezoneObj(component);

      expect(component.get).to.have.been.calledWith('c.getEventTimezones');
      expect(action.setCallback).to.have.been.called;
      expect(global.$A.enqueueAction).to.have.been.calledWith(action);
    });
  });

  describe('EventDurationHelper', function() {
    it('refreshTimeFields make apex controller call', function() {

      const component = {
        get: sinon.stub().returns({startHour: function() {return ''},endHour: function() {return ''}}),
        set: sinon.spy()
      }
      component.get.withArgs('v.durationObj').returns('startHour');
      component.get.withArgs('v.durationObj').returns('endHour');
      helper.refreshTimeFields(component);

      expect(component.get).to.have.been.calledWith('v.durationObj');
      expect(component.set).to.have.been.called;
      //expect(action.setCallback).to.have.been.called;
      //expect(global.$A.enqueueAction).to.have.been.calledWith(action);
    });
  });

});
