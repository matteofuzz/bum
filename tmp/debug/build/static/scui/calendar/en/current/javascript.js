/* >>>>>>>>>> BEGIN source/core.js */
// ==========================================================================
// Project:   SCUI - Sproutcore UI Library
// Copyright: ©2009 Evin Grano and contributors.
//            Portions ©2009 Eloqua Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

// Importent for Calendar and Date
SCUI.PAST = 'past';
SCUI.PRESENT = 'present';
SCUI.TODAY = 'today';
SCUI.FUTURE = 'future';


/* >>>>>>>>>> BEGIN source/views/date.js */
// ==========================================================================
// SCUI.DateView
// ==========================================================================

sc_require('core');

/** @class

  This is the date view that creates the date block with the number and status of the date

  @extends SC.View
  @author Evin Grano
  @version 0.1
  @since 0.1
*/

SCUI.DateView = SC.View.extend( SCUI.SimpleButton, 
/** @scope SCUI.DateView.prototype */ {
  classNames: ['scui-date'],
  
  // Necessary Elements
  date: null,
  calendarView: null,
  timing: SCUI.PRESENT,
  content: null,
  isSelected: NO,
  
  init: function(){
    this.set('target', this);
    this.set('action', '_selectedDate');
    arguments.callee.base.apply(this,arguments);
  },
  
  // display properties that should automatically cause a refresh.
  displayProperties: ['date', 'isSelected', 'timing'],
  
  render: function(context, firstTime){
    //console.log('Render called');
    var date = this.get('date') || SC.DateTime.create();
    var timing = this.get('timing');
    var isSelected = this.get('isSelected');
   
    // First, Set the right timing classes
    context.setClass(SCUI.PAST, SCUI.PAST === timing); // addClass if YES, removeClass if NO
    context.setClass(SCUI.PRESENT, SCUI.PRESENT === timing); // addClass if YES, removeClass if NO
    context.setClass(SCUI.TODAY, SCUI.TODAY === timing); // addClass if YES, removeClass if NO
    context.setClass(SCUI.FUTURE, SCUI.FUTURE === timing); // addClass if YES, removeClass if NO
    context.setClass('sel', isSelected); // addClass if YES, removeClass if NO
    // Set the right date number
    context.begin('div').attr('class', 'date_number').push(date.get('day')).end();
  },
  
  _selectedDate: function(){
    var cv = this.get('calendarView');
    var date = this.get('date');
    if (cv) cv.set('selectedDate', date);
  }

}) ;


/* >>>>>>>>>> BEGIN source/views/calendar.js */
// ==========================================================================
// SCUI.CalendarView
// ==========================================================================

sc_require('core');
sc_require('views/date');

/** @class

  This is the calendar view that creates the calendar block with the dates

  @extends SC.View
  @author Evin Grano
  @version 0.1
  @since 0.1
*/

SCUI.CalendarView = SC.View.extend(
/** @scope SCUI.CalendarView.prototype */ {
  classNames: ['scui-calendar'],
  
  // Necessary Elements
  monthStartOn: null,
  content: null,
  titleKey: 'title',
  dateKey: 'date',
  dateSize: {width: 100, height: 100},
  dateBorderWidth: 0,
  headerHeight: null,
  weekdayHeight: 20,
  exampleDateView: SCUI.DateView,
  selectedDate: null,
  
  // Optional Parameters
  weekdayStrings: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monthStrings: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  
  _dateGrid: [],
  
  init: function(){
    var monthStartOn = this.get('monthStartOn') || SC.DateTime.create({day: 1});
    this.set('monthStartOn', monthStartOn);
    // Size stuff
    var dateSize = this.get('dateSize');
    var dateWidth = dateSize.width || 100;
    var dateHeight = dateSize.height || 100;
    var headerHeight = this.get('headerHeight') || dateHeight/4;
    if (headerHeight < 20) headerHeight = 20;
    this.set('dateSize', {width: dateWidth, height: dateHeight});
    this.set('headerHeight', headerHeight);
    this._dateGrid = []; 
    arguments.callee.base.apply(this,arguments);
  },
  
  awake: function(){
    this.resetToSelectedDate();
    arguments.callee.base.apply(this,arguments);
  },
  
  resetToSelectedDate: function(){
    var selectedDate = this.get('selectedDate');
    if (selectedDate) this.set('monthStartOn', selectedDate.adjust({day: 1}));
  },
  
  // display properties that should automatically cause a refresh.
  displayProperties: ['monthStartOn', 'selectedDate', 'titleKey', 'dateKey', 'content', 'content.[]'],
  
  render: function(context, firstTime){
    //console.log('Render called');
    var borderWidth = this.get('dateBorderWidth');
    var dateSize = this.get('dateSize');
    var trueWidth = (2*borderWidth)+dateSize.width;
    var trueHeight = (2*borderWidth)+dateSize.height;
    var headerHeight = this.get('headerHeight');
    var weekdayHeight = this.get('weekdayHeight');
    var totalWidth = trueWidth*7;
    var totalHeight = (trueHeight*6) + (headerHeight+weekdayHeight);
    var layout = this.get('layout');
    layout = SC.merge(layout, {width: totalWidth, height: totalHeight});
    this.set('layout', layout);
    // Date stuff
    var monthStartOn = this.get('monthStartOn');
    var weekdayStrings = this.get('weekdayStrings');
    var monthStrings = this.get('monthStrings');
    var currMonth = monthStartOn.get('month');
    var currYear = monthStartOn.get('year');
    if (firstTime){
      var headerStr = '<div class="month_header" style="position: absolute; left: %@1px; right: %@1px; height: %@2px;">%@3 %@4</div>';
      context.push( headerStr.fmt(trueWidth, headerHeight, monthStrings[currMonth-1].loc(), currYear) );
      // Construct the Date Strings
      var startLeft = 0;
      for( var i = 0; i < 7; i++){
        context.push(
          '<div class="weekday" style="position: absolute; left: %@1px; top: %@2px; width: %@3px; height: 20px;">%@4</div>'.fmt( 
            startLeft,
            headerHeight,
            dateSize.width,
            weekdayStrings[i].loc()
          )
        );
        startLeft += trueWidth;
      }
    }
    else {
      this.$('.month_header').text('%@ %@'.fmt( monthStrings[currMonth-1].loc(), currYear ));
    }
    this._updateDates();
    arguments.callee.base.apply(this,arguments);
  },
  
  /**
    Create the main childviews
  */
  createChildViews: function() {
    var childViews = [], view=null;
    
    var borderWidth = this.get('dateBorderWidth');
    var dateSize = this.get('dateSize');
    var trueWidth = (2*borderWidth)+dateSize.width;
    var trueHeight = (2*borderWidth)+dateSize.height;
    var headerHeight = this.get('headerHeight');
    
    // Create the Next And Previous Month Buttons
    view = this.createChildView( 
      SC.View.design( SCUI.SimpleButton, {
        classNames: ['scui-cal-button', 'previous-month-icon'],
        layout: {left: 5, top: 2, width: 16, height: 16},
        target: this,
        action: 'previousMonth'
      }),
      { rootElementPath: [0] }
    );
    childViews.push(view);
    
    // Next Month Button
    view = this.createChildView( 
      SC.View.design(SCUI.SimpleButton, {
        classNames: ['scui-cal-button', 'next-month-icon'],
        layout: {right: 5, top: 2, width: 16, height: 16},
        target: this,
        action: 'nextMonth'
      }),
      { rootElementPath: [1] }
    );
    childViews.push(view);
    
    // Now, loop and make the date grid
    var startLeft = borderWidth;
    var startTop = headerHeight + this.get('weekdayHeight');
    var exampleView = this.get('exampleDateView');
    for( var i = 0; i < 42; i++){
      view = this.createChildView( 
        exampleView.design({
          layout: {left: startLeft, top: startTop, width: dateSize.width, height: dateSize.height},
          timing: SCUI.PAST,
          calendarView: this,
          date: i
        }),
        { rootElementPath: [i+2] }
      );
      this._dateGrid.push(view);
      childViews.push(view);
      
      // Increment the position
      if (((i+1) % 7) === 0) {
        startTop += trueHeight;
        startLeft = borderWidth;
      }
      else {
        startLeft += trueWidth;
      }
    }
    this.set('childViews', childViews);
    return this;
  },
  
  nextMonth: function() {
    var monthStartOn = this.get('monthStartOn');
    var nextMonth = monthStartOn.advance({month: 1});
    this.set('monthStartOn', nextMonth);
    this.displayDidChange();
  },
  
  previousMonth: function() {
    var monthStartOn = this.get('monthStartOn');
    var prevMonth = monthStartOn.advance({month: -1});
    this.set('monthStartOn', prevMonth);
    this.displayDidChange();
  },
  
  _updateDates: function(){
    var monthStartOn = this.get('monthStartOn');
    var month = monthStartOn.get('month');
    var startDay = monthStartOn.get('dayOfWeek');
    var currDate = monthStartOn.advance({day: -startDay});
    var today = SC.DateTime.create();
    var selectedDate = this.get('selectedDate');
    var isSelected, timing;
    for (var gIdx = 0; gIdx < 42; gIdx++)
    {
      if (gIdx < startDay){
        this._dateGrid[gIdx].set('timing', SCUI.PAST);
      }
      else if(currDate.get('month') === month){
        
        // First Check to see if the Date is selected
        if (selectedDate) {
          isSelected = SC.DateTime.compareDate(currDate, selectedDate) === 0 ? YES : NO;
          this._dateGrid[gIdx].set('isSelected', isSelected);
        }
        
        // Check to see if the current date is to day
        // or in the present month
        timing = SC.DateTime.compareDate(currDate, today) === 0 ? SCUI.TODAY : SCUI.PRESENT;
        this._dateGrid[gIdx].set('timing', timing);
      }
      else {
        this._dateGrid[gIdx].set('timing', SCUI.FUTURE);
      }
      this._dateGrid[gIdx].set('date', currDate);
      currDate = currDate.advance({day: 1});
    } 
  }
});


/* >>>>>>>>>> BEGIN source/views/datepicker.js */
// ==========================================================================
// SCUI.DatePickerView
// ==========================================================================

sc_require('core');

/** @class

  This is the Date Chooser View that creates a text field, a button that launches a calendar chooser

  @extends SC.View
  @author Evin Grano
  @version 0.1
  @since 0.1
*/

SCUI.DatePickerView = SC.View.extend(  
/** @scope SCUI.DatePickerView.prototype */ {
  classNames: ['scui-datepicker-view'],
  
  // Necessary Elements
  date: null,
  dateString: "",
  isShowingCalendar: NO,
  // Params for the textfield
  hint: "",
  dateFormat: null,
  
  // @private
  _textfield: null,
  _date_button: null,
  _calendar_popup: null,
  _calendar: null,
  _layout: {width: 195, height: 25},
  
  // display properties that should automatically cause a refresh.
  displayProperties: ['date'],
  
  init: function(){
    arguments.callee.base.apply(this,arguments);
    
    // init the dateString to whatever date we're starting with (if present)
    this.set('dateString', this._genDateString(this.get('date')));
    
    // Setup default layout values
    var layout = this.get('layout');
    layout = SC.merge(this._layout, layout);
    this.set('layout', layout);
    
    // Create the reference to the calendar
    this._calendar_popup = SC.PickerPane.create({
      layout: {width: 195, height: 215},
      contentView: SC.View.design({
        childViews: 'calendar todayButton noneButton'.w(),
        calendar: SCUI.CalendarView.design({
          layout: { left: 10, top: 0},
          dateSize: {width: 25, height: 25},
          weekdayStrings: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          selectedDate: this.get('date') // init this so waking up the binding won't null out anything we had before
        }),
        todayButton: SC.View.extend(SCUI.SimpleButton, {
          classNames: ['scui-datepicker-today'],
          layout: {left: 10, bottom: 0, width: 50, height: 18},
          target: this,
          action: 'selectToday',
          render: function(context, firstTime) {
            if (firstTime) {
              context.push('Today');
            }
          }
        }),
        noneButton: SC.View.design( SCUI.SimpleButton, {
          classNames: ['scui-datepicker-none'],
          layout: {right: 10, bottom: 0, width: 50, height: 18},
          target: this,
          action: 'clearSelection',
          render: function(context, firstTime) {
            if (firstTime) {
              context.push('None');
            }
          }       
        })
      })
    });
    
    // Setup the Binding to the SelectedDate
    if (this._calendar_popup) {
      this.bind('date', '._calendar_popup.contentView.calendar.selectedDate');
      this.bind('isShowingCalendar', '._calendar_popup.isPaneAttached');
      this._calendar = this._calendar_popup.getPath('contentView.calendar');
    }
  },
  
  createChildViews: function(){
    var view, childViews = [];
    
    // First, Build the Textfield for the date chooser
    view = this._textfield = this.createChildView( 
      SC.TextFieldView.design( {
        layout: {left: 0, top: 0, right: 25, bottom: 0},
        classNames: ['scui-datechooser-text'],
        isEnabled: NO,
        valueBinding: '.parentView.dateString',
        hint: this.get('hint')
      })
    );
    childViews.push(view);
    
    // Now, set up the button to launch the Calendar Datepicker
    var that = this;
    view = this._date_button = this.createChildView( 
      SC.View.design( SCUI.SimpleButton, {
        classNames: ['scui-datechooser-button', 'calendar-icon'],
        layout: {right: 0, top: 3, width: 16, height: 16},
        target: this,
        action: 'toggle',
        isEnabledBinding: SC.binding('isEnabled', that)
      })
    );
    childViews.push(view);
    
    this.set('childViews', childViews);
    arguments.callee.base.apply(this,arguments);
  },
  
  /**  
    Hides the attached menu if present.  This is called automatically when
    the button gets toggled off.
  */
  hideCalendar: function() {
    if (this._calendar_popup) {
      this._calendar_popup.remove();
      this.set('isShowingCalendar', NO);
    }
  },

  /**
    Shows the menu.  This is called automatically when the button is toggled on.
  */
  showCalendar: function() {
    // Now show the menu
    if (this._calendar_popup) {
      this._calendar_popup.popup(this._textfield); // show the menu
      this._calendar.resetToSelectedDate();
      this.set('isShowingCalendar', YES);
    }
  },
  
  toggle: function(){
    if (this.isShowingCalendar){
      this.hideCalendar();
    }
    else{
      this.showCalendar();
    }
  },
  
  selectToday: function(){
    this._calendar.set('selectedDate', SC.DateTime.create());
  },
  
  clearSelection: function(){
    this._calendar.set('selectedDate', null);
  },
  
  /**
    Standard way to generate the date string
  */
  _genDateString: function(date) {
    var fmt = this.get('dateFormat') || '%a %m/%d/%Y';
    var dateString = date ? date.toFormattedString(fmt) : "";
    return dateString;
  },
  
  _dateDidChange: function(){
    this.set('dateString', this._genDateString(this.get('date')));
    this.hideCalendar();
  }.observes('date')

}) ;


/* >>>>>>>>>> BEGIN bundle_loaded.js */
; if ((typeof SC !== 'undefined') && SC && SC.bundleDidLoad) SC.bundleDidLoad('scui/calendar');
