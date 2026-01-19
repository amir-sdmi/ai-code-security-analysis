function wholepower(base, exp){
	let res = 1;
	while(exp>0){
		res *= base;
		exp--;
	}
	return res;
}

function wholeroot(base, exp =1, precision = 10){
	let high = base; let low = 0;
	let guess = 0; let oldguess = guess;
	let boo = true;
	let step = 1;
	let prec = 0;
	//find initial guess;
	while(boo){
		oldguess = guess;
		guess += step;
		let approx = wholepower(guess, exp);
		if( approx > base){
			boo = false;
			high = guess;
			guess = oldguess;
			step /= 10; prec++;
		}else{
			low = guess;
			step *= 10;
		}
	}
	//approximation (bisection approximation)
	while(high > low){
		let approx = wholepower(guess, exp);
		if(approx > base){
			high = guess;
			guess = low;
			step /= 10;
			prec++;
		}else{
			if(approx == base){ 
				return guess;
			} else { 
				low = guess;
				guess += step;
			}
		}
		if(prec >= precision){break;}
	}
				return guess;
	
}

class SphericalCoordinates {
	
	constructor(r=0, a=0, i=0){
/* The problem is the at a 3d radius, projects, from (0,0,0) to (i,j,k) in a lattice form, is converted to these particular style of spherical coordinates, 
by trigonometry which is 2d. The 3D radius is projected onto the xy plane, and the xy plane's angle, from positive x axis. (azimuth = atan2(y,x) And then from that plane, the xy line is raised into the z dimension, according to the increment. 
This means that altering the azimuth affects 2 dimensions, but altering the inclination affects only 1 dimension. The atan2 function and its sincos and sinsin inverse works out nicely, because the quadrants are observed and kept. 

My first idea, is to have a tangible tetrahedron inside each sphere. And then the radius of the point-in-question is a tangible line. So now each point within the system (system of points held within the sphere), wants to rotate by some incremental direction. And each of the four faces, has its parallel face, and opposite 2 opposing faces. Meaning that we orient the tetrahedron into two halves? as a cube is oriented into 3 halves. In a cube it is easy to see that from the center, a radius to a point, as the point moves, its radius would trace a line along the cube's face. and if there were another point whose radius hit some other face, then that radius would trace similar direction, as that is what we learnt that rotation occurs around an axis. The opposite face would move in the opposite objective direction, and the two lateral faces would move such that if the face were to slide into that lateral face's position, the movement would be the same. 

So in a tetrahedron 4 faced region, since one face shares its 3 lines with 3 faces. Movement of a point (the point of intersection between the face's plane and the radius), relative to the face's center, would translate according to rotation, only if the face flipped on its 'edge hinge' . 
Thus the movement, would be 'inverse, as movement measured in between the nearest line, and its face's center, , and then that neighbouring face, and the neighbouring face's center  and the face's edge, but in inverse, depending on the position of the first moving point, relative to its edges. 

*/	
	this.radius = r;
		this.azimuth = a;
		this.inclination = i;
	}
	
	logger(){
		console.log(`R ${this.radius}  a${this.azimuth}  i${this.inclination}`);
	}
	
	getRadius(){ return this.radius;}
	getAzimuth(){return this.azimuth;}
	getInclination(){return this.inclination;}
	
	setRadius(r){ this.radius = r;}
	setAzimuth(a){ this.azimuth = a;}
	setInclination(i){ this.inclination = i;
	//When inclination changes, z changes, since z changes regarding radius = 
	let nz = this.radius * Math.cos(this.inclination);
	let nz2 = wholepower(nz, 2);
	let rd2 = wholepower(this.radius, 2);
	let xy2 = rd2 - nz2;
	let yx = wholeroot(xy2, 2);
	let xy = this.radius * Math.sin(this.inclination); //xy = yx
	let nx = yx * Math.cos(this.azimuth);
	let ny = yx * Math.sin(this.azimuth);
	console.log(` nz=${nz}  nx=${nx}  ny=${ny} `);
	}
	set3d(r, a, i){
		this.radius = r;
		this.azimuth = a;
		this.inclination = i;
	}

	addRadius(adra){
		this.radius += adra;
		if(this.radius < 0){this.radius *= -1;}
	}
	
	addAzimuth(value){
		this.azimuth = (this.azimuth + value)% (2 * Math.PI);
		if(this.azimuth < 0){
			this.azimuth += 2 * Math.PI;
		}
	}
	
	minusAzimuth(value){
		this.azimuth = (this.azimuth - value) % (2 * Math.PI);
		//ex: az = q/2 val = q. az = -q/2 = 7q/2
		if(this.azimuth < 0){
			this.azimuth += 2 * Math.PI;
		}
	}
	
	addInclination(value){
		let sum = this.inclination + value;
		let pi = Math.PI;
		let twoPi = 2*pi;
console.log(`sum here is ${sum} . `);	
//100 if sum is larger than pi, then angle plus value has reached past the top of the north pole. 
	if(sum > pi){
//102 thus we need to know how many times the value has pushed the angle, in multiples of pi. a) if the angle has moved into the pi<2pi hemisphere, then then ( pi - (2pi - (sum%2pi)) ) is the bouncedown. b) otherwise, the angle has been pushed back into the 0<pi range. then the new angle is ( sum % pi) 
	let multiple = Math.floor(sum / pi);
		if(multiple % 2 === 0){
//105 if the sum has moved a full circle, it has gone  up hit the pole and bounced down 1, then gone down and hit the south and bounced back up. So, the angle is moving in the original quadrant (up) not down. 
			let diff = sum % twoPi;
this.setInclination( diff); 
		} else {
//114 otherwise the sum is coming down, so  
//this.inclination = pi - (sum % pi);
		this.setInclination( pi - (sum % pi));
		}
	} else {
		this.setInclination(sum) ;
	}
	
	
console.log(`inclination here is ${this.inclination} . `); 
	}

	minusInclination(value){
let difference = this.inclination - value;
let pi = Math.PI;
let twoPI = 2*pi;

//check if the difference is less than 0
if(difference < 0){
//Determine if the absolute difference is beyond an even or an odd multipe of pi.
	let multiple = 
	Math.floor(Math.abs(difference)/pi);
	if(multiple % 2 === 0){
//even multiple of pi, spindle has wrapped around sphere 
	let diff = Math.abs(difference) % twoPi;
	if(diff < this.inclination){
//spindle moves down.
		this.inclination = diff;
	}else{
//spindle moves up.
		this.inclination = twoPi - diff;
	}
	}else{
//odd multiple of pi, spindle has bounded back up off the 0 pole.
	this.inclination = Math.abs(difference) % pi;
 }
 }else{this.inclination = difference;}	

//safetycheck should put out error message.
if(this.inclination < 0){
	this.inclination = 0;
}else if(this.inclination > pi){
	this.inclination = pi;
}

}
	
	toCartRefDot(){
let ex = this.radius * Math.sin(this.inclination) * Math.cos(this.azimuth);
let ey = this.radius * Math.sin(this.inclination) * Math.sin(this.azimuth);
let ez = this.radius * Math.cos(this.inclination);
	return new RefDot(ex, ey, ez);
	}


};

class quarternion {
	constructor(a,b,c,d){
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
	}
	logger(){
		console.log(`a${this.a}b${this.b}c${this.c}d${this.d}`);
	}
	multiply(q){
		return new quarternion(
(this.a * q.a) - (this.b * q.b) - (this.c *q.c) - (this.d * q.d),
(this.a * q.b) + (this.b * q.a) + (this.c * q.d) - (this.d*q.c),
(this.a * q.c) - (this.b * q.d) + (this.c * q.a) + (this.d * q.b),
(this.a *q.d) + (this.b*q.c) - (this.c*q.b) + (this.d * q.a)
		);
	}
	conjugate() {
return new quarternion(
this.a, -this.b, -this.c, -this.d); 
	}
}

function rotateRefPoint(point, axis, angle){
point = dr(point);
axis = dr(axis);
let p = new quarternion(0, point.x, point.y, point.z);
	let q = new quarternion(Math.cos(angle/2), axis.x*Math.sin(angle/2), axis.y*Math.sin(angle/2), axis.z * Math.sin(angle/2)); 
	let pPrime = q.multiply(p).multiply(q.conjugate()); 
	let retval = new RefDot(pPrime.b, pPrime.c, pPrime.d); 
	return retval;
}

function rotatePoint(point, axis, angle){
//Given a point to move, around the axis, where the angle is like the rotation around the axis. 
//So if I place two 5tetrahedrons, as overlapping neighbours
// Given one 5tetrahedron is fixed, and the other freshly-unfixed, 
//then i can find (either, any or closest) point in fresh tetrahedron (which is radial point, since center of new tetrahedron is placed on point. 
//and then i can find the plane on which these 3 points the 2 origins and the new selected point
//then find the middle 'axis' (which if the point is close enough, the middle axis can maybe be average of component vectors of the two we seek to unite.
//then use quarternion rotation, to incrementally rotate all the points of the fresh 5tetrahedron, 
//and when rotation happens, for each increment of the angle the freshsphere5tet, must translate to (0,0,0) for the rotation, since the axis is running through 0,0,0 . 
//and then when the increment has happened, the fresh5tet moves back to the point, and then the new location of that point, is seen if it is on the old origin, by some margin of a fraction (pixels +- 0.5)

	let p = new quarternion(0, point.x, point.y, point.z);
	let q = new quarternion(Math.cos(angle/2), axis.x*Math.sin(angle/2), axis.y*Math.sin(angle/2), axis.z * Math.sin(angle/2));
	let pPrime = q.multiply(p).multiply(q.conjugate());
	let retval = new RefDot(pPrime.b, pPrime.c, pPrime.d);
	return retval;
}

 
//XXX axis is normal to plane, but use angle already found. 
function matchtwotets2(tet1, tet2, ind = 2){
  //  if((tet1 instanceof SphTetrahed)&&(tet2 instanceof SphTetrahed)){}else{return;}
// move second tet to first tet  point  ind

tet2.move(tet1.points[ind]);
 tet2.globalize_fromNodesToPoints(2);
 
//find closest point. 
let flag23 = 0;
let line1 = new RefLine(tet1.center, tet2.points[0]);
if(line1.distance == 0){flag23 = 1;}
let line2 = new RefLine(tet1.center, tet2.points[1]);
if(line1.distance > line2.distance){ if(line2.distance!=0){line1 = line2;flag23 = 1;}}    
line2 = new RefLine(tet1.center, tet2.points[2]);
if(line1.distance > line2.distance){if(line2.distance!=0){line1 = line2;flag23 = 2;}}    
line2 = new RefLine(tet1.center, tet2.points[3]);
if(line1.distance > line2.distance){ if(line2.distance!=0){line1 = line2;flag23 = 3;}}
// copy the 3 points . 
let c1 = dr(tet1.center).copyOfDot(); c1 = dr(c1);
let c2 = dr(tet2.center).copyOfDot(); c2 = dr(c2);
let p3 = tet2.points[flag23].copyOfDot();p3 = dr(p3);
// move all three points such that  c2 is on (0,0,0)
c1.subtractDot(c2); p3.subtractDot(c2); c2.subtractDot(c2); //c2 = 000
//console.log("inside the match2tetfuncion "); c1.logger(); c2.logger(); p3.logger();
let tri1 = new RefTriangle(c1, c2, p3);
//if(tri1 instanceof RefTriangle){console.log("Triangle is here");}
let LA = tri1.createNormalVector();
LA = dr(LA);
//if(LA instanceof RefDot){LA.logger();}
let LAL = new RefLine(c2, LA);
// get axis 
//let line13 = new RefLine(c1, p3);let LA2 = new RefLine(dr(line13).center, c2);let LA2X = LA2.getUnitVector();console.log(`LA2X is`);LA2X.logger();
let LAX = 	LAL.getUnitVector();

//console.log(`c2,LA is  and LAX is`);c2.logger();LA.logger();LAX.logger();
//get angle
let L1 = new RefLine(c2, c1);
let L2 = new RefLine(c2, p3);
let num1 = dr(L1.delta).dotproduct(L2.delta);
let den1 = L1.distance * L2.distance; 
if(den1 < 0){den1 *= -1;}
let angl1 = Math.acos(num1/den1);
//then move tet2 to (0,0,0);
//c1.resetxyzt(tet2.centroid);
tet2.move(c2);              
//rotate tet2
for(let i1 = 0; i1 < 4; i1++){
   tet2.points[i1] = rotatePoint(tet2.points[i1], LAX, angl1);
}
tet2.centralizeNodes();
//move tet2 back to fi  rst tet point ind
    tet2.move(tet1.points[ind]);
    tet2.centralizeNodes();
}

function match2Tet(tet1, tet2, ind = 0, ind2 = 0){
// SHOULD  IMPLIMENT SHORTEST DISTANCE CHECKER  rather than random ind and ind2   = 4 lines between tet1.npoints[ind] and each point of tet2
if((tet1 instanceof SphTetrahed)&&(tet2 instanceof SphTetrahed)){}else{return;}
    let mv1 = tet1.points[ind]; 
//console.log(" tetrahedron ONE ");
//tet1.logger();
//console.log("Point ind is ");
//mv1.logger();
//console.log(" tetrahedron TWO before MOVE ");
//tet2.logger();
    tet2.move(mv1);
tet2.globalize_fromNodesToPoints(2);    //rejigs points[]


//console.log(" tetrahedron TWO after MOVE ");
//tet2.logger();

//tet2 now could be new
//find axis.
let nl1 = new RefLine(tet1.points[ind], tet2.points[ind2]);
let ax1 = new RefLine(nl1.center, tet2.centroid);
let axi1 = ax1.getUnitVector();
//console.log("HEre is axis");
//axi1.logger();
//get angle
let anli1 = new RefLine(tet1.centroid, tet1.points[ind]);
//console.log("tet ONE centroid is ");
//dr(tet1.centroid).logger();
//console.log("tet ONE point 1 ");
//dr(anli1.delta).logger();
//console.log("tet two point 1 ");
//dr(anli1.delta).logger();
let anli2 = new RefLine(tet1.points[ind], tet2.points[ind2]);
let num1 = dr(anli1.delta).dotproduct(dr(anli2.delta));
//console.log("an line ONE delta is ");
//dr(anli1.delta).logger();
//console.log("an line TWO delta is ");
//dr(anli2.delta).logger();

let den1 = anli1.distance * anli2.distance; if(den1 < 0){den1 *= -1;}else if(den1 == 0){return -1;}
let angl1 = Math.acos(num1/den1);
console.log(` here is angle ${angl1} from num ${num1} and denm ${den1}`);
//spin
for(let i1 = 0; i1 < 4; i1++){
let loopans1 =  rotatePoint(tet2.points[i1], axi1, angl1);
tet2.points[i1] = loopans1;
}
tet2.centralizeNodes();
//remove
mv1.singlefactormultiply(-1);
tet2.move(mv1);
tet2.globalize_fromNodesToPoints(2);
return tet2;//pass by instaneces




}

class LocatedNode{
	//needs update{coherence} function?
	//justsendnew sph to spherictocarte(sph)!!
	updateSTC(){
if(this.sphe instanceof SphericalCoordinates){
let ex = this.sphe.getRadius() * Math.sin(this.sphe.inclination) * Math.cos(this.sphe.azimuth);

let ey = this.sphe.getRadius() * Math.sin(this.sphe.inclination) * Math.sin(this.sphe.azimuth);
let ez = this.sphe.getRadius() * Math.cos(this.sphe.inclination);
//console.log(`inside updateSTC ${this.sphe.azimuth} Sph=   ${this.sphe.getRadius()},${this.sphe.getAzimuth()},${this.sphe.getInclination()} cart  ${ex},${ey},${ez}`);
this.cart.setX(ex);
this.cart.setY(ey);
this.cart.setZ(ez);
//xxx radius
//let et = this.sphe.R;
//this.cart = new RefDot(ex,ey,ez,et);
}else{console.log("DDDDDDDDDDD");}
	}
	
	updateCTS(){
if(this.cart instanceof RefDot){
	let x2 = wholepower(this.cart.x, 2);
	let y2 = wholepower(this.cart.y, 2);
	let z2 = wholepower(this.cart.z, 2);
let r2 = wholeroot( (x2 + y2 + z2), 2);
let t2 = Math.atan2(this.cart.y, this.cart.x); 
let p2 = Math.acos(this.cart.z / r2);
this.sphe = new SphericalCoordinates(r2,t2,p2);
}else{console.log("XXXXXXXXXXX");}
	}
	
	SphericToCarte(spa){
if(spa instanceof SphericalCoordinates){
let ex = spa.getRadius() * Math.sin(spa.inclination) * Math.cos(spa.azimuth);
let ey = spa.getRadius() * Math.sin(spa.inclination) * Math.sin(spa.azimuth);
let ez = spa.getRadius() * Math.cos(spa.inclination);
this.cart.setX(ex);
this.cart.setY(ey);
this.cart.setZ(ez);
this.sphe = spa;
		}
	}
	
	CartToSphe(spc){
		if(spc instanceof RefDot){
	let x2 = wholepower(spc.x, 2);
	let y2 = wholepower(spc.y, 2);
	let z2 = wholepower(spc.z, 2);
let r2 = wholeroot( (x2 + y2 + z2), 2);
let t2 = Math.atan2(spc.y, spc.x); 
//console.log(` atan2 ${t2}  and ${spc.y} and ${spc.x}`);
let p2 = Math.acos(spc.z / r2);
	this.sphe = new SphericalCoordinates(r2, t2 , p2); 
	this.cart = spc;
		}
	}
	
	constructor(point){
		this.cart;
		this.sphe;
		this.quart;
if(point instanceof SphericalCoordinates){
	this.sphe = point;
	this.cart = this.SphericToCarte(point);	
}else if(dr(point) instanceof RefDot){
	this.cart = dr(point);
//dr helps to pass by reference (stored once on the heap)	
	this.CartToSphe(this.cart);
}
	}
	
	logger(){
	this.cart.logger();
	this.sphe.logger();
	//console.log(`spherical R ${this.sphe.radius} a ${this.sphe.azimuth} i ${this.sphe.inclination} `);
	//console.log(`cartesian X ${this.cart.x} Y ${this.cart.y} Z ${this.cart.z} `);
}
	
}

class TimeSpheroid {
	//This is the DBN of Idea#1
	constructor(orig = new RefDot(0,0,0)){
		this.points = [];
		this.edges = [];
		this.ISE = [];
	}
};
class TickSphere {
	//this is the slice of Idea#1
	constructor(Tee = 0){
		this.radius = Tee;
	}
}
class PresentSphere{
/*#idea1 attempt may be deleted.
//#idea1 was based on the unidirectional growing lattice without overlap. #idea2 was based on the 4D lattice omnidirectional growth */
	constructor(){
		
	}
}

class SphTetrahed{
	
	constructor(length = 1){
		this.centroid;
		this.kala = "#000000"; 
		this.volume;
		this.screen;
		this.points = [];//global points
		this.lines = [];
		this.nodes = []; // local points
		this.selfnodes = [];
this.repoint(1, length);
this.center; 
this.centralizeNodes(3);  

	}
	
	repoint(flat = 1, length = 1){		
if(flat == 1 ){	
let p1 = new RefDot(0,0,0);		
let ax = new RefDot(1,0.1,0.1); 
this.points[0] = rotateRefPoint(p1,ax,0.1); 
let a = length ;let b = 0;	let c = 0;
p1 = new RefDot(a,b,c);
this.points[1] =  rotateRefPoint(p1,ax,0.1); 
a = (length / 2)  ;	b = (length * wholeroot(3,2,4) ) / 2;		c = 0;
p1 = new RefDot(a,b,c);
this.points[2] =   rotateRefPoint(p1,ax,0.1); 
a = (length  / 2) ;b = ( length ) /  (2 * wholeroot(3, 2,4));c = (length  ) * ( wholeroot(2,2,4) / wholeroot(3,2,4)); 
p1 = new RefDot(a,b,c);  
 this.points[3] =  rotateRefPoint(p1,ax,0.1); 
return;
}				
		if(flat == 2){
let a = (wholeroot(2, 2) / wholeroot(3,2) ) * (length / 3);
	let b = (length / 3) / wholeroot(2,2);
	let c = (-length / 3) / wholeroot(6,2);
this.points[0] = new RefDot(a,b,c);
	a =  length/ wholeroot(2,2); 
this.points[1] = new RefDot(0,a,0);
	a = (length / -3) * (wholeroot(2,2) / wholeroot(3, 2)) ;
	b = (length / 3 ) / wholeroot(2, 2);
	c = (length / 3 ) / wholeroot(6, 2);
this.points[2] = new RefDot(a,b,c); 
a = (length  / -3) * (wholeroot(2, 2) / (2 * wholeroot(3,2)));
b = ( length / 3 ) /  wholeroot(2, 2);
c = (length  / -3) /  wholeroot(6, 2); 
 this.points[3] = new RefDot(a,b,c);  
		}
	}
	
	findcenter(){ 
//let firstline = new RefLine(this.points[0], this.points[1]);
let firstTri = new RefTriangle(this.points[0], this.points[1], this.points[2]);
let secondTri = new RefTriangle(this.points[0], this.points[1], this.points[3]); 
			//take one line, make two triangles to other points. 
let firstline = new RefLine(firstTri.center, this.points[3]);
let secondline = new RefLine(secondTri.center, this.points[2]); 
			// find centers and make lines
			//find intersection of two lines for center. 
 this.center = firstline.InfInt3(secondline);
 this.centroid = dr(this.center);
	}
	findcentroid(flag = 1){
		if(flag == 3){
			this.findcenter();
		}
		if(flag == 1){
		    //local to nodes, ie oenter = 0,0,0
let x4 =  (this.nodes[0].cart.x + this.nodes[1].cart.x + this.nodes[2].cart.x + this.nodes[3].cart.x )/4;
let y4 =  (this.nodes[0].cart.y + this.nodes[1].cart.y + this.nodes[2].cart.y + this.nodes[3].cart.y )/4;
let z4 =  (this.nodes[0].cart.z + this.nodes[1].cart.z + this.nodes[2].cart.z + this.nodes[3].cart.z )/4;
		this.centroid = new RefDot( x4, y4, z4 );
		}
		if(flag == 2){
//local opoints, i.e global center for  ater localizatoof spp nodes. 
let x4 =  (this.points[0].x + this.points[1].x + this.points[2].x + this.points[3].x )/4;
let y4 =  (this.points[0].y + this.points[1].y + this.points[2].y + this.points[3].y )/4;
let z4 =  (this.points[0].z + this.points[1].z + this.points[2].z + this.points[3].z )/4;
		this.centroid = new RefDot( x4, y4, z4 );	
		}
	}
	centralizeNodes(flag1 = 3){
		//this function takes the differences between the centroid and the 4 points, then creates the 4 selfnodes. 
		//this function is opposite of globalize_fromNodesToPoints (ie: fromPointsToNodes
		this.findcentroid(flag1);	
		for(let i3 = 0; i3 < 4; i3++){
			let x3 = this.points[i3].x - this.centroid.x;
			let y3 = this.points[i3].y - this.centroid.y;
			let z3 = this.points[i3].z - this.centroid.z;
this.nodes[i3] = new LocatedNode(new RefDot(x3, y3, z3)); 
		}
	}
	logger(){
		this.nodes[0].logger();
		this.nodes[1].logger();
		this.nodes[2].logger();
		this.nodes[3].logger();
		
	}
	globalize_fromNodesToPoints(flag = 1){
if(flag == 1){		this.findcentroid(3);}
//adds nodes.cart to centroid, for points.
		for(let ic1 = 0; ic1 < 4; ic1++){
	let xd2 = this.nodes[ic1].cart.x + this.centroid.x;
	let yd2 = this.nodes[ic1].cart.y + this.centroid.y;
	let zd2 = this.nodes[ic1].cart.z + this.centroid.z;
	this.points[ic1] = new RefDot(xd2, yd2, zd2);
		}
	}
	updatesLines(){
		this.globalize_fromNodesToPoints();
		//triple scalar crossproduct = volume
this.lines[0] = new RefLine(this.points[0], this.points[1]);
this.lines[1] = new RefLine(this.points[0], this.points[2]);
this.lines[2] = new RefLine(this.points[0], this.points[3]);

//calculate volume as scalar triple dot cross product
let r1 = dr(this.lines[0].delta).Xproduct(this.lines[1].delta)
let r2 = dr(this.lines[2].delta).dotproduct(r1);

this.volume = r2/6; console.log(`volume is ${this.volume}`);
 console.log(`center ${(this.centroid).x} , ${(this.centroid).y}, ${(this.centroid).z} `);
	}
	drawtetlines(a1, col = "#000000"){
	    this.kala = col;
		this.screen = a1;
 this.updatesLines(); 
 this.lines[0].colour = col;
 this.lines[1].colour = col;
 this.lines[2].colour = col;
 this.screen.depthdraw(this.lines[0]);
 this.screen.depthdraw(this.lines[1]);
 this.screen.depthdraw(this.lines[2]);
 }
drawspokes(a1 = this.screen){
    this.globalize_fromNodesToPoints(3);
    let line1 = new RefLine(this.centroid, this.points[0]); line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 1 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[1]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 2 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[2]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 3 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[3]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 4 ${line1.distance}`);
    
}
	spinAllByAzimuth(val = 0.01){
		for(let i1 = 0; i1 < 4; i1++){
this.nodes[i1].sphe.addAzimuth(val); 
this.nodes[i1].updateSTC();
		}
	//	this.globalize_fromNodesToPoints(1);
	}
	spinAllByInclination(val = 0.01){
		for(let i1 = 0; i1 < 4; i1++){
this.nodes[i1].sphe.addInclination(val);
		}
for(let i1 = 0; i1 < 4; i1++){		
this.nodes[i1].updateSTC();
}
	}
	move(addend){
//as in move thhis tet 's centroid to addend'
//either means center +=  (addend - centroid) ;  entroid = addend;
	    addend = dr(addend);
	    if(addend instanceof RefDot){   
	        this.centroid.resetxyzt(addend);
	    }
	 }
	
	qspinY(ang = 0.1){
		let axY = new RefDot(0,1,0);
	for(let i1 = 0; i1 < 4; i1++){
		this.points[i1] = rotateRefPoint(this.points[i1], axY, ang);
	}
	}
	};
	
class TempEdge {
constructor(Tee = 0, FRI = 0, ST = 1, TRI = 1){
    this.present = Tee;
    this.herePoint = FRI;
    this.toPoint = TRI;
    this.toST = ST;
}    
isOld(){
    return (this.toST < this.present)?true:false;
}
isNext(){
    return (this.toST> this.present)?true:false;
}
}

class EdgeQuartet {
    constructor(phere){
this.edges = [new TempEdge(), new TempEdge(), new TempEdge(), new TempEdge() ];
        if( dr(phere) instanceof RefDot ){
            //can make this more efficient with no here in tempedge
            this.edges[0].herePoint = phere;
            this.edges[1].herePoint = phere;
            this.edges[2].herePoint = phere;
            this.edges[3].herePoint = phere;        
        }
    }
}


class TSpheroid {
	//timeslice
    constructor(Tee){
        this.Present = Tee;
        this.points = [];
        this.ISEQ = new Map();//intersliceedges
    }    
    addPointRefs(pr){
        this.points.push(pr);
    }
}

class Lattice {
    constructor(cen, dist = 40, peri = 1){
        if(dr(cen) instanceof RefDot){
        this.origin = cen;
        }
        this.time = -1;
        this.spheroids = [];
        this.todays = [];
        this.yesterdays = [];
        this.dist = dist;
    }
    
    StartAtZero(){//init
	let timehere = this.time + 1;
        let b = new SphTetrahed(this.dist);
//make new tet for today
        this.todays.push(b);
        let z0 = new TSPheroid(timehere);
        z0.addPointsRef(b.center.regind);
//create spheroid and add the new point
		let eq0 = new EdgeQuartet(b.center.regind);
		eq0.edges[0].toPoint = b.points[0].regind;
		eq0.edges[1].toPoint = b.points[1].regind;
		eq0.edges[2].toPoint = b.points[2].regind;
		eq0.edges[3].toPoint = b.points[3].regind;

		z0.ISEQ.set(b.center.regind, eq0);
//correctly temporally-align the edges
		this.spheroids.push(z0);//?spheroids[0]=z0;?
    //add spheroid to lattice's stream
	}
	
	NextDay(){
		this.yesterdays = []; // not +=
		this.yesterdays = this.todays;
		for(let it1 = 0; it1 < this.yesterdays.length; it1++){
			for(let it2 = 0; it2 < 4; it2++){
				
			}
		}
	}
    
    
}



class MuriSphTetrahed{
	
	constructor(length = 1){
if(length < 4){ length = 144;}
	//Since the 3D center remains the 3D center, 
	//the uncalibrated Muri reduces.
	//so it shrinks on the spot. 
	//so for the time, the L reduces, otherwise 
	//the volume reduces.
// So, given T-dur = 16/9 * L should:
// 1) the tetrahedron reduce according to the 3D-displaced uncalibrated center + L (7 parts)?
// Why did I think that height of tetrahedron = L*4/3 and circumcenter of Tetrahedron is 1/3 * L from base ? 
//I worked it out by finding the distance from the tetrahedron center, to the face center which was 1/4 of the L
// And since Tetrahedron_height = L * (6^0.5)/3?
// and Tet_height = 0.5 * (3^0.5) * L 
// and L = C * 2, then C = L/2 
// and Tet_height = C * (3^0.5)/4 
	
// or 2) the tetrahedron as function of L reduces from L to 0 for T-dur.
this.duration = length * wholeroot(6,2); this.duration /= 3;
//
this.side = length;
  	let cter = new RefDot(0,0,0); 
	this.centroid = cter.regind;
		this.kala = "#000000"; 
		this.volume;
		this.screen;
		this.points = [];//global points
		this.lines = [];
		this.nodes = []; // local points
		this.selfnodes = [];
this.findcentroid(2);	
this.repoint(1, this.side);
 cter = new RefDot(0,0,0); 
this.center = cter.regind;
this.findcenter();
this.centralizeNodes(3);  

	}
	
	repoint(flat = 1, length = 1){		//flat == flag
if(flat == 1 ){//flag == 1 creates a new tetrahedron based on length argument using chatgpt's formula, where the dots are rotated about the origin around arandom axis. (because line.InfInt3(line) doesn't work on axial-paralel lines. ) 	
let p1 = new RefDot(0,0,0);		
let ax = new RefDot(1,0.1,0.1); 
this.points[0] = rotateRefPoint(p1,ax,0.1); 
let a = length ;let b = 0;	let c = 0;
p1 = new RefDot(a,b,c);
this.points[1] =  rotateRefPoint(p1,ax,0.1); 
a = (length / 2)  ;	b = (length * wholeroot(3,2,4) ) / 2;		c = 0;
p1 = new RefDot(a,b,c);
this.points[2] =   rotateRefPoint(p1,ax,0.1); 
a = (length  / 2) ;b = ( length ) /  (2 * wholeroot(3, 2,4));c = (length  ) * ( wholeroot(2,2,4) / wholeroot(3,2,4)); 
p1 = new RefDot(a,b,c);  
 this.points[3] =  rotateRefPoint(p1,ax,0.1); 
return;
}				
		if(flat == 2){
let a = (wholeroot(2, 2) / wholeroot(3,2) ) * (length / 3);
	let b = (length / 3) / wholeroot(2,2);
	let c = (-length / 3) / wholeroot(6,2);
this.points[0] = new RefDot(a,b,c);
	a =  length/ wholeroot(2,2); 
this.points[1] = new RefDot(0,a,0);
	a = (length / -3) * (wholeroot(2,2) / wholeroot(3, 2)) ;
	b = (length / 3 ) / wholeroot(2, 2);
	c = (length / 3 ) / wholeroot(6, 2);
this.points[2] = new RefDot(a,b,c); 
a = (length  / -3) * (wholeroot(2, 2) / (2 * wholeroot(3,2)));
b = ( length / 3 ) /  wholeroot(2, 2);
c = (length  / -3) /  wholeroot(6, 2); 
 this.points[3] = new RefDot(a,b,c);  
		}
	}
	
	ReturnTimeStream(){
var TetTimStr = new TimeStream(this.center, this.side);
for(let inc1 = 0;inc1 < this.duration; inc1++){
	
	 let creep = this.nodes[0].sphe.getRadius() / this.duration;
	 this.changeR(creep);creep+=creep;
	 this.globalize_fromNodesToPoints(0);
	 let tisl = new Timeslice(inc1);
	 tisl.addTet(this,this.duration - inc1);
	 TetTimStr.AddTSlice(tisl);
	 //TetTimStr.orderedAddTSlice(tisl);
}
return TetTimStr;
	}
	
	findcenter(){ 
	//finds the circumcenter of the tetrahedron.
//let firstline = new RefLine(this.points[0], this.points[1]);
let firstTri = new RefTriangle(this.points[0], this.points[1], this.points[2]);
let secondTri = new RefTriangle(this.points[0], this.points[1], this.points[3]); 
			//take one line, make two triangles to other points. 
let firstline = new RefLine(firstTri.center, this.points[3]);
let secondline = new RefLine(secondTri.center, this.points[2]); 
			// find centers and make lines
			//find intersection of two lines for center. 
 this.center = firstline.InfInt3(secondline);
// this.centroid = dr(this.center);
	}
	
	findcentroid(flag = 2){
		if(flag == 3){
			this.findcenter();
		}
		if(flag == 1){
    //centroid is relative to nodes, which means nonsense, really.
let x4 =  (this.nodes[0].cart.x + this.nodes[1].cart.x + this.nodes[2].cart.x + this.nodes[3].cart.x )/4;
let y4 =  (this.nodes[0].cart.y + this.nodes[1].cart.y + this.nodes[2].cart.y + this.nodes[3].cart.y )/4;
let z4 =  (this.nodes[0].cart.z + this.nodes[1].cart.z + this.nodes[2].cart.z + this.nodes[3].cart.z )/4;
		this.centroid = new RefDot( x4, y4, z4 );
		}
		if(flag == 2){
//local opoints, i.e global center for  ater localizatoof spp nodes.
// This means that the  
let x4 =  (dr(this.points[0]).x + dr(this.points[1]).x + dr(this.points[2]).x + dr(this.points[3]).x )/4;
let y4 =  (dr(this.points[0]).y + dr(this.points[1]).y + dr(this.points[2]).y + dr(this.points[3]).y )/4;
let z4 =  (dr(this.points[0]).z + dr(this.points[1]).z + dr(this.points[2]).z + dr(this.points[3]).z )/4;
		dr(this.centroid).moveIn3D( x4, y4, z4 );	
		}
	}
	
	centralizeNodes(flag1 = 3){
		//this function takes the differences between the centroid and the 4 points, then creates the 4 selfnodes. 
		//this function is opposite of globalize_fromNodesToPoints (ie: fromPointsToNodes
		this.findcenter();	
		for(let i3 = 0; i3 < 4; i3++){
			let x3 = dr(this.points[i3]).x - dr(this.center).x;
			let y3 = dr(this.points[i3]).y - dr(this.center).y;
			let z3 = dr(this.points[i3]).z - dr(this.center).z;
this.nodes[i3] = new LocatedNode(new RefDot(x3, y3, z3)); 
		}
	}
	
	logger(){
		this.nodes[0].logger();
		this.nodes[1].logger();
		this.nodes[2].logger();
		this.nodes[3].logger();
		
	}
	
	globalize_fromNodesToPoints(flag = 1){
if(flag == 1){		this.findcentroid(3);}
//adds nodes.cart to centroid, for points.
		for(let ic1 = 0; ic1 < 4; ic1++){
	let xd2 = this.nodes[ic1].cart.x + dr(this.center).x;
	let yd2 = this.nodes[ic1].cart.y + dr(this.center).y;
	let zd2 = this.nodes[ic1].cart.z + dr(this.center).z;
//	this.points[ic1] = new RefDot(xd2, yd2, zd2);
dr(this.points[ic1]).setX(xd2);
dr(this.points[ic1]).setY(yd2);
dr(this.points[ic1]).setZ(zd2);
	

	}
	}
	changeR(Ras = 10){
	if(this.nodes[0] instanceof LocatedNode){
			this.nodes[0].sphe.setRadius(Ras);
			this.nodes[1].sphe.setRadius(Ras);
			this.nodes[2].sphe.setRadius(Ras);
			this.nodes[3].sphe.setRadius(Ras);
		}
	}
	
	createLines(){
		//This function creates the 3 cornerstone lines of the tetrahedron. Since this tetrahedron works as a center-localizedsphericalcoordinates-globalrefdots heirarchy, the lines exist as global entities. 
//xxx provided the refdot is ref'd there's no need to recreate the lines, just update(movein3d) their 2 dots). 
		this.globalize_fromNodesToPoints(0);
		//triple scalar crossproduct = volume
this.lines[0] = new RefLine(this.points[0], this.points[1]);
this.lines[1] = new RefLine(this.points[0], this.points[2]);
this.lines[2] = new RefLine(this.points[0], this.points[3]);

//calculate volume as scalar triple dot cross product
let r1 = dr(this.lines[0].delta).Xproduct(this.lines[1].delta)
let r2 = dr(this.lines[2].delta).dotproduct(r1);

this.volume = r2/6; console.log(`volume is ${this.volume}`);
 console.log(`center ${dr(this.center).x} , ${dr(this.center).y}, ${dr(this.center).z} `);
	}
	drawtetlines(a1, col = "#000000"){
	    this.kala = col;
		this.screen = a1;
 this.updatesLines(); 
 this.lines[0].colour = col;
 this.lines[1].colour = col;
 this.lines[2].colour = col;
 this.screen.depthdraw(this.lines[0]);
 this.screen.depthdraw(this.lines[1]);
 this.screen.depthdraw(this.lines[2]);
 }
drawspokes(a1 = this.screen){
    this.globalize_fromNodesToPoints(3);
    let line1 = new RefLine(this.centroid, this.points[0]); line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 1 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[1]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 2 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[2]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 3 ${line1.distance}`);
    line1 = new RefLine(this.centroid, this.points[3]);line1.colour = this.kala;
    a1.depthdraw(line1);
	console.log(`line 4 ${line1.distance}`);
    
}
	spinAllByAzimuth(val = 0.01){
		for(let i1 = 0; i1 < 4; i1++){
this.nodes[i1].sphe.addAzimuth(val); 
this.nodes[i1].updateSTC();
		}
	//	this.globalize_fromNodesToPoints(1);
	}
	spinAllByInclination(val = 0.01){
		for(let i1 = 0; i1 < 4; i1++){
this.nodes[i1].sphe.addInclination(val);
		}
for(let i1 = 0; i1 < 4; i1++){		
this.nodes[i1].updateSTC();
}
	}
	move(addend){
//as in move thhis tet 's centroid to addend'
//either means center +=  (addend - centroid) ;  entroid = addend;
	    addend = dr(addend);
	    if(addend instanceof RefDot){   
	        this.centroid.resetxyzt(addend);
	    }
	 }
	
	qspinY(ang = 0.1){
		let axY = new RefDot(0,1,0);
	for(let i1 = 0; i1 < 4; i1++){
		this.points[i1] = rotateRefPoint(this.points[i1], axY, ang);
	}
	}
	};

/*ERRATA NOTES:
#1, there is an error when the movement occurs, where i move it to align and it doesn't match. 
I guess this is because I am moving it according to the center and not the centroid 
Solution is that I should move the circumcenter to (0,0,0) for rotation, and then move it by the circumcenter to the arm. 
*/