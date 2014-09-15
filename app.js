// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// PeerJS object
var peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3});

peer.on('open', function() {
	$('#my-id').text(peer.id);
});

// Receiving a call
peer.on('call', function(call) {
	// Answer the call automatically (instead of prompting user) for demo purposes
	call.answer(window.localStream);
	step3(call);
});

// Reciving a data
peer.on('connection', function(conn) {
	init(conn);
});

peer.on('error', function(err) {
	alert(err.message);
	// Return to step 2 if error occurs
	step2();
});

// Click handlers setup
$(function() {
	$('#make-call').click(function() {
	  	// Initiate a call!
	  	var call = peer.call($('#callto-id').val(), window.localStream);
	  	step3(call);

	  	var conn = peer.connect($('#callto-id').val());
	  	init(conn);
	});
	$('#end-call').click(function() {
		window.existingCall.close();
		step2();
	});
	// Retry if getUserMedia fails
	$('#step1-retry').click(function() {
		$('#step1-error').hide();
		step1();
	});
	// Get things started
	step1();
});

function init(conn) {
	var PINK = 'rgb(239, 117, 188)';
	var GLAY = 'rgb(76, 76, 76)';

	var mylay = $('#my-video-overlay');
	var tvlay = $('#their-video-overlay');
	var tvctx = tvlay[0].getContext('2d');
	tvlay[0].getContext('2d').strokeStyle = GLAY;

	tvlay.mousemove(function(e) {
		var rect = e.target.getBoundingClientRect();
		var ctx  = tvlay[0].getContext('2d');

		var posX = e.clientX - rect.left;
		var posY = e.clientY - rect.top;
		draw(tvlay[0], posX, posY, ctx.strokeStyle);

		$('#posx').text(posX);
		$('#posy').text(posY);

		var data = {
			"posX": posX,
			"posY": posY,
			"color": ctx.strokeStyle
		}
		conn.send(data);
	});

	tvlay.mousedown(function(e) {
		var canvas = tvlay[0];
		ctx = canvas.getContext('2d');
		ctx.strokeStyle = PINK;
	});

	tvlay.mouseup(function(e) {
		var canvas = tvlay[0];
		ctx = canvas.getContext('2d');
		ctx.strokeStyle = GLAY;
	});

	tvlay.mouseout(function(e) {
		tvlay.unmousedown();

		var canvas = tvlay[0];
		ctx = canvas.getContext('2d');
		ctx.strokeStyle = GLAY
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		conn.send({"posX": -100, "posY": -100, "color": GLAY});
	});

	conn.on('open', function() {
		// Receive messages
		conn.on('data', function(data) {
			console.log('Received', data);
			draw(mylay[0], data.posX, data.posY, data.color);
		});
	});

	function draw(canvas, x, y, color) {
		ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.arc(x/2.0, y/2.0, 10, 0, Math.PI*2, false);
		ctx.stroke();
	}
}

function step1 () {
	// Get audio/video stream
	navigator.getUserMedia({audio: true, video: true}, function(stream) {
	  	// Set your video displays
	  	$('#my-video').prop('src', URL.createObjectURL(stream));
	  	window.localStream = stream;
	  	step2();
	  }, function(){ $('#step1-error').show(); });
}

function step2 () {
	$('#step1, #step3').hide();
	$('#step2').show();
}

function step3 (call) {
	// Hang up on an existing call if present
	if (window.existingCall) {
		window.existingCall.close();
	}
	// Wait for stream on the call, then set peer video display
	call.on('stream', function(stream) {
		$('#their-video').prop('src', URL.createObjectURL(stream));
	});

	// UI stuff
	window.existingCall = call;
	$('#their-id').text(call.peer);
	call.on('close', step2);
	$('#step1, #step2').hide();
	$('#step3').show();
}

