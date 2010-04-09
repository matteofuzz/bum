// ==========================================================================
// Project:   Bum.RatingBarView
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Bum */

/** @class

  (Document Your View Here)

  @extends SC.View
*/
Bum.RatingBarView = SC.View.extend(
/** @scope Bum.RatingBarView.prototype */ {

	createChildViews: function(){
    var view, childViews = [];

    // The first view.  Using the Class and Full Parameter Method
    view = this.createChildView( SC.LabelView, {
      layout: {left: 10, top: 5, width: 200, height: 25},
      value: "Was this Post Helpful?"
    });
    childViews.push(view);

    // The Second View...using the Design Pattern method...only need to fill out the first parameter of the createChildView()
    view = this.createChildView( 
      SC.ButtonView.design({
        layout: {right: 90, top: 5, width: 80, height: 22},
        title: "Yes"
      })
    );
    childViews.push(view);

    // The Third View...
    view = this.createChildView( 
      SC.ButtonView.design({
        layout: {right: 5, top: 5, width: 80, height: 22},
        title: "No"
      })
    );
    childViews.push(view);

    this.set('childViews', childViews);
  }

});
; if ((typeof SC !== 'undefined') && SC && SC.scriptDidLoad) SC.scriptDidLoad('bum');