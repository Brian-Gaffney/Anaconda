	var canvas;
	var ctx;
	var outputPanel;
	var x = 250;
	var y = 190;
	var rightDown = false;
	var leftDown = false;
	var anaconda = null;
	var apples = [];
	var anacondaTail = [];

	//Defined constant(ish) variables
	var WIDTH;
	var HEIGHT;
	var SEGMENT_WIDTH = 1;
	var SEGMENT_SIZE = 8;
	var APPLE_SIZE = 10;
	var APPLE_WIDTH = 2;
	var APPLE_TOTAL = 5;
	var APPLE_CHANCE = 0.005;
	var ANACONDA_SPEED = 5;
	var ANACONDA_NEW_SEGMENT = 800;
	var INTERVAL = 40;
	var DIRECTION_CHANGE_AMOUNT = 8;

	function anacondaGameInit()
	{
		outputPanel = $("#output-panel");
		canvas = $("#anaconda-canvas");
		WIDTH = canvas.width();
		HEIGHT = canvas.height();
		$(document).keydown(onKeyDown);
		$(document).keyup(onKeyUp);
		ctx = canvas[0].getContext("2d"); 										//Grab the 2D context
		createAnaconda(); 														//Create the anaconda
		
		draw();
		
		addApple();
		
		return setInterval(draw, INTERVAL);
	}

	function createAnaconda() {
		anaconda = new ob_anaconda();
	}

	function draw() {
		ctx.setTransform(1,0,0,1,0,0); 											//Reset to identity
		ctx.clearRect(0,0,WIDTH, HEIGHT);										//Clear the canvas
		updateOutputPanel(); 													//Update the ouput panel
		var rand = Math.random();
		
		//Randomly create an apple APPLE_CHANCE of the time provided the field isn't full of apples
		if (apples.length < APPLE_TOTAL && rand < APPLE_CHANCE) {
			addApple();
		}

		//Draw each apple, collision detect, then move it
		$.each(apples, function(key, apple) {
			ctx.lineWidth   = APPLE_WIDTH;
			ctx.strokeStyle = 'red';

			//Draw
			ctx.beginPath();
			ctx.moveTo(apple.x - (APPLE_SIZE/2), apple.y - (APPLE_SIZE/2));
			ctx.lineTo(apple.x + (APPLE_SIZE/2), apple.y + (APPLE_SIZE/2));
			
			ctx.moveTo(apple.x + (APPLE_SIZE/2), apple.y - (APPLE_SIZE/2));
			ctx.lineTo(apple.x - (APPLE_SIZE/2), apple.y + (APPLE_SIZE/2));
			ctx.closePath();
			ctx.stroke();

			//Collision detect
			if (apple.x + apple.dx > WIDTH || apple.x + apple.dx < 0)
				apple.dx = -apple.dx;
			if (apple.y + apple.dy > HEIGHT || apple.y + apple.dy < 0)
				apple.dy = -apple.dy;

			//Move
			apple.x += apple.dx;
			apple.y += apple.dy;
		});


		/*
		 *
		 * Draw the anaconda
		 *
		*/

			//Draw each snake segment
			$.each(anacondaTail, function(index, segment) {
					ctx.setTransform(1,0,0,1,0,0); 								//Reset to identity
					ctx.translate(segment.x,segment.y);							//Move to the centre of the segment


					seg_size = SEGMENT_SIZE;
					//Make the tail taper to a point
					switch(index) {
						case 4:
							seg_size -= 1;
							break;

						case 3:
							seg_size -= 2;
							break;

						case 2:
							seg_size -= 4;
							break;

						case 1:
							seg_size -= 6;
							break;

						case 0:
							seg_size -= 8;
							break;
					}


					//Mark the centre of each segment
//					ctx.strokeStyle = 'white';
//					ctx.setLineWidth(5);
//					ctx.strokeRect(0, 0, 1, 1);


					ctx.lineWidth = SEGMENT_WIDTH;

					//Draw the leading edge
					ctx.strokeStyle = 'green';
					ctx.rotate(segment.direction*(Math.PI/180));
					ctx.moveTo(0,-seg_size);
					ctx.lineTo(0,seg_size);


					//Draw the lines to the previous segment
					if(index != 0) {
						anacondaTail[index].width = seg_size;

						//Left edge
						ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
						ctx.translate(anacondaTail[index-1].x,anacondaTail[index-1].y);	//Move to the centre of the segment
						ctx.rotate(anacondaTail[index-1].direction*(Math.PI/180));
						ctx.lineTo(0,anacondaTail[index-1].width);

						//Right edge
						ctx.setTransform(1,0,0,1,0,0); 							//Reset to identity
						ctx.translate(segment.x,segment.y);						//Move to the centre of the segment
						ctx.rotate(segment.direction*(Math.PI/180));
						ctx.moveTo(0,-seg_size);
						ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
						ctx.translate(anacondaTail[index-1].x,anacondaTail[index-1].y);	//Move to the centre of the segment
						ctx.rotate(anacondaTail[index-1].direction*(Math.PI/180));
						ctx.lineTo(0,-seg_size);
					}
			});
			ctx.stroke();


			ctx.setTransform(1,0,0,1,0,0); 	//Reset to identity

			//Detect if left/right are pressed and rotate anaconda as needed
			if (rightDown) {
				anaconda.direction -= DIRECTION_CHANGE_AMOUNT;
			}
			else if (leftDown) {
				anaconda.direction += DIRECTION_CHANGE_AMOUNT;
			}
			if(anaconda.direction > 360) {
				anaconda.direction -= 360;
			}
			if(anaconda.direction< 0) {
				anaconda.direction += 360;
			}

			angleInRadians = anaconda.direction * Math.PI / 180;
			facingX = Math.cos(angleInRadians);
			facingY = Math.sin(angleInRadians);

			anaconda.dx = ANACONDA_SPEED * facingX;
			anaconda.dy = ANACONDA_SPEED * facingY;

			//Collision detect the anaconda
			//Collision with wall
			if(anaconda.x < 0 || anaconda.x > WIDTH || anaconda.y < 0 || anaconda.y > HEIGHT) {
				//alert('DEATH');
			}

			//Mark the centre of the anaconda head
			ctx.strokeStyle = 'white';
			ctx.setLineWidth(5);
			ctx.strokeRect(anaconda.x-0.5, anaconda.y-0.5, 1, 1);
			ctx.lineWidth   = SEGMENT_WIDTH;
			ctx.strokeStyle = 'green';
			ctx.translate(anaconda.x,anaconda.y);

			//Move the anaconda
			anaconda.x += anaconda.dx;
			anaconda.y += anaconda.dy;
			anaconda.distance += anaconda.x > anaconda.y ? anaconda.x : anaconda.y;

			//Add new segements once the anaconda has moved a certain distance
			if(anaconda.distance >= ANACONDA_NEW_SEGMENT) {
				anaconda.distance = 0;
				anacondaTail.push(new ob_anacondaSegment(anaconda.x,anaconda.y,0,0,anaconda.direction));

				//Remove the anaconda tail as it grows
				if (anacondaTail.length > anaconda.length) {
					anacondaTail.splice(0,1);
				}
			}

			ctx.rotate(anaconda.direction*(Math.PI/180));

			//Draw the leading edge
			ctx.beginPath();
			ctx.moveTo(0,-SEGMENT_SIZE);
			ctx.lineTo(0,SEGMENT_SIZE);
			ctx.stroke();


			//Draw the line from the head to the first segment
			if(anacondaTail.length > 0) {
				//Left edge
				ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
				ctx.translate(anaconda.x,anaconda.y);
				ctx.rotate(anaconda.direction*(Math.PI/180));
				ctx.moveTo(2,SEGMENT_SIZE);

				ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
				ctx.translate(anacondaTail[anacondaTail.length - 1].x,anacondaTail[anacondaTail.length - 1].y);	//Move to the centre of the segment
				ctx.rotate(anacondaTail[anacondaTail.length - 1].direction*(Math.PI/180));
				ctx.lineTo(0,SEGMENT_SIZE);


				//Right edge
				ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
				ctx.translate(anaconda.x,anaconda.y);
				ctx.rotate(anaconda.direction*(Math.PI/180));
				ctx.moveTo(2,-SEGMENT_SIZE);

				ctx.setTransform(1,0,0,1,0,0); 									//Reset to identity
				ctx.translate(anacondaTail[anacondaTail.length - 1].x,anacondaTail[anacondaTail.length - 1].y);	//Move to the centre of the segment
				ctx.rotate(anacondaTail[anacondaTail.length - 1].direction*(Math.PI/180));
				ctx.lineTo(0,-SEGMENT_SIZE);
			}
			ctx.stroke();
	}

	function updateOutputPanel() {
		outputPanel.html('Anaconda: ' + anaconda.direction + ' - ' + anaconda.x + ':' + anaconda.y + ' - ' + anaconda.dx + ':' + anaconda.dy);
	}

	function addApple() {
		apples.push(new ob_apple());
	}
	
	function onKeyDown(evt) {
		if (evt.keyCode == 39)
			rightDown = true;
		else if (evt.keyCode == 37)
			leftDown = true;
	}
	
	function onKeyUp(evt) {
		if (evt.keyCode == 39)
			rightDown = false;
		else if (evt.keyCode == 37)
			leftDown = false;
	}




/***
 *
 * Define objects
 *
 ***/

function ob_anaconda() {
	this.x = 30;
	this.y = 30;
	this.dx = 0;
	this.dy = 1
	this.direction = 90;
	this.length = 15;
	this.distance = 0;
}

function ob_anacondaSegment(x, y, dx,dy, direction){
	// console.log('New anaconda segment: x:y=' + this.x + ':' + this.y + ' dx:dy= ' +this.x + ':' + this.y);
	this.x = typeof(x) != 'undefined' ? x : null;
	this.y = typeof(y) != 'undefined' ? y : null;
	this.direction = typeof(direction) != 'undefined' ? direction : null;
	this.width = SEGMENT_SIZE;
}

function ob_apple() {
	// console.log('New apple created');
	this.x = randomnumber=Math.floor(Math.random()*WIDTH);
	this.y = randomnumber=Math.floor(Math.random()*HEIGHT);
	this.dx = randomnumber=Math.floor(Math.random()*11) -5;
	this.dy = randomnumber=Math.floor(Math.random()*11) -5;
}






