var Ditherer = /** @class */ (function () {
    function Ditherer(k) {
        this.k = k;
        this.errors = [];
        for (var i = 0; i < k; i++) {
            this.errors.push(0);
        }
    }
    Ditherer.prototype.process = function (current) {
        // TODO: assert
        if (current.length != this.k) {
            throw new Error();
        }
        var max = -Infinity;
        var argmax = 0;
        var sum = 0;
        for (var i = 0; i < this.k; i++) {
            this.errors[i] += current[i];
            sum += current[i];
            if (this.errors[i] > max) {
                max = this.errors[i];
                argmax = i;
            }
        }
        this.errors[argmax] -= sum;
        return argmax;
    };
    return Ditherer;
}());
var colors = ["A", "B", "C", "D"];
var GradientEditor = /** @class */ (function () {
    function GradientEditor() {
        var _this = this;
        this.stops = [];
        this.gradientStopList = document.getElementById("gradient-stops");
        this.gradientStopTemplate = document.getElementById("template-gradient-stop");
        this.colorValueInputTemplate = document.getElementById("template-edit-color-value");
        this.nextGradientStop = document.querySelector("#next-gradient-stop");
        this.output = document.querySelector('textarea');
        console.log(this.output);
        var input_index = document.querySelector(".input-index");
        input_index.value = "1";
        input_index.disabled = true;
        var colorInputs = document.querySelector('.input-colors');
        for (var _i = 0, colors_1 = colors; _i < colors_1.length; _i++) {
            var color = colors_1[_i];
            var colorInput = this.colorValueInputTemplate.content.cloneNode(true);
            colorInput.querySelector('input').addEventListener('input', function (_e) { return _this.checkValidity(); });
            console.log(colorInput);
            colorInput.querySelector(".color-name").innerHTML = color;
            colorInputs.appendChild(colorInput);
        }
        //this.nextGradientStop.querySelector("div").appendChild(cloned);
        this.nextGradientStop.querySelector(".input-submit").addEventListener("click", function (_e) { return _this.addStop(); });
        document.querySelector('#generate').addEventListener('click', function (_e) { return _this.generateGradient(); });
        document.querySelector('#copy').addEventListener('click', function (e) { return _this.copyClipboard(); });
        document.querySelector('#save').addEventListener('click', function (e) { return _this.saveFile(); });
    }
    GradientEditor.prototype.updateStopView = function () {
        var _this = this;
        this.gradientStopList.innerHTML = "";
        var _loop_1 = function (k) {
            var stop_1 = this_1.stops[k];
            var cloned = this_1.gradientStopTemplate.content.cloneNode(true);
            var desc = stop_1[1].map(function (x, i) { return x + "% " + colors[i]; }).join(', ');
            cloned.querySelector('.content').appendChild(document.createTextNode("#" + stop_1[0] + ": " + desc));
            cloned.querySelector('.delete').addEventListener('click', function (_e) {
                _this.stops.splice(k, 1);
                _this.updateStopView();
            });
            this_1.gradientStopList.appendChild(cloned);
        };
        var this_1 = this;
        for (var k = this.stops.length - 1; k >= 0; k--) {
            _loop_1(k);
        }
    };
    GradientEditor.prototype.checkValidity = function (report) {
        if (report === void 0) { report = false; }
        var valid = true;
        var inputs = [].slice.call(this.nextGradientStop.querySelectorAll("input"));
        inputs = inputs.filter(function (x) { return x.type == 'number'; });
        if (report) {
            inputs[0].reportValidity();
        }
        if (!inputs[0].checkValidity()) {
            valid = false;
        }
        var colors = inputs.slice(1).map(function (x) { return +x.value; });
        var sum = colors.reduce(function (x, a) { return a + x; }, 0);
        if (sum != 100) {
            console.log('validity check failed:');
            console.log(colors);
            console.log(sum);
        }
        for (var _i = 0, _a = inputs.slice(1); _i < _a.length; _i++) {
            var input = _a[_i];
            if (sum != 100) {
                input.setCustomValidity("Summe der Farbanteile muss 100% sein!");
            }
            else {
                input.setCustomValidity("");
            }
            if (report) {
                input.reportValidity();
            }
        }
        if (sum != 100) {
            valid = false;
        }
        return valid;
    };
    GradientEditor.prototype.addStop = function () {
        if (!this.checkValidity(true)) {
            return false;
        }
        var inputs = [].slice.call(this.nextGradientStop.querySelectorAll("input"));
        inputs = inputs.filter(function (x) { return x.type == 'number'; });
        var index = +inputs[0].value;
        var colors = inputs.slice(1).map(function (x) { return +x.value; });
        var update = false;
        for (var _i = 0, _a = this.stops; _i < _a.length; _i++) {
            var stop_2 = _a[_i];
            if (stop_2[0] == index) {
                update = true;
                stop_2[1] = colors;
                break;
            }
        }
        if (!update) {
            this.stops.push([index, colors]);
            this.stops.sort(function (a, b) { return a[0] - b[0]; });
        }
        this.updateStopView();
        this.nextGradientStop.reset();
        for (var _b = 0, inputs_1 = inputs; _b < inputs_1.length; _b++) {
            var input = inputs_1[_b];
            input.disabled = false;
        }
    };
    GradientEditor.prototype.generateGradient = function () {
        var stops = this.stops;
        var k = stops[0][1].length;
        var ditherer = new Ditherer(colors.length);
        var result = [];
        var previousThread = stops[0][0];
        var previousColor = stops[0][1];
        result.push(ditherer.process(stops[0][1]));
        for (var i = 1; i < stops.length; i++) {
            for (var t = previousThread + 1; t <= stops[i][0]; t++) {
                var x = (t - previousThread) / (stops[i][0] - previousThread);
                var interpolated = [];
                for (var c = 0; c < k; c++) {
                    interpolated.push(previousColor[c] * (1 - x) + stops[i][1][c] * x);
                }
                result.push(ditherer.process(interpolated));
            }
            previousThread = stops[i][0];
            previousColor = stops[i][1];
        }
        var res = "";
        var prev = -1;
        var count = 0;
        for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
            var x = result_1[_i];
            if (x != prev) {
                if (prev != -1) {
                    if (count != 1) {
                        res += count + colors[prev].toLowerCase();
                    }
                    else {
                        res += colors[prev].toLowerCase();
                    }
                }
                count = 0;
            }
            prev = x;
            count++;
        }
        if (prev != -1) {
            if (count != 1) {
                res += count + colors[prev].toLowerCase();
            }
            else {
                res += colors[prev].toLowerCase();
            }
        }
        this.output.value = res;
    };
    GradientEditor.prototype.copyClipboard = function () {
        this.output.select();
        document.execCommand('copy');
    };
    GradientEditor.prototype.saveFile = function () {
        var file = new Blob([this.output.value], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        var url = URL.createObjectURL(file);
        a.href = url;
        a.download = "verlauf.txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    };
    return GradientEditor;
}());
var editor = new GradientEditor();
