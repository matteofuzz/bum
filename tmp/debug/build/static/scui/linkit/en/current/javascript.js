/* >>>>>>>>>> BEGIN source/core.js */
// ==========================================================================
// LinkIt
// ==========================================================================

/** @class

  This is the grouping where all utility functions will live

  @extends SC.Object
  @author Evin Grano
  @version: 0.1
*/
LinkIt = SC.Object.create({
  // CONST
  ROUND: 'round',
  
  // Drag Types
  OUTPUT_TERMINAL: 'LinkIt.TerminalOutput',
  INPUT_TERMINAL: 'LinkIt.TerminalInput',
  
  // Respond to Linking
  NEVER: 'never',
  DIRECTIONAL: 'dir',
  INVERSE_DIRECTIONAL: 'idir',
  ALWAYS: 'always',
  
  // Terminals Drop State
  INVITE: 'invite',
  ACCEPT: 'accept',
  
  // Line Styling
  HORIZONTAL_CURVED: 'hcurved',
  VERTICAL_CURVED: 'vcurved',
  STRAIGHT: 'straight',
  PIPES: 'pipes',
  
  /**
    See log() method below.  For development purposes, many methods in LinkIt
    log messages to LinkIt.log() instead of console.log() to give us a central place
    to turn console messages on/off.  LinkIt.log() checks this setting prior to
    logging the messages to the console.
  */
  logToConsole: YES,
  
  /**  
    Utility Functions
  */
  getLayer: function(view){
    if (view.kindOf(LinkIt.CanvasView)) {
      return view;
    }
    else {
      var parent = view.get('parentView');
      if (parent) {
        return this.getLayer(parent);
      }
      else {
        LinkIt.log('Error: No layer to be found!');
      }
    }
    return null;
  },
  
  getContainer: function(view){
    if (view.kindOf(LinkIt.NodeContainerView)) {
      return view;
    }
    else {
      var parent = view.get('parentView');
      if (parent) {
        return this.getContainer(parent);
      }
      else {
        LinkIt.log('Error: No Container To Be Found!');
      } 
    }
    return null;
  },
  
  genLinkID: function(link) {
    if (link) {
      var startNode = link.get('startNode');
      var startTerm = link.get('startTerminal');
      var endNode = link.get('endNode');
      var endTerm = link.get('endTerminal');
      var startID = [SC.guidFor(startNode), startTerm].join('_');
      var endID = [SC.guidFor(endNode), endTerm].join('_');
      return (startID < endID) ? [startID, endID].join('_') : [endID, startID].join('_');
    }
    return '';
  },
  
  /**
    Many LinkIt methods call here to log to the console so that we have a central
    place for turning console logging on/off.  For debugging purposes.
  */
  log: function(message) {
    if (this.logToConsole) {
      console.log(message);
    }
  }
  
});


/* >>>>>>>>>> BEGIN source/mixins/link.js */
/** @class

  This is the canvas tag that draws the line on the screen

  @extends SC.View
  @author Evin Grano
  @version 0.1
*/

LinkIt.Link = {

  // PUBLIC PROPERTIES
  
  isSelected: NO,

  /**
    Default link drawing style
  */
  linkStyle: {
    cap: LinkIt.ROUND,
    width: 3, // Default: 3 pixels
    color: '#ADD8E6',
    lineStyle: LinkIt.VERTICAL_CURVED
  },
  
  selectionColor: '#FFFF64',
  selectionWidth: 7,
  
  // Graph-Related Properties

  /**
    Object mixing in LinkIt.Node
  */
  startNode: null,

  /**
    String terminal identifier
  */
  startTerminal: null,

  /**
    Object mixing in LinkIt.Node
  */
  endNode: null,

  /**
    String terminal identifier
  */
  endTerminal: null,

  // Draw-Related Properties

  startPt: null,
  endPt: null,

  // PUBLIC METHODS

  drawLink: function(context){
    var linkStyle = this.get('linkStyle') || {};
    var lineStyle = (linkStyle ? linkStyle.lineStyle : LinkIt.STRAIGHT) || LinkIt.STRAIGHT;
    var origColor = linkStyle.color;
    var origWidth = linkStyle.width;
    var isSelected = this.get('isSelected');

    switch (lineStyle){
      case LinkIt.HORIZONTAL_CURVED:
        if (isSelected) {
          linkStyle.color = this.get('selectionColor');
          linkStyle.width = this.get('selectionWidth');
          this.drawHorizontalCurvedLine(context, linkStyle);
          linkStyle.color = origColor;
          linkStyle.width = origWidth;
        }
        this.drawHorizontalCurvedLine(context, linkStyle);
        break;
      case LinkIt.VERTICAL_CURVED:
        if (isSelected) {
          linkStyle.color = this.get('selectionColor');
          linkStyle.width = this.get('selectionWidth');
          this.drawVerticalCurvedLine(context, linkStyle);
          linkStyle.color = origColor;
          linkStyle.width = origWidth;
        }
        this.drawVerticalCurvedLine(context, linkStyle);
        break;
      default:
        if (isSelected) {
          linkStyle.color = this.get('selectionColor');
          linkStyle.width = this.get('selectionWidth');
          this.drawStraightLine(context, linkStyle);
          linkStyle.color = origColor;
          linkStyle.width = origWidth;
        }
        this.drawStraightLine(context, linkStyle);
        break;
    }
  },
  
  drawStraightLine: function(context, linkStyle){
    var startPt = this.get('startPt');
    var endPt = this.get('endPt');
    if (startPt && endPt) {
      context = this._initLineProperties(context, linkStyle);
      context.beginPath();
      context.moveTo(startPt.x, startPt.y);
      context.lineTo(endPt.x, endPt.y);
      context.closePath();
      context.stroke();
    }
  },
  
  drawHorizontalCurvedLine: function(context, linkStyle){
    var startPt = this.get('startPt');
    var endPt = this.get('endPt');
    if (startPt && endPt) {
      context = this._initLineProperties(context, linkStyle);

      // Contruct Data points
      var midX = (startPt.x + endPt.x)/2;
      var midY = (startPt.y + endPt.y)/2;
      this._midPt = { x: midX, y: midY };
    
      var vectX = (startPt.x - endPt.x);
      var vectY = (startPt.y - endPt.y);
    
      // Find length
      var xLen = Math.pow(vectX, 2);
      var yLen = Math.pow(vectY, 2);
      var lineLen = Math.sqrt(xLen+yLen);
    
      // Finded the loop scaler
      var xDiff = Math.abs(startPt.x - endPt.x);
      var yDiff = Math.abs(startPt.y - endPt.y);
      var scaler = 0, diff;
      if (lineLen > 0) {
        diff = (xDiff < yDiff) ? xDiff : yDiff;
        scaler = (diff < 50) ? diff / lineLen : 50 / lineLen;
      }
    
      // Find Anchor points
      var q1X = (startPt.x + midX)/2;
      var q1Y = (startPt.y + midY)/2;
      var q2X = (endPt.x + midX)/2;
      var q2Y = (endPt.y + midY)/2;
    
      // Set the curve direction based off of the y position
      var vectMidY, vectMidX;
      if(startPt.y < endPt.y){
        vectMidY = vectX*scaler;
        vectMidX = -(vectY*scaler);
      }
      else {
        vectMidY = -(vectX*scaler);
        vectMidX = vectY*scaler;
      }
  
      // First Curve Point
      var curve1X = q1X+vectMidX;
      var curve1Y = q1Y+vectMidY;
      this._startControlPt = { x: curve1X, y: curve1Y };
    
      // Second Curve Point
      var curve2X = q2X-vectMidX;
      var curve2Y = q2Y-vectMidY;
      this._endControlPt = { x: curve2X, y: curve2Y };
    
      context.beginPath();
      context.moveTo(startPt.x, startPt.y);
      context.quadraticCurveTo(curve1X,curve1Y,midX,midY);
      context.quadraticCurveTo(curve2X,curve2Y,endPt.x,endPt.y);
      context.stroke();
    }
  },
  
  drawVerticalCurvedLine: function(context, linkStyle){
    var startPt = this.get('startPt');
    var endPt = this.get('endPt');
    if (startPt && endPt) {
      context = this._initLineProperties(context, linkStyle);
    
      // Contruct Data points
      var midX = (startPt.x + endPt.x)/2;
      var midY = (startPt.y + endPt.y)/2;
      this._midPt = { x: midX, y: midY };
    
      var vectX = (startPt.x - endPt.x);
      var vectY = (startPt.y - endPt.y);
    
      // Find length
      var xLen = Math.pow(vectX, 2);
      var yLen = Math.pow(vectY, 2);
      var lineLen = Math.sqrt(xLen+yLen);
    
      // Finded the loop scaler
      var xDiff = Math.abs(startPt.x - endPt.x);
      var yDiff = Math.abs(startPt.y - endPt.y);
      var scaler = 0, diff;
      if (lineLen > 0) {
        diff = (xDiff < yDiff) ? xDiff : yDiff;
        scaler = (diff < 50) ? diff / lineLen : 50 / lineLen;
      }
    
      // Find Anchor points
      var q1X = (startPt.x + midX)/2;
      var q1Y = (startPt.y + midY)/2;
      var q2X = (endPt.x + midX)/2;
      var q2Y = (endPt.y + midY)/2;
    
      // Set the curve direction based off of the x position
      var vectMidY, vectMidX;
      if(startPt.x < endPt.x){
        vectMidY = -(vectX*scaler);
        vectMidX = vectY*scaler;
      }
      else {
        vectMidY = vectX*scaler;
        vectMidX = -(vectY*scaler);
      }
  
      // First Curve Point
      var curve1X = q1X+vectMidX;
      var curve1Y = q1Y+vectMidY;
      this._startControlPt = { x: curve1X, y: curve1Y };
    
      // Second Curve Point
      var curve2X = q2X-vectMidX;
      var curve2Y = q2Y-vectMidY;
      this._endControlPt = { x: curve2X, y: curve2Y };
    
      context.beginPath();
      context.moveTo(startPt.x, startPt.y);
      context.quadraticCurveTo(curve1X,curve1Y,midX,midY);
      context.quadraticCurveTo(curve2X,curve2Y,endPt.x,endPt.y);
      context.stroke();
    }
  },

  distanceSquaredFromLine: function(pt) {
    var startPt = this.get('startPt');
    var endPt = this.get('endPt');
    var linkStyle = this.get('linkStyle');
    var lineStyle = linkStyle ? (linkStyle.lineStyle || LinkIt.STRAIGHT) : LinkIt.STRAIGHT;

    if (lineStyle === LinkIt.STRAIGHT) {
      return this._distanceSquaredFromLineSegment(startPt, endPt, pt);
    }
    else {
      var dist1 = this._distanceSquaredFromCurve(startPt, this._midPt, this._startControlPt, pt);
      var dist2 = this._distanceSquaredFromCurve(this._midPt, endPt, this._endControlPt, pt);
      var dist = Math.min(dist1, dist2);
      return dist;
    }
  },

  // PRIVATE METHODS

  /** @private
    * Calculates distance point p is from line segment a, b.
    * All points should be hashes like this: { x: 3, y: 4 }.
    */
  _distanceSquaredFromLineSegment: function(a, b, p) {
    var q;

    if (a.x !== b.x || a.y !== b.y) { // make sure a and b aren't on top of each other (i.e. zero length line)
      var ab = { x: (b.x - a.x), y: (b.y - a.y) }; // vector from a to b

      // Derived from the formula the intersection point of two 2D lines.
      // The two lines are: the infinite line through and a and b, and the infinite line through p
      // that is perpendicular to that line.
      // If f(u) is the parametric equation describing the line segment between a and b, then
      // we are solving for u at the point q where f(u) == intersection of the above two lines.
      // If u is in the interval [0, 1], then the intersection is somewhere between A and B.
      var numerator = (ab.x * (p.x - a.x)) + ((p.y - a.y) * ab.y);
      var u = numerator / ((ab.x * ab.x) + (ab.y * ab.y));
      
      // calculate q as closet point on line segment ab
      if (u <= 0) { // closest point on the line is not between a and b, but closest to a
        q = { x: a.x, y: a.y };
      }
      else if (u >= 1) { // closest point on the line is not between a and b, but closest to b
        q = { x: b.x, y: b.y };
      }
      else { // closest point on the line is between a and b, so calculate it
        var x = a.x + (u * ab.x);
        var y = a.y + (u * ab.y);
        q = { x: x, y: y };
      }
    }
    else { // if a and b are concurrent, the distance we want will be that between a and p.
      q = { x: a.x, y: a.y };
    }

    // vector from p to q.  Length of pq is the shortest distance from p to the line segment ab.
    var pq = { x: (q.x - p.x), y: (q.y - p.y) };
    var distSquared = (pq.x * pq.x) + (pq.y * pq.y);
    return distSquared;
  },
  
  /** @private
    * Calculates a line segment approximation of a quadratic bezier curve and returns
    * the distance between point p and the closest line segment.
    *   a: start point of the quadratic bezier curve.
    *   b: end point
    *   c: bezier control point
    *   p: query point
    */
  _distanceSquaredFromCurve: function(a, b, c, p) {
    var bezierPt, midPt, delta;

    // m and n are the endpoints of the current line segment approximating the part
    // of the bezier curve closest to p.  Start out by approximating the curve with one
    // long segment from a to b.
    var m = { x: a.x, y: a.y };
    var n = { x: b.x, y: b.y };
    var t = 0.5, dt = 0.5; // t is the parameter in the parametric equation describing the bezier curve.
    
    do {
      // Compare the midpoint on the current line segment approximation with the midpoint on the bezier.
      midPt = { x: (m.x + n.x) / 2, y: (m.y + n.y) / 2 };
      bezierPt = this._pointOnBezierCurve(a, c, b, t);
      delta = this._distanceSquared(midPt, bezierPt); // note this is distance squared to avoid a sqrt call.

      if (delta > 16) { // comparing squared distances
        // If the line segment is a bad approximation, narrow it down and try again, using a sort
        // of binary search.
        
        // We'll make a new line segment approximation where one endpoint is the closer of the
        // two original endpoints, and the other is the last point on the bezier curve (bezierPt).
        // Thus our approximation endpoints are always on the bezier and move progressively closer
        // and closer together, and therefore are guaranteed to converge on a short line segment
        // that closely approximates the bezier.  Because we always choose the closer of the last
        // two endpoints as one of the new endpoints, we always converge toward a line segment that is close
        // to our query point p.
        var distM = this._distanceSquared(m, p);
        var distN = this._distanceSquared(n, p);
        dt = 0.5 * dt;

        if (distM < distN) {
          n = bezierPt; // p is closer to m than n, so keep m and our new n will be the last bezier point
          t = t - dt; // new t for calculating the new mid bezier point that will correspond to a new mid point between m and n.
        }
        else {
          m = bezierPt; // p is closer to n than m, so keep n and our new m will be the last bezier point
          t = t + dt;
        }
      }
      else {
        // The line segment matches the corresponding portion of the bezier closely enough
        break;
      }

    } while (true);

    // Return the distance from p to the line segment that closely matches a nearby part of the bezier curve.
    return this._distanceSquaredFromLineSegment(m, n, p);
  },
  
  /** @private
    * Calculates a point on a quadratic bezier curve described by points P0, P1, and P2.
    * See http://en.wikipedia.org/wiki/Bezier_curve for definitions and formula.
    */
  _pointOnBezierCurve: function(p0, p1, p2, t) {
    var x = ((1 - t) * (1 - t) * p0.x) + (2 * (1 - t) * t * p1.x) + (t * t * p2.x);
    var y = ((1 - t) * (1 - t) * p0.y) + (2 * (1 - t) * t * p1.y) + (t * t * p2.y);
    return { x: x, y: y };
  },
  
  /** @private
    * Calculates the distance squared between points a and b.
    * Points are expected to be hashes of the form { x: 3, y: 4 }.
    */
  _distanceSquared: function(a, b) {
    return ((b.x - a.x) * (b.x - a.x)) + ((b.y - a.y) * (b.y - a.y));
  },

  _initLineProperties: function(context, linkStyle){
    if (context) {
      var cap = linkStyle ? (linkStyle.cap || LinkIt.ROUND) : LinkIt.ROUND;
      var color = linkStyle ? (linkStyle.color || '#ADD8E6') : '#ADD8E6';
      var width = linkStyle ? (linkStyle.width || 3) : 3;

      context.lineCap = cap;
      context.strokeStyle = color;
      context.lineWidth = width;
    }
    return context;
  },

  // PRIVATE PROPERTIES
  
  _midPt: null,
  _startControlPt: null, // for drawing bezier curve
  _endControlPt: null // for drawing bezier curve

};


/* >>>>>>>>>> BEGIN source/mixins/node.js */
// ==========================================================================
// LinkIt.Node 
// ==========================================================================

/** @class

  This is a Mixin that lives on the Model Object that are going to
  trigger the links and the structures

  @author Evin Grano
  @version: 0.1
*/

LinkIt.Node = {
/* Node Mixin */

  // PUBLIC PROPERTIES

  /**
  @public:  Properties that need to be set for the internal LinkIt Calls
  */
  isNode: YES,
  
  terminals: null,
  
  /**
    @public: 
    
    This is the property that is called on the node to get back an array of objects
  */
  linksKey: 'links',

  positionKey: 'position',
  
  /**
    @private: Invalidation delegate that should be notified when the links array changes.
  */
  _invalidationDelegate: null,

  /**
    @private: The method on the delegate that should be called
  */
  _invalidationAction: null,
  
  initMixin: function() {
    var terminals, key;

    // by this time we are in an object instance, so clone the terminals array
    // so that we won't be sharing this array memory (a by-product of using mixins)
    terminals = this.get('terminals');
    if (SC.typeOf(terminals) === SC.T_ARRAY) {
      this.set('terminals', SC.clone(terminals));
    }

    // We want to observe the links array but we don't know what it'll be called until runtime.
    key = this.get('linksKey');
    if (key) {
      this.addObserver(key, this, '_linksDidChange');
    }
  },
  
  /**
    @public: 
    
    Overwrite this function on your model object to validate the linking
    
    Always return YES or NO
  */
  canLink: function(link){
    return YES;
  },

  /**
    @public
    Overwrite this function on your model to validate unlinking.
    Always return YES or NO.
  */
  canDeleteLink: function(link) {
    return YES;
  },
  
  registerInvalidationDelegate: function(delegate, action){
    this._invalidationDelegate = delegate;
    this._invalidationAction = action;
  },
  
  /**
    Called after a link is added to this node
    Override on your node object to perform custom activity.
  */
  didCreateLink: function(link) {},

  /**
    Called before a link is deleted from this node
    Override on your node to perform custom activity.
  */
  willDeleteLink: function(link) {},
  
  createLink: function(link){
    // TODO: [EG] More create link functionality that is entirely depended in the internal API
    
    // Call the model specific functionality if needed
    if (this.didCreateLink) this.didCreateLink(link);
  },
  
  deleteLink: function(link){
    // TODO: [EG] More delete link functionality that is entirely depended in the internal API
    
    // Call the model specific functionality if needed
    if (this.willDeleteLink) this.willDeleteLink(link);
  },
  
  /**
    Fired by an observer on the links array that gets setup in initMixin.
  */
  _linksDidChange: function() {
    //console.log('%@._linksDidChange()'.fmt(this));
    // Call invalidate function
    if (this._invalidationDelegate) {
      var method = this._invalidationDelegate[this._invalidationAction];
      if (method) method.apply(this._invalidationDelegate);
    }
  }
  
};


/* >>>>>>>>>> BEGIN source/mixins/node_view.js */
LinkIt.NodeView = {
  
  isNodeView: YES,
  
  terminalViewFor: function(terminalKey) {
    return null;
  }
  
};


/* >>>>>>>>>> BEGIN source/mixins/terminal.js */
LinkIt.Terminal = {
  
  // PUBLIC PROPERTIES
  
  /**
    For quick checks to see if an object is mixing terminal in
  */
  isTerminal: YES,
  
  /**
    States whether this object is connected
  */
  isLinked: NO,
  
  /**
    May be LinkIt.OUTPUT_TERMINAL, LinkIt.INPUT_TERMINAL, or null.
    If null, will be assumed to be bi-directional.  Bi-directional terminals can connect
    to each other, and to output and input terminals.
  */
  direction: null,

  /**
    The name of this terminal
  */
  terminal: null,

  /**
  */
  linkStyle: null,
  
  /**
  */
  dropState: null,
  
  /**
  */
  displayProperties: ['dropState', 'isLinked', 'linkStyle', 'direction'],
  
  /**
    Will be set automatically
  */
  node: null,
  
  /**
    @private linkCache...
  */
  _linkCache: null,
  
  // *** SC.DropTarget ***
  
  /**
    Must be true when your view is instantiated.
    
    Drop targets must be specially registered in order to receive drop
    events.  SproutCore knows to register your view when this property
    is true on view creation.
  */  
  isDropTarget: YES,
  
  /**
    @public @property
  */
  terminalKey: function(){
    var n = this.get('node');
    var t = this.get('terminal');
    return '%@:%@'.fmt(SC.guidFor(n), t);
  }.property('node', 'terminal').cacheable(),

  // PUBLIC METHODS
  
  initMixin: function() {
    //LinkIt.log('%@.initMixin()'.fmt(this));
    this.isLinked = NO;
  },

  /**
    Unregister this view as a drop target when it gets destroyed
  */
  willDestroyLayerMixin: function() {
    //console.log('%@.willDestroyLayerMixin()'.fmt(this));
    SC.Drag.removeDropTarget(this);
  },
  
  renderMixin: function(context, firstTime) {
    //LinkIt.log('%@.renderMixin()'.fmt(this));
    var links = this.get('links');
    context.setClass('connected', this.get('isLinked'));
    
    // drop state
    var dropState = this.get('dropState');
    // Invite class
    context.setClass('invite', dropState === LinkIt.INVITE); // addClass if YES, removeClass if NO
    // Accept class
    context.setClass('accept', dropState === LinkIt.ACCEPT);
  },
  
  // *** LinkIt.Terminal API ***

  /**
    Return yes if someone is allowed to start dragging a link from this terminal.
    Not the same as canLink() above in that linking this terminal to another may still
    be allowed, just not triggered by a drag from this terminal.
  */
  canDragLink: function() {
    return YES;
  },

  /**
    Return yes if someone is allowed to drop a link onto this terminal.
    Not the same as canLink() above in that linking this terminal to another may still
    be allowed, just not triggered by a drop onto this terminal.
  */
  canDropLink: function() {
    return YES;
  },
  
  /**
    Only gets called if linking is acceptable.  Notifies you that someone
    has started dragging a link somewhere on the canvas that could connect
    to this terminal.
  */
  linkDragStarted: function() {
    //LinkIt.log('%@.linkStarted()'.fmt(this));
  },
  
  /**
    Notifies you that a dragged link has been finished or cancelled.
  */
  linkDragEnded: function() {
    //LinkIt.log('%@.linkEnded()'.fmt(this));
  },

  /**
    Notifies you that someone has dragged a link over this terminal but has
    not dropped it yet.
  */
  linkDragEntered: function() {
    //LinkIt.log('%@.linkEntered()'.fmt(this));
  },

  /**
    Notifies you that a link dragged over this terminal has now left without
    connecting.
  */
  linkDragExited: function() {
    //LinkIt.log('%@.linkExited()'.fmt(this));
  },

  // *** Mouse Events ***

  mouseDown: function(evt) {
    this._mouseDownEvent = evt;
    this._mouseDownAt = Date.now();
    return YES;
  },
  
  mouseDragged: function(evt) {
    if (this.canDragLink() && this._mouseDownEvent) {
      // Build the drag view to use for the ghost drag.  This 
      // should essentially contain any visible drag items.
      var layer = LinkIt.getLayer(this);

      if (layer) {
        var parent = this.get('parentView');    
        var fo = parent.convertFrameFromView(parent.get('frame'), this);
        var frame = this.get('frame');
        var startX = fo.x + (frame.width/2);
        var startY = fo.y + (frame.height/2);
        var color = this.get('linkDragColor');

        var dragLink = LinkIt.DragLink.create({
          layout: {left: 0, top: 0, right: 0, bottom: 0},
          startPt: {x: startX, y: startY},
          endPt: {x: startX, y: startY},
          linkStyle: this.get('linkStyle')
        });
        layer.appendChild(dragLink);
      
        // Initiate the drag
        var drag = SC.Drag.start({
          event: this._mouseDownEvent,
          dragLink: dragLink,
          source: this, // terminal
          dragView: SC.View.create({ layout: {left: 0, top: 0, width: 0, height: 0}}),
          ghost: NO,
          slideBack: YES,
          dataSource: this,
          anchorView: layer
        });
      }

      // Also use this opportunity to clean up since mouseUp won't 
      // get called.
      this._cleanupMouseDown() ;
    }    
    return YES ;
  },
  
  mouseUp: function(evt) {
    this._cleanupMouseDown();
    return YES; // just absorb the mouse event so that LinkIt.CanvasView (SC.CollectionView) doesn't complain.
  },
    
  // *** SC.DragSource ***
  
  /**
    This method must be overridden for drag operations to be allowed. 
    Return a bitwise OR'd mask of the drag operations allowed on the
    specified target.  If you don't care about the target, just return a
    constant value.
  
    @param {SC.View} dropTarget The proposed target of the drop.
    @param {SC.Drag} drag The SC.Drag instance managing this drag.
  
  */
  dragSourceOperationMaskFor: function(drag, dropTarget) {
    return this._nodeAllowsLink(dropTarget) ? SC.DRAG_LINK : SC.DRAG_NONE;
  },

  /**  
    This method is called when the drag begins. You can use this to do any
    visual highlighting to indicate that the receiver is the source of the 
    drag.
  
    @param {SC.Drag} drag The Drag instance managing this drag.
  
    @param {Point} loc The point in *window* coordinates where the drag 
      began.  You can use convertOffsetFromView() to convert this to local 
      coordinates.
  */
  dragDidBegin: function(drag, loc) {
    //LinkIt.log('%@.dragDidBegin()'.fmt(this));
  },
  
  /**
    This method is called whenever the drag image is moved.  This is
    similar to the dragUpdated() method called on drop targets.

    @param {SC.Drag} drag The Drag instance managing this drag.

    @param {Point} loc  The point in *window* coordinates where the drag 
      mouse is.  You can use convertOffsetFromView() to convert this to local 
      coordinates.
  */
  dragDidMove: function(drag, loc) {
    var dragLink = drag.dragLink;
    var endX, endY;

    if (dragLink) {
      // if using latest SproutCore 1.0, loc is expressed in browser window coordinates
      var pv = dragLink.get('parentView');
      var frame = dragLink.get('frame');
      var globalFrame = pv ? pv.convertFrameToView(frame, null) : frame;
      if (globalFrame) {
        endX = loc.x - globalFrame.x;
        endY = loc.y - globalFrame.y;
        dragLink.set('endPt', {x: endX , y: endY});
      }
    }
  },
  
  /**  
    This method is called when the drag ended. You can use this to do any
    cleanup.  The operation is the actual operation performed on the drag.
  
    @param {SC.Drag} drag The drag instance managing the drag.
  
    @param {Point} loc The point in WINDOW coordinates where the drag 
      ended. 
  
    @param {DragOp} op The drag operation that was performed. One of 
      SC.DRAG_COPY, SC.DRAG_MOVE, SC.DRAG_LINK, or SC.DRAG_NONE.
  
  */
  dragDidEnd: function(drag, loc, op) {
    //LinkIt.log('%@.dragDidEnd()'.fmt(this));
    var dragLink = drag.dragLink;
    if (dragLink) {
      dragLink.destroy();
    }
  },
  
  // *** SC.DropTarget ***

  dragStarted: function(drag, evt){
    // Only notify permissible terminals
    if (this._nodeAllowsLink(drag.source)) {
      this.set('dropState', LinkIt.INVITE);
      this.linkDragStarted();
    }
  },
  
  dragEntered: function(drag, evt) {
    this.set('dropState', LinkIt.ACCEPT);
    this.linkDragEntered();
  },
  
  dragExited: function(drag, evt) {
    this.set('dropState', LinkIt.INVITE);
    this.linkDragExited();
  },

  dragEnded: function(drag, evt) {
    this.set('dropState', null);
    this.linkDragEnded();
  },
  
  // TODO: [JL] I don't think this is necessary...can just return SC.DRAG_LINK!
  computeDragOperations: function(drag, evt) {
    //LinkIt.log('%@.computeDragOperations()'.fmt(this));
    //return (this.canDropLink() && this._nodeAllowsLink(drag.source)) ? SC.DRAG_LINK : SC.DRAG_NONE;
    return SC.DRAG_LINK;
  },
  
  acceptDragOperation: function(drag, op) {
    //LinkIt.log('%@.acceptDragOperation()'.fmt(this));
    var accept = (op === SC.DRAG_LINK) ? this._nodeAllowsLink(drag.source) : NO; 
    return accept;
  },
  
  performDragOperation: function(drag, op) {
    var endNode, endTerm, startNode, startTerm;
    LinkIt.log('%@.performDragOperation()'.fmt(this));
    endNode = this.get('node');
    startTerm = drag.source;
    if (endNode && startTerm) {
      startNode = startTerm.get('node');
      if (startNode) {
        var links = this._getLinkObjects(startTerm, startNode, this, endNode);
        if (links[0]) startNode.createLink( links[0] ) ;
        if (links[1]) endNode.createLink( links[1] );
      }
    }
    return op;
  },
  
  // PRIVATE METHODS
  _getLinkObjects: function(startTerminal, startNode, endTerminal, endNode){
    var key, links;
    this._linkCache = this._linkCache || {};
    
    key = '%@ %@'.fmt(startTerminal.get('terminalKey'), endTerminal.get('terminalKey'));
    links = this._linkCache[key] || this._createLinkObject(startTerminal, startNode, endTerminal, endNode);
    this._linkCache[key] = links;
    return links;
  },

  _nodeAllowsLink: function(otherTerminal) {
    var myLinkObj, myNodeAccepted, otherLinkObj, otherNodeAccepted;
    if (otherTerminal && otherTerminal.get('isTerminal')) {
      var myNode = this.get('node');
      var otherNode = otherTerminal.get('node');
      
      // First, Check nodes for compatability
      var links = this._getLinkObjects(otherTerminal, otherNode, this, myNode);
      myNodeAccepted =  (myNode && links[0]) ? myNode.canLink( links[0] ) : NO;
      otherNodeAccepted = (otherNode && myNodeAccepted && links[1]) ? otherNode.canLink( links[1] ) : NO;            
    }
    return (myNodeAccepted && otherNodeAccepted);
  },
  
  /**
    When we check the Nodes we must make a judgement for each of the directions
    Unaccepted:
      Output => Output
      Intputs => Inputs
    Accepted:
      Output (start) => Input (end)
      Bidirectional (start) => Input (end)
      Output (start) => Bidirectional (end)
      Bidirectional (start) => Bidirectional (end) && Bidirectional (end) => Bidirectional (start)
    
  */
  _createLinkObject: function(startTerminal, startNode, endTerminal, endNode){
    var tempHash = {};
    var startObj, endObj;
    // First, we need to get the direction of both terminals
    if (startNode && endNode){
      var sDir = startTerminal.get('direction');
      var eDir = endTerminal.get('direction');
      
      // Check to see if they are of unaccepted types
      if (!SC.none(sDir) && sDir === eDir) return [null, null];
      
      if ( (sDir === LinkIt.OUTPUT_TERMINAL && (eDir === LinkIt.INPUT_TERMINAL || SC.none(eDir)) ) || (eDir === LinkIt.INPUT_TERMINAL && SC.none(sDir)) ) {
        tempHash.direction = sDir;
        tempHash.startNode = startNode;
        tempHash.startTerminal = startTerminal.get('terminal');
        tempHash.startTerminalView = startTerminal;
        tempHash.endNode = endNode;
        tempHash.endTerminal = endTerminal.get('terminal');
        tempHash.endTerminalView = endTerminal;
        //console.log('\nUni(%@,%@): (%@).%@ => (%@).%@'.fmt(sDir, eDir, SC.guidFor(startNode), tempHash.startTerminal, SC.guidFor(endNode), tempHash.endTerminal));
        startObj = SC.Object.create( LinkIt.Link, tempHash );
        return [startObj, startObj];
      } 
      else if ( (sDir === LinkIt.INPUT_TERMINAL && (eDir === LinkIt.OUTPUT_TERMINAL || SC.none(eDir)) ) || (eDir === LinkIt.OUTPUT_TERMINAL && SC.none(sDir)) ) {
        tempHash.direction = eDir;
        tempHash.startNode = endNode;
        tempHash.startTerminal = endTerminal.get('terminal');
        tempHash.startTerminalView = endTerminal;
        tempHash.endNode = startNode;
        tempHash.endTerminal = startTerminal.get('terminal');
        tempHash.endTerminalView = startTerminal;
        //console.log('\nUni(%@,%@): (%@).%@ => (%@).%@'.fmt(sDir, eDir, SC.guidFor(endNode), tempHash.startTerminal, SC.guidFor(startNode), tempHash.endTerminal));
        startObj = SC.Object.create( LinkIt.Link, tempHash );
        return [startObj, startObj];
      }
      else { // Bi Directional
        tempHash.direction = sDir;
        tempHash.startNode = startNode;
        tempHash.startTerminal = startTerminal.get('terminal');
        tempHash.startTerminalView = startTerminal;
        tempHash.endNode = endNode;
        tempHash.endTerminal = endTerminal.get('terminal');
        tempHash.endTerminalView = endTerminal;
        startObj = SC.Object.create( LinkIt.Link, tempHash );
        //console.log('\nBi(%@): (%@).%@ => (%@).%@'.fmt(sDir, SC.guidFor(startNode), tempHash.startTerminal, SC.guidFor(endNode), tempHash.endTerminal));
        
        tempHash.direction = eDir;
        tempHash.startNode = endNode;
        tempHash.startTerminal = endTerminal.get('terminal');
        tempHash.startTerminalView = endTerminal;
        tempHash.endNode = startNode;
        tempHash.endTerminal = startTerminal.get('terminal');
        tempHash.endTerminalView = startTerminal;
        endObj = SC.Object.create( LinkIt.Link, tempHash );
        //console.log('Bi(%@): (%@).%@ => (%@).%@'.fmt(eDir, SC.guidFor(endNode), tempHash.startTerminal, SC.guidFor(startNode), tempHash.endTerminal));
        return [startObj, endObj];
      }
    }
  },
  
  /**
    @private
  */
  _cleanupMouseDown: function() {
    this._mouseDownEvent = this._mouseDownAt = null ;
  }

};


/* >>>>>>>>>> BEGIN source/views/canvas.js */
// ==========================================================================
// LinkIt.CanvasView
// ==========================================================================

/** @class

  This is the canvas tag that draws the line on the screen

  @extends SC.View
  @author Jonathan Lewis
  @author Evin Grano
  @author Mohammed Taher
  @version 0.1
*/

LinkIt.CanvasView = SC.CollectionView.extend({

  // PUBLIC PROPERTIES

  classNames: ['linkit-canvas'],

  /**
    YES if there are no nodes present on the canvas.  Provided so you can style
    the canvas differently when empty if you want to.
  */
  isEmpty: YES,
  
  /**
    SC.CollectionView property that lets delete keys be detected
  */
  acceptsFirstResponder: YES,

  /**
  */
  canDeleteContent: YES,

  /**
    SC.CollectionView property that allows clearing the selection by clicking
    in an empty area.
  */
  allowDeselectAll: YES,

  /**
  */
  nodeViewDelegate: null,
  
  /**
    How close you have to click to a line before it is considered a hit
  */
  LINK_SELECTION_FREEDOM: 6,
  
  /**
    Pointer to selected link object
  */
  linkSelection: null,
  
  /**
  */
  displayProperties: ['frame', 'links.[]'],
  
  // PUBLIC METHODS

  /**
    Call this to trigger a links refresh
  */
  linksDidChange: function() {
    //console.log('%@.linksDidChange()'.fmt(this));
    this.invokeOnce(this._updateLinks);
  },

  render: function(context, firstTime) {
    //console.log('%@.render()'.fmt(this));
    var frame = this.get('frame');
    if (firstTime) {
      if (!SC.browser.msie) {
        context.push('<canvas class="base-layer" width="%@" height="%@">You can\'t use canvas tags</canvas>'.fmt(frame.width, frame.height));
      }
    }
    else {
      var canvasElem = this.$('canvas.base-layer');
      if (canvasElem) {
        canvasElem.attr('width', frame.width);
        canvasElem.attr('height', frame.height);
        if (canvasElem.length > 0) {
          var cntx = canvasElem[0].getContext('2d'); // Get the actual canvas object context
          if (cntx) {
            cntx.clearRect(0, 0, frame.width, frame.height);
            this._drawLinks(cntx);
          }
          else {
            LinkIt.log("Linkit.LayerView.render(): Canvas object context is not accessible.");
          }
        }
        else {
          LinkIt.log("Linkit.LayerView.render(): Canvas element array length is zero.");
        }
      }
      else {
        LinkIt.log("Linkit.LayerView.render(): Canvas element is not accessible.");
      }
    }
    
    return arguments.callee.base.apply(this,arguments);
  },
  
  /*
  [MT] - DON'T REMOVE COMMENTED OUT BLOCK... Commenting this out since 
  we're supporting IE through Google Chrome Frame. Might change this down the road.
  
  didCreateLayer: function() {
    arguments.callee.base.apply(this,arguments);
    if (SC.browser.msie) {
      var frame = this.get('frame');
      var canvas = document.createElement('CANVAS');
      canvas.className = 'base-layer';
      canvas.width = frame.width;
      canvas.height = frame.height;
      this.$().append(canvas);
      canvas = G_vmlCanvasManager.initElement(canvas);
      this._canvasie = canvas;
    }
  },
  */

  didReload: function(invalid) {
    //console.log('%@.didReload()'.fmt(this));
    var viewIndex = {};
    var content = this.get('content') || [];
    var len = content.get('length');
    var node, nodeID, view;
    for (var i = 0; i < len; i++) {
      node = content.objectAt(i);
      nodeID = SC.guidFor(node);
      view = this.itemViewForContentIndex(i);
      viewIndex[nodeID] = view;
    }
    this._nodeViewIndex = viewIndex;
  },

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
    //console.log('%@.itemViewForContentIndex(%@, %@)'.fmt(this, idx, rebuild));
    // return from cache if possible
    var content   = this.get('content'),
        itemViews = this._sc_itemViews,
        item = content.objectAt(idx),
        del  = this.get('contentDelegate'),
        groupIndexes = del.contentGroupIndexes(this, content),
        isGroupView = NO,
        key, ret, E, layout, layerId,
        nodeViewDelegate;

    // use cache if available
    if (!itemViews) itemViews = this._sc_itemViews = [] ;
    if (!rebuild && (ret = itemViews[idx])) return ret ; 

    // otherwise generate...
    
    // first, determine the class to use
    isGroupView = groupIndexes && groupIndexes.contains(idx);
    if (isGroupView) isGroupView = del.contentIndexIsGroup(this, content,idx);
    if (isGroupView) {
      key  = this.get('contentGroupExampleViewKey');
      if (key && item) E = item.get(key);
      if (!E) E = this.get('groupExampleView') || this.get('exampleView');

    } else {
      key  = this.get('contentExampleViewKey');
      if (key && item) E = item.get(key);

      // Ask the example view delegate if there is one
      if (!E && (nodeViewDelegate = this.get('nodeViewDelegate'))) {
        E = nodeViewDelegate.exampleViewForNode(item);
      }
  
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
    attrs.isEnabled    = del.contentIndexIsEnabled(this, content, idx);
    attrs.isSelected   = del.contentIndexIsSelected(this, content, idx);
    attrs.outlineLevel = del.contentIndexOutlineLevel(this, content, idx);
    attrs.disclosureState = del.contentIndexDisclosureState(this, content, idx);
    attrs.isGroupView  = isGroupView;
    attrs.isVisibleInWindow = this.isVisibleInWindow;
    if (isGroupView) attrs.classNames = this._GROUP_COLLECTION_CLASS_NAMES;
    else attrs.classNames = this._COLLECTION_CLASS_NAMES;
    
    layout = this.layoutForContentIndex(idx);
    if (layout) {
      attrs.layout = layout;
    } else {
      delete attrs.layout ;
    }
    
    ret = this.createItemView(E, idx, attrs);
    itemViews[idx] = ret ;
    return ret ;
  },

  /**
    Overrides SC.CollectionView.createItemView().
    In addition to creating new view instance, it also overrides the layout
    to position the view according to where the LinkIt.Node API indicates, or
    randomly generated position if that's not present.
  */
  createItemView: function(exampleClass, idx, attrs) {
    var view, frame;
    var layout, position;
    var node = attrs.content;

    if (exampleClass) {
      view = exampleClass.create(attrs);
    }
    else { // if no node view, create a default view with an error message in it
      view = SC.LabelView.create(attrs, {
        layout: { left: 0, top: 0, width: 150, height: 50 },
        value: 'Missing NodeView'
      });
    }

    frame = view.get('frame');
    position = this._getItemPosition(node);

    // generate a random position if it's not present
    if (!position) {
      position = this._genRandomPosition();
      this._setItemPosition(node, position);
    }
    
    // override the layout so we can control positioning of this node view
    layout = { top: position.y, left: position.x, width: frame.width, height: frame.height };
    view.set('layout', layout);
    return view;
  },

  /**
    Override this method from SC.CollectionView to handle link deletion.
    Handles regular item deletion by calling arguments.callee.base.apply(this,arguments) first.
  */
  deleteSelection: function() {
    var ret = arguments.callee.base.apply(this,arguments);
    this.deleteLinkSelection();
    
    // Always return YES since this becomes the return value of the keyDown() method
    // in SC.CollectionView and we have to signal we are absorbing backspace keys whether
    // we delete anything or not, or the browser will treat it like the Back button.
    return YES;
  },

  /**
    Attempts to delete the link selection if present and possible
  */
  deleteLinkSelection: function() {
    var link = this.get('linkSelection');
    if (link) {
      var startNode = link.get('startNode');
      var endNode = link.get('endNode');
      if (startNode && endNode) {
        if (startNode.canDeleteLink(link) && endNode.canDeleteLink(link)) {
          startNode.deleteLink(link);
          endNode.deleteLink(link);
          this.set('linkSelection', null);
          this.displayDidChange();
        }
      }
    }
  },

  mouseDown: function(evt) {
    var pv, frame, globalFrame, canvasX, canvasY, itemView, menuPane, menuOptions;
    var linkSelection;

    arguments.callee.base.apply(this,arguments);

    // init the drag data
    this._dragData = null;

    if (evt && (evt.which === 3) || (evt.ctrlKey && evt.which === 1)) {
      linkSelection = this.get('linkSelection');
      if (linkSelection && !this.getPath('selection.length')) {
        menuOptions = [
          { title: "Delete Selected Link".loc(), target: this, action: 'deleteLinkSelection', isEnabled: YES }
        ];

        menuPane = SCUI.ContextMenuPane.create({
          contentView: SC.View.design({}),
          layout: { width: 194, height: 0 },
          itemTitleKey: 'title',
          itemTargetKey: 'target',
          itemActionKey: 'action',
          itemSeparatorKey: 'isSeparator',
          itemIsEnabledKey: 'isEnabled',
          items: menuOptions
        });
        
        menuPane.popup(this, evt);
      }
    }
    else {
      pv = this.get('parentView');
      frame = this.get('frame');
      globalFrame = pv ? pv.convertFrameToView(frame, null) : frame;
      canvasX = evt.pageX - globalFrame.x;
      canvasY = evt.pageY - globalFrame.y;
      this._selectLink( {x: canvasX, y: canvasY} );

      itemView = this.itemViewForEvent(evt);
      if (itemView) {
        this._dragData = SC.clone(itemView.get('layout'));
        this._dragData.startPageX = evt.pageX;
        this._dragData.startPageY = evt.pageY;
        this._dragData.view = itemView;
        this._dragData.didMove = NO; // hasn't moved yet; drag will update this
      }
    }
    
    return YES;
  }, 

  mouseDragged: function(evt) {
    var dX, dY;

    if (this._dragData) {
      this._dragData.didMove = YES; // so that mouseUp knows whether to report the new position.
      dX = evt.pageX - this._dragData.startPageX;
      dY = evt.pageY - this._dragData.startPageY;
      this._dragData.view.adjust({ left: this._dragData.left + dX, top: this._dragData.top + dY });
      
      this.displayDidChange(); // so that links get redrawn
    }
    return YES;
  },

  /**
  */
  mouseUp: function(evt) {
    var ret = arguments.callee.base.apply(this,arguments);
    var layout, content, newPosition;
    
    if (this._dragData && this._dragData.didMove) {
      layout = this._dragData.view.get('layout');
      content = this._dragData.view.get('content');

      if (content && content.get('isNode')) {
        newPosition = { x: layout.left, y: layout.top };
        this._setItemPosition(content, newPosition);
      }
    }
    
    this._dragData = null; // clean up
    return ret;
  },

  // PRIVATE METHODS
  
  _layoutForNodeView: function(nodeView, node) {
    var layout = null, position, frame;

    if (nodeView && node) {
      frame = nodeView.get('frame');
      position = this._getItemPosition(node);

      // generate a random position if it's not present
      if (!position) {
        position = this._genRandomPosition();
        this._setItemPosition(node, position);
      }

      layout = { top: position.x, left: position.y, width: frame.width, height: frame.height };
    }
    return layout;
  },
  
  _updateLinks: function() {
    //console.log('%@._updateLinks()'.fmt(this));
    var links = [];
    var nodes = this.get('content');
     if (nodes) {
       var numNodes = nodes.get('length');
       var node, i, j, nodeLinks, key, len, link;
       var startNode, endNode;
     
       for (i = 0; i < numNodes; i++) {
         node = nodes.objectAt(i);
         if (node && (key = node.get('linksKey'))) {
           nodeLinks = node.get(key) || [];
           links = links.concat(nodeLinks);
         }
       }

       var linkSelection = this.get('linkSelection');
       this.set('linkSelection', null);
       if (linkSelection) {
         var selectedID = LinkIt.genLinkID(linkSelection);
         len = links.get('length');
         for (i = 0; i < len; i++) {
           link = links.objectAt(i);
           if (LinkIt.genLinkID(link) === selectedID) {
             this.set('linkSelection', link);
             link.set('isSelected', YES);
             break;
           }
         }
       }
     }
     this.set('links', links);
  },

  /**
  */
  _drawLinks: function(context) {
    var links = this.get('links');
    var numLinks = links.get('length');
    var link, points, i, linkID;
    for (i = 0; i < numLinks; i++) {
      link = links.objectAt(i);
      if (!SC.none(link)) {
        points = this._endpointsFor(link);
        if (points) {
          link.drawLink(context);
        }
      }
    }
  },
  
  _endpointsFor: function(link) {
    var startTerminal = this._terminalViewFor(link.get('startNode'), link.get('startTerminal'));
    var endTerminal = this._terminalViewFor(link.get('endNode'), link.get('endTerminal'));
    var startPt = null, endPt = null, pv, frame;
    
    if (startTerminal && endTerminal) {
      pv = startTerminal.get('parentView');
      if (pv) {
        frame = pv.convertFrameToView(startTerminal.get('frame'), this);
        startPt = {};
        startPt.x = SC.midX(frame); startPt.y = SC.midY(frame);
        link.set('startPt', startPt);
      }
    
      // Second Find the End
      pv = endTerminal.get('parentView');
      if (pv) {
        frame = pv.convertFrameToView(endTerminal.get('frame'), this);
        endPt = {};
        endPt.x = SC.midX(frame); endPt.y = SC.midY(frame);
        link.set('endPt', endPt);
      }

      var linkStyle = startTerminal.get('linkStyle');
      if (linkStyle) {
        link.set('linkStyle', linkStyle);
      }
    }
    return startPt && endPt ? { startPt: startPt, endPt: endPt } : null;
  },
  
  /**
    pt = mouse click location { x: , y: } in canvas frame space
  */
  _selectLink: function(pt) {
    //console.log('%@._selectLink()'.fmt(this));
    var links = this.get('links') || [];
    var len = links.get('length');
    var link, dist, i;

    // we compare distances squared to avoid costly square root calculations when finding distances
    var maxDist = (this.LINE_SELECTION_FREEDOM * this.LINE_SELECTION_FREEDOM) || 25;

    this.set('linkSelection', null);
    for (i = 0; i < len; i++) {
      link = links.objectAt(i);
      dist = link.distanceSquaredFromLine(pt);
      if ((SC.typeOf(dist) === SC.T_NUMBER) && (dist <= maxDist)) {
        link.set('isSelected', YES);
        this.set('linkSelection', link);
        break;
      }
      else {
        link.set('isSelected', NO);
      }
    }

    // no more lines to select, just mark all the other lines as not selected
    for (i = i + 1; i < len; i++) {
      link = links.objectAt(i);
      link.set('isSelected', NO);
    }

    // trigger a redraw of the canvas
    this.displayDidChange();
  },
  
  _terminalViewFor: function(node, terminal) {
    var nodeView = this._nodeViewIndex[SC.guidFor(node)];
    if (nodeView && nodeView.terminalViewFor) {
      return nodeView.terminalViewFor(terminal);
    }
    return null;
  },
  
  /**
  */
  _contentDidChange: function() {
    this._nodeSetup();
    this.linksDidChange(); // schedules a links update at the end of the run loop
  }.observes('*content.[]'), // without the '*' at the beginning, this doesn't get triggered
  
  _nodeSetup: function(){
    var nodes = this.get('content');
    var numNodes = 0;
    var node, nodeID;
    
    this.set('_nodeIndex', {});

    if (nodes) {
      numNodes = nodes.get('length');
    
      for (var i = 0; i < numNodes; i++) {
        node = nodes.objectAt(i);
        node.registerInvalidationDelegate(this, 'linksDidChange');

        nodeID =  SC.guidFor(node);
        this._nodeIndex[nodeID] = { node: node };
      }
    }

    // Update the canvas state
    this.set('isEmpty', numNodes <= 0);
  },
  
  /**
    Encapsulates the standard way the dashboard attempts to extract the last
    position from the dashboard element.
    Returns null if unsuccessful.
  */
  _getItemPosition: function(item) {
    var posKey = item ? item.get('positionKey') : null;
    var pos = posKey ? item.get(posKey) : null;

    if (posKey && pos) {
      pos = { x: (parseFloat(pos.x) || 0), y: (parseFloat(pos.y) || 0) };
    }
    
    return pos;
  },
  
  /**
    Encapsulates the standard way the dashboard attempts to store the last
    position on a dashboard element.
  */
  _setItemPosition: function(item, pos) {
    var posKey = item ? item.get('positionKey') : null;

    if (posKey) {
      item.set(posKey, pos);
    }
  },
  
  /**
    Generates a random (x,y) where x=[10, 600), y=[10, 400)
  */
  _genRandomPosition: function() {
    return {
      x: Math.floor(10 + Math.random() * 590),
      y: Math.floor(10 + Math.random() * 390)
    };
  },
  
  // PRIVATE PROPERTIES
  
  /**
  */
  links: [],

  _nodeIndex: {},
  _nodeViewIndex: {},
  
  /**
    @private: parameters
  */
  _dragData: null
  
});


/* >>>>>>>>>> BEGIN source/views/drag_link.js */
// ==========================================================================
// LinkIt.DragLink
// ==========================================================================

sc_require('mixins/link');

/** @class

  This is the canvas tag that draws the line on the screen

  @extends SC.View
  @author Evin Grano
  @author Jonathan Lewis
  @version 0.1
*/

LinkIt.DragLink = SC.View.extend( LinkIt.Link,
/** @scope LinkIt.DragLink.prototype */ {

  classNames: ['linkIt-draglink'],
  
  displayProperties: ['startPt', 'endPt'],
  
  render: function(context, firstTime) {
    if (firstTime){
      if (!SC.browser.msie) {
        context.push('<canvas>test</canvas>');
      }
    }
    else
    { 
      //LinkIt.log('Drawing DragLink...');
      var canvasElem = this.$('canvas');
      var frame = this.get('frame');
      
      if (canvasElem && frame) {
        var width = frame.width;
        var height = frame.height;
    
        // Set the position, height, and width
        canvasElem.attr('width', width);
        canvasElem.attr('height', height);

        if (canvasElem.length > 0) {
          var cntx = this._canvasie ? this._canvasie.getContext('2d') : canvasElem[0].getContext('2d'); // Get the actual canvas object context
          if (cntx) {
            cntx.clearRect(0, 0, width, height);

            // Find the X Draw positions
            var startPt = this.get('startPt');
            var endPt = this.get('endPt');
      
            // skip if they are the same...
            var xDiff = Math.abs(startPt.x - endPt.x);
            var yDiff = Math.abs(startPt.y - endPt.y);
            if (xDiff > 5 || yDiff > 5){
              if (this.drawLink) {
                this.drawLink(cntx);
              }
            }
          }
          else {
            LinkIt.log("LinkIt.DragLink.render(): Canvas object context is not accessible.");
          }
        }
        else {
          LinkIt.log("LinkIt.DragLink.render(): Canvas element has length zero.");
        }
      }
      else {
        LinkIt.log("LinkIt.DragLink.render(): Canvas element or frame unaccessible.");
      }
    }
    arguments.callee.base.apply(this,arguments);
  },
  

  didCreateLayer: function(){
    
    /*
    [MT] - DON'T REMOVE COMMENTED OUT BLOCK... Commenting this out since 
    we're supporting IE through Google Chrome Frame. Might change this down the road.
    
    if (SC.browser.msie) {
      var frame = this.get('frame');
      var canvas = document.createElement('CANVAS');
      canvas.width = frame.width;
      canvas.height = frame.height;
      this.$().append(canvas);
      canvas = G_vmlCanvasManager.initElement(canvas);
      this._canvasie = canvas;
    }
    */
    
    this.set('layoutNeedsUpdate', YES);
  }
  
});


/* >>>>>>>>>> BEGIN bundle_loaded.js */
; if ((typeof SC !== 'undefined') && SC && SC.bundleDidLoad) SC.bundleDidLoad('scui/linkit');
