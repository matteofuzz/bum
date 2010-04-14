// ==========================================================================
// Project:   Bum - mainPage
// Copyright: ©2010 My Company, Inc.
// ==========================================================================
/*globals Bum */

sc_require('views/title');

// This page describes the main user interface for your application.  
Bum.mainPage = SC.Page.design({

  // The main pane is made visible on screen as soon as your app is loaded.
  // Add childViews to this pane for views to display immediately on page 
  // load.
  mainPane: SC.MainPane.design({
    childViews: 'menuBar tabs'.w(),
    
		menuBar: SC.View.design({
      layout: { top: 0, left: 0, right: 0, height: 40 },
      classNames: ['menu-bar'],
      childViews: 'logo title textButton endTextButton venditeButton acquistiButton DropDownMenuView DropDownMenuView2 helpButton'.w(),

			logo: SC.LabelView.design({
				layout: { top: 0, left: 10 },
				classNames: ['sproutcore-logo']
			}),
			
			title: SC.LabelView.design({
				layout: { top: 0, left: 100, height: 40 },
    		escapeHTML: NO,
				classNames: ['title'],
				value: '<h1>Bum app (by F5lab)</h1>'
			}),
			
			textButton: SC.ButtonView.design(SCUI.DropDown, {
        layout: { centerY: 0, left: 300, height: 40, width: 100 },
				title: 'Un bottone',
        classNames: ['bar-button'],
        toolTip: 'text button with dropdown',
        target: 'Bum',
        action: 'bo?'
      }),

			endTextButton: SC.LabelView.design({
        layout: { centerY: 0, left: 401, height: 40, width: 0 },
        classNames: ['bar-button']
      }),

			venditeButton: SC.ButtonView.design({
				layout: { top: 10, left: 420, height: 30, width: 80 },
				title: 'vendite',
				isSelected: YES
			}),
			
			acquistiButton: SC.ButtonView.design({
				layout: { top: 10, left: 510, height: 30, width: 80 },
				title: 'acquisti'
			}),
			
			// SelectView as in http://groups.google.com/group/sproutcore/browse_thread/thread/6f175e9498dddd65/34bb5971e5f39cd0?hl=en&lnk=gst&q=selectfieldview#34bb5971e5f39cd0
			DropDownMenuView: SC.SelectView.design({
    		layout: { top: 10, height: 30, left: 600, width: 130 },
    		/* If you want a dynamic title on the button,
     		* specify an itemNameKey */
    		displayTitle: 'click me to select',
    		items: [ { title: 'first menu item', isEnabled: YES, checkbox: NO },
               { title: 'second menu item', isEnabled: YES, checkbox:	NO }],
    		/* what will be displayed in the menu. if left
     		* out, the item object itself will be used. */
    		itemTitleKey: 'title',
    		theme: 'square', // type of button
    		showCheckbox: NO
			}),
			
			DropDownMenuView2: SC.SelectFieldView.design({
    		layout: { top: 10, height: 25, left: 740, width: 130 },
    		/* If you want a dynamic title on the button,
     		* specify an itemNameKey */
    		displayTitle: 'click me to select',
    		objects: [ { title: 'first menu item', isEnabled: YES, checkbox: NO },
               { title: 'second menu item', isEnabled: YES, checkbox:	NO }],
    		/* what will be displayed in the menu. if left
     		* out, the item object itself will be used. */
    		nameKey: 'title',
    		theme: 'square', // type of button
    		showCheckbox: NO
			}), 
			
			helpButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, right: 55, height: 32, width: 32 },
        classNames: ['help-icon'],
        toolTip: 'help button',
        target: 'Bum',
        action: 'help'
      })
			
		}),

		tabs: SC.TabView.design({
			value: 'one',
			items: [
        { title: "One", value: "one" },
	      { title: "Two", value: "two" },
	      { title: "Three", value: "three" }
			],		
	    itemTitleKey: 'title',
	    itemValueKey: 'value',
     	layout: { left:12, right:12, top:52, bottom:12 },
     	userDefaultKey: "mainPane"
		})

  }),

	one: SC.View.design({
    classNames: 'tab',
    childViews: 'subOne subTwo'.w(),
    
    subOne: SC.LabelView.design(SCUI.ToolTip, {
    	layout: { top: 30, height: 100, left: 30, width: 400 },
    	escapeHTML: NO,
    	toolTip: "This is subOne view.",
    	value: "<h1>Bum Sproutcore test by F5lab</h1><p>First tab.</p><p><i>[subOne]</i></p>"
    }),
    
    subTwo: SC.WellView.design(SCUI.ToolTip, {
    	layout: { top: 200, height: 100, left: 30, width: 400 },
    	toolTip: "This is a WellView.",
	    contentView: SC.LabelView.design(SCUI.ToolTip, {
	    	escapeHTML: NO,
	    	value: "<h2>This is a WellView ContainerView</h2><p><i>[subTwo]</i></p>"
	    }),
    })

  }),

	two: SC.LabelView.design({
    escapeHTML: NO,
    classNames: 'tab',
    value: "<p>Second tab.</p>"
  }),

	three: SC.View.design({
    classNames: 'tab',
		childViews: 'titleView blogBodyView ratingBar'.w(),
		
    titleView: Bum.TitleView.design({
    	layout: { right: 30, top: 70, width: 400, height: 50 },
    	classNames: ['another-custom-class'],
    	name: 'Basic View API',
    	icon: 'tutorial'
    }),

		blogBodyView: SC.LabelView.design({
			escapeHTML: NO, // This means that if there is HTML in the value string do not escape it.
			layout: { right: 30, top: 130, width: 400, height: 400 },
			classNames: ['blog-body'],
			value: "This is the intro to an awsome blog post. <h2>New Header for cool stuff</h2> Keep posting some cool stuff"
		}),
				
    ratingBar: Bum.RatingBarView.design({
      layout: { right: 30, top: 540, width: 400, height: 32 },
      classNames: ['rating-bar']
    })
  })

});
