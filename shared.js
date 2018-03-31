
var obj = {};

(function(obj) {


	var events = {};
	var triggers = {};
	var defers = {};
	var promises = {};

	var numEvents = 0;

	// runs a saved promise
	var future = function (name) {

		try {

			promises[name].resolve();

			return true;
		}
		catch (e) {

			return false;
		}
	}

	// saves and returns a promise that will be run later, optional config callback will be run before promise is resolved
	var defer = function (name, _config) {

		promises[name] = $q.defer();

		promises[name].promise.then(function () {
			
			if (_config) return _config();
			return false;
		});

		return promises[name];
	}


	// called to trigger the events registered by the "on" method below, all events registered to the same name will be triggered, any values returned by those events can be assigned to an object by this call, with the sub identifiers defined in the "on" method as the keys
	var dispatch = function (name) {

		var result = {};

		var runEvent = function (index) {

			try {

				var sub = events[name].forEach(function (value, i) {

					return value.index == index;
				})
				
				if (index < events[name].length) {
					result[id] = events[name][sub.id].event();

					runEvent(index + 1);
				}
				else {
					return result;
				}

			}
			catch (e) {
				console.log("failed to run all events", e);

				return result;
			}

		}

		runEvent(0);

	}


	// saves a callback event method to a master list and a sub identifier to be later called by the dispatch method above, all the siblings registered by this method are called when the dispatch method is called by only providing the master list name, the id is used only to retrieve the return value of an individual event 
	var on = function (name, id, _event) {

		if (!events[name]) {
			events[name] = {};
			numEvents = 0;
		}

		events[name][id] = {
			index:numEvents++,
			id:id, 
			event:_event
		}

	}

	// create a set of callacks, triggers, to be chained
	var createTriggerSet = function (name) {

		console.log("for " + name + " create trigger set");

		triggers[name] = [];

		return triggers[name];
	}

	// get a trigger set by its name
	var getTriggerSet = function (name) {

		var triggerSet = triggers[name];

		if (triggerSet) {

			console.log("for " + name + " get existing trigger set");

			return triggerSet;
		}

		return [];
	}

	// change index of all triggers in set to be sequential
	var refactorTriggers = function (name) {

		var triggerSet = getTriggerSet(name);

		for (i in triggerSet) {

			triggerSet[i].index = i;
		}
	}

	// sort triggers
	var sortTriggers = function (name) {

		var triggerSet = getTriggerSet(name);

		if (triggerSet.length > 1) {

			triggerSet.sort(function(a,b) {

				if (a.index == b.index) {
					return a.sub - b.sub;
				}

				return a.index - b.index;
			});

			refactorTriggers(name);

		}

	}

	// internal function to get trigger by its index
	var getTriggerByIndex = function (name, trigger_index) {

		var triggerSet = getTriggerSet(name);

		for (i in triggerSet) {

			if (triggerSet[i].index == trigger_index) {

				return triggerSet[i];
			}
		}

		return {name:"none", index:-1};
	}

	// internal function to get trigger by its name
	var getTriggerByName = function (name, trigger_name) {

		var triggerSet = getTriggerSet(name);

		for (i in triggerSet) {

			if (triggerSet[i].name == trigger_name) {

				return triggerSet[i];
			}
		}

		return {name:"none", index:-1}; 
	}

	// public function to get trigger by either input
	var getTrigger = function (name, input) {

		var trigger;

		//console.log("getting trigger in set " + name + " with id " + input);

		if (input >= 0) {

			trigger = getTriggerByIndex(name, input);
		}
		else if (input.length > 0) {
			trigger = getTriggerByName(name, input);
		}
		else {

			trigger = {name:"none", index:-1};
		}

		return trigger;
	}

	// test whether trigger set already exists
	var doesTriggerSetExist = function (name) {

		if (triggers[name]) {
			return true;
		}

		return false;
	}

	// test whether trigger already exists
	var doesTriggerExist = function (name, input) {

		var trigger;

		if (doesTriggerSetExist(name)) {

			trigger = getTrigger(name, input);

			console.log("trigger index is " + trigger.index);

			if (trigger.index >= 0) {
				return true;
			}
		}

		return false;
	}

	// add a trigger to a set or create one to add it to
	var addTrigger = function (name, params) {

		var triggerSet;

		if (doesTriggerSetExist(name)) {
			triggerSet = getTriggerSet(name);
		}
		else {

			triggerSet = createTriggerSet(name);
		}

		if (params)  {

			console.log("add trigger " + name + " with name " + params.name);
			
			triggerSet.push(params);
			
			sortTriggers(name);
		}
		else {
			console.log("no set to add to _or_ no trigger to add");
		}
	}

	// run set of chained triggers between indecies
	var runTriggers = function (name, params) {

		var low = params.low;
		var high;

		if (low instanceof Number) {
			high = params.high;
		}
		else if (params.all) {
			low = 0;
			high = triggerSet.length-1;
		}

		var deferred = $q.defer();

		var promise = deferred.promise;

		for (var i = low; i <= high; i++) {

			promise.then(function (result) {

				var trigger = getTriggerByIndex(name, i);

				if (trigger.name != "none"){

					console.log("run trigger " + trigger.name);

					trigger.callback();
				}
				else {
					console.log("no trigger to run");
				}

				return true;
			});
		}

		deferred.resolve();
	}

	// pause chaining while trigger in set does not exist
	var waitForTriggerToExist = function (name, input) {

		return $q(function (resolve) {

			console.log("waiting for " + input + " in set " + name + " to exist");

			var wait = setInterval(function () {

				if (doesTriggerExist(name, input)) {

					clearInterval(wait);
					wait = null;
					resolve();
				}

			}, 100);

		});
	}

	// run individual trigger
	var runTrigger = function (name, input) {

		defers[name] = waitForTriggerToExist(name, input);

		defers[name].then(function () {

			var trigger = getTriggerByInput(name, input);

			trigger.callback();
		});

	}

	// delete all triggers
	var clearTriggers = function (name) {

		triggers[name] = [];
	} 

	
	obj.events_service = {
		on:on,
		dispatch:dispatch,
		defer:defer,
		future:future,
		addTrigger:addTrigger,
		runTriggers:runTriggers,
		runTrigger:runTrigger,
		clearTriggers:clearTriggers
	}


}(obj));







(function (obj) {

	
	var saves = {};
	var names = [];

	var r = function (name) {

		for (i in names) {

			if (name == names[i]) {

				return true;
			}
		}

		return false;
	}

	var obs = function (input) {


		var self = this;
		var o = [];
		self.name = input.name || "";
		self.state = input.state || null;
		var subs = [];

		console.log(self.name, "observable")

		var notify = function () {

			//console.log(self.name, "notify");

			for (i in subs) {
				subs[i](self.state);
			}
		}

		self.subscribe = function (callback) {

			//console.log(self.name, "subscribe");

			subs.push(callback);

			//notify();
		}

		self.setState = function (state) {

			//console.log(self.name, "set state", state);

			self.state = state;

			notify();
		}

	}

	var observable = function (input) {

		if (!r(input.name)) {
			saves[input.name] = new obs(input);
			names[names.length] = input.name;
		}
		else {
			saves[input.name].setState(input.state);
		}
	}

	var subscribe = function (input) {

		if (r(input.name)) {
			saves[input.name].subscribe(input.callback);
		}
		else {
			saves[input.name] = new obs(input);
			saves[input.name].subscribe(input.callback);
			names[names.length] = input.name;
		}

	}

	var push = function (input) {

		if (r(input.name)) {
			saves[input.name].setState(input.state);
		}
		else {
			console.log("no name at push (" + input.name + ")");
		}
	}

	obj.react_service = {
		observable:observable,
		subscribe:subscribe,
		push:push
	}



}(obj));







(function (obj) {


	var saved = {};
	var savedNames = [];

	var receivers = {};
	var names = [];

	var checkArray = function (_item, array) {

		for (i in array) {

			if (_item == array[i]) {

				return true;
			}
		}

		return false;
	}

	var isArray = function (array) {

		if( Object.prototype.toString.call( array ) === '[object Array]' ) {
		   return true;
		}

		return false;
	}

	// an operation to send data back to a receiver
	var back = function () {

		var self = this;

		// setup a named key/value object to receive data at a later time
		this.setup = function (params) {

			var name = params.name;

			var bin;

			if (!checkArray(name, names)) {

				bin = []; //create new receiver array for this name
			}
			else {
				bin = receivers[name]; // retrieve existing receiver array for this name
			}

			//console.log("receive " + name + " bin size: " + bin.length);

			bin[bin.length] = params.receiver;

			receivers[name] = bin; //reassign bin to receiver

			names[names.length] = name;
		}

		// save data to the key/value pair object setup before
		this.add = function (params) {

			var name = params.name;
			var id = params.id;

			var bin = receivers[name];

			for (i in bin) {

				bin[i][id] = params.data;
			}

		}

	}

	// save data to be retrieved later
	var save = function () {

		var self = this;

		// add data to an array to be retrieved later
		this.add = function (params) {

			var name = params.name;

			var bin;

			if (!checkArray(name, savedNames)) {

				bin = []; //create new receiver array for this name
			}
			else {
				bin = saved[name]; // retrieve existing receiver array for this name
			}

			//console.log("receive " + name + " bin size: " + bin.length);

			bin[bin.length] = params.data;

			saved[name] = bin; //reassign bin to receiver

			savedNames[savedNames.length] = name;

		}
		

		// retrieve the array of data
		this.get = function (params) {

			var name = params.name;

			var bin = saved[name];

			if (bin) {
				return bin;
			}

			return "none";

		}

	}

	

	obj.send_service = {
		back:new back(),
		save:new save()
	}




}(obj));









/***********************************************************************************
  
		Utility Module v4.0

		JavaScript library with no other dependencies	

		contains several general functions for

		device type identification
		a utility with common functions across any project
		

		Methods with Class, LLC, 2016


***********************************************************************************/



(function (obj) {

	// var mcshared = {};

	var desktop = "desktop";
	var mobile = "mobile";
	var ie = "internet explorer";

	var _mobile = false;

	// force the following checks to return true, render the mobile site on desktop for debugging purposes
	var forceMobile = function () {
		_mobile = true;
	}

	// blanket check for any mobile vs desktop user agent
	var checkMobile = function(forceMobile) {
		var check = false;
		(function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);

		return check || _mobile;
	}

	// distinguish between a few popular mobile user agents, desktop agents, and IE
	var whatDevice = function (forceMobile) {

		if (mcshared._mobile) return mobile;
		else if(navigator.userAgent.match(/Android/i) ||
	            navigator.userAgent.match(/webOS/i) ||
	            navigator.userAgent.match(/iPhone/i) ||
	            navigator.userAgent.match(/iPod/i) ||
	            navigator.userAgent.match(/iPad/i) ||
	            navigator.userAgent.match(/Blackberry/i) ) {

			return mcshared.mobile;
		}
		else if (navigator.userAgent.indexOf('Firefox') != -1 || navigator.userAgent.indexOf('Chrome') != -1 || navigator.userAgent.indexOf('Safari') != -1) {

			return mcshared.desktop;
		}
		else

			return mcshared.ie;

	}

	// wrapper for the above function
	var isMobile = function () {
		return checkMobile();
	}

	// wrapper for the above function
	var checkDevice = function () {
	 	return whatDevice();
	}

	// boolean check whether the device is in portait or lanscape view
	var isPortrait = function () {

		var width = $(window).width();
		var height = $(window).height();

		//console.log("width " + width + " height " + height);

		if (width < height) {
			return true;
		}

		return false;
	}

	// if you want to retrieve data from an object depending on state, name your keys "port" and "land", then call this function
	var getOrientation = function () {

		if (isPortrait()) {
			return {
				is:"port",
				isNot:"land"
			}
		}
		else {
			return {
				is:"land",
				isNot:"port"
			}
		}
	}

	var sum = function (array, $callback) {

		var sum = 0;

		var callback = function (value, index, array) {

			return value;
		}

		if ($callback) callback = $callback;

		for (var i in array) {

			sum += callback(array[i], i, array);
		}

		return sum;
	}

	var average = function (array, $callback) {

		var total = sum(array, $callback);

		return total/array.length;
	}

	var value = function (value, index, array) {
		return value;
	}

	var truncate = function (number, decimal) {
			
		var value = Math.floor(number*Math.pow(10, decimal))/Math.pow(10, decimal);
		
		return value;
	}

	var round = function (number, order) {

		var value = Math.round(number/order)*order;

		return value;
	}

	var resolveDigitString = function (digit) {
			
		if (digit < 10) {
			return "0" + digit;	
		}
		else {
			return "" + digit;	
		}
	}

	var last = function (array) {

    	return array[array.length-1];
	}

	var first = function (array) {

		return array[0];
	}

	var log = function(x, num) {
		return Math.log(x) / Math.log(num);
	}

	var exp = function (x) {

		return Math.exp(x);
	}

	var leadingzeros = function (number, zeros) {
			
		if (!zeros) zeros = 1;

		var digits = Math.floor(log(number*10, 10));
		var total = Math.floor(log(zeros, 10)) - digits;
		var leading = "";
		var i = 0;
		for (var i = 0; i <= total; i++) {
			leading += "0";
		}

		console.log(leading + digit);

		return leading + digit;
	}

	var shuffle = function (array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

	  	return array;
	}


	// standard sort algorithm
	var sort = function (array, which, key) {

        var temp;

        var check = which == "asc" ? ((key ? array[j][key] : array[j]) > (key ? array[i][key] : array[i])) : ((key ? array[j][key] : array[j]) < (key ? array[i][key] : array[i]))

        for (var i in array) {

            for (var j in array) {
                if (check) {
                    temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
            }
        }

        return array;

    }


	// generally solves a system of two linear equations of the form y = mx + b
	// inputs are two sets of y and x points, returns slope, m, and y = b when x = 0
	var linear = function (params) {

		var y1 = params.y1;
		var y2 = params.y2;
		var x1 = params.x1;
		var x2 = params.x2;
		var m;
		var b;

		if (x2 != x1) {
			m = (y2-y1)/(x2-x1);
			b = x1*m + y1;
		}
		else {
			m = 0;
			b = 0;
		}

		return {
			m:m,
			b:b
		}

	}

	var waitForElem = function (options, complete) {

        var count = 0;
        var result = false;
        var active = {}

        var checkElements = function (array) {

        	result = false;
        	active = {};

        	if (Array.isArray(array)) {

        		// console.log("###################\n\n\n\n\n\narray is array \n\n\n\n\n\n################")

        		for (var i in array) {

        			// console.log("element", array[i], "does not exist");

	        		if ($(array[i])[0]) {
	        			active[i] = true;
	        		}

        		}


	        	if (Object.keys(active).length >= array.length) {

	        		result = true;
	        	}
	        	else {
	        		result = false;
	        	}

        	}
        	else {

        		// console.log("@@@@@@@@@@@@@@@@\n\n\n\n\n\n\n\n\array is single\n\n\n\n\n\n@@@@@@@@@@@@@@")

        		if ($(array)[0]) {
        			// console.log("element does not exist");
        			result = true;
        		}
        		else {
        			result = false;
        		}

        	}

        	return result;
        }

        var waitTimer = setInterval(function () {

            if (checkElements(options.elems) || count >= 500) {

            	// console.log("clear interval");

                clearInterval(waitTimer);
                waitTimer = null;

                if (count < 500) {

                	// console.log("run complete");
                    
                    if (typeof complete === "function") complete(options);
                }
                else {

                	// console.log("count limit reached");
                }
                
            }
            else {

                count++;
            }

        }, 30);
    }

    // adjusts the size of the image (defined in the directive 'src') to always be bigger than the parent
	var fixInside = function (params) {

		var i = params.inside;
    	var s = params.space;
    	
    	var iw = i.width;
    	var ih = i.height;
    	var sw = s.width;
    	var sh = s.height;

    	var ar = iw/ih;

		var goodAspect = function (width, height) {
			if (Math.abs(iw/ih - ar) < 0.01) return true;
			return false;
		}

		var checkHeight = function ($h) {
	        if ($h < sh) return "under";
	        else if ($h > sh*1.2) return "over";
	        return "good";
	    }

	    var checkWidth = function ($w) {
	        if ($w < sw) return "under";
	        else if ($w > sw*1.2) return "over";
	        return "good";
	    }

        var h = space.height*1.2;
        var w = height*aspect;
        
        if (checkWidth(w) != "good") {
            w = sw*1.2;
            h = w/ar;
            if (checkHeight(h) == "under") {
                h = sh*1.2;
                w = h*ar;
            }
        }

        return {
        	width:w,
        	height:h
        }

    }

	obj.utility_service = {
		forceMobile:forceMobile,
		isMobile:isMobile,
		whatDevice:whatDevice,
		truncate:truncate,
		average:average,
		sum:sum,
		value:value,
		truncate:truncate,
		round:round,
		resolveDigitString:resolveDigitString,
		last:last,
		first:first,
		log:log,
		exp:exp,
		leadingzeros:leadingzeros,
		shuffle:shuffle,
		sort:sort,
		linear:linear,
		waitForElem:waitForElem,
		fixInside:fixInside
	}


}(obj));



try {
	window.shared = obj;
}
catch (e) {
	console.log(e.message);
}


try {
	module.exports = obj;
}
catch (e) {
	console.log(e.message);
}




