/*globals SCUI */

sc_require('views/widget_container');
sc_require('mixins/dashboard_delegate');

/** @class

  This is an overridden SC.CollectionView as a container for dashboard widgets.

  @extends SC.CollectionView
  @author Jonathan Lewis
*/

SCUI.DashboardView = SC.View.extend( SCUI.DashboardDelegate, {
  
  // PUBLIC PROPERTIES
  
  classNames: 'scui-dashboard-view',

  content: null,

  acceptsFirstResponder: YES,
  
  canDeleteContent: NO,
  
  widgetContainerView: SCUI.WidgetContainerView,
  
  delegate: null,
  
  dashboardDelegate: function() {
    var del = this.get('delegate');
    var content = this.get('content');
    return this.delegateFor('isDashboardDelegate', del, content);
  }.property('delegate', 'content').cacheable(),

  // PUBLIC METHODS

  didCreateLayer: function() {
    arguments.callee.base.apply(this,arguments);
    this._contentDidChange(); // force an init
  },

  beginManaging: function() {
    this.setIfChanged('canDeleteContent', YES);
  },
  
  endManaging: function() {
    this.setIfChanged('canDeleteContent', NO);
  },
  
  deleteWidget: function(widget) {
    var content = this.get('content');
    var del = this.get('dashboardDelegate');
    
    // let the delegate handle deletion first. If it doesn't we'll handle it here
    if ((del && !del.dashboardDeleteWidget(this, widget)) || !del) {
      if (content && content.removeObject) {
        content.removeObject(widget);
      }
    }
  },

  mouseDown: function(evt) {
    var itemView, content, item;

    // Since a mouse down could be the start of a drag, save all
    // the data we'll need for it
    this._dragData = null;
    if (evt && evt.which === 1) { // left mouse button
      itemView = this._itemViewForEvent(evt);

      if (itemView && !itemView.getPath('content.isLocked')) { // only start dragging if widget isn't locked
        this._dragData = SC.clone(itemView.get('layout'));
        this._dragData.startPageX = evt.pageX;
        this._dragData.startPageY = evt.pageY;
        this._dragData.view = itemView;
        this._dragData.didMove = NO; // haven't moved yet
      }
    }
    
    return YES;
  },
  
  mouseDragged: function(evt) {
    var dX, dY;

    // We're in the middle of a drag, so adjust the view using the current drag delta
    if (this._dragData) {
      this._dragData.didMove = YES; // so that mouseUp knows whether to report the new position.
      
      dX = evt.pageX - this._dragData.startPageX;
      dY = evt.pageY - this._dragData.startPageY;
      this._dragData.view.adjust({ left: this._dragData.left + dX, top: this._dragData.top + dY });
    }

    return YES;
  },
  
  mouseUp: function(evt) {
    var content, frame, finalPos, del;

    // If this mouse up comes at the end of a drag of a widget
    // view, try to update the widget's model with new position
    if (this._dragData && this._dragData.didMove) {
      content = this._dragData.view.get('content');
      frame = this._dragData.view.get('frame');

      // try to update the widget data model with the new position
      if (content && frame) {
        finalPos = { x: frame.x, y: frame.y };
        this._setItemPosition(content, finalPos);
        
        if (content.widgetDidMove) {
          content.widgetDidMove();
          
          del = this.get('dashboardDelegate');
          if (del && del.dashboardWidgetDidMove) {
            del.dashboardWidgetDidMove(this, content);
          }
        }
      }
    }

    this._dragData = null; // clean up
    return YES;
  },

  // PRIVATE METHODS
  
  _contentDidChange: function() {
    this.invokeOnce('_updateItemViews');
  }.observes('*content.[]'),
  
  _canDeleteContentDidChange: function() {
    var canDelete = this.get('canDeleteContent');
    var itemViews = this._itemViews || [];
    itemViews.forEach(function(v) {
      v.setIfChanged('canDeleteWidget', canDelete);
    });
  }.observes('canDeleteContent'),

  _updateItemViews: function() {
    var content = this.get('content');
    var cache = this._itemViewCache || {};
    var finalItemViews = [];
    var finalItemViewCache = {};
    var del = this.get('dashboardDelegate');
    var canDeleteContent = this.get('canDeleteContent');
    var widgetContainerViewClass = this.get('widgetContainerView');
    var itemViewsToAdd = [], itemViewsToRemove = [];
    var that = this;
    var widgetView, editView, key, viewKey, widgetContainerView, attrs, i;

    if (content && content.isEnumerable) {
      content.forEach(function(item, idx) {
        key = SC.guidFor(item);
        widgetContainerView = cache[key]; // see if we already have a widget view for this item

        // if not, create a new one
        if (!widgetContainerView) {
          attrs = {
            widgetViewClass: del.dashboardWidgetViewFor(that, content, idx, item) || item.get(item.get('widgetViewClassKey')),
            widgetEditViewClass: del.dashboardWidgetEditViewFor(that, content, idx, item) || item.get(item.get('widgetEditViewClassKey')),
            canDeleteWidget: canDeleteContent,
            content: item,
            owner: that,
            displayDelegate: that,
            dashboardDelegate: del,
            layout: that._layoutForItemView(item),
            layerId: '%@-%@'.fmt(SC.guidFor(that), key)
          };

          widgetContainerView = that.createChildView(widgetContainerViewClass, attrs);
        }

        finalItemViews.push(widgetContainerView);
        finalItemViewCache[key] = widgetContainerView;
      });
    }

    if (!finalItemViews.isEqual(this._itemViews)) {
      this.beginPropertyChanges();
    
      this.removeAllChildren();
    
      finalItemViews.forEach(function(itemView) {
        that.appendChild(itemView);
      });

      // clean up old views
      this._itemViews.forEach(function(itemView) {
        if (finalItemViews.indexOf(itemView) < 0) {
          itemView.set('content', null);
        }
      });

      this.endPropertyChanges();
    }

    this._itemViews = finalItemViews;
    this._itemViewCache = finalItemViewCache;
  },

  _layoutForItemView: function(item) {
    var layout = null, pos, size;

    if (item) {
      pos = this._getItemPosition(item) || { x: 20, y: 20 };
      size = this._getItemSize(item) || { width: 300, height: 100 };
      layout = { left: pos.x, top: pos.y, width: size.width, height: size.height };
    }
    return layout;
  },

  /** 
    Find the first content item view for the passed event.
    
    This method will go up the view chain, starting with the view that was the 
    target of the passed event, looking for a child item.  This will become 
    the view that is selected by the mouse event.
    
    This method only works for mouseDown & mouseUp events.  mouseMoved events 
    do not have a target.
    
    @param {SC.Event} evt An event
    @returns {SC.View} the item view or null
  */
  _itemViewForEvent: function(evt) {
    var responder = this.getPath('pane.rootResponder') ;
    if (!responder) return null ; // fast path
    
    var base    = SC.guidFor(this) + '-',
        baseLen = base.length,
        element = evt.target,
        layer   = this.get('layer'),
        id, key, itemView = null;

    // walk up the element hierarchy until we find this or an element with an
    // id matching the base guid (i.e. a collection item)
    while (element && element !== document && element !== layer) {
      id = element ? SC.$(element).attr('id') : null;
      
      if ((id.length > base.length) && (id.indexOf(base) === 0)) {
        key = id.slice(id.lastIndexOf('-') + 1);

        if (itemView = this._itemViewCache[key]) {
          break;
        }
      }

      element = element.parentNode; 
    }

    return itemView;
  },

  /**
    Encapsulates the standard way the dashboard attempts to extract the last
    position from the dashboard element.
    Returns null if unsuccessful.
  */
  _getItemPosition: function(item) {
    var posKey, pos;

    if (item) {
      posKey = item.get('positionKey') || 'position';
      pos = item.get(posKey);
      if (pos) {
        return { x: (parseFloat(pos.x) || 0), y: (parseFloat(pos.y) || 0) };
      }
    }

    return null;
  },
  
  /**
    Encapsulates the standard way the dashboard attempts to store the last
    position on a dashboard element.
  */
  _setItemPosition: function(item, pos) {
    var posKey;

    if (item) {
      posKey = item.get('positionKey') || 'position';
      item.set(posKey, pos);
    }
  },

  _getItemSize: function(item) {
    var sizeKey, size;

    if (item) {
      sizeKey = item.get('sizeKey');
      size = sizeKey ? item.get(sizeKey) : null;
      if (size) {
        return { width: (parseFloat(size.width) || 0), height: (parseFloat(size.height) || 0) };
      }
    }
    
    return null;
  },
  
  _setItemSize: function(item, size) {
    var sizeKey;
    
    if (item) {
      sizeKey = item.get('sizeKey');
      if (sizeKey) {
        item.set(sizeKey, size);
      }
    }
  },

  // PRIVATE PROPERTIES
  
  _itemViewCache: {},
  _itemViews: []

});

