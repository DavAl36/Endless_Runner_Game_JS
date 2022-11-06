
var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var rollingGroundSphere;
var rollingSpeed=0.006; // 0.008
var heroRollingSpeed;
const worldRadius=26;
const robotRadius=0.2;
var sphericalHelper;
var pathAngleValues;
const robotBaseY=1.8;
var bounceValue=0.1;
var gravity=0.005;
const leftLane=-1;
const rightLane=1;
const middleLane=0;
var currentLane;
var clock;
var jumping;
var obReleaseInterval=0.5; // ERA 0.5
var obInPath;
var obPool;
var particleGeometry;
var particleCount=40;
var explosionPower =1.06;
var particles;
var scoreText;
var score;
var hasCollided;
//---------------------------------------------------------------------------------
var robot = new THREE.Object3D();
var spotLight = new THREE.SpotLight( 0xffffff );
var rollstatus = 1; // 1 = orario -1 = antiorario
var inverseRollingCounter = 0;
var infoText = document.createElement('div');
var scoreText = document.createElement('div');
var lifeText = document.createElement('div');
var introText = document.createElement('div');
var developText = document.createElement('div');
var instructionText = document.createElement('div');
var life_counter = 0;  // counter for decrease lifes
var counter_heart = 0; // counter of lifes
var start_game = 0;
var diff_status = 0;
var text_color;
var c_one_shot = 0;  // use to compute some operation one time during upgrade function
var camera_mode = 1; //1 = first person -1 = third person
var diff_memory = 0; //it avoid to change modality during the match
var head_rotation_memory;// use to rotate robot head
// ------- run animation variables -------
var status_angle_shoulderR = 1;
var a_shoulderR = 3.14;
var status_angle_UpperLegR = 1;
var a_UpperLegR = 3.14;
var movement_vel = 0.08; // arms/legs velocity
const  offset_leg = 0.1; // constant add to legs velocity
var status_neck_y = 0;
var status_neck_x = 0;
var memory_rotation_y = -0.1;
var memory_rotation_x = -0.1;
var pause = 1;

//------------------------------------------


init();

function delay(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}


function cameraMode(){
    if(camera_mode == 1){                       // first person
        camera.position.z = 7.5;
        camera.position.y = 2.8;
        camera.position.x = robot.position.x/2;
        spotLight.position.set( robot.position.x, robot.position.y +0.5, robot.position.z +3 );
        camera.rotation.z = 0;
    }
    else{                                       // third person
        camera.position.x = robot.position.x;
        camera.position.y = robot.position.y + 1.3;
        camera.position.z = robot.position.z -0.3;
        spotLight.position.set( 0, 7, 6 );
        camera.rotation.z=head_rotation_memory;
    }
}
function init() {

    createScene();  
    update();
}

function createScene(){
    hasCollided=false;
    score=0;
    obInPath=[];
    obPool=[];
    clock=new THREE.Clock();
    clock.start();
    heroRollingSpeed=(rollingSpeed*worldRadius/robotRadius)/5;
    sphericalHelper = new THREE.Spherical();
    pathAngleValues=[1.52,1.57,1.62];
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();//the 3d scene
    //scene.fog = new THREE.FogExp2( 0xf0fff0, 0.07 );  // 0.14                                                     // ELIMINO NEBBIA
    camera = new THREE.PerspectiveCamera(60, sceneWidth / sceneHeight, 0.1, 1000 );//perspective camera
    renderer = new THREE.WebGLRenderer({alpha:true});//renderer with transparent backdrop
    renderer.setClearColor(0x0, 1);                                                                         //COLORE SFONDO
    renderer.shadowMap.enabled = false;//enable shadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('RunnerBot');
    dom.appendChild(renderer.domElement);

    createObjsPool();
    addWorld();
    addRobot();
    addLight();
    addExplosion();

    camera.position.z = 7.5;//6.5
    camera.position.y = 2.5

    window.addEventListener('resize', onWindowResize, false);//resize callback

    document.onkeydown = handleKeyDown;
    
    scoreText.style.position = 'absolute';
    //scoreText.style.width = 100;
    //scoreText.style.height = 100;
    scoreText.style.fontSize = "28pt";
    scoreText.style.fontFamily = "Comic Sans MS";
    scoreText.style.color = "orange";
    scoreText.innerHTML = "0";
    scoreText.style.top = (sceneHeight/8)-45 + 'px';
    scoreText.style.left = (sceneWidth/2)+90 + 'px';
    //document.body.appendChild(scoreText);
  
    infoText.style.position = 'absolute';
    //infoText.style.width = 100;
    //infoText.style.height = 100;
    infoText.style.color = "orange";
    infoText.style.fontFamily = "Comic Sans MS";
    infoText.style.fontSize = "28pt";
    infoText.innerHTML = "Score:";
    infoText.style.top = (sceneHeight/8)-45 + 'px';
    infoText.style.left = (sceneWidth/2)-180 + 'px';
    //document.body.appendChild(infoText);

    lifeText.style.position = 'absolute';
    //lifeText.style.width = 100;
    //lifeText.style.height = 100;
    lifeText.style.color = "orange";
    lifeText.style.fontFamily = "Comic Sans MS";
    lifeText.style.fontSize = "48pt";
    lifeText.innerHTML = "❤  ❤  ❤";
    lifeText.style.top = (sceneHeight/2)+(sceneHeight/4) + 'px';
    lifeText.style.left = (sceneWidth/2)-100 + 'px';


    instructionText.style.position = 'absolute';
    instructionText.style.width = 100;
    instructionText.style.height = 100;
    instructionText.style.color = "white";
    instructionText.style.fontFamily = "Comic Sans MS";
    instructionText.style.fontSize = "68";
    instructionText.innerHTML =  "";
    instructionText.style.bottom = 30 + 'px';
    instructionText.style.left = (sceneWidth/2)-280 + 'px';
/*
// Create a texture loader so we can load our image file
var loader = new THREE.TextureLoader();
// Load an image file into a custom material
var material = new THREE.MeshLambertMaterial({
  map: loader.load('https://s3.amazonaws.com/duhaime/blog/tsne-webgl/assets/cat.jpg')
});
// create a plane geometry for the image with a width of 10
// and a height that preserves the image's aspect ratio
var geometry = new THREE.PlaneGeometry(20, 20*.75);
// combine our image geometry and material into a mesh
var mesh = new THREE.Mesh(geometry, material);
// set the position of the image mesh in the x,y,z dimensions
mesh.position.set(0,4,0)
// add the image to the scene
//mesh.visible = false;
scene.add(mesh);
*/

}


function addExplosion(){
    particleGeometry = new THREE.Geometry();
    for (var i = 0; i < particleCount; i ++ ) {
        var vertex = new THREE.Vector3();
        particleGeometry.vertices.push( vertex );
    }
    var pMaterial = new THREE.ParticleBasicMaterial({
      color: 0xCE840F,
      size: 0.1
    });
    particles = new THREE.Points( particleGeometry, pMaterial );
    
    scene.add( particles );
    particles.visible=false;
}
function createObjsPool(){
    var maxObjsInPool=10;
    var newObj;
    for(var i=0; i<maxObjsInPool;i++){
        newObj=createObj();
        obPool.push(newObj);
    }
}
function handleKeyDown(keyEvent){
    if(jumping)return;
    var validMove=true;
    if ( keyEvent.keyCode === 37) {//left
        if(currentLane==middleLane){
            currentLane=leftLane;
        }else if(currentLane==rightLane){
            currentLane=middleLane;
        }else{
            validMove=false;    
        }
    } else if ( keyEvent.keyCode === 39) {//right
        if(currentLane==middleLane){
            currentLane=rightLane;
        }else if(currentLane==leftLane){
            currentLane=middleLane;
        }else{
            validMove=false;    
        }
    }else{
        if ( keyEvent.keyCode === 38){//up, jump
            bounceValue=0.12;
            jumping=true;
        }
        validMove=false;
    }
    if ( keyEvent.keyCode === 83) {//s
        //console.log("                           press S");
        start_game = 1;
    }

    if ( keyEvent.keyCode === 66) {//b
        pause = pause * -1;
    }


    if ( keyEvent.keyCode === 67) {//c
        camera_mode = camera_mode * -1;
    }
    if ( keyEvent.keyCode === 68) {//d
        //console.log(diff_status);
        diff_status++
        if(start_game == 1){diff_status = diff_memory;}
        else{
                if(diff_status == 3){diff_status = 0;}
                //else{diff_status++;}
            }
    }
    if ( keyEvent.keyCode === 82) {//r
        document.location.reload(true);
    }
}


function addRobot(){

var loader = new THREE.GLTFLoader();
loader.load('models/RobotExpressive.glb',
    function ( gltf ) {
        robot = gltf.scene;
        scene.add( robot );

        robot.position.y=7;//7
        robot.position.z=4;
        robot.position.x=0;

        robot.rotation.x = 0;
        robot.rotation.y = 3.14;
        robot.rotation.z = 0;
        
        robot.scale.x = 0.2;
        robot.scale.y = 0.2;
        robot.scale.z = 0.2;

        robot.receiveShadow = false;
        robot.castShadow=false;
        //console.log(robot);

        //helper = new THREE.SkeletonHelper(robot);
        //console.log(robot.traverse( function (child) {console.log(child.id)} ));  
        //helper = new THREE.SkeletonHelper(robot);
        //console.log(helper);
    },
    // called while loading is progressing
    function ( xhr ) {console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );},
    // called when loading has errors
    function ( error ) {console.log( 'An error happened' );}
);
    currentLane=middleLane;

}


function addWorld(){
    var sides=80;
    var tiers=80;
    var sphereGeometry = new THREE.SphereGeometry( worldRadius, sides,tiers);
    var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xe64d00,shading:THREE.FlatShading} )
    var vertexIndex;
    var vertexVector= new THREE.Vector3();
    var nextVertexVector= new THREE.Vector3();
    var firstVertexVector= new THREE.Vector3();
    var offset= new THREE.Vector3();
    var currentTier=1;
    var lerpValue=0.5;
    var heightValue;
    var maxHeight=0.07;
    for(var j=1;j<tiers-2;j++){
        currentTier=j;
        for(var i=0;i<sides;i++){
            vertexIndex=(currentTier*sides)+1;
            vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
            if(j%2!==0){
                if(i==0){
                    firstVertexVector=vertexVector.clone();
                }
                nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
                if(i==sides-1){
                    nextVertexVector=firstVertexVector;
                }
                lerpValue=(Math.random()*(0.75-0.25))+0.25;
                vertexVector.lerp(nextVertexVector,lerpValue);
            }
            heightValue=(Math.random()*maxHeight)-(maxHeight/2);
            offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
            sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
        }
    }
    rollingGroundSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    rollingGroundSphere.visible = true;
    rollingGroundSphere.receiveShadow = false;
    rollingGroundSphere.castShadow=false;
    rollingGroundSphere.rotation.z=-Math.PI/2;
    scene.add( rollingGroundSphere );
    rollingGroundSphere.position.y=-24;
    rollingGroundSphere.position.z=2;
    addWorldObjs();
}

function addLight(){
    spotLight.position.set( 0, 7, 8 );
    spotLight.angle = 0.9;
    spotLight.penumbra = 1;
    spotLight.decay = 1;
    spotLight.intensity = 1.5;
    spotLight.distance = 50;
    scene.add( spotLight );
    //var spotLightHelper = new THREE.SpotLightHelper( spotLight );
    //scene.add( spotLightHelper ); 
}

function addPathObj(){
    var options=[0,1,2]; // 0 = destra 1 = centro 2 = sinistra
    var lane= Math.floor(Math.random()*3);
    addObj(true,lane);
    
    options.splice(lane,1);
    if(Math.random()>0.5){
        lane= Math.floor(Math.random()*2);
        addObj(true,options[lane]);
    }
}

function addWorldObjs(){ // aggiungi alberi esterni
    var numObjs=48;
    var gap=6.28/36;
    for(var i=0;i<numObjs;i++){
        addObj(false,i*gap, true);
        addObj(false,i*gap, false);
    }
}

function addObj(inPath, row, isLeft){

    var newOb;
    if(inPath){
        if(obPool.length==0)return;
        newOb=obPool.pop();
        newOb.visible=true;
        obInPath.push(newOb);
        sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
    }else{
        newOb= createObj();
        var forestAreaAngle=0;//[1.52,1.57,1.62];
        if(isLeft){
            forestAreaAngle=1.68+Math.random()*0.1;
        }else{
            forestAreaAngle=1.46-Math.random()*0.1;
        }
        sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
    }
    newOb.position.setFromSpherical( sphericalHelper );
    var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
    var objVector=newOb.position.clone().normalize();
    newOb.quaternion.setFromUnitVectors(objVector,rollingGroundVector);
    newOb.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;
    rollingGroundSphere.add(newOb);   
}

function createObj(){

    var objTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
    
    var objMaterial = new THREE.MeshStandardMaterial( { color: Math.random() * 0xffffff ,shading:THREE.FlatShading  } );
    //var objMaterial = new THREE.MeshStandardMaterial( { color: 0xff9900 ,shading:THREE.FlatShading  } );
    //var objMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 ,shading:THREE.FlatShading  } );

    var Trunk = new THREE.Mesh( objTrunkGeometry, objMaterial );
    Trunk.position.y =0.25;
    Trunk.scale.x =  Math.floor((Math.random() * 2.5) + 1.0);
    Trunk.scale.y =  Math.floor((Math.random() * 10) + 4); 
    Trunk.scale.z =  Trunk.scale.x;
    var obj = new THREE.Object3D();
    obj.add(Trunk);
    return obj;
}


function run_animation(){

        robot.traverse( 
            function (child) {
                if(child.name.toString() == "FootR"){
                    child.visible = false;
                }
                if(child.name.toString() == "FootL"){
                    child.visible = false;
                }

                if(child.name.toString() == "ShoulderR"){
                    if ( (child.rotation.x >= (3.14/2)) ){status_angle_shoulderR = 1;}
                    if ( (child.rotation.x <= -(3.14/2)) ){status_angle_shoulderR = -1;}
                    if( status_angle_shoulderR == 1){a_shoulderR = a_shoulderR - movement_vel;}
                    else{a_shoulderR = a_shoulderR + movement_vel;} 
                    child.rotation.x = a_shoulderR;
                }
                if(child.name.toString() == "ShoulderL"){
                    child.rotation.x = -a_shoulderR;
                }
                if(child.name.toString() == "UpperLegR"){
                    if ( (child.rotation.x >= (3.14)+(3.14/2)) ){status_angle_UpperLegR = 1;}
                    if ( (child.rotation.x <= (3.14/2)) ){status_angle_UpperLegR = -1;}
                    if( status_angle_UpperLegR == 1){a_UpperLegR = a_UpperLegR - (movement_vel+offset_leg); }
                    else{a_UpperLegR = a_UpperLegR + (movement_vel+offset_leg); }   
                    child.rotation.x = a_UpperLegR;
                    child.scale.x = 1.2;
                    child.scale.y = 1.2;
                    child.scale.z = 1.2;
                }
                if(child.name.toString() == "UpperLegL"){
                    child.rotation.x = -a_UpperLegR;
                    child.scale.x = 1.2;
                    child.scale.y = 1.2;
                    child.scale.z = 1.2;
                }
                if(currentLane == -1){
                    if(child.name.toString() == "Neck"){
                        child.position.x = 0.005;
                        child.rotation.z =  -3.14/6;
                        child.rotation.y = 0;
                        head_rotation_memory = -child.rotation.z / 2;
                    }
                }
                if(currentLane == 1){
                    if(child.name.toString() == "Neck"){
                        child.position.x = -0.005;
                        child.rotation.z =  3.14/6;
                        child.rotation.y = 0;
                        /*
                        if(jumping == true){
                            child.scale.x = 1.8;
                            child.scale.y = 1.8;
                            child.scale.z = 1.8;  
                        }
                        else{
                            child.scale.x = 1.0;
                            child.scale.y = 1.0;
                            child.scale.z = 1.0;       
                        }
                        */
                        head_rotation_memory = -child.rotation.z / 2;
                    }
                }
                if(currentLane == 0){
                    if(child.name.toString() == "Neck"){
                        child.position.x = 0;
                        child.rotation.x = 0;
                        child.rotation.z = 0;
                        child.rotation.y = 0;
                        head_rotation_memory = child.rotation.z;

                    }
                }

            } 
            );

}

function robot_explosion_animation(){
        robot.traverse( 
            function (child) {
                if(child.name.toString() == "Neck"){
                    if(child.position.y > -0.02){
                        child.position.y = child.position.y - 0.0006;
                        child.rotation.x = child.rotation.x - 0.035;
                    }
                    else{child.position.y = -0.02}
                    child.rotation.z = 0;
                }
                if(child.name.toString() == "ShoulderR"){
                    child.rotation.x = 0;
                    child.rotation.z = 3.14/2;
                    if(child.position.y > -0.02){
                        child.position.y = child.position.y - 0.0006;
                    }
                    else{child.position.y = -0.018}
                }
                if(child.name.toString() == "ShoulderL"){
                    child.rotation.x = 0;
                    child.rotation.z = -3.14/2;
                    if(child.position.y > -0.02){
                        child.position.y = child.position.y - 0.0006;
                    }
                    else{child.position.y = -0.02}
                }
                if(child.name.toString() == "UpperLegR"){
                    child.visible = false;    
                    }
                if(child.name.toString() == "UpperLegL"){
                    child.visible = false;    
                }
            } 
            );
}

var status_middleL = 0;
var status_middleR = 0;
var status_Thumb2L = 0;
var status_Thumb2R = 0;
/*
function menu_robot_animation(){

        robot.traverse( 
            function (child) {

                if(child.name.toString() == "FootR"){
                    child.visible = false;
                }
                if(child.name.toString() == "FootL"){
                    child.visible = false;
                }
                if(child.name.toString() == "Neck"){
                    child.rotateY(  3.14/32);
                }
                if(child.name.toString() == "Middle1L"){
                    if(child.rotation.z <= -2){status_middleL = 1;}
                    if(child.rotation.z >= 1.5){status_middleL = 0;}
                    if(status_middleL == 0){child.rotation.z = child.rotation.z - 0.25;}
                    else{child.rotation.z = child.rotation.z + 0.25;}
                }
                if(child.name.toString() == "Middle1R"){
                    if(child.rotation.z <= -1){status_middleR = 1;}
                    if(child.rotation.z >= 2){status_middleR = 0;}
                    if(status_middleR == 0){child.rotation.z = child.rotation.z - 0.25;}
                    else{child.rotation.z = child.rotation.z + 0.25;}
                }
                if(child.name.toString() == "Thumb2L"){
                    if(child.rotation.x <= -3){status_Thumb2L = 1;}
                    if(child.rotation.x >= 0){status_Thumb2L = 0;}
                    if(status_Thumb2L == 0){child.rotation.x = child.rotation.x - 0.25;}
                    else{child.rotation.x = child.rotation.x + 0.25;}
                }
                if(child.name.toString() == "Thumb2R"){
                    if(child.rotation.x <= -3){status_Thumb2R = 1;}
                    if(child.rotation.x >= 0){status_Thumb2R = 0;}
                    if(status_Thumb2R == 0){child.rotation.x = child.rotation.x - 0.25;}
                    else{child.rotation.x = child.rotation.x + 0.25;}
                    delay(10);
                }
            } 
            );
}
*/


function menu_robot_animation( mode ){

        robot.traverse( 
            function (child) {

                if(child.name.toString() == "FootR"){
                    child.visible = false;
                }
                if(child.name.toString() == "FootL"){
                    child.visible = false;
                }
                if(child.name.toString() == "Neck"){
                    //if( mode == "Easy"){child.rotateY(  3.14/32);}
                    if( mode == "Hard"){
                        child.rotation.x = memory_rotation_x;
                        if(child.rotation.y <= -0.5){status_neck_y = 1;memory_rotation_y = -0.1;}
                        if(child.rotation.y >= 0.5){status_neck_y = 0;memory_rotation_y = 0.1;}
                        if(status_neck_y == 0){child.rotation.y = child.rotation.y - 0.1;}
                        else{child.rotation.y = child.rotation.y + 0.1;}  
                    }
                    else{child.rotation.y = memory_rotation_y;

                        if(child.rotation.x <= -0.5){status_neck_x = 1;memory_rotation_x = 0.1;}
                        if(child.rotation.x >= 0.5){status_neck_x = 0;memory_rotation_x =-0.1;}
                        if(status_neck_x == 0){child.rotation.x = child.rotation.x - 0.1;}
                        else{child.rotation.x = child.rotation.x + 0.1;}  
                    
                    }


                }
                if(child.name.toString() == "Middle1L"){
                    if(child.rotation.z <= -2){status_middleL = 1;}
                    if(child.rotation.z >= 1.5){status_middleL = 0;}
                    if(status_middleL == 0){child.rotation.z = child.rotation.z - 0.25;}
                    else{child.rotation.z = child.rotation.z + 0.25;}
                }
                if(child.name.toString() == "Middle1R"){
                    if(child.rotation.z <= -1){status_middleR = 1;}
                    if(child.rotation.z >= 2){status_middleR = 0;}
                    if(status_middleR == 0){child.rotation.z = child.rotation.z - 0.25;}
                    else{child.rotation.z = child.rotation.z + 0.25;}
                }
                if(child.name.toString() == "Thumb2L"){
                    if(child.rotation.x <= -3){status_Thumb2L = 1;}
                    if(child.rotation.x >= 0){status_Thumb2L = 0;}
                    if(status_Thumb2L == 0){child.rotation.x = child.rotation.x - 0.25;}
                    else{child.rotation.x = child.rotation.x + 0.25;}
                }
                if(child.name.toString() == "Thumb2R"){
                    if(child.rotation.x <= -3){status_Thumb2R = 1;}
                    if(child.rotation.x >= 0){status_Thumb2R = 0;}
                    if(status_Thumb2R == 0){child.rotation.x = child.rotation.x - 0.25;}
                    else{child.rotation.x = child.rotation.x + 0.25;}
                    delay(10);
                }
            } 
            );
}
function heart_animation(heart1 , heart2,time){

    if(counter_heart <= time){
        lifeText.innerHTML = heart1;
        lifeText.style.color = "orange";
    }
    else{
        if( (counter_heart>time)&&(counter_heart<time*2) ){
            lifeText.innerHTML = heart2;
            lifeText.style.color = "#cc0000";
        }
        else{counter_heart=0;}
    }
    counter_heart++;
}
function heart_logic(){
    if(  (life_counter > 0)&&(life_counter <= 6) ){
        spotLight.intensity = 1.5; //1.1
        if(diff_status >= 1){
            spotLight.distance = 18;//30
            spotLight.color.setHex( 0xFAC2C2 );
        }
        heart_animation("❤  ❤","♥  ♥",10);
    }else{
    if( (life_counter > 6)&&(life_counter <= 13) ){
        spotLight.intensity = 1.5;//0.7
        if(diff_status >= 1){
            spotLight.distance = 13;//20
            spotLight.color.setHex( 0xFB5757 );
        }
        heart_animation("❤","♥",5);
    }else{
    if(life_counter > 13){
        spotLight.intensity = 1.5;//0.5
        if(diff_status >= 1){
            spotLight.distance = 9;//10
            spotLight.color.setHex( 0xFB0000 );
        }
        lifeText.innerHTML = " ";
    }else{
        heart_animation("❤  ❤  ❤","♥  ♥  ♥",15);
    }}}
    document.body.appendChild(lifeText);
}



function update(){

    if(start_game == 1){
    //scene.visible=true;
    cameraMode();
    document.body.appendChild(infoText);
    document.body.appendChild(scoreText);

    c_one_shot++;


    if(c_one_shot == 1){ // do  this things only one time
        //console.log(obPool);
        //console.log(obPool[1]);
        spotLight.angle = 0.9
        spotLight.color.setHex( 0xffffff );
        robot.rotation.y = -3.14;
        robot.position.y=7;//7
        robot.position.z=4;
        robot.position.x=0;
        instructionText.innerHTML =  " (←) move left" +"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+
                                     " (↑) jump "     +"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+
                                     " (→) move right"+"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+
                                     " (c) change camera" +"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+"<br>"+"<br>";
        document.body.appendChild(instructionText);
     
    }



    if(diff_status == 0){rollingSpeed = 0.006;}
    if(diff_status == 1){rollingSpeed = 0.007;}
    if(diff_status == 2){rollingSpeed = 0.008;}

    heart_logic();
    if(rollstatus == 1){
        if(pause == 1)rollingGroundSphere.rotation.x  += rollingSpeed;
        run_animation();
    }
    else{
        if(inverseRollingCounter > 50){
            gameOver() ;
        }
        else{
            robot_explosion_animation();

            rollingGroundSphere.rotation.x  -= rollingSpeed;
            inverseRollingCounter ++;
            robot.rotation.x += heroRollingSpeed/8;
            var multiplier1 = ((sceneHeight/2)-92)/50;
            var multiplier2 = 90/50;
            var text = "";
            var final_score = 0;
            if(diff_status == 0){text = "Easy"; final_score = score * 1;}
            if(diff_status == 1){text = "Medium"; final_score = score * 1.5;}
            if(diff_status == 2){text = "Hard"; final_score = score * 2;}
            //infoText.innerHTML = "Score:" + "<br>"+"<br>"+ text + " bonus:" +"&nbsp&nbsp&nbsp&nbsp"+final_score.toString()+
            //                     "<br>"+ "<br>"+ "<br>" +"&nbsp&nbsp&nbsp"+"(r)"+"&nbsp&nbsp&nbsp"+"Restart";//†
            infoText.innerHTML = "&nbsp&nbsp"+"GAME OVER" + "<br>"+"<br>"+ text + " Score:" +"&nbsp&nbsp&nbsp&nbsp"+final_score.toString()+
                                 "<br>"+ "<br>" +"&nbsp"+"Press (r)"+"&nbsp&nbsp"+"Restart";//†
            instructionText.innerHTML = " ";
            infoText.style.top = (sceneHeight/8)-145 +(inverseRollingCounter*multiplier1) + 'px';
            scoreText.innerHTML = " ";
            //scoreText.style.top = (sceneHeight/8)-145+(inverseRollingCounter*multiplier1) + 'px';
        }
    }
    //rollingGroundSphere.rotation.x  += rollingSpeed;
    //robot.rotation.x =0;//-= heroRollingSpeed;   


    if(robot.position.y<=robotBaseY){
        jumping=false;
        bounceValue=(Math.random()*0.04)+0.005;
        robot.rotation.x = 0; // aggiunto per evitare che il robot rimanga storto dopo la capriola
    }
    if(jumping == true){
      robot.rotation.x -= 0.15;
    }
    robot.position.y+=bounceValue;
    //camera.position.x = THREE.Math.lerp(camera.position.x,currentLane, 2*clock.getDelta());
    robot.position.x= THREE.Math.lerp(robot.position.x,currentLane, 8*clock.getDelta());//clock.getElapsedTime());
    bounceValue-=gravity;

    if(clock.getElapsedTime()>obReleaseInterval){
        clock.start();
        addPathObj();

        if(!hasCollided){
            score+=2*obReleaseInterval;
            scoreText.innerHTML=score.toString();
        }
    }

    //spotLight.position.set( robot.position.x, robot.position.y +0.5, robot.position.z +3 );
    introText.innerHTML = "";
    developText.innerHTML = "";
}
else{
    
    //key codes
    //http://cherrytree.at/misc/vk.htm
    //scene.visible=false;
    var diff = "Easy";
    if(diff_status == 0){diff = "Easy";  text_color = "orange"; camera.position.z = 7.5;spotLight.angle = 0.9;spotLight.color.setHex( 0xffffff );}//orange
    if(diff_status == 1){diff = "Medium";text_color = "orange"; camera.position.z = 7.0;spotLight.angle = 0.55;spotLight.color.setHex( 0xffffff );}//powderblue
    if(diff_status == 2){diff = "Hard";  text_color = "red";    camera.position.z = 6.5;spotLight.angle = 0.4;spotLight.color.setHex( 0xFB0000 );}//red

    diff_memory = diff_status; // memorizes last diff value

    var testo = "Press (s)"+"&nbsp&nbsp&nbsp"+"Start" +"<br>"+"<br>"+
                "Press (d)"+"&nbsp&nbsp&nbsp"+"Difficulty: " + diff.toString()+ "<br>"+ "<br>";

    introText.style.position = 'absolute';
    introText.style.color = text_color;
    introText.style.fontFamily = "Comic Sans MS";
    introText.style.fontSize = "28pt";
    introText.innerHTML = testo;
    introText.style.top = 100 + 'px';//(sceneHeight/2)-90 + 'px';
    introText.style.left =100 + 'px'; //(sceneWidth/2)-270 + 'px';
    document.body.appendChild(introText);

    developText.style.position = 'absolute';
    developText.style.color = "grey";
    developText.style.fontFamily = "Comic Sans MS";
    developText.style.fontSize = "18pt";
    developText.innerHTML = " Tested on Mozilla Firefox 68.0.1  developed by Dav";
    developText.style.bottom = 35 + 'px';
    developText.style.left = 100 + 'px';
    document.body.appendChild(developText);
    menu_robot_animation(diff);


    robot.position.y=2;//7
    robot.position.z=5;
    robot.position.x=0;
    robot.rotation.x = 0;
    robot.rotation.y = 0;
    robot.rotation.z = 0;
    //menu_robot_animation();
}

    doObjLogic();
    doExplosionLogic();
    render();
    requestAnimationFrame(update);//request next update
}


function doObjLogic(){
    var oneObj;
    var objPos = new THREE.Vector3();
    var objsToRemove=[];
    obInPath.forEach( function ( element, index ) {
        oneObj=obInPath[ index ];
        objPos.setFromMatrixPosition( oneObj.matrixWorld );
        if(objPos.z>6 &&oneObj.visible){//gone out of our view zone
            objsToRemove.push(oneObj);

        }else{//check collision
            if(objPos.distanceTo(robot.position)<=0.6){
                                //MODIFICA ROLL STATUS
                oneObj.visible = false;
                explode();
                if(life_counter >= 19){//6 - 12 - 18
                    lifeText.style.color = "black";
                    explode();
                    hasCollided=true;
                    rollstatus = -1; 
            }
                else{
                    //console.log("hit");
                    life_counter++;
                }
            }
        }
    });
    var fromWhere;
    objsToRemove.forEach( function ( element, index ) {
        oneObj=objsToRemove[ index ];
        fromWhere=obInPath.indexOf(oneObj);
        obInPath.splice(fromWhere,1);
        obPool.push(oneObj);
        oneObj.visible=false;
    });
}
function doExplosionLogic(){
    if(!particles.visible)return;
    for (var i = 0; i < particleCount; i ++ ) {
        particleGeometry.vertices[i].multiplyScalar(explosionPower);
    }
    if(explosionPower>1.005){
        explosionPower-=0.001;
    }else{
        particles.visible=false;
    }
    particleGeometry.verticesNeedUpdate = true;
}
function explode(){
if(camera_mode == 1){
    particles.position.y=2.5;
    particles.position.z=4.8;
    particles.position.x=robot.position.x;
}
else{
    particles.position.y=2.5;
    particles.position.z=1.8;
    particles.position.x=robot.position.x;
}


    particles.scale.x = 3;
    particles.scale.y = 3;
    particles.scale.z = 3;
    for (var i = 0; i < particleCount; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = -0.2+Math.random() * 0.5;
        vertex.y = -0.2+Math.random() * 0.5 ;
        vertex.z = -0.2+Math.random() * 0.5;
        particleGeometry.vertices[i]=vertex;
    }


    explosionPower=1.07;
    particles.visible=true;
}

function render(){
    //renderer.render(scene, camera);//draw 
      
    renderer.state.reset();
    renderer.render(scene, camera);//draw
    renderer.state.reset();
    
}
function gameOver () {
  //cancelAnimationFrame( globalRenderID );
  //window.clearInterval( powerupSpawnIntervalID );
            rollstatus = -1;
            rollingGroundSphere.rotation.x = 0;
            if(spotLight.intensity == 0){spotLight.intensity=0;} // l'intensita della luce diminuisce
            else{ spotLight.intensity -= 0.01;}
            //if(spotLight.angle <= 0.4){spotLight.angle=0.4;} // l'intensita della luce diminuisce
            //else{ spotLight.angle -= 0.01;}
            bounceValue = 0; // non salta piu
            lifeText.innerHTML = " ";
            life_counter = 0;

}
function onWindowResize() {
    sceneHeight = window.innerHeight;
    sceneWidth = window.innerWidth;
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth/sceneHeight;
    camera.updateProjectionMatrix();
}
