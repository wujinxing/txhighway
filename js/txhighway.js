"use strict";

/* create variables */
const socketCash = io("https://cashexplorer.bitcoin.com/");
const socketCore = io("https://localbitcoinschain.com/");//
const blockchairCashUrl = "http://cors-proxy.htmldriven.com/?url=https://api.blockchair.com/bitcoin-cash/mempool/";
const blockchairCoreUrl = "http://cors-proxy.htmldriven.com/?url=https://api.blockchair.com/bitcoin/mempool/";
const blockchainCoreUrl = "http://cors-proxy.htmldriven.com/?url=https://api.blockchain.info/charts/avg-confirmation-time";

// DOM elements
const canvas = document.getElementById("renderCanvas");
const ctx = canvas.getContext("2d");
const cashPoolInfo = document.getElementById("cash-pool");
const corePoolInfo = document.getElementById("core-pool");
const cashEta = document.getElementById("cash-eta");
const coreEta = document.getElementById("core-eta");

canvas.width = window.innerWidth; 
canvas.height = window.innerHeight;

/* sprites */
const carCore = new Image();
const carSmallCash = new Image();
const carMediumCash = new Image();
const carLargeCash = new Image();
const carXLargeCash = new Image();
const carWhaleCash = new Image();
const carSmallCore = new Image();
const carMediumCore = new Image();
const carLargeCore = new Image();
const carXLargeCore = new Image();
const carWhaleCore = new Image();
const carLambo = new Image();

//cash vehicles
carSmallCash.src = "assets/sprites/bch-small.png";
carMediumCash.src = "assets/sprites/bch-medium.png";
carLargeCash.src = "assets/sprites/bch-large.png";
carXLargeCash.src = "assets/sprites/bch-xlarge.png";
carWhaleCash.src = "assets/sprites/bch-whale.png";
carLambo.src = "assets/sprites/lambo.png";

//core vehicles
carSmallCore.src = "assets/sprites/core-small.png";
carMediumCore.src = "assets/sprites/core-medium.png";
carLargeCore.src = "assets/sprites/core-xlarge.png";
carXLargeCore.src = "assets/sprites/core-large.png";
carWhaleCore.src = "assets/sprites/core-whale.png";
/* end sprites */

// constants
let WIDTH = canvas.width;
let HEIGHT = canvas.height;
let SINGLE_LANE = HEIGHT/14;

// cash and segwit speed
const CSPEED = 12;
const SSPEED = 8;

// arrays
let txCash = [];
let txCore = []

/* connect to socket */
socketCash.on("connect", function () {
	socketCash.emit("subscribe", "inv");
});

socketCore.on("connect", function () {
	socketCore.emit("subscribe", "inv");
});

socketCash.on("tx", function(data){
	newTX("cash", data);
});

socketCore.on("tx", function(data){
	newTX("core", data);
	//console.log("coretx");
});

socketCash.on("block", function(data){
	getPoolData(blockchairCashUrl, xhrCash, true);	
});

socketCore.on("block", function(data){
	getPoolData(blockchairCoreUrl, xhrCore, false);	
});
/* End connect to socket */


/* get new cash mempool data */
let xhrCash = new XMLHttpRequest();
let xhrCore = new XMLHttpRequest();
let xhrBlockchain = new XMLHttpRequest();


getPoolData(blockchairCashUrl, xhrCash, true);
getPoolData(blockchairCoreUrl, xhrCore, false);
getCoreConfTime(blockchainCoreUrl, xhrBlockchain);

function getPoolData(url, xhr, isCash){
	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			let obj = JSON.parse(this.responseText);
			let info = JSON.parse(obj.body);
			info.data.forEach((key)=>{
				if (key.e =="mempool_transactions"){
					if (isCash){
						cashPoolInfo.textContent = key.c;
					} else {
						corePoolInfo.textContent = key.c;
					}
				}
			});
		}
	}

	xhr.open('GET', url, true);
	xhr.send();
}

// get average confirmation time for btc
function getCoreConfTime(url, xhr){
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			let obj = JSON.parse(xhr.responseText);
			let body = JSON.parse(obj.body);
			coreEta.textContent = body.period;
		}
	}

	xhr.open("GET", url, true);
	xhr.send(null);
	
}
/* end get new mempool data*/

/* resize the window */
function resize(){
	let height = window.innerHeight;
	let ratio = canvas.width/canvas.height;
	let width = height * ratio;

	canvas.style.width = width + "px";
	canvas.style.height = height + "px";
}

window.addEventListener("load", resize, false);
window.addEventListener("resize", resize, false);
/* end resize the window */

/* window loses focus */
var vis = (function(){
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();

vis(function(){
	if (vis()){
		txCash = [];
		txCore = [];
		drawBackground();
		requestAnimationFrame(animate);
	} else{
		cancelAnimationFrame(requestID);		
	}
});
/* end window loses focus */


/* new transaction is made */
function newTX(type, txInfo){
	let lane = SINGLE_LANE;
	let x = - carWhaleCash.width - 10;
	
	if (type == "cash"){
		let randLane = Math.floor(Math.random() * 8) + 1;
		lane *= randLane;
		lane -= SINGLE_LANE;

		createVehicle(type, txCash, txInfo, x, lane, true);

	} else {
		lane *= 10;
		lane = lane - SINGLE_LANE;

		let car = getCar(txInfo.valueOut, false, false);
		let width = SINGLE_LANE * (car.width / car.height);

		// calculate distance between vehicles
		if (txCore.length > 0){
			let last = txCore[txCore.length - 1];
			//let w = SINGLE_LANE * car.height / car.width;
			let front = width + x;
			if (front >= last.x){
				x = last.x - width - 10;
			}
		}

		createVehicle(type, txCore, txInfo, x, lane, false);

	}
}

/* create vehicles and push to appropriate array */
function createVehicle(type, arr, txInfo, x, lane, isCash){
	let donation = checkForDonation(txInfo);
	let car = getCar(txInfo.valueOut, donation, isCash);
	let height = SINGLE_LANE;
	let width = height * (car.width / car.height);
	let y = lane;
	

	arr.push({
		type:type,
		id: txInfo.txid,
		x: x,
		y: y,
		h: height,
		w: width,
		valueOut: txInfo.valueOut,
		donation: donation,
		isCash: isCash
	});
}
/* end new transaction */


/* return car based upon transaction size*/
function getCar(valueOut, donation, isCash){

	//console.log(valueOut);
	if (donation == true){
		return carLambo;
	}

	if (valueOut <= 5){
		if (isCash){
			return carSmallCash;
		} else {
			return carSmallCore;
		}
	} else if (valueOut > 5 && valueOut <= 10){
		if (isCash){
			return carMediumCash;
		} else {
			return carMediumCore;
		}
	} else if (valueOut > 10 && valueOut <= 15){
		if (isCash){
			return carLargeCash;
		} else {
			return carLargeCore;
		}
	} else if (valueOut > 15 && valueOut <= 25){
		if (isCash){
			return carXLargeCash;
		} else {
			return carXLargeCore;
		}
	} else if (valueOut > 25){
		if (isCash){
			return carWhaleCash;
		} else {
			return carWhaleCore;
		}
	}
}
/* end return car */

/* check for donations into the BCF*/
let checkForDonation = function(txInfo){
	let vouts = txInfo.vout;
	let isDonation = false;

	vouts.forEach((key)=>{
		let keys = Object.keys(key);
		keys.forEach((k)=> {
			if (k == "3ECKq7onkjnRQR2nNe5uUJp2yMsXRmZavC"){
				isDonation = true;
			}
		});
	});

	return isDonation;
}
/* end check for donations */

function drawBackground(){
	// draw the lanes
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	ctx.fillStyle = "#9EA0A3";

	// dash style
	ctx.setLineDash([6]);
	ctx.strokeStyle = "#FFF";

	// stroke
	ctx.strokeRect(-2, SINGLE_LANE * 1, WIDTH + 3, SINGLE_LANE);
	ctx.strokeRect(-2, SINGLE_LANE * 3, WIDTH + 3, SINGLE_LANE);
	ctx.strokeRect(-2, SINGLE_LANE * 5, WIDTH + 3, SINGLE_LANE);
	ctx.strokeRect(-2, SINGLE_LANE * 7, WIDTH + 3, SINGLE_LANE);

	ctx.setLineDash([0]);
	ctx.strokeStyle = "#3F3B3C";
	ctx.strokeRect(-2, SINGLE_LANE * 8, WIDTH + 3, SINGLE_LANE);

	ctx.setLineDash([6]);
	ctx.strokeStyle = "#FFF";
	ctx.strokeRect(-2, SINGLE_LANE * 10, WIDTH + 3, SINGLE_LANE);
}

function drawVehicles(){
	// loop through transactions and draw them
	txCash.forEach (function(item, index, object){
		item.x += CSPEED;
		//console.log(item.donation);
		
		ctx.drawImage(getCar(item.valueOut, item.donation, item.isCash), item.x, item.y, item.w, item.h);
	});

	txCore.forEach(function(item, index, object){
		item.x += SSPEED;
		ctx.drawImage(getCar(item.valueOut, item.donation, item.isCash), item.x, item.y , item.w, item.h);

	});
}


function removeVehicles(){
	// loops through transactions again and removes ones that are off the screen
	txCash.forEach(function(item, index, object){
		if (item.x > WIDTH + 100){
			object.splice(index, 1);
			let t = parseInt(cashPoolInfo.textContent);
			cashPoolInfo.textContent = t + 1;
		}
	});

	// loops through transactions again and removes ones that are off the screen
	txCore.forEach(function(item, index, object){
		if (item.x > WIDTH + 100){
			object.splice(index, 1);
			let t = parseInt(corePoolInfo.textContent);
			corePoolInfo.textContent = t + 1;
		}
	});
}

/* animate everything */
let requestID = requestAnimationFrame(animate);

function animate(){
	requestID = requestAnimationFrame(animate);
	drawBackground();
	drawVehicles();
	removeVehicles();
}


$('.speaker').click(function(e) {
  e.preventDefault();

	$(this).toggleClass('mute');
});