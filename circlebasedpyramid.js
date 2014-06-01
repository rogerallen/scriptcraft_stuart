exports.circlebasedpyramid = function(boxtype,base,stopper,slope) {
    if(typeof base == 'undefined' ) {
        base = 10;
    } 
    if(typeof stopper == 'undefined' ) {
        stopper = base;
    } 
    this.chkpt('circlebasedpyramid');
    var x = this;
    for(var cur_base = base; cur_base > stopper; cur_base = cur_base - 1 ) {
        x = x.cylinder0(boxtype,cur_base,slope)
	     .cylinder(boxtype,cur_base,1)
	     .fwd(cur_base)
	     .right(cur_base)
	     .box(boxtype,1,slope,1)
	     .back(cur_base)
	     .left(cur_base)
	     .fwd()
	     .up(slope)
	     .right();
    }
    return this.move('circlebasedpyramid');
};