/*
 * Add gesture support for mobile devices.
 */

window.Mobile = {};

Mobile.hasTouch = function() {
    return document.documentElement &&
        document.documentElement.hasOwnProperty('ontouchstart');
};

Mobile.enable = function (force) {
    if (force || Mobile.hasTouch() && !Mobile._instance) {
        Mobile._instance = new Mobile.GestureHandler();
        Mobile._instance.bindEvents();
        Mobile._instance.bootstrap();
    }
    return Mobile._instance;
};

window.Mobile.GestureHandler = function () {
    this.initialize.apply(this, arguments);
};

Mobile.log = function (message) {
    var h1;
    h1 = document.getElementsByTagName('h1')[0];
    h1.innerHTML = "" + Math.random().toString().substring(4, 1) + "-" + message;
};

Mobile.debugDot = function (event) {
    var dot, body, style

    style = 'border-radius: 50px;' +
        'width: 5px;' +
        'height: 5px;' +
        'background: red;' +
        'position: absolute;' +
        'left: ' + event.touches[0].clientX + 'px;' +
        'top: ' + event.touches[0].clientY + 'px;';
    dot = document.createElement('div');
    dot.setAttribute('style', style);
    console.log(style);
    body = document.getElementsByTagName('body')[0];
    body.appendChild(dot);
};

(function (proto) {
    'use strict';

    // Minimum range to begin looking at the swipe direction, in pixels
    var SWIPE_THRESHOLD = 10;
    // Distance in pixels required to complete a swipe gesture.
    var SWIPE_DISTANCE = 50;
    // Time in milliseconds to complete the gesture.
    var SWIPE_TIMEOUT = 1000;

    // Lookup table mapping action to keyCode.
    var CODE = {
        action: 88, // x
        left:   37, // left arrow
        right:  39, // right arrow
        up:     38, // up arrow
        down:   40, // down arrow
        undo:   85, // u
        reset:  82, // r
        quit:   27, // escape
    }

    var TAB_STRING = [
        '<div class="tab">',
        '  <div class="tab-affordance"></div>',
        '  <div class="tab-icon">',
        '    <div class="slice"></div>',
        '    <div class="slice"></div>',
        '  </div>',
        '</div>',
    ].join("\n");

    // Template for the menu.
    var MENU_STRING = [
        '<div class="mobile-menu">',
        '  <div class="close-affordance"></div>',
        '  <div class="close">',
        '    <div class="slice"></div>',
        '    <div class="slice"></div>',
        '  </div>',
        '  <div class="undo button">Undo</div>',
        '  <div class="reset button">Reset</div>',
        '  <div class="quit button">Quit to Menu</div>',
        '  <div class="clear"></div>',
        '</div>'
    ].join("\n");

    /** Bootstrap Methods **/

    proto.initialize = function () {
        this.firstPos = { x: 0, y: 0 };
        this.setTabAnimationRatio = this.setTabAnimationRatio.bind(this);
        this.setMenuAnimationRatio = this.setMenuAnimationRatio.bind(this);
    };

    proto.bindEvents = function () {
        window.addEventListener('touchstart', this.onTouchStart.bind(this));
        window.addEventListener('touchend', this.onTouchEnd.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
    };

    proto.bootstrap = function () {
        this.showTab();
        this.disableAudio();
    };

    /** Event Handlers **/

    proto.onTouchStart = function (event) {
        if (this.isTouching) {
            return;
        }

        this.isTouching = true;

        this.mayBeSwiping = true;
        this.gestured = false;

        this.swipeDirection = undefined;
        this.swipeDistance = 0;
        this.startTime = new Date().getTime();

        this.firstPos.x = event.touches[0].clientX;
        this.firstPos.y = event.touches[0].clientY;
    };

    proto.onTouchEnd = function (event) {
        if (!this.isTouching) {
            // If we're here, the menu event handlers had probably
            // canceled the touchstart event.
            return;
        }
        if (!this.gestured) {
            if (event.touches.length === 0) {
                this.handleTap();
            }
        }

        // The last finger to be removed from the screen lets us know
        // we aren't tracking anything.
        if (event.touches.length === 0) {
            this.isTouching = false;
        }
    };

    proto.onTouchMove = function (event) {
        if (this.isSuccessfulSwipe()) {
            this.handleSwipe(this.swipeDirection, this.touchCount);
            this.gestured = true;
            this.mayBeSwiping = false;
        } else if (this.mayBeSwiping) {
            this.swipeStep(event);
        }

        event.preventDefault();
    };

    /** Detection Helper Methods **/

    proto.isSuccessfulSwipe = function () {
        var isSuccessful;

        if (this.mayBeSwiping &&
            this.swipeDirection !== undefined &&
            this.swipeDistance >= SWIPE_DISTANCE) {
            isSuccessful = true;
        }

        return isSuccessful;
    };

    // Examine the current state to see what direction they're swiping and
    // if the gesture can still be considered a swipe.
    proto.swipeStep = function (event) {
        var currentPos, distance, currentTime;
        var touchCount;

        if (!this.mayBeSwiping) {
            return;
        }

        currentPos = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        currentTime = new Date().getTime();
        touchCount = event.touches.length;

        this.swipeDistance = this.cardinalDistance(this.firstPos, currentPos);
        if (!this.swipeDirection) {
            if (this.swipeDistance > SWIPE_THRESHOLD) {
                // We've swiped far enough to decide what direction we're swiping in.
                this.swipeDirection = this.dominantDirection(this.firstPos, currentPos);
                this.touchCount = touchCount;
            }
        } else if (distance < SWIPE_DISTANCE) {
            // Now that they've committed to the swipe, look for misfires...

            direction = this.dominantDirection(this.firstPos, currentPos);
            // Cancel the swipe if the direction changes.
            if (direction !== this.swipeDirection) {
                this.mayBeSwiping = false;
            }
            // If they're changing touch count at this point, it's a misfire.
            if (touchCount < this.touchCount) {
                this.mayBeSwiping = false;
            }
        } else if (currentTime - this.startTime > SWIPE_TIMEOUT) {
            // Cancel the swipe if they took too long to finish.
            this.mayBeSwiping = false;
        }
    };

    // Find the distance traveled by the swipe along compass directions.
    proto.cardinalDistance = function (firstPos, currentPos) {
        var xDist, yDist;

        xDist = Math.abs(firstPos.x - currentPos.x);
        yDist = Math.abs(firstPos.y - currentPos.y);

        return Math.max(xDist, yDist);
    };

    // Decide which direction the touch has moved farthest.
    proto.dominantDirection = function (firstPos, currentPos) {
        var dx, dy;
        var dominantAxis, dominantDirection;

        dx = currentPos.x - firstPos.x;
        dy = currentPos.y - firstPos.y;

        dominantAxis = 'x';
        if (Math.abs(dy) > Math.abs(dx)) {
            dominantAxis = 'y';
        }

        if (dominantAxis === 'x') {
            if (dx > 0) {
                dominantDirection = 'right';
            } else {
                dominantDirection = 'left';
            }
        } else {
            if (dy > 0) {
                dominantDirection = 'down';
            } else {
                dominantDirection = 'up';
            }
        }

        return dominantDirection;
    };

    /** Action Methods **/

    // Method to be called when we've detected a swipe and some action
    // is called for.
    proto.handleSwipe = function (direction, touchCount) {
        if (touchCount === 1) {
            this.emitKeydown(this.swipeDirection);
        } else if (touchCount > 1) {
            // Since this was a multitouch gesture, open the menu.
            this.toggleMenu();
        }
    };

    proto.handleTap = function () {
        this.emitKeydown('action');
    };

    // Fake out keypresses to acheive the desired effect.
    proto.emitKeydown = function (input) {
        var event;

        event = { keyCode: CODE[input] };

        this.fakeCanvasFocus();
        // Press, then release key.
        onKeyDown(event);
        onKeyUp(event);
    };

    proto.fakeCanvasFocus = function () {
        var canvas;

        canvas = document.getElementById('gameCanvas');
        onMouseDown({
            button: 0,
            target: canvas
        });
    };

    proto.toggleMenu = function () {
        if (this.isMenuVisible) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    };

    proto.showMenu = function () {
        if (!this.menuElem) {
            this.buildMenu();
        }
        this.getAnimatables().menu.animateUp();
        this.isMenuVisible = true;
        this.hideTab();
    };

    proto.hideMenu = function () {
        if (this.menuElem) {
            this.getAnimatables().menu.animateDown();
        }
        this.isMenuVisible = false;
        this.showTab();
    };

    proto.getAnimatables = function () {
        var self = this;
        if (!this._animatables) {
            this._animatables = {
                tab: Animatable('tab', 0.1, self.setTabAnimationRatio),
                menu: Animatable('menu', 0.1, self.setMenuAnimationRatio)
            }
        }
        return this._animatables;
    };

    proto.showTab = function () {
        if (!this.tabElem) {
            this.buildTab();
        }
        this.getAnimatables().tab.animateDown();
    };

    proto.hideTab = function () {
        if (this.tabElem) {
            this.tabElem.setAttribute('style', 'display: none;');
        }
        this.getAnimatables().tab.animateUp();
    };

    proto.buildTab = function () {
        var self = this;
        var tempElem, body;
        var openCallback;
        var tabElem;
        var assemblyElem;

        tempElem = document.createElement('div');
        tempElem.innerHTML = TAB_STRING;
        assemblyElem = tempElem.children[0];

        openCallback = function (event) {
            event.stopPropagation();
            self.showMenu();
        };
        this.tabAffordance = assemblyElem.getElementsByClassName('tab-affordance')[0];
        this.tabElem = assemblyElem.getElementsByClassName('tab-icon')[0];

        this.tabAffordance.addEventListener('touchstart', openCallback);
        this.tabElem.addEventListener('touchstart', openCallback);

        body = document.getElementsByTagName('body')[0];
        body.appendChild(assemblyElem);
    };

    proto.buildMenu = function () {
        var self = this;
        var tempElem, body;
        var undo, reset, quit;
        var closeTab;
        var closeCallback;

        tempElem = document.createElement('div');
        tempElem.innerHTML = MENU_STRING;
        this.menuElem = tempElem.children[0];
        this.closeElem = this.menuElem.getElementsByClassName('close')[0];

        closeCallback = function (event) {
            event.stopPropagation();
            self.hideMenu();
        };
        this.closeAffordance = this.menuElem.getElementsByClassName('close-affordance')[0];
        closeTab = this.menuElem.getElementsByClassName('close')[0];
        this.closeAffordance.addEventListener('touchstart', closeCallback);
        closeTab.addEventListener('touchstart', closeCallback);

        undo = this.menuElem.getElementsByClassName('undo')[0];
        undo.addEventListener('touchstart', function (event) {
            event.stopPropagation();
            self.emitKeydown('undo');
        });
        reset = this.menuElem.getElementsByClassName('reset')[0];
        reset.addEventListener('touchstart', function (event) {
            event.stopPropagation();
            self.emitKeydown('reset');
        });

        quit = this.menuElem.getElementsByClassName('quit')[0];
        quit.addEventListener('touchstart', function (event) {
            event.stopPropagation();
            self.emitKeydown('quit');
        });

        body = document.getElementsByTagName('body')[0];
        body.appendChild(this.menuElem);
    };

    proto.setTabAnimationRatio = function (ratio) {
        var LEFT = 18;
        var RIGHT = 48 + 18;
        var size, opacityString;
        var style;

        // Round away any exponents that might appear.
        ratio = Math.round((ratio) * 1000) / 1000;
        if (ratio >= 0.999) {
            this.tabAffordance.setAttribute('style', 'display: none;');
        } else {
            this.tabAffordance.setAttribute('style', 'display: block;');
        }
        size = RIGHT * ratio + LEFT * (1 - ratio);
        opacityString = 'opacity: ' + (1 - ratio) + ';';
        style = opacityString + ' ' +
            'width: ' + size + 'px;';
        this.tabElem.setAttribute('style', style);
    };

    proto.setMenuAnimationRatio = function (ratio) {
        var LEFT = -48 - 18;
        var RIGHT = -18;
        var size, opacityString;
        var style;

        // Round away any exponents that might appear.
        ratio = Math.round((ratio) * 1000) / 1000;
        if (ratio <= 0.001) {
            this.closeAffordance.setAttribute('style', 'display: none;');
        } else {
            this.closeAffordance.setAttribute('style', 'display: block;');
        }
        size = RIGHT * ratio + LEFT * (1 - ratio);
        opacityString = 'opacity: ' + ratio + ';';
        style = 'left: ' + (size - 4) + 'px; ' +
            opacityString + ' ' +
            'width: ' + (-size) + 'px;';
        this.closeElem.setAttribute('style', style);

        this.menuElem.setAttribute('style', opacityString);
    };

    /** Audio Methods **/

    proto.disableAudio = function () {
        // Overwrite the playseed function to disable it.
        window.playSeed = function () {};
    };
}(window.Mobile.GestureHandler.prototype));

window.Animator = function () {
    this.initialize.apply(this, arguments);
};

(function (proto) {
    proto.initialize = function () {
        this._animations = {};
        this.tick = this.tick.bind(this);
    };

    proto.animate = function (key, tick) {
        this._animations[key] = tick;
        this.wakeup();
    };

    proto.wakeup = function () {
        if (this._isAnimating) {
            return;
        }
        this._isAnimating = true;
        this.tick();
    };

    proto.tick = function () {
        var key;
        var isFinished, allFinished;
        var toRemove, index;

        toRemove = [];
        allFinished = true;
        for (key in this._animations) {
            if (!this._animations.hasOwnProperty(key)) {
                return;
            }
            isFinished = this._animations[key]();
            if (!isFinished) {
                allFinished = false;
            } else {
                toRemove.push(key);
            }
        }

        if (!allFinished) {
            requestAnimationFrame(this.tick);
        } else {
            for (index = 0; index < toRemove.length; toRemove++) {
                delete this._isAnimating[toRemove[index]];
            }
            this._isAnimating = false;
        }
    };

}(window.Animator.prototype));

window.Animator.getInstance = function () {
    if (!window.Animator._instance) {
        window.Animator._instance = new window.Animator();
    }
    return window.Animator._instance;
};

function Animatable(key, increment, update) {
    var ratio;
    var handles;

    handles = {
        animateUp: function () {
            Animator.getInstance().animate(key, tickUp);
        },
        animateDown: function () {
            Animator.getInstance().animate(key, tickDown);
        }
    };

    ratio = 0;

    function tickUp () {
        var isFinished;
        ratio += increment;
        if (ratio >= 1.0) {
            isFinished = true;
            ratio = 1;
        }
        update(ratio);
        return isFinished;
    };

    function tickDown () {
        var isFinished;
        ratio -= increment;
        if (ratio <= 0.0) {
            isFinished = true;
            ratio = 0;
        }
        update(ratio);
        return isFinished;
    };

    return handles;
};


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    'use strict';

    var VENDORS = ['ms', 'moz', 'webkit', 'o'];
    var index, lastTime;

    for (index = 0; index < VENDORS.length && !window.requestAnimationFrame; index++) {
        window.requestAnimationFrame = window[VENDORS[index] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[VENDORS[index] + 'CancelAnimationFrame'];
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = window[VENDORS[index] + 'CancelRequestAnimationFrame'];
        }
    }

    if (!window.requestAnimationFrame) {
        lastTime = 0;
        window.requestAnimationFrame = function(callback, element) {
            var currTime, timeToCall, id;

            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;

            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
