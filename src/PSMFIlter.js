(function(global, factory){
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) : 
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.psm = {}))
}(this, (function(exports){ 'use strict'

    /*    
    correction 객체에 filter는 filter와 각 필터의 파라미터를 의미합니다.
    예를 들면 brightness는 필터이고 그 속성 value는 배열로 되어 있는데 0번은 
    Type을 의미하고 1번은 default 값입니다. 
    filter 속성을 제외하면 alpha는 공통으로 사용되는 속성이고 그 외 속성들은 다른 기능을 
    가지고 있습니다.
    */
    const correction = { /* interface, type, default value 설정  */
        filter: {
            brightness: {
                value: ['number', 32]
            },
            contrast: {
                value: ['number', 24]
            },
            grayscale: {

            },
            invert: {

            },
            sepia: {

            },
            binary: {
                threshold: ['number', 24],
            },
            custom: {
                red: ['number', 0],
                green: ['number', 0],
                blue: ['number', 0],
                operator: ['String', '+'], //+, -, =, *, %
            },
            blur: { //블러 옵션
                radius: ['number', 1],
                kernel: '',
                kernelSize: '',
                mult: ''
            },
            init: {}
        },
        alpha: ['number', 255],
        link: ['HTMLElemnt', undefined], //element 원본을 유지한다.
    }

    const repository = [] //link의 imageData를 저장한다.
    const queue = [] //apply는 순차적으로 작동하게 만들어야 한다. 

    const input = {
        filter: '',
        param: {}
    }

    const metadata = {
        since: '20220217',
        version: '0.1',
        github: 'https://github.com/CodingCitron'
    }

    function task(){

    }

    function getARGB(data, i){
        var offset = i * 4
        return (
            ((data[offset + 3] << 24) & 0xff000000) |
            ((data[offset] << 16) & 0x00ff0000) |
            ((data[offset + 1] << 8) & 0x0000ff00) |
            (data[offset + 2] & 0x000000ff)
        )
    }

    function setPixels(pixels, data) {
        var offset = 0
        for (var i = 0, al = pixels.length; i < al; i++) {
            offset = i * 4;
            pixels[offset + 0] = (data[i] & 0x00ff0000) >>> 16
            pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8
            pixels[offset + 2] = data[i] & 0x000000ff
            pixels[offset + 3] = (data[i] & 0xff000000) >>> 24
        }
    }

    function buildBlurKernel(r) {
        var radius = (r * 3.5) | 0
        radius = radius < 1 ? 1 : radius < 248 ? radius : 248
        
        if (blurRadius !== radius) {
            blurRadius = radius
            blurKernelSize = (1 + blurRadius) << 1
            blurKernel = new Int32Array(blurKernelSize)
            blurMult = new Array(blurKernelSize)
            for (let l = 0; l < blurKernelSize; l++) {
                blurMult[l] = new Int32Array(256)
            }
        
            var bk, bki, bm, bmi
        
            for (let i = 1, radiusi = radius - 1; i < radius; i++) {
                blurKernel[radius + i] = blurKernel[radiusi] = bki = radiusi * radiusi
                bm = blurMult[radius + i]
                bmi = blurMult[radiusi--]
                for (let j = 0; j < 256; j++) {
                    bm[j] = bmi[j] = bki * j
                }
            }
            bk = blurKernel[radius] = radius * radius
            bm = blurMult[radius]
        
            for (let k = 0; k < 256; k++) {
                bm[k] = bk * k
            }
        }
    }

    //from https://github.com/processing/p5.js/blob/main/src/image/filters.js
    function blurARGB(pixels, canvas, radius) {
        var width = canvas.width,
        height = canvas.height,
        numPackedPixels = width * height,
        argb = new Int32Array(numPackedPixels)

        for (let j = 0; j < numPackedPixels; j++) {
            argb[j] = getARGB(pixels, j)
        }

        var sum, cr, cg, cb, ca, read, ri, ym, ymi, bk0,
        a2 = new Int32Array(numPackedPixels),
        r2 = new Int32Array(numPackedPixels),
        g2 = new Int32Array(numPackedPixels),
        b2 = new Int32Array(numPackedPixels),
        yi = 0, x, y, i, bm

        buildBlurKernel(radius)

        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                cb = cg = cr = ca = sum = 0
                read = x - blurRadius
            if (read < 0) {
                bk0 = -read
                read = 0
            } else {
                if (read >= width) break
                bk0 = 0
            }
            for (i = bk0; i < blurKernelSize; i++) {
                if (read >= width) break
                var c = argb[read + yi]
                bm = blurMult[i]
                ca += bm[(c & -16777216) >>> 24]
                cr += bm[(c & 16711680) >> 16]
                cg += bm[(c & 65280) >> 8]
                cb += bm[c & 255]
                sum += blurKernel[i]
                read++
            }
                ri = yi + x
                a2[ri] = ca / sum
                r2[ri] = cr / sum
                g2[ri] = cg / sum
                b2[ri] = cb / sum
            }
                yi += width
        }
            yi = 0
            ym = -blurRadius
            ymi = ym * width
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                cb = cg = cr = ca = sum = 0
            if (ym < 0) {
                bk0 = ri = -ym
                read = x
            } else {
                if (ym >= height) break
                bk0 = 0
                ri = ym
                read = x + ymi
            }
            for (i = bk0; i < blurKernelSize; i++) {
                if (ri >= height) break
                bm = blurMult[i]
                ca += bm[a2[read]]
                cr += bm[r2[read]]
                cg += bm[g2[read]]
                cb += bm[b2[read]]
                sum += blurKernel[i]
                ri++
                read += width
            }
            argb[x + yi] =
                ((ca / sum) << 24) |
                ((cr / sum) << 16) |
                ((cg / sum) << 8) |
                (cb / sum)
            }
            yi += width
            ymi += width
            ym++
        }
        
        setPixels(pixels, argb)
    }

    function operator(operator, ...operand){

        var result = operand[0]
        if(typeof operand[1] === 'undefined') return result 

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
        grayscale: function(p, i, a){
            var v = 0.2126 * p[i]  + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]
            p[i] = p[i + 1] = p[i + 2] = v
            p[i + 3] = a
        },

        invert: function(p, i, a){
            /*
            p[i] = p[i] ^ 255 // Invert Red
            p[i+1] = p[i+1] ^ 255 // Invert Green
            p[i+2] = p[i+2] ^ 255 // Invert Blue

            p[i] = 255 - p[i]
            p[i + 1] = 255 - p[i + 1] 
            p[i + 2] = 255 - p[i + 2]
            */
            p[i] = p[i] ^ 255 // Invert Red
            p[i+1] = p[i+1] ^ 255 // Invert Green
            p[i+2] = p[i+2] ^ 255 // Invert Blue
            p[i + 3] = a
        },

        brightness: function(p, i, a){
            var v = input.param.value || correction.filter.brightness.value[1],
            data

            if(correction.link[1]) data = repository[0].data
            else data = p

            p[i] = data[i] + v
            p[i + 1] = data[i + 1] + v
            p[i + 2] = data[i + 2] + v
            p[i + 3] = a
        },

        sepia: function(p, i, a){
            var r = p[i],
            g = p[i + 1],
            b = p[i + 2]

            p[i] = r * 0.3588 + g * 0.7044 + b * 0.1368
            p[i + 1] = r * 0.2990 + g * 0.5870 + b * 0.1140
            p[i + 2] = r * 0.2392 + g * 0.4696 + b * 0.0912
            p[i + 3] = a
        },

        //https://stackoverflow.com/questions/10521978/html5-canvas-image-contrast/37714937
        contrast: function(p, i, a){
            var contrastValue = input.param.value || correction.filter.contrast.value[1],
            contrast = (contrastValue/100) + 1,  //convert to decimal & shift range: [0..2]
            intercept = 128 * (1 - contrast)
            p[i] = p[i] * contrast + intercept
            p[i + 1] = p[i + 1] * contrast + intercept
            p[i + 2] = p[i + 2] * contrast + intercept
            p[i + 3] = a
        },

        binary: function(p, i, a){
            var threshold = input.param.threshold || correction.filter.binary.threshold[1],
            gray = 0.2126 * p[i]  + 0.7152 * p[i + 1] + 0.0722 * p[i + 2],
            val, thresh = Math.floor(threshold * 255)

            if (gray >= thresh) val = 255
            else val = 0
            p[i] = p[i + 1] = p[i + 2] = val
            p[i + 3] = a
        },
        
        custom: function(p, i, a){
            var r = input.param.red,
            g = input.param.green,
            b = input.param.blue,
            colorArray = [r, g, b, a],
            count = 0, j = i === 0? i : i - 4,
            data,
            o = input.param.operator || correction.filter.custom.operator[1]
            
            if(correction.link[1]) data = repository[0].data
            else data = p

            for(j; j < i + 4; j++){
                p[j] = operator(o, data[j], colorArray[count])
                count++
            }     
        },

        init: function(){}
    }
    
    /* 
    progress 함수는 input 속성의 filter 값으로 filterOption 객체의 해당하는 
    filter 함수를 실행시킵니다. 공통의 값은 progress를 통해서 추가하고 
    특정 filter에만 필요한 값은 filterOption의 해당 filter 메서드에서 
    input.param을 통해서 값을 가져오는 것으로 설계하였습니다.
     */
    function progress(imgData){
        var { filter, param } = input,
        pixels = imgData.data,
        alpha = filter !== 'custom'? param.alpha || correction.alpha[1] : param.alpha

        for (let i = 0; i < pixels.length; i += 4) filterOption[filter](pixels, i, alpha)
        return imgData
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

    Object.seal(correction)
    Object.seal(input)
    Object.seal(filterOption)

    /* public */
    function Filter(){
        this.canvas = document.createElement('canvas')
        this.ctx = this.canvas.getContext('2d')
        this.setting = {
            format: 'image/jpeg',
            return: 'toBlob'
        }
    }

    Filter.prototype.env = function({ width, height, setting, link }){
        this.canvas.width = width? width : (link? link.naturalWidth : 300)
        this.canvas.height = height? height : (link? link.naturalHeight : 150)

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
                            repository.push(self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height))

                            resolve(' 이미지 로드 ! ')
                        })
                    })
                }else{
                    self.ctx.drawImage(link, 0, 0)
                    repository.push(self.ctx.getImageData(0, 0, self.canvas.width, self.canvas.height))

                    return new Promise(function(resolve){
                        resolve(true)
                    })
                }

            }
            else throw TypeError('요소가 아닙니다.')
        }//if

        // console.log(*)
    }

    Filter.prototype.changeCanvas = function(canvas){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
    }

    /*
    rgb 값은 반드시 int or dubble
    특정 filter의 parameter가 추가되면 이곳을 수정해야 한다.
    */
    Filter.prototype.set = function(filter, option){
        if(correction.filter.hasOwnProperty(filter)){
            input.filter = filter

            for(var prop in option){
                if(correction.filter[filter].hasOwnProperty(prop)){
                    if(typeof option[prop] === correction.filter[filter][prop][0]){
                        input.param[prop] = option[prop]
                    }else{
                        throw TypeError(''+ correction.filter[filter][prop][0] + ' 타입이 아닙니다.')
                    }
                }else{
                    if(prop === 'alpha'){
                        console.log(typeof option[prop])
                        if(typeof option[prop] === correction[prop][0]){
                            input.param[prop] = option[prop] 
                        }else{
                            throw TypeError(''+ correction[prop][0] + ' 타입이 아닙니다.')
                        }
                    }else{
                        throw Error(''+prop + '는 없는 속성입니다.')
                    }
                }
            }
        }else{
            throw Error(filter + ' 없는 속성입니다.')
        }
    }

    Filter.prototype.defaultSet = function(){ /* correcion 객체는 여기서 수정한다. */

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

        if(input.filter === 'init'){
            if(!correction.link[1]) {
                throw Error( 'correction.link가 ' + correction.link[1] +' 입니다. init은 link가 설정되어야 사용할 수 있습니다.')
            }
            imgData = repository[0]
        }else{
            imgData = this.ctx.getImageData(left, top, width, height)
            progress(imgData)
        }

        console.log(imgData)

        this.ctx.putImageData(imgData, left, top)
        this.initSet()

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

    // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
    function dilate(pixels, canvas) {
        var currIdx = 0,
        maxIdx = pixels.length ? pixels.length / 4 : 0,
        out = new Int32Array(maxIdx),
        currRowIdx, maxRowIdx, colOrig, colOut, currLum,
        idxRight, idxLeft, idxUp, idxDown,
        colRight, colLeft, colUp, colDown,
        lumRight, lumLeft, lumUp, lumDown

        while (currIdx < maxIdx) {
            currRowIdx = currIdx
            maxRowIdx = currIdx + canvas.width
            while (currIdx < maxRowIdx) {
                colOrig = colOut = getARGB(pixels, currIdx)
                idxLeft = currIdx - 1
                idxRight = currIdx + 1
                idxUp = currIdx - canvas.width
                idxDown = currIdx + canvas.width

                if (idxLeft < currRowIdx) {
                    idxLeft = currIdx
                }
                if (idxRight >= maxRowIdx) {
                    idxRight = currIdx
                }
                if (idxUp < 0) {
                    idxUp = 0
                }
                if (idxDown >= maxIdx) {
                    idxDown = currIdx
                }

                colUp = getARGB(pixels, idxUp)
                colLeft = getARGB(pixels, idxLeft)
                colDown = getARGB(pixels, idxDown)
                colRight = getARGB(pixels, idxRight)

                //compute luminance
                currLum =
                    77 * ((colOrig >> 16) & 0xff) +
                    151 * ((colOrig >> 8) & 0xff) +
                    28 * (colOrig & 0xff)
                lumLeft =
                    77 * ((colLeft >> 16) & 0xff) +
                    151 * ((colLeft >> 8) & 0xff) +
                    28 * (colLeft & 0xff)
                lumRight =
                    77 * ((colRight >> 16) & 0xff) +
                    151 * ((colRight >> 8) & 0xff) +
                    28 * (colRight & 0xff)
                lumUp =
                    77 * ((colUp >> 16) & 0xff) +
                    151 * ((colUp >> 8) & 0xff) +
                    28 * (colUp & 0xff)
                lumDown =
                    77 * ((colDown >> 16) & 0xff) +
                    151 * ((colDown >> 8) & 0xff) +
                    28 * (colDown & 0xff)

                if (lumLeft > currLum) {
                    colOut = colLeft
                    currLum = lumLeft
                }
                if (lumRight > currLum) {
                    colOut = colRight
                    currLum = lumRight
                }
                if (lumUp > currLum) {
                    colOut = colUp
                    currLum = lumUp
                }
                if (lumDown > currLum) {
                    colOut = colDown
                    currLum = lumDown
                }
                out[currIdx++] = colOut
            }
        }
        setPixels(pixels, out)
    }

    //https://stackoverflow.com/questions/10100798/whats-the-most-straightforward-way-to-copy-an-arraybuffer-object
    if (!ArrayBuffer.prototype.slice){
        ArrayBuffer.prototype.slice = function (start, end) {
            var that = new Uint8Array(this)
            if (end == undefined) end = that.length
            var result = new ArrayBuffer(end - start)
            var resultArray = new Uint8Array(result)
            for (var i = 0; i < resultArray.length; i++)
            resultArray[i] = that[i + start]
            return result
        }
    }

    if(!Promise){
        
    }

    exports.Filter = Filter
})))
