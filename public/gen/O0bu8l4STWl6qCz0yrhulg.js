/*! Socket.IO.js build:0.8.7, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.8.7';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = decodeURIComponent(kv[1]);
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new ActiveXObject('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    if (Array.prototype.indexOf) {
      return Array.prototype.indexOf.call(arr, o, i);
    }

    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    // TODO: enable this when node 0.5 is stable
    //if (name === undefined) {
      //this.$events = {};
      //return this;
    //}

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.connected || this.connecting || this.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.close && this.open) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.open = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.open = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': true
      , 'auto connect': true
      , 'flash policy port': 10843
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;

      io.util.on(global, 'beforeunload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else {
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;

    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      self.transports = io.util.intersect(
          transports.split(',')
        , self.options.transports
      );

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  if (!self.remainingTransports) {
                    self.remainingTransports = self.transports.slice(0);
                  }

                  var remaining = self.remainingTransports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect();

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      this.transport.payload(this.buffer);
      this.buffer = [];
    }
  };

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request()
      , uri = this.resource + '/' + io.protocol + '/' + this.sessionid;

    xhr.open('GET', uri, true);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && this.connected) {
        this.disconnect();
        this.reconnect();
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected) {
      this.transport.close();
      this.transport.clearTimeouts();
      this.publish('disconnect', reason);

      if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
        this.reconnect();
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.send = function (data) {
    this.websocket.send(data);
    return this;
  };

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */
  
  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport} 
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      if (io.util.request(xdomain)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports corss domain requests.
   * 
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function () {
    return XHR.check(null, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.open) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      self.onData(this.responseText);
      self.get();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = this.xhr.onerror = onload;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
;var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/index.js", function (require, module, exports, __dirname, __filename) {
    var app = require('derby').createApp(module),
    get = app.get,
    view = app.view,
    ready = app.ready,
    start;

// ROUTES //

start = +new Date();

// Derby routes can be rendered on the client and the server
get('/:room?', function(page, model, params) {
  var room = params.room || 'home';

  // Subscribes the model to any updates on this room's object. Also sets a
  // model reference to the room. This is equivalent to:
  //   model.set('_room', model.ref('rooms.' + room));
  model.subscribe({ _room: 'rooms.' + room }, function() {

    // setNull will set a value if the object is currently null or undefined
    model.setNull('_room.welcome', 'Deals and Local Events: ' + room + '!');

    model.incr('_room.visits');

    // This value is set for when the page initially renders
    model.set('_timer', '0.0');
    // Reset the counter when visiting a new route client-side
    start = +new Date();

    // Render will use the model data as well as an optional context object
    page.render({
      room: room,
      randomUrl: parseInt(Math.random() * 1e9).toString(36)
    });
  });
});


// CONTROLLER FUNCTIONS //

ready(function(model) {
  var timer;

  // Exported functions are exposed as a global in the browser with the same
  // name as the module that includes Derby. They can also be bound to DOM
  // events using the "x-bind" attribute in a template.
  exports.stop = function() {

    // Any path name that starts with an underscore is private to the current
    // client. Nothing set under a private path is synced back to the server.
    model.set('_stopped', true);
    clearInterval(timer);
  };

  (exports.start = function() {
    model.set('_stopped', false);
    timer = setInterval(function() {
      model.set('_timer', (((+new Date()) - start) / 1000).toFixed(1));
    }, 100);
  })();
});

});

require.define("/node_modules/derby/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./lib/derby.js","browserify":{"main":"./lib/derby.browser.js"}}
});

require.define("/node_modules/derby/lib/derby.browser.js", function (require, module, exports, __dirname, __filename) {
    var Dom, History, Page, Route, View, modelHelper, racer;
racer = require('racer');
modelHelper = require('./modelHelper');
Dom = require('./Dom');
View = require('./View');
History = require('./History');
Route = require('express/lib/router/route');
Page = function() {};
Page.prototype = {
  render: function(ctx) {
    return this.view.render(this.model, ctx);
  },
  redirect: function(url) {
    if (url === 'back') {
      return this.history.back();
    }
    if (url === 'home') {
      url = '\\';
    }
    return this.history.replace(url, true);
  }
};
exports.createApp = function(appModule) {
  var appExports, dom, history, model, name, page, routes, template, view, _ref;
  appExports = appModule.exports;
  appExports.view = view = new View;
  routes = {};
  ['get', 'post', 'put', 'del'].forEach(function(method) {
    var queue;
    queue = routes[method] = [];
    return appExports[method] = function(pattern, callback) {
      return queue.push(new Route(method, pattern, callback));
    };
  });
  history = new History(routes, page = new Page);
  model = view.model = racer.model;
  dom = view.dom = new Dom(model, appExports, history);
  modelHelper.init(model, dom, view);
  appExports.ready = function(fn) {
    return racer.onready = function() {
      return fn(model);
    };
  };
  page.view = view;
  page.model = model;
  _ref = {"title":"{{room}} - ((_room.visits)) visits","body":"<h1>((_room.welcome))</h1><p><label>Welcome message: <input value=\"((_room.welcome))\"></label><p>This page has been visted ((_room.visits)) times. {{> timer}}<p>Let's go <a href=\"/{{randomUrl}}\">somewhere random</a>.","timer":"((#_stopped))<a x-bind=\"click:start\">Start timer</a>((^))You have been here for ((_timer)) seconds. <a x-bind=\"click:stop\">Stop</a>((/))"};
  for (name in _ref) {
    template = _ref[name];
    view.make(name, template);
  }
  appModule.exports = function(idCount, paths, aliases, pathMapCount, pathMapIds, modelBundle, modelEvents, domEvents) {
    view._idCount = idCount;
    view._paths = paths;
    view._aliases = aliases;
    model.__pathMap.init(pathMapCount, pathMapIds);
    model.__events.set(modelEvents);
    dom.init(domEvents);
    racer.init(modelBundle);
    return appExports;
  };
  return appExports;
};
});

require.define("/node_modules/derby/node_modules/racer/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"./lib/racer.js","browserify":{"main":"./lib/racer.browser.js"}}
});

require.define("/node_modules/derby/node_modules/racer/lib/racer.browser.js", function (require, module, exports, __dirname, __filename) {
    var Field, Model, isReady, model, racer, util;
require('es5-shim');
util = require('./util');
Model = require('./Model');
Field = require('./mixin.ot/Field');
isReady = false;
model = null;
racer = module.exports = {
  model: new Model,
  init: function(options) {
    var field, incomingOtFields, json, path;
    model = this.model;
    incomingOtFields = options.otFields;
    for (path in incomingOtFields) {
      json = incomingOtFields[path];
      field = Field.fromJSON(json, model);
      model.otFields[path] = field;
    }
    model._adapter._data = {
      world: options.data
    };
    model._adapter._vers = {
      ver: options.base
    };
    model._clientId = options.clientId;
    model._storeSubs = options.storeSubs;
    model._startId = options.startId;
    model._txnCount = options.txnCount;
    model._onTxnNum(options.txnNum);
    model._setSocket(options.socket || io.connect(options.ioUri, {
      'reconnection delay': 50,
      'max reconnection attempts': 20
    }));
    isReady = true;
    racer.onready();
    return racer;
  },
  onready: function() {},
  ready: function(onready) {
    return function() {
      var connected;
      racer.onready = onready;
      if (isReady) {
        connected = model.socket.socket.connected;
        onready();
        if (connected) {
          return model.socket.socket.publish('connect');
        }
      }
    };
  },
  util: util,
  Model: Model
};
});

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"es5-shim.js"}
});

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/es5-shim.js", function (require, module, exports, __dirname, __filename) {
    // vim: ts=4 sts=4 sw=4 expandtab
// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License
// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)
// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA
// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License
// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License
// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License
// -- kossnocorp Sasha Koss XXX TODO License or CLA
// -- bryanforbes Bryan Forbes XXX TODO License or CLA
// -- killdream Quildreen Motta XXX TODO License or CLA
// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License
// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License
// -- bbqsrc Brendan Molloy XXX TODO License or CLA
// -- iwyg XXX TODO License or CLA
// -- DomenicDenicola Domenic Denicola XXX TODO License or CLA
// -- xavierm02 Montillet Xavier XXX TODO License or CLA
// -- Raynos Raynos XXX TODO License or CLA
// -- samsonjs Sami Samhuri XXX TODO License or CLA
// -- rwldrn Rick Waldron XXX TODO License or CLA
// -- lexer Alexey Zakharov XXX TODO License or CLA

/*!
    Copyright (c) 2009, 280 North Inc. http://280north.com/
    MIT License. http://github.com/280north/narwhal/blob/master/README.md
*/

// Module systems magic dance
(function (definition) {
    // RequireJS
    if (typeof define == "function") {
        define(definition);
    // CommonJS and <script>
    } else {
        definition();
    }
})(function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf
 *
 * NOTE: this is a draft, and as such, the URL is subject to change.  If the
 * link is broken, check in the parent directory for the latest TC39 PDF.
 * http://www.ecma-international.org/publications/files/drafts/
 *
 * Previous ES5 Draft
 * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf
 * This is a broken link to the previous draft of ES5 on which most of the
 * numbered specification references and quotes herein were taken.  Updating
 * these references and quotes to reflect the new document would be a welcome
 * volunteer project.
 *
 * @module
 */

/*whatsupdoc*/

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (typeof target != "function")
            throw new TypeError(); // TODO message
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 9. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 10. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 11. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 12. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        // 13. The [[Scope]] internal property of F is unused and need not
        //   exist.
        var bound = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.

                var F = function(){};
                F.prototype = target.prototype;
                var self = new F;

                var result = target.apply(
                    self,
                    args.concat(slice.call(arguments))
                );
                if (result !== null && Object(result) === result)
                    return result;
                return self;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the list
                //   boundArgs in the same order followed by the same values as
                //   the list ExtraArgs in the same order. 5.  Return the
                //   result of calling the [[Call]] internal method of target
                //   providing boundThis as the this value and providing args
                //   as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        // XXX bound.length is never writable, so don't even try
        //
        // 16. The length own property of F is given attributes as specified in
        //   15.3.5.1.
        // TODO
        // 17. Set the [[Extensible]] internal property of F to true.
        // TODO
        // 18. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // 19. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
        //   false}, and false.
        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property.
        // XXX can't delete it in pure-js.
        return bound;
    };
}

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}

//
// Array
// =====
//

// ES5 15.4.3.2
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return toString(obj) == "[object Array]";
    };
}

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var self = toObject(this),
            thisp = arguments[1],
            i = 0,
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object context
                fun.call(thisp, self[i], i, self);
            }
            i++;
        }
    };
}

// ES5 15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, self);
        }
        return result;
    };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            result = [],
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                result.push(self[i]);
        }
        return result;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, self))
                return false;
        }
        return true;
    };
}

// ES5 15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var self = toObject(this),
            length = self.length >>> 0,
            thisp = arguments[1];

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, self))
                return true;
        }
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value and an empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self)
                result = fun.call(void 0, result, self[i], i, self);
        }

        return result;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var self = toObject(this),
            length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        // no value to return if no initial value, empty array
        if (!length && arguments.length == 1)
            throw new TypeError(); // TODO message

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError(); // TODO message
            } while (true);
        }

        do {
            if (i in this)
                result = fun.call(void 0, result, self[i], i, self);
        } while (i--);

        return result;
    };
}

// ES5 15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;

        var i = 0;
        if (arguments.length > 1)
            i = toInteger(arguments[1]);

        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}

// ES5 15.4.4.15
if (!Array.prototype.lastIndexOf) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = toObject(this),
            length = self.length >>> 0;

        if (!length)
            return -1;
        var i = length - 1;
        if (arguments.length > 1)
            i = toInteger(arguments[1]);
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i])
                return i;
        }
        return -1;
    };
}

//
// Object
// ======
//

// ES5 15.2.3.2
if (!Object.getPrototypeOf) {
    // https://github.com/kriskowal/es5-shim/issues#issue/2
    // http://ejohn.org/blog/objectgetprototypeof/
    // recommended by fschaefer on github
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}

// ES5 15.2.3.3
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        // If object does not owns property return undefined immediately.
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;

        // If object has a property then it's for sure both `enumerable` and
        // `configurable`.
        descriptor =  { enumerable: true, configurable: true };

        // If JS engine supports accessor properties then property may be a
        // getter or setter.
        if (supportsAccessors) {
            // Unfortunately `__lookupGetter__` will return a getter even
            // if object has own non getter property along with a same named
            // inherited getter. To avoid misbehavior we temporary remove
            // `__proto__` so that `__lookupGetter__` will return getter only
            // if it's owned by an object.
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);

            // Once we have getter and setter we can put values back.
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;

                // If it was accessor property we're done and return here
                // in order to avoid adding `value` to the descriptor.
                return descriptor;
            }
        }

        // If we got this far we know that object has an own property that is
        // not an accessor so we set it as a value and return descriptor.
        descriptor.value = object[property];
        return descriptor;
    };
}

// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}

// ES5 15.2.3.5
if (!Object.create) {
    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = { "__proto__": null };
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            // IE has no built-in implementation of `Object.getPrototypeOf`
            // neither `__proto__`, but this manually setting `__proto__` will
            // guarantee that `Object.getPrototypeOf` will work as expected with
            // objects created using `Object.create`
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

// ES5 15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//     http://msdn.microsoft.com/en-us/library/dd282900.aspx
//     http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//     https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
        // returns falsy
    }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);

        // make a valiant attempt to use the real defineProperty
        // for I8's DOM elements.
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
                // try the shim if the real one doesn't work
            }
        }

        // If it's a data property.
        if (owns(descriptor, "value")) {
            // fail silently if "writable", "enumerable", or "configurable"
            // are requested but not supported
            /*
            // alternate approach:
            if ( // can't implement these features; allow false but not true
                !(owns(descriptor, "writable") ? descriptor.writable : true) ||
                !(owns(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                !(owns(descriptor, "configurable") ? descriptor.configurable : true)
            )
                throw new RangeError(
                    "This implementation of Object.defineProperty does not " +
                    "support configurable, enumerable, or writable."
                );
            */

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                // As accessors are supported only on engines implementing
                // `__proto__` we can safely override `__proto__` while defining
                // a property to make sure that we don't hit an inherited
                // accessor.
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                // Deleting a property anyway since getter / setter may be
                // defined on object itself.
                delete object[property];
                object[property] = descriptor.value;
                // Setting original `__proto__` back now.
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            // If we got that far then getters and setters can be defined !!
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}

// ES5 15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// detect a Rhino bug and patch it
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}

// ES5 15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}

// ES5 15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}

// ES5 15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}

// ES5 15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        // 1. If Type(O) is not Object throw a TypeError exception.
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        // 2. Return the Boolean value of the [[Extensible]] internal property of O.
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}

// ES5 15.2.3.14
// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
if (!Object.keys) {

    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null})
        hasDontEnumBug = false;

    Object.keys = function keys(object) {

        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError("Object.keys called on a non-object");

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }

        return keys;
    };

}

//
// Date
// ====
//

// ES5 15.9.5.43
// Format a Date object as a string according to a simplified subset of the ISO 8601
// standard as defined in 15.9.1.15.
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function toISOString() {
        var result, length, value;
        if (!isFinite(this))
            throw new RangeError;

        // the date time string format is specified in 15.9.1.15.
        result = [this.getUTCFullYear(), this.getUTCMonth() + 1, this.getUTCDate(),
            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two digits.
            if (value < 10)
                result[length] = "0" + value;
        }
        // pad milliseconds to have three digits.
        return result.slice(0, 3).join("-") + "T" + result.slice(3).join(":") + "." +
            ("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
    }
}

// ES5 15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

// ES5 15.9.5.44
if (!Date.prototype.toJSON) {
    Date.prototype.toJSON = function toJSON(key) {
        // This function provides a String representation of a Date object for
        // use by JSON.stringify (15.12.3). When the toJSON method is called
        // with argument key, the following steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ToPrimitive(O, hint Number).
        // 3. If tv is a Number and is not finite, return null.
        // XXX
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (typeof this.toISOString != "function")
            throw new TypeError(); // TODO message
        // 6. Return the result of calling the [[Call]] internal method of
        // toISO with O as the this value and an empty argument list.
        return this.toISOString();

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// 15.9.4.2 Date.parse (string)
// 15.9.1.15 Date Time String Format
// Date.parse
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
if (isNaN(Date.parse("2011-06-15T21:40:05+06:00"))) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    Date = (function(NativeDate) {

        // Date.length === 7
        var Date = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            if (this instanceof NativeDate) {
                var date = length == 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(Date.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
                // Prevent mixups with unfixed Date object
                date.constructor = Date;
                return date;
            }
            return NativeDate.apply(this, arguments);
        };

        // 15.9.1.15 Date Time String Format. This pattern does not implement
        // extended years (15.9.1.15.1), as `Date.UTC` cannot parse them.
        var isoDateExpression = new RegExp("^" +
            "(\\d{4})" + // four-digit year capture
            "(?:-(\\d{2})" + // optional month capture
            "(?:-(\\d{2})" + // optional day capture
            "(?:" + // capture hours:minutes:seconds.milliseconds
                "T(\\d{2})" + // hours capture
                ":(\\d{2})" + // minutes capture
                "(?:" + // optional :seconds.milliseconds
                    ":(\\d{2})" + // seconds capture
                    "(?:\\.(\\d{3}))?" + // milliseconds capture
                ")?" +
            "(?:" + // capture UTC offset component
                "Z|" + // UTC capture
                "(?:" + // offset specifier +/-hours:minutes
                    "([-+])" + // sign capture
                    "(\\d{2})" + // hours offset capture
                    ":(\\d{2})" + // minutes offset capture
                ")" +
            ")?)?)?)?" +
        "$");

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate)
            Date[key] = NativeDate[key];

        // Copy "native" methods explicitly; they may be non-enumerable
        Date.now = NativeDate.now;
        Date.UTC = NativeDate.UTC;
        Date.prototype = NativeDate.prototype;
        Date.prototype.constructor = Date;

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        Date.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                match.shift(); // kill match[0], the full match
                // parse months, days, hours, minutes, seconds, and milliseconds
                for (var i = 1; i < 7; i++) {
                    // provide default values if necessary
                    match[i] = +(match[i] || (i < 3 ? 1 : 0));
                    // match[1] is the month. Months are 0-11 in JavaScript
                    // `Date` objects, but 1-12 in ISO notation, so we
                    // decrement.
                    if (i == 1)
                        match[i]--;
                }

                // parse the UTC offset component
                var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();

                // compute the explicit time zone offset if specified
                var offset = 0;
                if (sign) {
                    // detect invalid offsets and return early
                    if (hourOffset > 23 || minuteOffset > 59)
                        return NaN;

                    // express the provided time zone offset in minutes. The offset is
                    // negative for time zones west of UTC; positive otherwise.
                    offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == "+" ? -1 : 1);
                }

                // compute a new UTC date value, accounting for the optional offset
                return NativeDate.UTC.apply(this, match) + offset;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return Date;
    })(Date);
}

//
// String
// ======
//

// ES5 15.5.4.20
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

//
// Util
// ======
//

// http://jsperf.com/to-integer
var toInteger = function (n) {
    n = +n;
    if (n !== n) // isNaN
        n = -1;
    else if (n !== 0 && n !== (1/0) && n !== -(1/0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    return n;
};

var prepareString = "a"[0] != "a",
    // ES5 9.9
    toObject = function (o) {
        if (o == null) { // this matches both null and undefined
            throw new TypeError(); // TODO message
        }
        // If the implementation doesn't support by-index access of
        // string characters (ex. IE < 7), split the string
        if (prepareString && typeof o == "string" && o) {
            return o.split("");
        }
        return Object(o);
    };
});

});

require.define("/node_modules/derby/node_modules/racer/lib/util/index.js", function (require, module, exports, __dirname, __filename) {
    var __slice = Array.prototype.slice;
module.exports = {
  mergeAll: function() {
    var from, froms, key, to, value, _i, _len;
    to = arguments[0], froms = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = froms.length; _i < _len; _i++) {
      from = froms[_i];
      for (key in from) {
        value = from[key];
        to[key] = value;
      }
    }
    return to;
  },
  merge: function(to, from) {
    var key, value;
    for (key in from) {
      value = from[key];
      to[key] = value;
    }
    return to;
  },
  hasKeys: function(obj, ignore) {
    var key;
    for (key in obj) {
      if (key === ignore) {
        continue;
      }
      return true;
    }
    return false;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/Model.js", function (require, module, exports, __dirname, __filename) {
    var EventEmitter, MemorySync, Model, merge, onMixins, pathParser;
var __slice = Array.prototype.slice;
MemorySync = require('./adapters/MemorySync');
pathParser = require('./pathParser');
EventEmitter = require('events').EventEmitter;
merge = require('./util').mergeAll;
Model = module.exports = function(_clientId, AdapterClass) {
  var adapter, init, self, _i, _len, _ref;
  this._clientId = _clientId != null ? _clientId : '';
  if (AdapterClass == null) {
    AdapterClass = MemorySync;
  }
  self = this;
  self._adapter = adapter = new AdapterClass;
  _ref = Model.mixins;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    init = _ref[_i].init;
    if (init) {
      init.call(self);
    }
  }
  self.silent = Object.create(self, {
    _silent: {
      value: true
    }
  });
};
Model.prototype._setSocket = function(socket) {
  var onConnected, self, setupSocket, _i, _len, _ref, _results;
  self = this;
  self.socket = socket;
  self.canConnect = true;
  socket.on('fatalErr', function() {
    self.canConnect = false;
    self.emit('canConnect', false);
    return socket.disconnect();
  });
  self.connected = false;
  onConnected = function() {
    self.emit('connected', self.connected);
    return self.emit('connectionStatus', self.connected, self.canConnect);
  };
  socket.on('connect', function() {
    self.connected = true;
    return onConnected();
  });
  socket.on('disconnect', function() {
    self.connected = false;
    return setTimeout(onConnected, 200);
  });
  socket.on('connect_failed', onConnected);
  _ref = Model.mixins;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    setupSocket = _ref[_i].setupSocket;
    _results.push(setupSocket ? setupSocket.call(this, socket) : void 0);
  }
  return _results;
};
Model.prototype["with"] = function(options) {
  return Object.create(this, {
    _with: {
      value: options
    }
  });
};
merge(Model.prototype, EventEmitter.prototype, {
  _eventListener: function(method, pattern, callback) {
    var re;
    if (pattern.call) {
      return pattern;
    }
    re = pathParser.eventRegExp(pattern);
    return function(_arg, isLocal) {
      var args, path;
      path = _arg[0], args = 2 <= _arg.length ? __slice.call(_arg, 1) : [];
      if (re.test(path)) {
        callback.apply(null, re.exec(path).slice(1).concat(args, isLocal));
        return true;
      }
    };
  },
  _on: EventEmitter.prototype.on,
  on: function(type, pattern, callback) {
    var listener;
    this._on(type, listener = this._eventListener(type, pattern, callback));
    return listener;
  },
  once: function(type, pattern, callback) {
    var g, listener, self;
    listener = this._eventListener(type, pattern, callback);
    self = this;
    this._on(type, g = function() {
      var matches;
      matches = listener.apply(null, arguments);
      if (matches) {
        return self.removeListener(type, g);
      }
    });
    return listener;
  }
});
Model.prototype.addListener = Model.prototype.on;
Model.mixins = [];
Model.accessors = {};
Model.mutators = {};
onMixins = [];
Model.mixin = function(mixin) {
  var cache, category, fn, key, name, obj, objs, onMixin, proto, static, value, _i, _j, _len, _len2, _ref;
  Model.mixins.push(mixin);
  if (proto = mixin.proto) {
    merge(Model.prototype, proto);
  }
  if (static = mixin.static) {
    merge(Model, static);
  }
  _ref = ['accessors', 'mutators'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    category = _ref[_i];
    cache = Model[category];
    if (objs = mixin[category]) {
      for (name in objs) {
        obj = objs[name];
        Model.prototype[name] = cache[name] = fn = obj.fn;
        for (key in obj) {
          value = obj[key];
          if (key === 'fn') {
            continue;
          }
          fn[key] = value;
        }
      }
    }
  }
  if (onMixin = mixin.onMixin) {
    onMixins.push(onMixin);
  }
  for (_j = 0, _len2 = onMixins.length; _j < _len2; _j++) {
    onMixin = onMixins[_j];
    onMixin(Model.mutators, Model.accessors);
  }
  return Model;
};
Model.mixin(require('./mixin.subscribe'));
Model.mixin(require('./mixin.refs'));
Model.mixin(require('./mixin.stm'));
Model.mixin(require('./mixin.ot'));
});

require.define("/node_modules/derby/node_modules/racer/lib/adapters/MemorySync.js", function (require, module, exports, __dirname, __filename) {
    var MemorySync, lookup, lookupAddPath, lookupSetVersion, lookupWithVersion, specClone, _ref;
var __slice = Array.prototype.slice;
_ref = require('./lookup'), lookup = _ref.lookup, lookupWithVersion = _ref.lookupWithVersion, lookupAddPath = _ref.lookupAddPath, lookupSetVersion = _ref.lookupSetVersion;
specClone = require('../specHelper').clone;
MemorySync = module.exports = function() {
  this._data = {
    world: {}
  };
  this._vers = {
    ver: 0
  };
};
MemorySync.prototype = {
  version: function(path, data) {
    if (path) {
      return lookupWithVersion(path, data || this._data, this._vers)[1].ver;
    } else {
      return this._vers.ver;
    }
  },
  get: function(path, data) {
    data || (data = this._data);
    if (path) {
      return lookup(path, data);
    } else {
      return data.world;
    }
  },
  getWithVersion: function(path, data) {
    var currVer, obj, _ref2;
    data || (data = this._data);
    if (path) {
      _ref2 = lookupWithVersion(path, data, this._vers), obj = _ref2[0], currVer = _ref2[1];
      return [obj, currVer.ver];
    } else {
      return [data.world, this._vers.ver];
    }
  },
  getRef: function(path, data) {
    return lookup(path, data || this._data, true);
  },
  getAddPath: function(path, data, ver, pathType) {
    return lookupAddPath(path, data || this._data, ver, pathType);
  },
  set: function(path, value, ver, data) {
    var parent, prop, _ref2;
    _ref2 = lookupSetVersion(path, data || this._data, this._vers, ver, 'object'), parent = _ref2[1], prop = _ref2[2];
    return parent[prop] = value;
  },
  del: function(path, ver, data) {
    var grandparent, index, obj, parent, parentClone, parentPath, parentProp, prop, _ref2, _ref3;
    data || (data = this._data);
    _ref2 = lookupSetVersion(path, data, this._vers, ver), obj = _ref2[0], parent = _ref2[1], prop = _ref2[2];
    if (ver != null) {
      delete parent[prop];
      return obj;
    }
    if (!parent) {
      return obj;
    }
    if (~(index = path.lastIndexOf('.'))) {
      parentPath = path.substr(0, index);
      _ref3 = lookupSetVersion(parentPath, data, this._vers, ver), parent = _ref3[0], grandparent = _ref3[1], parentProp = _ref3[2];
    } else {
      parent = data.world;
      grandparent = data;
      parentProp = 'world';
    }
    parentClone = specClone(parent);
    delete parentClone[prop];
    grandparent[parentProp] = parentClone;
    return obj;
  },
  push: function() {
    var args, arr, data, path, ver, _i;
    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    return arr.push.apply(arr, args);
  },
  unshift: function() {
    var args, arr, data, path, ver, _i;
    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    return arr.unshift.apply(arr, args);
  },
  splice: function() {
    var args, arr, data, path, ver, _i;
    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    return arr.splice.apply(arr, args);
  },
  pop: function(path, ver, data) {
    var arr;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    return arr.pop();
  },
  shift: function(path, ver, data) {
    var arr;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    return arr.shift();
  },
  insertAfter: function(path, afterIndex, value, ver, data) {
    var arr, outOfBounds;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    outOfBounds = !((-1 <= afterIndex && afterIndex <= arr.length - 1));
    if (outOfBounds) {
      throw new Error('Out of Bounds');
    }
    arr.splice(afterIndex + 1, 0, value);
    return arr.length;
  },
  insertBefore: function(path, beforeIndex, value, ver, data) {
    var arr, outOfBounds;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    outOfBounds = !((0 <= beforeIndex && beforeIndex <= arr.length));
    if (outOfBounds) {
      throw new Error('Out of Bounds');
    }
    arr.splice(beforeIndex, 0, value);
    return arr.length;
  },
  remove: function(path, startIndex, howMany, ver, data) {
    var arr, outOfBounds;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    outOfBounds = !((0 <= startIndex && startIndex <= (arr.length && arr.length - 1 || 0)));
    if (outOfBounds) {
      throw new Error('Out of Bounds');
    }
    return arr.splice(startIndex, howMany);
  },
  move: function(path, from, to, ver, data) {
    var arr, len, outOfBounds, value;
    arr = lookupSetVersion(path, data || this._data, this._vers, ver, 'array')[0];
    if (!Array.isArray(arr)) {
      throw new Error('Not an Array');
    }
    len = arr.length;
    if (from < 0) {
      from += len;
    }
    if (to < 0) {
      to += len;
    }
    outOfBounds = !(((0 <= from && from < len)) && ((0 <= to && to < len)));
    if (outOfBounds) {
      throw new Error('Out of Bounds');
    }
    value = arr.splice(from, 1)[0];
    arr.splice(to, 0, value);
    return value;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/adapters/lookup.js", function (require, module, exports, __dirname, __filename) {
    var create, createArray, createObject, lookup, lookupAddPath, lookupSetVersion, lookupWithVersion, _ref;
_ref = require('../specHelper'), create = _ref.create, createObject = _ref.createObject, createArray = _ref.createArray;
lookup = function(path, data, getRef) {
  var curr, dereffedPath, i, index, key, keyObj, len, prop, props, refObj;
  curr = data.world;
  props = path.split('.');
  path = '';
  data.$remainder = '';
  i = 0;
  len = props.length;
  while (i < len) {
    prop = props[i++];
    curr = curr[prop];
    path = path ? path + '.' + prop : prop;
    if (curr == null) {
      data.$remainder = props.slice(i).join('.');
      break;
    }
    if (curr.$r) {
      if (getRef && i === len) {
        break;
      }
      refObj = lookup(curr.$r, data);
      dereffedPath = data.$remainder ? "" + data.$path + "." + data.$remainder : data.$path;
      if (key = curr.$k) {
        if (Array.isArray(keyObj = lookup(key, data))) {
          if (i < len) {
            prop = keyObj[props[i++]];
            path = dereffedPath + '.' + prop;
            curr = lookup(path, data);
          } else {
            curr = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = keyObj.length; _i < _len; _i++) {
                index = keyObj[_i];
                _results.push(lookup(dereffedPath + '.' + index, data));
              }
              return _results;
            })();
          }
        } else {
          dereffedPath += '.' + keyObj;
          curr = lookup(dereffedPath, data);
          if (i !== len) {
            path = dereffedPath;
          }
        }
      } else {
        curr = refObj;
        if (i !== len) {
          path = dereffedPath;
        }
      }
      if (curr == null) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
    }
  }
  data.$path = path;
  return curr;
};
lookupWithVersion = function(path, data, vers) {
  var curr, currVer, dereffedPath, i, index, key, keyObj, len, prop, props, refObj, _ref2, _ref3;
  curr = data.world;
  currVer = vers;
  props = path.split('.');
  path = '';
  data.$remainder = '';
  i = 0;
  len = props.length;
  while (i < len) {
    prop = props[i++];
    curr = curr[prop];
    currVer = currVer[prop] || currVer;
    path = path ? path + '.' + prop : prop;
    if (curr == null) {
      data.$remainder = props.slice(i).join('.');
      break;
    }
    if (curr.$r) {
      _ref2 = lookupWithVersion(curr.$r, data, vers), refObj = _ref2[0], currVer = _ref2[1];
      dereffedPath = data.$remainder ? "" + data.$path + "." + data.$remainder : data.$path;
      if (key = curr.$k) {
        if (Array.isArray(keyObj = lookup(key, data))) {
          if (i < len) {
            prop = keyObj[props[i++]];
            path = dereffedPath + '.' + prop;
            _ref3 = lookupWithVersion(path, data, vers), curr = _ref3[0], currVer = _ref3[1];
          } else {
            curr = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = keyObj.length; _i < _len; _i++) {
                index = keyObj[_i];
                _results.push(lookup(dereffedPath + '.' + index, data));
              }
              return _results;
            })();
          }
        } else {
          dereffedPath += '.' + keyObj;
          curr = lookup(dereffedPath, data);
          if (i !== len) {
            path = dereffedPath;
          }
        }
      } else {
        curr = refObj;
        if (i !== len) {
          path = dereffedPath;
        }
      }
      if (curr == null) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
    }
  }
  data.$path = path;
  return [curr, currVer];
};
lookupAddPath = function(path, data, setVer, pathType) {
  var curr, dereffedPath, i, index, key, keyObj, len, parent, prop, props, refObj, speculative;
  speculative = setVer == null;
  curr = data.world = speculative ? create(data.world) : data.world;
  props = path.split('.');
  path = '';
  data.$remainder = '';
  i = 0;
  len = props.length;
  while (i < len) {
    prop = props[i++];
    parent = curr;
    curr = curr[prop];
    path = path ? path + '.' + prop : prop;
    if (curr != null) {
      if (speculative && typeof curr === 'object') {
        curr = parent[prop] = create(curr);
      }
    } else {
      if (!pathType) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
      curr = parent[prop] = speculative ? pathType === 'array' && i === len ? createArray() : createObject() : pathType === 'array' && i === len ? [] : {};
    }
    if (curr.$r) {
      refObj = lookupAddPath(curr.$r, data, setVer, pathType);
      dereffedPath = data.$remainder ? "" + data.$path + "." + data.$remainder : data.$path;
      if (key = curr.$k) {
        if (Array.isArray(keyObj = lookup(key, data))) {
          if (i < len) {
            prop = keyObj[props[i++]];
            path = dereffedPath + '.' + prop;
            curr = lookupAddPath(path, data, setVer, pathType);
          } else {
            curr = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = keyObj.length; _i < _len; _i++) {
                index = keyObj[_i];
                _results.push(lookup(dereffedPath + '.' + index, data));
              }
              return _results;
            })();
          }
        } else {
          dereffedPath += '.' + keyObj;
          curr = lookup(dereffedPath, data);
          if (i !== len) {
            path = dereffedPath;
          }
        }
      } else {
        curr = refObj;
        if (i !== len) {
          path = dereffedPath;
        }
      }
      if (curr == null && !pathType) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
    }
  }
  data.$path = path;
  return curr;
};
lookupSetVersion = function(path, data, vers, setVer, pathType) {
  var curr, currVer, dereffedPath, i, index, key, keyObj, len, parent, prop, props, refObj, speculative, _ref2, _ref3;
  speculative = setVer == null;
  curr = data.world = speculative ? create(data.world) : data.world;
  currVer = vers;
  if (setVer) {
    currVer.ver = setVer = Math.max(setVer, currVer.ver);
  }
  props = path.split('.');
  path = '';
  data.$remainder = '';
  i = 0;
  len = props.length;
  while (i < len) {
    prop = props[i++];
    parent = curr;
    curr = curr[prop];
    currVer = currVer[prop] || (pathType && setVer ? currVer[prop] = {} : currVer);
    path = path ? path + '.' + prop : prop;
    if (curr != null) {
      if (speculative && typeof curr === 'object') {
        curr = parent[prop] = create(curr);
      }
    } else {
      if (!pathType) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
      curr = parent[prop] = speculative ? pathType === 'array' && i === len ? createArray() : createObject() : pathType === 'array' && i === len ? [] : {};
    }
    if (curr.$r) {
      _ref2 = lookupSetVersion(curr.$r, data, vers, setVer, pathType), refObj = _ref2[0], currVer = _ref2[3];
      dereffedPath = data.$remainder ? "" + data.$path + "." + data.$remainder : data.$path;
      if (key = curr.$k) {
        if (Array.isArray(keyObj = lookup(key, data))) {
          if (i < len) {
            prop = keyObj[props[i++]];
            path = dereffedPath + '.' + prop;
            _ref3 = lookupSetVersion(path, data, vers, setVer, pathType), curr = _ref3[0], currVer = _ref3[3];
          } else {
            curr = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = keyObj.length; _i < _len; _i++) {
                index = keyObj[_i];
                _results.push(lookup(dereffedPath + '.' + index, data));
              }
              return _results;
            })();
          }
        } else {
          dereffedPath += '.' + keyObj;
          curr = lookup(dereffedPath, data);
          if (i !== len) {
            path = dereffedPath;
          }
        }
      } else {
        curr = refObj;
        if (i !== len) {
          path = dereffedPath;
        }
      }
      if (curr == null && !pathType) {
        data.$remainder = props.slice(i).join('.');
        break;
      }
    } else {
      if (setVer) {
        currVer.ver = setVer;
      }
    }
  }
  data.$path = path;
  return [curr, parent, prop, currVer];
};
module.exports = {
  lookup: lookup,
  lookupWithVersion: lookupWithVersion,
  lookupAddPath: lookupAddPath,
  lookupSetVersion: lookupSetVersion
};
});

require.define("/node_modules/derby/node_modules/racer/lib/specHelper.js", function (require, module, exports, __dirname, __filename) {
    var merge;
merge = require('./util').merge;
module.exports = {
  createObject: function() {
    return {
      $spec: true
    };
  },
  createArray: function() {
    var obj;
    obj = [];
    obj.$spec = true;
    return obj;
  },
  create: function(proto) {
    var obj;
    if (proto.$spec) {
      return proto;
    }
    if (Array.isArray(proto)) {
      obj = proto.slice();
      obj.$spec = true;
      return obj;
    }
    obj = Object.create(proto);
    obj.$spec = true;
    return obj;
  },
  clone: function(proto) {
    var obj;
    if (Array.isArray(proto)) {
      obj = proto.slice();
      obj.$spec = true;
      return obj;
    }
    return merge({}, proto);
  },
  isSpeculative: function(obj) {
    return obj && obj.$spec;
  },
  identifier: '$spec'
};
});

require.define("/node_modules/derby/node_modules/racer/lib/pathParser.js", function (require, module, exports, __dirname, __filename) {
    module.exports = {
  isPrivate: function(name) {
    return /(?:^_)|(?:\._)/.test(name);
  },
  eventRegExp: function(pattern) {
    if (pattern instanceof RegExp) {
      return pattern;
    } else {
      return new RegExp('^' + pattern.replace(/[,.*]/g, function(match, index) {
        if (match === '.') {
          return '\\.';
        } else if (match === ',') {
          return '|';
        } else if (pattern.length - index === 1) {
          return '(.+)';
        } else {
          return '([^.]+)';
        }
      }) + '$');
    }
  },
  regExp: function(pattern) {
    if (!pattern) {
      return /^/;
    } else {
      return new RegExp('^' + pattern.replace(/[.*]/g, function(match, index) {
        if (match === '.') {
          return '\\.';
        } else {
          return '[^.]+';
        }
      }) + '(?:\\.|$)');
    }
  },
  fastLookup: function(path, obj) {
    var prop, _i, _len, _ref;
    _ref = path.split('.');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      prop = _ref[_i];
      if (!(obj = obj[prop])) {
        return;
      }
    }
    return obj;
  },
  fastLookupBreakOnRef: function(path, obj) {
    var prop, _i, _len, _ref;
    _ref = path.split('.');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      prop = _ref[_i];
      if (obj.$r) {
        return obj;
      }
      if (!(obj = obj[prop])) {
        return;
      }
    }
    return obj;
  },
  split: function(path) {
    return path.split(/\.?[(*]\.?/);
  },
  expand: function(path) {
    var lastClosed, match, out, paths, pre, stack, token, val, _i, _len, _results;
    path = path.replace(/[\s\n]/g, '');
    if (!~path.indexOf('(')) {
      return [path];
    }
    stack = {
      paths: paths = [''],
      out: out = []
    };
    while (path) {
      if (!(match = /^([^,()]*)([,()])(.*)/.exec(path))) {
        _results = [];
        for (_i = 0, _len = out.length; _i < _len; _i++) {
          val = out[_i];
          _results.push(val + path);
        }
        return _results;
      }
      pre = match[1];
      token = match[2];
      path = match[3];
      if (pre) {
        paths = (function() {
          var _j, _len2, _results2;
          _results2 = [];
          for (_j = 0, _len2 = paths.length; _j < _len2; _j++) {
            val = paths[_j];
            _results2.push(val + pre);
          }
          return _results2;
        })();
        if (token !== '(') {
          out = lastClosed ? paths : out.concat(paths);
        }
      }
      lastClosed = false;
      if (token === ',') {
        stack.out = stack.out.concat(paths);
        paths = stack.paths;
      } else if (token === '(') {
        stack = {
          parent: stack,
          paths: paths,
          out: out = []
        };
      } else if (token === ')') {
        lastClosed = true;
        paths = out = stack.out.concat(paths);
        stack = stack.parent;
      }
    }
    return out;
  }
};
});

require.define("events", function (require, module, exports, __dirname, __filename) {
    if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.subscribe/index.js", function (require, module, exports, __dirname, __filename) {
    var empty, pathParser, setSubDatum;
var __slice = Array.prototype.slice;
pathParser = require('../pathParser');
empty = function() {};
module.exports = {
  init: function() {
    return this._storeSubs = {};
  },
  setupSocket: function(socket) {
    var self, _adapter;
    _adapter = (self = this)._adapter;
    return socket.on('connect', function() {
      var storeSubs;
      storeSubs = Object.keys(self._storeSubs);
      return socket.emit('sub', self._clientId, storeSubs, _adapter.version(), self._startId);
    });
  },
  proto: {
    subscribe: function() {
      var addPath, callback, key, path, paths, root, storeSubs, value, _i, _j, _len, _paths;
      _paths = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (typeof callback !== 'function') {
        _paths.push(callback);
        callback = empty;
      }
      paths = [];
      storeSubs = this._storeSubs;
      addPath = function(path) {
        var _j, _len, _ref, _results;
        _ref = pathParser.expand(path);
        _results = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          path = _ref[_j];
          if (storeSubs[path]) {
            return;
          }
          storeSubs[path] = 1;
          _results.push(paths.push(path));
        }
        return _results;
      };
      for (_j = 0, _len = _paths.length; _j < _len; _j++) {
        path = _paths[_j];
        if (typeof path === 'object') {
          for (key in path) {
            value = path[key];
            root = pathParser.split(value)[0];
            this.set(key, this.ref(root));
            addPath(value);
          }
        } else {
          addPath(path);
        }
      }
      if (!paths.length) {
        return callback();
      }
      return this._addSub(paths, callback);
    },
    unsubscribe: function() {
      var callback, paths, _i;
      paths = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (typeof callback !== 'function') {
        paths.push(callback);
        callback = empty;
      }
      throw new Error('Unimplemented: unsubscribe');
    },
    _addSub: function(paths, callback) {
      var self;
      self = this;
      if (!this.connected) {
        return callback();
      }
      return this.socket.emit('subAdd', this._clientId, paths, function(data, otData) {
        self._initSubData(data);
        self._initSubOtData(otData);
        return callback();
      });
    },
    _initSubData: function(data) {
      var adapter, datum, _i, _len;
      adapter = this._adapter;
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        datum = data[_i];
        setSubDatum(adapter, datum);
      }
    },
    _initSubOtData: function(data) {
      var field, fields, path;
      fields = this.otFields;
      for (path in data) {
        field = data[path];
        fields[path] = field;
      }
    }
  }
};
setSubDatum = function(adapter, _arg) {
  var k, path, v, value, ver;
  path = _arg[0], value = _arg[1], ver = _arg[2];
  if (path === '') {
    if (typeof value === 'object') {
      for (k in value) {
        v = value[k];
        adapter.set(k, v, ver);
      }
      return;
    }
    throw 'Cannot subscribe to "' + path('"');
  }
  return adapter.set(path, value, ver);
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.refs/index.js", function (require, module, exports, __dirname, __filename) {
    var RefHelper, alreadySeen, arrayMutators, hasKeys, indiciesToIds, mutators, specIdentifier;
var __slice = Array.prototype.slice;
specIdentifier = require('../specHelper').identifier;
hasKeys = require('../util').hasKeys;
mutators = {};
arrayMutators = {};
module.exports = {
  init: function() {
    return this._refHelper = new RefHelper(this);
  },
  proto: {
    ref: function(ref, key) {
      if (key != null) {
        return {
          $r: ref,
          $k: key
        };
      } else {
        return {
          $r: ref
        };
      }
    },
    arrayRef: function(ref, key) {
      return {
        $r: ref,
        $k: key,
        $t: 'array'
      };
    },
    _dereference: function(path, data) {
      this._adapter.get(path, data || (data = this._specModel()));
      if (data.$remainder) {
        return data.$path + '.' + data.$remainder;
      } else {
        return data.$path;
      }
    }
  },
  onMixin: function(_mutators) {
    var fn, mutator, _results;
    mutators = _mutators;
    _results = [];
    for (mutator in _mutators) {
      fn = _mutators[mutator];
      _results.push(fn.type === 'array' ? arrayMutators[mutator] = fn : void 0);
    }
    return _results;
  }
};
RefHelper = function(model) {
  var adapter, eachNode, method, refHelper, _fn;
  this._model = model;
  this._adapter = adapter = model._adapter;
  refHelper = this;
  model.on('beforeTxn', function(method, args) {
    var $k, $r, arg, data, i, id, ids, index, indexArgs, keyId, keyObj, path, refObj, _i, _len, _len2, _ref, _results;
    if ((path = args[0]) == null) {
      return;
    }
    data = model._specModel();
    if (arrayMutators[method] && (refObj = adapter.getRef(path, data)) && refObj.$t === 'array') {
      $r = refObj.$r, $k = refObj.$k;
      $k = model._dereference($k, data);
      if (indexArgs = arrayMutators[method].indexArgs) {
        ids = {};
        keyObj = adapter.get($k, data);
        for (_i = 0, _len = indexArgs.length; _i < _len; _i++) {
          i = indexArgs[_i];
          if ((id = (_ref = args[i]) != null ? _ref.id : void 0) == null) {
            continue;
          }
          ids[i] = id;
          args.meta = {
            ids: ids
          };
          for (index = 0, _len2 = keyObj.length; index < _len2; index++) {
            keyId = keyObj[index];
            if (keyId == id) {
              args[i] = index;
              break;
            }
          }
        }
      }
      args[0] = path = $k;
      if (i = mutators[method].insertArgs) {
        _results = [];
        while (arg = args[i]) {
          if (id = arg.id) {
            if (hasKeys(arg, 'id')) {
              model.set($r + '.' + id, arg);
            }
            args[i] = id;
          } else {
            throw Error('arrayRef mutators require an id');
          }
          _results.push(i++);
        }
        return _results;
      }
    } else {
      return args[0] = model._dereference(path, data);
    }
  });
  _fn = function(method) {
    return model.on(method, function(args, isLocal, meta) {
      return refHelper.notifyPointersTo(method, args, isLocal, meta);
    });
  };
  for (method in mutators) {
    _fn(method);
  }
  eachNode = function(path, value, callback) {
    var nodePath, prop, val, _results;
    callback(path, value);
    _results = [];
    for (prop in value) {
      val = value[prop];
      nodePath = "" + path + "." + prop;
      _results.push(Object === (val != null ? val.constructor : void 0) ? eachNode(nodePath, val, callback) : callback(nodePath, val));
    }
    return _results;
  };
  model.on('setPre', function(_arg, ver, data) {
    var path, value;
    path = _arg[0], value = _arg[1];
    return eachNode(path, value, function(path, value) {
      if (value && value.$r) {
        return refHelper.$indexRefs(path, value.$r, value.$k, value.$t, ver, data);
      }
    });
  });
  model.on('setPost', function(_arg, ver, data) {
    var path, value;
    path = _arg[0], value = _arg[1];
    return eachNode(path, value, function(path, value) {
      return refHelper.updateRefsForKey(path, ver, data);
    });
  });
  model.on('delPost', function(_arg, ver, data) {
    var path;
    path = _arg[0];
    if (refHelper.isPathPointedTo(path, data)) {
      return refHelper.cleanupPointersTo(path, ver, data);
    }
  });
  for (method in arrayMutators) {
    model.on(method + 'Post', function(args, ver, data, meta) {
      var path, refObj;
      path = args[0];
      data || (data = model._specModel());
      if ((refObj = adapter.getRef(path, data)) && refObj.$t === 'array') {
        indiciesToIds(args, meta);
      }
      return refHelper.updateRefsForKey(path, ver, data);
    });
  }
};
RefHelper.prototype = {
  isPathPointedTo: function(path, data) {
    var found;
    found = this._adapter.get("$refs." + path + ".$", data);
    return found !== void 0;
  },
  $indexRefs: function(path, ref, key, type, ver, data) {
    var adapter, entry, keyVal, oldKey, oldRefObj, refs, refsKey, refsKeys, self;
    adapter = this._adapter;
    self = this;
    oldRefObj = adapter.getRef(path, data);
    if (key) {
      entry = [ref, key];
      if (type) {
        entry.push(type);
      }
      adapter.getAddPath("$keys." + key + ".$", data, ver, 'object')[path] = entry;
      keyVal = adapter.get(key, data);
      if (type === void 0 && keyVal === void 0) {
        return;
      }
      if (type === 'array') {
        keyVal = adapter.getAddPath(key, data, ver, 'array');
        refsKeys = keyVal.map(function(keyValMem) {
          return ref + '.' + keyValMem;
        });
        this._removeOld$refs(oldRefObj, path, ver, data);
        return refsKeys.forEach(function(refsKey) {
          return self._update$refs(refsKey, path, ref, key, type, ver, data);
        });
      }
      refsKey = ref + '.' + keyVal;
    } else {
      if (oldRefObj && (oldKey = oldRefObj.$k)) {
        refs = adapter.get("$keys." + oldKey + ".$", data);
        if (refs && refs[path]) {
          delete refs[path];
          if (!hasKeys(refs, specIdentifier)) {
            adapter.del("$keys." + oldKey, ver, data);
          }
        }
      }
      refsKey = ref;
    }
    this._removeOld$refs(oldRefObj, path, ver, data);
    return this._update$refs(refsKey, path, ref, key, type, ver, data);
  },
  _removeOld$refs: function(oldRefObj, path, ver, data) {
    var oldKey, oldKeyVal, oldRef, refHelper;
    if (oldRefObj && (oldRef = oldRefObj.$r)) {
      if (oldKey = oldRefObj.$k) {
        oldKeyVal = this._adapter.get(oldKey, data);
      }
      if (oldKey && (oldRefObj.$t === 'array')) {
        refHelper = this;
        oldKeyVal.forEach(function(oldKeyMem) {
          return refHelper._removeFrom$refs(oldRef, oldKeyMem, path, ver, data);
        });
        return this._removeFrom$refs(oldRef, void 0, path, ver, data);
      } else {
        return this._removeFrom$refs(oldRef, oldKeyVal, path, ver, data);
      }
    }
  },
  _removeFrom$refs: function(ref, key, path, ver, data) {
    var refEntries, refWithKey;
    if (key) {
      refWithKey = ref + '.' + key;
    }
    refEntries = this._adapter.get("$refs." + refWithKey + ".$", data);
    if (!refEntries) {
      return;
    }
    delete refEntries[path];
    if (!hasKeys(refEntries, specIdentifier)) {
      return this._adapter.del("$refs." + ref, ver, data);
    }
  },
  _update$refs: function(refsKey, path, ref, key, type, ver, data) {
    var entry;
    entry = [ref, key];
    if (type) {
      entry.push(type);
    }
    return this._adapter.getAddPath("$refs." + refsKey + ".$", data, ver, 'object')[path] = entry;
  },
  updateRefsForKey: function(path, ver, data) {
    var refs, self;
    self = this;
    if (refs = this._adapter.get("$keys." + path + ".$", data)) {
      this._eachValidRef(refs, data, function(path, ref, key, type) {
        return self.$indexRefs(path, ref, key, type, ver, data);
      });
    }
    return this.eachValidRefPointingTo(path, data, function(pointingPath, targetPathRemainder, ref, key, type) {
      return self.updateRefsForKey(pointingPath + '.' + targetPathRemainder, ver, data);
    });
  },
  _eachValidRef: function(refs, data, callback) {
    var key, o, path, ref, type, _ref, _results;
    _results = [];
    for (path in refs) {
      _ref = refs[path], ref = _ref[0], key = _ref[1], type = _ref[2];
      if (path === specIdentifier) {
        continue;
      }
      o = this._adapter.getRef(path, data);
      _results.push(o && o.$r === ref && o.$k == key ? callback(path, ref, key, type) : delete refs[path]);
    }
    return _results;
  },
  _eachRefSetPointingTo: function(path, refs, fn) {
    var i, prop, props, refPos, refSet, _results;
    i = 0;
    refPos = refs;
    props = path.split('.');
    _results = [];
    while (prop = props[i++]) {
      if (!(refPos = refPos[prop])) {
        return;
      }
      _results.push((refSet = refPos.$) ? fn(refSet, props.slice(i).join('.'), prop) : void 0);
    }
    return _results;
  },
  eachValidRefPointingTo: function(targetPath, data, fn) {
    var refs, self;
    if (!(refs = this._adapter.get('$refs', data))) {
      return;
    }
    self = this;
    return self._eachRefSetPointingTo(targetPath, refs, function(refSet, targetPathRemainder, possibleIndex) {
      return self._eachValidRef(refSet, data, function(pointingPath, ref, key, type) {
        if (type === 'array') {
          targetPathRemainder = possibleIndex + '.' + targetPathRemainder;
        }
        return fn(pointingPath, targetPathRemainder, ref, key, type);
      });
    });
  },
  eachArrayRefKeyedBy: function(path, data, fn) {
    var key, ref, refSet, refs, type, _ref, _results;
    if (!(refs = this._adapter.get('$keys', data))) {
      return;
    }
    refSet = (path + '.$').split('.').reduce(function(refSet, prop) {
      return refSet && refSet[prop];
    }, refs);
    if (!refSet) {
      return;
    }
    _results = [];
    for (path in refSet) {
      _ref = refSet[path], ref = _ref[0], key = _ref[1], type = _ref[2];
      _results.push(type === 'array' ? fn(path, ref, key) : void 0);
    }
    return _results;
  },
  notifyPointersTo: function(method, _arg, isLocal, meta) {
    var adapter, args, data, ignoreRoots, model, targetPath;
    targetPath = _arg[0], args = 2 <= _arg.length ? __slice.call(_arg, 1) : [];
    model = this._model;
    adapter = this._adapter;
    data = model._specModel();
    ignoreRoots = [];
    this.eachValidRefPointingTo(targetPath, data, function(pointingPath, targetPathRemainder, ref, key, type) {
      var id, index, keyArr, rest, _ref;
      if (type !== 'array') {
        if (alreadySeen(pointingPath, ref, ignoreRoots)) {
          return;
        }
        if (targetPathRemainder) {
          pointingPath += '.' + targetPathRemainder;
        }
      } else if (targetPathRemainder) {
        _ref = targetPathRemainder.split('.'), id = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
        keyArr = adapter.get(key, data);
        index = keyArr.indexOf(id);
        index = index === -1 ? keyArr.indexOf(parseInt(id, 10)) : index;
        if (index !== -1) {
          pointingPath += '.' + index;
          if (rest.length) {
            pointingPath += '.' + rest.join('.');
          }
        }
      }
      return model.emit(method, [pointingPath].concat(__slice.call(args)), isLocal, meta);
    });
    return this.eachArrayRefKeyedBy(targetPath, data, function(pointingPath, ref, key) {
      var i, obj;
      args = [pointingPath].concat(__slice.call(args));
      if (i = mutators[method].insertArgs) {
        obj = adapter.get(ref, data);
        while ((key = args[i]) != null) {
          args[i++] = obj[key];
        }
      }
      indiciesToIds(args, meta);
      return model.emit(method, args, isLocal, meta);
    });
  },
  cleanupPointersTo: function(path, ver, data) {
    var adapter, key, keyMem, keyVal, pointingPath, ref, refs, _ref, _results;
    adapter = this._adapter;
    refs = adapter.get("$refs." + path + ".$", data);
    if (refs === void 0) {
      return;
    }
    _results = [];
    for (pointingPath in refs) {
      _ref = refs[pointingPath], ref = _ref[0], key = _ref[1];
      keyVal = key && adapter.get(key, data);
      _results.push(keyVal && Array.isArray(keyVal) ? (keyMem = path.substr(ref.length + 1, pointingPath.length), adapter.remove(key, keyVal.indexOf(keyMem), 1, null, data), this.updateRefsForKey(key, ver, data)) : void 0);
    }
    return _results;
  }
};
alreadySeen = function(pointingPath, ref, ignoreRoots) {
  var root;
  for (root in ignoreRoots) {
    if (root === pointingPath.substr(0, root.length)) {
      return true;
    }
  }
  ignoreRoots.push(ref);
  return false;
};
indiciesToIds = function(args, meta) {
  var i, id, ids, _results;
  if (ids = meta != null ? meta.ids : void 0) {
    _results = [];
    for (i in ids) {
      id = ids[i];
      _results.push(args[i] = {
        id: id,
        index: args[i]
      });
    }
    return _results;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.stm/index.js", function (require, module, exports, __dirname, __filename) {
    var Async, AtomicModel, RESEND_INTERVAL, SEND_TIMEOUT, Serializer, pathParser, specCreate, stm, transaction;
var __slice = Array.prototype.slice;
transaction = require('../transaction');
pathParser = require('../pathParser');
Serializer = require('../Serializer');
specCreate = require('../specHelper').create;
AtomicModel = require('./AtomicModel');
Async = require('./Async');
stm = module.exports = {
  static: {
    _SEND_TIMEOUT: SEND_TIMEOUT = 10000,
    _RESEND_INTERVAL: RESEND_INTERVAL = 2000
  },
  init: function() {
    var adapter, self, txnApplier, txnQueue, txns;
    this._specCache = {
      invalidate: function() {
        delete this.data;
        return delete this.lastTxnId;
      }
    };
    this._startId = '';
    this._atomicModels = {};
    this._txnCount = 0;
    this._txns = txns = {};
    this._txnQueue = txnQueue = [];
    adapter = this._adapter;
    self = this;
    txnApplier = new Serializer({
      withEach: function(txn) {
        if (transaction.base(txn) > adapter.version()) {
          return self._applyTxn(txn);
        }
      },
      onTimeout: function() {
        return self._reqNewTxns();
      }
    });
    this._onTxn = function(txn, num) {
      var queuedTxn;
      if (queuedTxn = txns[transaction.id(txn)]) {
        txn.callback = queuedTxn.callback;
        txn.emitted = queuedTxn.emitted;
      }
      return txnApplier.add(txn, num);
    };
    this._onTxnNum = function(num) {
      txnApplier.setIndex((+num || 0) + 1);
      return txnApplier.clearPending();
    };
    this._removeTxn = function(txnId) {
      var i;
      delete txns[txnId];
      if (~(i = txnQueue.indexOf(txnId))) {
        txnQueue.splice(i, 1);
      }
      return self._specCache.invalidate();
    };
    this.force = Object.create(this, {
      _force: {
        value: true
      }
    });
    return this.async = new Async(this);
  },
  setupSocket: function(socket) {
    var commit, resend, resendInterval, self, _adapter, _onTxn, _ref, _removeTxn, _txnQueue, _txns;
    _ref = self = this, _adapter = _ref._adapter, _txns = _ref._txns, _txnQueue = _ref._txnQueue, _onTxn = _ref._onTxn, _removeTxn = _ref._removeTxn;
    this._commit = commit = function(txn) {
      if (!socket.socket.connected) {
        return;
      }
      txn.timeout = +new Date + SEND_TIMEOUT;
      return socket.emit('txn', txn, self._startId);
    };
    socket.on('txn', _onTxn);
    socket.on('txnNum', this._onTxnNum);
    socket.on('txnOk', function(txnId, base, num) {
      var txn;
      if (!(txn = _txns[txnId])) {
        return;
      }
      transaction.base(txn, base);
      return _onTxn(txn, num);
    });
    socket.on('txnErr', function(err, txnId) {
      var callback, callbackArgs, txn;
      txn = _txns[txnId];
      if (txn && (callback = txn.callback)) {
        if (transaction.isCompound(txn)) {
          callbackArgs = transaction.ops(txn);
        } else {
          callbackArgs = transaction.args(txn).slice(0);
        }
        callbackArgs.unshift(err);
        callback.apply(null, callbackArgs);
      }
      return _removeTxn(txnId);
    });
    this._reqNewTxns = function() {
      return socket.emit('txnsSince', _adapter.version() + 1, self._startId);
    };
    resendInterval = null;
    resend = function() {
      var id, now, txn, _i, _len, _results;
      now = +new Date;
      _results = [];
      for (_i = 0, _len = _txnQueue.length; _i < _len; _i++) {
        id = _txnQueue[_i];
        txn = _txns[id];
        if (txn.timeout > now) {
          return;
        }
        _results.push(commit(txn));
      }
      return _results;
    };
    socket.on('connect', function() {
      var id, _i, _len;
      for (_i = 0, _len = _txnQueue.length; _i < _len; _i++) {
        id = _txnQueue[_i];
        commit(_txns[id]);
      }
      if (!resendInterval) {
        return resendInterval = setInterval(resend, RESEND_INTERVAL);
      }
    });
    return socket.on('disconnect', function() {
      if (resendInterval) {
        clearInterval(resendInterval);
      }
      return resendInterval = null;
    });
  },
  proto: {
    _commit: function() {},
    _reqNewTxns: function() {},
    _nextTxnId: function() {
      return this._clientId + '.' + this._txnCount++;
    },
    _queueTxn: function(txn, callback) {
      var id;
      txn.callback = callback;
      id = transaction.id(txn);
      this._txns[id] = txn;
      return this._txnQueue.push(id);
    },
    _getVer: function() {
      if (this._force) {
        return null;
      } else {
        return this._adapter.version();
      }
    },
    _addOpAsTxn: function(method, args, callback) {
      var base, id, meta, path, txn;
      this.emit('beforeTxn', method, args);
      base = this._getVer();
      id = this._nextTxnId();
      meta = args.meta;
      txn = transaction.create({
        base: base,
        id: id,
        method: method,
        args: args,
        meta: meta
      });
      this._queueTxn(txn, callback);
      if ((path = args[0]) == null) {
        return;
      }
      if (pathParser.isPrivate(path)) {
        this._specCache.invalidate();
        return this._applyTxn(txn);
      }
      if (!this._silent) {
        args = args.slice();
        this.emit(method + 'Post', args, null, null, meta);
        if ('_with' in this) {
          args = args.concat(this._with);
        }
        this.emit(method, args, true, meta);
      }
      txn.emitted = true;
      this._commit(txn);
      return this._specModel().$out;
    },
    _applyTxn: function(txn) {
      var callback, data, doEmit, isCompound, isLocal, op, ops, out, ver, _i, _len;
      data = this._adapter._data;
      doEmit = !(txn.emitted || this._silent);
      isLocal = 'callback' in txn;
      ver = transaction.base(txn);
      if (isCompound = transaction.isCompound(txn)) {
        ops = transaction.ops(txn);
        for (_i = 0, _len = ops.length; _i < _len; _i++) {
          op = ops[_i];
          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);
        }
      } else {
        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);
      }
      this._removeTxn(transaction.id(txn));
      if (callback = txn.callback) {
        if (isCompound) {
          callback.apply(null, [null].concat(__slice.call(transaction.ops(txn))));
        } else {
          callback.apply(null, [null].concat(__slice.call(transaction.args(txn)), [out]));
        }
      }
      return out;
    },
    _applyMutation: function(extractor, mutation, ver, data, doEmit, isLocal) {
      var args, meta, method, obj, _ref;
      method = extractor.method(mutation);
      if (method === 'get') {
        return;
      }
      args = extractor.args(mutation);
      meta = extractor.meta(mutation);
      this.emit(method + 'Pre', args, ver, data, meta);
      obj = (_ref = this._adapter)[method].apply(_ref, __slice.call(args).concat([ver], [data]));
      this.emit(method + 'Post', args, ver, data, meta);
      if (doEmit) {
        this.emit(method, args, isLocal, meta);
      }
      return obj;
    },
    _specModel: function() {
      var cache, data, i, lastTxnId, len, op, ops, out, replayFrom, txn, _i, _len;
      if (!(len = this._txnQueue.length)) {
        return this._adapter._data;
      }
      cache = this._specCache;
      if (lastTxnId = cache.lastTxnId) {
        if (cache.lastTxnId === this._txnQueue[len - 1]) {
          return cache.data;
        }
        data = cache.data;
        replayFrom = 1 + this._txnQueue.indexOf(cache.lastTxnId);
      } else {
        replayFrom = 0;
      }
      if (!data) {
        data = cache.data = specCreate(this._adapter._data);
      }
      i = replayFrom;
      while (i < len) {
        txn = this._txns[this._txnQueue[i++]];
        if (transaction.isCompound(txn)) {
          ops = transaction.ops(txn);
          for (_i = 0, _len = ops.length; _i < _len; _i++) {
            op = ops[_i];
            this._applyMutation(transaction.op, op, null, data);
          }
        } else {
          out = this._applyMutation(transaction, txn, null, data);
        }
      }
      cache.data = data;
      cache.lastTxnId = transaction.id(txn);
      data.$out = out;
      return data;
    },
    snapshot: function() {
      var model;
      model = new AtomicModel(this._nextTxnId(), this);
      model._adapter = adapter.snapshot();
      return model;
    },
    atomic: function(block, callback) {
      var abort, commit, model, retry, self;
      model = new AtomicModel(this._nextTxnId(), this);
      this._atomicModels[model.id] = model;
      self = this;
      commit = function(_callback) {
        return model.commit(function(err) {
          if (!err) {
            delete self._atomicModels[model.id];
          }
          if (_callback || (_callback = callback)) {
            return _callback.apply(null, arguments);
          }
        });
      };
      abort = function() {};
      retry = function() {};
      if (block.length === 1) {
        block(model);
        return commit(callback);
      } else if (block.length === 2) {
        return block(model, commit);
      } else if (block.length === 3) {
        return block(model, commit, abort);
      } else if (block.length === 4) {
        return block(model, commit, abort, retry);
      }
    }
  },
  accessors: {
    get: {
      type: 'basic',
      fn: function(path) {
        return this._adapter.get(path, this._specModel());
      }
    }
  },
  mutators: {
    set: {
      type: 'basic',
      fn: function(path, val, callback) {
        return this._addOpAsTxn('set', [path, val], callback);
      }
    },
    del: {
      type: 'basic',
      fn: function(path, callback) {
        return this._addOpAsTxn('del', [path], callback);
      }
    },
    setNull: {
      type: 'compound',
      fn: function(path, value, callback) {
        var obj;
        obj = this.get(path);
        if (obj != null) {
          return obj;
        }
        return this.set(path, value, callback);
      }
    },
    incr: {
      type: 'compound',
      fn: function(path, byNum, callback) {
        if (typeof byNum === 'function') {
          callback = byNum;
          byNum = 1;
        } else if (typeof byNum !== 'number') {
          byNum = 1;
        }
        return this.set(path, (this.get(path) || 0) + byNum, callback);
      }
    },
    push: {
      type: 'array',
      insertArgs: 1,
      fn: function() {
        var args, callback, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
        if (typeof callback !== 'function') {
          args.push(callback);
          callback = null;
        }
        return this._addOpAsTxn('push', args, callback);
      }
    },
    unshift: {
      type: 'array',
      insertArgs: 1,
      fn: function() {
        var args, callback, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
        if (typeof callback !== 'function') {
          args.push(callback);
          callback = null;
        }
        return this._addOpAsTxn('unshift', args, callback);
      }
    },
    splice: {
      type: 'array',
      indexArgs: [1],
      insertArgs: 3,
      fn: function() {
        var args, callback, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
        if (typeof callback !== 'function') {
          args.push(callback);
          callback = null;
        }
        return this._addOpAsTxn('splice', args, callback);
      }
    },
    pop: {
      type: 'array',
      fn: function(path, callback) {
        return this._addOpAsTxn('pop', [path], callback);
      }
    },
    shift: {
      type: 'array',
      fn: function(path, callback) {
        return this._addOpAsTxn('shift', [path], callback);
      }
    },
    insertBefore: {
      type: 'array',
      indexArgs: [1],
      insertArgs: 2,
      fn: function(path, beforeIndex, value, callback) {
        return this._addOpAsTxn('insertBefore', [path, beforeIndex, value], callback);
      }
    },
    insertAfter: {
      type: 'array',
      indexArgs: [1],
      insertArgs: 2,
      fn: function(path, afterIndex, value, callback) {
        return this._addOpAsTxn('insertAfter', [path, afterIndex, value], callback);
      }
    },
    remove: {
      type: 'array',
      indexArgs: [1],
      fn: function(path, start, howMany, callback) {
        if (typeof howMany === 'function') {
          callback = howMany;
          howMany = 1;
        } else if (typeof howMany !== 'number') {
          howMany = 1;
        }
        return this._addOpAsTxn('remove', [path, start, howMany], callback);
      }
    },
    move: {
      type: 'array',
      indexArgs: [1, 2],
      fn: function(path, from, to, callback) {
        return this._addOpAsTxn('move', [path, from, to], callback);
      }
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/transaction.js", function (require, module, exports, __dirname, __filename) {
    module.exports = {
  create: function(obj) {
    var txn;
    if (obj.ops) {
      txn = [obj.base, obj.id, obj.ops];
    } else {
      txn = [obj.base, obj.id, obj.method, obj.args];
      if (obj.meta) {
        txn.push(obj.meta);
      }
    }
    return txn;
  },
  base: function(txn, val) {
    if (val !== void 0) {
      txn[0] = val;
    }
    return txn[0];
  },
  id: function(txn, val) {
    if (val !== void 0) {
      txn[1] = val;
    }
    return txn[1];
  },
  clientIdAndVer: function(txn) {
    var res;
    res = this.id(txn).split('.');
    res[1] = parseInt(res[1], 10);
    return res;
  },
  method: function(txn, name) {
    if (name !== void 0) {
      txn[2] = name;
    }
    return txn[2];
  },
  args: function(txn, vals) {
    if (vals !== void 0) {
      txn[3] = vals;
    }
    return txn[3];
  },
  path: function(txn, val) {
    var args;
    args = this.args(txn);
    if (val !== void 0) {
      args[0] = val;
    }
    return args[0];
  },
  clientId: function(txn, newClientId) {
    var clientId, num, _ref;
    _ref = this.id(txn).split('.'), clientId = _ref[0], num = _ref[1];
    if (newClientId !== void 0) {
      this.id(txn, newClientId + '.' + num);
      return newClientId;
    }
    return clientId;
  },
  meta: function(txn, obj) {
    if (obj !== void 0) {
      txn[4] = obj;
    }
    return txn[4];
  },
  ops: function(txn, ops) {
    if (ops !== void 0) {
      txn[2] = ops;
    }
    return txn[2];
  },
  isCompound: function(txn) {
    return Array.isArray(txn[2]);
  },
  op: {
    create: function(obj) {
      var meta, op;
      op = [obj.method, obj.args];
      if (meta = obj.meta) {
        op.push(meta);
      }
      return op;
    },
    method: function(op, name) {
      if (name !== void 0) {
        op[0] = name;
      }
      return op[0];
    },
    args: function(op, vals) {
      if (vals !== void 0) {
        op[1] = vals;
      }
      return op[1];
    },
    meta: function(op, obj) {
      if (obj !== void 0) {
        op[2] = obj;
      }
      return op[2];
    }
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/Serializer.js", function (require, module, exports, __dirname, __filename) {
    var DEFAULT_TIMEOUT, Serializer, transaction;
transaction = require('./transaction');
DEFAULT_TIMEOUT = 1000;
module.exports = Serializer = function(_arg) {
  var init, onTimeout, self, timeout;
  this.withEach = _arg.withEach, onTimeout = _arg.onTimeout, timeout = _arg.timeout, init = _arg.init;
  self = this;
  if (onTimeout) {
    if (timeout === void 0) {
      timeout = DEFAULT_TIMEOUT;
    }
    self._setWaiter = function() {
      if (this._waiter) {
        return;
      }
      return this._waiter = setTimeout(function() {
        onTimeout();
        return self._clearWaiter();
      }, timeout);
    };
    self._clearWaiter = function() {
      if (this._waiter) {
        clearTimeout(this._waiter);
        return this._waiter = null;
      }
    };
  }
  self._pending = {};
  self._index = init != null ? init : 1;
};
Serializer.prototype = {
  _setWaiter: function() {},
  _clearWaiter: function() {},
  add: function(txn, txnIndex) {
    var index, pending;
    index = this._index;
    if (txnIndex > index) {
      this._pending[txnIndex] = txn;
      this._setWaiter();
      return true;
    }
    if (txnIndex < index) {
      return false;
    }
    this.withEach(txn, index);
    this._clearWaiter();
    index++;
    pending = this._pending;
    while (txn = pending[index]) {
      this.withEach(txn, index);
      delete pending[index++];
    }
    this._index = index;
    return true;
  },
  setIndex: function(_index) {
    this._index = _index;
  },
  clearPending: function() {
    var i, index, pending, _results;
    index = this._index;
    pending = this._pending;
    _results = [];
    for (i in pending) {
      _results.push(i < index ? delete pending[i] : void 0);
    }
    return _results;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.stm/AtomicModel.js", function (require, module, exports, __dirname, __filename) {
    var AtomicModel, Serializer, proto, transaction;
Serializer = require('../Serializer');
transaction = require('../transaction');
proto = null;
AtomicModel = module.exports = function(id, parentModel) {
  var method, parentProto, _i, _len, _ref;
  AtomicModel = function(id, parentModel) {
    var adapter, self;
    self = this;
    self.id = id;
    self.parentModel = parentModel;
    adapter = self._adapter = parentModel._adapter;
    self.ver = adapter.version();
    self._specCache = {
      invalidate: function() {
        delete this.data;
        return delete this.lastTxnId;
      }
    };
    self._opCount = 0;
    self._txns = parentModel._txns;
    self._txnQueue = parentModel._txnQueue.slice(0);
    ['emit', 'on', 'once'].forEach(function(method) {
      return self[method] = function() {
        return parentModel[method].apply(parentModel, arguments);
      };
    });
  };
  AtomicModel.prototype = proto;
  parentProto = Object.getPrototypeOf(parentModel);
  _ref = ['_addOpAsTxn', '_queueTxn', '_specModel', '_applyMutation', '_dereference', 'set', 'setNull', 'del', 'incr', 'push', 'pop', 'unshift', 'shift', 'insertAfter', 'insertBefore', 'remove', 'splice', 'move'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    method = _ref[_i];
    proto[method] = parentProto[method];
  }
  return new AtomicModel(id, parentModel);
};
proto = {
  isMyOp: function(id) {
    var extracted;
    extracted = id.substr(0, id.lastIndexOf('.'));
    return extracted === this.id;
  },
  oplog: function() {
    var id, modelId, txnQueue, txns, _i, _len, _results;
    modelId = this.id;
    txns = this._txns;
    txnQueue = this._txnQueue;
    _results = [];
    for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {
      id = txnQueue[_i];
      if (this.isMyOp(id)) {
        _results.push(txns[id]);
      }
    }
    return _results;
  },
  _oplogAsTxn: function() {
    var ops, txn;
    ops = (function() {
      var _i, _len, _ref, _results;
      _ref = this.oplog();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        txn = _ref[_i];
        _results.push(transaction.op.create({
          method: transaction.method(txn),
          args: transaction.args(txn),
          meta: transaction.meta(txn)
        }));
      }
      return _results;
    }).call(this);
    return transaction.create({
      base: this.ver,
      id: this.id,
      ops: ops
    });
  },
  _getVer: function() {
    return this.ver;
  },
  _commit: function() {},
  commit: function(callback) {
    var txn;
    txn = this._oplogAsTxn();
    this.parentModel._queueTxn(txn, callback);
    return this.parentModel._commit(txn);
  },
  get: function(path) {
    var val, ver, _ref;
    _ref = this._adapter.getWithVersion(path, this._specModel()), val = _ref[0], ver = _ref[1];
    if (ver <= this.ver) {
      this._addOpAsTxn('get', [path]);
    }
    return val;
  },
  _nextTxnId: function() {
    return this.id + '.' + ++this._opCount;
  },
  _conflictsWithMe: function(txn) {
    var id, modelId, myTxn, txnQueue, txns, _i, _len;
    modelId = this.id;
    txns = this._txns;
    txnQueue = this._txnQueue;
    for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {
      id = txnQueue[_i];
      myTxn = txns[id];
      if (this.isMyOp(id && transaction.doesSharePath(txn, myTxn) && ver < transaction.base(txn))) {
        return true;
      }
    }
    return false;
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.stm/Async.js", function (require, module, exports, __dirname, __filename) {
    var Async, AsyncAtomic, MAX_RETRIES, RETRY_DELAY, empty, transaction;
transaction = require('../transaction');
MAX_RETRIES = 20;
RETRY_DELAY = 5;
AsyncAtomic = function(async, cb) {
  this.async = async;
  this.cb = cb;
  this.minVer = 0;
  this.count = 0;
};
AsyncAtomic.prototype = {
  _reset: function() {
    this.minVer = 0;
    return this.count = 0;
  },
  get: function(path, callback) {
    var cb, minVer, self;
    minVer = this.minVer;
    cb = this.cb;
    self = this;
    return this.async.get(path, function(err, value, ver) {
      if (err) {
        return cb(err);
      }
      self.minVer = minVer ? Math.min(minVer, ver) : ver;
      if (callback) {
        return callback(value);
      }
    });
  },
  set: function(path, value, callback) {
    var cb, self;
    this.count++;
    cb = this.cb;
    self = this;
    return this.async.set(path, value, this.minVer, function(err, value) {
      if (err) {
        return cb(err);
      }
      if (callback) {
        callback(null, value);
      }
      if (!--self.count) {
        return cb();
      }
    });
  },
  del: function(path, callback) {
    var cb, self;
    this.count++;
    cb = this.cb;
    self = this;
    return this.async.del(path, this.minVer, function(err) {
      if (err) {
        return cb(err);
      }
      if (callback) {
        callback();
      }
      if (!--self.count) {
        return cb();
      }
    });
  }
};
empty = function() {};
module.exports = Async = function(model) {
  this.model = model;
};
Async.prototype = {
  _nextTxnId: function() {
    return '#' + this.model._nextTxnId();
  },
  get: function(path, callback) {
    return this.model.store._adapter.get(path, callback);
  },
  set: function(path, value, ver, callback) {
    var txn;
    txn = transaction.create({
      base: ver,
      id: this._nextTxnId(),
      method: 'set',
      args: [path, value]
    });
    return this.model.store._commit(txn, callback);
  },
  del: function(path, ver, callback) {
    var txn;
    txn = transaction.create({
      base: ver,
      id: this._nextTxnId(),
      method: 'del',
      args: [path]
    });
    return this.model.store._commit(txn, callback);
  },
  incr: function(path, byNum, callback) {
    var tryVal;
    if (typeof byNum === 'function') {
      callback = byNum;
      byNum = 1;
    } else {
      if (byNum == null) {
        byNum = 1;
      }
      callback || (callback = empty);
    }
    tryVal = null;
    return this.retry(function(atomic) {
      return atomic.get(path, function(val) {
        return atomic.set(path, tryVal = (val || 0) + byNum);
      });
    }, function(err) {
      return callback(err, tryVal);
    });
  },
  retry: function(fn, callback) {
    var atomic, retries;
    retries = MAX_RETRIES;
    atomic = new AsyncAtomic(this, function(err) {
      var delay;
      if (!err) {
        return callback && callback();
      }
      if (!retries--) {
        return callback && callback('maxRetries');
      }
      atomic._reset();
      delay = (MAX_RETRIES - retries) * RETRY_DELAY;
      return setTimeout(fn, delay, atomic);
    });
    return fn(atomic);
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.ot/index.js", function (require, module, exports, __dirname, __filename) {
    var Field, ot;
Field = require('./Field');
ot = module.exports = {
  init: function() {
    this.otFields = {};
    return this.on('setPost', function(_arg, ver) {
      var path, value;
      path = _arg[0], value = _arg[1];
      if (ver && value && value.$ot) {
        return this._otField(path).specTrigger(true);
      }
    });
  },
  accessors: {
    get: {
      type: 'basic',
      fn: function(path) {
        var val;
        val = this._adapter.get(path, this._specModel());
        if (val && (val.$ot != null)) {
          return this._otField(path, val).snapshot;
        }
        return val;
      }
    }
  },
  mutators: {
    insertOT: {
      type: 'ot',
      fn: function(path, pos, text, callback) {
        var op;
        op = [
          {
            p: pos,
            i: text
          }
        ];
        this._otField(path).submitOp(op, callback);
      }
    },
    delOT: {
      type: 'ot',
      fn: function(path, pos, len, callback) {
        var del, field, op;
        field = this._otField(path);
        del = field.snapshot.substr(pos, len);
        op = [
          {
            p: pos,
            d: del
          }
        ];
        field.submitOp(op, callback);
        return del;
      }
    }
  },
  proto: {
    ot: function(initVal) {
      return {
        $ot: initVal || ''
      };
    },
    isOtPath: function(path) {
      return this._adapter.get(path, this._specModel()).$ot !== void 0;
    },
    isOtVal: function(val) {
      return !!(val && val.$ot);
    },
    version: function(path) {
      return this.otFields[path].version;
    },
    _otField: function(path, val) {
      var field;
      path = this._dereference(path);
      if (field = this.otFields[path]) {
        return field;
      }
      field = this.otFields[path] = new Field(this, path);
      val || (val = this._adapter.get(path, this._specModel()));
      field.snapshot = val && val.$ot || '';
      return field;
    }
  },
  setupSocket: function(socket) {
    var adapter, model, otFields;
    otFields = this.otFields;
    adapter = this._adapter;
    model = this;
    return socket.on('otOp', function(_arg) {
      var field, op, path, v;
      path = _arg.path, op = _arg.op, v = _arg.v;
      if (!(field = otFields[path])) {
        field = otFields[path] = new Field(model, path);
        return field.specTrigger().on(function() {
          var val;
          val = adapter.get(path, model._specModel());
          field.snapshot = (val != null ? val.$ot : void 0) || '';
          return field.onRemoteOp(op, v);
        });
      } else {
        return field.onRemoteOp(op, v);
      }
    });
  }
};
});

require.define("/node_modules/derby/node_modules/racer/lib/mixin.ot/Field.js", function (require, module, exports, __dirname, __filename) {
    var Field, Promise, Serializer, specHelper, text;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
text = require('share/lib/types/text');
specHelper = require('../specHelper');
Promise = require('../Promise');
Serializer = require('../Serializer');
Field = module.exports = function(model, path, version, type) {
  var self;
  this.path = path;
  this.version = version != null ? version : 0;
  this.type = type != null ? type : text;
  this.model = model;
  this.snapshot = null;
  this.queue = [];
  this.pendingOp = null;
  this.pendingCallbacks = [];
  this.inflightOp = null;
  this.inflightCallbacks = [];
  this.serverOps = {};
  this.incomingSerializer = new Serializer({
    init: this.version,
    withEach: __bind(function(_arg, ver) {
      var callback, docOp, err, isRemote, oldInflightOp, op, undo, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5;
      op = _arg[0], isRemote = _arg[1], err = _arg[2];
      if (isRemote) {
        docOp = op;
        if (this.inflightOp) {
          _ref = this.xf(this.inflightOp, docOp), this.inflightOp = _ref[0], docOp = _ref[1];
        }
        if (this.pendingOp) {
          _ref2 = this.xf(this.pendingOp, docOp), this.pendingOp = _ref2[0], docOp = _ref2[1];
        }
        this.version++;
        return this.otApply(docOp, false);
      } else {
        oldInflightOp = this.inflightOp;
        this.inflightOp = null;
        if (err) {
          if (!this.type.invert) {
            throw new Error("Op apply failed (" + err + ") and the OT type does not define an invert function.");
          }
          throw new Error(err);
          undo = this.type.invert(oldInflightOp);
          if (this.pendingOp) {
            _ref3 = this.xf(this.pendingOp, undo), this.pendingOp = _ref3[0], undo = _ref3[1];
          }
          this.otApply(undo);
          _ref4 = this.inflightCallbacks;
          for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
            callback = _ref4[_i];
            callback(err);
          }
          return this.flush;
        }
        if (ver !== this.version) {
          throw new Error('Invalid version from server');
        }
        this.serverOps[this.version] = oldInflightOp;
        this.version++;
        _ref5 = this.inflightCallbacks;
        for (_j = 0, _len2 = _ref5.length; _j < _len2; _j++) {
          callback = _ref5[_j];
          callback(null, oldInflightOp);
        }
        return this.flush();
      }
    }, this),
    timeout: 5000,
    onTimeout: function() {
      throw new Error("Did not receive a prior op in time. Invalid version would result by applying buffered received ops unless prior op was applied first.");
    }
  });
  self = this;
  model.on('change', function(_arg, isLocal) {
    var d, i, oldSnapshot, op, p, path, _i, _len, _ref;
    path = _arg[0], op = _arg[1], oldSnapshot = _arg[2];
    if (path !== self.path) {
      return;
    }
    for (_i = 0, _len = op.length; _i < _len; _i++) {
      _ref = op[_i], p = _ref.p, i = _ref.i, d = _ref.d;
      if (i) {
        model.emit('insertOT', [path, p, i], isLocal);
      } else {
        model.emit('delOT', [path, p, d], isLocal);
      }
    }
  });
};
Field.prototype = {
  onRemoteOp: function(op, v) {
    var docOp;
    if (v < this.version) {
      return;
    }
    if (v !== this.version) {
      throw new Error("Expected version " + this.version + " but got " + v);
    }
    docOp = this.serverOps[this.version] = op;
    return this.incomingSerializer.add([docOp, true], v);
  },
  otApply: function(docOp, isLocal) {
    var oldSnapshot;
    if (isLocal == null) {
      isLocal = true;
    }
    oldSnapshot = this.snapshot;
    this.snapshot = this.type.apply(oldSnapshot, docOp);
    this.model.emit('change', [this.path, docOp, oldSnapshot], isLocal);
    return this.snapshot;
  },
  submitOp: function(op, callback) {
    var type;
    type = this.type;
    op = type.normalize(op);
    this.otApply(op);
    this.pendingOp = this.pendingOp ? type.compose(this.pendingOp, op) : op;
    if (callback) {
      this.pendingCallbacks.push(callback);
    }
    return setTimeout(__bind(function() {
      return this.flush();
    }, this), 0);
  },
  specTrigger: function(shouldFulfill) {
    if (!this._specTrigger) {
      this._specTrigger = new Promise;
      this._specTrigger.on(__bind(function() {
        return this.flush();
      }, this));
    }
    if (shouldFulfill && !this._specTrigger.value) {
      this._specTrigger.fulfill(true);
    }
    return this._specTrigger;
  },
  flush: function() {
    var shouldFulfill;
    if (!this._specTrigger) {
      shouldFulfill = !specHelper.isSpeculative(this.model._specModel());
      this.specTrigger(shouldFulfill);
      return;
    }
    if (this.inflightOp !== null || this.pendingOp === null) {
      return;
    }
    this.inflightOp = this.pendingOp;
    this.pendingOp = null;
    this.inflightCallbacks = this.pendingCallbacks;
    this.pendingCallbacks = [];
    return this.model.socket.emit('otOp', {
      path: this.path,
      op: this.inflightOp,
      v: this.version
    }, __bind(function(err, msg) {
      if (msg) {
        return this.incomingSerializer.add([this.inflightOp, false, err], msg.v);
      }
    }, this));
  },
  xf: function(client, server) {
    var client_, server_;
    client_ = this.type.transform(client, server, 'left');
    server_ = this.type.transform(server, client, 'right');
    return [client_, server_];
  }
};
Field.fromJSON = function(json, model) {
  var field;
  field = new Field(model, json.path, json.version);
  field.snapshot = json.snapshot;
  return field;
};
});

require.define("/node_modules/derby/node_modules/racer/node_modules/share/lib/types/text.js", function (require, module, exports, __dirname, __filename) {
    var append, checkValidComponent, checkValidOp, invertComponent, strInject, text, transformComponent, transformPosition;
text = {};
text.name = 'text';
text.create = text.create = function() {
  return '';
};
strInject = function(s1, pos, s2) {
  return s1.slice(0, pos) + s2 + s1.slice(pos);
};
checkValidComponent = function(c) {
  var d_type, i_type;
  if (typeof c.p !== 'number') {
    throw new Error('component missing position field');
  }
  i_type = typeof c.i;
  d_type = typeof c.d;
  if (!((i_type === 'string') ^ (d_type === 'string'))) {
    throw new Error('component needs an i or d field');
  }
  if (!(c.p >= 0)) {
    throw new Error('position cannot be negative');
  }
};
checkValidOp = function(op) {
  var c, _i, _len;
  for (_i = 0, _len = op.length; _i < _len; _i++) {
    c = op[_i];
    checkValidComponent(c);
  }
  return true;
};
text.apply = function(snapshot, op) {
  var component, deleted, _i, _len;
  checkValidOp(op);
  for (_i = 0, _len = op.length; _i < _len; _i++) {
    component = op[_i];
    if (component.i != null) {
      snapshot = strInject(snapshot, component.p, component.i);
    } else {
      deleted = snapshot.slice(component.p, component.p + component.d.length);
      if (component.d !== deleted) {
        throw new Error("Delete component '" + component.d + "' does not match deleted text '" + deleted + "'");
      }
      snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);
    }
  }
  return snapshot;
};
text._append = append = function(newOp, c) {
  var last, _ref, _ref2;
  if (c.i === '' || c.d === '') {
    return;
  }
  if (newOp.length === 0) {
    return newOp.push(c);
  } else {
    last = newOp[newOp.length - 1];
    if ((last.i != null) && (c.i != null) && (last.p <= (_ref = c.p) && _ref <= (last.p + last.i.length))) {
      return newOp[newOp.length - 1] = {
        i: strInject(last.i, c.p - last.p, c.i),
        p: last.p
      };
    } else if ((last.d != null) && (c.d != null) && (c.p <= (_ref2 = last.p) && _ref2 <= (c.p + c.d.length))) {
      return newOp[newOp.length - 1] = {
        d: strInject(c.d, last.p - c.p, last.d),
        p: c.p
      };
    } else {
      return newOp.push(c);
    }
  }
};
text.compose = function(op1, op2) {
  var c, newOp, _i, _len;
  checkValidOp(op1);
  checkValidOp(op2);
  newOp = op1.slice();
  for (_i = 0, _len = op2.length; _i < _len; _i++) {
    c = op2[_i];
    append(newOp, c);
  }
  return newOp;
};
text.compress = function(op) {
  return text.compose([], op);
};
text.normalize = function(op) {
  var c, newOp, _i, _len, _ref;
  newOp = [];
  if ((op.i != null) || (op.p != null)) {
    op = [op];
  }
  for (_i = 0, _len = op.length; _i < _len; _i++) {
    c = op[_i];
    if ((_ref = c.p) == null) {
      c.p = 0;
    }
    append(newOp, c);
  }
  return newOp;
};
transformPosition = function(pos, c, insertAfter) {
  if (c.i != null) {
    if (c.p < pos || (c.p === pos && insertAfter)) {
      return pos + c.i.length;
    } else {
      return pos;
    }
  } else {
    if (pos <= c.p) {
      return pos;
    } else if (pos <= c.p + c.d.length) {
      return c.p;
    } else {
      return pos - c.d.length;
    }
  }
};
text.transformCursor = function(position, op, insertAfter) {
  var c, _i, _len;
  for (_i = 0, _len = op.length; _i < _len; _i++) {
    c = op[_i];
    position = transformPosition(position, c, insertAfter);
  }
  return position;
};
text._tc = transformComponent = function(dest, c, otherC, type) {
  var cIntersect, intersectEnd, intersectStart, newC, otherIntersect, s;
  checkValidOp([c]);
  checkValidOp([otherC]);
  if (c.i != null) {
    append(dest, {
      i: c.i,
      p: transformPosition(c.p, otherC, type === 'right')
    });
  } else {
    if (otherC.i != null) {
      s = c.d;
      if (c.p < otherC.p) {
        append(dest, {
          d: s.slice(0, otherC.p - c.p),
          p: c.p
        });
        s = s.slice(otherC.p - c.p);
      }
      if (s !== '') {
        append(dest, {
          d: s,
          p: c.p + otherC.i.length
        });
      }
    } else {
      if (c.p >= otherC.p + otherC.d.length) {
        append(dest, {
          d: c.d,
          p: c.p - otherC.d.length
        });
      } else if (c.p + c.d.length <= otherC.p) {
        append(dest, c);
      } else {
        newC = {
          d: '',
          p: c.p
        };
        if (c.p < otherC.p) {
          newC.d = c.d.slice(0, otherC.p - c.p);
        }
        if (c.p + c.d.length > otherC.p + otherC.d.length) {
          newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);
        }
        intersectStart = Math.max(c.p, otherC.p);
        intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);
        cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);
        otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);
        if (cIntersect !== otherIntersect) {
          throw new Error('Delete ops delete different text in the same region of the document');
        }
        if (newC.d !== '') {
          newC.p = transformPosition(newC.p, otherC);
          append(dest, newC);
        }
      }
    }
  }
  return dest;
};
invertComponent = function(c) {
  if (c.i != null) {
    return {
      d: c.i,
      p: c.p
    };
  } else {
    return {
      i: c.d,
      p: c.p
    };
  }
};
text.invert = function(op) {
  var c, _i, _len, _ref, _results;
  _ref = op.slice().reverse();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    c = _ref[_i];
    _results.push(invertComponent(c));
  }
  return _results;
};
if (typeof WEB !== "undefined" && WEB !== null) {
  exports.types || (exports.types = {});
  bootstrapTransform(text, transformComponent, checkValidOp, append);
  exports.types.text = text;
} else {
  module.exports = text;
  require('./helpers').bootstrapTransform(text, transformComponent, checkValidOp, append);
}
});

require.define("/node_modules/derby/node_modules/racer/node_modules/share/lib/types/helpers.js", function (require, module, exports, __dirname, __filename) {
    var bootstrapTransform;
exports['_bt'] = bootstrapTransform = function(type, transformComponent, checkValidOp, append) {
  var transformComponentX, transformX;
  transformComponentX = function(left, right, destLeft, destRight) {
    transformComponent(destLeft, left, right, 'left');
    return transformComponent(destRight, right, left, 'right');
  };
  type.transformX = type['transformX'] = transformX = function(leftOp, rightOp) {
    var k, l, l_, newLeftOp, newRightOp, nextC, r, r_, rightComponent, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2;
    checkValidOp(leftOp);
    checkValidOp(rightOp);
    newRightOp = [];
    for (_i = 0, _len = rightOp.length; _i < _len; _i++) {
      rightComponent = rightOp[_i];
      newLeftOp = [];
      k = 0;
      while (k < leftOp.length) {
        nextC = [];
        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
        k++;
        if (nextC.length === 1) {
          rightComponent = nextC[0];
        } else if (nextC.length === 0) {
          _ref = leftOp.slice(k);
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            l = _ref[_j];
            append(newLeftOp, l);
          }
          rightComponent = null;
          break;
        } else {
          _ref2 = transformX(leftOp.slice(k), nextC), l_ = _ref2[0], r_ = _ref2[1];
          for (_k = 0, _len3 = l_.length; _k < _len3; _k++) {
            l = l_[_k];
            append(newLeftOp, l);
          }
          for (_l = 0, _len4 = r_.length; _l < _len4; _l++) {
            r = r_[_l];
            append(newRightOp, r);
          }
          rightComponent = null;
          break;
        }
      }
      if (rightComponent != null) {
        append(newRightOp, rightComponent);
      }
      leftOp = newLeftOp;
    }
    return [leftOp, newRightOp];
  };
  return type.transform = type['transform'] = function(op, otherOp, type) {
    var left, right, _, _ref, _ref2;
    if (!(type === 'left' || type === 'right')) {
      throw new Error("type must be 'left' or 'right'");
    }
    if (otherOp.length === 0) {
      return op;
    }
    if (op.length === 1 && otherOp.length === 1) {
      return transformComponent([], op[0], otherOp[0], type);
    }
    if (type === 'left') {
      _ref = transformX(op, otherOp), left = _ref[0], _ = _ref[1];
      return left;
    } else {
      _ref2 = transformX(otherOp, op), _ = _ref2[0], right = _ref2[1];
      return right;
    }
  };
};
if (typeof WEB === 'undefined') {
  exports.bootstrapTransform = bootstrapTransform;
}
});

require.define("/node_modules/derby/node_modules/racer/lib/Promise.js", function (require, module, exports, __dirname, __filename) {
    var Promise;
var __slice = Array.prototype.slice;
Promise = module.exports = function() {
  this.callbacks = [];
  this.clearValueCallbacks = [];
};
Promise.prototype = {
  on: function(callback, scope) {
    if (this.value !== void 0) {
      return callback.call(scope, this.value);
    }
    this.callbacks.push([callback, scope]);
    return this;
  },
  fulfill: function(val) {
    var callback, scope, _i, _len, _ref, _ref2;
    if (this.value !== void 0) {
      throw new Error('Promise has already been fulfilled');
    }
    this.value = val;
    _ref = this.callbacks;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref2 = _ref[_i], callback = _ref2[0], scope = _ref2[1];
      callback.call(scope, val);
    }
    this.callbacks = [];
    return this;
  },
  onClearValue: function(callback, scope) {
    this.clearValueCallbacks.push([callback, scope]);
    return this;
  },
  clearValue: function() {
    var callback, cbs, scope, _i, _len, _ref;
    delete this.value;
    cbs = this.clearValueCallbacks;
    for (_i = 0, _len = cbs.length; _i < _len; _i++) {
      _ref = cbs[_i], callback = _ref[0], scope = _ref[1];
      callback.call(scope);
    }
    this.clearValueCallbacks = [];
    return this;
  }
};
Promise.parallel = function() {
  var compositePromise, dependencies, promise, promises, _i, _len;
  promises = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  compositePromise = new Promise;
  dependencies = promises.length;
  for (_i = 0, _len = promises.length; _i < _len; _i++) {
    promise = promises[_i];
    promise.on(function() {
      return --dependencies || compositePromise.fulfill(true);
    });
    promise.onClearValue(function() {
      return compositePromise.clearValue();
    });
  }
  return compositePromise;
};
});

require.define("/node_modules/derby/lib/modelHelper.js", function (require, module, exports, __dirname, __filename) {
    var EventDispatcher, PathMap;
var __slice = Array.prototype.slice;
EventDispatcher = require('./EventDispatcher');
PathMap = function() {
  this.count = 0;
  this.ids = {};
  this.paths = {};
  this.arrays = {};
};
PathMap.prototype = {
  id: function(path) {
    var id;
    return this.ids[path] || (this.paths[id = ++this.count] = path, this.indexArray(path, id), this.ids[path] = id);
  },
  indexArray: function(path, id) {
    var arr, index, match, name, remainder, set;
    if (match = /^(.+)\.(\d+)(\..+|$)/.exec(path)) {
      name = match[1];
      index = +match[2];
      remainder = match[3];
      arr = this.arrays[name] || (this.arrays[name] = []);
      set = arr[index] || (arr[index] = {});
      return set[id] = remainder;
    }
  },
  init: function(count, ids) {
    var id, path, paths, _ref, _results;
    this.count = count;
    this.ids = ids;
    paths = this.paths;
    _ref = this.ids;
    _results = [];
    for (path in _ref) {
      id = _ref[path];
      paths[id] = path;
      _results.push(this.indexArray(path, id));
    }
    return _results;
  }
};
exports.init = function(model, dom, view) {
  var event, events, incrementMapItems, insert, pathMap, refIndex, remove, _fn, _i, _len, _ref;
  pathMap = model.__pathMap = new PathMap;
  if (dom) {
    events = model.__events = new EventDispatcher({
      onTrigger: function(name, listener, value, type, local, options) {
        var id, index, method, noRender, partial, path, property, _ref, _ref2;
        id = listener[0], method = listener[1], property = listener[2], partial = listener[3];
        path = pathMap.paths[name];
        if (method === 'propPolite' && local) {
          method = 'prop';
        }
        if (partial === '$inv') {
          value = !value;
        } else if (partial) {
          if (method === 'html' && type) {
            method = type;
            if (type === 'append') {
              path += '.' + (model.get(path).length - 1);
            } else if (type === 'insert') {
              _ref = value, index = _ref[0], value = _ref[1];
              path += '.' + index;
            } else if (type === 'remove') {
              noRender = true;
            } else if (type === 'move') {
              noRender = true;
              _ref2 = value, value = _ref2[0], property = _ref2[1];
            }
          } else if (method === 'attr') {
            value = null;
          }
          if (!noRender) {
            value = view.get(partial, value, null, null, path, id);
          }
        }
        return dom.update(id, method, options && options.ignore, value, property, index);
      }
    });
  } else {
    events = model.__events = new EventDispatcher;
  }
  events["__bind"] = events.bind;
  events.bind = function(name, listener) {
    return events["__bind"](pathMap.id(name), listener);
  };
  if (!dom) {
    return model;
  }
  model.on('set', function(_arg, local) {
    var path, value;
    path = _arg[0], value = _arg[1];
    return events.trigger(pathMap.id(path), value, 'html', local);
  });
  model.on('del', function(_arg, local) {
    var path;
    path = _arg[0];
    return events.trigger(pathMap.id(path), void 0, 'html', local);
  });
  model.on('push', function(_arg, local) {
    var id, path, value, values, _i, _len;
    path = _arg[0], values = 2 <= _arg.length ? __slice.call(_arg, 1) : [];
    id = pathMap.id(path);
    for (_i = 0, _len = values.length; _i < _len; _i++) {
      value = values[_i];
      events.trigger(id, value, 'append', local);
    }
  });
  refIndex = function(obj) {
    if (typeof obj === 'object') {
      return obj.index;
    } else {
      return obj;
    }
  };
  incrementMapItems = function(path, map, start, end, byNum) {
    var i, id, ids, itemPath, remainder, _results;
    _results = [];
    for (i = start; start <= end ? i <= end : i >= end; start <= end ? i++ : i--) {
      if (!(ids = map[i])) {
        continue;
      }
      _results.push((function() {
        var _results2;
        _results2 = [];
        for (id in ids) {
          remainder = ids[id];
          itemPath = pathMap.paths[id];
          delete pathMap.ids[itemPath];
          itemPath = path + '.' + (i + byNum) + remainder;
          pathMap.paths[id] = itemPath;
          _results2.push(pathMap.ids[itemPath] = +id);
        }
        return _results2;
      })());
    }
    return _results;
  };
  model.on('move', function(_arg, local) {
    var from, item, map, options, path, to;
    path = _arg[0], from = _arg[1], to = _arg[2], options = _arg[3];
    from = refIndex(from);
    to = refIndex(to);
    if (from === to) {
      return;
    }
    if (map = pathMap.arrays[path]) {
      incrementMapItems(path, map, from, from, to - from);
      if (from > to) {
        incrementMapItems(path, map, to, from - 1, 1);
      } else {
        incrementMapItems(path, map, from + 1, to, -1);
      }
      item = map.splice(from, 1)[0];
      map.splice(to, 0, item);
    }
    return events.trigger(pathMap.id(path), [from, to], 'move', local, options);
  });
  insert = function(path, index, values, local) {
    var howMany, i, id, ids, itemPath, len, map, remainder, value, _len;
    index = refIndex(index);
    if (map = pathMap.arrays[path]) {
      howMany = values.length;
      len = map.length;
      for (i = index; index <= len ? i < len : i > len; index <= len ? i++ : i--) {
        if (!(ids = map[i])) {
          continue;
        }
        for (id in ids) {
          remainder = ids[id];
          itemPath = pathMap.paths[id];
          delete pathMap.ids[itemPath];
          itemPath = path + '.' + (i + howMany) + remainder;
          pathMap.paths[id] = itemPath;
          pathMap.ids[itemPath] = +id;
        }
      }
      while (howMany--) {
        map.splice(index, 0, {});
      }
    }
    id = pathMap.id(path);
    for (i = 0, _len = values.length; i < _len; i++) {
      value = values[i];
      events.trigger(id, [index + i, value], 'insert', local);
    }
  };
  remove = function(path, start, howMany, local) {
    var end, i, id, ids, index, itemPath, len, map, remainder;
    start = refIndex(start);
    end = start + howMany;
    if (map = pathMap.arrays[path]) {
      len = map.length;
      for (i = start; start <= len ? i < len : i > len; start <= len ? i++ : i--) {
        if (!(ids = map[i])) {
          continue;
        }
        if (i < end) {
          for (id in ids) {
            itemPath = pathMap.paths[id];
            delete pathMap.ids[itemPath];
            delete pathMap.paths[id];
          }
        } else {
          for (id in ids) {
            remainder = ids[id];
            itemPath = pathMap.paths[id];
            delete pathMap.ids[itemPath];
            itemPath = path + '.' + (i - howMany) + remainder;
            pathMap.paths[id] = itemPath;
            pathMap.ids[itemPath] = +id;
          }
        }
      }
      map.splice(start, howMany);
    }
    id = pathMap.id(path);
    for (index = start; start <= end ? index < end : index > end; start <= end ? index++ : index--) {
      events.trigger(id, index, 'remove', local);
    }
  };
  model.on('unshift', function(_arg, local) {
    var path, values;
    path = _arg[0], values = 2 <= _arg.length ? __slice.call(_arg, 1) : [];
    return insert(path, 0, values, local);
  });
  model.on('insertBefore', function(_arg, local) {
    var index, path, value;
    path = _arg[0], index = _arg[1], value = _arg[2];
    return insert(path, index, [value], local);
  });
  model.on('insertAfter', function(_arg, local) {
    var index, path, value;
    path = _arg[0], index = _arg[1], value = _arg[2];
    return insert(path, index + 1, [value], local);
  });
  model.on('remove', function(_arg, local) {
    var howMany, path, start;
    path = _arg[0], start = _arg[1], howMany = _arg[2];
    return remove(path, start, howMany, local);
  });
  model.on('pop', function(_arg, local) {
    var path;
    path = _arg[0];
    return remove(path, model.get(path).length, 1, local);
  });
  model.on('shift', function(_arg, local) {
    var path;
    path = _arg[0];
    return remove(path, 0, 1, local);
  });
  model.on('splice', function(_arg, local) {
    var howMany, path, start, values;
    path = _arg[0], start = _arg[1], howMany = _arg[2], values = 4 <= _arg.length ? __slice.call(_arg, 3) : [];
    remove(path, start, howMany, local);
    return insert(path, index, values, local);
  });
  _ref = ['connected', 'canConnect'];
  _fn = function(event) {
    return model.on(event, function(value) {
      return events.trigger(pathMap.id(event), value);
    });
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    _fn(event);
  }
  return model;
};
});

require.define("/node_modules/derby/lib/EventDispatcher.js", function (require, module, exports, __dirname, __filename) {
    var EventDispatcher, hasKeys, swapQuotes;
hasKeys = require('racer').util.hasKeys;
swapQuotes = function(s) {
  return s.replace(/['"]/g, function(match) {
    if (match === '"') {
      return "'";
    } else {
      return '"';
    }
  });
};
EventDispatcher = module.exports = function(options) {
  var empty;
  if (options == null) {
    options = {};
  }
  empty = function() {};
  this._onTrigger = options.onTrigger || empty;
  this._onBind = options.onBind || empty;
  this._onUnbind = options.onUnbind || empty;
  this._names = {};
};
EventDispatcher.prototype = {
  bind: function(name, listener) {
    var key, names, obj;
    this._onBind(name, listener);
    names = this._names;
    key = listener == null ? 'null' : JSON.stringify(listener);
    obj = names[name] || {};
    obj[key] = true;
    return names[name] = obj;
  },
  unbind: function(name, listener) {
    var names, obj;
    this._onUnbind(name, listener);
    names = this._names;
    if (!(obj = names[name])) {
      return;
    }
    delete obj[JSON.stringify(listener)];
    if (!hasKeys(obj)) {
      return delete names[name];
    }
  },
  trigger: function(name, value, arg0, arg1, arg2) {
    var count, key, listener, listeners, names, onTrigger;
    names = this._names;
    listeners = names[name];
    onTrigger = this._onTrigger;
    count = 0;
    for (key in listeners) {
      count++;
      listener = JSON.parse(key);
      if (onTrigger(name, listener, value, arg0, arg1, arg2) !== false) {
        continue;
      }
      delete listeners[key];
      count--;
    }
    if (count === 0) {
      return delete names[name];
    }
  },
  get: function() {
    var listener, listeners, name, names, out;
    names = this._names;
    out = {};
    for (name in names) {
      listeners = names[name];
      out[name] = (function() {
        var _results;
        _results = [];
        for (listener in listeners) {
          _results.push(swapQuotes(listener));
        }
        return _results;
      })();
    }
    return out;
  },
  set: function(n) {
    var listener, listeners, name, names, obj, _results;
    names = this._names;
    _results = [];
    for (name in n) {
      listeners = n[name];
      obj = names[name] = {};
      _results.push((function() {
        var _i, _len, _results2;
        _results2 = [];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          _results2.push(obj[swapQuotes(listener)] = true);
        }
        return _results2;
      })());
    }
    return _results;
  },
  clear: function() {
    return this._names = {};
  }
};
});

require.define("/node_modules/derby/lib/Dom.js", function (require, module, exports, __dirname, __filename) {
    var Dom, EventDispatcher, addListener, dist, distribute, doc, domHandler, element, elements, emptyEl, getMethods, getNaN, getProp, html, htmlEscape, setMethods, win;
EventDispatcher = require('./EventDispatcher');
htmlEscape = require('./html').htmlEscape;
elements = {
  $win: win = typeof window === 'object' && window,
  $doc: doc = win.document
};
emptyEl = doc && doc.createElement('div');
element = function(id) {
  return elements[id] || (elements[id] = doc.getElementById(id));
};
getNaN = function() {
  return NaN;
};
getMethods = {
  attr: function(el, attr) {
    return el.getAttribute(attr);
  },
  prop: getProp = function(el, prop) {
    return el[prop];
  },
  propPolite: getProp,
  html: function(el) {
    return el.innerHTML;
  },
  visible: getNaN,
  displayed: getNaN,
  append: getNaN,
  insert: getNaN,
  remove: getNaN,
  move: getNaN
};
setMethods = {
  attr: function(el, ignore, value, attr) {
    return el.setAttribute(attr, value);
  },
  prop: function(el, ignore, value, prop) {
    return el[prop] = value;
  },
  propPolite: function(el, ignore, value, prop) {
    if (el !== doc.activeElement) {
      return el[prop] = value;
    }
  },
  visible: function(el, ignore, value) {
    return el.style.visibility = value ? '' : 'hidden';
  },
  displayed: function(el, ignore, value) {
    return el.style.display = value ? '' : 'none';
  },
  html: html = function(el, ignore, value, escape) {
    return el.innerHTML = escape ? htmlEscape(value) : value;
  },
  append: function(el, ignore, value, escape) {
    var child;
    html(emptyEl, ignore, value, escape);
    while (child = emptyEl.firstChild) {
      el.appendChild(child);
    }
  },
  insert: function(el, ignore, value, escape, index) {
    var child, ref;
    ref = el.childNodes[index];
    html(emptyEl, ignore, value, escape);
    while (child = emptyEl.firstChild) {
      el.insertBefore(child, ref);
    }
  },
  remove: function(el, ignore, index) {
    var child;
    child = el.childNodes[index];
    return el.removeChild(child);
  },
  move: function(el, ignore, from, to) {
    var child, ref, toEl;
    if (toEl = el.childNodes[to]) {
      if (toEl.id === ignore) {
        return;
      }
    }
    child = el.childNodes[from];
    if (child.id === ignore) {
      return;
    }
    ref = el.childNodes[to > from ? to + 1 : to];
    return el.insertBefore(child, ref);
  }
};
addListener = domHandler = function() {};
dist = function(e) {
  var child, childEvent, _i, _len, _ref, _results;
  _ref = e.target.childNodes;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    child = _ref[_i];
    if (child.nodeType !== 1) {
      return;
    }
    childEvent = Object.create(e);
    childEvent.target = child;
    domHandler(childEvent);
    _results.push(dist(childEvent));
  }
  return _results;
};
distribute = function(e) {
  var clone, key, value;
  clone = {};
  for (key in e) {
    value = e[key];
    clone[key] = value;
  }
  return dist(clone);
};
Dom = module.exports = function(model, appExports, history) {
  var events;
  this.history = history;
  this.events = events = new EventDispatcher({
    onBind: function(name, listener) {
      if (listener.length > 3) {
        listener[0] = model.__pathMap.id(listener[0]);
      }
      if (!(name in events._names)) {
        return addListener(doc, name);
      }
    },
    onTrigger: function(name, listener, targetId, e) {
      var callback, delay, el, finish, fn, id, invert, method, path, pathId, property;
      if (listener.length <= 3) {
        fn = listener[0], id = listener[1], delay = listener[2];
        callback = fn === '$dist' ? distribute : appExports[fn];
        if (!callback) {
          return;
        }
      } else {
        pathId = listener[0], id = listener[1], method = listener[2], property = listener[3], delay = listener[4];
        if (!(path = model.__pathMap.paths[pathId])) {
          return false;
        }
        if (invert = path.charAt(0) === '!') {
          path = path.substr(1);
        }
      }
      if (id !== targetId) {
        return;
      }
      if (!(el = element(id))) {
        return false;
      }
      finish = function() {
        var value;
        value = getMethods[method](el, property);
        if (invert) {
          value = !value;
        }
        if (model.get(path) === value) {
          return;
        }
        return model.set(path, value);
      };
      if (delay != null) {
        setTimeout(callback || finish, delay, e);
      } else {
        (callback || finish)(e);
      }
    }
  });
};
Dom.prototype = {
  init: function(domEvents) {
    var events, history, name;
    events = this.events;
    history = this.history;
    domHandler = function(e) {
      var target;
      target = e.target;
      if (target.nodeType === 3) {
        target = target.parentNode;
      }
      return events.trigger(e.type, target.id, e);
    };
    if (doc.addEventListener) {
      this.addListener = addListener = function(el, name, cb, captures) {
        if (cb == null) {
          cb = domHandler;
        }
        if (captures == null) {
          captures = false;
        }
        return el.addEventListener(name, cb, captures);
      };
    } else if (doc.attachEvent) {
      this.addListener = addListener = function(el, name, cb) {
        if (cb == null) {
          cb = domHandler;
        }
        return el.attachEvent('on' + name, function() {
          event.target || (event.target = event.srcElement);
          return cb(event);
        });
      };
    }
    events.set(domEvents);
    for (name in events._names) {
      addListener(doc, name);
    }
    addListener(doc, 'click', function(e) {
      if (e.target.href && !e.metaKey && e.which === 1) {
        return history._onClickLink(e);
      }
    });
    addListener(doc, 'submit', function(e) {
      if (e.target.tagName.toLowerCase() === 'form') {
        return history._onSubmitForm(e);
      }
    });
    return addListener(win, 'popstate', function(e) {
      return history._onPop(e);
    });
  },
  update: function(id, method, ignore, value, property, index) {
    var el;
    if (!(el = element(id))) {
      return false;
    }
    if (value === getMethods[method](el, property)) {
      return;
    }
    setMethods[method](el, ignore, value, property, index);
  }
};
Dom.getMethods = getMethods;
Dom.setMethods = setMethods;
});

require.define("/node_modules/derby/lib/html.js", function (require, module, exports, __dirname, __filename) {
    var attr, comment, empty, endTag, entityToCode, literalEnd, literalTag, startTag, uncomment;
startTag = /^<([^\s=\/>]+)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+)?)?)*)\s*(\/?)\s*>/;
endTag = /^<\/([^\s=\/>]+)[^>]*>/;
attr = /([^\s=]+)(?:\s*(=)\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+))?)?/g;
literalTag = /^(?:[^:]+:|style|script)$/i;
literalEnd = function(tagName) {
  switch (tagName.toLowerCase()) {
    case 'style':
      return /<\/style/i;
    case 'script':
      return /<\/script/i;
    default:
      return /<\/?[^\s=\/>:]+:/;
  }
};
comment = /<!--[\s\S]*?-->/g;
exports.uncomment = uncomment = function(html) {
  return html.replace(comment, '');
};
empty = function() {};
exports.parse = function(html, handler) {
  var chars, charsHandler, endHandler, index, last, match, onChars, parseEndTag, parseStartTag, startHandler, tagName, _results;
  if (handler == null) {
    handler = {};
  }
  charsHandler = handler.chars || empty;
  startHandler = handler.start || empty;
  endHandler = handler.end || empty;
  parseStartTag = function(tag, tagName, rest) {
    var attrs;
    attrs = {};
    rest.replace(attr, function(match, name, equals, attr0, attr1, attr2) {
      return attrs[name.toLowerCase()] = attr0 || attr1 || attr2 || (equals ? '' : null);
    });
    return startHandler(tag, tagName.toLowerCase(), attrs);
  };
  parseEndTag = function(tag, tagName) {
    return endHandler(tag, tagName.toLowerCase());
  };
  onChars = function(html, index, literal) {
    var text;
    if (~index) {
      text = html.substring(0, index);
      html = html.substring(index);
    } else {
      text = html;
      html = '';
    }
    if (text) {
      charsHandler(text, literal);
    }
    return html;
  };
  html = uncomment(html);
  _results = [];
  while (html) {
    last = html;
    chars = true;
    if (html[0] === '<') {
      if (html[1] === '/') {
        if (match = html.match(endTag)) {
          html = html.substring(match[0].length);
          match[0].replace(endTag, parseEndTag);
          chars = false;
        }
      } else {
        if (match = html.match(startTag)) {
          html = html.substring(match[0].length);
          match[0].replace(startTag, parseStartTag);
          chars = false;
          if (literalTag.test(tagName = match[1])) {
            index = html.search(literalEnd(tagName));
            html = onChars(html, index, true);
          }
        }
      }
    }
    if (chars) {
      index = html.indexOf('<');
      html = onChars(html, index);
    }
    _results.push((function() {
      if (html === last) {
        throw 'HTML parse error: ' + html;
      }
    })());
  }
  return _results;
};
exports.htmlEscape = function(s) {
  if (s == null) {
    return '';
  } else {
    return s.toString().replace(/&(?!\s)|</g, function(s) {
      if (s === '&') {
        return '&amp;';
      } else {
        return '&lt;';
      }
    });
  }
};
exports.attrEscape = function(s) {
  if (s == null || s === '') {
    return '""';
  }
  s = s.toString().replace(/&(?!\s)|"/g, function(s) {
    if (s === '&') {
      return '&amp;';
    } else {
      return '&quot;';
    }
  });
  if (/[ =<>']/.test(s)) {
    return '"' + s + '"';
  } else {
    return s;
  }
};
entityToCode = {
  quot: 0x0022,
  amp: 0x0026,
  apos: 0x0027,
  lpar: 0x0028,
  rpar: 0x0029,
  lt: 0x003C,
  gt: 0x003E,
  nbsp: 0x00A0,
  iexcl: 0x00A1,
  cent: 0x00A2,
  pound: 0x00A3,
  curren: 0x00A4,
  yen: 0x00A5,
  brvbar: 0x00A6,
  sect: 0x00A7,
  uml: 0x00A8,
  copy: 0x00A9,
  ordf: 0x00AA,
  laquo: 0x00AB,
  not: 0x00AC,
  shy: 0x00AD,
  reg: 0x00AE,
  macr: 0x00AF,
  deg: 0x00B0,
  plusmn: 0x00B1,
  sup2: 0x00B2,
  sup3: 0x00B3,
  acute: 0x00B4,
  micro: 0x00B5,
  para: 0x00B6,
  middot: 0x00B7,
  cedil: 0x00B8,
  sup1: 0x00B9,
  ordm: 0x00BA,
  raquo: 0x00BB,
  frac14: 0x00BC,
  frac12: 0x00BD,
  frac34: 0x00BE,
  iquest: 0x00BF,
  Agrave: 0x00C0,
  Aacute: 0x00C1,
  Acirc: 0x00C2,
  Atilde: 0x00C3,
  Auml: 0x00C4,
  Aring: 0x00C5,
  AElig: 0x00C6,
  Ccedil: 0x00C7,
  Egrave: 0x00C8,
  Eacute: 0x00C9,
  Ecirc: 0x00CA,
  Euml: 0x00CB,
  Igrave: 0x00CC,
  Iacute: 0x00CD,
  Icirc: 0x00CE,
  Iuml: 0x00CF,
  ETH: 0x00D0,
  Ntilde: 0x00D1,
  Ograve: 0x00D2,
  Oacute: 0x00D3,
  Ocirc: 0x00D4,
  Otilde: 0x00D5,
  Ouml: 0x00D6,
  times: 0x00D7,
  Oslash: 0x00D8,
  Ugrave: 0x00D9,
  Uacute: 0x00DA,
  Ucirc: 0x00DB,
  Uuml: 0x00DC,
  Yacute: 0x00DD,
  THORN: 0x00DE,
  szlig: 0x00DF,
  agrave: 0x00E0,
  aacute: 0x00E1,
  acirc: 0x00E2,
  atilde: 0x00E3,
  auml: 0x00E4,
  aring: 0x00E5,
  aelig: 0x00E6,
  ccedil: 0x00E7,
  egrave: 0x00E8,
  eacute: 0x00E9,
  ecirc: 0x00EA,
  euml: 0x00EB,
  igrave: 0x00EC,
  iacute: 0x00ED,
  icirc: 0x00EE,
  iuml: 0x00EF,
  eth: 0x00F0,
  ntilde: 0x00F1,
  ograve: 0x00F2,
  oacute: 0x00F3,
  ocirc: 0x00F4,
  otilde: 0x00F5,
  ouml: 0x00F6,
  divide: 0x00F7,
  oslash: 0x00F8,
  ugrave: 0x00F9,
  uacute: 0x00FA,
  ucirc: 0x00FB,
  uuml: 0x00FC,
  yacute: 0x00FD,
  thorn: 0x00FE,
  yuml: 0x00FF,
  OElig: 0x0152,
  oelig: 0x0153,
  Scaron: 0x0160,
  scaron: 0x0161,
  Yuml: 0x0178,
  fnof: 0x0192,
  circ: 0x02C6,
  tilde: 0x02DC,
  Alpha: 0x0391,
  Beta: 0x0392,
  Gamma: 0x0393,
  Delta: 0x0394,
  Epsilon: 0x0395,
  Zeta: 0x0396,
  Eta: 0x0397,
  Theta: 0x0398,
  Iota: 0x0399,
  Kappa: 0x039A,
  Lambda: 0x039B,
  Mu: 0x039C,
  Nu: 0x039D,
  Xi: 0x039E,
  Omicron: 0x039F,
  Pi: 0x03A0,
  Rho: 0x03A1,
  Sigma: 0x03A3,
  Tau: 0x03A4,
  Upsilon: 0x03A5,
  Phi: 0x03A6,
  Chi: 0x03A7,
  Psi: 0x03A8,
  Omega: 0x03A9,
  alpha: 0x03B1,
  beta: 0x03B2,
  gamma: 0x03B3,
  delta: 0x03B4,
  epsilon: 0x03B5,
  zeta: 0x03B6,
  eta: 0x03B7,
  theta: 0x03B8,
  iota: 0x03B9,
  kappa: 0x03BA,
  lambda: 0x03BB,
  mu: 0x03BC,
  nu: 0x03BD,
  xi: 0x03BE,
  omicron: 0x03BF,
  pi: 0x03C0,
  rho: 0x03C1,
  sigmaf: 0x03C2,
  sigma: 0x03C3,
  tau: 0x03C4,
  upsilon: 0x03C5,
  phi: 0x03C6,
  chi: 0x03C7,
  psi: 0x03C8,
  omega: 0x03C9,
  thetasym: 0x03D1,
  upsih: 0x03D2,
  piv: 0x03D6,
  ensp: 0x2002,
  emsp: 0x2003,
  thinsp: 0x2009,
  zwnj: 0x200C,
  zwj: 0x200D,
  lrm: 0x200E,
  rlm: 0x200F,
  ndash: 0x2013,
  mdash: 0x2014,
  lsquo: 0x2018,
  rsquo: 0x2019,
  sbquo: 0x201A,
  ldquo: 0x201C,
  rdquo: 0x201D,
  bdquo: 0x201E,
  dagger: 0x2020,
  Dagger: 0x2021,
  bull: 0x2022,
  hellip: 0x2026,
  permil: 0x2030,
  prime: 0x2032,
  Prime: 0x2033,
  lsaquo: 0x2039,
  rsaquo: 0x203A,
  oline: 0x203E,
  frasl: 0x2044,
  euro: 0x20AC,
  image: 0x2111,
  weierp: 0x2118,
  real: 0x211C,
  trade: 0x2122,
  alefsym: 0x2135,
  larr: 0x2190,
  uarr: 0x2191,
  rarr: 0x2192,
  darr: 0x2193,
  harr: 0x2194,
  crarr: 0x21B5,
  lArr: 0x21D0,
  uArr: 0x21D1,
  rArr: 0x21D2,
  dArr: 0x21D3,
  hArr: 0x21D4,
  forall: 0x2200,
  part: 0x2202,
  exist: 0x2203,
  empty: 0x2205,
  nabla: 0x2207,
  isin: 0x2208,
  notin: 0x2209,
  ni: 0x220B,
  prod: 0x220F,
  sum: 0x2211,
  minus: 0x2212,
  lowast: 0x2217,
  radic: 0x221A,
  prop: 0x221D,
  infin: 0x221E,
  ang: 0x2220,
  and: 0x2227,
  or: 0x2228,
  cap: 0x2229,
  cup: 0x222A,
  int: 0x222B,
  there4: 0x2234,
  sim: 0x223C,
  cong: 0x2245,
  asymp: 0x2248,
  ne: 0x2260,
  equiv: 0x2261,
  le: 0x2264,
  ge: 0x2265,
  sub: 0x2282,
  sup: 0x2283,
  nsub: 0x2284,
  sube: 0x2286,
  supe: 0x2287,
  oplus: 0x2295,
  otimes: 0x2297,
  perp: 0x22A5,
  sdot: 0x22C5,
  lceil: 0x2308,
  rceil: 0x2309,
  lfloor: 0x230A,
  rfloor: 0x230B,
  lang: 0x2329,
  rang: 0x232A,
  loz: 0x25CA,
  spades: 0x2660,
  clubs: 0x2663,
  hearts: 0x2665,
  diams: 0x2666
};
exports.unescapeEntities = function(html) {
  return html.replace(/&([^;]+);/g, function(match, entity) {
    return String.fromCharCode(entity.charAt(0) === '#' ? entity.charAt(1) === 'x' ? parseInt(entity.substr(2), 16) : parseInt(entity.substr(1)) : entityToCode[entity]);
  });
};
});

require.define("/node_modules/derby/lib/View.js", function (require, module, exports, __dirname, __filename) {
    var View, addDomEvent, addId, addNameToData, attrEscape, dataValue, empty, extend, extractPlaceholder, hasKeys, htmlEscape, modelPath, modelText, parse, parseAttr, parseElement, parseHtml, parsePlaceholder, parsePlaceholderContent, parseString, reduceStack, renderer, startsEndBlock, trim, unaliasName, unescapeEntities, _ref, _ref2;
hasKeys = require('racer').util.hasKeys;
_ref = require('./html'), parseHtml = _ref.parse, unescapeEntities = _ref.unescapeEntities, htmlEscape = _ref.htmlEscape, attrEscape = _ref.attrEscape;
_ref2 = require('./parser'), modelPath = _ref2.modelPath, parsePlaceholder = _ref2.parsePlaceholder, parseElement = _ref2.parseElement, parseAttr = _ref2.parseAttr, addDomEvent = _ref2.addDomEvent;
empty = function() {};
View = module.exports = function() {
  var self;
  self = this;
  this._views = {};
  this._paths = {};
  this._onBinds = {};
  this._aliases = {};
  this._templates = {};
  this._inline = '';
  this._idCount = 0;
  this._uniqueId = function() {
    return '$' + (self._idCount++).toString(36);
  };
};
View.prototype = {
  _find: function(name) {
    return this._views[name] || (function() {
      throw "Can't find view: " + name;
    })();
  },
  get: function(viewName, ctx, parentCtx, path, triggerPath, triggerId) {
    var i, indicies, item, obj, out, parentView, paths, re, start, type, view, _len, _ref3;
    type = viewName.charAt(0);
    if (!(view = this._views[viewName])) {
      if (~(i = viewName.indexOf('$p'))) {
        start = type === '#' || type === '^' ? 1 : 0;
        parentView = viewName.substr(start, i - start);
        this._find(parentView);
        this.get(parentView, parentCtx = {
          $triggerPath: triggerPath,
          $triggerId: triggerId
        });
        return this.get(viewName, ctx, parentCtx, null, triggerPath, triggerId);
      }
      return '';
    }
    paths = parentCtx && parentCtx.$paths;
    if (path) {
      paths = this._paths[viewName] = paths ? [path].concat(paths) : [path];
    } else {
      this._paths[viewName] = paths || (paths = this._paths[viewName]);
    }
    if (Array.isArray(ctx)) {
      if (ctx.length) {
        if (type === '^') {
          return '';
        }
        out = '';
        if (parentCtx) {
          parentCtx = Object.create(parentCtx);
          parentCtx.$paths = paths.slice();
          parentCtx.$paths[0] += '.$#';
          indicies = parentCtx.$i || [];
        }
        for (i = 0, _len = ctx.length; i < _len; i++) {
          item = ctx[i];
          obj = extend(parentCtx, item);
          obj.$i = [i].concat(indicies);
          out += view(obj);
        }
        return out;
      } else {
        if (type !== '^') {
          return '';
        }
      }
    } else {
      if ((type === '^' && ctx) || (type === '#' && !ctx)) {
        return '';
      }
    }
    ctx = extend(parentCtx, ctx);
    ctx.$triggerId = triggerId;
    if ((ctx.$paths = paths) && (triggerPath || (triggerPath = ctx.$triggerPath))) {
      path = paths[0];
      if (path.charAt(path.length - 1) !== '#' && /\.\d+$/.test(triggerPath)) {
        ctx.$paths = paths = paths.slice();
        paths[0] = path += '.$#';
      }
      re = RegExp(path.replace(/\.|\$#/g, function(match) {
        if (match === '.') {
          return '\\.';
        } else {
          return '(\\d+)';
        }
      }));
      ctx.$i = (_ref3 = re.exec(triggerPath)) != null ? _ref3.slice(1).reverse() : void 0;
    }
    return view(ctx);
  },
  make: function(name, template, data) {
    var render, self;
    if (data == null) {
      data = {};
    }
    if (!data.$isString) {
      this.make(name + '$s', template, extend(data, {
        $isString: true
      }));
    }
    name = name.toLowerCase();
    self = this;
    render = function(ctx) {
      render = parse(self, name, template, data, ctx, self._onBinds[name]);
      return render(ctx);
    };
    return this._views[name] = function(ctx) {
      return render(extend(data, ctx));
    };
  },
  before: function(name, before) {
    var fn;
    fn = this._find(name);
    return this._views[name] = function(ctx) {
      before(ctx);
      return fn(ctx);
    };
  },
  after: function(name, after) {
    var fn;
    fn = this._find(name);
    return this._views[name] = function(ctx) {
      setTimeout(after, 0, ctx);
      return fn(ctx);
    };
  },
  inline: empty,
  render: function(model, ctx) {
    this.model = model;
    this.model.__events.clear();
    this.dom.events.clear();
    document.body.innerHTML = this.get('header', ctx) + this.get('body', ctx);
    return document.title = this.get('title$s', ctx);
  },
  htmlEscape: htmlEscape,
  attrEscape: attrEscape
};
extend = function(parent, obj) {
  var key, out;
  if (typeof parent !== 'object') {
    if (typeof obj === 'object') {
      return obj;
    } else {
      return {};
    }
  }
  out = Object.create(parent);
  if (!obj) {
    return out;
  }
  for (key in obj) {
    out[key] = obj[key];
  }
  return out;
};
addId = function(attrs, uniqueId) {
  if (attrs.id == null) {
    return attrs.id = function() {
      return attrs._id = uniqueId();
    };
  }
};
View.trim = trim = function(s) {
  if (s) {
    return s.replace(/\n\s*/g, '');
  } else {
    return '';
  }
};
extractPlaceholder = function(text) {
  var content, match, _ref3;
  match = /^([^\{\(]*)(\{{2,3}|\({2,3})([^\}\)]+)(?:\}{2,3}|\){2,3})([\s\S]*)/.exec(text);
  if (!match) {
    return;
  }
  content = /^\s*([\#^\/]?)\s*([^\s>]*)(?:\s+:([^\s>]+))?(?:\s*>\s*([^\s]+)\s*)?/.exec(match[3]);
  return {
    pre: trim(match[1]),
    escaped: match[2].length === 2,
    literal: match[2].charAt(0) === '{',
    type: content[1],
    name: content[2],
    alias: content[3],
    partial: (_ref3 = content[4]) != null ? _ref3.toLowerCase() : void 0,
    post: trim(match[4])
  };
};
startsEndBlock = function(s) {
  return /^(?:\{{2,3}|\({2,3})[\/^](?:\}{2,3}|\){2,3})/.test(s);
};
unaliasName = function(data, depth, name) {
  var aliasName, i, offset, remainder;
  if (name.charAt(0) !== ':') {
    return name;
  }
  i = name.indexOf('.');
  aliasName = name.substring(1, i);
  remainder = name.substr(i + 1);
  offset = depth - data.$aliases[aliasName];
  if (offset !== offset) {
    throw "Can't find alias for " + name;
  }
  return Array(offset + 1).join('.') + remainder;
};
addNameToData = function(data, depth, name) {
  name = unaliasName(data, depth, name);
  data[name] = {
    model: name
  };
  return name;
};
dataValue = function(data, name, model) {
  var path, value;
  if (path = modelPath(data, name)) {
    if ((value = model.get(path)) != null) {
      return value;
    } else {
      return model[path];
    }
  } else {
    return data[name];
  }
};
modelText = function(view, name, escape) {
  return function(data, model) {
    var text;
    text = dataValue(data, name, model);
    text = text != null ? text.toString() : '';
    if (escape) {
      text = escape(text);
    }
    return text;
  };
};
reduceStack = function(stack) {
  var attrs, bool, html, i, item, key, pushValue, value, _i, _len;
  html = [''];
  i = 0;
  for (_i = 0, _len = stack.length; _i < _len; _i++) {
    item = stack[_i];
    pushValue = function(value, isAttr) {
      if (value && value.call) {
        return i = html.push(value, '') - 1;
      } else {
        return html[i] += isAttr ? attrEscape(value) : value;
      }
    };
    switch (item[0]) {
      case 'start':
        html[i] += '<' + item[1];
        attrs = item[2];
        if ('id' in attrs) {
          html[i] += ' id=';
          pushValue(attrs.id, true);
        }
        for (key in attrs) {
          value = attrs[key];
          if (key === 'id') {
            continue;
          }
          if (value != null) {
            if (bool = value.bool) {
              pushValue(bool);
              continue;
            }
            html[i] += ' ' + key + '=';
            pushValue(value, true);
          } else {
            html[i] += ' ' + key;
          }
        }
        html[i] += '>';
        break;
      case 'chars':
        pushValue(item[1]);
        break;
      case 'end':
        html[i] += '</' + item[1] + '>';
    }
  }
  return html;
};
renderer = function(view, items, events) {
  return function(data) {
    var domEvents, event, html, item, model, modelEvents, _i, _len;
    model = view.model;
    modelEvents = model.__events;
    domEvents = view.dom.events;
    html = ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        _results.push((item.call ? item(data, model) : item));
      }
      return _results;
    })()).join('');
    for (_i = 0, _len = events.length; _i < _len; _i++) {
      event = events[_i];
      event(data, modelEvents, domEvents);
    }
    return html;
  };
};
parsePlaceholderContent = function(view, data, depth, partialName, queues, popped, stack, events, block, match, isString, onBind, callbacks) {
  var alias, autoClosed, datum, endBlock, lastAutoClosed, lastPartial, literal, name, partial, partialText, startBlock, type, _ref3;
  literal = match.literal, type = match.type, name = match.name, alias = match.alias, partial = match.partial;
  if (partial && isString) {
    partial += '$s';
  }
  if (alias) {
    data.$aliases[alias] = depth + queues.length;
  }
  name = addNameToData(data, depth + queues.length, name);
  if (block && ((endBlock = type === '/') || (autoClosed = type === '^' && (!name || name === block.name) && block.type === '#'))) {
    name = block.name, partial = block.partial, literal = block.literal, lastPartial = block.lastPartial, lastAutoClosed = block.lastAutoClosed;
    popped.push(queues.pop());
    _ref3 = queues[queues.length - 1], stack = _ref3.stack, events = _ref3.events, block = _ref3.block;
    callbacks.onStartBlock(stack, events, block);
  }
  if (startBlock = type === '#' || type === '^') {
    lastPartial = partial;
    partial = type + partialName();
    block = {
      type: type,
      name: name,
      partial: partial,
      literal: literal,
      lastPartial: lastPartial,
      lastAutoClosed: autoClosed
    };
  }
  if (partial) {
    partialText = function(data, model) {
      view._onBinds[partial] = onBind;
      data.$depth = depth + queues.length;
      return view.get(partial, dataValue(data, name || '.', model), data, modelPath(data, name, true));
    };
  }
  if ((datum = data[name]) != null) {
    if (datum.model && !startBlock) {
      if (!literal) {
        callbacks.onBind(name, partial, endBlock, lastAutoClosed, lastPartial);
      }
      callbacks.onModelText(partialText, name, endBlock);
    } else {
      callbacks.onText(partialText, datum, endBlock);
    }
  } else {
    callbacks.onText(partialText, '', endBlock);
  }
  if (startBlock) {
    queues.push({
      stack: stack = [],
      events: events = [],
      viewName: partial,
      block: block
    });
    return callbacks.onStartBlock(stack, events, block);
  }
};
parse = function(view, viewName, template, data, ctx, onBind) {
  var aliases, block, chars, depth, events, partialCount, partialName, popped, queue, queues, stack, uniqueId, _fn, _i, _len;
  partialCount = 0;
  partialName = function() {
    return viewName + '$p' + partialCount++;
  };
  if (hasKeys(ctx.$aliases)) {
    view._aliases[viewName] = [data.$aliases = ctx.$aliases, depth = ctx.$depth || 0];
  } else if (aliases = view._aliases[viewName]) {
    data.$aliases = aliases[0], depth = aliases[1];
  } else {
    data.$aliases = ctx.$aliases || {};
    depth = ctx.$depth || 0;
  }
  if (data.$isString) {
    if (viewName === 'title$s') {
      onBind = function(events, name) {
        return events.push(function(data, modelEvents) {
          var path;
          if (!(path = modelPath(data, name))) {
            return;
          }
          return modelEvents.bind(path, ['$doc', 'prop', 'title', 'title$s']);
        });
      };
    }
    return parseString(view, viewName, template, data, depth, partialName, onBind || empty);
  }
  uniqueId = view._uniqueId;
  queues = [
    {
      stack: stack = [],
      events: events = []
    }
  ];
  popped = [];
  block = null;
  parseHtml(template, {
    start: function(tag, tagName, attrs) {
      var attr, forAttr, out, parser, value;
      if (parser = parseElement[tagName]) {
        out = parser(events, attrs) || {};
        if (out.addId) {
          addId(attrs, uniqueId);
        }
      }
      forAttr = function(attr, value) {
        var anyOut, anyParser, bool, del, elOut, elParser, invert, literal, match, method, name, partial, post, pre, render, _ref3;
        if (match = extractPlaceholder(value)) {
          pre = match.pre, post = match.post, name = match.name, partial = match.partial, literal = match.literal;
          name = addNameToData(data, depth + queues.length, name);
          invert = /^\s*!\s*$/.test(pre);
          if ((pre && !invert) || post || partial) {
            partial = partialName();
            addId(attrs, uniqueId);
            render = parseString(view, partial, value, data, depth, partialName, function(events, name) {
              return events.push(function(data, modelEvents) {
                var id, path;
                if (id = data.$triggerId) {
                  attrs._id = id;
                }
                if (!(path = modelPath(data, name))) {
                  return;
                }
                return modelEvents.bind(path, [attrs._id || attrs.id, 'attr', attr, partial]);
              });
            });
            view._views[partial] = function(ctx) {
              return render(extend(data, ctx));
            };
            attrs[attr] = function(data, model) {
              return attrEscape(render(data, model));
            };
            return;
          }
          if (parser = parsePlaceholder[attr]) {
            if (anyParser = parser['*']) {
              anyOut = anyParser(events, attrs, name, invert);
            }
            if (elParser = parser[tagName]) {
              elOut = elParser(events, attrs, name, invert);
            }
          }
          anyOut || (anyOut = {});
          elOut || (elOut = {});
          method = elOut.method || anyOut.method || 'attr';
          bool = elOut.bool || anyOut.bool;
          del = elOut.del || anyOut.del;
          if (((_ref3 = data[name]) != null ? _ref3.model : void 0) && !literal) {
            addId(attrs, uniqueId);
            events.push(function(data, modelEvents) {
              var args, path;
              if (!(path = modelPath(data, name))) {
                return;
              }
              args = [attrs._id || attrs.id, method, attr];
              if (invert) {
                args[3] = '$inv';
              }
              return modelEvents.bind(path, args);
            });
          }
          if (del) {
            delete attrs[attr];
          } else {
            attrs[attr] = bool ? {
              bool: function(data, model) {
                if (!dataValue(data, name, model) !== !invert) {
                  return ' ' + attr;
                } else {
                  return '';
                }
              }
            } : modelText(view, name, attrEscape);
          }
        }
        if (!(parser = parseAttr[attr])) {
          return;
        }
        if (anyParser = parser['*']) {
          anyOut = anyParser(events, attrs, value);
        }
        if (elParser = parser[tagName]) {
          elOut = elParser(events, attrs, value);
        }
        anyOut || (anyOut = {});
        elOut || (elOut = {});
        if (elOut.addId || anyOut.addId) {
          return addId(attrs, uniqueId);
        }
      };
      for (attr in attrs) {
        value = attrs[attr];
        if (attr === 'style') {
          continue;
        }
        forAttr(attr, value);
      }
      if ('style' in attrs) {
        forAttr('style', attrs.style);
      }
      return stack.push(['start', tagName, attrs]);
    },
    chars: chars = function(text, literal) {
      var escaped, match, post, pre, pushText, wrap;
      if (literal || !(match = extractPlaceholder(text))) {
        if (text = trim(text)) {
          stack.push(['chars', text]);
        }
        return;
      }
      pre = match.pre, post = match.post, escaped = match.escaped;
      pushText = function(text, endBlock) {
        if (text && !endBlock) {
          return stack.push(['chars', text]);
        }
      };
      pushText(pre);
      wrap = null;
      parsePlaceholderContent(view, data, depth, partialName, queues, popped, stack, events, block, match, false, null, {
        onBind: function(name, partial, endBlock, lastAutoClosed, lastPartial) {
          var addEvent, attrs, i, last;
          i = stack.length - (endBlock ? (lastAutoClosed ? 3 : 2) : 1);
          last = stack[i];
          if (wrap = pre || (post && !startsEndBlock(post)) || !(last && last[0] === 'start')) {
            last = ['start', 'ins', {}];
            if (endBlock) {
              stack.splice(i + 1, 0, last);
            } else {
              stack.push(last);
            }
          }
          attrs = last[2];
          addId(attrs, uniqueId);
          if ('contenteditable' in attrs) {
            addDomEvent(events, attrs, name, 'input', 'html');
          }
          addEvent = function(partial, domMethod) {
            return events.push(function(data, modelEvents) {
              var params, path;
              if (!(path = modelPath(data, name))) {
                return;
              }
              params = [attrs._id || attrs.id, domMethod, +escaped];
              if (partial) {
                params[3] = partial;
              }
              return modelEvents.bind(path, params);
            });
          };
          addEvent(partial, 'html');
          if (lastAutoClosed) {
            return addEvent(lastPartial, 'append');
          }
        },
        onModelText: function(partialText, name, endBlock) {
          if (partialText) {
            escaped = false;
          }
          pushText(partialText || modelText(view, name, escaped && htmlEscape), endBlock);
          if (wrap) {
            return stack.push(['end', 'ins']);
          }
        },
        onText: function(partialText, value, endBlock) {
          if (partialText) {
            escaped = false;
          }
          return pushText(partialText || (escaped ? htmlEscape(value) : value.toString()), endBlock);
        },
        onStartBlock: function(_stack, _events, _block) {
          stack = _stack;
          events = _events;
          return block = _block;
        }
      });
      if (post) {
        return chars(post);
      }
    },
    end: function(tag, tagName) {
      return stack.push(['end', tagName]);
    }
  });
  _fn = function(queue) {
    var render;
    render = renderer(view, reduceStack(queue.stack), queue.events);
    return view._views[queue.viewName] = function(ctx) {
      return render(extend(data, ctx));
    };
  };
  for (_i = 0, _len = popped.length; _i < _len; _i++) {
    queue = popped[_i];
    _fn(queue);
  }
  return renderer(view, reduceStack(stack), events);
};
parseString = function(view, viewName, template, data, depth, partialName, onBind) {
  var block, events, match, popped, post, pre, pushText, queue, queues, stack, _fn, _i, _len;
  queues = [
    {
      stack: stack = [],
      events: events = []
    }
  ];
  popped = [];
  block = null;
  pushText = function(text, endBlock) {
    if (text && !endBlock) {
      return stack.push(text);
    }
  };
  post = template;
  while (post) {
    match = extractPlaceholder(post);
    if (match == null) {
      pushText(unescapeEntities(post));
      break;
    }
    pre = match.pre, post = match.post;
    pushText(unescapeEntities(pre));
    parsePlaceholderContent(view, data, depth, partialName, queues, popped, stack, events, block, match, true, onBind, {
      onBind: function(name) {
        return onBind(events, name);
      },
      onModelText: function(partialText, name, endBlock) {
        return pushText(partialText || modelText(view, name), endBlock);
      },
      onText: function(partialText, value, endBlock) {
        return pushText(partialText || value.toString(), endBlock);
      },
      onStartBlock: function(_stack, _events, _block) {
        stack = _stack;
        events = _events;
        return block = _block;
      }
    });
  }
  _fn = function(queue) {
    var render;
    render = renderer(view, queue.stack, queue.events);
    return view._views[queue.viewName] = function(ctx) {
      return render(extend(data, ctx));
    };
  };
  for (_i = 0, _len = popped.length; _i < _len; _i++) {
    queue = popped[_i];
    _fn(queue);
  }
  return renderer(view, stack, events);
};
});

require.define("/node_modules/derby/lib/parser.js", function (require, module, exports, __dirname, __filename) {
    var addConditionalStyle, addDomEvent, distribute, modelPath, replaceIndex, splitBind;
replaceIndex = function(data, path, noReplace) {
  var i, indicies;
  if (noReplace || !(indicies = data.$i) || !path) {
    return path;
  }
  i = 0;
  return path.replace(/\$#/g, function() {
    return indicies[i++];
  });
};
addConditionalStyle = function(attrs, name, invert, styleText) {
  var cat, style, type;
  type = invert ? '#' : '^';
  cat = "{{" + type + name + "}}" + styleText + "{{/}}";
  return attrs.style = (style = attrs.style) ? "" + style + ";" + cat : cat;
};
splitBind = function(value) {
  var delay, name, out, pair, pairs, _i, _len, _ref, _ref2;
  pairs = value.replace(/\s/g, '').split(',');
  out = {};
  for (_i = 0, _len = pairs.length; _i < _len; _i++) {
    pair = pairs[_i];
    _ref = pair.split(':'), name = _ref[0], value = _ref[1];
    _ref2 = name.split('/'), name = _ref2[0], delay = _ref2[1];
    out[name] = {
      value: value,
      delay: delay
    };
  }
  return out;
};
module.exports = {
  modelPath: modelPath = function(data, name, noReplace) {
    var datum, i, path, paths;
    if ((paths = data.$paths) && name.charAt(0) === '.') {
      if (name === '.') {
        return replaceIndex(data, paths[0], noReplace);
      }
      i = /^\.+/.exec(name)[0].length - 1;
      return replaceIndex(data, paths[i], noReplace) + name.substr(i);
    }
    if (!((datum = data[name]) && (path = datum.model))) {
      return null;
    }
    return path.replace(/\[([^\]]+)\]/g, function(match, name) {
      return data[name];
    });
  },
  addDomEvent: addDomEvent = function(events, attrs, name, _eventNames, getMethod, property, invert) {
    var args, delay, eventName, eventNames, i, isArray, prefix, _len, _ref;
    args = [null, null, getMethod, property];
    if (isArray = Array.isArray(_eventNames)) {
      eventNames = [];
      for (i = 0, _len = _eventNames.length; i < _len; i++) {
        eventName = _eventNames[i];
        eventNames[i] = eventName.split('/');
      }
    } else {
      _ref = _eventNames.split('/'), eventName = _ref[0], delay = _ref[1];
      if (delay != null) {
        args.push(delay);
      }
    }
    prefix = invert ? '!' : '';
    return events.push(function(data, modelEvents, domEvents) {
      var _i, _len2, _ref2, _results;
      args[0] = prefix + modelPath(data, name);
      args[1] = attrs._id || attrs.id;
      if (!isArray) {
        return domEvents.bind(eventName, args);
      }
      _results = [];
      for (_i = 0, _len2 = eventNames.length; _i < _len2; _i++) {
        _ref2 = eventNames[_i], eventName = _ref2[0], delay = _ref2[1];
        _results.push(domEvents.bind(eventName, delay != null ? args.concat(delay) : args));
      }
      return _results;
    });
  },
  distribute: distribute = function(events, attrs, eventName) {
    var args;
    args = ['$dist', null];
    return events.push(function(data, modelEvents, domEvents) {
      args[1] = attrs._id || attrs.id;
      return domEvents.bind(eventName, args);
    });
  },
  parsePlaceholder: {
    'value': {
      input: function(events, attrs, name) {
        var eventNames;
        if ('x-blur' in attrs) {
          delete attrs['x-blur'];
          eventNames = 'change';
        } else {
          eventNames = 'input';
        }
        addDomEvent(events, attrs, name, eventNames, 'prop', 'value');
        return {
          method: 'propPolite'
        };
      }
    },
    'checked': {
      '*': function(events,  attrs, name, invert) {
        addDomEvent(events, attrs, name, 'change', 'prop', 'checked', invert);
        return {
          method: 'prop',
          bool: true
        };
      }
    },
    'selected': {
      '*': function(events, attrs, name, invert) {
        addDomEvent(events, attrs, name, 'change', 'prop', 'selected', invert);
        return {
          method: 'prop',
          bool: true
        };
      }
    },
    'disabled': {
      '*': function() {
        return {
          method: 'prop',
          bool: true
        };
      }
    },
    'x-visible': {
      '*': function(events, attrs, name, invert) {
        addConditionalStyle(attrs, name, invert, 'visibility:hidden');
        return {
          method: 'visible',
          del: true
        };
      }
    },
    'x-displayed': {
      '*': function(events, attrs, name, invert) {
        addConditionalStyle(attrs, name, invert, 'display:none');
        return {
          method: 'displayed',
          del: true
        };
      }
    }
  },
  parseElement: {
    'select': function(events, attrs) {
      distribute(events, attrs, 'change');
      return {
        addId: true
      };
    }
  },
  parseAttr: {
    'x-bind': {
      '*': function(events, attrs, value) {
        var name, obj, _fn, _ref;
        delete attrs['x-bind'];
        _ref = splitBind(value);
        _fn = function(name) {
          var args, delay;
          value = obj.value, delay = obj.delay;
          args = [value, null];
          if (delay != null) {
            args.push(delay);
          }
          return events.push(function(data, modelEvents, domEvents) {
            args[1] = attrs._id || attrs.id;
            return domEvents.bind(name, args);
          });
        };
        for (name in _ref) {
          obj = _ref[name];
          _fn(name);
        }
        return {
          addId: true
        };
      },
      a: function(events, attrs, value) {
        var obj;
        obj = splitBind(value);
        if ('click' in obj && !('href' in attrs)) {
          attrs.href = '#';
          if (!('onclick' in attrs)) {
            return attrs.onclick = 'return false';
          }
        }
      },
      form: function(events, attrs, value) {
        var obj;
        obj = splitBind(value);
        if ('submit' in obj) {
          if (!('onsubmit' in attrs)) {
            return attrs.onsubmit = 'return false';
          }
        }
      }
    }
  }
};
});

require.define("/node_modules/derby/lib/History.js", function (require, module, exports, __dirname, __filename) {
    var History, cancelRender, qs, renderRoute, routePath, win, winHistory, winLocation;
qs = require('qs');
win = window;
winHistory = win.history;
winLocation = win.location;
if (winHistory.replaceState) {
  winHistory.replaceState({
    render: true,
    method: 'get'
  }, null, winLocation.href);
}
History = module.exports = function(_routes, page) {
  this._routes = _routes;
  if (!winHistory.pushState) {
    this.push = this.replace = function() {};
  }
  page.history = this;
  this._page = page;
};
History.prototype = {
  push: function(url, render, e) {
    return this._update('pushState', url, render, e);
  },
  replace: function(url, render, e) {
    return this._update('replaceState', url, render, e);
  },
  back: function() {
    return winHistory.back();
  },
  forward: function() {
    return winHistory.forward();
  },
  go: function(i) {
    return winHistory.go(i);
  },
  _update: function(historyMethod, url, render, e) {
    var body, el, form, method, name, override, query, _i, _len, _ref;
    if (e && e.type === 'submit') {
      form = e.target;
      query = [];
      _ref = form.elements;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        if (name = el.name) {
          query.push(encodeURIComponent(name) + '=' + encodeURIComponent(el.value));
          if (name === '_method') {
            override = el.value.toLowerCase();
            if (override === 'delete') {
              override = 'del';
            }
          }
        }
      }
      query = query.join('&');
      if (form.method.toLowerCase() === 'post') {
        method = override || 'post';
        body = qs.parse(query);
      } else {
        method = 'get';
        url += '?' + query;
      }
    } else {
      method = 'get';
    }
    winHistory[historyMethod]({
      render: render,
      method: method
    }, null, url);
    if (render) {
      return renderRoute(url, body, this._page, this._routes[method], 0, form, e);
    }
  },
  _onClickLink: function(e) {
    var i, path, url;
    url = e.target.href;
    if (~(i = url.indexOf('#')) && url.substr(0, i) === winLocation.href.replace(/#.*/, '')) {
      return;
    }
    if (path = routePath(url)) {
      return this.push(path, true, e);
    }
  },
  _onSubmitForm: function(e) {
    var form, path;
    form = e.target;
    if (!(path = routePath(form.action)) || form._forceSubmit || form.enctype === 'multipart/form-data') {
      return;
    }
    return this.push(path, true, e);
  },
  _onPop: function(e) {
    var state;
    if (!((state = e.state) && state.render)) {
      return;
    }
    return renderRoute(winLocation.pathname, null, this._page, this._routes[state.method], 0, null, e);
  }
};
cancelRender = function(url, form, e) {
  if (e) {
    return;
  }
  if (form) {
    form._forceSubmit = true;
    return form.submit();
  } else {
    return win.location = url;
  }
};
renderRoute = function(url, body, page, routes, i, form, e) {
  var j, match, name, next, params, path, query, route, _len, _ref, _ref2;
  url = url.replace(/#.*/, '');
  _ref = url.split('?'), path = _ref[0], query = _ref[1];
  while (route = routes[i++]) {
    if (!(match = route.match(path))) {
      continue;
    }
    if (e) {
      e.preventDefault();
    }
    params = {
      url: url,
      body: body,
      query: query ? qs.parse(query) : {}
    };
    _ref2 = route.keys;
    for (j = 0, _len = _ref2.length; j < _len; j++) {
      name = _ref2[j].name;
      params[name] = match[j + 1];
    }
    next = function(err) {
      if (err != null) {
        return cancelRender(url, form);
      }
      return renderRoute(url, body, page, routes, i, form);
    };
    try {
      route.callbacks(page, page.model, params, next);
    } catch (err) {
      cancelRender(url, form);
    }
    return;
  }
  return cancelRender(url, form, e);
};
routePath = function(url) {
  var match;
  match = /^(https?:)\/\/([^\/]+)(.*)/.exec(url);
  return match && match[1] === winLocation.protocol && match[2] === winLocation.host && match[3];
};
});

require.define("/node_modules/derby/node_modules/qs/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"index"}
});

require.define("/node_modules/derby/node_modules/qs/index.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/querystring');
});

require.define("/node_modules/derby/node_modules/qs/lib/querystring.js", function (require, module, exports, __dirname, __filename) {
    
/*!
 * querystring
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.4.0';

/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Cache non-integer test regexp.
 */

var notint = /[^0-9]/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {};
  var t = {};
  for (var i in parent[key]) t[i] = parent[key][i];
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  // end
  if (!part) {
    if (Array.isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (Array.isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[Object.keys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~part.indexOf(']')) {
      part = part.substr(0, part.length - 1);
      if(notint.test(part) && Array.isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if(notint.test(part) && Array.isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~key.indexOf(']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (notint.test(key) && Array.isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };
  Object.keys(obj).forEach(function(name){
    merge(ret, name, obj[name]);
  });
  return ret.base;
}

/**
 * Parse the given str.
 */

function parseString(str){
  return String(str)
    .split('&')
    .reduce(function(ret, pair){
      try{
        pair = decodeURIComponent(pair.replace(/\+/g, ' '));
      } catch(e) {
        // ignore
      }

      var eql = pair.indexOf('=')
        , brace = lastBraceInKey(pair)
        , key = pair.substr(0, brace || eql)
        , val = pair.substr(brace || eql, pair.length)
        , val = val.substr(val.indexOf('=') + 1, val.length);

      // ?foo
      if ('' == key) key = pair, val = '';

      return merge(ret, key, val);
    }, { base: {} }).base;
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (Array.isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix;
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[]'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = Object.keys(obj)
    , key;
  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    ret.push(stringify(obj[key], prefix
      ? prefix + '[' + encodeURIComponent(key) + ']'
      : encodeURIComponent(key)));
  }
  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (Array.isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

});

require.define("/node_modules/express/lib/router/route.js", function (require, module, exports, __dirname, __filename) {
    
/*!
 * Express - router - Route
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Initialize `Route` with the given HTTP `method`, `path`,
 * and an array of `callbacks` and `options`.
 *
 * Options:
 *
 *   - `sensitive`    enable case-sensitive routes
 *   - `strict`       enable strict matching for trailing slashes
 *
 * @param {String} method
 * @param {String} path
 * @param {Array} callbacks
 * @param {Object} options.
 * @api private
 */

function Route(method, path, callbacks, options) {
  options = options || {};
  this.path = path;
  this.method = method;
  this.callbacks = callbacks;
  this.regexp = normalize(path
    , this.keys = []
    , options.sensitive
    , options.strict);
}

/**
 * Check if this route matches `path` and return captures made.
 *
 * @param {String} path
 * @return {Array}
 * @api private
 */

Route.prototype.match = function(path){
  return this.regexp.exec(path);
};

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp} path
 * @param  {Array} keys
 * @param  {Boolean} sensitive
 * @param  {Boolean} strict
 * @return {RegExp}
 * @api private
 */

function normalize(path, keys, sensitive, strict) {
  if (path instanceof RegExp) return path;
  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      keys.push({ name: key, optional: !! optional });
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)');
  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
}

});
