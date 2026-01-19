var hitboxID = 0;//each hitbox has a unique ID
function hitbox (x, y, z, height, size, h = null){
this.id = hitboxID++;//add 1 to the hitboxID counter every time a hitbox is created
this.x = x;
this.y = y;
this.z = z;
this.height = height;
if(h == null){
    this.type = "circle";
    this.size = size;
}else{
    this.type = "rect";
    this.w = size;
    this.h = h;
}
this.localimmunity = 999;
this.localimmune = [];
this.enabled = true;

}
hitbox.prototype.refreshimmune = function(){
//reset the immunity frames of a move
this.localimmune = [];
}
hitbox.prototype.disable = function(){
this.enabled = false;
}
hitbox.prototype.enable = function(){
this.enabled = true;
}
hitbox.prototype.immunityframes = function(frames){
    this.localimmunity = frames;
}
hitbox.prototype.grantimmunity = function(en){
    this.localimmune.push([en, 0]);
}
hitbox.prototype.updateimmunity = function(){
for(let i = 0 ; i < this.localimmune.length ; i++){
    this.localimmune[i][1]++;
    if(this.localimmune[i][1]>this.localimmunity){
    this.localimmune.splice(i--, 1);

    }
}

}
hitbox.prototype.reassign = function(x, y, z, height, size, h = null){
//for circles
this.x = x;
this.y = y;
this.z = z;
this.height = height;
if(h == null){
    this.type = "circle";
    this.size = size;
}else{
    this.type = "rect";
    this.w = size;
    this.h = h;
}
}
hitbox.prototype.move = function(x, y){
//just move the hitbox
this.x = x;
this.y = y;
}
hitbox.prototype.resize = function(size, h = null){
//resize the hitbox
if(h == null){
    this.type = "circle";
    this.size = size;
}else{
    this.type = "rect";
    this.w = size;
    this.h = h;
}
}
hitbox.prototype.movez = function(z, height = this.height){
//move the hitbox up or down on the 3d spectrum
this.z = z;
this.height = height;
}
hitbox.prototype.exists = function(){
//I'M REAL GUYS!
}

hitbox.prototype.hitplayer = function(){
    try{
for(let i = 0 ; this.localimmune.length ; i++){

    if(this.localimmune[i][0] == player.listname()){
        //player has local immunity
        return

}
}
    if(player.iframe == true){
        //invulnerability will not trigger hits! armor does
        return;
    }
    }catch(e){

    }
    if(this.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - canvhalfx
            let dy = this.y - canvhalfy;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            return distance <= (player.size + this.size) && player.pz + player.height >= this.z && player.pz <= this.z + this.height;
    }else if (this.type == "rect"){
        let closestX = Math.max(this.x, Math.min(player.px, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(player.py, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = player.px - closestX;
        let dy = player.py - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        return distance <= player.size && player.pz + player.height >= this.z && player.pz <= this.z + this.height;


    }else{
        return false;
    }
}
hitbox.prototype.scanplayer = function(){
    if(this.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - canvhalfx
            let dy = this.y - canvhalfy;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            return distance <= (player.size + this.size) && player.pz + player.height >= this.z && player.pz <= this.z + this.height;
    }else if (this.type == "rect"){
        let closestX = Math.max(this.x, Math.min(player.px, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(player.py, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = player.px - closestX;
        let dy = player.py - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        return distance <= player.size && player.pz + player.height >= this.z && player.pz <= this.z + this.height;


    }else{
        return false;
    }

}
hitbox.prototype.scanproj = function(i){
//console.log("test1")
try{
if(projectiles[i].name == "particle" || projectiles[i].hitbox.enabled == false ){
throw new Error("That hitbox is disabled! Don't use that!!!");
}

}catch(e){
//if there's no hitbox on a projectile, it's just a waste to run this code
return false;
}
//console.log(projectiles[i].name)
if(projectiles[i].hitbox.id == this.id){
    //this is the same projectile...
    return false;
}
//console.log(projectiles[i].hitbox.id + ": ID");

if(this.type == "circle" && projectiles[i].hitbox.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - projectiles[i].hitbox.x;
            let dy = this.y - projectiles[i].hitbox.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            console.log(1)
            return distance <= (projectiles[i].hitbox.size + this.size) && projectiles[i].hitbox.z + projectiles[i].hitbox.height >= this.z && projectiles[i].hitbox.z <= this.z + this.height;
    }else if (this.type == "rect" && projectiles[i].hitbox.type == "circle"){
        let closestX = Math.max(this.x, Math.min(projectiles[i].hitbox.x, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(projectiles[i].hitbox.y, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = projectiles[i].hitbox.x - closestX;
        let dy = projectiles[i].hitbox.y - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        console.log(2)
        return distance <= projectiles[i].hitbox.size && projectiles[i].hitbox.z + projectiles[i].hitbox.height >= this.z && projectiles[i].hitbox.z <= this.z + this.height;
    }else if (this.type == "circle" && projectiles[i].hitbox.type == "rect"){
        //Just make THEIR hitbox do the calculations
        if(projectiles[i].hitbox.hitproj(this.hitboxID) == true){
            return true;
        }

    }

return false;
}
hitbox.prototype.hitproj = function(name = "any projectile"){
for(let i = 0 ; i < projectiles.length ; i++){
//console.log("test1")
try{
if(projectiles[i].hitbox.enabled == false){
throw new Error("That hitbox is disabled! Don't use that!!!");
}

}catch(e){
//if there's no hitbox on a projectile, it's just a waste to run this code
continue;
}
//console.log(projectiles[i].name)
if(projectiles[i].hitbox.id == this.id){
    //this is the same projectile...
    continue;
}
//console.log(projectiles[i].hitbox.id + ": ID");
if(typeof name == "number" && projectiles[i].hitbox.id != name){
console.log(typeof name);
//if the projectile doesn't match an ID, no point in going through this!
continue;

}else if(name != "any projectile" && projectiles[i].name != name){
//console.log("test final");
//if the projectile name doesn't match up with the name, then there's no point in running the rest of this code
continue;
}

if(this.type == "circle" && projectiles[i].hitbox.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - projectiles[i].hitbox.x;
            let dy = this.y - projectiles[i].hitbox.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            console.log(1)
            return distance <= (projectiles[i].hitbox.size + this.size) && projectiles[i].hitbox.z + projectiles[i].hitbox.height >= this.z && projectiles[i].hitbox.z <= this.z + this.height;
    }else if (this.type == "rect" && projectiles[i].hitbox.type == "circle"){
        let closestX = Math.max(this.x, Math.min(projectiles[i].hitbox.x, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(projectiles[i].hitbox.y, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = projectiles[i].hitbox.x - closestX;
        let dy = projectiles[i].hitbox.y - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        console.log(2)
        return distance <= projectiles[i].hitbox.size && projectiles[i].hitbox.z + projectiles[i].hitbox.height >= this.z && projectiles[i].hitbox.z <= this.z + this.height;
    }else if (this.type == "circle" && projectiles[i].hitbox.type == "rect"){
        //Just make THEIR hitbox do the calculations
        if(projectiles[i].hitbox.hitproj(this.hitboxID) == true){
            return true;
        }

    }
}
return false;
}
hitbox.prototype.hitenemy = function(name = "any enemy"){
for(let i = 0 ; i < enemies.length ; i++){
//console.log(enemies[i])
try{
if(enemies[i].hitbox.enabled == false){
throw new Error("That enemy's hitbox is disabled! Don't use that!!!");
}

}catch(e){
//if there's no hitbox on a enemy, it's just a waste to run this code
continue;
}
//console.log(enemies[i].listname())
if(enemies[i].hitbox.id == this.id){
    //this is the same enemy...
    continue;
}
try{
for(let i = 0 ; this.localimmune.length ; i++){
    if(this.localimmune[i][0] == i){
        //this enemy has local immunity
        throw new Error("EEEEEEEEE!!!!!!!!!!! LOCAL IMMUNITY FRAMES")
    }
}
}catch(e){
continue;
}
//console.log(enemies[i].hitbox.id + ": ID");
if(typeof name == "number" && enemies[i].hitbox.id != name){
console.log(typeof name);
//if the enemy doesn't match an ID, no point in going through this!
continue;

}else if(name != "any enemy" && enemies[i].listname() != name){
console.log("test final");
//if the projectile name doesn't match up with the name, then there's no point in running the rest of this code
continue;
}
if(this.type == "circle" && enemies[i].hitbox.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - enemies[i].hitbox.x;
            let dy = this.y - enemies[i].hitbox.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            //console.log(1)
            if((distance <= (enemies[i].hitbox.size + this.size) && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height) ==false){
                continue
            }
            return (distance <= (enemies[i].hitbox.size + this.size) && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height)? i:false;
    }else if (this.type == "rect" && enemies[i].hitbox.type == "circle"){
        let closestX = Math.max(this.x, Math.min(enemies[i].hitbox.x, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(enemies[i].hitbox.y, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = enemies[i].hitbox.x - closestX;
        let dy = enemies[i].hitbox.y - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        console.log(2)
        if((distance <= enemies[i].hitbox.size && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height) == false)
        return (distance <= enemies[i].hitbox.size && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height)? i:false;
    }else if (this.type == "circle" && enemies[i].hitbox.type == "rect"){
        //Just make THEIR hitbox do the calculations
        if(enemies[i].hitbox.hitenemy(this.hitboxID) == true){
            return i;
        }

    }

}
return false;
}
hitbox.prototype.isFacingPoint = function(px, py, facing){
const angleToPoint = Math.atan2(py - this.y, px - this.x);
        const orientationEnd =  facing + Math.PI;

        const normalizedOrientation = facing < 0 ? facing + 2 * Math.PI : facing;
        const normalizedAngleToPoint = angleToPoint < 0 ? angleToPoint + 2 * Math.PI : angleToPoint;

        return (normalizedAngleToPoint >= normalizedOrientation && normalizedAngleToPoint <= orientationEnd);
}
hitbox.prototype.hitenemyhalf = function(facing, name = "any enemy"){
for(let i = 0 ; i < enemies.length ; i++){

//console.log("test1")
try{
if(enemies[i].hitbox.enabled == false){
throw new Error("That enemy's hitbox is disabled! Don't use that!!!");
}

}catch(e){
//if there's no hitbox on a enemy, it's just a waste to run this code
continue;
}
//console.log(enemies[i].listname())
if(enemies[i].hitbox.id == this.id){
    //this is the same enemy...
    continue;
}
try{
for(let i = 0 ; this.localimmune.length ; i++){
    if(this.localimmune[i][0] == i){
        //this enemy has local immunity
        throw new Error("EEEEEEEEE!!!!!!!!!!! LOCAL IMMUNITY FRAMES")
    }
}
}catch(e){
continue;
}
//console.log(enemies[i].hitbox.id + ": ID");
if(typeof name == "number" && enemies[i].hitbox.id != name){
//console.log(typeof name);
//if the enemy doesn't match an ID, no point in going through this!
continue;

}else if(name != "any enemy" && enemies[i].listname() != name){
console.log("test final");
//if the projectile name doesn't match up with the name, then there's no point in running the rest of this code
continue;
}

if(this.type == "circle" && enemies[i].hitbox.type == "circle"){
            let isfalse;
            let dx = this.x - enemies[i].hitbox.x;
            let dy = this.y - enemies[i].hitbox.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            //console.log(1)
            if(distance > (enemies[i].hitbox.size + this.size) && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height){
            continue;
            }


    if(facing[0] == -1){

            if(facing[1] == 1){
                //left down
                isfalse =  (this.x > enemies[i].x - enemies[i].size
                    || this.y  < enemies[i].y + enemies[i].size)? i:false;
            }else if (facing[1] == -1){
                //left up
                isfalse =   (this.x > enemies[i].x - enemies[i].size
                     || this.y  > enemies[i].y - enemies[i].size)? i:false;
            }else{
                //just left
                isfalse =   (this.x > enemies[i].x - enemies[i].size)? i:false;
            }
        }else if (facing[0] == 1){
            if(facing[1] == 1){
                            //right down
                            isfalse =   (this.x < enemies[i].x + enemies[i].size
                                 || this.y  < enemies[i].y + enemies[i].size)? i:false;
                        }else if (facing[1] == -1){
                            //right up
                            isfalse =   (this.x < enemies[i].x + enemies[i].size
                                 || this.y  > enemies[i].y - enemies[i].size)? i:false

                        }else{
                            //just right
                            isfalse =   (this.x < enemies[i].x + enemies[i].size)? i:false;
                            //console.log(this.facing[2])
                        }

            }else{
                if(facing[1] == -1){
                    //just up
                    isfalse =   (this.y > enemies[i].y - enemies[i].size)? i:false;
                }else{
                    //just down
                    isfalse =   (this.y < enemies[i].y + enemies[i].size)? i:false;
                }
            }
            //console.log(isfalse + " " + i);
            if(isfalse === false){
            continue;
            }else{
            return i;
            }





    }else if (this.type == "rect" && enemies[i].hitbox.type == "circle"){
        let closestX = Math.max(this.x, Math.min(enemies[i].hitbox.x, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(enemies[i].hitbox.y, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = enemies[i].hitbox.x - closestX;
        let dy = enemies[i].hitbox.y - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        //console.log(2)
        return (distance <= enemies[i].hitbox.size && enemies[i].hitbox.z + enemies[i].hitbox.height >= this.z && enemies[i].hitbox.z <= this.z + this.height)? i:false;
    }else if (this.type == "circle" && enemies[i].hitbox.type == "rect"){
        //Just make THEIR hitbox do the calculations
        if(enemies[i].hitbox.hitenemy(this.hitboxID) == true){
            return i;
        }

    }

}
return false;
}
hitbox.prototype.checkenemy = function(index){
try{
if(enemies[index].hitbox.enabled == false){
throw new Error("That enemy's hitbox is disabled! Don't use that!!!");
}

}catch(e){
//if there's no hitbox on a enemy, it's just a waste to run this code
return false;
}
//console.log(enemies[i].listname())
if(enemies[index].hitbox.id == this.id){
    //this is the same enemy...
    return;
}
{
    let skip = false
for(let i = 0 ; i < this.localimmune.length ; i++){
    if(this.localimmune[i][0] == index){
        //this enemy has local immunity
        skip = true;
        break
    }else{
        skip = false;
        
    }
}
if(skip == true){
    return false;
}
}

    if(this.type == "circle" && enemies[index].hitbox.type == "circle"){
            //just using chatGPT's solution here
            let dx = this.x - enemies[index].hitbox.x;
            let dy = this.y - enemies[index].hitbox.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the distance is less than the sum of their radii
            //console.log(1)
            if((distance <= (enemies[index].hitbox.size + this.size) && enemies[index].hitbox.z + enemies[index].hitbox.height >= this.z && enemies[index].hitbox.z <= this.z + this.height) ==false){
                return false;
            }
            return (distance <= (enemies[index].hitbox.size + this.size) && enemies[index].hitbox.z + enemies[index].hitbox.height >= this.z && enemies[index].hitbox.z <= this.z + this.height)? true:false;
    }else if (this.type == "rect" && enemies[i].hitbox.type == "circle"){
        let closestX = Math.max(this.x, Math.min(enemies[index].hitbox.x, this.x + this.w));
        let closestY = Math.max(this.y, Math.min(enemies[index].hitbox.y, this.y + this.h));

        // Calculate the distance from this point to the circle's center
        let dx = enemies[index].hitbox.x - closestX;
        let dy = enemies[index].hitbox.y - closestY;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Collision occurs if the distance is less than or equal to the circle's radius
        console.log(2)
        if((distance <= enemies[index].hitbox.size && enemies[i].hitbox.z + enemies[index].hitbox.height >= this.z && enemies[index].hitbox.z <= this.z + this.height) == false)
        return (distance <= enemies[index].hitbox.size && enemies[index].hitbox.z + enemies[index].hitbox.height >= this.z && enemies[index].hitbox.z <= this.z + this.height)? true:false;
    }
}
hitbox.prototype.enemyhalf = function(index, facing){
    if(facing[0] == -1 && this.x - player.px > enemies[index].x - enemies[index].size){
        //left
        return true;
    }
    if(facing[0] == 1 && this.x - player.px < enemies[index].x + enemies[index].size){
        //right
        return true;
    }
    if(facing[1] == -1 && this.y - player.py > enemies[index].y - enemies[index].size){
        //up
        return true;

    }
    if(facing[1] == 1 && this.y - player.py < enemies[index].y + enemies[index].size){
        //down
        return true;

    }


    return false;
}
hitbox.prototype.projhalf = function(index, facing){
    if(facing[0] == -1 && this.x - player.px > projectiles[index].x - projectiles[index].size){
        //left
        return true;
    }
    if(facing[0] == 1 && this.x - player.px < projectiles[index].x + projectiles[index].size){
        //right
        return true;
    }
    if(facing[1] == -1 && this.y - player.py > projectiles[index].y - projectiles[index].size){
        //up
        return true;

    }
    if(facing[1] == 1 && this.y - player.py < projectiles[index].y + projectiles[index].size){
        //down
        return true;

    }


    return false;
}
hitbox.prototype.showbox = function(color = "#fff"){
     screen.fillStyle = color;
    if(this.type == "circle"){
       
        circle(this.x, this.y, this.size)

    }else{
        screen.fillRect(this.x, this.y, this.w, this.h)

    }

}