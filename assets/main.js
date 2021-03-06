/* くコ:彡 www.nabilk.com script 2019.11.24 くコ:彡 */

(function () {

    const scrollArrow = d3.select('#scrolltotop'),
        blurb = d3.select('#blurb');

    let currCategory = 'hi',
        isShownArrow = false,
        currMouseY = 0;

    // Thanks @robbendebiene! https://stackoverflow.com/a/24559613
    // jQuery free scroll to top
    function scrollToTop(scrollDuration) {
        let cosParameter = window.scrollY / 2,
            scrollCount = 0,
            oldTimestamp = performance.now();
        function step (newTimestamp) {
            scrollCount += Math.PI / (scrollDuration / (newTimestamp - oldTimestamp));
            if (scrollCount >= Math.PI) window.scrollTo(0, 0);
            if (window.scrollY === 0) return;
            window.scrollTo(0, Math.round(cosParameter + cosParameter * Math.cos(scrollCount)));
            oldTimestamp = newTimestamp;
            window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    function isShown(el,show) {

        if(show){
            el.style('display', 'block')
                .transition()
                .duration(100)
                .on('end', function() { el.classed('show', true) });
        } else {
            el.classed('show',false)
                .transition()
                .duration(100)
                .on('end', function() { el.style('display', 'none') });
        }
    }

    // listeners for selecting categories
    blurb.selectAll('a').on('click', function(){
        d3.event.preventDefault();
        currCategory = d3.select(this).attr('class');

        let rows = d3.selectAll('.row').each(function() {

            let currRow = d3.select(this);
            isShown(currRow, currRow.attr('id') == currCategory)
        })
    });

    // listener for scrolling to the top
    d3.select('#scrolltotop').on("click",function(){
        d3.event.preventDefault();
        scrollToTop(500);
    })

    // listener for hide/show scroll arrow
    d3.select(window).on('scroll', function(){
        let currTop = document.body.getBoundingClientRect().top;
        showArrow = -currTop > window.innerHeight ? true : false;

        if(showArrow !== isShownArrow){
            isShown(scrollArrow, showArrow);
            isShownArrow = showArrow;
        }
    })
 
    // sine wave doodad
    const height = 100,
    width = 480,
    colors = ['cyan','magenta','yellow'],
    xScale = d3.scaleLinear(),
    yScale = d3.scaleLinear(),
    xRange = d3.range(0,2.1*Math.PI,2*Math.PI/20),
    offset = .25 * Math.PI,
    hFactor = 10,
    yRange = d3.range(0,height,height/10).concat(d3.range(0,height,height/11).reverse()),
    data = xRange.map( (d,i) => [ d, 0] ),
    el = d3.select('svg') 
    // because firefox renders subpixels differently
    m = (/Linux|Firefox/).test(navigator.userAgent) ? 0 : .5;

    console.log(m)

    let currData = data.slice(0),
        timer;

    xScale.domain([0, 2*Math.PI])
        .range([0, width]);

    yScale.domain([0,height/hFactor])
        .range([height,0]);

    const sine = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(Math.sin(d[1])) - m)
        .curve(d3.curveMonotoneX);

    const lines = el.selectAll('path')
        .data(colors)
        .enter()
        .append('path')
        .attr('id', d => d)
        .attr('d', sine(currData));

    blurb.classed('bordered',true);
    lines.transition()
        .style('opacity',1);

    function updatePath(reset = false) {

        lines.interrupt();

        lines.transition()
            .ease(d3.easeCircleOut)
            .duration(300)
            .attr('d', function(d,i) {
                let index = i;
                let yFactor = reset !== false ? 0 
                    : (height/10 - currMouseY)/hFactor - (Math.pow(-1,index) * index * offset);
                currData = xRange.map( (d,i) => [d, Math.sin(yRange[i] * yFactor)]);

                return sine(currData) 
                });  
    }

    function handleMove(d) {

        currMouseY = d3.mouse(el.node()) !== null ? d3.mouse(el.node())[1] : 0;
        updatePath();

        clearTimeout(timer);
        timer=setTimeout(handleMoveEnd,300);
    }

    function handleMoveEnd(d) {
        updatePath(true);
    }

    blurb.on('mousemove | touchmove', d => handleMove(d) );

}());