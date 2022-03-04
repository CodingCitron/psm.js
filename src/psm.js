(function(global, factory){
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) : 
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.psm = {}))
}(this, (function(exports){ 'use strict'

    /* 수정해야하는 부분 
        blur
        Number() <- parseInt or parseFloat로 수정
    */

    const correction = { /* interface, type, default value 설정  */
        filter: {
            brightness: {
                value: ['number', 0]
            },
            contrast: {
                value: ['number', 0]
            },
            grayscale: {

            },
            invert: {

            },
            sepia: {

            },
            binary: {
                threshold: ['number', 0.4],
            },
            saturation: {
                red: ['number', 0],
                green: ['number', 0],
                blue: ['number', 0],
                operator: ['string', '+'], //+, -, =, *, %
            },
            blur: { //블러 옵션
                radius: ['number', 1],
            },
            transparency: {
                alpha: ['number', 255],
            },
            convolute: {
                weights: ['array', [0, 0, 0, 0, 0, 0, 0, 0, 0]], 
                opaque: ['boolean', false]
            },
            sharpen: {},
            sobel: {},
            edgeDetection: {},
            gaussianBlur: {},
            embossImage: {},
            ascii: {
                density: ['string', '1234567890']
            },
            init: {}
        },
        link: ['HTMLElemnt', undefined], //element 원본을 유지한다.
    },
    
    repository = {
        imgData: undefined, //link의 imageData를 저장한다.
    },

    input = {
        filter: undefined,
        param: {}
    },

    jsInfo = {
        since: '20220217',
        version: '0.1',
        github: 'https://github.com/CodingCitron',
        reference: [
            'https://www.html5rocks.com/en/tutorials/canvas/imagefilters/',
            'https://dev-momo.tistory.com/entry/Javascript-Image-Filter-convolve',
            'https://dev.to/mathewthe2/using-javascript-to-preprocess-images-for-ocr-1jc',
            'https://muthu.co/basics-of-image-convolution/',
            'https://lovestudycom.tistory.com/entry/Blur-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98'
        ]
    }

    function operator(operator, ...operand){

        var result = operand[0] 
        if(typeof operand[1] === 'undefined' || operand[1] === '') return result 

        switch(operator){
            case '+': result = operand[0] + operand[1] 
            break
            case '-': result = operand[0] - operand[1] 
            break
            case '*': result = operand[0] * operand[1] 
            break
            case '%': result = operand[0] % operand[1] 
            break
            case '=': result = operand[0] = operand[1] 
            break
        }

        return result
    }

    const filterOption = {
        grayscale: function(pixels){
            var v 
            for (var i = 0; i < pixels.data.length; i += 4){
                v = 0.2126 * pixels.data[i]  + 0.7152 * pixels.data[i + 1] + 0.0722 * pixels.data[i + 2]
                pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v
            }

            return pixels
        },

        invert: function(pixels){
            /*
            p[i] = p[i] ^ 255 // Invert Red
            p[i+1] = p[i+1] ^ 255 // Invert Green
            p[i+2] = p[i+2] ^ 255 // Invert Blue

            p[i] = 255 - p[i]
            p[i + 1] = 255 - p[i + 1] 
            p[i + 2] = 255 - p[i + 2]
            */
            for (var i = 0; i < pixels.data.length; i += 4){
                pixels.data[i] = pixels.data[i] ^ 255 // Invert Red
                pixels.data[i+1] = pixels.data[i+1] ^ 255 // Invert Green
                pixels.data[i+2] = pixels.data[i+2] ^ 255 // Invert Blue
            }

            return pixels
        },

        brightness: function(pixels){
            if(input.param.value === '') return pixels
            var v = numLeftOrRight(input.param.value, correction.filter.brightness.value[1]),
            data = pixels.data

            for (var i = 0; i < data.length; i += 4){
                pixels.data[i] = data[i] + v
                pixels.data[i + 1] = data[i + 1] + v
                pixels.data[i + 2] = data[i + 2] + v
            }

            return pixels
        },

        sepia: function(pixels){
            var data = pixels.data

            for (var i = 0; i < data.length; i += 4){
                var r = data[i],
                g = data[i + 1],
                b = data[i + 2]

                pixels.data[i] = r * 0.3588 + g * 0.7044 + b * 0.1368
                pixels.data[i + 1] = r * 0.2990 + g * 0.5870 + b * 0.1140
                pixels.data[i + 2] = r * 0.2392 + g * 0.4696 + b * 0.0912
            }

            return pixels
        },

        //https://stackoverflow.com/questions/10521978/html5-canvas-image-contrast/37714937
        contrast: function(pixels){
            if(input.param.value === '') return pixels
            var contrastValue = numLeftOrRight(input.param.value, correction.filter.contrast.value[1]),
            contrast = (contrastValue/100) + 1,  //convert to decimal & shift range: [0..2]
            intercept = 128 * (1 - contrast),
            data = pixels.data

            for (var i = 0; i < data.length; i += 4){
                pixels.data[i] = data[i] * contrast + intercept
                pixels.data[i + 1] = data[i + 1] * contrast + intercept
                pixels.data[i + 2] = data[i + 2] * contrast + intercept
            }

            return pixels
        },

        binary: function(pixels){
            if(input.param.threshold === '') return pixels
            var threshold = numLeftOrRight(input.param.threshold, correction.filter.binary.threshold[1]),
            p = pixels.data,
            val, thresh = Math.floor(threshold * 255), gray 

            for (var i = 0; i < p.length; i += 4){
                gray = 0.2126 * p[i]  + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]

                if (gray >= thresh) val = 255
                else val = 0

                p[i] = p[i + 1] = p[i + 2] = val
            }

            return pixels
        },
        
        saturation: function(pixels){
            var r = input.param.red,
            g = input.param.green,
            b = input.param.blue

            if((isNaN(r) || r === '') && (isNaN(g) || g === '') && (isNaN(b) || b === '')) return pixels
            
            var colorArray = [r, g, b],            
            data = pixels.data,
            o = input.param.operator || correction.filter.saturation.operator[1],
            count

            for (var i = 0; i < data.length; i += 4){
                count = 0
                for(var j = i; j < i + 3; j++){
                    pixels.data[j] = operator(o, data[j], colorArray[count])
                    count++
                }
            }

            return pixels
        },

        convolute: function(pixels, weights, float32, opaque){ 
            var opaque = opaque || input.param.opaque || correction.filter.convolute.opaque[1]
            weights = weights || input.param.weights || correction.filter.convolute.weights[1]

            if(!checkWeights(weights)){
                return pixels     
            }

            var side = Math.round(Math.sqrt(weights.length)),
            cnt = numLeftOrRight(cnt, 1),
            halfSide = Math.floor(side/2),
            p = pixels.data,
            sw = pixels.width,
            sh = pixels.height,
            w = sw,
            h = sh,
            alphaFac = opaque ? 1 : 0,
            ctx = canvas.getContext('2d'),
            output

            if(float32){
                output = { width: w, height: h, data: new Float32Array(w * h * 4) }
            }else{
                output = ctx.createImageData(w, h)
            }

            var d = output.data
            
            for (var y = 0; y < h; y++) {
                for (var x = 0; x < w; x++) {
                    var sy = y, sx = x,
                    dOff = (y * w + x ) * 4,
                    r = 0, g = 0, b = 0, a = 0, index = 0

                    for (var cy = 0; cy < side; cy++) {
                        for (var cx = 0; cx < side; cx++) {
                            var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide)),
                            scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide)),
                            pOff = (scy * sw + scx) * 4,
                            wt = weights[cy * side + cx]

                            r += p[pOff] * wt 
                            g += p[pOff + 1] * wt 
                            b += p[pOff + 2] * wt 
                            a += p[pOff + 3] * wt  
                        }
                    }

                    d[dOff] = r
                    d[dOff + 1] = g
                    d[dOff + 2] = b
                    d[dOff + 3] = a + alphaFac * (255 - a)
                }
            }

            return output
        },

        sharpen: function(pixels){
            return this.convolute(pixels, 
                [  0, -1,  0,
                -1,  5, -1,
                0, -1,  0 ])
        },

        blur: function(pixels){
            if(input.param.radius === '') return pixels
            var radius =  numLeftOrRight(input.param.radius, correction.filter.blur.radius[1])

            if(radius < 2) {
                console.warn('radius ' + radius + '은 의미 없는 값입니다.')
                return pixels
            }

            var val = 1/(radius * radius),
            array = []

            for(var i = 0; i < radius * radius; i++){
                array.push(val)
            }

            return this.convolute(pixels, array)
        },

        sobel: function(pixels){
            var px = this.grayscale(pixels),
            ctx = canvas.getContext('2d'),
            vertical = this.convolute(px, [-1, -2, -1, 0, 0, 0, 1, 2, 1], true),
            horizontal  = this.convolute(px, [-1, 0, 1, -2, 0, 2, -1 ,0, 1], true),
            id = ctx.createImageData(vertical.width, vertical.height)

            for(var i = 0; i < id.data.length; i += 4){
                var v = Math.abs(vertical.data[i])
                id.data[i] = v
                var h = Math.abs(horizontal.data[i])
                id.data[i+1] = h
                id.data[i+2] = (v + h)/4
                id.data[i+3] = 255
            }
            
            return id
        },

        edgeDetection: function(pixels){ //미구현
            return this.convolute(pixels, [1, 0, -1, 1, 0, -1, 1, 0, -1], null, true)
        },
        
        embossImage: function(pixels){
            return this.convolute(pixels, [-2, -1, 0, -1, 1, 1, 0, 1, 2])
        },

        gaussianBlur: function(pixels){ 
            return this.convolute(pixels, [1/16, 1/8, 1/16, 1/8, 1/4, 1/8, 1/16, 1/8, 1/16])
        },

        transparency: function(pixels){
            var a = input.param.alpha,
            p = pixels.data

            if(a === 1) return pixels

            if(a || a === 0){
                if(a < 1 && isFloat(a)){
                    for (var i = 0; i < p.length; i += 4){
                        p[i + 3] = p[i + 3] * a
                    }
                }else{
                    for (var i = 0; i < p.length; i += 4){
                        p[i + 3] = a
                    }
                } 
            } // if(a)

            return pixels
        },

        //https://www.youtube.com/watch?v=55iwMYv8tGI
        ascii: function(pixels){
            
        },

        init: function(){}
    }
    
    /* util */
    function deepCopyObj(obj){
        var copyObj
        if(Array.isArray(obj)) copyObj = []
        else copyObj = {}

        for(var prop in obj){
            if(typeof obj[prop] === 'object' && !(obj[prop] instanceof HTMLElement)){
                copyObj[prop] = deepCopyObj(obj[prop])
            }else{
                copyObj[prop] = obj[prop]
            }
        }

        return copyObj
    }

    function isNum(val){ return !isNaN(val) }
    function numLeftOrRight(...val){
        for(var i = 0; i < val.length; i++){
            if(val[i] !== '' &&  isNum(val[i])) return val[i]
            if(i === val.length - 1) return val[i]
        }
    }
    function isInteger(x) { return typeof x === "number" && isFinite(x) && Math.floor(x) === x }
    function isFloat(x) { return !!(x % 1) }
    function checkWeights(weights){
        if(Array.isArray(weights)){
            for(var i = 0; i < weights.length; i++){
                if(isNaN(weights[i]) || weights[i] === ''){
                    return false
                }
            }

            return true
        }else{
            return false
        }
    }

    Object.seal(correction)
    Object.seal(input)
    Object.seal(filterOption)

    const canvas = document.createElement('canvas')

    /* public */
    function Filter(){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.setting = {
            format: 'image/jpeg',
            return: 'toBlob'
        }
        this.link
    }

    Filter.prototype.env = function({ width, height, setting, link }){
        this.canvas.width = width? width : (link? link.width : 300)
        this.canvas.height = height? height : (link? link.height : 150)

        if(setting){
            for(var prop in setting){
                if(this.setting.hasOwnProperty(prop)){
                    if(prop === 'return' && setting[prop] !== 'toBlob') setting[prop] = 'toDataURL'
                    this.setting[prop] = setting[prop]
                }else{
                    throw Error('존재하지 않는 프로퍼티')
                }
            }
        }

        var self = this

        if(link){
            if(link instanceof HTMLElement) {
                correction.link[1] = link
                this.link = link
                var ready

                if(!link.complete){
                    ready = new Promise(function(resolve, reject){
                        link.addEventListener('load', function(){
                            resolve(true)
                        }, { once: true })
                    })
                
                    return new Promise(function(resolve, reject){
                        ready.then(function(result){
                            self.ctx.drawImage(link, 0, 0)
                            repository.imgData = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height)

                            resolve(' 이미지 로드 ! ')
                        })
                    })
                }else{
                    self.ctx.drawImage(link, 0, 0)
                    repository.imgData = self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height)

                    return new Promise(function(resolve){
                        resolve(true)
                    })
                }

            }
            else throw TypeError('요소가 아닙니다.')
        }//if
    }

    Filter.prototype.changeCanvas = function(canvas){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
    }

    Filter.prototype.set = function(filter, option){
        if(correction.filter.hasOwnProperty(filter)){
            input.filter = filter

            for(var prop in option){
                if(correction.filter[filter].hasOwnProperty(prop)){
                    if(prop !== 'weights'){
                        if(typeof option[prop] === correction.filter[filter][prop][0]){
                            input.param[prop] = option[prop]
                        }else{
                            if(option[prop] === ''){ //빈값 허용
                                input.param[prop] = option[prop]
                            }else{
                                throw TypeError(option[prop] + '은 '+ correction.filter[filter][prop][0] + ' 타입이 아닙니다.')
                            }
                        }
                    }else{ 
                        if(Array.isArray(option[prop])){
                            input.param[prop] = option[prop]
                        }else{
                            throw TypeError(''+ correction.filter[filter][prop][0] + ' 타입이 아닙니다.')
                        }
                    }
                }else{
                    throw Error(prop + '은 ' + filter + '에서 지원하는 속성이 아닙니다.')
                }
            }
        }else{
            throw Error(filter + ' 없는 속성입니다.')
        }
    }

    Filter.prototype.defaultSet = function({}){ /* correcion 객체는 여기서 수정한다. */

    }

    Filter.prototype.initSet = function(){ 
        input.filter = ''
        input.param = {}
    }

    Filter.prototype.apply = function(img, left = 0, top = 0, setWidth, setHeight, format = this.setting.format){
        img = img || correction.link[1]       
        if(input.filter !== 'init' && !img.complete) throw Error('이미지가 로드되지 않았습니다.')
        if(!img) throw Error('img가 ' + img +' 입니다.') 

        var canvas = this.canvas,
        width = setWidth || canvas.width,
        height = setHeight || canvas.height,
        imgData
        
        this.ctx.drawImage(img, 0, 0)

        /*
        img = img || correction.link[1]       
        if(input.filter !== 'init' && !img.complete && !correction.link[1]) throw Error('이미지가 로드되지 않았습니다.')
        if(!img) throw Error('img가 ' + img +' 입니다.') 

        var canvas = this.canvas,
        width = setWidth || canvas.width,
        height = setHeight || canvas.height,
        imgData

        try {
            this.ctx.drawImage(img, 0, 0)
        } catch (error) {
            if(correction.link[1]){ //연결된 이미지가 있다면 비동기 방식으로 생긴 에러시 이미지 다시 그리기 시도 
                this.ctx.getImageData(left, top, width, height)
                this.ctx.drawImage(this.ctx.canvas, 0, 0)
            }else{
                throw Error('이미지 다시 그리기 실패: ' + error)
            }
        }
        */

        if(input.filter === 'init'){
            if(!correction.link[1]) {
                throw Error( 'correction.link가 ' + correction.link[1] +' 입니다. init은 link가 설정되어야 사용할 수 있습니다.')
            }
            imgData = repository.imgData
        }else{
            imgData = this.ctx.getImageData(left, top, width, height)
            imgData = filterOption[input.filter](imgData)
        }

        this.ctx.putImageData(imgData, left, top)
        this.initSet()

        //https://stackoverflow.com/questions/59020799/which-function-should-i-use-todataurl-or-toblob
        if(this.setting.return === 'toBlob'){
            return new Promise(function(resolve, reject){
                canvas.toBlob(function(blob){
                    resolve(URL.createObjectURL(blob))
                }, format)
            }) 
        }else{
            return canvas.toDataURL(format)
        }
    }

    Filter.prototype.getCorrection = function(){ /* correction 객체를 복사해서 리턴한다. */
        return deepCopyObj(correction)
    }

    exports.Filter = Filter
})))
