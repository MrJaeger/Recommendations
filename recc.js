var mongoat = require('mongoat')(/* Where db info would go */);
var helper = require('./helper.js');

var timeStamp  = new Date().getTime() - .2*24*60*60*1000;

mongoat.db.open(function(e, client){
	var time = mongoat.get_object_id(null, client, timeStamp);
	var handlesToBroadcasts = {};
	var broadcastsToHandles = {};
	var threshold = 0.1;
	var reccHandle;

	var recent_query_opts = {
		collection: 'broadcasts',
		params: {_id: {'$gte': time}},
		fields: {video_id_at_provider: 1, video_originator_user_nickname: 1}
	};

	var get_final_reccomendations = function (broadcasts) {
		var finalRecs = [];
		helper.forEachO(broadcasts, function (field, prop) {
			var sum = 0;
			var from = [];
			helper.forEachA(prop, function (handle) {
				from.push(handle['id']);
				sum+=handle['score'];
			});
			if(sum !== 0) {
				finalRecs.push({id: field, score: Math.log(broadcastsToHandles[field].length+10)*sum, shared_by: from});
			}
		});
		finalRecs.sort(function (a,b) {return b.score-a.score});
		console.log("Got reccomendations for: ", reccHandle, "the top one is", finalRecs[0].id, "which was brought to you by", finalRecs[0].shared_by);
	}

	var get_possible_reccomendations = function (simHandles) {
		var broadcasts = {};
		var bCount = 0;
		var ourHandleBroadcasts = helper.buildObject(handlesToBroadcasts[reccHandle]);
		helper.forEachA(simHandles, function (handle) {
			helper.forEachA(handle['videos'], function (broadcast) {
				if(!(broadcast in ourHandleBroadcasts)) {
					//console.log("H",handle['id'],"S", handle['score'], "Broadcast",broadcast);
					bCount++;
					if(broadcasts[broadcast] === undefined) {
						broadcasts[broadcast] = []
					}
					broadcasts[broadcast].push({id: handle['id'], score: handle['score']});
				}
			});
		});
		if(bCount !== 0) {
			//console.log("Handle", reccHandle, "Broadcasts: ", broadcasts);
			get_final_reccomendations(broadcasts);
		}
	}

	var filter_users = function(possibleSimHandles) {
		var simHandles = [];
		helper.forEachA(possibleSimHandles, function (handle) {
			var sim = helper.computeSimilarity(handlesToBroadcasts[reccHandle], handlesToBroadcasts[handle]);
			if(sim>=threshold && sim < 1) {
				simHandles.push({id: handle, score: sim, videos: handlesToBroadcasts[handle]});
			}
		});
		if(simHandles.length !== 0) {
			get_possible_reccomendations(simHandles);
		}
	}

	var get_possible_sim_handles = function() {
		var possibleSimHandles = [];
		helper.forEachA(handlesToBroadcasts[reccHandle], function (broadcast) {
			helper.forEachA(broadcastsToHandles[broadcast], function (handle) {
				if(handle !== reccHandle)
					possibleSimHandles.push(handle);
			});
		});
		possibleSimHandles = helper.getUnique(possibleSimHandles, function (a){return a;});
		if(possibleSimHandles.length !== 0) {
			filter_users(possibleSimHandles);
		}
	}

	var recent_query_cb = function(e, docs) {
		console.log(docs.length);
		if (e){
          console.error('FAIL: bad query', e, docs);
          process.exit();
        }
        var undef = 0;
        helper.forEachA(docs, function(broadcast) {
        	var handle = broadcast.video_originator_user_nickname;
        	var video = broadcast.video_id_at_provider;
        	if(video === undefined || handle === undefined) {
        		undef++;
        		return;
        	}
        	var hA = handlesToBroadcasts[handle];
        	var vA = broadcastsToHandles[video];
        	if(hA === undefined) {
        		hA = [];
        	}
        	hA.push(video);
        	hA = helper.getUnique(hA, function (a){return a;});
        	if(vA === undefined) {
        		vA = [];
        	} 
        	vA.push(handle);
        	vA = helper.getUnique(vA, function (a){return a;});
        	handlesToBroadcasts[handle] = hA;
        	broadcastsToHandles[video] = vA;
        });
        console.log("DB STUFF DONE");
        //console.log(handlesToBroadcasts[reccHandle]);
        helper.forEachO(handlesToBroadcasts, function (handle, broadcasts) {
        	reccHandle = handle;
        	get_possible_sim_handles();
        })
	};

	mongoat.do_query(client, recent_query_opts, recent_query_cb);
});
