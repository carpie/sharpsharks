/**
 *  Sharp Sharks!  A fun race-the-shark basic math game.
 *  Copyright (C) 2012  Lee Carpenter
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*jslint browser:true */
/*global jQuery */

(function ($) {
    "use strict";
    var settings,
        racer,
        racers,
        problemSet;

    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    // Attempt to load from localStorage if available
    if (typeof localStorage !== 'undefined') {
        settings = localStorage.getItem('sharksSettings');
        if (settings) {
            settings = JSON.parse(settings);
        }
    }
    settings = settings || {
        fotTime: 30.0,
        d1Low: 0,
        d1High: 10,
        d2Low: 0,
        d2High: 10,
        op: '+'
    };


    racer = {
        $el: null,
        pos: 0,
        speed: 1.0,
        startTime: 0,
        numAnswered: 0,
        reset: function () {
            this.pos = 0;
            this.speed = 0.0;
            this.startTime = 0;
            this.numAnswered = 0;
            this.lastNumAnswered = 0;
            this.$el.css('left', 0);
        }
    };

    racers = {
        fot: Object.create(racer),
        you: Object.create(racer),
        courseWidth: 740,
        steps: 10,
        frameRate: 20,
        raceOver: false,
        update: function () {
            var stepsThisFrame;

            racers.you.speed = racers.you.numAnswered /
                ((new Date().getTime() - racers.you.startTime) / 1000);
            stepsThisFrame = this.you.speed / this.frameRate;
            this.you.pos = this.you.numAnswered *
                (this.courseWidth / this.steps);
            if (this.you.pos >= this.courseWidth) {
                this.you.pos = this.courseWidth;
                this.raceOver = true;
                this.fot.$el.stop();
            }
            if (this.you.numAnswered !== this.you.lastNumAnswered) {
                this.you.$el.stop().animate({left: this.you.pos}, 750);
            }
            this.you.lastNumAnswered = this.you.numAnswered;
        }
    };
    racers.fot.$el = $('#fot');
    racers.you.$el = $('#you');

    problemSet = {
        a1: [],
        a2: [],
        index: 0,

        generateProblemSet: function () {
            var range1 = settings.d1High - settings.d1Low,
                range2 = settings.d2High - settings.d2Low,
                i;
            this.a1 = [];
            this.a2 = [];
            this.index = -1;
            for (i = 0; i < 10; i += 1) {
                this.a1.push(Math.floor(Math.random() * (range1 + 1)) +
                    settings.d1Low);
                this.a2.push(Math.floor(Math.random() * (range2 + 1)) +
                    settings.d2Low);
            }
        },

        showNextProblem: function () {
            this.index += 1;
            if (this.index < this.a1.length) {
                $('#a1').text(this.a1[this.index]);
                $('#op').text(settings.op);
                $('#a2').text(this.a2[this.index]);
                $('#solution').val('').focus();
            }
        },

        checkAnswer: function () {
            var answer,
                userAnswer = parseInt($('#solution').val(), 10);
            if (settings.op === '+') {
                answer = parseInt($('#a1').text(), 10) +
                    parseInt($('#a2').text(), 10);
            } else {
                answer = parseInt($('#a1').text(), 10) -
                    parseInt($('#a2').text(), 10);
            }

            if (userAnswer === answer) {
                $('#problemarea').removeClass('incorrect').addClass('correct');
                return true;
            }
            $('#problemarea').removeClass('correct').addClass('incorrect');
            return false;
        },

        clearSolution: function () {
            $('#solution').val('').focus();
        }
    };


    // Start button handler
    $('#startBtn').bind('click', function () {
        $('#startmsg').hide('fast', function () {
            var interval;
            $('#exercise').show('fast', function () {
                problemSet.generateProblemSet();
                problemSet.showNextProblem();
                racers.raceOver = false;
                racers.fot.reset();
                racers.you.reset();
                racers.fot.speed = 10.0 / settings.fotTime;

                racers.fot.$el.stop().animate({left: racers.courseWidth},
                    settings.fotTime * 1000, 'linear', function () {
                        racers.raceOver = true;
                        racers.fot.pos = racers.courseWidth;
                    });

                racers.you.startTime = new Date().getTime();
                interval = setInterval(function () {
                    if (racers.raceOver) {
                        clearInterval(interval);
                        if (racers.fot.pos > racers.you.pos) {
                            setTimeout(function () {
                                $('#exercise').hide('fast', function () {
                                    $('#fotwin').show('fast', function () {
                                        $('#problemarea')
                                            .removeClass('correct')
                                            .addClass('incorrect');
                                    });
                                });
                            }, 500);
                        } else {
                            setTimeout(function () {
                                $('#exercise').hide('fast', function () {
                                    $('#youwin').show('fast', function () {
                                        $('#problemarea')
                                            .removeClass('incorrect')
                                            .addClass('correct');
                                    });
                                });
                            }, 500);
                        }
                    } else {
                        racers.update();
                    }
                }, 50);
            });
        });
    });

    // Capture enter key
    $("#solution").keyup(function (event) {
        if (event.keyCode === 13) {
            if (problemSet.checkAnswer()) {
                racers.you.numAnswered += 1;
                problemSet.showNextProblem();
            } else {
                problemSet.clearSolution();
            }
        }
    });

    // Play again handler
    $('#fotwin,#youwin').find('button').bind('click', function () {
        $('#fotwin,#youwin').hide('fast', function () {
            $('#startmsg').show('fast', function () {
                $('#problemarea').removeClass('correct')
                    .removeClass('incorrect');
            });
            racers.fot.reset();
            racers.you.reset();
        });
    });



    // Dialog handling
    function showDlg($dlg, onOk, onCancel) {
        var $mask = $('<div class="dialogMask"></div>').appendTo('body'),
            width,
            height,
            dlgWidth,
            dlgHeight;
        width = $(window).width();
        height = $(window).height();
        $mask.css({width: width, height: height}).fadeIn('fast');
        $mask.bind('click', function () {
            $dlg.fadeOut('fast', function () {
                $dlg.appendTo($('#dialogs'));
            });
            $mask.fadeOut('fast', function () {
                $mask.remove();
            });
        });
        dlgWidth = $dlg.width();
        dlgHeight = $dlg.height();
        $dlg.css({top: (height - dlgHeight) / 2,
            left: (width - dlgWidth) / 2});
        $dlg.appendTo('body').fadeIn('fast');

        $dlg.find('.okBtn').unbind('click').bind('click', function () {
            if (typeof onOk === 'function') {
                if (onOk.call(this)) {
                    $mask.trigger('click');
                }
            } else {
                $mask.trigger('click');
            }
        });
        $dlg.find('.cancelBtn').unbind('click').bind('click', function () {
            if (typeof onCancel === 'function') {
                if (onCancel.call(this)) {
                    $mask.trigger('click');
                }
            } else {
                $mask.trigger('click');
            }
        });
    }

    $('#settingsBtn').bind('click', function () {
        function onOk() {
            settings.fotTime = parseFloat($('input[name=fottime]').val());
            settings.d1Low = parseInt($('input[name=d1low]').val(), 10);
            settings.d1High = parseInt($('input[name=d1high]').val(), 10);
            settings.d2Low = parseInt($('input[name=d2low]').val(), 10);
            settings.d2High = parseInt($('input[name=d2high]').val(), 10);
            settings.op = $('#addBtn').is(':checked') ? '+' : '-';
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sharksSettings',
                    JSON.stringify(settings));
            }
            return true;
        }

        $('input[name=fottime]').val(settings.fotTime);
        $('input[name=d1low]').val(settings.d1Low);
        $('input[name=d1high]').val(settings.d1High);
        $('input[name=d2low]').val(settings.d2Low);
        $('input[name=d2high]').val(settings.d2High);
        if (settings.op === '-') {
            $('#subBtn').attr('checked', 'checked');
        } else {
            $('#addBtn').attr('checked', 'checked');
        }
        showDlg($('#settingsDlg'), onOk);
    });


    $('#aboutBtn').bind('click', function () {
        showDlg($('#aboutDlg'));
    });

}(jQuery));
