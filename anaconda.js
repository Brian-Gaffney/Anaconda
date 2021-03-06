var canvas;
var ctx;
var outputPanel;
var x = 250;
var y = 190;
var rightDown = false;
var leftDown = false;
var boost = false;
var anaconda = null;
var apples = [];
var anacondaTail = [];
var pause = false;
var death = false;

//Defined constant(ish) variables
var WIDTH;
var HEIGHT;
var SEGMENT_WIDTH = 1;
var SEGMENT_SIZE = 8;
var APPLE_SIZE = 10;
var APPLE_WIDTH = 2;
var APPLE_TOTAL = 5;
var APPLE_CHANCE = 0.005;
var ANACONDA_SPEED = 4;
var ANACONDA_BOOST_SPEED = 7;
var ANACONDA_NEW_SEGMENT = 800;
var INTERVAL = 25;
var DIRECTION_CHANGE_AMOUNT = 8;
var PI_180 = Math.PI/180;

function anacondaGameInit()
{
	outputPanel = $("#output-panel");
	canvas = $("#anaconda-canvas");
	WIDTH = canvas.width();
	HEIGHT = canvas.height();
	$(document).keydown(onKeyDown);
	$(document).keyup(onKeyUp);
	ctx = canvas[0].getContext("2d");										//Grab the 2D context
	createAnaconda();														//Create the anaconda

	draw();

	addApple();

	return setInterval(draw, INTERVAL);
}

function createAnaconda() {
	anaconda = new ob_anaconda();
}

function draw() {

	if(!pause && !death) {
		ctx.setTransform(1,0,0,1,0,0);											//Reset to identity
		ctx.clearRect(0,0,WIDTH, HEIGHT);										//Clear the canvas
		updateOutputPanel();													//Update the ouput panel
		var rand = Math.random();

		//Randomly create an apple APPLE_CHANCE of the time provided the field isn't full of apples
		if (apples.length < APPLE_TOTAL && rand < APPLE_CHANCE) {
			addApple();
		}

		//Draw each apple, collision detect, then move it
		ctx.strokeStyle = 'red';
		$.each(apples, function(index, apple) {

			if(apple) { //Make sure the apple really exists

				ctx.lineWidth   = APPLE_WIDTH;

				//Draw
				ctx.beginPath();
				ctx.moveTo(apple.x - (APPLE_SIZE/2), apple.y - (APPLE_SIZE/2));
				ctx.lineTo(apple.x + (APPLE_SIZE/2), apple.y + (APPLE_SIZE/2));

				ctx.moveTo(apple.x + (APPLE_SIZE/2), apple.y - (APPLE_SIZE/2));
				ctx.lineTo(apple.x - (APPLE_SIZE/2), apple.y + (APPLE_SIZE/2));
				ctx.closePath();
				ctx.stroke();

				//Collision detect walls
				if (apple.x + apple.dx > WIDTH || apple.x + apple.dx < 0)
					apple.dx = -apple.dx;
				if (apple.y + apple.dy > HEIGHT || apple.y + apple.dy < 0)
					apple.dy = -apple.dy;


				//Collision with anaconda mouth - Chomp
				ax = apple.x;
				ay = apple.y;
				fuzz = 15;
				if(anaconda.x < (ax + fuzz) && anaconda.x > (ax - fuzz) ) {
					if (anaconda.y < (ay + fuzz) && anaconda.y > (ay - fuzz) ) {

						//Remove the apple
						apples.splice(index, 1);

						//Add another segment to the anaconda
						anacondaTail.push(new ob_anacondaSegment(anaconda.x,anaconda.y,0,0,anaconda.direction));
					}
				}

				//Move
				apple.x += apple.dx;
				apple.y += apple.dy;
			}
		});


		/*
		 *
		 * Draw the anaconda
		 *
		*/

		//Draw each snake segment
		$.each(anacondaTail, function(index, segment) {

			ctx.setTransform(1,0,0,1,0,0);		//Reset to identity
			ctx.translate(segment.x,segment.y);	//Move to the centre of the segment

			seg_size = SEGMENT_SIZE;
			//Make the tail taper to a point
			if(index <= 4 ) {
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
			}

			ctx.lineWidth = SEGMENT_WIDTH;

			//Draw the leading edge
			ctx.strokeStyle = 'blue';
			ctx.rotate(segment.direction*(PI_180));
			ctx.moveTo(0,-seg_size);
			ctx.lineTo(0,seg_size);

			ctx.strokeStyle = 'green';
			//Draw the lines to the previous segment
			if(index !== 0) {
				anacondaTail[index].width = seg_size;

				//Left edge
				ctx.setTransform(1,0,0,1,0,0);									//Reset to identity
				ctx.translate(anacondaTail[index-1].x,anacondaTail[index-1].y);	//Move to the centre of the segment
				ctx.rotate(anacondaTail[index-1].direction*(PI_180));
				ctx.lineTo(0,anacondaTail[index-1].width);

				//Right edge
				ctx.setTransform(1,0,0,1,0,0);							//Reset to identity
				ctx.translate(segment.x,segment.y);						//Move to the centre of the segment
				ctx.rotate(segment.direction*(PI_180));
				ctx.moveTo(0,-seg_size);
				ctx.setTransform(1,0,0,1,0,0);									//Reset to identity
				ctx.translate(anacondaTail[index-1].x,anacondaTail[index-1].y);	//Move to the centre of the segment
				ctx.rotate(anacondaTail[index-1].direction*(PI_180));
				ctx.lineTo(0,-seg_size);
			}
		});
		ctx.stroke();

		ctx.setTransform(1,0,0,1,0,0);	//Reset to identity

		//Detect if left/right are pressed and rotate anaconda as needed
		if (rightDown) {
			anaconda.direction += DIRECTION_CHANGE_AMOUNT;
		}
		else if (leftDown) {
			anaconda.direction -= DIRECTION_CHANGE_AMOUNT;
		}
		if(anaconda.direction > 360) {
			anaconda.direction -= 360;
		}
		if(anaconda.direction< 0) {
			anaconda.direction += 360;
		}

		//Detect boost mode
		speed = ANACONDA_SPEED;
		if(boost) {
			speed = ANACONDA_BOOST_SPEED;
		}

		angleInRadians = anaconda.direction * Math.PI / 180;
		facingX = Math.cos(angleInRadians);
		facingY = Math.sin(angleInRadians);

		anaconda.dx = speed * facingX;
		anaconda.dy = speed * facingY;


		//Mark the centre of the anaconda head
		if(anacondaTail.length > 0) {
			ctx.strokeStyle = 'white';
			ctx.setLineWidth(5);
			ctx.strokeRect(anaconda.x, anaconda.y, 1, 1);
			ctx.lineWidth  = SEGMENT_WIDTH;
		}

		//Collision detect the anaconda
		//Collision with wall
		if(anaconda.x < 0 || anaconda.x > WIDTH || anaconda.y < 0 || anaconda.y > HEIGHT) {
			death = true;
		}

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

		ctx.rotate(anaconda.direction*(PI_180));

		//Draw the leading edge
		ctx.strokeStyle = 'green';
		ctx.beginPath();
		ctx.moveTo(0,-SEGMENT_SIZE);
		ctx.lineTo(0,SEGMENT_SIZE);
		ctx.stroke();

		//Draw the line from the head to the first segment
		if(anacondaTail.length > 0) {
			//Left edge 1
			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anacondaTail[anacondaTail.length - 1].x,anacondaTail[anacondaTail.length - 1].y);	//Move to the centre of the segment
			ctx.rotate(anacondaTail[anacondaTail.length - 1].direction*(PI_180));
			ctx.moveTo(0,SEGMENT_SIZE);

			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.lineTo(8,SEGMENT_SIZE + 6);

			//Left edge 2
			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.lineTo(20,SEGMENT_SIZE - 3);

			//Right edge 1

			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anacondaTail[anacondaTail.length - 1].x,anacondaTail[anacondaTail.length - 1].y);	//Move to the centre of the segment
			ctx.rotate(anacondaTail[anacondaTail.length - 1].direction*(PI_180));
			ctx.moveTo(0,-SEGMENT_SIZE);

			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction - 2)*(PI_180));
			ctx.lineTo(8,-SEGMENT_SIZE - 6);

			//Right edge 2
			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction - 2)*(PI_180));
			ctx.lineTo(20,SEGMENT_SIZE - 15);

			//Join left 1 and right 1
			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.moveTo(8,SEGMENT_SIZE + 6);

			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.lineTo(8,-SEGMENT_SIZE - 6);

			//Join left 2 and right 2
			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.moveTo(20,SEGMENT_SIZE - 17);

			ctx.setTransform(1,0,0,1,0,0);
			ctx.translate(anaconda.x,anaconda.y);
			ctx.rotate((anaconda.direction + 2) * (PI_180));
			ctx.lineTo(20,SEGMENT_SIZE - 3);
		}

		ctx.stroke();
	}
}

function updateOutputPanel() {
	outputPanel.html(anaconda.direction + ' &#186; | ' + Math.round(anaconda.x) + ':' + Math.round(anaconda.y) + ' | ' + Math.round(anaconda.dx) + ':' + Math.round(anaconda.dy));
}

function addApple() {
	apples.push(new ob_apple());
}

function onKeyDown(evt) {
	switch(evt.keyCode) {
		case 39:
			rightDown = true;
			break;
		case 37:
			leftDown = true;
			break;
		case 32:
		case 38:
			boost = true;
			break;
		case 80:
			pause = !pause;
	}
}

function onKeyUp(evt) {

	switch(evt.keyCode) {
		case 39:
			rightDown = false;
			break;
		case 37:
			leftDown = false;
			break;
		case 32:
		case 38:
			boost = false;
	}
}


/***
 *
 * Define objects
 *
 ***/

function ob_anaconda() {
	this.x = 150;
	this.y = 80;
	this.dx = 0;
	this.dy = 1;
	this.direction = 0;
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
	this.dx = randomnumber=Math.floor(Math.random()*5) -5;
	this.dy = randomnumber=Math.floor(Math.random()*5) -5;
}