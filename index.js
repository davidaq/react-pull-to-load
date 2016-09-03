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
      '.web-scroll-to-load-content {',
      '}',
    ].join('');
    document.querySelector('head').appendChild(dom);
  }

  function getDom(obj, key) {
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


  var defaultOptions = {
    heightDiff: 0,
    onHeaderStateChange: function() {},
  };
  function WebScrollToLoad(options) {
    options = assign({}, defaultOptions, options);

    injectCSS();

    getDom(options, 'wrap');
    getDom(options, 'header');
    getDom(options, 'footer');
    getDom(options, 'content');

    function onResize() {
      ret.update();
    }

    var destroyed = false;
    var loadingMore = false, noMore = typeof options.onLoadMore !== 'function';
    var startY = 0, dragState = null;
    function onTouchStart(evt) {
      if (!dragState) {
        var y = evt.touches ? evt.touches[0].pageY : evt.pageY;
        startY = y;
        dragState = 'begin';
      }
    }

    function onTouchMove(evt) {
      if (dragState === 'scroll') {
        return;
      }
      evt.preventDefault();
      evt.stopPropagation();
      var y = evt.touches ? evt.touches[0].pageY : evt.pageY;
      var dragDist = y - startY;
      if (dragState === 'begin') {
        if (Math.abs(dragDist) > 20) {
          if (options.wrap.scrollTop === 0 && dragDist > 0) {
            dragState = 'peek';
            options.onHeaderStateChange(dragState);
            assign(options.wrap.style, {
              transform: 'translateY(0px)',
              webkitTransform: 'translateY(0px)',
            });
          } else {
            dragState = 'scroll';
          }
        }
      }
      if (['peek', 'ready'].indexOf(dragState) !== -1) {
        dragDist = Math.max((dragDist - 20) / 2, 0);
        if (dragDist > options.header.offsetHeight) {
          dragDist -= (dragDist - options.header.offsetHeight) * 0.6;
          if (dragState !== 'ready') {
            dragState = 'ready';
            options.onHeaderStateChange(dragState);
          }
        } else {
          if (dragState !== 'peek') {
            dragState = 'peek';
            options.onHeaderStateChange(dragState);
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
        options.onHeaderStateChange(dragState);
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
        setTimeout(function() {
          if (destroyed) {
            return;
          }
          options.onRefresh(function() {
            if (destroyed) {
              return;
            }
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
        dragState = null;
        ret.update();
      }
      startY = 0;
    }

    function onScroll() {
      if (noMore || loadingMore) {
        return;
      }
      if (options.wrap.scrollTop + options.wrap.offsetHeight * 2 > options.wrap.scrollHeight) {
        loadingMore = true;
        assign(options.footer.style, {
          display: '',
        });
        options.onLoadMore(function(canLoadNoMore) {
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
        height: (window.innerHeight - options.heightDiff) + 'px',
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

  var defaultReactComponentOptions = {
    headerComponent: 'div',
    footerComponent: 'div',
    bodyComponent: 'div',
    wrapComponent: 'div',
  };
  WebScrollToLoad.createReactComponent = function(React, options) {
    options = assign({}, defaultReactComponentOptions, options);

    return React.createComponent({
      componentDidMount() {
        this.inst = WebScrollToLoad({
          wrap: this.refs.wrap,
          body: this.refs.body,
          header: this.refs.header,
          footer: this.refs.footer,
          onRefresh: this.props.onRefresh,
          onLoadMore: this.props.onLoadMore,
        });
      },
      componentDidUpdate() {
        this.inst.update();
      },
      componentWillUnmount() {
        this.inst.destroy();
      },
      render: function() {
        return React.createElement(
          options.wrapComponent,
          {
            ref: 'wrap',
          },
          React.createElement(
            options.headerComponent,
            {
              ref: 'header',
            }
          ),
          React.createElement(
            options.bodyComponent,
            {
              ref: 'body',
            },
            this.props.children
          ),
          React.createElement(
            options.footerComponent,
            {
              ref: 'footer',
            }
          )
        );
      },
    });
  };

  return WebScrollToLoad;
});
