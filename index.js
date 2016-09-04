(function(factory) {
  if (typeof module === 'object' && typeof require === 'function') {
    module.exports = factory();
  } else if (typeof window !== 'undefined') {
    window.WebScrollToLoad = factory();
  }
})(function() {

  var cssInjected = false;
  function injectCSS() {
    if (cssInjected) {
      return;
    }
    var dom = document.createElement('style');
    dom.type = 'text/css';
    dom.innerHTML = [
      '.web-scroll-to-load-wrap {',
      '  overflow: hidden;',
      '  overflow-y: auto;',
      '  -webkit-overflow-scrolling: touch;',
      '  position: relative',
      '}',
      '.web-scroll-to-load-header {',
      '  position: absolute;',
      '  width: 100%;',
      '  top: 0;',
      '  left: 0;',
      '}',
      '.web-scroll-to-load-wrap-default {',
      '  background: #888;',
      '}',
      '.web-scroll-to-load-header-default, .web-scroll-to-load-footer-default {',
      '  background: #888;',
      '  padding: 1em 0;',
      '  text-align: center;',
      '}',
      '.web-scroll-to-load-header-default::after, .web-scroll-to-load-footer-default::after {',
      '  content: "↓";',
      '  display: inline-block;',
      '  color: #FFF;',
      '  border: 2px solid #FFF;',
      '  border-radius: 3em;',
      '  width: 2em;',
      '  height: 2em;',
      '  overflow: hidden;',
      '  line-height: 2.2em;',
      '  font-size: 0.8em;',
      '  -webkit-font-smoothing: antialiased;',
      '  transition: transform 0.3s;',
      '  -webkit-transition: -webkit-transform 0.3s;',
      '}',
      '.web-scroll-to-load-header-ready .web-scroll-to-load-header-default::after {',
      '  transform: rotate(180deg);',
      '  -webkit-transform: rotate(180deg);',
      '}',
      '@-webkit-keyframes web-scroll-to-load-loading {',
      '  0% { transform: scale(1, 1); -webkit-transform: scale(1, 1); }',
      '  50% { transform: scale(0.5, 0.5); -webkit-transform: scale(0.5, 0.5); }',
      '  100% { transform: scale(1, 1); -webkit-transform: scale(1, 1); }',
      '}',
      '@keyframes web-scroll-to-load-loading {',
      '  0% { transform: scale(1, 1); -webkit-transform: scale(1, 1); }',
      '  50% { transform: scale(0.5, 0.5); -webkit-transform: scale(0.5, 0.5); }',
      '  100% { transform: scale(1, 1); -webkit-transform: scale(1, 1); }',
      '}',
      '.web-scroll-to-load-header-loading .web-scroll-to-load-header-default::after {',
      '  content: "";',
      '  transition: none;',
      '  -webkit-transition: none;',
      '  animation: web-scroll-to-load-loading 1s infinite;',
      '  -webkit-animation: web-scroll-to-load-loading 1s infinite;',
      '}',
      '.web-scroll-to-load-footer-default::after {',
      '  content: "";',
      '  transition: none;',
      '  -webkit-transition: none;',
      '  animation: web-scroll-to-load-loading 1s infinite;',
      '  -webkit-animation: web-scroll-to-load-loading 1s infinite;',
      '}',
    ].join('');
    document.querySelector('head').appendChild(dom);
  }

  function getDom(obj, key, deft) {
    if (!obj[key] && deft) {
        obj[key] = deft();
    }
    obj[key] = typeof obj[key] === 'string' ? document.querySelector(obj[key]) : obj[key];
    if (obj[key].className) {
      obj[key].className += ' web-scroll-to-load-' + key;
    } else {
      obj[key].className = 'web-scroll-to-load-' + key;
    }
  }

  function assign() {
    var ret = arguments[0] || {};
    for (var i = 0; i < arguments.length; i++) {
      var iObj = arguments[i];
      if (iObj && typeof iObj === 'object') {
        for (var k in iObj) {
          ret[k] = iObj[k];
        }
      }
    }
    return ret;
  }


  function WebScrollToLoad(options) {
    options = assign({
      heightDiff: 0,
      onHeaderStateChange: function(state) {
        var cname = options.header.className || '';
        cname = cname.replace(/\bweb-scroll-to-load-header-(peek|ready|loading)\b/g, '');
        cname += ' web-scroll-to-load-header-' + state;
        options.header.className = cname;
      },
    }, options);

    injectCSS();

    getDom(options, 'content');
    getDom(options, 'wrap', function() {
      var ret = document.createElement('div');
      ret.className = 'web-scroll-to-load-wrap-default';
      if (options.content.parentElement) {
        options.content.parentElement.insertBefore(ret, options.content);
        options.content.parentElement.removeChild(options.content);
      }
      ret.appendChild(options.content);
      return ret;
    });
    getDom(options, 'header', function() {
      var deft = document.createElement('div');
      deft.className = 'web-scroll-to-load-header-default';
      var ret = document.createElement('div');
      ret.appendChild(deft);
      options.wrap.insertBefore(ret, options.content);
      return ret;
    });
    getDom(options, 'footer', function() {
      var deft = document.createElement('div');
      deft.className = 'web-scroll-to-load-footer-default';
      var ret = document.createElement('div');
      ret.appendChild(deft);
      options.wrap.appendChild(ret);
      return ret;
    });

    function onResize() {
      ret.update();
    }

    var destroyed = false;
    var loadingMore = false, noMore = typeof options.onLoadMore !== 'function';
    var startY = 0, dragState = null;
    function onTouchStart(evt) {
      if (!dragState && options.wrap.scrollTop === 0 && typeof options.onRefresh === 'function') {
        var y = evt.touches ? evt.touches[0].pageY : evt.pageY;
        startY = y;
        dragState = 'begin';
      } else {
        dragState = 'scroll';
      }
    }

    function onTouchMove(evt) {
      if (dragState === 'scroll') {
        return;
      }
      var y = evt.touches ? evt.touches[0].pageY : evt.pageY;
      var dragDist = y - startY;
      if (dragState === 'begin') {
        evt.stopPropagation();
        if (options.wrap.scrollTop === 0 && dragDist > 0) {
          dragState = 'peek';
          options.onHeaderStateChange(dragState, options);
        } else {
          dragState = 'scroll';
        }
      }
      if (dragState !== 'scroll') {
        evt.preventDefault();
        evt.stopPropagation();
      }
      if (['peek', 'ready'].indexOf(dragState) !== -1) {
        dragDist = Math.max((dragDist - 20) / 2, 0);
        if (dragDist > options.header.offsetHeight) {
          dragDist -= (dragDist - options.header.offsetHeight) * 0.6;
          if (dragState !== 'ready') {
            dragState = 'ready';
            options.onHeaderStateChange(dragState, options);
          }
        } else {
          if (dragState !== 'peek') {
            dragState = 'peek';
            options.onHeaderStateChange(dragState, options);
          }
        }
        dragDist = Math.floor(dragDist);
        var translate = 'translateY(' + dragDist + 'px)';
        assign(options.header.style, {
          transition: '',
          webkitTransition: '',
          transform: translate,
          webkitTransform: translate,
          top: -options.header.offsetHeight + 'px',
        });
        assign(options.content.style, {
          transition: '',
          webkitTransition: '',
          transform: translate,
          webkitTransform: translate,
        });
      }
    }

    function onTouchEnd() {
      if (dragState === 'loading') {
        return;
      }
      if (dragState === 'ready') {
        dragState = 'loading';
        options.onHeaderStateChange(dragState, options);
        var headerHeight = options.header.offsetHeight;
        var translate = 'translateY(' + headerHeight + 'px)';
        assign(options.header.style, {
          transition: 'transform 0.2s',
          webkitTransition: '-webkit-transform 0.2s',
          transform: translate,
          webkitTransform: translate,
          top: -headerHeight + 'px',
        });
        assign(options.content.style, {
          transition: 'transform 0.2s',
          webkitTransition: '-webkit-transform 0.2s',
          transform: translate,
          webkitTransform: translate,
        });
        var refreshInterval = setInterval(function() {
          if (loadingMore) {
            return;
          }
          clearInterval(refreshInterval);
          if (destroyed) {
            return;
          }
          options.onRefresh(function() {
            if (destroyed) {
              return;
            }
            noMore = false;
            dragState = null;
            onTouchEnd();
          });
        }, 300);
      } else {
        assign(options.header.style, {
          transition: 'transform 0.2s',
          webkitTransition: '-webkit-transform 0.2s',
          transform: 'translateY(0px)',
          webkitTransform: 'translateY(0px)',
        });
        assign(options.content.style, {
          transition: 'transform 0.2s',
          webkitTransition: '-webkit-transform 0.2s',
          transform: 'translateY(0px)',
          webkitTransform: 'translateY(0px)',
        });
        options.onHeaderStateChange('peek', options);
        dragState = null;
        ret.update();
      }
      startY = 0;
    }

    function onScroll() {
      if (typeof options.onLoadMore !== 'function' || noMore || loadingMore) {
        return;
      }
      if (options.wrap.scrollTop + options.wrap.offsetHeight * 2 > options.wrap.scrollHeight) {
        loadingMore = true;
        assign(options.footer.style, {
          display: '',
        });
        options.onLoadMore(function(canLoadNoMore) {
          if (destroyed) {
            return;
          }
          assign(options.footer.style, {
            display: 'none',
          });
          loadingMore = false;
          if (canLoadNoMore) {
            noMore = true;
          }
          ret.update();
        });
      }
    }

    var ret = {};

    ret.update = function() {
      if (destroyed) {
        return;
      }
      assign(options.wrap.style, {
        height: (window.innerHeight - options.wrap.offsetTop - options.heightDiff) + 'px',
      });
      assign(options.header.style, {
        top: -options.header.offsetHeight + 'px',
      });
      onScroll();
    };

    ret.destroy = function() {
      if (destroyed) {
        return;
      }
      dragState = null;
      loadingMore = false;
      destroyed = true;
      window.removeEventListener('resize', onResize);
      options.wrap.removeEventListener('touchstart', onTouchStart, true);
      options.wrap.removeEventListener('mousedown', onTouchStart, true);
      options.wrap.removeEventListener('touchmove', onTouchMove, true);
      options.wrap.removeEventListener('mousemove', onTouchMove, true);
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
      window.addEventListener('mouseup', onTouchEnd);
      options.wrap.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('resize', onResize);
    options.wrap.addEventListener('touchstart', onTouchStart, true);
    options.wrap.addEventListener('mousedown', onTouchStart, true);
    options.wrap.addEventListener('touchmove', onTouchMove, true);
    options.wrap.addEventListener('mousemove', onTouchMove, true);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('mouseup', onTouchEnd);
    options.wrap.addEventListener('scroll', onScroll);
    assign(options.wrap.footer, {
      display: 'none',
    });
    ret.update();
    return ret;
  };

  WebScrollToLoad.createReactComponent = function(React, options) {
    options = assign({
      headerComponent: function() {
         return React.createElement('div', { className: 'web-scroll-to-load-header-default' });
      },
      footerComponent: function() {
         return React.createElement('div', { className: 'web-scroll-to-load-footer-default' });
      },
      wrapperClassName: 'web-scroll-to-load-wrap-default',
    }, options);

    return React.createClass({
      componentWillMount: function() {
        this.state = {
          headerState: 'peek',
        };
      },
      componentDidMount: function() {
        this.inst = WebScrollToLoad({
          wrap: this.refs.wrap,
          content: this.refs.content,
          header: this.refs.header,
          footer: this.refs.footer,
          onRefresh: this.props.onRefresh,
          onLoadMore: this.props.onLoadMore,
          onHeaderStateChange: this.onHeaderStateChange,
        });
      },
      componentDidUpdate: function() {
        this.inst.update();
      },
      componentWillUnmount: function() {
        this.inst.destroy();
      },
      onHeaderStateChange: function(state) {
        this.setState({ headerState: state });
      },
      render: function() {
        return React.createElement(
          'div',
          {
            ref: 'wrap',
            className: options.wrapperClassName,
          },
          React.createElement(
            'div',
            {
              ref: 'header',
            },
            React.createElement(options.headerComponent, { headerState: this.state.headerState })
          ),
          React.createElement(
            'div',
            {
              ref: 'content',
            },
            this.props.children
          ),
          React.createElement(
            'div',
            {
              ref: 'footer',
            },
            React.createElement(options.footerComponent)
          )
        );
      },
    });
  };

  return WebScrollToLoad;
});
