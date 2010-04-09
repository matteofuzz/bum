/* >>>>>>>>>> BEGIN source/core.js */
// ==========================================================================
// SCUI Framework - Buildfile
// copyright (c) 2009 - Evin Grano, and contributors
// ==========================================================================

// ........................................
// BOOTSTRAP
// 
// The root namespace and some common utility methods are defined here. The
// rest of the methods go into the mixin defined below.

/**
  @namespace
  
  The SCUI namespace.  All SCUI methods and functions are defined
  inside of this namespace.  You generally should not add new properties to
  this namespace as it may be overwritten by future versions of SCUI.
  
  You can also use the shorthand "SCUI" instead of "Scui".
*/
var Scui = Scui || {};
var SCUI = SCUI || Scui ;

// Upload Constants
SCUI.READY = 'READY';
SCUI.BUSY  = 'BUSY';
SCUI.DONE  = 'DONE';

// Upload Constants
SCUI.READY = 'READY';
SCUI.BUSY  = 'BUSY';
SCUI.DONE  = 'DONE';

// ..........................................................
// Disclosed View Constants
// 
SCUI.DISCLOSED_STAND_ALONE    = 'standAlone';
SCUI.DISCLOSED_LIST_DEPENDENT = 'listDependent';
SCUI.DISCLOSED_OPEN = 'open';
SCUI.DISCLOSED_CLOSED = 'closed';
// ..........................................................
// State Constants
// 
SCUI.DEFAULT_TREE = 'default';


/* >>>>>>>>>> BEGIN source/controllers/searchable_array.js */
//============================================================================
// SCUI.SearchableArrayController
//============================================================================
sc_require('core');
/**

  This is an implementation of searchable for plain ArrayControllers
  *****This is a hybrid of the collection controller stack*****
  
  @extends SC.ArrayController
  @author Joshua Holt
  @author Evin Grano
  @version 0.5
  @since 0.5

*/

SCUI.SearchableArrayController = SC.ArrayController.extend(
  /* @scope SCUI.SearchableArrayController.prototype */{
  
  search: null,
  searchResults: [],
  searchKey: 'name',
  
  init: function(){
    arguments.callee.base.apply(this,arguments);
    this.set('searchResults', []);
    this._runSearch();
  },
  
  _searchOrContentDidChange: function(){
    this._runSearch();
  }.observes('search', 'content'),
  
 _sanitizeSearchString: function(str){
   var specials = [
       '/', '.', '*', '+', '?', '|',
       '(', ')', '[', ']', '{', '}', '\\'
   ];
   var s = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
   return str.replace(s, '\\$1');
 },
   
 _runSearch: function(){
    var searchResults  = [];
    var search = this.get('search');
    var searchKey = this.get('searchKey');
    var searchRegex = new RegExp(search,'i');
    var content = this.get('content');
  
    if(search === null || search === '' || search === undefined){ 
      this.set('searchResults', content);
    }
    else {
      search = this._sanitizeSearchString(search).toLowerCase();
      
      var curObj, searchField, searchTokens, token, tokenLen;
      for (var i=0, len = content.get('length'); i < len; i++) {
        curObj = content.objectAt(i);
        searchField = curObj.get(searchKey);
        if (!searchField) continue;
        if ( searchField.match(searchRegex) ){
          searchResults.push(curObj);
        }
      }
      this.set('searchResults',searchResults);
    }
 }
  
});


/* >>>>>>>>>> BEGIN source/controllers/searchable_tree.js */
// ==========================================================================
// SCUI.SearchableTreeController
// ==========================================================================

sc_require('core');

/** @class
  
  An tree controller that is searchable and creates a flat search results like
  OSX Finder and Windows Explorer
  
  @extends SC.TreeController
  @author Evin Grano
  @author Brandon Blatnick
  @version 0.5
  @since 0.5
*/

SCUI.SearchableTreeController = SC.TreeController.extend(
/** @scope SCUI.SearchableTreeController.prototype */ 
{
   search: null,
   searchResults: [],
   searchKey: 'name',
   iconKey: 'icon',
   nameKey: 'name',

   init: function(){
     arguments.callee.base.apply(this,arguments);
     this.set('searchResults', []);
     this._runSearch();
   },

   _searchDidChange: function(){
     this._runSearch();
   }.observes('search', 'content'),

  _sanitizeSearchString: function(str){
    var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
    ];
    var s = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return str.replace(s, '\\$1');
  },

  _runSearch: function(){
    var searchResults = [];
    var search = this.get('search');
    var c = this.get('content');
    if(search === null || search === '' || search === undefined){ 
      this.set('searchResults', c);
    }
    else {
      search = this._sanitizeSearchString(search).toLowerCase();
      var searchRegex = new RegExp(search,'i');
      var searchKey = this.get('searchKey');
      this._iconKey = this.get('iconKey');
      this._nameKey = this.get('nameKey');
      searchResults = this._runSearchOnItem(c, search, searchRegex, searchKey);
      
      // create the root search tree
      var searchedTree = SC.Object.create({
        treeItemIsExpanded: YES,
        treeItemChildren: searchResults
      });
      this.set('searchResults', searchedTree);
    }
  },
  
  /** 
    @private
    Returns a flat list of matches for the foldered tree item.
  */
  _runSearchOnItem: function(treeItem, search, searchRegex, searchKey) {
    var searchMatches = [], iconKey = this.get('iconKey'),
        searchedList, key, searchLen, 
        children, nameKey = this._nameKey, that;
    
    if (SC.none(treeItem)) return searchMatches;
    
    children = treeItem.get('treeItemChildren');
    if (!children) children = treeItem.get('children');
    that = this;
    children.forEach( function(child){      
      if (child.treeItemChildren) {
        var searchedList = that._runSearchOnItem(child, search, searchRegex, searchKey);
        searchedList.forEach( function(m){ searchMatches.push(m); });
      }
      
      if (searchKey && child.get(searchKey)) {
        key = child.get(searchKey).toLowerCase();
        if(key.match(searchRegex)){
          var match = SC.Object.create({});
          match[searchKey]  = child.get(searchKey);
          match[nameKey]    = child.get(nameKey);
          match.treeItem    = child;
          match.icon        = child.get(this._iconKey);
          searchMatches.push(match);
        } 
      }
    });

    return searchMatches;
  }
});


/* >>>>>>>>>> BEGIN source/mixins/cleanup.js */
// ========================================================================
// SCUI.Cleanup
// ========================================================================

sc_require('core');

/**

  This view mixin disconnects bindings upon becoming invisible, and reconnects
  them upon becoming visible again.  At the same time, it fires setup() and
  cleanup() hook methods in case you want to override them and do additional
  setup or cleanup.
  
  This mixin is especially useful for dynamically created views with custom
  bindings and observers, like some of the more complicated collection/list item views that
  are created and destroyed dynamically and come and go often.  This mixin helps
  keep outdated bindings from accumulating in views that are not immediately
  in use.  (Without this fix, the bindings do still fire).

  @Mixin
  @author Jonathan Lewis

*/

SCUI.Cleanup = {

  // PUBLIC PROPERTIES

  /**
    @read-only
    True on init and after cleanup() has been called.  False after setup() has been called.
    Setup is triggered by the view becoming visible, cleanup is triggered by its becoming invisible.
  */
  isClean: YES,

  log: NO,

  // PUBLIC METHODS

  /**
    @public
    Override for custom setup.  Called when the view becomes visible.
  */
  setup: function() {
    if (this.log) console.log('%@.setup()'.fmt(this));
  },

  /**
    @public
    Override for custom cleanup.  Called when the view becomes invisible.
  */
  cleanup: function() {
    if (this.log) console.log('%@.cleanup()'.fmt(this));
  },
  
  destroyMixin: function() {
    this._c_cleanupIfNeeded();
    this._c_bindings = null; // destroy our bindings cache
  },
  
  // PRIVATE METHODS

  _c_isVisibleInWindowDidChange: function() {
    if (this.get('isVisibleInWindow')) {
      this._c_setupIfNeeded();
    }
    else {
      this._c_cleanupIfNeeded();
    }
  }.observes('isVisibleInWindow'),

  _c_setupIfNeeded: function() {
    if (this.get('isClean') && this.get('isVisibleInWindow')) { // make sure we only enter once
      this.setup();
      //this._c_connectBindings();
      this.set('isClean', NO);
    }
  },
  
  _c_cleanupIfNeeded: function() {
    if (!this.get('isClean') && !this.get('isVisibleInWindow')) { // make sure we only enter once
      //this._c_disconnectBindings();
      this.cleanup();
      this.set('isClean', YES);
    }
  },
  
  _c_disconnectBindings: function() {
    var bindings = this.get('bindings') || [];
    var len = bindings.get('length');
    var binding;

    for (var i = 0; i < len; i++) {
      binding = bindings.objectAt(i);
      binding.disconnect();
      if (this.log) console.log('### disconnecting %@'.fmt(binding));
    }

    this._c_bindings = bindings.slice();
    this.set('bindings', []);
  },
  
  _c_connectBindings: function() {
    var bindings = this._c_bindings || [];
    var len = bindings.get('length');
    var binding;
    
    for (var i = 0; i < len; i++) {
      binding = bindings.objectAt(i);
      binding.connect();
      if (this.log) console.log('### connecting %@'.fmt(binding));
    }

    this._c_bindings = null;
  },
  
  // PRIVATE PROPERTIES
  
  _c_bindings: null
  
};


/* >>>>>>>>>> BEGIN source/mixins/drop_down.js */
// ==========================================================================
// SCUI.DropDown
// ==========================================================================

sc_require('core');

/** @mixin
  This mixin allows a toggling view to show/hide a drop-down when the view
  is toggled.  The user should set the 'dropDown' property to a SC.PickerPane or descendant
  class.  When the view is toggled on, an instance of the dropDown will be
  created and shown.
  
  NOTE: This mixin must be used in conjunction with the SCUI.SimpleButton mixin or
        on a SC.ButtonView or descendant.  It needs the target and action properties to work.

  @author Jonathan Lewis
  @author Brandon Blatnick

*/

SCUI.DropDown = {  
  
  isShowingDropDown: NO,
  
  /**
    @private
    Reference to the drop down instance that gets created in init().
  */
  _dropDownPane: null,
  
  dropDown: SC.MenuPane.design({ /* an example menu */
    layout: { width: 100, height: 0 },
    contentView: SC.View.design({}),
    items: ["_item".loc('1'), "_item".loc('2')] // Changed to an array for Localization purposes.
  }),
  
  dropDownType: SC.PICKER_MENU,
  
  initMixin: function() {
    // Try to create a new menu instance
    var dropDown = this.get('dropDown');
    if (dropDown && SC.typeOf(dropDown) === SC.T_CLASS) {
      this._dropDownPane = dropDown.create();
      if (this._dropDownPane) {
        this.bind('isShowingDropDown', '._dropDownPane.isPaneAttached');
      }
    }

    // TODO: [BB] Check for existance of target and action
    if (this.target !== undefined && this.action !== undefined) {
      this.set('target', this);
      this.set('action', 'toggle');
    }  
  },
  
  /**  
    Hides the attached drop down if present.  This is called automatically when
    the button gets toggled off.
  */
  hideDropDown: function() {
    if (this._dropDownPane && SC.typeOf(this._dropDownPane.remove) === SC.T_FUNCTION) {
      this._dropDownPane.remove();
      this.set('isShowingDropDown', NO);
    }
  },

  /**
    Shows the menu.  This is called automatically when the button is toggled on.
  */
  showDropDown: function() {
    // If a menu already exists, get rid of it
    this.hideDropDown();

    // Now show the menu
    if (this._dropDownPane && SC.typeOf(this._dropDownPane.popup) === SC.T_FUNCTION) {
      var dropDownType = this.get('dropDownType');
      this._dropDownPane.popup(this, dropDownType); // show the drop down
      this.set('isShowingDropDown', YES);
    }
  },
  
  /**
    Toggles the menu on/off accordingly
  */
  toggle: function() {
    if (this.get('isShowingDropDown')){
      this.hideDropDown();
    }
    else {
      this.showDropDown();
    }
  }
};


/* >>>>>>>>>> BEGIN source/mixins/dynamic_collections/collection_view_dynamic_delegate.js */
// ==========================================================================
// SCUI.CollectionViewDynamicDelegate
// ==========================================================================

sc_require('core');

/** @mixin
  
  TODO: [EG] Add Documentation
  
  NOTE: This mixin must be used in conjunction with the SC.CollectionRowDelegate, SCUI.DynamicListItem mixin on the 
        list item views and SCUI.DynamicCollection on the view.

  @author Evin Grano
*/

SCUI.CollectionViewDynamicDelegate = {
  
  isCollectionViewDynamicDelegate: YES,
  
  /**
    This method returns an exampleView class for the passed content
    
    
    @param {SC.CollectionView} view the collection view
    @param {SC.Object} the content for this view
    @returns {SC.View} Instance of the view you'd like to use
  */
  collectionViewContentExampleViewFor: function(view, content, contentIndex) {
    return null ;
  },
  
  /**
    ControllerForContentIndex should accept the index [Number]
    of an item in a recordArray. It should then determine what type of 
    Object controller it should create for the contentItem and return it.
    
    @param content [Object]
    @returns controller [SC.ObjectContrller]
  */
  controllerForContent: function(content){
    return null;
  },
  
  customRowViewMetadata: null,
  
  contentViewMetadataForContentIndex: function(view, contentIndex){
    //console.log('CollectionViewDynamicDelegate(%@): contentViewMetadataForContentIndex for (%@)'.fmt(this, contentIndex));
    var data = null;
    if (view && view.get('isDynamicCollection')){
      var metadata = view.get('customRowViewMetadata');
      if (!SC.none(metadata)) {
        data = metadata.objectAt(contentIndex);
      }
    }
    return data;
  },
  
  contentViewDidChangeForContentIndex: function(view, contentView, content, contentIndex){
    //console.log('CollectionViewDynamicDelegate(%@): contentViewDidChangeForContentIndex for (%@)'.fmt(this, contentIndex));
    // Add it to the customRowHeightIndexes
    if (view && view.isDynamicCollection && contentView && contentView.isDynamicListItem){
      this.collectionViewSetMetadataForContentIndex(view, contentView.get('viewMetadata'), contentIndex);
    }
  },
  
  collectionViewInsertMetadataForContentIndex: function(view, newData, contentIndex){
    var metadata = view.get('customRowViewMetadata');
    if (SC.none(metadata)) return;
    
    var len = metadata.get('length');
    console.log('Before Insert Length: %@'.fmt(len) );
    if (len < 1) metadata = [newData];
    else metadata.replace(contentIndex, 0, [newData]);
    console.log('After Insert Length: %@'.fmt(metadata.length) );
    view.set('customRowViewMetadata', metadata);
    view.rowHeightDidChangeForIndexes(contentIndex);
  },
  
  collectionViewSetMetadataForContentIndex: function(view, newData, contentIndex){
    console.log('\nCollectionViewDynamicDelegate(%@): collectionViewSetMetadataForContentIndex for (%@)'.fmt(this, contentIndex));
    if (view && view.get('isDynamicCollection')){
      var indexes = view.get('customRowHeightIndexes');
      if (SC.none(indexes)) indexes = SC.IndexSet.create();
      indexes.add(contentIndex, 1);
      view.set('customRowHeightIndexes', indexes);
      
      var metadata = view.get('customRowViewMetadata');
      if (SC.none(metadata)) metadata = SC.SparseArray.create();
      metadata.replace(contentIndex, 1, [newData]);
      view.set('customRowViewMetadata', metadata);
      view.rowHeightDidChangeForIndexes(contentIndex);
    }
        
    return newData;
  }
  
};


/* >>>>>>>>>> BEGIN source/mixins/dynamic_collections/dynamic_collection.js */
// ==========================================================================
// SCUI.DropDown
// ==========================================================================

sc_require('core');

/** 
  @mixin:
  
  TODO: [EG] Add Documentation...
  
  NOTE: This mixin must be used in conjunction with the SCUI.DynamicListItem mixin on the 
        list item views and SCUI.CollectionViewDynamicDelegate on the delegate.

  @author Evin Grano
*/

SCUI.DynamicCollection = {
  
  isDynamicCollection: YES,
  
  customRowViewMetadata: null,
  
  initMixin: function() {
    this.set('customRowViewMetadata', SC.SparseArray.create());
    this.set('rowDelegate', this);
  },
  
  /**
    @property
  */
  rowMargin: 0, 
  
  /**
    Returns the item view for the content object at the specified index. Call
    this method instead of accessing child views directly whenever you need 
    to get the view associated with a content index.

    Although this method take two parameters, you should almost always call
    it with just the content index.  The other two parameters are used 
    internally by the CollectionView.

    If you need to change the way the collection view manages item views
    you can override this method as well.  If you just want to change the
    default options used when creating item views, override createItemView()
    instead.

    Note that if you override this method, then be sure to implement this 
    method so that it uses a cache to return the same item view for a given
    index unless "force" is YES.  In that case, generate a new item view and
    replace the old item view in your cache with the new item view.

    @param {Number} idx the content index
    @param {Boolean} rebuild internal use only
    @returns {SC.View} instantiated view
  */
  itemViewForContentIndex: function(idx, rebuild) {
    // return from cache if possible
    var content   = this.get('content'),
        itemViews = this._sc_itemViews,
        item = content.objectAt(idx),
        contentDel  = this.get('contentDelegate'),
        del = this.get('delegate'),
        groupIndexes = contentDel.contentGroupIndexes(this, content),
        isGroupView = NO,
        key, ret, E, layout, layerId, rootController;

    // use cache if available
    if (!itemViews) itemViews = this._sc_itemViews = [] ;
    if (!rebuild && (ret = itemViews[idx])) return ret ; 

    // otherwise generate...

    // first, determine the class to use
    isGroupView = groupIndexes && groupIndexes.contains(idx);
    if (isGroupView) isGroupView = contentDel.contentIndexIsGroup(this, item, idx);
    if (isGroupView) {
      key  = this.get('contentGroupExampleViewKey');
      if (key && item) E = item.get(key);
      if (!E) E = this.get('groupExampleView') || this.get('exampleView');

    } else {
      E = this.invokeDelegateMethod(del, 'collectionViewContentExampleViewFor', this, item, idx);
      //try the exampleViewKey
      if(!E){
        key  = this.get('contentExampleViewKey');
        if (key && item) E = item.get(key);
      }
      //use the standard example view
      if (!E) E = this.get('exampleView');
    }
    // collect some other state
    var attrs = this._TMP_ATTRS;
    attrs.contentIndex = idx;
    attrs.content      = item ;
    attrs.owner        = attrs.displayDelegate = this;
    attrs.parentView   = this.get('containerView') || this ;
    attrs.page         = this.page ;
    attrs.layerId      = this.layerIdFor(idx, item);
    attrs.isEnabled    = contentDel.contentIndexIsEnabled(this, item, idx);
    attrs.isSelected   = contentDel.contentIndexIsSelected(this, item, idx);
    attrs.outlineLevel = contentDel.contentIndexOutlineLevel(this, item, idx);
    attrs.disclosureState = contentDel.contentIndexDisclosureState(this, item, idx); // TODO: [EG] Verify that this is still necessary...
    attrs.isGroupView  = isGroupView;
    attrs.isVisibleInWindow = this.isVisibleInWindow;
    if (isGroupView) attrs.classNames = this._GROUP_COLLECTION_CLASS_NAMES;
    else attrs.classNames = this._COLLECTION_CLASS_NAMES;
    
    // generate the customRowHeightIndexes for this view
    layout = this.layoutForContentIndex(idx);
    if (layout) {
      attrs.layout = layout;
    } else {
      delete attrs.layout ;
    }
    
    /** 
      This uses the controllerForContent method in CollectionViewExtDelegate
      below. It will add a rootController property to your itemView if you
      have implemented the controllerForContent method in your controller.
      Otherwise this property will not show up on your view.
    */
    
    /* 
      [JH2] I changed this method invocation to a direct call instead of a 
      call through the invokeDelegateMethod because it was always returning 
      null
    */
    rootController = del.controllerForContent(item);
    if (rootController) {
      attrs.rootController = rootController;
    }else{
      delete attrs.rootController;
    }
    
    /**
      Add the Dynamic delegate if the Example view is A DynamicListItem
    */
    attrs.dynamicDelegate = del;
    var viewMetadata = this.invokeDelegateMethod(del, 'contentViewMetadataForContentIndex', this, idx);
    if (viewMetadata) {
      attrs.viewMetadata = viewMetadata;
    } else {
      delete attrs.viewMetadata ;
    } 

    ret = this.createItemView(E, idx, attrs);
    if (!viewMetadata) {
      viewMetadata = this.invokeDelegateMethod(del, 'collectionViewSetMetadataForContentIndex', this, ret.get('viewMetadata'), idx);
      //console.log('Store Metadata for (%@): with height: %@'.fmt(idx, viewMetadata.height));
    }
    itemViews[idx] = ret ;
    
    return ret ;
  },
  
  /**
  
    Computes the layout for a specific content index by combining the current
    row heights.
  
  */
  layoutForContentIndex: function(contentIndex) {
    var margin = this.get('rowMargin');
    return {
      top:    this.rowOffsetForContentIndex(contentIndex),
      height: this.rowHeightForContentIndex(contentIndex),
      left:   margin, 
      right:  margin
    };
  },
  
  /**
    Called for each index in the customRowHeightIndexes set to get the 
    actual row height for the index.  This method should return the default
    rowHeight if you don't want the row to have a custom height.
    
    The default implementation just returns the default rowHeight.
    
    @param {SC.CollectionView} view the calling view
    @param {Object} content the content array
    @param {Number} contentIndex the index 
    @returns {Number} row height
  */
  contentIndexRowHeight: function(view, content, contentIndex) {
    //console.log('DynamicCollection(%@): contentIndexRowHeight for (%@)'.fmt(this, contentIndex));
    var height = this.get('rowHeight');
    if (view && view.get('isDynamicCollection')){
      var metadata = view.get('customRowViewMetadata');
      if (!SC.none(metadata)) {
        var currData = metadata.objectAt(contentIndex);
        if (currData && currData.height) height = currData.height;
      }
    }
    //console.log('Returning Height: %@'.fmt(height));
    return height;
  }
};


/* >>>>>>>>>> BEGIN source/mixins/dynamic_collections/dynamic_list_item.js */
// ==========================================================================
// SCUI.DynamicListItem
// ==========================================================================

sc_require('core');

/** @mixin
  This mixin allows for dynamic root controllers and dynamic root heights
  
  This mixin must be used in conjunction with the SCUI.DynamicCollection mixin on the 
        collection view and SCUI.CollectionViewDynamicDelegate on the delegate.

  @author Evin Grano
*/

SCUI.DynamicListItem = {
  
  /** walk like a duck */
  isDynamicListItem: YES,
  
  /**
    @property: {SC.Object} The dynamic delegate that is called to do adjustments
  */
  dynamicDelegate: null,
  
  /**
    @property {SC.ObjectController | SC.ArrayController}
  */
  rootController: null,
  
  /**
    @property {Object}
  */
  viewMetadata: null,
  
  viewMetadataHasChanged: function(){
    //console.log('\n\nDynamicListItem: viewMetadataHasChanged...');
    var del = this.get('dynamicDelegate');
    this.invokeDelegateMethod(del, 'contentViewDidChangeForContentIndex', this.owner, this, this.get('content'), this.contentIndex);
  }
};


/* >>>>>>>>>> BEGIN source/mixins/mobility.js */
// ==========================================================================
// SCUI.Mobility
// ==========================================================================

/** @class
  
  Mixin to allow for object movement...
  
  @author Evin Grano
  @version 0.1
  @since 0.1
*/
SCUI.Mobility = {
/* Mobility Mixin */
  viewThatMoves: null,
  
  mouseDown: function(evt) {
    var v, i; 
    // save mouseDown information...
    v = this.get('viewThatMoves') || this;
    if (!v) return YES; // nothing to do...
    
    i = SC.clone(v.get('layout'));
    i.pageX = evt.pageX; i.pageY = evt.pageY ;
    this._mouseDownInfo = i;
    return YES ;
  },
  
  _adjustViewLayoutOnDrag: function(view, curZone, altZone, delta, i, headKey, tailKey, centerKey, sizeKey) {
    // collect some useful values...
    var head = i[headKey], tail = i[tailKey], center = i[centerKey], size = i[sizeKey];
    
    //this block determines what layout coordinates you have (top, left, centerX, centerY, right, bottom)
    //and adjust the view depented on the delta
    if (!SC.none(size)) {
      if (!SC.none(head)) {
        view.adjust(headKey, head + delta);
      } else if (!SC.none(tail)) {
        view.adjust(tailKey, tail - delta) ;
      } else if (!SC.none(center)) {
        view.adjust(centerKey, center + delta);
      }
    }
  },
  
  mouseDragged: function(evt) {
    // adjust the layout...
    var i = this._mouseDownInfo ;
    if(i){
      var deltaX = evt.pageX - i.pageX, deltaY = evt.pageY - i.pageY;
      var view = this.get('viewThatMoves') || this;
    
      this._adjustViewLayoutOnDrag(view, i.zoneX, i.zoneY, deltaX, i, 'left', 'right', 'centerX', 'width') ;
      this._adjustViewLayoutOnDrag(view, i.zoneY, i.zoneX, deltaY, i, 'top', 'bottom', 'centerY', 'height') ;
      return YES ;
    }
    return NO;
  }
};


/* >>>>>>>>>> BEGIN source/mixins/permissible.js */
/*globals SCUI */

/** 

  A mixin to render unauthorized items differently (e.g., change background color or draw a lock icon).
  This is used to differentiate items that are disabled owing to permission issues).
  
  A user of this mixin must set the binding to the 'isPermitted' property.
  When 'isPermitted' is false, the class 'unauthorized' is added.
  
	@author Suvajit Gupta
*/
SCUI.Permissible = {
  
  isPermitted: null,
  isPermittedBindingDefault: SC.Binding.oneWay().bool(),

  displayProperties: ['isPermitted', 'tooltipSuffix'],
  
  /**
    @optional
    What to append to the tooltip when unauthorized
  */
  tooltipSuffix: " (unauthorized)".loc(),
  
  _isPermittedDidChange: function() {
    if(this.get('isPermitted')) {
      if(!SC.none(this._tooltip)) this.setIfChanged('toolTip', this._tooltip);
    }
    else {
      this._tooltip = this.get('toolTip');
      this.set('toolTip', this._tooltip + this.get('tooltipSuffix'));
    }
  }.observes('isPermitted'),

  renderMixin: function(context, firstTime) {
    context.setClass('unauthorized', !this.get('isPermitted'));
  }
  
};


/* >>>>>>>>>> BEGIN source/mixins/recurrent.js */
// ==========================================================================
// SCUI.Recurrent
// ==========================================================================

/**
  @namespace
  
  Implements a SC.Timer pool for complex validation and function invokation
  
  @author: Evin Grano
  @version: 0.5
  @since: 0.5
*/
SCUI.RECUR_ONCE = 'once';
SCUI.RECUR_REPEAT = 'repeat';
SCUI.RECUR_SCHEDULE = 'schedule';
SCUI.RECUR_ALWAYS = 'always';

SCUI.Recurrent = {
  
  isRecurrent: YES,
  
  _timer_pool: {},
  _guid_for_timer: 1,
  
  /*
    Register a single fire of function with: fireOnce(methodName, interval, *validateMethodName, *args)
    
    @param methodName,
    @param interval (in msec),
    @param validateMethodName (*optional, but must be set if using args),
    @param args (*optional)
    @return name to cancel
  */
  fireOnce: function(methodName, interval, validateMethodName){
    if (interval === undefined) interval = 1 ;
    var f = methodName, valFunc = validateMethodName, args, func;
    
    // Check to see if there is a validating function
    if (!validateMethodName) valFunc = function(){ return YES; };
    if (SC.typeOf(validateMethodName) === SC.T_STRING) valFunc = this[validateMethodName];
    
    // name 
    var timerName = this._name_builder(SCUI.RECUR_ONCE, methodName);
    
    // if extra arguments were passed - build a function binding.
    if (arguments.length > 3) {
      args = SC.$A(arguments).slice(3);
      if (SC.typeOf(f) === SC.T_STRING) f = this[methodName] ;
      func = f ;
      f = function() {
        delete this._timer_pool[timerName];
        if (valFunc.call(this)) return func.apply(this, args); 
      } ;
    }

    // schedule the timer
    var timer = SC.Timer.schedule({ target: this, action: f, interval: interval });
    
    this._timer_pool[timerName] = timer;
    return timerName;
  },
  
  _name_builder: function(type, method){
    var name ="%@_%@_%@".fmt(type, method, this._guid_for_timer);
    this._guid_for_timer += 1;
    return name;
  }
  
};
/* >>>>>>>>>> BEGIN source/mixins/resizable.js */
// ==========================================================================
// SCUI.Resizable
// ==========================================================================

/** @class
  
  Mixin to allow for object movement...
  
  @author Evin Grano
  @version 0.1
  @since 0.1
*/
SCUI.Resizable = {
/* Resizable Mixin */
  viewToResize: null,
  verticalMove: YES,
  horizontalMove: YES,
  
  mouseDown: function(evt) {
    var v, i = {};
    // save mouseDown information...
    v = this.get('viewToResize') || this.get('parentView');
    if (!v) return YES; // nothing to do...
    i.resizeView = v;
    var frame = v.get('frame');
    i.width = frame.width;
    i.height = frame.height;
    i.top = frame.y;
    i.left = frame.x;
    //save mouse down
    i.pageX = evt.pageX; i.pageY = evt.pageY;
    this._mouseDownInfo = i;
    return YES ;
  },

  mouseDragged: function(evt) {
    var i = this._mouseDownInfo ;
    if (!i) return YES;
    
    var deltaX = evt.pageX - i.pageX, deltaY = evt.pageY - i.pageY;
    var view = i.resizeView;
    
    //adjust width
    var hMove = this.get('horizontalMove');
    if (hMove){
      view.adjust('width', i.width + deltaX); //you might want to set minimum width
    }
    //adjust height
    var vMove = this.get('verticalMove');
    if (vMove){
      view.adjust('height', i.height + deltaY); //you might want to set minimum height
    }
    // reset top for centerX coords
    view.adjust('top', i.top); 
    // reset left for centerY coords
    view.adjust('left', i.left);
    return YES ;
  }
};


/* >>>>>>>>>> BEGIN source/mixins/simple_button.js */
// ==========================================================================
// SCUI.SimpleButton
// ==========================================================================
/*jslint evil: true */
sc_require('core');

/** @class
  
  Mixin to allow for simple button actions...
  
  @author Evin Grano
  @version 0.1
  @since 0.1
*/
SCUI.SimpleButton = {
/* SimpleButton Mixin */
  target: null,
  action: null,
  hasState: NO,
  hasHover: NO,
  inState: NO,
  _hover: NO,
  stateClass: 'state',
  hoverClass: 'hover',
  activeClass: 'active', // Used to show the button as being active (pressed)
  
  _isMouseDown: NO, 
  
  displayProperties: ['inState'],

  /** @private 
    On mouse down, set active only if enabled.
  */    
  mouseDown: function(evt) {
    //console.log('SimpleButton#mouseDown()...');
    if (!this.get('isEnabledInPane')) return YES ; // handled event, but do nothing
    //this.set('isActive', YES);
    this._isMouseDown = YES;
    this.displayDidChange();
    return YES ;
  },

  /** @private
    Remove the active class on mouseOut if mouse is down.
  */  
  mouseExited: function(evt) {
    //console.log('SimpleButton#mouseExited()...');
    if ( this.get('hasHover') ){ 
      this._hover = NO; 
      this.displayDidChange();
    }
    //if (this._isMouseDown) this.set('isActive', NO);
    return YES;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state again.
  */  
  mouseEntered: function(evt) {
    //console.log('SimpleButton#mouseEntered()...');
    if ( this.get('hasHover') ){ 
      this._hover = YES; 
      this.displayDidChange();
    }
    //this.set('isActive', this._isMouseDown);
    return YES;
  },

  /** @private
    ON mouse up, trigger the action only if we are enabled and the mouse was released inside of the view.
  */  
  mouseUp: function(evt) {
    if (!this.get('isEnabledInPane')) return YES;
    //console.log('SimpleButton#mouseUp()...');
    //if (this._isMouseDown) this.set('isActive', NO); // track independently in case isEnabled has changed
    this._isMouseDown = false;
    // Trigger the action
    var target = this.get('target') || null;
    var action = this.get('action');    
    // Support inline functions
    if (this._hasLegacyActionHandler()) {
      // old school... 
      this._triggerLegacyActionHandler(evt);
    } else {
      // newer action method + optional target syntax...
      this.getPath('pane.rootResponder').sendAction(action, target, this, this.get('pane'));
    }
    if (this.get('hasState')) {
      this.set('inState', !this.get('inState'));
    }
    this.displayDidChange();
    return YES;
  },
  
  renderMixin: function(context, firstTime) {
    if (this.get('hasHover')) { 
      var hoverClass = this.get('hoverClass');
      context.setClass(hoverClass, this._hover && !this._isMouseDown); // addClass if YES, removeClass if NO
    }
    
    if (this.get('hasState')) {
      var stateClass = this.get('stateClass');
      context.setClass(stateClass, this.inState); // addClass if YES, removeClass if NO
    }
    
    var activeClass = this.get('activeClass');
    context.setClass(activeClass, this._isMouseDown);
    
    // If there is a toolTip set, grab it and localize if necessary.
    var toolTip = this.get('toolTip') ;
    if (SC.typeOf(toolTip) === SC.T_STRING) {
      if (this.get('localize')) toolTip = toolTip.loc();
      context.attr('title', toolTip);
      context.attr('alt', toolTip);
    }
  },  
  
  /**
    @private
    From ButtonView 
    Support inline function definitions
   */
  _hasLegacyActionHandler: function(){
    var action = this.get('action');
    if (action && (SC.typeOf(action) === SC.T_FUNCTION)) return true;
    if (action && (SC.typeOf(action) === SC.T_STRING) && (action.indexOf('.') !== -1)) return true;
    return false;
  },

  /** @private */
  _triggerLegacyActionHandler: function(evt){
    var target = this.get('target');
    var action = this.get('action');

    // TODO: [MB/EG] Review: MH added the else if so that the action executes
    // in the scope of the target, if it is specified.
    if (target === undefined && SC.typeOf(action) === SC.T_FUNCTION) {
      this.action(evt);
    }
    else if (target !== undefined && SC.typeOf(action) === SC.T_FUNCTION) {
      action.apply(target, [evt]);
    }
    
    if (SC.typeOf(action) === SC.T_STRING) {
      eval("this.action = function(e) { return "+ action +"(this, e); };");
      this.action(evt);
    }
  }
  
};


/* >>>>>>>>>> BEGIN source/mixins/status_changed.js */
// ==========================================================================
// SCUI.StatusChanged
// ==========================================================================

/**
  @namespace
  
  Implements common status observation.
  
  @author: Mike Ball
  @version: 0.5
  @since: 0.5
*/
SCUI.StatusChanged = {
  
  notifyOnContentStatusChange: YES,
  
  /**
    Override this method to do any error or success handeling in your own controllers or views...
  */
  contentStatusDidChange: function(status){
    
  },
  
  /**
    what property on this object has a status
    @property
  */
  contentKey: 'content',
  
  /**
    @private
  
    observers the content property's status (if it exists) and calls 
    statusDidChange so you have an oppertunity to take action 
    (eg display an error message) in UI when a record's status changes
  */
  _sc_content_status_changed: function(){
    var status, content;
    if(this.get('contentKey') && this.get) content = this.get(this.get('contentKey'));
    if(content && content.get) status = content.get('status');
    if(this.get('notifyOnContentStatusChange') && status && this.contentStatusDidChange) this.contentStatusDidChange(status);
  },
  
  initMixin: function(){
    if(this.get('notifyOnContentStatusChange') && this.addObserver) {
      var path;
      if(this.get('contentKey')) path = '%@.status'.fmt(this.get('contentKey'));
      if(path && this.addObserver) this.addObserver(path, this, this._sc_content_status_changed); 
    }
  }
};


/* >>>>>>>>>> BEGIN source/mixins/tooltip.js */
// ==========================================================================
// SCUI.StatusChanged
// ==========================================================================

sc_require('core');

/**
  @namespace
  
  A render mixin that adds tooltip attributes to the layer DOM.
  
  @author: Michael Harris
  @version: 0.5
  @since: 0.5
*/
SCUI.ToolTip = {
  
  toolTip: '',
  /*
    We only want to set the alt attribute if this is mixed-in to an image
    otherwise the alt attribute is useless and pollutes the DOM.
  */
  isImage: NO,

  renderMixin: function(context, firstTime){
    var toolTip = this.get('toolTip');
    var isImage = this.get('isImage'), attr;
    
    if (isImage) {
      attr = {
        title: toolTip,
        alt: toolTip
      };
    } else {
      attr = {
        title: toolTip
      };
    }
    
    context = context.attr(attr);
  }
};


/* >>>>>>>>>> BEGIN source/panes/context_menu_pane.js */
// ========================================================================
// SCUI.ContextMenuPane
// ========================================================================

/**

  Extends SC.MenuPane to position a right-click menu pane.

  How to use:
    
    In your view, override mouseDown() or mouseUp() like this:
  
    {{{
      mouseDown: function(evt) {
        var menuOptions = [
          { title: "Menu Item 1", target: null, 
            action: '', isEnabled: YES },
          { isSeparator: YES },
          { title: "Menu Item 2", 
            target: '', action: '', isEnabled: YES }
        ];    
  
        var pane = SCUI.ContextMenuPane.create({
          contentView: SC.View.design({}),
          layout: { width: 194, height: 0 },
          itemTitleKey: 'title',
          itemTargetKey: 'target',
          itemActionKey: 'action',
          itemSeparatorKey: 'isSeparator',
          itemIsEnabledKey: 'isEnabled',
          items: menuOptions
        });
  
        pane.popup(this, evt); // pass in the mouse event so the pane can figure out where to put itself

        return arguments.callee.base.apply(this,arguments); // or whatever you want to do
      }  
    }}}

  @extends SC.MenuPane
  @author Josh Holt
  @author Jonathan Lewis


*/

SCUI.ContextMenuPane = SC.MenuPane.extend({
  
  /**
    This flag is for the special case when the anchor view is using static
    layout, i.e ( SC.StackedView, or mixn SC.StaticLayout).
  */
  usingStaticLayout: NO,
  
  /**
    If evt is a right-click, this method pops up a context menu next to the mouse click.
    Returns YES if we popped up a context menu, otherwise NO.
    
    AnchorView must be a valid SC.View object.
  */
  popup: function(anchorView, evt) {
    if ((!anchorView || !anchorView.isView) && !this.get('usingStaticLayout')) return NO;
  
    if (evt && evt.button && (evt.which === 3 || (evt.ctrlKey && evt.which === 1))) {
  
      // FIXME [JH2] This is sooo nasty. We should register this event with SC's rootResponder?
      // After talking with charles we need to handle oncontextmenu events when we want to block
      // the browsers context meuns. (SC does not handle oncontextmenu event.)
      document.oncontextmenu = function(e) { return false; };
      
      // calculate offset needed from top-left of anchorViewOrElement to position the menu
      // pane next to the mouse click location
      var anchor = anchorView.isView ? anchorView.get('layer') : anchorView;  
      var gFrame = SC.viewportOffset(anchor);
      var offsetX = evt.pageX - gFrame.x;
      var offsetY = evt.pageY - gFrame.y;
      
      // Popup the menu pane
      this.beginPropertyChanges();
      var it = this.get('displayItems');
      this.set('anchorElement', anchor) ;
      this.set('anchor', anchorView);
      this.set('preferType', SC.PICKER_MENU) ;
      this.set('preferMatrix', [offsetX + 2, offsetY + 2, 1]) ;
      this.endPropertyChanges();
  
      this.adjust('height', this.get('menuHeight'));
      this.positionPane();

      this.append();
      this.becomeKeyPane();
  
      return YES;
    }
    else {
      //document.oncontextmenu = null; // restore default browser context menu handling
    }
    return NO;
  },

  /**
    Override remove() to restore the default browser context menus when this pane goes away.
  */
  remove: function() {
   //this.invokeLater(function(){document.oncontextmenu = null; console.log('removing contextmenu event');}); //invoke later to ensure the event is over...
    return arguments.callee.base.apply(this,arguments);
  }

});


/* >>>>>>>>>> BEGIN source/system/state.js */
// ==========================================================================
// SCUI.State
// ==========================================================================

/**
  @class
  This defines a state for use with the SCUI.Statechart state machine
  
  
  @author: Mike Ball
  @author: Michael Cohen
  @author: Evin Grano
  @version: 0.1
  @since: 0.1
*/
SCUI.State = SC.Object.extend({
  
  
  /**
    Called when the state chart is started up.  Use this method to init
    your state
    
    @returns {void}
  */
  initState: function(){},
  
  /**
    Called when this state, or one of its children is becoming the current
    state.  Do any state setup in this method
    
    @param {Object} context optional additonal context info
    @returns {void}
  */
  enterState: function(context){},
  
  /**
    Called when this state, or one of its children is losing its status as the 
    current state.  Do any state teardown in this method
    
    @param {Object} context optional additonal context info
    @returns {void}
  */
  exitState: function(context){},
  
  /**
    the parallel statechart this state is a member of.  Defaults to 'default'
    @property {String}
  */
  parallelStatechart: SCUI.DEFAULT_STATE,
  /**
    The parent state.  Null if none
    
    @property {String}
  */
  parentState: null,
  
  /**
   * The history state. Null if no substates
   * @property {String}
   */
  history: null,
  
  /**
    Identifies the optional substate that should be entered on the 
    statechart start up.
    if null it is assumed this state is a leaf on the response tree

    @property {String}
  */
  initialSubState: null,
  
  /**
    the name of the state.  Set by the statemanager

    @property {String}
  */
  name: null,
  
  /**
    returns the current state for the parallel statechart this state is in.
    
    use this method in your events to determin if specific behavior is needed
    
    @returns {SCUI.State}
  */
  state: function(){
    var sm = this.get('stateManager');
    if(!sm) throw 'Cannot access the current state because state does not have a state manager';
    return sm.currentState(this.get('parallelStatechart'));
  },
  
  /**
    transitions the current parallel statechart to the passed state
    
    
    @param {String}
    @returns {void}
  */
  goState: function(name){
    var sm = this.get('stateManager');
    if(sm){
      sm.goState(name, this.get('parallelStatechart'));
    }
    else{
      throw 'Cannot goState cause state does not have a stateManager!';
    }
  },
  
  /**
    transitions the current parallel statechart to the passed historystate
    
    
    @param {String}
    @param {Bool}
    @returns {void}
  */
  goHistoryState: function(name, isRecursive){
    var sm = this.get('stateManager');
    if(sm){
      sm.goHistoryState(name, this.get('parallelStatechart'), isRecursive);
    }
    else{
      throw 'Cannot goState cause state does not have a stateManager!';
    }
  },
  
  
  /** @private - 
    called by the state manager on state startup to initialize the state
  */
  startupStates: function(tree){
    var sm = this.get('stateManager');
    if (sm && sm.get('log')) console.info('Entering State: [%@] in [%@]\n'.fmt(this.name, this.get('parallelStatechart')));
    this.enterState();
    var initialSubState = this.get('initialSubState');
    
    if(initialSubState){
      this.set('history', initialSubState);
      if(!tree[initialSubState]) throw 'Cannot find initial sub state: %@ defined on state: %@'.fmt(initialSubState, this.get('name'));
      return tree[initialSubState].startupStates(tree);
    }
    return this;
  },
  
  /**
    pretty printing
  */
  toString: function(){
    return this.get('name');
  },
  
  /**
    returns the parent states object
    @returns {SCUI.State}
  */
  parentStateObject: function(){
    var sm = this.get('stateManager');
    if(sm){
      return sm.parentStateObject(this.get('parentState'), this.get('parallelStatechart'));
    }
    else{
      throw 'Cannot access parentState cause state does not have a stateManager!';
    }
  }.property('parentState').cacheable(),
  
  /**
    returns an array of parent states if any
    
    @returns {SC.Array}
    
  */
  trace: function(){
    var sm = this.get('stateManager');
    if(sm){
      return sm._parentStates(this);
    }
    else{
      throw 'Cannot trace cause state does not have a stateManager!';
    }
  }
 
});


/* >>>>>>>>>> BEGIN source/system/statechart.js */
// ==========================================================================
// SCUI.Statechart
// ==========================================================================
require('system/state');
/**
  @namespace
  
  A most excellent statechart implementation
  
  @author: Mike Ball
  @author: Michael Cohen
  @author: Evin Grano
  @version: 0.1
  @since: 0.1
*/

SCUI.Statechart = {
  
  isStatechart: true,
  
  log: NO,
  
  initMixin: function(){
    //setup data
    this._all_states = {};
    this._all_states[SCUI.DEFAULT_TREE] = {};
    this._current_state = {};
    this._current_state[SCUI.DEFAULT_TREE] = null;
    //alias sendAction
    this.sendAction = this.sendEvent;
    if(this.get('startOnInit')) this.startupStatechart();
  },
  
  startOnInit: YES,
  
  
  startupStatechart: function(){
    //add all unregistered states
    if(!this._started){
      var key, tree, state, trees, startStates, startState, currTree;
      for(key in this){
        if(this.hasOwnProperty(key) && SC.kindOf(this[key], SCUI.State) && this[key].get && !this[key].get('beenAddedToStatechart')){
          state = this[key];
          this._addState(key, state);
        }
      }
      trees = this._all_states;
      //init the statechart
      for(key in trees){  
        if(trees.hasOwnProperty(key)){
          tree = trees[key];
          //for all the states in this tree
          for(state in tree){
            if(tree.hasOwnProperty(state)){
              tree[state].initState();
            }
          }
        }
      }
      //enter the startstates
      startStates = this.get('startStates');
      if(!startStates) throw 'Please add startStates to your statechart!';
      
      for(key in trees){  
        if(trees.hasOwnProperty(key)){
          startState = startStates[key];
          currTree = trees[key];
          if(!startState) console.error('The parallel statechart %@ must have a start state!'.fmt(key));
          if(!currTree) throw 'The parallel statechart %@ does not exist!'.fmt(key);
          if(!currTree[startState]) throw 'The parallel statechart %@ doesn\'t have a start state [%@]!'.fmt(key, startState);
          this._current_state[key] = currTree[startState].startupStates(currTree);
        }
      }
    }
    this._started = YES;
  },
  
  
  /**
    Adds a state to a state manager
    
    if the stateManager and stateName objects are blank it is assumed
    that this state will be picked up by the StateManger's init
    
    @param {Object} the state definition
    @param {SC.Object} Optional: Any SC.Object that mixes in SCUI.Statechart 
    @param {String} Optional: the state name
    @returns {SCUI.State} the state object
  */
  registerState: function(stateDefinition, stateManager, stateName){
    
    var state, tree;
    //create the state object
    state = SCUI.State.create(stateDefinition);
    
    //passed in optional arguments
    if(stateManager && stateName){
      if(stateManager.isStatechart){

        stateManager._addState(stateName, state);
        state.initState();
      }
      else{
        throw 'Cannot add state: %@ because state manager does not mixin SCUI.Statechart'.fmt(state.get('name'));
      }
    }
    else{
      state.set('beenAddedToStatechart', NO);
    }
    //push state onto list of states
    
    return state;
  },
  
  goHistoryState: function(requestedState, tree, isRecursive){
    var allStateForTree = this._all_states[tree],
        pState, realHistoryState;
    if(!tree || !allStateForTree) throw 'State requesting go history does not have a valid parallel tree';
    pState = allStateForTree[requestedState];
    if (pState && pState.get('history')) realHistoryState = pState.get('history');
  
    if (!realHistoryState) {
      if (!isRecursive) console.warn('Requesting History State for [%@] and it is not a parent state'.fmt(requestedState));
      realHistoryState = requestedState;
      this.goState(realHistoryState, tree);
    }
    else if (isRecursive) {
      this.goHistoryState(realHistoryState, tree, isRecursive);
    }
    else {
      this.goState(realHistoryState, tree);
    }
  },
  
  goState: function(requestdState, tree){
    var currentState = this._current_state[tree],
        enterStates = [],
        exitStates = [],
        enterMatchIndex,
        exitMatchIndex,
        pivotState, pState, cState, 
        i, hasLogging = this.get('log'), loggingStr;
    if(!tree) throw '#goState: State requesting go does not have a valid parallel tree';
    requestdState = this._all_states[tree][requestdState];
    if(!requestdState) throw '#goState: Could not find the requested state!';

    enterStates = this._parentStates_with_root(requestdState);
    exitStates = currentState ? this._parentStates_with_root(currentState) : [];
    
    //find common ancestor
    // YES this is O(N^2) but will do for now....
    pivotState = exitStates.find(function(item,index){
      exitMatchIndex = index;
      enterMatchIndex = enterStates.indexOf(item);
      if(enterMatchIndex >= 0) return YES;
    });
    
    //call enterState and exitState on all states
    loggingStr = "";
    for(i = 0; i < exitMatchIndex; i += 1){
      if (hasLogging) loggingStr += 'Exiting State: [%@] in [%@]\n'.fmt(exitStates[i], tree);
      exitStates[i].exitState();
    }
    if (hasLogging) console.info(loggingStr);
    
    loggingStr = "";
    for(i = enterMatchIndex-1; i >= 0; i -= 1){
      //TODO call initState?
      cState = enterStates[i];
      if (hasLogging) loggingStr += 'Entering State: [%@] in [%@]\n'.fmt(cState, tree);
      pState = enterStates[i+1];
      if (pState && SC.typeOf(pState) === SC.T_OBJECT) pState.set('history', cState.name);
      cState.enterState();
    }
    if (hasLogging) console.info(loggingStr);
    
    this._current_state[tree] = requestdState;
  },
  
  currentState: function(tree){
    tree = tree || SCUI.DEFAULT_TREE;
    return this._current_state[tree];
  },
  
  //Walk like a duck
  isResponderContext: YES,
  
  
  /**
    Sends the event to all the parallel state's current state
    and walks up the graph looking if current does not respond
    
    @param {String} action name of action
    @param {Object} sender object sending the action
    @param {Object} context optional additonal context info
    @returns {SC.Responder} the responder that handled it or null
  */
  sendEvent: function(action, sender, context) {
    var trace = this.get('log'),
        handled = NO,
        currentStates = this._current_state,
        responder;
    
    this._locked = YES;
    if (trace) {
      console.log("%@: begin action '%@' (%@, %@)".fmt(this, action, sender, context));
    }
    
    for(var tree in currentStates){
      if(currentStates.hasOwnProperty(tree)){
        handled = NO;
        
        responder = currentStates[tree];
       
        while(!handled && responder){
          if(responder.tryToPerform){
            handled = responder.tryToPerform(action, sender, context);
          }
          
          if(!handled) responder = responder.get('parentState') ? this._all_states[tree][responder.get('parentState')] : null;
        }
        
        if (trace) {
          if (!handled) console.log("%@:  action '%@' NOT HANDLED in tree %@".fmt(this,action, tree));
          else console.log("%@: action '%@' handled by %@ in tree %@".fmt(this, action, responder.get('name'), tree));
        }
      }
    }
    
    this._locked = NO ;
    
    return responder ;
  },
  
  
  
  _addState: function(name, state){
    state.set('stateManager', this);
    state.set('name', name);
    var tree = state.get('parallelStatechart') || SCUI.DEFAULT_TREE;
    state.setIfChanged('parallelStatechart', tree);
    
    if(!this._all_states[tree]) this._all_states[tree] = {};
    if(this._all_states[tree][name]) throw 'Trying to add state %@ to state tree %@ and it already exists'.fmt(name, tree);
    this._all_states[tree][name] = state;
    
    state.set('beenAddedToStatechart', YES);
  },
  
  
  _parentStates: function(state){
    var ret = [], curr = state;
    
    //always add the first state
    ret.push(curr);
    curr = curr.get('parentStateObject');
    
    while(curr){
      ret.push(curr);
      curr = curr.get('parentStateObject');
    }
    return ret;
  },
  
  _parentStates_with_root: function(state){
    var ret = this._parentStates(state);
    //always push the root
    ret.push('root');
    return ret;
  },
  
  parentStateObject: function(name, tree){
    if(name && tree && this._all_states[tree] && this._all_states[tree][name]){
      return this._all_states[tree][name];
    }
    return null;
  }
};


/* >>>>>>>>>> BEGIN source/views/cascading_combo.js */
//============================================================================
// SCUI.MasterDetailComboView
//============================================================================
sc_require('core');
/**

  This view will display two combo boxes with labels.
  One combo box feeds off of the other, hence the master/detail...
  
  To use this view you will need to supply a settings hash combo boxes.
  The hash should follow the following example:
  
  {{{
  
    propertiesHash: {
      contentPath: 'path.to.some.arraycontroller.contnet', // *** REQUIRED ***
      filterPath: 'path.to.some.external.source', // OPTIONAL
      useExternalFilter: YES | NO // OPTIONAL  (set to use if you supplied the filter path.)
      masterValueKey: 'name', // *** REQUIRED ***
      detailValueKey: 'name', // *** REQUIRED ***
      rootItemKey: 'someKey', // *** REQUIERD *** (the property on the model that should be set by the selection of the first combo box)
      childItemKey: 'someKey', // *** REQUIERD *** (the property on the model that should be set by the selection of the second combo box)
      relationKey: 'parentModelKey.childModelKey' // *** REQUIRED *** How to get the relation between the two models.
    }
    
  
  }}}
  
  @extends SC.View
  @author Josh Holt [JH2], Jonathan Lewis [JL]
  @version Beta1.1
  @since FR4

*/

SCUI.CascadingComboView = SC.View.extend({
  
  // PUBLIC PROPERTIES

  /*
    This is a reference to the model object that you are using this
    master detail view to set properties.
  */
  content: null,
  
  propertiesHash: null,
  
  masterLabel: null,
  
  detailLabel: null,

  // PUBLIC METHODS
  
  init: function() {
    arguments.callee.base.apply(this,arguments);
  },
  
  createChildViews: function() {
    var childViews = [], view;
    var required = ['contentPath', 'masterValueKey', 'detailValueKey', 
                    'rootItemKey', 'childItemKey', 'relationKey'];
    var meetsRequirements = null;
    var props = this.get('propertiesHash');
    var content = this.get('content');
    
    
    // make sure the required props are there or complain.
    if (props) {
      required.forEach(function(key){
      if (!SC.none(props[key]) && props[key] !== '') {
        meetsRequirements = YES;
      }else{
        meetsRequirements = null;
      }});
    }
    
    if (meetsRequirements) {    
      view = this.createChildView(
        SC.LabelView.design({
          layout: { left: 20, top: 10, right: 20, height: 22 },
          isEditable: NO,
          value: this.get('masterLabel').loc()
        })
      );
      childViews.push(view);

      var str = '*content.%@'.fmt(props.rootItemKey);

      this.masterCombo = view = this.createChildView(
        SCUI.ComboBoxView.design({
          layout: { left: 20 , right: 20, top: 32, height: 22 },
          objectsBinding: props.contentPath,
          nameKey: props.masterValueKey,
          valueBinding: SC.Binding.from('*content.%@'.fmt(props.rootItemKey), this)
        })
      );
      childViews.push(view);

      view = this.createChildView(
        SC.LabelView.design({
          layout: { left: 50, top: 64, right: 20, height: 22 },
          isEditable: NO,
          value: this.get('detailLabel').loc(),
          isEnabled: NO,
          isEnabledBinding: SC.Binding.from('*masterCombo.selectedObject', this).oneWay()
        })
      );
      childViews.push(view);

      view = this.createChildView(
        SCUI.ComboBoxView.design({
          layout: { left: 50, right: 20, top: 86, height: 22 },
          objectsBinding: SC.Binding.from('*content.%@'.fmt(props.relationKey), this).oneWay(),
          nameKey: props.detailValueKey,
          isEnabled: NO,
          isEnabledBinding: SC.Binding.from('*masterCombo.selectedObject', this).oneWay(),
          valueBinding: SC.Binding.from('*content.%@'.fmt(props.childItemKey), this)
        })
      );
      childViews.push(view);
      this.set('childViews', childViews);
    } else {
      view = this.createChildView(SC.View.design({
        layout: { top: 0, left: 0, bottom: 0, right: 0},
        childViews: [
          SC.LabelView.design({
            layout: { centerX: 0 , centerY: 0, width: 300, height: 18 },
            value: meetsRequirements ? "No Content." : 'Setup did not meet requirements.'
          })
        ]
      }));
      childViews.push(view);
      this.set('childViews',childViews);
    }
  }
  
});


/* >>>>>>>>>> BEGIN source/views/collapsible.js */
// ==========================================================================
// SCUI.CollapsibleView
// ==========================================================================

sc_require('core');

/** @class

  This is a really simple view that toggles between two view for an expanded and a collapsed view

  @extends SC.ContainerView
  @author Evin Grano
  @version 0.1
  @since 0.1
*/

SCUI.CollapsibleView = SC.ContainerView.extend(
/** @scope SCUI.CollapsibleView.prototype */ {
  
  classNames: ['scui-collapsible-view'],
  
  /**
    This is the reference to the expanded view...
    This view will show when the CollapsedView is expanded
    
    @field {String, SC.View}
  */
  expandedView: null,
  /**
    This is the reference to the collapsed view...
    This view will show when the CollapsedView is collapsed
    
    @field {String, SC.View}
  */
  collapsedView: null,
  
  // Private Elements
  _isCollapsed: NO,
  _expandedView: null,
  _collapsedView: null,
  
  displayProperties: ['expandedView', 'collapsedView'],
  
  createChildViews: function(){
    var expandedView = this.get('expandedView');
    this._expandedView = this._createChildViewIfNeeded(expandedView);
    
    var collapsedView = this.get('collapsedView');
    this._collapsedView = this._createChildViewIfNeeded(collapsedView);
    
    // On Init show the expandedView
    this.set('nowShowing', this._expandedView);
    var view = this.get('contentView');
    this._adjustView(view);
  },
  
  // Actions
  expand: function(){
    if (this._expandedView){
      this.set('nowShowing', this._expandedView);
      var view = this.get('contentView');
      this._isCollapsed = NO;
      this.displayDidChange();
      this._adjustView(view);
    }
  },
  
  collapse: function(){
    if (this._collapsedView){
      this.set('nowShowing', this._collapsedView);
      var view = this.get('contentView');
      this._isCollapsed = YES;
      this.displayDidChange();
      this._adjustView(view);
    }
  },
  
  toggle: function(){
    if (this._isCollapsed){
      this.expand();
    }
    else{
      this.collapse();
    }
  },
  
  /**
    Invoked whenever expandedView is changed and changes out the view if necessary...
  */
  _expandedViewDidChange: function() {
    var expandedView = this.get('expandedView');
    console.log('%@._expandableViewDidChange(%@)'.fmt(this, expandedView));
    this._expandedView = this._createChildViewIfNeeded(expandedView);
    if (!this._isCollapsed) this.expand();
  }.observes('expandedView'),
  
  /**
    Invoked whenever collapsedView is changed and changes out the view if necessary...
  */
  _collapsedViewDidChange: function() {
    var collapsedView = this.get('collapsedView');
    console.log('%@._collapsedViewDidChange(%@)'.fmt(this, collapsedView));
    this._collapsedView = this._createChildViewIfNeeded(collapsedView);
    if (this._isCollapsed) this.collapse();
  }.observes('collapsedView'),
  
  // Private functions
  _adjustView: function(view){
    if (view){
      var frame = view.get('frame');
      var layout = this.get('layout');
      console.log('CollapsibleView: Frame for (%@): width: %@, height: %@'.fmt(view, frame.height, frame.width));
      layout = SC.merge(layout, {height: frame.height, width: frame.width});
      this.adjust(layout);
    }
  },
  
  _createChildViewIfNeeded: function(view){
    if (SC.typeOf(view) === SC.T_CLASS){
      return this.createChildView(view);
    }
    else{
      return view;
    }
  }
});


/* >>>>>>>>>> BEGIN source/views/localizable_list_item.js */
/** @class

  A simple extension of SC.ListItemView to allow for string localization.

  @extends SC.ListItemView
  @author Jonathan Lewis
*/

SCUI.LocalizableListItemView = SC.ListItemView.extend({

  /**
    We'll just override render to intercept the value and localize it
    just prior to rendering it.  This method should be identical to
    SC.ListItemView.render() except for the addition of a few lines
    prior to the call to renderLabel().

    Fills the passed html-array with strings that can be joined to form the
    innerHTML of the receiver element.  Also populates an array of classNames
    to set on the outer element.
    
    @param {SC.RenderContext} context
    @param {Boolean} firstTime
    @returns {void}
  */
  render: function(context, firstTime) {
    var content = this.get('content'),
        del     = this.displayDelegate,
        level   = this.get('outlineLevel'),
        indent  = this.get('outlineIndent'),
        key, value, working ;
    
    // add alternating row classes
    context.addClass((this.get('contentIndex')%2 === 0) ? 'even' : 'odd');
    context.setClass('disabled', !this.get('isEnabled'));

    // outline level wrapper
    working = context.begin("div").addClass("sc-outline");
    if (level>=0 && indent>0) working.addStyle("left", indent*(level+1));

    // handle disclosure triangle
    value = this.get('disclosureState');
    if (value !== SC.LEAF_NODE) {
      this.renderDisclosure(working, value);
      context.addClass('has-disclosure');
    }
    
    // handle checkbox
    key = this.getDelegateProperty('contentCheckboxKey', content, del) ;
    if (key) {
      value = content ? (content.get ? content.get(key) : content[key]) : NO ;
      this.renderCheckbox(working, value);
      context.addClass('has-checkbox');
    }
    
    // handle icon
    if (this.getDelegateProperty('hasContentIcon', content, del)) {
      key = this.getDelegateProperty('contentIconKey', del) ;
      value = (key && content) ? (content.get ? content.get(key) : content[key]) : null ;
      
      this.renderIcon(working, value);
      context.addClass('has-icon');
    }
    
    // handle label -- always invoke
    key = this.getDelegateProperty('contentValueKey', content, del) ;
    value = (key && content) ? (content.get ? content.get(key) : content[key]) : content ;
    if (value && SC.typeOf(value) !== SC.T_STRING) value = value.toString();

    // localize the value if specified on the owner list view
    if (del && del.get('localize') && value && value.loc) {
      value = value.loc();
    }

    if (this.get('escapeHTML')) value = SC.RenderContext.escapeHTML(value);
    this.renderLabel(working, value);

    // handle right icon
    if (this.getDelegateProperty('hasContentRightIcon', del)) {
      key = this.getDelegateProperty('contentRightIconKey', del) ;
      value = (key && content) ? (content.get ? content.get(key) : content[key]) : null ;
      
      this.renderRightIcon(working, value);
      context.addClass('has-right-icon');
    }
    
    // handle unread count
    key = this.getDelegateProperty('contentUnreadCountKey', content, del) ;
    value = (key && content) ? (content.get ? content.get(key) : content[key]) : null ;
    if (!SC.none(value) && (value !== 0)) {
      this.renderCount(working, value) ;
      var digits = ['zero', 'one', 'two', 'three', 'four', 'five'];
      var digit = (value.toString().length < digits.length) ? digits[value.toString().length] : digits[digits.length-1];
      context.addClass('has-count '+digit+'-digit');
    }
    
    // handle action 
    key = this.getDelegateProperty('listItemActionProperty', content, del) ;
    value = (key && content) ? (content.get ? content.get(key) : content[key]) : null ;
    if (value) {
      this.renderAction(working, value);
      context.addClass('has-action');
    }
    
    // handle branch
    if (this.getDelegateProperty('hasContentBranch', content, del)) {
      key = this.getDelegateProperty('contentIsBranchKey', content, del);
      value = (key && content) ? (content.get ? content.get(key) : content[key]) : NO ;
      this.renderBranch(working, value);
      context.addClass('has-branch');
    }
    
    context = working.end();
  }
  
});


/* >>>>>>>>>> BEGIN source/views/combo_box.js */
/*globals SCUI*/

sc_require('mixins/simple_button');
sc_require('views/localizable_list_item');

/** @class

  This view creates a combo-box text field view with a dropdown list view
  for type ahead suggestions; useful as a search field.
  
  'objects' should be set to an array of candidate items.
  'value' will be the item selected, just like any SC.Control.

  @extends SC.View, SC.Control, SC.Editable
  @author Jonathan Lewis
*/

SCUI.ComboBoxView = SC.View.extend( SC.Control, SC.Editable, {

  // PUBLIC PROPERTIES

  classNames: 'scui-combobox-view',
  
  isEditable: function() {
    return this.get('isEnabled');
  }.property('isEnabled').cacheable(),

  /**
    An array of items that will form the menu you want to show.
  */
  objects: null,
  
  /**
    The value represented by this control.  If you have defined a 'valueKey',
    this will be 'selectedObject[valueKey]', otherwise it will be
    'selectedObject' itself.

    Setting 'value':
    
    When 'valueKey' is defined, setting 'value' will make the combo box
    attempt to find an object in 'objects' where object[valueKey] === value.
    If it can't find such an object, 'value' and 'selectedObject' will be forced
    to null. In the case where both 'objects' and 'value' are both bound to something
    and 'value' happens to update before 'objects' (so that for a small amount of time 'value' is
    not found in 'object[valueKey]s') 'value' can be set wrongly to null.
    'valueKey' is really meant for use in read-only situations.
    
    When 'valueKey' is not defined, setting 'value' to something not found in
    'objects' is just fine -- 'selectedObject' will simply be set to 'value'.
    
    Setting this to null also forces 'selectedObject' to null.
    
    @property {Object}
  */
  value: null,

  /**
    Provided because we have to keep track of this internally -- the
    actual item from 'objects' that was selected, regardless of how we are
    displaying it or what property on it is considered its 'value'.
    
    Usually you won't use this -- 'value' is the normal property for this
    purpose.  However, this is also fully bindable, etc.
  */
  selectedObject: null,

  /**
     Set this to a non-null value to use a key from the passed set of objects
     as the value for the options popup.  If you don't set this, then the
     objects themselves will be used as the value.
  */
  valueKey: null,
  
  /**
    If you set this to a non-null value, then the name shown for each 
    menu item will be pulled from the object using the named property.
    if this is null, the collection objects themselves will be used.
  */
  nameKey: null,

  /**
    If this is non-null, the drop down list will add an icon for each
    object in the list.
  */
  iconKey: null,

  /**
   If you set this to a non-null value, then the value of this key will
   be used to sort the objects.  If this is not set, then nameKey will
   be used.
  */
  sortKey: null,
  
  /**
    if true, it means that no sorting will occur, objects will appear 
    in the same order as in the array
  */  
  disableSort: NO,
  
  localize: NO,
  
  /**
    Bound to the hint property on the combo box's text field view.
  */
  hint: null,

  /**
    Search string being used to filter the 'objects' array above.
    Unless you explicitly set it, it is always whatever was _typed_
    in the text field view (text that is a result of key presses).
    Note that this is not always the same as the text in the field, since
    that can also change as a result of 'value' (the selected object)
    changing, or the user using arrow keys to highlight objects in the
    drop down list.  You want to see the names of these objects in the text
    field, but you don't want to trigger a filter change in those cases,
    so it doesn't.
  */
  filter: null,

  /**
    If you do not want to use the combo box's internal filtering
    algorithm, set this to YES.  In this case, if you want to filter
    'objects' in your own way, you would need to watch the 'filter'
    property and update 'objects' as desired.
  */
  useExternalFilter: NO,
  
  /**
    Bound internally to the status of the 'objects' array, if present
  */
  status: null,

  /**
    True if ('status' & SC.Record.BUSY).
  */
  isBusy: function() {
    return (this.get('status') & SC.Record.BUSY) ? YES : NO;
  }.property('status').cacheable(),

  /**
    The drop down pane resizes automatically.  Set the minimum allowed height here.
  */
  minListHeight: 20,

  /**
    The drop down pane resizes automatically.  Set the maximum allowed height here.
  */
  maxListHeight: 200,

  /**
    When 'isBusy' is true, the combo box shows a busy indicator at the bottom of the
    drop down pane.  Set its height here.
  */
  statusIndicatorHeight: 18,

  /**
    'objects' above, filtered by 'filter', then optionally sorted.
    If 'useExternalFilter' is YES, this property does nothing but
    pass 'objects' through unchanged.
  */
  filteredObjects: function() {
    var ret, filter, objects, nameKey, name, that, shouldLocalize;

    if (this.get('useExternalFilter')) {
      ret = this.get('objects');
    }
    else {
      objects = this.get('objects') || [];
      nameKey = this.get('nameKey');

      filter = this._sanitizeFilter(this.get('filter')) || '';
      filter = filter.toLowerCase();

      shouldLocalize = this.get('localize');

      ret = [];
      that = this;

      objects.forEach(function(obj) {
        name = that._getObjectName(obj, nameKey, shouldLocalize);

        if ((SC.typeOf(name) === SC.T_STRING) && (name.toLowerCase().search(filter) >= 0)) {
          ret.push(obj);
        }
      });
    }

    return this.sortObjects(ret);
  }.property('objects', 'filter').cacheable(),

  /**
    The text field child view class.  Override this to change layout, CSS, etc.
  */
  textFieldView: SC.TextFieldView.extend({
    classNames: 'scui-combobox-text-field-view',
    layout: { top: 0, left: 0, height: 22, right: 28 }
  }),

  /**
    The drop down button view class.  Override this to change layout, CSS, etc.
  */
  dropDownButtonView: SC.View.extend( SCUI.SimpleButton, {
    classNames: 'scui-combobox-dropdown-button-view',
    layout: { top: 0, right: 0, height: 24, width: 28 }
  }),

  displayProperties: ['isEditing'],

  // PUBLIC METHODS
  
  init: function() {
    arguments.callee.base.apply(this,arguments);
    this._createListPane();
    this._valueDidChange();

    this.bind('status', SC.Binding.from('*objects.status', this).oneWay());
  },
  
  createChildViews: function() {
    var childViews = [], view;
    var isEnabled = this.get('isEnabled');
    
    view = this.get('textFieldView');
    if (SC.kindOf(view, SC.View) && view.isClass) {
      view = this.createChildView(view, {
        isEnabled: isEnabled,
        hintBinding: SC.Binding.from('hint', this),
        editableDelegate: this, // pass SC.Editable calls up to the owner view
        keyDelegate: this, // the text field will be the key responder, but offer them to the owner view first

        // Override key handlers to first offer them to the delegate.
        // Only call base class implementation if the delegate refuses the event.
        keyDown: function(evt) {
          var del = this.get('keyDelegate');
          return (del && del.keyDown && del.keyDown(evt)) || arguments.callee.base.apply(this,arguments);
        },
        
        keyUp: function(evt) {
          var del = this.get('keyDelegate');
          return (del && del.keyUp && del.keyUp(evt)) || arguments.callee.base.apply(this,arguments);
        },
        
        beginEditing: function() {
          var del = this.get('editableDelegate');
          var ret = arguments.callee.base.apply(this,arguments);
          if (ret && del && del.beginEditing) {
            del.beginEditing();
          }
          return ret;
        },
        
        commitEditing: function() {
          var del = this.get('editableDelegate');
          var ret = arguments.callee.base.apply(this,arguments);
          if (ret && del && del.commitEditing) {
            del.commitEditing();
          }
          return ret;
        }
      });
      childViews.push(view);
      this.set('textFieldView', view);
    }
    else {
      this.set('textFieldView', null);
    }

    view = this.get('dropDownButtonView');
    if (SC.kindOf(view, SC.View) && view.isClass) {
      view = this.createChildView(view, {
        isEnabled: isEnabled,
        target: this,
        action: 'toggleList'
      });
      childViews.push(view);
      this.set('dropDownButtonView', view);
    }
    else {
      this.set('dropDownButtonView', null);
    }

    this.set('childViews', childViews);
  },

  // for styling purposes, add a 'focus' CSS class when
  // the combo box is in editing mode
  renderMixin: function(context, firstTime) {
    context.setClass('focus', this.get('isEditing'));
  },

  /**
    override this method to implement your own sorting of the menu. By
    default, menu items are sorted using the value shown or the sortKey

    @param objects the unsorted array of objects to display.
    @returns sorted array of objects
  */
  sortObjects: function(objects) {
    var nameKey;

    if (!this.get('disableSort') && objects && objects.sort){
      nameKey = this.get('sortKey') || this.get('nameKey') ;

      objects = objects.sort(function(a, b) {
        if (nameKey) {
          a = a.get ? a.get(nameKey) : a[nameKey];
          b = b.get ? b.get(nameKey) : b[nameKey];
        }
        
        a = (SC.typeOf(a) === SC.T_STRING) ? a.toLowerCase() : a;
        b = (SC.typeOf(b) === SC.T_STRING) ? b.toLowerCase() : b;

        return (a < b) ? -1 : ((a > b) ? 1 : 0);
      });
    }
    
    return objects;
  },

  /**
    This may be called directly, or triggered by the
    text field beginning editing.
  */
  beginEditing: function() {
    var textField = this.get('textFieldView');

    if (!this.get('isEditable')) {
      return NO;
    }
    
    if (this.get('isEditing')) {
      return YES;
    }
    
    this.set('isEditing', YES);
    this.set('filter', null);
    
    if (textField && !textField.get('isEditing')) {
      textField.beginEditing();
    }

    return YES;
  },

  /**
    This may be called directly, or triggered by the
    text field committing editing.
  */
  commitEditing: function() {
    var textField = this.get('textFieldView');

    if (this.get('isEditing')) {
      // force it walk through its sequence one more time
      // to make sure text field display is in sync with selected stuff
      this._selectedObjectDidChange();

      this.set('isEditing', NO);
      this.hideList();
    }

    if (textField && textField.get('isEditing')) {
      textField.commitEditing();
    }
    
    return YES;
  },

  toggleList: function() {
    if (this._listPane && this._listPane.get('isPaneAttached')) {
      this.hideList();
    }
    else {
      this.showList();
    }
  },

  // Show the drop down list if not already visible.
  showList: function() {
    if (this._listPane && !this._listPane.get('isPaneAttached')) {
      this.beginEditing();

      this._updateListPaneLayout();
      this._listPane.popup(this, SC.PICKER_MENU);
    }
  },
  
  // Hide the drop down list if visible.
  hideList: function() {
    if (this._listPane && this._listPane.get('isPaneAttached')) {
      this._listPane.remove();
    }
  },
  
  // The following key events come to us from the text field
  // view.  It is the key responder, but we are its delegate.
  keyDown: function(evt) {
    this._keyDown = YES;
    this._shouldUpdateFilter = NO; // only goes to true if typing text, which we'll discover below
    return this.interpretKeyEvents(evt) ? YES : NO;
  },

  keyUp: function(evt) {
    var ret = NO;

    // If the text field is empty, the browser doesn't always
    // send a keyDown() event, only a keyUp() event for arrow keys in Firefox, for example.
    // To avoid double key handling, check to be sure we didn't get a keyDown()
    // before attempting to use the event.
    if (!this._keyDown) {
      this._shouldUpdateFilter = NO;
      ret = this.interpretKeyEvents(evt) ? YES : NO;
    }

    this._keyDown = NO;
    return ret;
  },
  
  insertText: function(evt) {
    this._shouldUpdateFilter = YES; // someone typed something
    this.showList();
    return NO;
  },
  
  deleteBackward: function(evt) {
    this._shouldUpdateFilter = YES; // someone typed something
    this.showList();
    return NO;
  },
  
  deleteForward: function(evt) {
    this._shouldUpdateFilter = YES;
    this.showList();
    return NO;
  },

  // Send this event to the drop down list
  moveDown: function(evt) {
    if (this._listPane && this._listView) {
      if (this._listPane.get('isPaneAttached')) {
        this._listView.moveDown(evt);
      }
      else {
        this.showList();
      }
    }
    return YES;
  },

  // Send this event to the drop down list
  moveUp: function(evt) {
    if (this._listPane && this._listView) {
      if (this._listPane.get('isPaneAttached')) {
        this._listView.moveUp(evt);
      }
      else {
        this.showList();
      }
    }
    return YES;
  },

  // Send this event to the drop down list to trigger
  // the default action on the selection.
  insertNewline: function(evt) {
    if (this._listPane && this._listPane.get('isPaneAttached')) {
      return this._listView.insertNewline(evt); // invokes default action on ListView, same as double-click
    }
    return NO;
  },

  // escape key handler
  cancel: function(evt) {
    if (this._listPane && this._listPane.get('isPaneAttached')) {
      this.hideList();
    }
    return NO; // don't absorb it; let the text field have fun with this one
  },
  
  // PRIVATE PROPERTIES

  _isEnabledDidChange: function() {
    var view;
    var isEnabled = this.get('isEnabled');
    
    if (!isEnabled) {
      this.commitEditing();
    }
    
    view = this.get('textFieldView');
    if (view && view.set) {
      view.set('isEnabled', isEnabled);
    }
    
    view = this.get('dropDownButtonView');
    if (view && view.set) {
      view.set('isEnabled', isEnabled);
    }
  }.observes('isEnabled'),

  // Have to add an array observer to invalidate 'filteredObjects'
  // since in some cases the entire 'objects' array-like object doesn't
  // get replaced, just modified.
  _objectsDidChange: function() {
    this.notifyPropertyChange('filteredObjects'); // force a recompute next time 'filteredObjects' is asked for
  }.observes('*objects.[]'),

  _filteredObjectsLengthDidChange: function() {
    this.invokeOnce('_updateListPaneLayout');
  }.observes('*filteredObjects.length'),

  _isBusyDidChange: function() {
    this.invokeOnce('_updateListPaneLayout');
  }.observes('isBusy'),

  _selectedObjectDidChange: function() {
    var sel = this.get('selectedObject');
    var textField = this.get('textFieldView');

    // Update 'value' since the selected object changed
    this.setIfChanged('value', this._getObjectValue(sel, this.get('valueKey')));

    // Update the text in the text field as well
    if (textField) {
      textField.setIfChanged('value', this._getObjectName(sel, this.get('nameKey'), this.get('localize')));
    }
    
    // null out the filter since we aren't searching any more at this point.
    this.set('filter', null);
  }.observes('selectedObject'),

  // When the selected item ('value') changes, try to map back to a 'selectedObject'
  // as well.
  _valueDidChange: function() {
    var value = this.get('value');
    var selectedObject = this.get('selectedObject');
    var valueKey = this.get('valueKey');
    var objects;

    if (value) {
      if (valueKey) {
        // we need to update 'selectedObject' if 'selectedObject[valueKey]' is not 'value
        if (value !== this._getObjectValue(selectedObject, valueKey)) {
          objects = this.get('objects');

          // Since we're using a 'valueKey', find the object where object[valueKey] === value.
          // If not found, 'selectedObject' and 'value' get forced to null.
          selectedObject = (objects && objects.isEnumerable) ? objects.findProperty(valueKey, value) : null;
          this.set('selectedObject', selectedObject);
        }
      }
      else {
        // with no 'valueKey' set, we allow setting 'value' and 'selectedObject'
        // to something not found in 'objects'
        this.setIfChanged('selectedObject', value);
      }
    }
    else {
      // When 'value' is set to null, make sure 'selectedObject' goes to null as well.
      this.set('selectedObject', null);
    }
  }.observes('value'),

  // triggered by arrowing up/down in the drop down list -- show the name
  // of the highlighted item in the text field.
  _listSelectionDidChange: function() {
    var selection = this.getPath('_listSelection.firstObject');
    var name, textField;

    if (selection && this._listPane && this._listPane.get('isPaneAttached')) {
      name = this._getObjectName(selection, this.get('nameKey'), this.get('localize'));
      textField = this.get('textFieldView');

      if (textField) {
        textField.setIfChanged('value', name);
      }
    }
  }.observes('_listSelection'),

  // If the text field value changed as a result of typing,
  // update the filter.
  _textFieldValueDidChange: function() {
    if (this._shouldUpdateFilter) {
      this._shouldUpdateFilter = NO;
      this.setIfChanged('filter', this.getPath('textFieldView.value'));
    }
  }.observes('*textFieldView.value'),

  _createListPane: function() {
    var isBusy = this.get('isBusy');
    var spinnerHeight = this.get('statusIndicatorHeight');

    this._listPane = SC.PickerPane.create({
      classNames: ['scui-combobox-list-pane', 'sc-menu'],
      acceptsKeyPane: NO,
      acceptsFirstResponder: NO,

      contentView: SC.View.extend({
        layout: { left: 0, right: 0, top: 0, bottom: 0 },
        childViews: 'listView spinnerView'.w(),
        
        listView: SC.ScrollView.extend({
          layout: { left: 0, right: 0, top: 0, bottom: isBusy ? spinnerHeight : 0 },
          hasHorizontalScroller: NO,
        
          contentView: SC.ListView.design({
            classNames: 'scui-combobox-list-view',
            layout: { left: 0, right: 0, top: 0, bottom: 0 },
            allowsMultipleSelection: NO,
            target: this,
            action: '_selectListItem', // do this when [Enter] is pressed, for example
            contentBinding: SC.Binding.from('filteredObjects', this).oneWay(),
            contentValueKey: this.get('nameKey'),
            hasContentIcon: this.get('iconKey') ? YES : NO,
            contentIconKey: this.get('iconKey'),
            selectionBinding: SC.Binding.from('_listSelection', this),
            localizeBinding: SC.Binding.from('localize', this).oneWay(),

            // A regular ListItemView, but with localization added
            exampleView: SCUI.LocalizableListItemView,
          
            // transparently notice mouseUp and use it as trigger
            // to close the list pane
            mouseUp: function() {
              var ret = arguments.callee.base.apply(this,arguments);
              var target = this.get('target');
              var action = this.get('action');
              if (target && action && target.invokeLater) {
                target.invokeLater(action);
              }
              return ret;
            }
          })
        }),

        spinnerView: SC.View.extend({
          classNames: 'scui-combobox-spinner-view',
          layout: { centerX: 0, bottom: 0, width: 100, height: spinnerHeight },
          isVisibleBinding: SC.Binding.from('isBusy', this).oneWay(),
          childViews: 'imageView messageView'.w(),
          
          imageView: SCUI.LoadingSpinnerView.extend({
            layout: { left: 0, top: 0, bottom: 0, width: 18 },
            theme: 'darkTrans',
            callCountBinding: SC.Binding.from('isBusy', this).oneWay().transform(function(value) {
              value = value ? 1 : 0;
              return value;
            })
          }),
          
          messageView: SC.LabelView.extend({
            layout: { left: 25, top: 0, bottom: 0, right: 0 },
            valueBinding: SC.Binding.from('status', this).oneWay().transform(function(value) {
              value = (value === SC.Record.BUSY_LOADING) ? "Loading...".loc() : "Refreshing...".loc(); // this view is only visible when status is busy
              return value;
            })
          })
        })
      }),

      // HACK: [JL] Override mouseDown to return NO since without this
      // Firefox won't detect clicks on the scroll buttons.
      // This disables pane-dragging functionality for the picker pane, but we
      // don't need that.
      mouseDown: function(evt) {
        arguments.callee.base.apply(this,arguments);
        return NO;
      }
    });

    this._listView = this._listPane.getPath('contentView.listView.contentView');
    this._listScrollView = this._listPane.getPath('contentView.listView');
  },

  /**
    Invoked whenever the contents of the drop down pane change.  This method
    autosizes the pane appropriately.
  */
  _updateListPaneLayout: function() {
    var rowHeight, length, width, height, frame, minHeight, maxHeight, spinnerHeight, isBusy;

    if (this._listView && this._listPane && this._listScrollView) {
      frame = this.get('frame');
      width = frame ? frame.width : 200;

      isBusy = this.get('isBusy');
      spinnerHeight = this.get('statusIndicatorHeight');
      rowHeight = this._listView.get('rowHeight') || 18;

      // even when list is empty, show at least one row's worth of height,
      // unless we're showing the busy indicator there
      length = this.getPath('filteredObjects.length') || (isBusy ? 0 : 1);

      height = (rowHeight * length) + (isBusy ? spinnerHeight : 0);
      height = Math.min(height, this.get('maxListHeight')); // limit to max height
      height = Math.max(height, this.get('minListHeight')); // but be sure it is always at least the min height

      this._listScrollView.adjust({ bottom: isBusy ? spinnerHeight : 0 });
      this._listPane.adjust({ width: width, height: height });
      this._listPane.updateLayout(); // force pane to re-render layout
      this._listPane.positionPane(); // since size has changed, force pane to recompute its position on the screen
    }
  },

  // default action for the list view
  _selectListItem: function() {
    var selection = this._listView ? this._listView.getPath('selection.firstObject') : null;
    if (selection) {
      this.set('selectedObject', selection);
    }
    this.hideList();
  },

  _sanitizeFilter: function(str){
    var specials, s;

    if (str) {
      specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
      ];
      
      s = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
      return str.replace(s, '\\$1');
    }
    return str;
  },

  _getObjectName: function(obj, nameKey, shouldLocalize) {
    var name = obj ? (nameKey ? (obj.get ? obj.get(nameKey) : obj[nameKey]) : obj) : null;

    // optionally localize
    if (shouldLocalize && name && name.loc) {
      name = name.loc();
    }
    
    return name;
  },

  _getObjectValue: function(obj, valueKey) {
    return obj ? (valueKey ? (obj.get ? obj.get(valueKey) : obj[valueKey]) : obj) : null;
  },

  // PRIVATE PROPERTIES
  
  _listPane: null,
  _listScrollView: null,
  _listView: null,
  _listSelection: null,
  
  _keyDown: NO,
  _shouldUpdateFilter: NO

});


/* >>>>>>>>>> BEGIN source/views/content_editable.js */
// ==========================================================================
// SCUI.ContentEditableView
// ==========================================================================
/*globals NodeFilter*/

sc_require('core');
sc_require('panes/context_menu_pane');

/** @class

  This view provides rich text editor functionality (RTE). It's a variation of
  the SC webView. It works be setting the body of the iframe to be 
  ContentEditable as well as attaching a mouseup, keyup and paste events on the 
  body of the iframe to detect the current state of text at the current mouse 
  position.

  @extends SC.WebView
  @author Mohammed Taher
  @version 0.914
  
  ==========
  = v.914 =
  ==========
  - Added indentOnTab option. This works by inserting white space
  according to the value on the tabSize option
  - Commented out querying indent/outdent as it's a buggy implemention.
  Querying them now will always return NO
  
  ==========
  = v.9131 =
  ==========
  - No longer explicity setting the scrolling attribute if allowScrolling is 
  YES (scroll bars were being rendered at all times) - COMMIT HAS BEEN REVERTED
  
  ==========
  = v0.913 =
  ==========
  - Improved inserHTML() function
  - Improved focus() function
  - New selectContent() function
  - Ability to attach a stylesheet to editor

  ==========
  = v0.912 =
  ==========
  - Better variable names
  - Querying indent/outdent values now works in FF
  - Slightly more optimized. (In the selectionXXXX properties, 
    this._document/this._editor was being accessed multiple times, 
    now it happens once at the beginning).
  - New helper functions. Trying to push browser code branching to such 
    functions.
    a. _getFrame
    b. _getDocument
    c. _getSelection
    d. _getSelectedElemented
  - Reversed isOpaque value
    
*/

SCUI.ContentEditableView = SC.WebView.extend(SC.Editable,
/** @scope SCUI.ContentEditableView.prototype */ {
  
  /**
    Value of the HTML inside the body of the iframe.
  */
  value: '',
  
  /** @private */
  valueBindingDefault: SC.Binding.single(),
  
  /**
    Set to NO to prevent scrolling in the iframe.
  */  
  allowScrolling: YES,
  
  /**
    Set to NO when the view needs to be transparent.
  */
  isOpaque: YES,

  /**
    Current selected content in the iframe.
  */
  selection: '',
  
  /**
    Read-only value
    The currently selected image
  */
  selectedImage: null,
  
  /**
    Read-only value
    The currently selected hyperlink
  */  

  selectedHyperlink: null,
  
  /**
    A view can be passed that grows/shrinks in dimensions as the ContentEditableView
    changes dimensions.
  */  
  attachedView: null,
  
  /**
    Read-only value
    OffsetWidth of the body of the iframe.
  */
  offsetWidth: null,
  
  /**
    Read-only value.
    OffsetHeight of the body of the iframe.
  */
  offsetHeight: null,
  
  /**
    Set to NO to allow dimensions of the view to change according to the HTML.
  */
  hasFixedDimensions: YES,
  
  /**
    A set of values to be applied to the editor when it loads up.
    Styles can be dashed or camelCase, both are acceptable.
    
    For example,
    
    { 'color': 'blue',
      'background-color': 'red' }
    
    OR
    
    { 'color': 'orange',
      'backgroundColor': 'green' }
  */
  inlineStyle: {},
  
  /**
    If set to YES, then HTML from iframe will be saved everytime isEditing is set
    to YES
  */  
  autoCommit: NO,
  
  /**
    Set to NO to prevent automatic cleaning of text inserted into editor
  */
  cleanInsertedText: YES,
  
  /**
    strip exta \n and \r
  */
  stripCrap: NO,
  
  /**
    CSS to style the edit content
  */
  styleSheetCSS: '',
  
  /**
    List of menu options to display on right click
  */
	rightClickMenuOptions: [],
	
	/**
	  Tab options
	*/
	indentOnTab: YES,
	tabSize: 2,
	
	displayProperties: ['value'],
	
	render: function(context, firstTime) {
    var value = this.get('value');
    var isOpaque = !this.get('isOpaque');
    var allowScrolling = this.get('allowScrolling') ? 'yes' : 'no';
    var frameBorder = isOpaque ? '0' : '1';
    var styleString = 'position: absolute; width: 100%; height: 100%; border: 0px; margin: 0px; padding: 0p;';
    
    if (firstTime) {
      context.push( '<iframe frameBorder="', frameBorder,
                    '" name="', this.get('frameName') );
        
      context.push( '" scrolling="', allowScrolling );
        
      context.push( '" src="" allowTransparency="', isOpaque, 
                    '" style="', styleString,
                    '"></iframe>' );
      
    } else if (this._document) {
      if (value !== this._document.body.innerHTML) {
        this._document.body.innerHTML = value;
        
      }
    }
  },
  
  didCreateLayer: function() {
    arguments.callee.base.apply(this,arguments);
    var f = this.$('iframe');
    SC.Event.add(f, 'load', this, this.editorSetup);
  },
  
  displayDidChange: function() {
    var doc = this._document;
    if (doc) {
      doc.body.contentEditable = this.get('isEnabled');
    }
    arguments.callee.base.apply(this,arguments);
  },
  
  willDestroyLayer: function() {         
    var doc = this._document;
    var docBody = doc.body;
    
    SC.Event.remove(docBody, 'mouseup', this, this.mouseUp);
    SC.Event.remove(docBody, 'keyup', this, this.keyUp);
    SC.Event.remove(docBody, 'paste', this, this.paste);
    if (this.get('indentOnTab')) {
      SC.Event.remove(docBody, 'keydown', this, this.keyDown);
    }
    
    
    SC.Event.remove(doc, 'click', this, this.focus);
    SC.Event.remove(this.$('iframe'), 'load', this, this.editorSetup);
    
    arguments.callee.base.apply(this,arguments);
  },
  
  editorSetup: function() {     
    // store the document property in a local variable for easy access
    this._iframe = this._getFrame();
    this._document = this._getDocument();
    if (SC.none(this._document)) {
      console.error('Curse your sudden but inevitable betrayal! Can\'t find a reference to the document object!');
      return;
    }
    
    var doc = this._document;
    var styleSheetCSS = this.get('styleSheetCSS');
    if (!(SC.none(styleSheetCSS) || styleSheetCSS === '')) {
      var head = doc.getElementsByTagName('head')[0];
      if (head) {
        var el = doc.createElement("style");
        el['type'] = "text/css";
        el.innerHTML = styleSheetCSS;
        head.appendChild(el);
        el = head = null; //clean up memory
      }
    }
    
    // set contentEditable to true... this is the heart and soul of the editor
    var value = this.get('value');
    var docBody = doc.body;
    docBody.contentEditable = true;
    
    if (!this.get('isOpaque')) {
      docBody.style.background = 'transparent';       
      // the sc-web-view adds a gray background to the WebView... removing in the
      // case isOpaque is NO
      this.$().setClass('sc-web-view', NO);
    }

    var inlineStyle = this.get('inlineStyle');
    var docBodyStyle = this._document.body.style;
    for (var key in inlineStyle) {
      if (inlineStyle.hasOwnProperty(key)) {  
        docBodyStyle[key.toString().camelize()] = inlineStyle[key];
      }
    }
    
    // we have to do this differently in FF and IE... execCommand('inserthtml', false, val) fails
    // in IE and frameBody.innerHTML is resulting in a FF bug
    if (SC.browser.msie || SC.browser.safari) {
      docBody.innerHTML = value;
    } else {
      this.insertHTML(value, NO);
    }

    // set min height beyond which ContentEditableView can't shrink if hasFixedDimensions is set to false
    if (!this.get('hasFixedDimensions')) {
      var height = this.get('layout').height;
      if (height) {
        this._minHeight = height;
      }
      
      var width = this.get('layout').width;
      if (width) {
        this._minWidth = width;
      }
    }

    // attach the required events
    SC.Event.add(docBody, 'mouseup', this, this.mouseUp);
    SC.Event.add(docBody, 'keyup', this, this.keyUp);
    SC.Event.add(docBody, 'paste', this, this.paste);
    if (this.get('indentOnTab')) {
      SC.Event.add(docBody, 'keydown', this, this.keyDown);
    }
    
    // there are certian cases where the body of the iframe won't have focus
    // but the user will be able to type... this happens when the user clicks on
    // the white space where there's no content. This event handler 
    // ensures that the body will receive focus when the user clicks on that area.
    SC.Event.add(this._document, 'click', this, this.focus);

		SC.Event.add(this._document, 'mousedown', this, this.mouseDown);
    
    // call the SC.WebView iframeDidLoad function to finish setting up
    this.iframeDidLoad();
    this.focus();
  },

	mouseDown: function(evt) {
		var menuOptions = this.get('rightClickMenuOptions');
		var numOptions = menuOptions.get('length');
		
		if (menuOptions.length > 0) {
			var pane = this.contextMenuView.create({
	      contentView: SC.View.design({}),
	      layout: { width: 200, height: (20 * numOptions) },
	      itemTitleKey: 'title',
	      itemTargetKey: 'target',
	      itemActionKey: 'action',
	      itemSeparatorKey: 'isSeparator',
	      itemIsEnabledKey: 'isEnabled',
	      items: menuOptions
	    });

	    pane.popup(this, evt);
		}
	},
	
	contextMenuView: SCUI.ContextMenuPane.extend({
		popup: function(anchorView, evt) {
	    if (!anchorView || !anchorView.isView) return NO;

	    if (evt && evt.button && (evt.which === 3 || (evt.ctrlKey && evt.which === 1))) {

	      // FIXME [JH2] This is sooo nasty. We should register this event with SC's rootResponder?
	      // After talking with charles we need to handle oncontextmenu events when we want to block
	      // the browsers context meuns. (SC does not handle oncontextmenu event.)
	      document.oncontextmenu = function() { return false; };
        
        // The way the MenuPane was being positioned didn't work when working in the context
        // of an iframe. Instead of calculating,
        //
        //          offsetX = evt.pageX - globalFrame.x;
        //          offsetY = evt.pageY - globalFrame.y;
        //
        // I'm using evt.pageX and evt.pageY only.
        //
        
	      var anchor = anchorView.isView ? anchorView.get('layer') : anchorView;

	      // Popup the menu pane
	      this.beginPropertyChanges();
	      var it = this.get('displayItems');
	      this.set('anchorElement', anchor) ;
	      this.set('anchor', anchorView);
	      this.set('preferType', SC.PICKER_MENU) ;
	      this.set('preferMatrix', [evt.pageX + 5, evt.pageY + 5, 1]) ;
	      this.endPropertyChanges();
	      this.append();
	      this.positionPane();
	      this.becomeKeyPane();

	      return YES;
	    }
	    else {
	      //document.oncontextmenu = null; // restore default browser context menu handling
	    }
	    return NO;
	  }
	}),

  keyUp: function(event) {
    SC.RunLoop.begin();

    switch (SC.FUNCTION_KEYS[event.keyCode]) {
      case 'left':
      case 'right':
      case 'up':
      case 'down':
        this.querySelection();
        break;
    } 
    
    if (!this.get('hasFixedDimensions')) {
      this.invokeLast(this._updateLayout);
    }
    this.set('isEditing', YES);
    
    SC.RunLoop.end();
  },
  
  keyDown: function(event) {
    SC.RunLoop.begin();
    
    var tabSize = this.get('tabSize');
    if (SC.typeOf(tabSize) !== SC.T_NUMBER) {
      // tabSize is not a number. Bail out and recover gracefully
      return;
    }
    
    var spaces = [];
    for (var i = 0; i < tabSize; i++) {
      spaces.push('\u00a0');
    }
    
    if (SC.FUNCTION_KEYS[event.keyCode] === 'tab') {
      event.preventDefault();
      this.insertHTML(spaces.join(''), NO);
    }
    
    SC.RunLoop.end();
  },

  mouseUp: function() {
    this._mouseUp = true;
    SC.RunLoop.begin();
    this.querySelection();
    if (!this.get('hasFixedDimensions')) {
      this.invokeLast(this._updateLayout);
    }
    
    this.set('isEditing', YES);
    SC.RunLoop.end();
  },

  paste: function() {
    SC.RunLoop.begin();

    this.querySelection();
    if (!this.get('hasFixedDimensions')) {
      this.invokeLast(this._updateLayout);
    }
    this.set('isEditing', YES);
    
    SC.RunLoop.end();
    return YES;
  },
  
  /** @property String */
  frameName: function() {
    return this.get('layerId') + '_frame' ;
  }.property('layerId').cacheable(),
  
  editorHTML: function(key, value) {
    var doc = this._document;
    if (!doc) return NO;
    
    if (value !== undefined) {
      doc.body.innerHTML = value;
      return YES;
    } else {
      if (this.get('cleanInsertedText')) {
        return this.cleanWordHTML(doc.body.innerHTML);
      } else {
        return doc.body.innerHTML;
      }
    }
  }.property(),
  
  selectionIsBold: function(key, val) {
    var editor = this._document ;
    if (!editor) return NO;
    
    if (val !== undefined) {
      if (editor.execCommand('bold', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    return this._document.queryCommandState('bold');
  }.property('selection').cacheable(),
  
  selectionIsItalicized: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('italic', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('italic');
  }.property('selection').cacheable(),
  
  selectionIsUnderlined: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('underline', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('underline');
  }.property('selection').cacheable(),
  
  // FIXME: [MT] queryCommandState('justifyXXXX') always returns fasle in safari...
  // find a workaround
  selectionIsCenterJustified: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('justifycenter', false, val)) {
        this.querySelection();
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('justifycenter');
  }.property('selection').cacheable(),
  
  selectionIsRightJustified: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('justifyright', false, val)) {
        this.querySelection();
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('justifyright');
  }.property('selection').cacheable(),
  
  selectionIsLeftJustified: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('justifyleft', false, val)) {
        this.querySelection();
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('justifyleft');
  }.property('selection').cacheable(),
  
  selectionIsFullJustified: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('justifyfull', false, val)) {
        this.querySelection();
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('justifyfull');
  }.property('selection').cacheable(),
  
  selectionIsOrderedList: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('insertorderedlist', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('insertorderedlist');
  }.property('selection').cacheable(),
  
  selectionIsUnorderedList: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('insertunorderedlist', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    return doc.queryCommandState('insertunorderedlist');
  }.property('selection').cacheable(),
  

  // indent/outdent have some sort of problem with every
  // browser. Check,
  // 
  // http://www.quirksmode.org/dom/execCommand.html
  // 
  // I would avoid using these for now and go with
  // indentOnTab
  selectionIsIndented: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('indent', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    if (SC.browser.msie) {
      return doc.queryCommandState('indent');
    } else {
      /*
      [MT] - Buggy... commeting out for now
      var elem = this._getSelectedElemented();
      if (!SC.none(elem)) {
        if (elem.style['marginLeft'] !== '') {
          return YES;
        }
      }
      */
      return NO;
    }
  }.property('selection').cacheable(),
  
  selectionIsOutdented: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('outdent', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    if (SC.browser.msie) {
      return doc.queryCommandState('outdent');
    } else {
      /*
      [MT] - Buggy... commeting out for now
      var elem = this._getSelectedElemented();
      if (!SC.none(elem)) {
        if (elem.style['marginLeft'] === '') {
          return YES;
        }
      }
      */
      return NO;
    }
  }.property('selection').cacheable(),
  
  selectionIsSubscript: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('subscript', false, val)) {
        this.set('isEditing', YES);
      }
    }

    return doc.queryCommandState('subscript');
  }.property('selection').cacheable(),
  
  selectionIsSuperscript: function(key, val) {
    var doc = this._document ;
    if (!doc) return NO;
    
    if (val !== undefined) {
      if (doc.execCommand('superscript', false, val)) {
        this.set('isEditing', YES);
      }
    }

    return doc.queryCommandState('superscript');
  }.property('selection').cacheable(),
  
  selectionFontName: function(key, val) {
    var doc = this._document ;
    if (!doc) return '';
    
    if (val !== undefined) {
      if (doc.execCommand('fontname', false, val)) {
        this.set('isEditing', YES);
      }
    }
    
    var name = doc.queryCommandValue('fontname') || '';
    return name;
  }.property('selection').cacheable(),
  
  selectionFontSize: function(key, value) {
    var frame = this._iframe;
    var doc = this._document;
    if (!doc) return '';
    
    if (value !== undefined) {
      
      var identifier = this.get('layerId') + '-fs-identifier';
      
      // apply unique string to font size to act as identifier
      if (doc.execCommand('fontsize', false, identifier)) {
        
        // get all newly created font tags
        var fontTags = doc.getElementsByTagName('font');
        for (var i = 0, j = fontTags.length; i < j; i++) {
          var fontTag = fontTags[i];
          
          // verify using identifier
          if (fontTag.size === identifier) {
            fontTag.size = '';
            fontTag.style.fontSize = value + 'px';
            
            var iterator = document.createNodeIterator(fontTag, 
                                                       NodeFilter.SHOW_ELEMENT,
                                                       null,
                                                       false);

            // iterate over children and remove their font sizes... they're 
            // inheriting that value from the parent node
            var node = iterator.nextNode();
            while (node) {
              if (node) {
                if (node !== fontTag && node.nodeName.toLowerCase() === 'font') {
                  node.style.fontSize = '';
                }
                node = iterator.nextNode();
              }
            }
      		}
        }
        this.set('isEditing', YES);
        return value;
      }      
    }
    
    // a bit buggy...
    var selection = frame.contentWindow.getSelection();
    if (selection) {
      if (selection.anchorNode && selection.focusNode) {
        var aNode = selection.anchorNode;
        var fNode = selection.focusNode;
        
        if (aNode.nodeType === 3 && fNode.nodeType === 3) {
          var aParentFontSize = aNode.parentNode.style.fontSize;
          var fParentFontSize = fNode.parentNode.style.fontSize; 
          
          if (aParentFontSize === fParentFontSize) {
            if (aParentFontSize.length >= 3) {
              return aParentFontSize.substring(0, aParentFontSize.length - 2);
            }
          }
        }
      }
    }
    
    return '';
  }.property('selection').cacheable(),
  
  selectionFontColor: function(key, value) {
    var doc = this._document ;
    if (!doc) return '';
    
    // for now execute this in non IE browsers...
    if (!SC.browser.msie) {
      if (value !== undefined) {
        if (doc.execCommand('forecolor', false, value)) {
          this.set('isEditing', YES);
        }
      }
      
      var color = SC.parseColor(doc.queryCommandValue('forecolor')) || '';
      return color;
    } 
    
    return '';
  }.property('selection').cacheable(),
  
  selectionBackgroundColor: function(key, value) {
    var doc = this._document ;
    if (!doc) return '';

    // for now execute this in non IE browsers...
    if (!SC.browser.msie) {
      if (value !== undefined) {
        if (doc.execCommand('hilitecolor', false, value)) {
          this.set('isEditing', YES);
        }
      }

      var color = this._document.queryCommandValue('hilitecolor');
      if (color !== 'transparent') {
        if (SC.parseColor(color)) {
          return SC.parseColor(color);
        }
      }
    } 

    return '';
  }.property('selection').cacheable(),
  
  hyperlinkValue: function(key, value) {
    var hyperlink = this.get('selectedHyperlink');
    if (!hyperlink) return '';
        
    if (!SC.none(value)) {
      this.set('isEditing', YES);
      hyperlink.href = value;
      return value;
      
    } else {
      return hyperlink.href;
      
    }
  }.property('selectedHyperlink').cacheable(),
  
  hyperlinkHoverValue: function(key, value) {
    var hyperlink = this.get('selectedHyperlink');
    if (!hyperlink) return '';
        
    if (value !== undefined) {
      this.set('isEditing', YES);
      hyperlink.title = value;
      return value;
      
    } else {
      return hyperlink.title;
      
    }
  }.property('selectedHyperlink').cacheable(),
  
  /**
    imageAlignment doesn't need to be updated everytime the selection changes... only 
    when the current selection is an image
  */
  imageAlignment: function(key, value) {
    var image = this.get('selectedImage');
    if (!image) return '';
    
    if (value !== undefined) {
      this.set('isEditing', YES);
      image.align = value;
      return value;
      
    } else { 
      return image.align;
      
    }
  }.property('selectedImage').cacheable(),

  focus: function(){
    if (!SC.none(this._document)) {
      this._document.body.focus();
      this.set('selection', '');
      this.querySelection();
    }
  },
  
  querySelection: function() {
    var frame = this._iframe;
    if (!frame) return;
    
    var selection = '';
    if (SC.browser.msie) {
      selection = this._iframe.document.selection.createRange().text;
      if (SC.none(selection)) {
        selection = '';
      }
    } else {
      var frameWindow = frame.contentWindow;
      selection = frameWindow.getSelection();
    }
    
    this.propertyWillChange('selection');
    this.set('selection', selection.toString());
    this.propertyDidChange('selection');
  },
  
  createLink: function(value) {
    var doc = this._document;
    var frame = this._iframe;
    if (!(doc && frame)) return NO;
    if (SC.none(value) || value === '') return NO;
    
    /*
      HACK: [MT] - This is an interesting hack... The problem with 
      execCommand('createlink') is it only tells you if hyperlink 
      creation was successful... it doesn't return the hyperlink that 
      was created. 
      
      To counter this problem, I'm creating a random string and
      assigning it as the href. If the frame.contentWindow.getSelection()
      method fails, I iterate over the children of the currently selected
      node and find the anchor tag with the crazy url and assign it as the
      currently selected hyperlink, after which I do a bit of cleanup
      and set value to the href property.
    */
    
    var radomUrl = '%@%@%@%@%@'.fmt('http://',
                                    this.get('frameName'),
                                    new Date().getTime(), 
                                    parseInt(Math.random()*100000, 0),
                                    '.com/');
    
    if (doc.execCommand('createlink', false, radomUrl)) {
      var node = frame.contentWindow.getSelection().focusNode;
      var hyperlink = node.parentNode;

      if (hyperlink.nodeName.toLowerCase() !== 'a') {
        var child;
        for (var x = 0, y = node.childNodes.length; x < y; x++) {
          child = node.childNodes[x];
          if (child.nodeName.toLowerCase() === 'a') {
            if (child.href === radomUrl) {
              hyperlink = child;
              break;
            }
          }
        }
      }

      hyperlink.href = value;
      
      this.set('selectedHyperlink', hyperlink);
      this.set('isEditing', YES);
      return YES;
    }
    
    return NO;
  },
  
  removeLink: function() {
    var doc = this._document;
    if (!doc) return NO;
    
    if (doc.execCommand('unlink', false, null)) {
      this.set('selectedHyperlink', null);
      this.set('isEditing', YES);
      return YES;
    }
    
    return NO;
  },
  
  // FIXME: [MT] Should do something similar to what's being done on
  // image creation (Assigning the newly created image to the selectedImage
  // property)
  insertImage: function(value) {
    var doc = this._document;
    if (!doc) return NO;
    if (SC.none(value) || value === '') return NO;
    
    if (doc.execCommand('insertimage', false, value)) {
      this.set('isEditing', YES);
      return YES;
    }

    return NO;
  },
  
  /**
    Inserts a snippet of HTML into the editor at the cursor location. If the
    editor is not in focus then it appens the HTML at the end of the document.
    
    @param {String} HTML to be inserted
    @param {Boolean} Optional boolean to determine if a single white space is to be 
    inserted after the HTML snippet. Defaults to YES. This is enabled to protect
    against certain FF bugs (e.g. If a user inserts HTML then presses space right
    away, the HTML will be removed.)
  */
  insertHTML: function(value, insertWhiteSpaceAfter) {
    var doc = this._document;
    if (!doc) return NO;
    if (SC.none(value) || value === '') return NO;
    
    if (SC.none(insertWhiteSpaceAfter) || insertWhiteSpaceAfter) {
      value += '\u00a0';
    }
        
    if (SC.browser.msie) {
      doc.selection.createRange().pasteHTML(value);       
      this.set('isEditing', YES);  
      return YES;
         
    } else {
      if (doc.execCommand('inserthtml', false, value)) {
        this.set('isEditing', YES);
        return YES;
      }
      return NO;
    }
  },
  
  /**
    Inserts a SC view into the editor by first converting the view into html
    then inserting it using insertHTML(). View objects, classes
    or path are all acceptable.

    For example,

    SC.View.design({
    })

    OR

    SC.View.create({
    })

    OR

    appName.pageName.viewName

    @param {View} SC view to be inserted
  */
  insertView: function(view) {
    if(SC.typeOf(view) === SC.T_STRING){
      // if nowShowing was set because the content was set directly, then 
      // do nothing.
      if (view === SC.CONTENT_SET_DIRECTLY) return ;

      // otherwise, if nowShowing is a non-empty string, try to find it...
      if (view && view.length>0) {
        if (view.indexOf('.')>0) {
          view = SC.objectForPropertyPath(view, null);
        } else {
          view = SC.objectForPropertyPath(view, this.get('page'));
        }
      }
    } else if (SC.typeOf(view) === SC.T_CLASS) {
      view = view.create();
    }

    var context = SC.RenderContext(view);
    context = context.begin('span');
    view.prepareContext(context, YES);
    context = context.end();
    context = context.join();

    var html;
    if (SC.browser.msie) {
      html = '<span contenteditable=false unselectable="on">' + context + '</span>';      
    } else {
      html = '<span contenteditable=false style="-moz-user-select: all">' + context + '</span>';
    }

    this.insertHTML(html);
  },
  
  /**  
    Filters out junk tags when copying/pasting from MS word. This function is called
    automatically everytime the users paste into the editor. 

    To prevent this, set cleanInsertedText to NO/false.

    @param {String} html html to be cleaned up and pasted into editor
    @returns {Boolean} if operation was successul or not 
  */
  cleanWordHTML: function(html) {
    // remove o tags
    html = html.replace(/\<o:p>\s*<\/o:p>/g, '');
    html = html.replace(/\<o:p>[\s\S]*?<\/o:p>/g, '&nbsp;');

    // remove w tags
    html = html.replace(/\s*<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '');
    html = html.replace(/\s*<w:[^>]*\/?>/gi, '');
    html = html.replace(/\s*<\/w:[^>]+>/gi, '');

    // remove m tags
    html = html.replace(/\s*<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '');
    html = html.replace(/\s*<m:[^>]*\/?>/gi, '');
    html = html.replace(/\s*<\/m:[^>]+>/gi, '');

    // remove mso- styles
    html = html.replace(/\s*mso-[^:]+:[^;"]+;?/gi, '');
    html = html.replace(/\s*mso-[^:]+:[^;]+"?/gi, '');

    // remove crappy MS styles
    html = html.replace(/\s*MARGIN: 0cm 0cm 0pt\s*;/gi, '');
    html = html.replace(/\s*MARGIN: 0cm 0cm 0pt\s*"/gi, "\"");
    html = html.replace(/\s*TEXT-INDENT: 0cm\s*;/gi, '');
    html = html.replace(/\s*TEXT-INDENT: 0cm\s*"/gi, "\"");
    html = html.replace(/\s*PAGE-BREAK-BEFORE: [^\s;]+;?"/gi, "\"");
    html = html.replace(/\s*FONT-VARIANT: [^\s;]+;?"/gi, "\"" );
    html = html.replace(/\s*tab-stops:[^;"]*;?/gi, '');
    html = html.replace(/\s*tab-stops:[^"]*/gi, '');

    // remove xml declarations
    html = html.replace(/\<\\?\?xml[^>]*>/gi, '');

    // remove lang and language tags
    html = html.replace(/\<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3");
    html = html.replace(/\<(\w[^>]*) language=([^ |>]*)([^>]*)/gi, "<$1$3");

    // remove onmouseover and onmouseout events
    html = html.replace(/\<(\w[^>]*) onmouseover="([^\"]*)"([^>]*)/gi, "<$1$3");
    html = html.replace(/\<(\w[^>]*) onmouseout="([^\"]*)"([^>]*)/gi, "<$1$3");

    // remove meta and link tags
    html = html.replace(/\<(meta|link)[^>]+>\s*/gi, '');

    return html;
  },
  
  /**
    Persists HTML from editor back to value property and sets
    the isEditing flag to false
    
    @returns {Boolean} if the operation was successul or not
  */
  commitEditing: function() {
    var doc = this._document;
    if (!doc) return NO;
    
    var value = doc.body.innerHTML;
    if (this.get('cleanInsertedText')) {
      value = this.cleanWordHTML(value);
    }

    if(this.get('stripCrap')){
      value = value.replace(/\r/g, '&#13;');
      value = value.replace(/\n/g, '&#10;');
    }

    this.set('value', value);
    this.set('isEditing', NO);
    return YES;
  },
  
  /**
    Selects the current content in editor
    
    @returns {Boolean} if the operation was successul or not
  */
  selectContent: function() {
    var doc = this._document;
    if (!doc) return NO;
    
    return doc.execCommand('selectall', false, null);
  },

  /**
    Adding an observer that checks if the current selection is an image
    or a hyperlink.
  */  
  selectionDidChange: function() {
    var node, 
        range, 
        currentImage = null, 
        currentHyperlink = null;
    
    if (SC.browser.msie) {
      var selection = this._iframe.document.selection;
      range = selection.createRange();
      
      if (range.length === 1) node = range.item();
      if (range.parentElement) node = range.parentElement(); 
      
    } else {            
      var targetIframeWindow = this._iframe.contentWindow;
      selection = targetIframeWindow.getSelection();    
      range = selection.getRangeAt(0);      
      node = range.startContainer.childNodes[range.startOffset] ;
      
      if (range.startContainer === range.endContainer) {      
        
        if (range.startContainer.parentNode.nodeName === 'A' && range.commonAncestorContiner !== node) {
          currentHyperlink = range.startContainer.parentNode;
        } else {
          currentHyperlink = null;
        }
                
      } else {
        currentHyperlink = null;
        
      }
    }
    
    if (node) {
      if (node.nodeName === 'IMG') {
        currentImage = node;
        
        if(node.parentNode.nodeName === 'A') currentHyperlink = node.parentNode;
        
      } else if (node.nodeName === 'A') {
        currentHyperlink = node;
        
      } else {
        currentImage = null;
        currentHyperlink = null;
        
      }
    }
    
    this.set('selectedImage', currentImage);
    this.set('selectedHyperlink', currentHyperlink);
    
  }.observes('selection'),

  isEditingDidChange: function() {
   if (this.get('autoCommit')) {
     this.commitEditing();
   }
  }.observes('isEditing'),
  
  /** @private */
  _updateAttachedViewLayout: function() {
    var width = this.get('offsetWidth');
    var height = this.get('offsetHeight');

    var view = this.get('attachedView');
    var layout = view.get('layout');
    layout = SC.merge(layout, { width: width, height: height });
    view.adjust(layout);
  },
  
  /** @private */
  _updateLayout: function() {
    var doc = this._document;
    if (!doc) return;
    
    var width, height;
    if (SC.browser.msie) {
      width = doc.body.scrollWidth;
      height = doc.body.scrollHeight;
    } else {
      width = doc.body.offsetWidth;
      height = doc.body.offsetHeight;
    }

    // make sure height/width doesn't shrink beyond the initial value when the
    // ContentEditableView is first created
    if (height < this._minHeight) height = this._minHeight;
    if (width < this._minWidth) width = this._minWidth;

    this.set('offsetWidth', width);
    this.set('offsetHeight', height);

    if (this.get('attachedView')) {
      this._updateAttachedViewLayout();
    }

    if (!this.get('hasFixedDimensions')) {
      var layout = this.get('layout');
      layout = SC.merge(layout, { width: width, height: height });

      this.propertyWillChange('layout');
      this.adjust(layout);
      this.propertyDidChange('layout');
    }
  },
  
  /** @private */
  _getFrame: function() {
    var frame;
    if (SC.browser.msie) {
      frame = document.frames(this.get('frameName'));
    } else {
      frame = this.$('iframe').firstObject();
    }
    
    if (!SC.none(frame)) return frame;
    return null;
  },
  
  /** @private */
  _getDocument: function() {
    var frame = this._getFrame();
    if (SC.none(frame)) return null;
    
    var editor;
    if (SC.browser.msie) {
      editor = frame.document;
    } else {
      editor = frame.contentDocument;
    }
    
    if (SC.none(editor)) return null;
    return editor;
  },
  
  /** @private */
  _getSelection: function() {
    var selection;
    if (SC.browser.msie) {
      selection = this._getDocument().selection;
    } else {
      selection = this._getFrame().contentWindow.getSelection();
    }
    return selection;
  },
  
  /** @private */
  _getSelectedElemented: function() {
    var selection = this._getSelection();
    var selectedElement;
    
    if (SC.browser.msie) {
      selectedElement = selection.createRange().parentElement();
    } else {
      var anchorNode = selection.anchorNode;
      var focusNode = selection.focusNode;
        
      if (anchorNode && focusNode) {
        if (anchorNode.nodeType === 3 && focusNode.nodeType === 3) {
          if (anchorNode.parentNode === focusNode.parentNode) {
            selectedElement = anchorNode.parentNode;
          }
        }
      }
    }
    
    return selectedElement;
  }
  
});


/* >>>>>>>>>> BEGIN source/views/disclosed.js */
// ===========================================================================
// SCUI.DisclosedView
// ===========================================================================
require('core');
/** @class

  This is a view that gives you the ability to collapse a containerView with a 
  slim disclosure titlebar.
  
  @author Josh Holt [JH2]

*/

SCUI.DisclosedView = SC.View.extend({
  /** @scope SCUI.DisclosedView.prototype */ 
  
  // ..........................................................
  //  KEY PROPERTIES
  // 
  
  classNames: ['scui-disclosed-view'],
  
  displayProperties: ['isOpen', 'statusIconName'],
  
  /* This is the view for the when we aren't collapsed. */
  contentView: null,
  
  /* The text displayed in the titlebar */
  title: '',
  
  /* The Description under the title */
  description: '',
  
  /* The Extra Icon that will sit beside the disclosure view */
  iconCSSName: '',
  
  /* The Extra Icon that will sit beside the disclosure view */
  statusIconName: '',
  
  // private version
  _contentView: null,
  
  /* This is the view for the when we are collapsed. */
  _collapsedView: SC.View,
  
  isOpen: YES,
  
  /* This is the default view for the titlebar */
  titleBar: SC.DisclosureView,
  
  /* The container to hold the content to be collapsed */
  containerView: SC.ContainerView,
  
  /* The default collapsed height (the titlebar will be set to the same height) */
  collapsedHeight: 44,
  
  /* The default expanded height */
  expandedHeight: 300,
  
  /* 
    The mode of operation for this view 
    You may specify one of the following modes:
    -- SCUI.DISCOLSED_STAND_ALONE * (Default)
    -- SCUI.DISCLOSED_LIST_DEPENDENT
  */
  mode: SCUI.DISCLOSED_STAND_ALONE,
  
  // ..........................................................
  // Methods
  // 
  
  init: function(){
    arguments.callee.base.apply(this,arguments);
    // this._setupView();
  },
  
  createChildViews: function(){
    var views=[], view;
    var contentView = this.get('contentView');
    var collapsibleContainerView;
    var that = this;
    
    view = this._titleBar = this.createChildView(this.titleBar.extend({
      layout: {top:0, left:5, right:5, height: that.get('collapsedHeight')},
      titleBinding: SC.binding('.title',this),
      descriptionBinding: SC.binding('.description',this),
      iconCSSNameBinding: SC.binding('.iconCSSName',this),
      statusIconNameBinding: SC.binding('.statusIconName',this),
      value: this.get('isOpen'),
      displayProperties: 'statusIconName'.w(),
      render: function(context, firstTime){
          context = context.begin('div').addClass('disclosure-inner');
          context = context.begin('div').addClass('disclosure-label');
          context = context.begin('img').attr({ src: SC.BLANK_IMAGE_URL, alt: "" }).addClass('button').end();
          context = context.begin('img').attr({ src: SC.BLANK_IMAGE_URL, alt: "" }).addClass('icon').addClass(this.iconCSSName).end();
          context = context.begin('img').attr({src: SC.BLANK_IMAGE_URL, alt: ""}).addClass('status').addClass(this.statusIconName).end();
          context = context.begin('span').addClass('title').push(this.get('displayTitle')).end();
          context.attr('title', this.description);
          context.attr('alt', this.description);
          context = context.end();
          context = context.end();
      },
      
      mouseDown: function(evt){
        if (evt.target.className !== 'button') return NO;
        else return YES;
      },
      
      _valueObserver: function() {
        if (this.owner && this.owner.toggle) this.owner.toggle(this.get('value'));
      }.observes('value')
      
      /*
        [JH2]
        Leaving this here in the event that we want to 
        auto close a disabled step.
      */
      
      // _statusObserver: function() {
      //   if (this.get('statusIconName') === 'never') {
      //     this.set('value',NO);
      //   }
      // }.observes('statusIconName')
      
    }),{rootElementPath: [0]});
    views.push(view);
    
    // setup the containerview for the contentView
    contentView = this.createChildView(contentView, {
      classNames: 'processing-step-settings'.w(), 
      layout: {top: that.get('collapsedHeight')-5, left: 5, right: 5},
      render: function(context, firstTime){
        arguments.callee.base.apply(this,arguments);
        if (firstTime) {
          context = context.begin('div').addClass('bottom-left-edge').push('').end();
          context = context.begin('div').addClass('bottom-right-edge').push('').end();
        }
      }
    });
    views.push(contentView);
    
    this.set('childViews',views);
    return this;
  },
  
  render: function(context, firstTime){
    this._setupView();
    arguments.callee.base.apply(this,arguments);
  },
  
  // ..........................................................
  // Actions ( Used when this view is in standalone mode )
  // 
  
  /*
    This method toggles between expanded and collapsed and is fired
    by an observer inside the extended disclosure view.
    
  */
  toggle: function(toggleValue){
    if (!toggleValue){
      this.set('isOpen',NO);
      if (this.get('mode') === SCUI.DISCLOSED_STAND_ALONE) {
        this._updateHeight(YES);
      } else if (this.owner && this.owner.collapse) {
        this.owner.collapse();
      } 
    }else{
      this.set('isOpen',YES);
      if (this.get('mode') === SCUI.DISCLOSED_STAND_ALONE) { 
        this._updateHeight();
      } else if (this.owner && this.owner.expand){
        this.owner.expand();
      }
    }
  },
  
  updateHeight: function(immediately, forceDefault) {
    if (immediately) this._updateHeight(forceDefault);
    else this.invokeLast(this._updateHeight);
    return this;
  },
  
  _updateHeight: function(forceDefault) {
    var height;
    if (!forceDefault) {        
      height = this.get('expandedHeight');
    } else {
      height = this.get('collapsedHeight');
    }
    this.adjust('height', height);
  },
  
  /*
    Setup the contentView that you pass in as a child view of this view.
  */
  _createChildViewIfNeeded: function(view){
    if (SC.typeOf(view) === SC.T_CLASS){
      return this.createChildView(view);
    }
    else{
      return view;
    }
  },
  
  _setupView: function(){
    var isOpen = this.get('isOpen');
    var mode = this.get('mode');
    if (isOpen) {
      if (this.get('mode') === SCUI.DISCLOSED_STAND_ALONE) this.updateHeight();
    }else{
      if (this.get('mode') === SCUI.DISCLOSED_STAND_ALONE) this._updateHeight(YES);
    }
  }
  
});


/* >>>>>>>>>> BEGIN source/views/loading_spinner.js */
// ========================================================================
// SCUI.LoadingSpinnerView
// ========================================================================

/**

  Implements a PNG based animated loading spinner.
  The animation is simulated, offering the benefit of using a PNG sprite for
  the actual image so that more than 256 colors and transparency may be used.

  How to use:
    {{{
    var spinner=SCUI.LoadingSpinnerView.create({
      theme:'lightTrans',
      layout:{top:0,left:0,width:50,height:50}
    });
    
    var parent = MyApp.getPath('path_to_parent_view');
    spinner.appendTo(parent);
    }}}

  @extends SC.View
  @author Alex Percsi

*/

SCUI.LoadingSpinnerView = SC.View.extend({

  layout: {left:0,right:0,top:0,bottom:0},

  //Number of frames in the PNG sprite
  totalFrames:28,
  
  //Number of millisesconds to display each frame
  frameChangeInterval:200,
  
  //+1 for every append call, -1 for every remove call
  callCount:0,
  
  //call this method to show the spinner. Pass in the view you want to append the spinner to. 
  //The method will return a reference to the spinner.
  
  //make parentView optional.
  appendTo: function(parentView){
    if (this.get('callCount')===0)
    {
      parentView.appendChild(this);
    }
    this.set('isVisible',true);
    //increase append count on next runloop to make sure view has finished appending.
    this.invokeLater(function(){this.set('callCount',this.get('callCount')+1);});
    return this;
  },
  
  //Call this method to hide the spinner. 
  //Note that the spinner will only hide once all calls to append have been balanced by an equal number of calls to remove.
  remove: function(){
    this.set('callCount',this.get('callCount')-1);
    if (this.get('callCount')<=0){
      //stop animation
      this.set('_state',SCUI.LoadingSpinnerView.STOPPED);
      this.get('parentView').removeChild(this);
      this.destroy();
    }
  },
  
  //starts the animation if callCount >= 0
  callCountDidChange: function(){
    //If spinner is in a page start the animation (if needed)
    if (this.get('parentView')!==null)
    {
      if (this.get('_state')===SCUI.LoadingSpinnerView.STOPPED && this.get('callCount')>0)
      {
        this.set('isVisible',true);
        this.set('_state',SCUI.LoadingSpinnerView.PLAYING);
        this.get('spinnerView').nextFrame();
      }
    }
    //handle the case where the callCount is changed externally
    if (this.get('callCount')<=0){
      this.set('isVisible',false);
      this.set('_state',SCUI.LoadingSpinnerView.STOPPED);
    }
  }.observes('callCount'),
  
  //SCUI includes the following themes by default: darkTrans, lightTrans, darkSolidAqua, darkSolidWhite, lightSolidBlack, lightSolidGreen.
  //You can add your own themes by creating a CSS class with the name of the theme and specifying a background-image with the sprite
  //containing all the animation frames.
  theme: 'lightTrans',
  
  childViews: 'spinnerView'.w(),
  
  spinnerView: SC.View.design({
    layout:{centerX:0,centerY:0,height:18,width:18},
    classNames:['loadingSpinner'],
    
    currentFrame:0,
    
    frameChangeInterval: 200,
    
    _state:null,
    
    init:function(){
      arguments.callee.base.apply(this,arguments);
      this.get('classNames').push(this.getPath('parentView.theme'));
      this.set('frameChangeInterval',this.getPath('parentView.frameChangeInterval'));
      this.set('_state',this.getPath('parentView._state'));
    },
    
    nextFrame:function(){
      var currentFrame=this.get('currentFrame');
      var offsetY=0-this.get('layout').height*currentFrame;
      this.$().css('background-position','0px %@1px'.fmt(offsetY));
      //schedule next frame if animation is still supposed to play
      if (this.get('currentState')===SCUI.LoadingSpinnerView.PLAYING)
      {
        this.invokeLater(function(){this.nextFrame();},this.get('frameChangeInterval'));  
      }
      currentFrame+=1;
      if (currentFrame===this.getPath('parentView.totalFrames'))
      {
        currentFrame=0;
      }
      this.set('currentFrame',currentFrame);
    },
    
    currentState: function(){
      return this.getPath('parentView._state');
    }.property()
  }),
  
  _state: 'STOPPED'

});

SC.mixin(SCUI.LoadingSpinnerView,{
  PLAYING: 'PLAYING',
  STOPPED: 'STOPPED'
});


/* >>>>>>>>>> BEGIN source/views/select_field_tab.js */
// ==========================================================================
// Project:   SCUI.SelectFieldTab
// ==========================================================================
/*globals SCUI */

/** @class

  this view acts just like tab view but instead of a segmented button
  uses a select field view to switch views....

  
  @extends SC.View
*/

SCUI.SelectFieldTab = SC.View.extend(
/** @scope SCUI.SelectFieldTab.prototype */ {
  
  classNames: ['scui-select-field-tab-view'],
  
  displayProperties: ['nowShowing'],

  // ..........................................................
  // PROPERTIES
  // 

  nowShowing: null,

  items: [],

  isEnabled: YES,

  itemTitleKey: null,
  itemValueKey: null,
  itemIsEnabledKey: null,
  itemIconKey: null,
  itemWidthKey: null,
  itemToolTipKey: null,

  // ..........................................................
  // FORWARDING PROPERTIES
  // 

  // forward important changes on to child views
  _tab_nowShowingDidChange: function() {
    var v = this.get('nowShowing');
    this.get('containerView').set('nowShowing',v);
    this.get('selectFieldView').set('value',v);
    return this ;
  }.observes('nowShowing'),

  _tab_itemsDidChange: function() {
    this.get('selectFieldView').set('items', this.get('items'));
    return this ;    
  }.observes('items'),

  _isEnabledDidChange: function() {
    var isEnabled = this.get('isEnabled');

    if (this.containerView && this.containerView.set) {
      this.containerView.set('isEnabled', isEnabled);
    }
    
    if (this.selectFieldView && this.selectFieldView.set) {
      this.selectFieldView.set('isEnabled', isEnabled);
    }
  }.observes('isEnabled'),

  /** @private
    Restore userDefault key if set.
  */
  init: function() {
    arguments.callee.base.apply(this,arguments);
    this._tab_nowShowingDidChange()._tab_itemsDidChange();
  },

  createChildViews: function() {
    var childViews = [], view, ContainerView ;
    var isEnabled = this.get('isEnabled');

    ContainerView = this.containerView.extend({
      layout: { top:24, left:0, right:0, bottom: 0 }
    });

    view = this.containerView = this.createChildView(ContainerView, { isEnabled: isEnabled }) ;
    childViews.push(view);

    view = this.selectFieldView = this.createChildView(this.selectFieldView, { isEnabled: isEnabled }) ;
    childViews.push(view);

    this.set('childViews', childViews);
    return this; 
  },

  // ..........................................................
  // COMPONENT VIEWS
  // 

  /**
    The containerView managed by this tab view.  Note that TabView uses a 
    custom container view.  You can access this view but you cannot change 
    it.
  */
  containerView: SC.ContainerView,

  /**
    The selectFieldView managed by this tab view.  Note that this TabView uses
    a custom segmented view.  You can access this view but you cannot change
    it.
  */
  selectFieldView: SC.SelectFieldView.extend({
    layout: { left: 4, right: 0, height: 24 },

    //litte items => objects alias so I can use the same properties as a tab view...
    items: function(key, value){
      if(value === undefined){
        return this.get('objects');
      }
      else{
        return this.set('objects', value);
      }
    }.property('objects').cacheable(),

    itemTitleKey: function(key, value){
      if(value === undefined){
        return this.get('nameKey');
      }
      else{
        return this.set('nameKey', value);
      }
    }.property('nameKey').cacheable(),

    itemValueKey: function(key, value){
      if(value === undefined){
        return this.get('valueKey');
      }
      else{
        return this.set('valueKey', value);
      }
    }.property('valueKey').cacheable(),

    /** @private
      When the value changes, update the parentView's value as well.
    */
    _scui_select_field_valueDidChange: function() {
      var pv = this.get('parentView');
      if (pv) pv.set('nowShowing', this.get('value'));
      this.set('layerNeedsUpdate', YES) ;
      this.invokeOnce(this.updateLayerIfNeeded) ;
    }.observes('value'),

    init: function() {
      // before we setup the rest of the view, copy key config properties 
      // from the owner view...
      var pv = this.get('parentView');
      if (pv) {
        SC._TAB_ITEM_KEYS.forEach(function(k) { this[SCUI._SELECT_TAB_TRANSLATOR[k]] = pv.get(k); }, this);
      }
      return arguments.callee.base.apply(this,arguments);
    }
  })
});

SCUI._SELECT_TAB_TRANSLATOR = {itemTitleKey: 'nameKey', itemValueKey: 'valueKey', items: 'objects'};


/* >>>>>>>>>> BEGIN source/views/stepper.js */
// ==========================================================================
// SCUI.StepperView
// ==========================================================================

/** @class

  This view renders a stepper control button for incrementing/decrementing 
  values in a bound text field.
  
  To use bind the value of this view to the value of text field or label.

  @extends SC.View
  @author Brandon Blatnick
*/

SCUI.StepperView = SC.View.extend(
  /** @scope SC.CheckboxView.prototype */ {

  layout: { top: 0, left: 0, width: 19, height: 27 },
  
  /* Value to be binded to apprioprate label or text field */
  value: 0,
  
  /* amount to increment or decrement upon clicking stepper */
  increment: 1,
  
  /* max value allowed, infinity if not set */
  max: null,
  
  /* min value allowed, neg infinity if not set */
  min: null,
  
  /* if value should wraparound to the min if max is reached (and vise versa) */
  valueWraps: NO,

  createChildViews: function() {
    var childViews = [];
    var value = this.get('value');
    var increment = this.get('increment');
    var that = this;

    var view = this.createChildView(SC.ButtonView.design({
      classNames: ['scui-stepper-view-top'],
      layout: { top: 0, left: 0, width: 19, height: 13 },
      mouseUp: function() {
        arguments.callee.base.apply(this,arguments);
        var value = that.get('value');
        value = value - 0; // make sure its a number
        var max = that.get('max');
        value = value + increment;
        var wraps = that.get('valueWraps');
        
        if (max === null || value <= max) that.set('value', value); // should == to check for null and undefined
        else if (wraps) {
          var min = that.get('min');
          if (min !== null) { // should be != to check for null and undefined
            value = value - max - increment;
            value = value + min;
            that.set('value', value);
          }
        }
      }
    }));
    childViews.push(view);

    view = this.createChildView(SC.ButtonView.design({
      classNames: ['scui-stepper-view-bottom'],
      layout: { top: 14, left: 0, width: 19, height: 13 },
      mouseUp: function() {
        arguments.callee.base.apply(this,arguments);
        var value = that.get('value');
        value = value - 0; // make sure its a number
        var min = that.get('min');
        value = value - increment;
        var wraps = that.get('valueWraps');
        
        if (min === null || value >= min) that.set('value', value); // should be == to check for null and undefined
        else if (wraps) {
          var max = that.get('max');
          if (max !== null) { // should be != to check for null and undefined
            value = min - value - increment;
            value = max - value;
            that.set('value', value);
          }
        }
      }
    }));
    childViews.push(view);

    this.set('childViews', childViews);
  }
});


/* >>>>>>>>>> BEGIN source/views/upload.js */
// ========================================================================
// SCUI.UploadView
// ========================================================================

/** @class

  A simple view that allows the user to upload a file to a specific service.
  
  @extends SC.View
  @author Mohammed Taher
  @author Evin Grano
*/

SCUI.UploadView = SC.View.extend(
/** @scope Scui.Upload.prototype */ {
  
  /**
    Read-only value of the current selected file. In IE, this will include
    the full path whereas with all other browsers, it will only be the name of 
    the file. If no file is selected, this will be set to null.
  */
  value: null,
  
  /**
    URI of service/page the file is being uploaded to
  */
  uploadTarget: null,
  
  /**
    A read-only status of the current upload. Can be one of 3 values,
      1. 'READY'
      2. 'BUSY'
      3. 'DONE'
  */
  status: '',
  
  /**
    The value that will be assigned to the name attribute of the input
  */
  inputName: "Filedata",
  
  displayProperties: 'uploadTarget'.w(),

  render: function(context, firstTime) {
    var frameId = this.get('layerId') + 'Frame';
    var uploadTarget = this.get('uploadTarget');
    var label = this.get('label');
    var inputName = this.get('inputName');
    
    if (firstTime) {
      context.push('<form method="post" enctype="multipart/form-data" target="' + frameId + '" action="' + uploadTarget + '">');
      context.push('<input type="file" name="' + inputName + '" />');
      context.push('</form>');
      context.push('<iframe frameborder="0" id="' + frameId + '" name="' + frameId + '" style="width:0; height:0;"></iframe>');
      
    } else {
      var f = this._getForm();
      if (f) f.action = uploadTarget;
    }
    arguments.callee.base.apply(this,arguments);
  },
  
  didCreateLayer: function() {
    arguments.callee.base.apply(this,arguments);
    var frame = this.$('iframe');
    var input = this.$('input');
    
    SC.Event.add(frame, 'load', this, this._uploadDone);
    SC.Event.add(input, 'change', this, this._checkInputValue);
    
    this.set('status', SCUI.READY);
  },
  
  willDestroyLayer: function() {
    var frame = this.$('iframe');
    var input = this.$('input');
    
    SC.Event.remove(frame, 'load', this, this._uploadDone);
    SC.Event.remove(input, 'change', this, this._checkInputValue);
    arguments.callee.base.apply(this,arguments);
  },
  
  /**
    Starts the file upload (by submitting the form) and alters the status from READY to BUSY.
  */
  startUpload: function() {
    var f = this._getForm();
    if (f) {
      f.submit();
      this.set('status', SCUI.BUSY);
    }
  },
  
  /**
    Clears the file upload by regenerating the HTML. This is guaranateed
    to work across all browsers. Also resets the status to READY.
  */
  clearFileUpload: function() {
    var f = this._getForm();
    if (f) {
      
      // remove event before calling f.innerHTML = f.innerHTML
      var input = this.$('input');
      SC.Event.remove(input, 'change', this, this._checkInputValue);
        
      f.innerHTML = f.innerHTML;
      this.set('status', SCUI.READY);
      this.set('value', null);
      
      // readd event
      input = this.$('input');
      SC.Event.add(input, 'change', this, this._checkInputValue);
    }
  },
  
  /**
    Returns true if a file has been chosen to be uploaded, otherwise returns
    false.
    
    @returns {Boolean} YES if a file is selected, NO if not
  */
  validateFileSelection: function() {
    var value = this.get('value');
    if (value) {
      return YES;
    }
    return NO;
  },
  
  /**
    This function is called when the upload is done and the iframe loads. It'll
    change the status from BUSY to DONE.
  */
  _uploadDone: function() {
    SC.RunLoop.begin();
    this.set('status', SCUI.DONE);
    SC.RunLoop.end();
  },
  
  /**
    This function is called when the value of the input changes (after the user hits the browse
    button and selects a file).
  */
  _checkInputValue: function() {
    SC.RunLoop.begin();
    var input = this._getInput();
    this.set('value', input.value);
    SC.RunLoop.end();
  },
  
  _getForm: function(){
    var forms = this.$('form');
    if (forms && forms.length > 0) return forms.get(0);
    return null;
  },
  
  _getInput: function() {
    var inputs = this.$('input');
    if (inputs && inputs.length > 0) return inputs.get(0);
    return null;
  }

});


/* >>>>>>>>>> BEGIN bundle_loaded.js */
; if ((typeof SC !== 'undefined') && SC && SC.bundleDidLoad) SC.bundleDidLoad('scui/foundation');
