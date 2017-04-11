/**
 * Created by igenchev on 1/19/2017.
 */
var n = 8;

var app = function app() {
    this.targetExpires;
    this.maxTarget = 16;
    this.target = 0;
    this.points = 0;
    this.count = 0;
    this.pressDown = false;
    this.collected = [];
    this.buttons = [];
    this.animations = ['vanishOut', 'falling', 'vanishIn'];

    this.init = function init() {
        this.createGame(this.maxTarget);
        window.onmouseup = this.onMouseUP.bind(this);
        window.onanimationend = this.animationEnd.bind(this);
        window.onanimationstart = this.chooseAnimation.bind(this);
    };

    this.createGame = function createGame(maxTarget) {
        var rowElement, cell, button,
            matrixElement = document.getElementById('table');

        maxTarget = maxTarget || Math.pow(2, n);

        this.target = Math.floor(Math.random() * maxTarget);
        this.element('target', this.target);
        this.element('points', this.points);
        this.element('current', 0);

        for (var x = 0; x < n; x++) {
            rowElement = document.createElement('TR');
            matrixElement.appendChild(rowElement);

            for (var y = 0; y < n; y++) {
                button = this.createButton(x, y);
                button.innerText = button.value;
                cell = document.createElement('TD');
                cell.appendChild(button);
                rowElement.appendChild(cell);

                this.buttons.push(button);
            }
        }

        this.resetTime();
    };

    this.createButton = function (x, y) {
        var button = document.createElement('BUTTON'),
            value = Math.floor(Math.random() * 2);

        button.setAttribute("id", x + '-' + y);
        button.setAttribute('class', 'myButton');
        button.selected = false;
        button.falling = false;
        button.fallingCount = 0;
        button.value = value;
        button.position = [x, y];
        button.onmousedown = this.onMouseDown.bind(this);
        button.onmouseover = this.onMouseOver.bind(this);
        button.activate = function () { this.classList.add('active') };
        button.unActivate = function () { this.classList.remove('active') };
        button.hide = function () { this.classList.add('hidden') };
        button.unHide = function () { this.classList.remove('hidden') };
        button.vanishIn = function () {
            this.value = Math.floor(Math.random() * 2);
            this.innerText = this.value;
            this.classList.add('vanishIn')
        };
        button.addFalling = function () {
            this.classList.add('falling')
        };
        button.vanishOut = function () {
            this.value = '';
            this.selected = true;
            this.classList.add('vanishOut');
        };

        return button;
    };

    this.onMouseDown = function (event) {
        var button = event.target;

        this.pressDown = true;
        this.collected.push(button);
        button.classList.add('active');
    };

    this.onMouseOver = function (event) {
        var number = '',
            button = event.target;

        if (this.pressDown === true){
            if (this.isCorrectOrder(button) === true){
                this.collected.push(button);
                button.activate();

                for (var i in this.collected) {
                    number += this.collected[i].value;
                }
                this.estimate(number);
            } else {
                this.onMouseUP();
            }
        }
    };

    this.onMouseUP = function () {
        var number = '';

        for (var i in this.collected) {
            this.collected[i].unActivate();
            number += this.collected[i].value;
        }
        this.pressDown = false;
        this.estimate(number);
        this.collected = [];
    };

    this.isCorrectOrder = function (button) {
        var previous = this.collected[this.collected.length - 1];

        for (var i = 0; i < this.collected.length; i++) {
            if (button === this.collected[i]){
                return false;
            }
        }
        return Math.abs(button.position[1] - previous.position[1]) +
            Math.abs(button.position[0] - previous.position[0]) === 1;
    };

    this.estimate = function (number) {
        number = parseInt(number, 2);
        var result = !isNaN(number) && number <= 1024 ? number : 0;

        this.element('current', result);

        if (result === this.target && this.pressDown === false){
            this.points += result;
            this.resetTime();
            this.element('points', this.points);
            this.removeButtons(this.collected);
        }
    };

    this.removeButtons = function (collected) {
        for (var i in collected) {
            collected[i].vanishOut();
        }
    };

    this.chooseAnimation = function (animation) {

        if (this.animations.indexOf(animation.animationName) > -1) {
            this.count++;
        }

        if (animation.animationName === this.animations[1]) {
            var button = animation.target;
            if (button.fallingCount > 1) {
                button.style.animationDuration = 0.4 * button.fallingCount + 's';
                button.style.animationName = animation.animationName + '-' + button.fallingCount;
            }
        }
    };

    this.animationEnd = function (animation) {
        var animationName = animation.animationName.slice(0, 7) === this.animations[1] ? this.animations[1] : animation.animationName;

        if (this.haveAnimation()){
            var buttons = this.getButtonsByAnimation(animationName, this.buttons);

            switch (animationName) {
                case this.animations[0]:
                    this.changeButtons(buttons, false);
                    this.slideDown(this.buttons);
                    this.moveDown(this.buttons);
                    this.animateFalling(this.buttons);
                break;
                case this.animations[1]:
                    this.changeButtons(buttons, true);
                    this.show(this.buttons);
                break;
                case this.animations[2]:
                    this.changeButtons(buttons, true);
                    this.refresh(this.buttons);                    
                break;
            }
        }
    };

    this.getButtonsByAnimation = function (animation, buttons) {
        return buttons.filter(function (button) {
            return button.classList.contains(animation) ? button : undefined;
        })
    };

    /**
     * count how level should falling the button and the upper buttons
     * and add class 'falling' to all of them
     */
    this.slideDown = function (buttons) {
        var fallingCount, upper, bottom;

        for (var i = 0; i < buttons.length; i++) {

            if (buttons[i].selected === false){
                fallingCount = 0;
                bottom = this.bottomButton(buttons[i]);
                upper = buttons[i];

                while (bottom !== undefined) {
                    if (bottom.selected === true){
                        fallingCount++;
                    }
                    bottom = this.bottomButton(bottom);
                }

                while (upper && upper.selected === false && fallingCount > 0) {
                    upper.falling = true;
                    upper.fallingCount = fallingCount;
                    upper = this.upperButton(upper);
                }
            } else if (this.isTop(buttons[i])){
                buttons[i].value = '';
            }
        }
    };
    /**
     * Change values of the falling buttons
     */
    this.moveDown = function (buttons) {
        var temp, target;

        for (var i = buttons.length - 1; i >= 0; i--) {
            if (buttons[i].fallingCount > 0) {
                target = this.bottomButton(buttons[i], buttons[i].fallingCount);

                temp = target.value;
                target.value = buttons[i].value;
                buttons[i].value = temp;
            }
        }
    };

    this.changeButtons = function (buttons, show) {
        var newButton, index, button,
            newButtons = [];

        for (var i in buttons) {
            button = buttons[i];
            newButton = this.createButton(button.position[0], button.position[1]);
            index = this.buttons.indexOf(button);

            newButton.value = button.value;
            newButton.fallingCount = button.fallingCount;
            newButton.selected = button.selected;
            button.parentNode.replaceChild(newButton, button);
            this.buttons[index] = newButton;
            if (show === true) {
                newButton.unHide();
            } else if (show === false) {
                newButton.hide();
            }
            newButtons.push(newButton);
        }
        return newButtons;
    };

    this.show = function (buttons) {
        var button,
            vanishInButtons = [];

        for (var i in buttons) {
            button = buttons[i];
            button.innerText = button.value;

            if (button.selected) {
                button.selected = false;
                button.unHide();
            }

            if (button.value === '' && this.isTop(button)) {
                vanishInButtons.push(button);
            }
        }

        for (var btn in vanishInButtons) {
            vanishInButtons[btn].vanishIn();
        }
    };

    this.refresh = function (buttons) {
        var loader = document.getElementById('loader'),
            newLoader = loader.cloneNode(true);

        loader.parentNode.replaceChild(newLoader, loader);
        this.target = Math.floor(Math.random() * this.maxTarget);
        this.element('target', this.target);

        for (var i in buttons) {
            buttons[i].innerText = buttons[i].value;
            buttons[i].fallingCount = 0;
            buttons[i].selected = false;
            buttons[i].falling = false;
            buttons[i].className = 'myButton';
        }
    };

    this.animateFalling = function (buttons) {
        var noFalling = true;

        for (var i in buttons) {
            if (buttons[i].falling){
                buttons[i].addFalling();
                noFalling = false;
            }
        }
        if (noFalling) {
            this.show(buttons);
        }
    };

    this.isTop = function (button) {
        var upper = this.upperButton(button);
        while (upper) {
            if (upper.value !== ''){
                return false;
            }
            upper = this.upperButton(upper);
        }
        return true;
    };

    /**
     * @param button
     * @param step - how up is the button by rows
     * @returns Element upper button
     */
    this.upperButton = function (button, step) {
        step = step || 1;
        if (button && button.position[0] >= step) {
            return document.getElementById(button.position[0] - step + '-' + button.position[1]);
        }
    };

    /**
     * @param button
     * @param step - how down is the button by rows
     * @returns Element bottom button
     */
    this.bottomButton = function (button, step) {
        step = step || 1;
        if (button && button.position[0] < n - step) {
            return document.getElementById(button.position[0] + step + '-' + button.position[1]);
        }
    };

    this.haveAnimation = function () {
        this.count--;
        return this.count <= 0;
    };

    this.element = function element(element, value) {
        if (value !== undefined) {
            document.getElementById(element).innerText = value;
        } else {
            return document.getElementById(element).innerText;
        }
    };

    this.resetTime = function () {
        clearInterval(this.targetExpires);
        this.targetExpires = setInterval(function () {
            this.refresh()
        }.bind(this), 15000);
    };

    this.init();
};

new app();