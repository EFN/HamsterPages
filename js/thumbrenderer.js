/**
   Internal callback
*/
function renderThumb(thumbCanvas, renderCanvas, options) {
    html2canvas($(renderCanvas), {
	allowTaint: options.allowTaint,
	background: options.background,
	letterRendering: options.letterRendering,
	proxy: options.proxy,
	taintTest: options.taintTest,
	logging: options.logging,
	useCORS: options.useCORS,
	onrendered: function(canvas) {
	    var ctx = thumbCanvas.getContext('2d');
	    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

	    if (options.removeRenderCanvas) {
		if (options.logging)
		    console.log('Removing rendercanvas');
		renderCanvas.parentNode.removeChild(renderCanvas);
	    }
	}
    });
}

/**
   @var thumbrenderer.options

   The elements of options:
   
   ** allowTaint Whether to allow cross-origin images to taint the canvas
   ** background background color
   ** parent element to append thumbnail to, default is document.body
   ** taintTest Whether to test each image if it taints the canvas
      before drawing them. Setting this to false is faster, but may
      result in strange rendering errors
   ** timeout before giving up on a request 0 for none
   ** bounds is a JSON object with height width and scaling of the thumbnail
   ** createLink creates a link around the thumbnail
   ** logging Turns on logging verbosity
   ** proxy Url to the proxy which is to be used for loading cross-origin images. If left empty, cross-origin images won't be loaded.
   ** useCORS Whether to attempt to load cross-origin images as CORS served, before reverting back to proxy
   ** removeRenderCanvas wether to leave the renderCanvas in the document, useful for debugging
*/

function proxyRedirect(data, thumbCanvas, options)
{
    var str=data.substring(2, data.length - 2);
    tmpurl=str.replace(/\\\//g, '/');
    $.ajax({
	url: tmpurl,
	success: function(data) {
            $(options.renderCanvas).html(data);
            setTimeout(renderThumb(thumbCanvas, options.renderCanvas, options), options.timeout);
        },
    });
    return thumbCanvas;
}

/**
   Creates a thumbnail for a given URL

   @param url The target url to create a thumbnail for

   @param thumbCanvas A canvas element to draw the thumbnail in, if
   thumbCanvas is null, one will be created based on the values in
   options. Note that the canvas must be attached to a document,
   otherwise strange things will happen.

   @param options JSON object containing various options @sa thumbrender.options
*/
function setupThumb(url, thumbCanvas, options)
{
    if (options.logging)
	console.log(options);
    if (typeof options.parent == 'string' || options.parent instanceof String)
	options.parent = document.getElementById(options.parent);
    if (!options.parent)
	options.parent=document.body;
    if (!options.bounds)
	options.bounds = {};


    if (!thumbCanvas) {
	thumbCanvas = document.createElement('canvas');
	if (!options.bounds.height || !options.bounds.width)
	          throw new Error('Either thumbCanvas must be defined, or options.bounds must containt both height and width');
	thumbCanvas.height=options.bounds.height;
	thumbCanvas.width=options.bounds.width;
	options.parent.appendChild(thumbCanvas);
    }
    if (typeof thumbCanvas == 'string' || thumbCanvas instanceof String)
	thumbCanvas = document.getElementById(thumbCanvas);

    if (options.createLink) {
	var link = document.createElement('a');
	link.setAttribute('href', url);
	thumbCanvas.parentNode.replaceChild(link,thumbCanvas);
	link.appendChild(thumbCanvas);
    }
    if (!options.bounds.scale)
	options.bounds.scale = 1.0;
    if (!options.renderCanvas) {
	options.renderCanvas = document.createElement('canvas');
	options.renderCanvas.height = thumbCanvas.height / options.bounds.scale;
	options.renderCanvas.width = thumbCanvas.width / options.bounds.scale;
	if (options.logging)
	    console.log('Canvas size: ' + options.renderCanvas.width + 'x' + options.renderCanvas.height);
	options.parent.appendChild(options.renderCanvas);
	if(typeof options.removeRenderCanvas === 'undefined') {
	    options.removeRenderCanvas = true;
	};
    }
    if (typeof options.renderCanvas == 'string' || options.renderCanvas instanceof String)
	options.renderCanvas = document.getElementById(options.renderCanvas);

    var parser = document.createElement('a');
    parser.href = url;

    if (document.location.hostname == parser.hostname) {
	$.ajax({
	    url: url,
	    success: function(data) {
		$(options.renderCanvas).html(data);		
		setTimeout(renderThumb(thumbCanvas, options.renderCanvas, options), options.timeout);
            },
	});
    }
    else {
	tmpurl=options.proxy + '?url='+encodeURIComponent(url);
	$.ajax({
	    url: tmpurl,
	    success: function (data) {
		proxyRedirect(data, thumbCanvas, options);
	    }
	});
    }
    return thumbCanvas;
}


/**
   Convenience wrapper around setupThumb

   @param url The target url to create a thumbnail for

   @param parent element to append thumbnail to, document.body is used if set to null
   @param width of thumbnail
   @param height of thumbnail
   @param scale of thumbnail relative to full canvas, default is 1.0
*/
function createThumbFromURL(url, parent, width, height, scale)
{
    if (!scale)
	scale = 1.0;
    style=window.getComputedStyle(parent);
    background=style.getPropertyValue( "background-color" );
    options = {
	allowTaint: false,
	background: background,
	parent: parent,
	taintTest: false,
	timeout: 100,
	proxy: 'https://test2.blenning.no/htmlcanvas/proxy.php',
	bounds: {
	    width: width,
	    height: height,
	    scale: scale
	},
	createLink: true,
	logging: false
    };
    return setupThumb(url, null, options);
}
