module.exports = {

	forEachO: function (obj, func) {
	  for(var i in obj) {
	    if(obj.hasOwnProperty(i)) {
	      func(i, obj[i]);
	    }
	  }
	},

	forEachA: function (arr, func) {
	  for(var i = 0; i<arr.length; i++) {
	    func(arr[i]);
	  }
	},

	getUnique: function (arr, func) {
	   var u = {}, a = [];
	   for(var i = 0, l = arr.length; i < l; ++i){
	      if(func(arr[i]) in u)
	         continue;
	      a.push(arr[i]);
	      u[arr[i]] = 1;
	   }
	   return a;
	},

	computeSimilarity: function (user1, user2) {
		var strcmp = function (a, b) {return a.localeCompare(b);};

		function computeNumerator(i, j, user1, user2) {
			if(i>=user1.length || j>=user2.length || user1[i] === undefined || user2[j] === undefined) {
				return 0;
			} else {
				if(user1[i].toLowerCase()===user2[j].toLowerCase()) {
					return 1 + computeNumerator(i+1, j+1, user1, user2);
				} else if(strcmp(user1[i].toLowerCase(), user2[j].toLowerCase()) < 0) {
					return computeNumerator(i+1, j, user1, user2);
				} else {
					return computeNumerator(i, j+1, user1, user2);
				}
			}
		};
		var num = computeNumerator(0, 0, user1.sort(strcmp), user2.sort(strcmp));
		var denom = Math.pow(user1.length, .5)*Math.pow(user2.length, .5);
		return (num/denom);
	},

	buildObject: function (arr) {
		var obj = {};
		for(var i =0; i<arr.length; i++) {
			obj[arr[i]] = '';
		}
		return obj;
	}

};