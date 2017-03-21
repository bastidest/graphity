var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var axes = {
  x: {
    minVal: -10,
    maxVal: 10,
    ticks: 0.5,
    tickFactor: Math.PI,
    tickLabel: 'π'
  },
  y : {
    minVal: -5,
    maxVal: 2,
    ticks: 0.5
  }
}

function fun1(x) { return Math.sin(x) }
function fun2(x) { return Math.abs(x) }
function fun3(x) { return Math.sin(x + Math.PI * 0.5) }
function fun4(x) { return -0.5 * Math.pow(x, 2) + 2 }

function draw() {
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 
 axes.x.scale = canvas.width / Math.abs(axes.x.minVal - axes.x.maxVal);
 axes.y.scale = canvas.height / Math.abs(axes.y.minVal - axes.y.maxVal);
 
 drawAxes();
 drawFunc(fun1,"rgb(11,153,11)", 1);
 drawFunc(fun2,"rgb(66,44,255)", 1);
 drawFunc(fun3,"rgb(255,10,10)", 1);
 drawFunc(fun4,"rgb(255,10,10)", 2);
}

function pix2coord(x, y) {
  var coord = {};
  if(x !== undefined) {
    coord.x = ((x / axes.x.scale) + axes.x.minVal);
  }
  if(y !== undefined) {
    coord.y = -((y / axes.y.scale) + axes.y.minVal);
  }
  return coord;
}

function coord2pix(x, y) {
  var pix = {};
  if(x !== undefined) {
    pix.x = (x - axes.x.minVal) * axes.x.scale;
  }
  if(y !== undefined) {
    pix.y = ((-y) - axes.y.minVal) * axes.y.scale;
  }
  return pix;
}

function drawFunc (func, color, thick) {
 ctx.beginPath();
 ctx.lineWidth = thick;
 ctx.strokeStyle = color;

 for (var pix = 0; pix < canvas.width; pix++) {
  var x = pix2coord(pix, undefined).x;
  var y = func(x);
  var piy = coord2pix(undefined, y).y;

  if(pix == 0) {
    ctx.moveTo(pix, piy);
  } else {
    ctx.lineTo(pix, piy);
  }
 }
 
 ctx.stroke();
}

function drawAxes() {
  axes.x.relPos = (-axes.y.maxVal) / (axes.y.minVal - axes.y.maxVal);
  axes.y.relPos = (-axes.x.minVal) / (axes.x.maxVal - axes.x.minVal);
  var x = {
    start: {
      x: 0,
      y: canvas.height * (1 - axes.x.relPos)
    },
    end: {
      x: canvas.width,
      y: canvas.height * (1 - axes.x.relPos)
    }
  };
  var y = {
    start: {
      x: canvas.width * axes.y.relPos,
      y: 0
    },
    end: {
      x: canvas.width * axes.y.relPos,
      y: canvas.height
    }
  }
  ctx.beginPath();
  ctx.strokeStyle = "rgb(128,128,128)"; 
  
  // X-axis
  ctx.moveTo(x.start.x, x.start.y);
  ctx.lineTo(x.end.x, x.end.y);  
  
  // Y-axis
  ctx.moveTo(y.start.x, y.start.y);
  ctx.lineTo(y.end.x, y.end.y);  
  ctx.stroke();
  
  ctx.textAlign="center";
  if(axes.x.pi) {
    axes.x._ticks = axes.x.ticks * Math.PI;
  }
  
  var minTickX = Math.min(Math.ceil(pix2coord(0, undefined).x / (axes.x.ticks * (axes.x.tickFactor || 1))), 0);
  var maxTickX = Math.max(Math.floor(pix2coord(canvas.width, undefined).x / (axes.x.ticks * (axes.x.tickFactor || 1))), 0);
  
  for(var i = minTickX - 1; i <= maxTickX + 1; i++) {
    xTick = i * axes.x.ticks;
    if(axes.x.tickFactor) {
      xTick *= axes.x.tickFactor;
    }
    xTickPos = coord2pix(xTick, undefined).x;
    
    ctx.moveTo(xTickPos, x.start.y - 5);
    ctx.lineTo(xTickPos, x.start.y + 5);
    
    var xTickText = xTick;
    if(axes.x.tickFactor && axes.x.tickLabel) {
      xTickText = (i * axes.x.ticks) + axes.x.tickLabel;
    }
    ctx.fillText(xTickText, xTickPos, x.start.y + 20);
  }
  
  var minTickY = Math.min(Math.ceil(pix2coord(undefined, canvas.height).y / (axes.y.ticks * (axes.y.tickFactor || 1))), 0);
  var maxTickY = Math.max(Math.floor(pix2coord(undefined, 0).y / (axes.y.ticks * (axes.y.tickFactor || 1))), 0);
  
  for(var i = minTickY - 1; i <= maxTickY + 1; i++) {
    yTick = i * axes.y.ticks;
    if(axes.y.tickFactor) {
      yTick *= axes.y.tickFactor;
    }
    yTickPos = coord2pix(undefined, yTick).y;
    
    ctx.moveTo(y.start.x - 5, yTickPos);
    ctx.lineTo(y.start.x + 5, yTickPos);
    
    var yTickText = yTick;
    if(axes.y.tickFactor && axes.y.tickLabel) {
      yTickText = (i * axes.y.ticks) + axes.y.tickLabel;
    }
    ctx.fillText(yTickText, y.start.x + 15, yTickPos - 5);
  }

  ctx.stroke();
}

function drawCursor() {
  ctx.beginPath();
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgb(0,0,0)"; 
  
  // X-axis
  ctx.moveTo(0, mouse.relY);
  ctx.lineTo(canvas.width, mouse.relY);  
  
  // Y-axis
  ctx.moveTo(mouse.relX, 0);
  ctx.lineTo(mouse.relX, canvas.height);  
  ctx.stroke();
}

function resizeGraph() {
  canvas.width = $(canvas).parent().innerWidth();
  draw();
}

$(window).on('resize', resizeGraph);
resizeGraph();

var mouse = {
  down: false,
  x: 0,
  y: 0,
  relX: 0,
  relY: 0
}

$('#canvas').mousedown(function(e) {
  mouse.down = true;
  mouse.minX = axes.x.minVal;
  mouse.maxX = axes.x.maxVal;
  mouse.minY = axes.y.minVal;
  mouse.maxY = axes.y.maxVal;
  mouse.x = e.pageX;
  mouse.y = e.pageY;
});

$(window).mouseup(function(e) {
  mouse.down = false;
});

$(window).mousemove(function(e){
  if(mouse.down) {
    var deltaX = e.pageX - mouse.x;
    axes.x.minVal = mouse.minX - deltaX / axes.x.scale;
    axes.x.maxVal = mouse.maxX - deltaX / axes.x.scale;
    
    var deltaY = e.pageY - mouse.y;
    axes.y.minVal = mouse.minY - deltaY / axes.y.scale;
    axes.y.maxVal = mouse.maxY - deltaY / axes.y.scale;
    
    draw();
  }
});

$('#canvas').mousemove(function(e) {
  if(!mouse.down) {
    var canvasOffset = $(this).offset(); 
    mouse.relX = e.pageX - canvasOffset.left;
    mouse.relY = e.pageY - canvasOffset.top;
    draw();
    drawCursor();
  }
});

$('#canvas').mouseleave(function(e) {
  draw();
});

$('#minValX').change(function(e) {
  console.log($(this).val());
  console.log(axes);
  axes.x.minVal = parseInt($(this).val());
  console.log(axes);
  draw();
});