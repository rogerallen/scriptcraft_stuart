exports.squarebasedpyramidstopper = function(boxtype,base,height) {
    if(typeof base == 'undefined' ) {
        base = 10;
    } 
    this.chkpt('squarebasedpyramid');
    var x = this;
    for(var cur_base = base; cur_base > height; cur_base = cur_base - 2 ) {
        x = x.box0(boxtype,cur_base,1,cur_base)
	     .up()
	     .fwd()
	     .right();
    }
    return this.move('squarebasedpyramid');
};
