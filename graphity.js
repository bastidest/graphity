(function($) {

  $.fn.Graphity = function(options) {
    var canvas, ctx;
    var mouse = {
      down: false,
      x: 0,
      y: 0,
      relX: 0,
      relY: 0,
      moved: true
    }
    var settings;

    settings = options;
    canvas = this[0];
    ctx = canvas.getContext("2d");

    CanvasRenderingContext2D.prototype.bubble = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x+r, y);
      this.arcTo(x+w, y,   x+w, y+h, r);
      this.arcTo(x+w, y+h, x,   y+h, r);
      this.arcTo(x,   y+h, x,   y,   r);
      this.arcTo(x,   y,   x+w, y,   r);
      this.closePath();
      this.moveTo((x + w / 2) - 5, y + h);
      this.lineTo((x + w / 2) + 5, y + h);
      this.lineTo((x + w / 2), y + h + 10);
      return this;
    }

    function resize() {
      settings.axes.x.scale = canvas.width / Math.abs(settings.axes.x.minVal - settings.axes.x.maxVal);

      switch(settings.axes.y.resizeFix) {
        case 'bottom':
          if(isNaN(settings.axes.y.minVal)) {
            throw new Error('If the resize fix is set to \'bottom\', a minimum value has to be set.')
          }
          settings.axes.y.scale = settings.axes.x.scale;
          settings.axes.y.maxVal = settings.axes.y.minVal + canvas.height / settings.axes.y.scale;
          break;
        case 'top':
          if(isNaN(settings.axes.y.maxVal)) {
            throw new Error('If the resize fix is set to \'top\', a maximum value has to be set.')
          }
          settings.axes.y.scale = settings.axes.x.scale;
          settings.axes.y.minVal = settings.axes.y.maxVal - canvas.height / settings.axes.y.scale;
          break;
        case 'zero':
          settings.axes.y.scale = settings.axes.x.scale;
          settings.axes.y.minVal = -(canvas.height / settings.axes.y.scale / 2);
          settings.axes.y.maxVal = canvas.height / settings.axes.y.scale / 2;
          break;
        case 'center':
          if(isNaN(settings.axes.y.minVal) || isNaN(settings.axes.y.maxVal)) {
            throw new Error('If the resize fix is set to \'center\', a minimum and a maximum value has to be set.')
          }
          var center = (settings.axes.y.minVal + settings.axes.y.maxVal) / 2;
          settings.axes.y.scale = settings.axes.x.scale;
          var space = canvas.height / settings.axes.y.scale / 2;
          settings.axes.y.minVal = center - space;
          settings.axes.y.maxVal = center + space;
          break;
        default:
          settings.axes.y.scale = canvas.height / Math.abs(settings.axes.y.minVal - settings.axes.y.maxVal);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid();
      drawAxes();

      for(var i = 0; i < settings.graphs.length; i++) {
        var g = settings.graphs[i];
        drawGraph(g);
      }
    }

    function pix2coord(x, y) {
      var coord = {};
      if(x !== undefined) {
        coord.x = ((x / settings.axes.x.scale) + settings.axes.x.minVal);
      }
      if(y !== undefined) {
        coord.y = -((y / settings.axes.y.scale) - settings.axes.y.maxVal);
      }
      return coord;
    }

    function coord2pix(x, y) {
      var pix = {};
      if(x !== undefined) {
        pix.x = (x - settings.axes.x.minVal) * settings.axes.x.scale;
      }
      if(y !== undefined) {
        pix.y = ((-y) + settings.axes.y.maxVal) * settings.axes.y.scale;
      }
      return pix;
    }

    function drawGrid() {
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = settings.grid.color;

      var min = pix2coord(0, 0);
      var max = pix2coord(canvas.width, canvas.height);

      var minX = Math.floor(min.x / settings.grid.x) * settings.grid.x - settings.grid.x;
      var maxX = Math.floor(max.x / settings.grid.x) * settings.grid.x + settings.grid.x;
      for(var i = minX; i <= maxX; i++) {
        var x = coord2pix(i * settings.grid.x, undefined).x;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }

      var minY = Math.floor(max.y / settings.grid.y) * settings.grid.y - settings.grid.y;
      var maxY = Math.floor(min.y / settings.grid.y) * settings.grid.y + settings.grid.y;

      for(var i = minY; i <= maxY; i++) {
        var y = coord2pix(undefined, i * settings.grid.y).y;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
    }

    function drawGraph (graph) {
    ctx.beginPath();
    if(graph.selected) {
      ctx.lineWidth = graph.selthick || graph.thickness * 2;
    } else {
      ctx.lineWidth = graph.thickness;
    }
    
    ctx.strokeStyle = graph.color;

    for (var pix = 0; pix < canvas.width; pix++) {
      var x = pix2coord(pix, undefined).x;
      var y = graph.func(x);
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
      ctx.font="10px Arial";
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.fillStyle = "rgb(0,0,0)"; 

      settings.axes.x.relPos = (settings.axes.y.minVal) / (settings.axes.y.minVal - settings.axes.y.maxVal);
      settings.axes.y.relPos = (-settings.axes.x.minVal) / (settings.axes.x.maxVal - settings.axes.x.minVal);
      var x = {
        start: {
          x: 0,
          y: canvas.height * (1 - settings.axes.x.relPos)
        },
        end: {
          x: canvas.width,
          y: canvas.height * (1 - settings.axes.x.relPos)
        }
      };
      var y = {
        start: {
          x: canvas.width * settings.axes.y.relPos,
          y: 0
        },
        end: {
          x: canvas.width * settings.axes.y.relPos,
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
      if(settings.axes.x.pi) {
        settings.axes.x._ticks = settings.axes.x.ticks * Math.PI;
      }
      
      var minTickX = Math.min(Math.ceil(pix2coord(0, undefined).x / (settings.axes.x.ticks * (settings.axes.x.tickFactor || 1))), 0);
      var maxTickX = Math.max(Math.floor(pix2coord(canvas.width, undefined).x / (settings.axes.x.ticks * (settings.axes.x.tickFactor || 1))), 0);
      
      for(var i = minTickX - 1; i <= maxTickX + 1; i++) {
        xTick = i * settings.axes.x.ticks;
        if(settings.axes.x.tickFactor) {
          xTick *= settings.axes.x.tickFactor;
        }
        xTickPos = coord2pix(xTick, undefined).x;
        
        ctx.moveTo(xTickPos, x.start.y - 5);
        ctx.lineTo(xTickPos, x.start.y + 5);
        
        var xTickText = xTick;
        if(settings.axes.x.tickFactor && settings.axes.x.tickLabel) {
          xTickText = (i * settings.axes.x.ticks) + settings.axes.x.tickLabel;
        }
        ctx.fillText(xTickText, xTickPos, x.start.y + 20);
      }
      
      var minTickY = Math.min(Math.ceil(pix2coord(undefined, canvas.height).y / (settings.axes.y.ticks * (settings.axes.y.tickFactor || 1))), 0);
      var maxTickY = Math.max(Math.floor(pix2coord(undefined, 0).y / (settings.axes.y.ticks * (settings.axes.y.tickFactor || 1))), 0);
      
      for(var i = minTickY - 1; i <= maxTickY + 1; i++) {
        yTick = i * settings.axes.y.ticks;
        if(settings.axes.y.tickFactor) {
          yTick *= settings.axes.y.tickFactor;
        }
        yTickPos = coord2pix(undefined, yTick).y;
        
        ctx.moveTo(y.start.x - 5, yTickPos);
        ctx.lineTo(y.start.x + 5, yTickPos);
        
        var yTickText = yTick;
        if(settings.axes.y.tickFactor && settings.axes.y.tickLabel) {
          yTickText = (i * settings.axes.y.ticks) + settings.axes.y.tickLabel;
        }
        ctx.fillText(yTickText, y.start.x + 15, yTickPos - 5);
      }

      ctx.stroke();
    }

    function drawCursor() {
      ctx.beginPath();
      ctx.font="14px Arial";
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgb(0,0,0)";
      ctx.fillStyle = "rgb(0,0,0)"; 
      
      if(settings.cursor.x) {
        ctx.moveTo(0, mouse.relY);
        ctx.lineTo(canvas.width, mouse.relY);
        ctx.stroke();
      }

      if(settings.cursor.y) {
        ctx.moveTo(mouse.relX, 0);
        ctx.lineTo(mouse.relX, canvas.height);
        ctx.stroke();

        var x = pix2coord(mouse.relX, undefined).x;
        for (var i = 0; i < settings.graphs.length; i++) {
          var g = settings.graphs[i];
          if(!g.bubble && !g.selected) {
            continue;
          }
          var y = g.func(x);
          var piy = coord2pix(undefined, y).y;
          ctx.fillStyle = "rgb(0,0,0)";
          ctx.bubble(mouse.relX - 30, piy - 38, 60, 26, 4).fill();
          ctx.fillStyle = "rgb(255,255,255)";
          ctx.fillText(Math.round(y * 1000) / 1000, mouse.relX, piy - 20);
        }
      }
    }

    function resizeGraph() {
      canvas.width = $(canvas).parent().innerWidth();
      resize();
      draw();
    }

    $(window).on('resize', resizeGraph);
    resizeGraph();

    this.mousedown(function(e) {
      mouse.down = true;
      mouse.minX = settings.axes.x.minVal;
      mouse.maxX = settings.axes.x.maxVal;
      mouse.minY = settings.axes.y.minVal;
      mouse.maxY = settings.axes.y.maxVal;
      mouse.x = e.pageX;
      mouse.y = e.pageY;
      mouse.moved = false;
    });

    this.mouseup(function(e) {
      if(!mouse.moved) {
        var x = pix2coord(mouse.relX, undefined).x;
        for (var i = 0; i < settings.graphs.length; i++) {
          var g = settings.graphs[i];
          var y = g.func(x);
          var piy = coord2pix(undefined, y).y;
          if(mouse.relY > (piy - 8) && mouse.relY < (piy + 8)) {
            g.selected = !g.selected;
          } else if(!e.shiftKey) {
            g.selected = false;
          }
        }
      }
    });

    $(window).mouseup(function(e) {
      mouse.down = false;
    });

    $(window).mousemove(function(e){
      mouse.moved = true;
      if(mouse.down) {
        if(settings.scroll.x) {
          var deltaX = e.pageX - mouse.x;
          settings.axes.x.minVal = mouse.minX - deltaX / settings.axes.x.scale;
          settings.axes.x.maxVal = mouse.maxX - deltaX / settings.axes.x.scale;
        }
        
        if(settings.scroll.y) {
          var deltaY = e.pageY - mouse.y;
          settings.axes.y.minVal = mouse.minY + deltaY / settings.axes.y.scale;
          settings.axes.y.maxVal = mouse.maxY + deltaY / settings.axes.y.scale;
        }

        draw();
      }
    });

    this.mousemove(function(e) {
      if(!mouse.down) {
        var canvasOffset = $(this).offset(); 
        mouse.relX = e.pageX - canvasOffset.left;
        mouse.relY = e.pageY - canvasOffset.top;
        draw();
        drawCursor();
      }
    });

    this.mouseleave(function(e) {
      draw();
    });

    return this;
  };


}(jQuery));