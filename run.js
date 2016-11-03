#!/bin/env node

var Horseman = require('node-horseman')

var gm = require('gm')

var tmp_gm = require('gm')

const util = require('util')

const CROP_SELECTOR = 'div#canvasContainer'

const ARGS = process.argv

const BASE = 'https://poloniex.com/exchange#%s'

const PAIR = ARGS[2]
const PAIR_DEFAULT = 'btc_nav'

const ZOOMS = [6,
	       24,
	       48,
	       96,
	       168,
	       336,
	       744]

const CANDLES = [300,
		 900,
		 1800,
		 7200,
		 14400,		 
		 86400,
		 300]


const REMOVE = ['div#currentChartRange',
		'div.sprocket']

var series = {
    'pair': PAIR,
    'pages': [],
    'images': []
}

if (PAIR === undefined) {
    console.log('One or more arguments are missing. Using default values as a result.\n')
    
    series['pair'] = PAIR_DEFAULT
}

function imagePath(i) {
    return series['images'][i]
}

function mergedImagePath() {
    return '/tmp/merged_' + series['pair'] + '.png'
}

function zoomButton(i) {
    return 'button#zoom' + ZOOMS[i]
}

function candleButton(i) {
    return 'button#chartButton' + CANDLES[i]
}

function initMessage() {
    return 'Attempting series pair ' + series['pair']
}

function initConfig() {

    series['pages'] = CANDLES.map((x) => {
	return util.format(BASE,
			   series['pair'])
    })

    series['images'] = CANDLES.map((x) => {
	return '/tmp/' + series['pair'] + x + '.png'
    })
}

function execInit() {
    initConfig()
    console.log(initMessage())

    var horseman = null
    
    try {
	series['pages'].forEach((element, index, array) => {
	    var image = imagePath(index)

	    var candle_button = candleButton(index)
	    var zoom_button = zoomButton(index)
	    
	    horseman = new Horseman()
	    
	    horseman
		.log('Accessing ' +  element)
		.viewport(1920,1080)
		.open(element)
		.log('3 seconds wait after load.')
		.wait(3000)
		.log('Clicking ' + candle_button)	    
		.click(candle_button)
	    	.wait(2000)
		.log('Clicking ' + zoom_button)
		.click(zoom_button)
		.evaluate(function (a) {
		    for (x in a) {
			document.querySelector(a[x]).innerHTML = ''
		    }
		}, REMOVE)
	    	.wait(2000)
	    	.log('2 second wait after load.')
		.crop(CROP_SELECTOR, image)
		.close()
	})	

	console.log('Waiting 45 seconds before merging images to ' + mergedImagePath())

	setTimeout(() => {
	    var y = null
	    var text = series['pair']
		+ ' series '
		+ CANDLES.map((x) => {
		    var v = x / 60
		    var marker = 'm'
		    
		    if (v >= 60) {
			v = v / 60
			marker = 'h'
		    }

		    return v + marker + '  '
		})
	    
	    series.images.forEach((x, index, array) => {
		y = y === null ?
		    gm(x)
		    .append()
		    .pointSize(16)
		    .stroke('#000000', 0.1)
		    .drawText(0, 40, text, 'NorthWest') :
		    y
		    .append()
		    .append(x)
	    })

	    y.write(mergedImagePath(), (e) => {
		if (e) console.log(e)
	    })
	}, 45 * 1000)

    } catch (error) {
	console.log(error)
    } finally {
	if (horseman) {
	    horseman.close()
	}
    }
}

execInit()
