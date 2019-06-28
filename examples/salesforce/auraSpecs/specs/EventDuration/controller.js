const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const ctl = require('../../../src/aura/EventDuration/EventDurationController');

describe('EventDuration', function() {
  describe('EventDurationController', function() {
    it('doInit should call buildTimezoneObj', function() {

      const helper = {
        buildTimezoneObj: sinon.spy()
      }
      const controller = {}

      ctl.doInit(controller, null, helper);
      expect(helper.buildTimezoneObj).to.have.been.calledWith(controller);
    });
  });

  describe('EventDurationController', function() {
    it('doRefresh should call refreshTimeFields', function() {

      const helper = {
        refreshTimeFields: sinon.spy()
      }
      const controller = {}

      ctl.doRefresh(controller, null, helper);
      expect(helper.refreshTimeFields).to.have.been.calledWith(controller);
    });
  });
});
