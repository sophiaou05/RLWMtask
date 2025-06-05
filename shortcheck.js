var experimentName = 'Visuomotor learning';
var experimentVersion = 'v1.0'; // short version name (logged on every trial)
var experimentNotes = '13 iterations'; // details about the study (logged in experiment-level data)

var subjectID;
//instruction
var numInstr;
var instrInd = 0; // instruction to start at
var read_ins_duration = 3000;
var enableInstrButtons = true; // for animating the showing/hiding of instructions screen buttons

var startMoveTime; //time when participant begins reaching
var endMoveTime; //Time when trial ends
var display_scene_time; // when the restart/start screen (center disk) was shown
var display_target_time; // when the red target displayed
var display_timeout_duration = 2500; // how long to show "Too Slow" before moving to the next trial
var centerEntryTime = null;
var clickedToStart = false;
var reachDeadlineID = null;


const frameOffsetY = 200;
const frameYOffset = frameOffsetY - 80;

const maxPoints = 10;
const penaltyPerStep =2;
const stepSizeDeg = 5;
const maxAllowedAngle = 30;

// Preload images
var allImages = {};
var totalImages = 18 * 6;
var imagesLoaded = 0;

// Prepare an array to track when all are loaded
var readyToStart = false;
var tfReady = false;
var tfData;

function tryStartExperiment() {
  if (readyToStart && tfReady) {
    console.log("Starting experiment: tf + images ready");
    processTrialData(tfData);
    introRoutines();
  }
}


for (let folder = 1; folder <= 18; folder++) {
  allImages['images' + folder] = [];

  for (let imgNum = 1; imgNum <= 6; imgNum++) {
    let img = new Image();
    img.src = `image/images${folder}/image${imgNum}.png`; 

    img.onload = function() {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        console.log('All images loaded!');
        readyToStart = true;
        tryStartExperiment();
      }
    };

    img.onerror = function() {
      console.error(`Failed to load image: image/images${folder}/image${imgNum}.png`);
    };

    allImages['images' + folder].push(img);
  }
}


fetch('helper_files/trim1234.json')
  .then(response => response.json())
  .then(data => {
    tfData = data;
    tfReady = true;
    tryStartExperiment();
  })
  .catch(error => {
    console.error("Error loading json:", error);
  });


const //block of constant variable definitions, variable cant be changed later
  frameSize = 500;
  MOVE_SCALE = 1, //scales the mouse movement distance , set to 1 -- no scaling


	n_cells_x   = 45,
	n_cells_y   = 45, // number of grid cells in x and y directions


	circular_frame_radius =  Math.floor(n_cells_x/2)+1, //radius of the circular workspace area, half of n_cells_x, rounds down and add 1 -- 23 grid cells

	canvas_approx_width = 800,
	canvas_approx_height = 800, //approximate size of the canvas, both are to 800 pixels

	cell_width  = Math.floor(canvas_approx_width/n_cells_x), //pixel width of each grid cell, divides the 800-pixel canvas by 45 grid cells, 17-18 pixels per cell
  targetSize = 1.5, //size multiplier for the red square target, w and h will be 1.5 times the grid cell width

	//canvas_width  = cell_width * n_cells_x, // total w of the canvas in pixels, abt 765-800 pixels
	//canvas_height = cell_width * n_cells_x, // total height, canvas is square

	center_x = Math.floor(n_cells_x/2), // center cell coordinates in the grid; takes half the number of cells: 45/2 to 22, center cell at grid is (22,22)
	center_y = Math.floor(n_cells_y/2), // when drawing yellow center disk or targets, these are the starting positions

	pi 			 = Math.PI, //define pi
	center_circle_radius	 = cell_width/2, // radius of the starting center circle, in pixels, since the center disk is usually one grid cell wide, radius is half cell_wifth
	frames_per_change = 6

  var window_innerwidth
  var window_innerheight //store window's widtg and height in pixels, later used to adjust for different screen sizes
  var canvas_center_x;
  var canvas_center_y; // store pixel coordinates of the center of the canvas; center_x & y are grid coordinates, these will be pixel positions for accurate drawing

  var raw_x=0;
  var raw_y=0; // track raw movement position of the cursor relative to the canvas center; set to 0 so that starting position is at center
  var cursor_posX;
  var cursor_posY; // store current position of the cursor on the canvas, updated every time the mouse moves
  var smallSquareX;
  var smallSquareY; //store pixel coordinates of the target (red square) for current trial, calculated based on target angle and circular radius in drawTarget() function


  var reaching = false; //track whether participant is currently reaching toward the target; set to true during the reach phase of each trial
  var restarting = false; // track whether the task is in the restart/start phase: when they move the cursor to the center circle to begin a trial
  var ready = false; // track whetehr people are correctly positioned in the center and ready to start a reach
  var noFeedback = false; //control wheterh visual fb is provided during trials, when true, people dont see the results of their actions (during testing phase to assess learning without fb)
  var processReminder=false; // control whether to display instructional reminders between blocks/phases; true when instructions reminders should be shown and waits for spacebar press before continuing
  var trialCompleted = false; //track whether current trial has ended, prevents the same trial from ending multiple times if the cursor crosses the target or boundary more than once
  var recordedStartTime = false; //tracks  whether the start time of the movement has been recorded, ensures movement timing is only captured once

  var totalScore = 0;
  var responses = {}; // store all data collected during the experiment 
  var allTrials = []; //array that holds the trial sequence info, populated later by the generateTrial() func
  var nTrials = nTrials;
  var curTrial = -1; //index of current trial, when first trial starts becomes 0
  var nBaseTrials = 40; 
  var nLearnTrials = 120;
  var nTestTrials = 40;

  var mouse_x = []; //array to store the X coordinates of the mouse as people move, everytime the mouse position updates, current X position will be added to this array, once ended, contain full trajectory of the cursor's horizontal movmeent
  var mouse_y = [];
  var time_points = []; //store timestamps corresponding to each mouse position sample,



function processTrialData(tf) {
  allTrials = [];

  for (let block = 0; block < tf.ns.length; block++) {
    let ns = tf.ns[block];
    let setNum = tf.stim_set[block];
    let stimuli = tf.stimuli[block];
    let angles = tf.angle_mapping[block];
    let seq = tf.seq[block];

    for (let t = 0; t < seq.length; t++) {
      let stimIdx = seq[t] - 1;
      let imgNum = stimuli[stimIdx];
      let targetAng = angles[stimIdx];

      allTrials.push({
        block: block+1,
        trial: t+1,
        folder: setNum,
        image: imgNum,
        target_angle: targetAng,
        ns: ns

      });
    }
  }

 nTrials=allTrials.length;
}


// resize canvas
function resize() {

	reach_canvas.width = canvas_width;
	reach_canvas.height = canvas_height;
  reset_canvas.width = canvas_width;
  reset_canvas.height = canvas_height;
  

  canvas_center_x = canvas_width/2;
  canvas_center_y = canvas_height/2; //calculate the pixel coordinates for the exact center of the canvas, draw center disk, rotate movement coord, position targets


} // set canvas sizes and update the center coordinates whenever the exp starts, sets the w and h for reach_camvas amd reset_canvas

function squareIt(number) {
	return number * number;
 } // use later for distanc calcuylations, square diff between x and y coord

function getDistance(x1, y1, x2, y2) {
	return Math.sqrt(squareIt(x1-x2) + squareIt(y1 - y2));
} // straight line distance between two points, check how far the mouse is from center, if cursor has entered the targ, enforce movement boundaries



function mouseEvtHandler2(e) {
  if (!trialCompleted && performance.now() - display_target_time > 2000) {
    trialCompleted = true;
    reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
    showTooSlow();
    return;
  }
    timestamp = e.timeStamp; //records the time when mouse movement happened, for reconstructing movement time course

    var dx = e.movementX* MOVE_SCALE;
    var dy = e.movementY* MOVE_SCALE; //how far the mouse moved since last mouse event in pixels, multiplies both by MOVE_SCALE (set to 1 earlier)

    // Update raw coordinates based on rotated values
    raw_x += dx; //update the raw cursor position by adding the rotated movement to the previous position
    raw_y += dy;  //raw_x and raw_y are accumulated positions relative to the canvas center


    cursor_posX = raw_x+canvas_center_x;  // now both contain the current cursor position in pixels, ready for drawing
    cursor_posY = raw_y+canvas_center_y + frameYOffset;  //converts the raw coordinates (relative to center) back to absolute canvas coordinates

    mouse_x.push(cursor_posX)
    mouse_y.push(cursor_posY)  //adding the current cursor X and Y positions to the movement trajectory arrays (mouse_x and mouse_y), save the full path of the movement for later 
    time_points.push(timestamp-startMoveTime); // current time - time when reach began, add this to the time_points array so that each xy position has a matching timestamp



    requestAnimationFrame(updateReach); //updateReach likely redraw the cursor target and possibly updates bg brightness

    const withinTarget = getDistance(
      cursor_posX, cursor_posY,
      smallSquareX + cell_width / 2,
      smallSquareY + cell_width / 2
    ) <= cell_width;
  

    //var withinTarget = Math.sqrt(Math.pow(cursor_posX - (smallSquareX+cell_width/2), 2) + Math.pow(cursor_posY - (smallSquareY+cell_width/2), 2)) <= cell_width; 
    //calculate distance between cursor and center of the target: smallSquareX/Y +cell_width/2 -> x and y coord of the center of the target; check if dist is less or equal to the size of the cell (cell_width), which means curosr is inside the target square

    if (withinTarget){
      endMoveTime = currentTime(); //record the time when the reach ended
      if (endMoveTime-startMoveTime<100){ 
        showTooFast();
        return;
      } // if movement faster than 100 ms, invalid

      // --- Angular Scoring Logic ---

      const dx = cursor_posX - canvas_center_x;
      const dy = cursor_posY - (canvas_center_y + frameYOffset); 
      let reachAngle = Math.atan2(dy, dx) * (180 / Math.PI); //radians to degrees
      if (reachAngle < 0) reachAngle += 360;

      const desiredAngle = trialInfo ['adjusted_target_angle'];
      let angleDiff = Math.abs(reachAngle - desiredAngle);
      if (angleDiff > 180) angleDiff = 360 -angleDiff;

      let earnedPoints = 0;

      if (angleDiff <=  maxAllowedAngle) {
       const step = Math.floor ((angleDiff - 1e-6)/stepSizeDeg);
       earnedPoints = Math.max(maxPoints - step * penaltyPerStep, 0);
      }
      totalScore += earnedPoints;

      const fbClearID = showFeedbackText(earnedPoints);

      //Save trial info
      trialInfo['cursorX_end'] = cursor_posX;
      trialInfo['cursorY_end'] = cursor_posY;
      trialInfo['score'] = earnedPoints;
      trialInfo['angleDiff'] = angleDiff;
      trialInfo['reachAngle'] = reachAngle;
      trialInfo['moveDuration'] = endMoveTime-startMoveTime; //calculate and record total time taken for the reach
      trialInfo['reactionTime'] = startMoveTime - display_target_time;

      reset_canvas.removeEventListener('mousemove', mouseEvtHandler2); //stop tracking mouse movement by removing mouseEvtHandler2 func from the canvas, prevents further movement from being recorded after trial ends
      setTimeout(() => {
        reach_ctx.clearRect(0,0, canvas_width, canvas_height);
        nextTrial();
      },1200);

      if (reachDeadlineID !== null) {
        clearTimeout(reachDeadlineID);
        reachDeadlineID = null;
      }
   }
}

function drawFrameAndCircle(ctx) {
  const frameX = canvas_center_x - frameSize / 2;
  const frameY = canvas_center_y + frameYOffset - frameSize / 2;

  // Draw square black frame
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  //ctx.rect(frameX, frameY, frameSize, frameSize);
  ctx.stroke();
  ctx.closePath();

  // Draw inscribed circle
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.arc(canvas_center_x, canvas_center_y + frameYOffset, frameSize / 2, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();

   // Draw green center circle
  ctx.beginPath();
  ctx.fillStyle = 'green';
  ctx.arc(canvas_center_x, canvas_center_y + frameYOffset, 8, 0, 2 * Math.PI); // radius = 8px
  ctx.fill();
  ctx.closePath();
}


function reachScene() { //called at the start of each reach trial to prepare everything.
      display_scene_time = currentTime(); //Records the time when the reach scene was displayed.
      reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
      reach_ctx.clearRect(0, 0, canvas_width, canvas_height); //Clears both canvas layers so that any graphics from the previous trial are removed.
      raw_x=0;
      raw_y=0; //Resets the raw cursor position offsets to zero. starting point for the new trial is always at the center
      mouse_x = [];
      mouse_y = [];
      time_points = []; //Clears the arrays that store movement data

      recordedStartTime = false; // Resets the flag for recording the start time of the movement, ensure movement start time will be captured once when person begins moving
      trialCompleted = false; //resets trial cmompletion flag, code knows trial is in progress not yet finished
      $('#container').show();
      $('.myCanvas').show(); //Uses jQuery to make sure the canvas and its container are visible

      drawFrameAndCircle(reset_ctx);

      ready = false;
      restarting = true;

  reset_canvas.addEventListener('mousemove', centerCheckHandler) //mouse movement events on teh reset canvas, everytime mouse moves, it will trigger mouseEvtHandler1 which updates cursor position, checks whether cursor has entered center circle
  reset_canvas.addEventListener('mousedown', handleMouseDown);
  document.documentElement.style.cursor = 'auto';
  document.body.style.cursor = 'auto';
  clickedToStart = false;
  
}


function drawTarget() {
  trialInfo = allTrials[curTrial]; // Get current trial
  const curAngle = trialInfo['target_angle'];
  const adjustedAngle = (360 - curAngle) % 360;
  trialInfo['adjusted_target_angle'] = adjustedAngle;

  display_target_time = currentTime();
  reachDeadlineID = setTimeout(() => {
    if (!trialCompleted) {
      trialCompleted = true;
      reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
     showTooSlow();
    }
  }, 2000);
  trialInfo['resetDuration'] = display_target_time - display_scene_time;

  ready = false;
  restarting = false;
  reaching = true;

  // Clear previous visuals
  reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
  reach_ctx.clearRect(0, 0, canvas_width, canvas_height);

  // === Draw Stimulus Image at Top ===
  const img = allImages['images' + trialInfo.folder][trialInfo.image - 1];
  const imageWidth = 150;
  const imageHeight = 150;
  const imageX = canvas_center_x - imageWidth / 2;
  const imageY = 30;
  reset_ctx.drawImage(img, imageX, imageY, imageWidth, imageHeight);

  // === Draw Frame and Circular Boundary ===
  drawFrameAndCircle(reset_ctx);

  // === Compute Hidden Target Location ===
  computeTargetPosition(curAngle);

  // === (Optional) Visualize Red Target — for debugging only ===
  //reach_ctx.fillStyle = 'red';
  //reach_ctx.fillRect(
    //smallSquareX,
    //smallSquareY,
    //cell_width * targetSize,
    //cell_width * targetSize
  //);
  
  // === Transition to Reaching Phase ===
  reset_canvas.removeEventListener('mousedown', handleMouseDown);
  reset_canvas.addEventListener('mousemove', mouseEvtHandler2);
  reset_canvas.requestPointerLock();

}

	var square_of_cursor_x //store which grid column the cursor currently in square_of_cursor_x = Math.floor(cursor_posX / cell_width)
	var square_of_cursor_y //store grid row

  // Helper: Compute where the target should go
  //function computeTargetPosition(angleDeg) {
    //const radius = frameSize / 2; // Match radius to circular frame
    //const angleRad = angleDeg * (Math.PI / 180);
  
   //const offsetX = Math.cos(angleRad) * radius;
    //const offsetY = Math.sin(angleRad) * radius;
  
    //let x = canvas_center_x + offsetX - (cell_width * targetSize / 2);
    //let y = canvas_center_y + frameYOffset + offsetY - (cell_width * targetSize / 2);
  
    //const targetSizePx = cell_width * targetSize;
    //x = Math.max(0, Math.min(x, canvas_width - targetSizePx));
    //y = Math.max(0, Math.min(y, canvas_height - targetSizePx));
  
    //smallSquareX = canvas_center_x + offsetX - (cell_width * targetSize / 2);
   // smallSquareY = canvas_center_y + frameYOffset + offsetY - (cell_width * targetSize / 2);
  
    //console.log(`Target for angle ${angleDeg}° → X: ${Math.round(x)}, Y: ${Math.round(y)}`);

  //}

  function computeTargetPosition(angleDeg) {
    //const radius = (frameSize / 2) - (cell_width * targetSize / 2);
    const radius = frameSize / 2;
    const angleRad = angleDeg * (Math.PI / 180);

    const offsetX = Math.cos(angleRad) * radius;
    const offsetY = -1 * Math.sin(angleRad) * radius;

    smallSquareX = canvas_center_x + offsetX - (cell_width * targetSize / 2);
    smallSquareY = canvas_center_y + frameYOffset + offsetY - (cell_width * targetSize / 2);
    console.log(`Target angle: ${angleDeg}°, offsetX: ${Math.round(offsetX)}, offsetY: ${Math.round(offsetY)}`);

  }



	function updateReach(timestamp) {
    if (!trialCompleted && timestamp - display_target_time > 2000) {
      trialCompleted = true;
      reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
      showTooSlow();
      return;
    }
    if (!recordedStartTime) {
      startMoveTime = currentTime();
      trialInfo['prepDuration'] = startMoveTime - display_target_time;
      recordedStartTime = true;

      if (reachDeadlineID !== null) {
        clearTimeout(reachDeadlineID);
            reachDeadlineID = null;
      }
    }
  
    if (!trialCompleted && timestamp - startMoveTime > 800) {
      trialCompleted = true;
      reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
      showTooSlow();
      return;
    }

    const frameRadius = frameSize / 2;
    const distFromCenter = getDistance(
      cursor_posX, cursor_posY,
      canvas_center_x, canvas_center_y + frameYOffset
    );

    // === When movement ends (i.e., when user leaves circle boundary )
    if (!trialCompleted && distFromCenter >= frameRadius) {
      endMoveTime = currentTime();
      if (endMoveTime - startMoveTime < 50) {
        trialCompleted = true;
        reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
        showTooFast();
        return;
      }
  
      trialCompleted = true;
      reset_canvas.removeEventListener ('mousemove', mouseEvtHandler2);

      // Anfular scoring logic

      const dx = cursor_posX - canvas_center_x;
      const dy = cursor_posY - (canvas_center_y + frameYOffset);
      let reachAngle = Math.atan2(dy,dx) * (180/Math.PI);
      if (reachAngle < 0) reachAngle += 360;
      
      const desiredAngle = trialInfo ['adjusted_target_angle'];
      let angleDiff = Math.abs(reachAngle - desiredAngle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      //Scoring
      let earnedPoints = 0;

      if (angleDiff <=  maxAllowedAngle) {
       const step = Math.floor ((angleDiff - 1e-6)/stepSizeDeg);
       earnedPoints = Math.max(maxPoints - step * penaltyPerStep, 0);
      }

      totalScore += earnedPoints;

      // Record trial data
      trialInfo['HIT'] = earnedPoints > 0 ? 1 : 0;
      trialInfo['score'] = earnedPoints;
      trialInfo ['angleDiff'] = angleDiff;
      trialInfo ['reachAngle'] = reachAngle;
      trialInfo['cursorX_end'] = cursor_posX;
      trialInfo['cursorY_end'] = cursor_posY;
      trialInfo['moveDuration'] = endMoveTime - startMoveTime;
      trialInfo['reactionTime'] = startMoveTime - display_target_time;
  
      const fbClearId = showFeedbackText(earnedPoints);
      //document.getElementById('reset_layer').style.border = earnedPoints > 0 ? '5px solid #90EE90' :'5px solidrgb(174, 174, 174)';
      setTimeout(() => {
        clearTimeout (fbClearId);
        reset_ctx.clearRect (0, 0, canvas_width, canvas_height);
        reach_ctx.clearRect(0, 0, canvas_width, canvas_height); 
        nextTrial();}, 1200);
    }
    
  }
  


function centerCheckHandler(e) {
  const rect = reset_canvas.getBoundingClientRect();
  cursor_posX = e.clientX - rect.left;
  cursor_posY = e.clientY - rect.top;

  const dist = getDistance(cursor_posX, cursor_posY, canvas_center_x, canvas_center_y + frameYOffset);
  const now = performance.now();

  // If cursor is in center
  if (dist < 8) {
    if (!ready) {
      // Start timing only once when first entering
      if (centerEntryTime === null) {
        centerEntryTime = now;
      }

      // Hide cursor only if it's been in center for 100ms
      if (now - centerEntryTime > 100) {
        ready = true;
        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';
        //console.log("Cursor stayed in center – hiding.");
      }
    }
  } else {
    // Cursor left center – reset everything
    if (ready) {
      //console.log("Cursor left center – showing.");
    }
    centerEntryTime = null;
    ready = false;
    document.body.style.cursor = 'auto';
    document.documentElement.style.cursor = 'auto';
  }
}


  function handleMouseDown(e){ //gets called when participant clicks on the reset_layer canvas

    if(ready && !clickedToStart){
      clickedToStart = true;
      reset_canvas.removeEventListener('mousemove', centerCheckHandler);
      reset_canvas.removeEventListener('mousedown', handleMouseDown);
      reset_ctx.clearRect(0,0, canvas_width, canvas_height);
   
      drawTarget(); //draw red target, switch to reach mode, mouseEvtHandler2 will start 
      
    }
  }


  function nextTrial(){
    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    reach_ctx.clearRect(0, 0, canvas_width, canvas_height); // clears both canvas layers
    curTrial++; //increase current trial num, how the codes move thru the allTrials array (which contains full set of trial setting)
    // console.log(curTrial);
    document.documentElement.style.cursor = 'none'; // html element
    document.body.style.cursor = 'none' // hide cursor
    window_innerwidth 	= window.innerWidth;
    window_innerheight 	= window.innerHeight; //updates the current window size, properly ocnvert mouse coordinates to canvas coordinates later
    $('#title').hide();
    $('#PracticeInstructions').hide();
    $('#instructions').hide();
    $('#backButton').hide();
    $('#startExperimentButton').hide(); // used jQuery to hide title text practice instr, general instr, back and start button
    $('.progress').show();
    $('#progressContainer').show();
    $('#container').show(); // show progress bar and canvas container
    $('#progressBar').css('width',((curTrial/nTrials)*120) + 'px');  //adjust the width of the progress bar, based on proportion of completed trials, scales to a max width of 120 pixels when all trials are done
    //document.getElementById('reset_layer').style.border = '5px solid black';  // Set both color (neutral state for the new trial) and width at the same time for the reset canvas border
    document.exitPointerLock(); //release the pointer lock: mouse cursor becomes free again, so participant can move into the center freely before the nect reach starts

      
    if (curTrial >= allTrials.length){
        document.exitPointerLock(); //release the pointer lock, mouse is free again
        $('#container').hide();
        $('#keyReminder').hide();
        $('#progressContainer').hide(); //hide the task canvas and UI elements
        document.documentElement.style.cursor = 'auto'; // html element 
        document.body.style.cursor = 'auto' // hide cursor, restore the normal mouse cursor
        finishUp();// save the final data, show debriefing, redirect ppl to prolific
        return;
      }

      const currentBlock = allTrials[curTrial].block;
      const previousBlock = curTrial > 0 ? allTrials[curTrial -1].block: currentBlock;

      if (curTrial > 0 && currentBlock !== previousBlock){
        showBlockInstruction(currentBlock +1);
        return;
      }

      //continue trial as normal
      trialinfo = allTrials[curTrial];
      setTimeout(reachScene, 500);
    }


  function showBlockInstruction(blockNum){ //display instr screen to inform ppl test phase
    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    reach_ctx.clearRect(0, 0, canvas_width, canvas_height); //clear both reset and reach canvases, remove any graphics from prev trial

    const line1 = `Great job! Now Block ${blockNum} is about to begin.`;
    const line2  = `Please continue to reach the "hidden" target!`

    const line3  = `Press Spacebar to continue the task.`

    drawText(line1, (canvas_width - measureTextWidth(reset_ctx, line1, '25px Helvetica'))/2, (canvas_height + 25)/3, '25px Helvetica', 'black'); //horizontally centered, vertically at 1/3 of canvas height, font, color
    drawText(line2, (canvas_width - measureTextWidth(reset_ctx, line2, '25px Helvetica'))/2, (canvas_height + 25)/2.5, '25px Helvetica', 'black');//slightly lower 
    drawText(line3, (canvas_width - measureTextWidth(reset_ctx, line3, '25px Helvetica'))/2, (canvas_height + 25)/1.5, '25px Helvetica', 'black'); //near the bottom thrid of the canvas

    processReminder=true; //tell the rest of the code to wait for participant to press the spacebar before continuing

  }

  function instrtestingBlock(){

    const progressContainer = document.getElementById('progressOutline'); // find the progress bar outline element in HTML, used as anchor so the new instruction text can be placed right below

    // Create a new text element
    const textElement = document.createElement('span'); //Creates a new HTML <span> element that will hold the instruction text.   
    textElement.textContent = "Don't adjust. Move straight to the target."; 

    // Add a class to style the text for centering
    textElement.classList.add('centered-text'); //Adds a CSS class called centered-text to the new span. Center the text horizontally. Set the font size, color,

    // Insert the text element directly after the reach_layer canvas
    progressContainer.insertAdjacentElement('afterend', textElement); //Inserts the new span just after the progressOutline element in the HTML, appear directly below the progress bar


    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    reach_ctx.clearRect(0, 0, canvas_width, canvas_height); //clear reset and reach canvases

    targetInstr1 = 'Next, you will NOT see how your mouse moves.'
    targetInstr2 = 'NOW, STOP ANY STRATEGY YOU WERE USING.'
    targetInstr3 = 'JUST MOVE YOUR MOUSE STRAIGHT TO THE RED TARGET.'

    targetInstr4 = 'Press Spacebar to continue the task.'

    drawText(targetInstr1, (canvas_width - measureTextWidth(reset_ctx,targetInstr1, '25px Helvetica'))/2, (canvas_height + 25)/3, '25px Helvetica', 'black');
    drawText(targetInstr2, (canvas_width - measureTextWidth(reset_ctx,targetInstr2, '25px Helvetica'))/2, (canvas_height + 25)/2.5, '25px Helvetica', 'black');
    drawText(targetInstr3, (canvas_width - measureTextWidth(reset_ctx,targetInstr3, '25px Helvetica'))/2, (canvas_height + 25)/2, '25px Helvetica', 'black');
    drawText(targetInstr4, (canvas_width - measureTextWidth(reset_ctx,targetInstr4, '25px Helvetica'))/2, (canvas_height + 25)/1.5, '25px Helvetica', 'black');

    processReminder=true;

  }

  function showTooSlow() {
    console.log("Triggered: showTooSlow()");
    trialCompleted = true;
    reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);

    if (reachDeadlineID !== null) {
      clearTimeout(reachDeadlineID);
      reachDeadlineID = null;
    }

    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    reach_ctx.clearRect(0, 0, canvas_width, canvas_height);

    const txtChoice = 'Too slow! Next Trial.';
    const textSize = 25;
    const fontStyle = textSize + 'px Helvetica';
    const textColor = 'black';
    drawText(txtChoice, (canvas_width - measureTextWidth(reset_ctx, txtChoice, fontStyle))/2, (canvas_height + textSize)/2, fontStyle, textColor);
    document.exitPointerLock();
    document.documentElement.style.cursor = 'auto';
    document.body.style.cursor = 'auto';
    setTimeout(reachScene, display_timeout_duration);
  }


  function showTooFast(){
    trialCompleted = true; 
    reset_canvas.removeEventListener('mousemove', mouseEvtHandler2);
    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    reach_ctx.clearRect(0, 0, canvas_width, canvas_height);

    txtChoice = 'Too fast! Next Trial.';

    fontSuffix = 'px Helvetica';
    textColor = 'black';
    textSize = 25;

    fontStyle = textSize+fontSuffix;
    drawText(txtChoice, (canvas_width - measureTextWidth(reset_ctx, txtChoice, fontStyle))/2, (canvas_height + textSize)/2, fontStyle, textColor);
    setTimeout(reachScene,display_timeout_duration); 
  }



  function introRoutines() { //This will be called when the webpage finishes loading ； initialize everything before the experiment starts

    numInstr = $('*').filter(function () { // number of Instruction# divs； use jQuery to look at all HTML elements (*), filter those id matches "instruction" followed by a number, store the num in numInstr
       return this.id.match(/Instruction\d+/); 
     }).length; // so that the code knows how many instr pages the person needs to go thru before experiment begins

     canvas_width  = cell_width * n_cells_x;
     canvas_height = cell_width * n_cells_x;
     canvas_center_x = canvas_width / 2;
     canvas_center_y = canvas_height / 2;
     


  
     
    reach_canvas = document.getElementById("reach_layer");
    reach_ctx = reach_canvas.getContext("2d"); // get the reach layer canvas from HTML (id = "reach_layer"), store it in reach_canvas, gets the 2D drawing context (draw shapes and lines) and store in reach_ctx

    reset_canvas = document.getElementById("reset_layer");
    reset_ctx = reset_canvas.getContext("2d");

    resize(); //call resize (sets the canvas dimensions, updates center coordinates)


      document.body.onkeydown = function(e){ //set up the spacebar listener for instructions,
        if (e.keyCode == 32&&processReminder==true) { //listens for keyboard presses, if spacebar is pressed and the flag processReminder is true
          reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
          reach_ctx.clearRect(0, 0, canvas_width, canvas_height);//clear both canvases to remove the instruction text
          processReminder=false; //mistake here? should be = false, set to false so ppl cant press spacebar and advance to next trial by mistake
          setTimeout(reachScene,500)
        }
      }


  }

  function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random(
    ) * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}



async function finishUp() {
  if (typeof allTrials === 'object' && allTrials !== null && allTrials.length > 0) {
    try {
      responses['trialData'] = allTrials;
      responses['totalScore'] = totalScore;

      // Build CSV from allTrials
      const keys = Object.keys(allTrials[0]);
      const csvRows = [keys.join(',')];
      allTrials.forEach(trial => {
        const values = keys.map(k => {
          const val = trial[k];
          // Flatten arrays like mouse_x, mouse_y, time_points
          return Array.isArray(val) ? `${val.join(';')}` : JSON.stringify(val);
        });
        csvRows.push(values.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pilot_results.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Show debriefing screen
      $('#container').hide();
      $('#keyReminder').hide();
      $('#progressContainer').hide();
      document.documentElement.style.cursor = 'auto';
      document.body.style.cursor = 'auto';

      alert("Experiment complete! Your data has been downloaded.");

    } catch (error) {
      console.error("Failed to finish up:", error);
    }
  } else {
    console.error("allTrials is either null, not an object, or empty!");
  }
}



function assignExperimentInfo() {
  // record things like the name of the experiment, the browser information, etc.
  // experiment info
  responses['experimentName'] = experimentName;
  responses['experimentVersion'] = experimentVersion;
  responses['experimentNotes'] = experimentNotes;
  // responses['experimentCondition'] = experimentCondition;
  // subject info
  responses['subjectID'] = subjectID;
  // browserInfo
  var browserInfo = getBrowser();
  responses['browserName'] = browserInfo[0];
  responses['browserVersion'] = browserInfo[1];
  // displayInfo
  responses['displayWindowHeight'] = $(window).height();
  responses['displayWindowWidth'] = $(window).width();
  responses['displayScreenHeight'] = screen.height;
  responses['displayScreenWidth'] = screen.width;
  responses['fps'] = fps;

  // timestamp
  // responses['startStudyTimestamp_unix'] = startStudyTimestamp_unix;
}

function eventReturn(e) {
  e.returnValue = "Are you sure you want to leave?";

}


// check screen refresh rate
function calcFPS(opts){
    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;
    if (!requestFrame) return true; // Check if "true" is returned;

    var rfValue;                                // pick default FPS, show error, etc...
    function checker(){
        if (index--) requestFrame(checker);
        else {
            // var result = 3*Math.round(count*1000/3/(performance.now()-start));
            var result = count*1000/(performance.now()- start);
            if (typeof opts.callback === "function") opts.callback(result);
            console.log("Calculated: "+result+" frames per second");
            fps = result;
            speed = Math.round(120/fps)
        }
    }
    if (!opts) opts = {};
    var count = opts.count||60, index = count, start = performance.now();
    checker();
}

function toggleFullScreen() {
  $('#consent').show();
  imagesPreloaded = true;


  if ((document.fullScreenElement && document.fullScreenElement !== null) ||
   (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
  $('#askFull').hide();
  ClickedConsent();
}


function ClickedConsent() {
  if (imagesPreloaded == true) {
    startStudyTimestamp_unix = new Date().getTime(); // unix epoch timestamp (i.e. date/time)
    // now add warning if they try to close the page
    // window.addEventListener('beforeunload', eventReturn);    // hide
    $('#consent').hide();
    // show
    $('#title').show();
    $('#Instruction' + instrInd).show();
    $('#buttonGroup').show();
    startExperimentTime = currentTime();

    let urlParams = new URLSearchParams(window.location.search);
    prolific_PID = urlParams.get("PROLIFIC_PID");
    study_ID = urlParams.get("STUDY_ID");
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    $('.clickButton_text').css('marginTop',(windowHeight*0.7) + 'px');

  }
}



// to change instructions screen back and forth
function ChangeInstructionsScreen(buttonText, buttonFunction, incremVal, pracInstr) {
  if (enableInstrButtons == true) {
    enableInstrButtons = false; // to prevent multiple button clicks as instructions are updated
    // show next instructions
    if (pracInstr == true) {
      $('#Instruction' + instrInd).fadeOut(400).slideUp();
      instrInd = instrInd + incremVal;
      if (instrInd < numInstr) {
        $('#Instruction' + instrInd).delay(400).fadeIn();
      } else {
        $('#FinishedInstr').delay(400).fadeIn();
      }
    } else {
      $('#Instruction' + instrInd).fadeOut(400).slideUp();
      $('#expTrials').fadeOut(400).slideUp();
      instrInd = instrInd + incremVal;
      $('#Instruction' + instrInd).delay(400).fadeIn();
    }
    // change button text/click function
    setTimeout(function() {
      document.getElementById('startExperimentText').innerHTML = buttonText;
      document.getElementById('startExperimentText').href = 'javascript:' + buttonFunction;

      // hide or show back button and/or practice text
      if (instrInd > 0 && instrInd < numInstr) {
        $('#backButton').show();
      } else {
        $('#backButton').hide();
      }


      if (pracInstr == true) {
        $('#expTrials').show();
      } else {
        $('#expTrials').hide();
      }
      document.body.scrollTop = document.documentElement.scrollTop = 0; // scroll back up to top of instructions page
      enableInstrButtons = true; // now that animating is done, enable instructions button
    }, 500);
  }
}


function NextInstruction() {
  // console.log(instrInd);
  if (instrInd < (numInstr-1)) { // last one
    buttonText = 'Next';
    buttonFunction = 'NextInstruction()';
    incremVal = 1;
    pracInstr = false;
    $('#buttonGroup').css('opacity',"30%");
    document.getElementById("buttonGroup").style.pointerEvents = 'none';

    setTimeout(() => {
      $('#buttonGroup').css('opacity',"100%");
      document.getElementById("buttonGroup").style.pointerEvents = 'auto';
   }, read_ins_duration);


  } else {
    calcFPS();
    $('#buttonGroup').css('margin-top',"0");
    //$('#FinishedInstr').show();
    buttonText = 'Start Experiment';
    buttonFunction = 'nextTrial()';
    incremVal = 1;
    pracInstr = true;
  }
  ChangeInstructionsScreen(buttonText, buttonFunction, incremVal, pracInstr);
}

function PrevInstruction() {
  buttonFunction = 'NextInstruction()';
  ChangeInstructionsScreen('Next', buttonFunction, -1, false);
}

function drawText(txtToDraw, x, y, txtFont, txtColor, txtLineWidth) {
  reset_ctx.font = txtFont;
  reset_ctx.fillStyle = txtColor;
  reset_ctx.fillText(txtToDraw, x, y);
  if ( txtLineWidth !== 'undefined' && txtLineWidth > 0 ) {
    reset_ctx.lineWidth = txtLineWidth;
    reset_ctx.strokeText(txtToDraw, x, y);
  }
}

function showFeedbackText(points) {
  let feedbackText;
  const feedbackFont = '32px Helvetica';
  const imageBottomY = 30 + 150;
  const circleTopY = canvas_center_y + frameYOffset - frameSize / 2;
  const feedbackY = (imageBottomY + circleTopY) / 2 +20;

  let feedbackColor;
  if (points === 10) {
    feedbackColor = 'green';
    feedbackText = `+${points} points`;
  } else if (points > 0) {
    feedbackColor = 'orange';
    feedbackText = `+${points} points`;
  } else {
    feedbackColor = 'red';
    feedbackText = `Miss! +${points} point`;
  }
  reset_ctx.font = feedbackFont;
  const textWidth = measureTextWidth(reset_ctx, feedbackText, feedbackFont);
  const feedbackX = canvas_center_x - textWidth / 2;
  reset_ctx.fillStyle = feedbackColor;
  reset_ctx.fillText(feedbackText, feedbackX, feedbackY);
  return setTimeout(() => {
    reset_ctx.clearRect(0, 0, canvas_width, canvas_height);
    drawFrameAndCircle(reset_ctx);
  }, 1200);
}



function measureTextWidth(ctx, txtToMeasure, txtFont) {
  ctx.font = txtFont;
  return ctx.measureText(txtToMeasure).width;
}


function currentTime() {
  return performance.now();
}
