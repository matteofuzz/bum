// ==========================================================================
// Project:   Bum.BarView
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Bum */

/** @class

  (Document Your View Here)

  @extends SC.View
*/
Bum.BarView = SC.View.extend(
/** @scope Bum.BarView.prototype */ {
	
	animal: 'wolf',
	color: 'yellow',
	
	displayProperties: ['animal', 'color'],
	
	render: function(context, firstTime){
  	var animal = this.get('animal');
  	var color = this.get('color');

		context = context.begin('div').addClass('bar-div').push(animal+' - '+color).end();
		
		sc_super();
	},
	
	createChildViews: function(){
    var view, childViews = [];

 	 // Using the Class and Full Parameter Method
	  view = this.createChildView( SC.LabelView, {
	    layout: {left: 10, top: 10, width: 200, height: 25},
	    value: "Rock&Roll!"
	  });
	  childViews.push(view);

		this.set('childViews', childViews);
	}
	
});
