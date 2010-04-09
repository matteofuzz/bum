// ==========================================================================
// Project:   Bum.TitleView
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Bum */

/** @class

  (Document Your View Here)

  @extends SC.View
*/
Bum.TitleView = SC.View.extend(
/** @scope Bum.TitleView.prototype */ {

	name: '',
	icon: '',
	
	tagName: 'h1',
  classNames: ['title-view'],
  displayProperties: ['name', 'icon'],
  
  render: function(context, firstTime){
  	var name = this.get('name');
  	var icon = this.get('icon');
    var isFav = this.get('isFavorite');
  	
  	if(firstTime){
    	context = context.setClass('favorite', isFav);
  		context = context.begin('div').addClass('image %@-icon'.fmt(icon)).end();
  		context = context.begin('span').addClass('name').text(name).end();
  	}
		else {
			this.$('div.image').replaceWith('<div class="image %@-icon" />'.fmt(icon));
			this.$('span.name').text(name);
		}
  }

});
