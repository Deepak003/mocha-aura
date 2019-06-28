({
	  doInit : function(component, event , helper) {
		  helper.buildTimezoneObj(component);
	  },

		doRefresh : function(component, event , helper) {
			helper.refreshTimeFields(component);
	  }
})
