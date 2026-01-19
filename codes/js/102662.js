/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrWorld } from "../libs/CS559-Framework/GrWorld.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";
import { shaderMaterial } from "../libs/CS559-Framework/shaderHelper.js";

/**b
 * Project 2 - Custom Objects
 * 
 * This file contains all the custom object constructors
 */

//This constructor creates the outerwall of the city including
//the 8 large Mako energy reactors that surround the city
//Each reactor has a tower of glowing mako energy that stretches
//out into the night sky
export class OuterRing extends GrObject{
    constructor(params = {}) {
        let group = new T.Group();
        
        //Set params for this ring
        let radius = params.radius || 12;
        let thickness = params.thickness || 1.5;
        let height = params.height || 4;
        let towerCount = params.towerCount || 8;
        let towerInset = params.towerInset || thickness * 0.5;

        //Sets the plateground of the outer wall
        //Adjust the final number to change the plateground of the ring
        const geometry = new T.TorusGeometry(radius - thickness/2, thickness, 16, 24);
        
        //Adjust te positioning to be oriented correctly
        geometry.rotateX(Math.PI/2);
        
        //Prepairs the uniforms for the shaders
        const uniforms = {
            time: { value: 0 },
            baseColor: { value: new T.Color(0x333333) },  
            panelColor: { value: new T.Color(0x555555) }, 
            borderColor: { value: new T.Color(0x111111) }, 
            panelSize: { value: 3.0 },
            borderWidth: { value: 0.08 },
            envMap: { value: null },
            envMapIntensity: { value: 0.7 } 
        };

        //I tried to use a new way to define the shaders and Deepseek
        //helped me do this. It ended up being kinda a pain so I switched
        //back to the way I did it in WB10 for the other times I reuse this shader
        Promise.all([
            fetch('./metalShader.vs').then(res => res.text()),
            fetch('./metalShader.fs').then(res => res.text())
        ]).then(([vertexShader, fragmentShader]) => {
            const ringMaterial = new T.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                lights: false
            });

            const mesh = new T.Mesh(geometry, ringMaterial);
            mesh.position.y = (height/2);
            group.add(mesh);
            //Include an error catch to set a default material if the
            //shader doesnt work for some reason
        }).catch(err => {
            console.error('Unable to load shader:', err);
            const mesh = new T.Mesh(geometry, new T.MeshStandardMaterial({
                color: 0x777777,
                metalness: 0.7,
                roughness: 0.3
            }));
            mesh.position.y = (height/2);
            group.add(mesh);
        });

        //This is a lot easier...
        const towerMaterial = shaderMaterial('./metalShader.vs', './metalShader.fs', {
            uniforms: uniforms,
            lights: false
        });

        //Texture source for the Mako energy towers 
        //https://flowlogic.software/green-gradient-transparent-png/
        const textureLoader = new T.TextureLoader();
        const greenLightTexture = textureLoader.load('./greenFade.png');
            
        //Deepseek derrived  loop function to help me setup the texture and reactors
        //Adjust the textures placement to look right
        greenLightTexture.wrapS = T.ClampToEdgeWrapping;
        greenLightTexture.wrapT = T.RepeatWrapping;

        //Loop for all 8 reactors around the outside of the ring
        for (let i = 0; i < towerCount; i++) {
            //Adjust the positioning and the angle around the outside
            //Set the size of the towers too
            const angle = (i / towerCount) * Math.PI * 2;
            const x = ((radius - towerInset) * Math.cos(angle));
            const z = ((radius - towerInset) * Math.sin(angle));
            const towerHeight = (height * 3); 
            const towerRadius = (thickness * 1); 
            
            //Use params to create the reactors geometry
            const towerGeometry = new T.CylinderGeometry(towerRadius, towerRadius + 2, towerHeight, 16);
            
            //Set the towers and add to the group
            const tower = new T.Mesh(towerGeometry, towerMaterial);
            tower.position.set(x, towerHeight/2, z);
            group.add(tower);

            //Set the geometry of the top rings
            const towerTopGeometry = new T.TorusGeometry(towerRadius * 0.78, 1, 8, 16)
            const towerTop = new T.Mesh(towerTopGeometry, towerMaterial);
            towerTop.position.set(x, towerHeight, z);

            //Position to look right
            towerTop.rotation.x = Math.PI/2;
            group.add(towerTop);

            //Create the mako energy towers
            const beamHeight = (height * 6);
            const beamRadius = (towerRadius * 0.5);
            const beamGeometry = new T.CylinderGeometry(beamRadius - 1.5, beamRadius + 1, beamHeight, 16, 2, true);
            
            //Set UV mapping for the Mako energy texture
            const uvAttribute = beamGeometry.attributes.uv;
            for (let j = 0; j < uvAttribute.count; j++) {
                //Stretch and center vertically
                //Gives off the illusion of a glowing tower
                uvAttribute.setY(j, uvAttribute.getY(j) * 4); 
                uvAttribute.setY(j, uvAttribute.getY(j) * .45 + 0.1);
            }
            //Set up the material
            //Use blending to make it glow
            const beamMaterial = new T.MeshBasicMaterial({
                map: greenLightTexture,
                transparent: true,
                side: T.DoubleSide,
                alphaTest: 0.5,
                depthWrite: true,
                //Make it look like its glowing
                blending: T.AdditiveBlending 
            });
            //Adds the energy towers to the reactor tops
            const lightBeam = new T.Mesh(beamGeometry, beamMaterial);
            lightBeam.position.set(x, towerHeight, z);
            group.add(lightBeam);
        }
        super(`OuterRing`, group);  
    }
}

    //The giant headquarters of the Shinra Coorperation
    //This giant building took me a stupid amount of time to make
    //as I tried to make it as close to the picture reference as I could
    //As such, its pretty detailed, complex and long...
    export class ShinraBuilding extends GrObject{
        constructor(params = {}) {
            let group = new T.Group();
            
            const lowestBaseGeometry = new T.CylinderGeometry(17, 17, 2, 16);
            const lowestBaseMaterial = new T.MeshStandardMaterial({
                color: "black",
                metalness: 0.7,
                roughness: 0.3
            });
            const lowestbasemesh = new T.Mesh(lowestBaseGeometry, lowestBaseMaterial);
            lowestbasemesh.position.y = (1);
            group.add(lowestbasemesh);

            //Texture source for Mako energy again
            //The base of the building has it shining up there too
            //https://flowlogic.software/green-gradient-transparent-png/
            const textureLoaderBase = new T.TextureLoader();
            const greenLightTexture = textureLoaderBase.load('./greenFade.png');

            const beamMaterial = new T.MeshBasicMaterial({
                map: greenLightTexture,
                transparent: true,
                side: T.DoubleSide,
                alphaTest: 0.5,
                depthWrite: true,
                blending: T.AdditiveBlending
            });
            const baseGlowGeo = new T.CylinderGeometry(17, 17, 14, 16);
            //Sets up the UV mapping for the glowing energy
            //This is very similar to what I did for the reactor towers
            const uvAttribute = baseGlowGeo.attributes.uv;
            for (let j = 0; j < uvAttribute.count; j++) {
                uvAttribute.setY(j, uvAttribute.getY(j) * 4); 
                uvAttribute.setY(j, uvAttribute.getY(j) * .45 + 0.1);
            }
            const lightBeam = new T.Mesh(baseGlowGeo, beamMaterial);
            lightBeam.position.set(0, 2, 0);
            lightBeam.rotateX(Math.PI);
            lightBeam.rotateY(-Math.PI/2)
            group.add(lightBeam);

            //Creates a base for the tower to stand on
            const towerBaseGeometry = new T.CylinderGeometry(15, 15, 6, 16);
            const towerBaseMaterial = new T.MeshStandardMaterial({
                color: "Gray",
                metalness: 0.7,
                roughness: 0.3
            });
            const mesh = new T.Mesh(towerBaseGeometry, towerBaseMaterial);
            mesh.position.y = (3);
            group.add(mesh);
            const lowerTowerGeometry = new T.CylinderGeometry(8, 10, 8, 16);
            const lowerTowerMaterial = new T.MeshStandardMaterial({
                color: "LightGray",
                metalness: 0.7,
                roughness: 0.3
            });
            const lowerTowerMesh = new T.Mesh(lowerTowerGeometry, lowerTowerMaterial);
            lowerTowerMesh.position.y = (10);
            group.add(lowerTowerMesh);

            //Creates two massive annex office towers on either side
            //of the main building
            const leftTowerGeometry = new T.CylinderGeometry(4, 4, 16, 16);
            const leftTowerMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const leftTowerMesh = new T.Mesh(leftTowerGeometry, leftTowerMaterial);
            leftTowerMesh.position.x = (10);
            leftTowerMesh.position.y = (14);
            group.add(leftTowerMesh);
            const leftTopGeometry = new T.SphereGeometry(4, 16, 16, 0, Math.PI, 0, Math.PI);
            const leftTopMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide,
            });
            const leftTopMesh = new T.Mesh(leftTopGeometry, leftTopMaterial);
            leftTopMesh.position.x = (10);
            leftTopMesh.position.y = (23);
            leftTopMesh.rotateX(-Math.PI/2)
            group.add(leftTopMesh);
            const leftWindowGeometry = new T.CylinderGeometry(3.5, 3.5, 1.5, 16);
            const leftWindowMaterial = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const leftWindowMesh = new T.Mesh(leftWindowGeometry, leftWindowMaterial);
            leftWindowMesh.position.x = (10);
            leftWindowMesh.position.y = (22);
            group.add(leftWindowMesh);
            const rightTowerGeometry = new T.CylinderGeometry(4, 4, 16, 16);
            const rightTowerMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const rightTowerMesh = new T.Mesh(rightTowerGeometry, rightTowerMaterial);
            rightTowerMesh.position.x = (-10);
            rightTowerMesh.position.y = (14);
            group.add(rightTowerMesh);
            const rightWindowGeometry = new T.CylinderGeometry(3.5, 3.5, 1.5, 16);
            const rightWindowMaterial = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const rightWindowMesh = new T.Mesh(rightWindowGeometry, rightWindowMaterial);
            rightWindowMesh.position.x = (-10);
            rightWindowMesh.position.y = (22);
            group.add(rightWindowMesh);
            const rightTopGeometry = new T.SphereGeometry(4, 16, 16, 0, Math.PI, 0, Math.PI);
            const rightTopMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide,
            });
            const rightTopMesh = new T.Mesh(rightTopGeometry, rightTopMaterial);
            rightTopMesh.position.x = (-10);
            rightTopMesh.position.y = (23);
            rightTopMesh.rotateX(-Math.PI/2);
            group.add(rightTopMesh);

            //Creates the lower main tower
            const middleTowerGeometry = new T.CylinderGeometry(5, 7, 10, 16);
            const middleTowerMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const middleTowerMesh = new T.Mesh(middleTowerGeometry, middleTowerMaterial);
            middleTowerMesh.position.y = (19);
            middleTowerMesh.position.z = (-1.5);
            group.add(middleTowerMesh);

            //Shinra Electric Power Company Logo - Sourced from the final fantasy wiki
            //https://finalfantasy.fandom.com/wiki/Shinra_Electric_Power_Company
            const textureLoader = new T.TextureLoader();
            const shinraLogoTexture = textureLoader.load('./shinraLogo.png');
            const logoGeometry = new T.BoxGeometry(6, 6, 6);
            //Map the logo texture to only be on the front of the building
            const logoMaterials = [
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ color: '#63625f' }),
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ 
                    map: shinraLogoTexture,
                    metalness: 0.7,
                    roughness: 0.3
                }),
                new T.MeshStandardMaterial({ color: '#63625f' })
            ];
            const logoMesh = new T.Mesh(logoGeometry, logoMaterials);
            logoMesh.position.y = (20);
            logoMesh.position.z = (1.9);
            group.add(logoMesh);

            //Im not sure what the back of the tower looks like (you only ever
            //see the front) so I used my imagination :)
            const backTowerGeometry = new T.BoxGeometry(7, 6, 7);
            const backTowerMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const backTowerMesh = new T.Mesh(backTowerGeometry, backTowerMaterial);
            backTowerMesh.position.y = (26.5);
            backTowerMesh.position.z = (-1.5);
            group.add(backTowerMesh);
            const windowTowerGeometry = new T.BoxGeometry(6, 1, 6);
            const windowTowerMaterial = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const windowTowerMesh = new T.Mesh(windowTowerGeometry, windowTowerMaterial);
            windowTowerMesh.position.y = (30);
            windowTowerMesh.position.z = (-1.5);
            group.add(windowTowerMesh);
            const backTowerUpperGeometry = new T.BoxGeometry(7, 4, 7);
            const backTowerUpperMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const backTowerUpperMesh = new T.Mesh(backTowerUpperGeometry, backTowerUpperMaterial);
            backTowerUpperMesh.position.y = (32.5);
            backTowerUpperMesh.position.z = (-1.5);
            group.add(backTowerUpperMesh);

            //IDK what this giant cylinder is but it gives the tower its distinctive look
            const towerCylinderGeometry = new T.CylinderGeometry(4, 4, 11, 16);
            const towerCylinderMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const towerCylinderMesh = new T.Mesh(towerCylinderGeometry, towerCylinderMaterial);
            towerCylinderMesh.position.y = (28);
            towerCylinderMesh.position.z = (2);
            towerCylinderMesh.rotateZ(Math.PI/2);
            group.add(towerCylinderMesh);

            const cylinderSideLeftGeometry = new T.TorusGeometry(3, 1, 11, 16);
            const cylinderSideLeftMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const cylinderSideLeftMesh = new T.Mesh(cylinderSideLeftGeometry, cylinderSideLeftMaterial);
            cylinderSideLeftMesh.position.x = (5.5);
            cylinderSideLeftMesh.position.y = (28);
            cylinderSideLeftMesh.position.z = (2);
            cylinderSideLeftMesh.rotateY(Math.PI/2);
            cylinderSideLeftMesh.rotateZ(Math.PI/2);
            group.add(cylinderSideLeftMesh);

            const cylinderSideRightGeometry = new T.TorusGeometry(3, 1, 11, 16);
            const cylinderSideRightMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const cylinderSideRightMesh = new T.Mesh(cylinderSideRightGeometry, cylinderSideRightMaterial);
            cylinderSideRightMesh.position.x = (-5.5);
            cylinderSideRightMesh.position.y = (28);
            cylinderSideRightMesh.position.z = (2);
            cylinderSideRightMesh.rotateY(Math.PI/2);
            cylinderSideRightMesh.rotateZ(Math.PI/2);
            group.add(cylinderSideRightMesh);

            //This is the helicopter landing platform at the top of the tower
            //where Cloud fights Rufus Shinra 
            //I got my butt kicked way too many times here... :(
            const towerPlatformGeometry = new T.BoxGeometry(8, 1, 11);
            const towerPlatformMaterial = new T.MeshStandardMaterial({
                color: "Gray",
                metalness: 0.7,
                roughness: 0.3
            });
            const towerPlatformMesh = new T.Mesh(towerPlatformGeometry, towerPlatformMaterial);
            towerPlatformMesh.position.y = (35);
            towerPlatformMesh.position.z = (0.5);
            group.add(towerPlatformMesh);

            //This portion is where the CEOs office is and where the top secret 
            //reasearch takes place
            const upperCylinderGeometry = new T.CylinderGeometry(3, 3, 9, 16);
            const upperCylinderMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const upperCylinderMesh = new T.Mesh(upperCylinderGeometry, upperCylinderMaterial);
            upperCylinderMesh.position.y = (35);
            upperCylinderMesh.position.z = (-3);
            upperCylinderMesh.rotateZ(Math.PI/2);
            group.add(upperCylinderMesh);
            const upperSideLeftGeometry = new T.TorusGeometry(2.5, .5, 11, 16);
            const upperSideLeftMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const upperSideLeftMesh = new T.Mesh(upperSideLeftGeometry, upperSideLeftMaterial);
            upperSideLeftMesh.position.x = (4.5);
            upperSideLeftMesh.position.y = (35);
            upperSideLeftMesh.position.z = (-3);
            upperSideLeftMesh.rotateY(Math.PI/2);
            upperSideLeftMesh.rotateZ(Math.PI/2);
            group.add(upperSideLeftMesh);
            const upperSideRightGeometry = new T.TorusGeometry(2.5, .5, 11, 16);
            const upperSideRightMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const upperSideRightMesh = new T.Mesh(upperSideRightGeometry, upperSideRightMaterial);
            upperSideRightMesh.position.x = (-4.5);
            upperSideRightMesh.position.y = (35);
            upperSideRightMesh.position.z = (-3);
            upperSideRightMesh.rotateY(Math.PI/2);
            upperSideRightMesh.rotateZ(Math.PI/2);
            group.add(upperSideRightMesh);

            const upperlogoGeometry = new T.BoxGeometry(4, 4, 4);
            const upperlogoMaterials = [
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ color: '#63625f' }), 
                new T.MeshStandardMaterial({ 
                    map: shinraLogoTexture,
                    metalness: 0.7,
                    roughness: 0.3
                }),
                new T.MeshStandardMaterial({ color: '#63625f' })
            ];
            //IDK why theres another logo here but there is
            const upperlogoMesh = new T.Mesh(upperlogoGeometry, upperlogoMaterials);
            upperlogoMesh.position.y = (37);
            upperlogoMesh.position.z = (1);
            group.add(upperlogoMesh);
            const upperTowerGeometry = new T.CylinderGeometry(3.25, 4, 6, 16);
            const upperTowerMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const upperTowerMesh = new T.Mesh(upperTowerGeometry, upperTowerMaterial);
            upperTowerMesh.position.y = (38);
            upperTowerMesh.position.z = (-1.5);
            group.add(upperTowerMesh);
            const window1Geometry = new T.CylinderGeometry(3, 3, .5, 16);
            const window1Material = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const window1Mesh = new T.Mesh(window1Geometry, window1Material);
            window1Mesh.position.y = (41);
            window1Mesh.position.z = (-1.5);
            group.add(window1Mesh);
            const segment1Geometry = new T.CylinderGeometry(3.25, 3.25, 1, 16);
            const segmentMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const segment1Mesh = new T.Mesh(segment1Geometry, segmentMaterial);
            segment1Mesh.position.y = (42);
            segment1Mesh.position.z = (-1.5);
            group.add(segment1Mesh);
            const window2Geometry = new T.CylinderGeometry(3, 3, .5, 16);
            const window2Material = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const window2Mesh = new T.Mesh(window2Geometry, window2Material);
            window2Mesh.position.y = (42.5);
            window2Mesh.position.z = (-1.5);
            group.add(window2Mesh);
            const segment2Geometry = new T.CylinderGeometry(3.25, 3.25, 1, 16);
            const segment2Material = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const segment2Mesh = new T.Mesh(segment2Geometry, segment2Material);
            segment2Mesh.position.y = (43.5);
            segment2Mesh.position.z = (-1.5);
            group.add(segment2Mesh);
            const window3Geometry = new T.CylinderGeometry(3, 3, .5, 16);
            const window3Material = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const window3Mesh = new T.Mesh(window3Geometry, window3Material);
            window3Mesh.position.y = (44);
            window3Mesh.position.z = (-1.5);
            group.add(window3Mesh);
            const segment3Geometry = new T.CylinderGeometry(2.5, 3.25, 3, 16);
            const segment3Material = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const segment3Mesh = new T.Mesh(segment3Geometry, segment3Material);
            segment3Mesh.position.y = (46);
            segment3Mesh.position.z = (-1.5);
            group.add(segment3Mesh);
            const roofGeometry = new T.BoxGeometry(5, .75, 6.5);
            const roofMaterial = new T.MeshStandardMaterial({
                color: "Gray",
                metalness: 0.7,
                roughness: 0.3
            });
            const roofMesh = new T.Mesh(roofGeometry, roofMaterial);
            roofMesh.position.y = (48);
            roofMesh.position.z = (-1.25);
            group.add(roofMesh);
            const domeGeometry = new T.SphereGeometry(2.25, 16, 16, 0, Math.PI, 0, Math.PI);
            const domeMaterial = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide,
            });
            const domeMesh = new T.Mesh(domeGeometry, domeMaterial);
            domeMesh.position.y = (48);
            domeMesh.position.z = (-1.5);
            domeMesh.rotateX(-Math.PI/2)
            group.add(domeMesh);
            const pipe1Geometry = new T.CylinderGeometry(0.75, 0.75, 6, 16);
            const pipeMaterial = new T.MeshStandardMaterial({
                color: '#9e9c95',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe1Mesh = new T.Mesh(pipe1Geometry, pipeMaterial);
            pipe1Mesh.position.x = (6);
            pipe1Mesh.position.y = (17);
            pipe1Mesh.position.z = (2.5);
            group.add(pipe1Mesh);
            const pipe2Geometry = new T.CylinderGeometry(0.75, 0.75, 6, 16);
            const pipe2Material = new T.MeshStandardMaterial({
                color: '#9e9c95',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe2Mesh = new T.Mesh(pipe2Geometry, pipe2Material);
            pipe2Mesh.position.x = (-6);
            pipe2Mesh.position.y = (17);
            pipe2Mesh.position.z = (2.5);
            group.add(pipe2Mesh);
            const pipe3Geometry = new T.CylinderGeometry(0.75, 0.75, 9, 16);
            const pipe3Material = new T.MeshStandardMaterial({
                color: '#9e9c95',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe3Mesh = new T.Mesh(pipe3Geometry, pipe3Material);
            pipe3Mesh.position.x = (-4);
            pipe3Mesh.position.y = (28);
            pipe3Mesh.position.z = (-2);
            group.add(pipe3Mesh);
            const pipe4Geometry = new T.CylinderGeometry(0.75, 0.75, 9, 16);
            const pipe4Material = new T.MeshStandardMaterial({
                color: '#9e9c95',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe4Mesh = new T.Mesh(pipe4Geometry, pipe4Material);
            pipe4Mesh.position.x = (4);
            pipe4Mesh.position.y = (28);
            pipe4Mesh.position.z = (-2);
            group.add(pipe4Mesh);

            super(`ShinraBuilding`, group);  
        }
    }

    //This constructor creates the actual circular ground portion
    //and the walls the split the 
    export class Plates extends GrObject{
        constructor(params = {}) {
            let group = new T.Group();
            
            const outerRadius = 50;
            const innerRadius = 17;
            const height = 4;
            
            //Form the giant ring shape to make the ground for the plates
            //with by making a custom shape
            const plateground = new T.Shape();
            plateground.moveTo(outerRadius, 0);
            plateground.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
            plateground.moveTo(innerRadius, 0);
            plateground.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
            
            const extrudeSettings = {
                depth: height,
                bevelEnabled: false
            };  
            const plategroundGeo = new T.ExtrudeGeometry(plateground, extrudeSettings);
            plategroundGeo.rotateX(Math.PI / 2);
            const plategroundMaterial = new T.MeshStandardMaterial({
                color: '#4e4b3e',
                metalness: 0.9,
                roughness: 0.9,
                side: T.DoubleSide 
            });
            const plategroundMesh = new T.Mesh(plategroundGeo, plategroundMaterial);
            plategroundMesh.position.y = 2;
            group.add(plategroundMesh);

            //This is just repeated from above
            const innerPlate = new T.Shape();
            innerPlate.moveTo(21, 0);
            innerPlate.absarc(0, 0, 21, 0, Math.PI * 2, false);
            innerPlate.moveTo(17, 0);
            innerPlate.absarc(0, 0, 17, 0, Math.PI * 2, true);
            
            const innerPlateSettings = {
                depth: 10,
                bevelEnabled: false
            };  

            const innerPlateGeo = new T.ExtrudeGeometry(innerPlate, innerPlateSettings);
            innerPlateGeo.rotateX(Math.PI / 2);
            const innerPlateMaterial = new T.MeshStandardMaterial({
                color: '#605c58',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide 
            });
            const innerPlateMesh = new T.Mesh(innerPlateGeo, innerPlateMaterial);
            innerPlateMesh.position.y = 6;
            group.add(innerPlateMesh);
            
            //modifiers to form the walls seperating the "slices"
            const wallCount = 8;
            const wallThickness = 2; 
            const wallHeight = 5.5;    
            
            //Wasnt sure the best way to do this so I had Deepseek
            //work though this with me. It creates thin, wall shaped boxes
            //and positions them with angles make an "8 spoke wheel" type shape
            for (let i = 0; i < wallCount; i++) {
                const angle = (i / wallCount) * Math.PI * 2;
                const innerX = 21 * Math.cos(angle);
                const innerZ = 21 * Math.sin(angle);
                const outerX = outerRadius * Math.cos(angle);
                const outerZ = outerRadius * Math.sin(angle);
                
                //Figures of the length for this wall and the positioning of the wall
                const wallLength = outerRadius - 20;
                const centerX = (innerX + outerX) / 2;
                const centerZ = (innerZ + outerZ) / 2;
                
                const wallGeometry = new T.BoxGeometry(
                    wallLength,    
                    wallHeight,    
                    wallThickness  
                );
                
                //To make it like the outer wall, I reuse the metal shader here
                const wallMaterial = shaderMaterial('./metalShader.vs', './metalShader.fs', {
                    lights: false
                });
                
                const wall = new T.Mesh(wallGeometry, wallMaterial);
                
                //Position the wall and make it connect to the unner ring
                wall.position.set(centerX, 3, centerZ); 
                wall.rotation.y = -angle; 
                group.add(wall);
            }
            super(`Plates`, group);  
        }
    }

    //This creates a simple house fot my residential district
    //This is almost an exact copy and paste from Workbook 8
    //as I made it with the intention to use it here
    export class SimpleHouse extends GrObject {
        constructor(params = {}) {
            const groupForSimpleHouse = new T.Group();
            const size = (params.size || 2);
            const houseSize = (size / 2);
            const yrot = params.yrot;
    
            //Load in all my textures for my buildings
            const frontDoorTexture = new T.TextureLoader().load('./frontdoor.png');
            const windowsTexture = new T.TextureLoader().load('./window.png');
            const roofTexture = new T.TextureLoader().load('./roof.png');
    
            //Defining the materials are the easy part so Ill get it out of the way first
            const houseWallMat = new T.MeshStandardMaterial({ color: params.color, side: T.DoubleSide});
            const frontDoorMat = new T.MeshStandardMaterial({ map: frontDoorTexture, side: T.DoubleSide, transparent: true, alphaTest: 0.1 });
            const windowMat = new T.MeshStandardMaterial({ map: windowsTexture, side: T.DoubleSide, transparent: true, alphaTest: 0.1 });
            const roofMat = new T.MeshStandardMaterial({ map: roofTexture, side: T.DoubleSide});
    
            //Ill start by making the walls
    
            //Sets up the verticies of the walls
            const wallCorners = new Float32Array([
                //The definition and layout of these verticies are the same as what I used for
                //my dice and for my domino
                -houseSize, -houseSize,  houseSize,  
                 houseSize, -houseSize,  houseSize,  
                 houseSize, -houseSize, -houseSize,  
                -houseSize, -houseSize, -houseSize,  
                -houseSize,  houseSize,  houseSize,  
                 houseSize,  houseSize,  houseSize,  
                 houseSize,  houseSize, -houseSize,  
                -houseSize,  houseSize, -houseSize   
            ]);
    
            //This helper function will construct the aspects of an individual wall
            //using its verticies. Then it applies the texture to the wall. Once its done, 
            //it will add it to the wall group.
            const buildAWall = (vertices, featureMaterial) => {
                const groupForWalls = new T.Group();
                
                //First, we start off by defining the geometry and we set the positioning of the base
                //using the individial verticies for this wall
                const baseGeo = new T.BufferGeometry();
                const baseWallPositioning = new Float32Array(4 * 3);
                for (let i = 0; i < 4; i++) {
                    const cornerIndex = vertices[i];
                    //By adding 0, 1 then 2, we effectively access the X, Y and Z of this vertex
                    baseWallPositioning[i * 3] = wallCorners[cornerIndex * 3];
                    baseWallPositioning[i * 3 + 1] = wallCorners[cornerIndex * 3 + 1];
                    baseWallPositioning[i * 3 + 2] = wallCorners[cornerIndex * 3 + 2];
                }
                
                //Both of these are done very similarly to how I did it for the dice and the domino
                //Next I define the indicies to make the wall a complete square
                const wallIndicies = new Uint16Array(
                    [0, 1, 2, 0, 2, 3]);
                //Then I define the uv mapping 
                const uvMapping = new Float32Array(
                    [0, 0, 1, 0, 1, 1, 0, 1]);
                
                baseGeo.setAttribute('position', new T.BufferAttribute(baseWallPositioning, 3));
                baseGeo.setIndex(new T.BufferAttribute(wallIndicies, 1));
                baseGeo.setAttribute('uv', new T.BufferAttribute(uvMapping, 2));
                
                //Moving on, using the positions of the base verticies, I will find the normal vectors
                //We start by forming an empty vector where we'll store our normal vector
                const normal = new T.Vector3();
                //Based on the position data for the wall's geometry, we'll get 3 verticies v1, v2 and v3
                //We build vectors from a flat array containing the vertex coordinates and we then create
                //vectors from 0, 3 and 6 (the first, second and third verticies respectively)
                const v1 = new T.Vector3().fromArray(baseWallPositioning, 0);
                const v2 = new T.Vector3().fromArray(baseWallPositioning, 3);
                const v3 = new T.Vector3().fromArray(baseWallPositioning, 6);
                
                //We create two edge vectors from the 3 vectors I found in the last step
                //We fidn their cross product to get the perpendicular vector of the two
                //Then, we normalize to make it a length of 1
                //This will give us the normal vector coming out of this face
                normal.crossVectors(
                    new T.Vector3().subVectors(v2, v1),
                    new T.Vector3().subVectors(v3, v1)
                ).normalize();
                
                //The last step before we set the normal attribute is that we get the normals for all 4 verticies
                //of this wall. Just like above, we'll have 3 components, an X, Y and Z, so we simply 
                //add 0, 1 and 2 as we loop 4 times for each vertex
                const normalVectorCoords = new Float32Array(4 * 3);
                for (let i = 0; i < 4; i++) {
                    normalVectorCoords[i * 3] = normal.x;
                    normalVectorCoords[i * 3 + 1] = normal.y;
                    normalVectorCoords[i * 3 + 2] = normal.z;
                }
                baseGeo.setAttribute('normal', new T.BufferAttribute(normalVectorCoords, 3));
                
                const thisWall = new T.Mesh(baseGeo, houseWallMat);
                groupForWalls.add(thisWall);
                
                //Once the normal wall is finished, I add on the texture for this wall
                const wallTextureGeometry = new T.BufferGeometry();
                const wallTexturePositioning = new Float32Array(4 * 3);
                //for each verticie, X Y and Z, Ill place the texture then I move it slightly
                //infront of the wall in its normal direction. This is an important step because I ran into
                //issues where the texture interfeared with the wall material and it caused the wall to not display
                //correctly.
                for (let i = 0; i < 4; i++) {
                    const cornerIndex = vertices[i];
                    wallTexturePositioning[i * 3] = wallCorners[cornerIndex * 3];
                    wallTexturePositioning[i * 3 + 1] = wallCorners[cornerIndex * 3 + 1];
                    wallTexturePositioning[i * 3 + 2] = wallCorners[cornerIndex * 3 + 2];
                    
                    //Move forwards in the normal direction to create some space
                    wallTexturePositioning[i * 3] += normal.x * 0.01;
                    wallTexturePositioning[i * 3 + 1] += normal.y * 0.01;
                    wallTexturePositioning[i * 3 + 2] += normal.z * 0.01;
                }
                
                //Once were done placing the texture position, I set the geometry for this texture
                wallTextureGeometry.setAttribute('position', new T.BufferAttribute(wallTexturePositioning, 3));
                wallTextureGeometry.setIndex(new T.BufferAttribute(wallIndicies, 1));
                wallTextureGeometry.setAttribute('uv', new T.BufferAttribute(uvMapping, 2));
                wallTextureGeometry.setAttribute('normal', new T.BufferAttribute(normalVectorCoords, 3));
                
                //The wall is finished now, so we can add the wall to the wall group
                const textureMesh = new T.Mesh(wallTextureGeometry, featureMaterial);
                groupForWalls.add(textureMesh);
                return groupForWalls;
            };
    
            //Now that we have all our walls set up we can using the verticies to actually build the walls.
            //This is also where we apply the material with the applied texture to the wall. In the case of the
            //simple house, the front has a door, and the other three walls will have a window.
            //Once we do, we add it to the group
            const frontWall = buildAWall([0, 1, 5, 4], frontDoorMat);
            groupForSimpleHouse.add(frontWall);
            const rearWall = buildAWall([2, 3, 7, 6], windowMat);
            groupForSimpleHouse.add(rearWall);
            const rightWall = buildAWall([1, 2, 6, 5], windowMat);
            groupForSimpleHouse.add(rightWall);
            const leftWall = buildAWall([3, 0, 4, 7], windowMat);
            groupForSimpleHouse.add(leftWall);
    
            //At this point, the walls are finished so I move onto the roof
    
            //This house will have a pyramid shaped roof
            const roofHeight = (size * 0.75);
            const heightOfHouse = (houseSize + roofHeight);
            
            //The process for how I make the roof is very similar to how I make the walls
            //I start by defining the verticies
            const roofVertices = new Float32Array([
                //Add in the 4 corners of the roof
                -houseSize, houseSize,  houseSize, 
                 houseSize, houseSize,  houseSize,  
                 houseSize, houseSize, -houseSize,   
                -houseSize, houseSize, -houseSize,   
                //Add on the centered roof vertex
                //Should be the height of the house
                0, heightOfHouse, 0                  
            ]);
    
            //Define all 4 triangular roof portions
            //Point number 4 here is the center point
            //Make sure to connect them in the same ordering to 
            //make sure they display correctly
            const roofSides = new Uint16Array([
                0, 1, 4,  
                1, 2, 4,  
                2, 3, 4,  
                3, 0, 4   
            ]);
    
            //Set constants to store our normals and uv map for the roop pieces
            const normalsForTheRoof = new Float32Array(4 * 3 * 3);
            const uvMappingForRoof = new Float32Array(4 * 3 * 2);
            
            //Next I move on to finding the normalVectorCoords
            //Almost all of this functions the same as the block above where
            //I do the same for my walls
            //I loop for each of my verticies
            for (let i = 0; i < 4; i++) {
                const base1 = i;
                const base2 = (i + 1) % 4;
                const peak = 4;
    
                //Using the X Y and Z, we find the edhe vectors of the faces like we did with the walls
                //Because these are triangular, we only need to define 2 vectors here, unlike the 3 with the walls
                //We're looking for the roof peak to the current then next bases
                const v1 = new T.Vector3(
                    roofVertices[base1 * 3] - roofVertices[peak * 3],
                    roofVertices[base1 * 3 + 1] - roofVertices[peak * 3 + 1],
                    roofVertices[base1 * 3 + 2] - roofVertices[peak * 3 + 2]
                );
                const v2 = new T.Vector3(
                    roofVertices[base2 * 3] - roofVertices[peak * 3],
                    roofVertices[base2 * 3 + 1] - roofVertices[peak * 3 + 1],
                    roofVertices[base2 * 3 + 2] - roofVertices[peak * 3 + 2]
                );
                //Then, once we have two vectors, we define it as the normal of this face
                const normal = new T.Vector3().crossVectors(v1, v2).normalize();
                
                //Finally, we set the X, Y and X to be the same normal
                //Its like this because the surface is flat, so they should have the same normal
                //to ensure that we get nice even lighting
                for (let j = 0; j < 3; j++) {
                    const vertexIndex = i * 3 + j;
                    normalsForTheRoof[vertexIndex * 3] = normal.x;
                    normalsForTheRoof[vertexIndex * 3 + 1] = normal.y;
                    normalsForTheRoof[vertexIndex * 3 + 2] = normal.z;
                }
                
                //Finally, Ill define the roof UV mapping 
                //This sets up how the roof texture lines up with the triangular roof faces
                uvMappingForRoof[i * 6 + 0] = 0;   
                uvMappingForRoof[i * 6 + 1] = 0;   
                uvMappingForRoof[i * 6 + 2] = 1;   
                uvMappingForRoof[i * 6 + 3] = 0;   
                uvMappingForRoof[i * 6 + 4] = 0.5; 
                uvMappingForRoof[i * 6 + 5] = 1;   
            }
    
            //Once all the roof geometrys are finished, we set it and build the roof mesh 
            const roofGeo = new T.BufferGeometry();
            roofGeo.setAttribute('position', new T.BufferAttribute(roofVertices, 3));
            roofGeo.setAttribute('normal', new T.BufferAttribute(normalsForTheRoof, 3));
            roofGeo.setAttribute('uv', new T.BufferAttribute(uvMappingForRoof, 2));
            roofGeo.setIndex(new T.BufferAttribute(roofSides, 1));
            const roofMesh = new T.Mesh(roofGeo, roofMat);
            //Finally, we add the roof mesh to the house group
            groupForSimpleHouse.add(roofMesh);
            //The key to assembling the whole house is to place the roof
            //by adjusting the positioning on Y to make sure everything fits together seemlessly.
            groupForSimpleHouse.position.y = houseSize;
    
            super(`House-${params.name || ''}`, groupForSimpleHouse);
    
            if (params.position) {
                this.objects[0].position.set(
                    params.position.x,
                    params.position.y + houseSize,
                    params.position.z
                );
            }
            groupForSimpleHouse.rotateY(yrot);
        }
    }

    //Creates a simple apartment building for the residential districts
    //Again, like the simple house, this is pulled straight from Workbook 8
    //I only added a rotation paramater and color param to give me more control over it
    export class ApartmentBuilding extends GrObject {
        constructor(params = {}) {
            //Define the building group and the side lengths to form the apartment building
            const buildingGroup = new T.Group();
            const size = params.size || 2; 
            const width = size * 2;       
            const height = size;          
            //We get the half values for the dimensions (we'll use these for defining verticies as we go in reference from the center)
            const halfWidth = width / 2;
            const halfDepth = size / 2;
            const halfHeight = height / 2;
            const yrot = params.yrot;
    
            //Load in all my textures for my buildings
            const frontTexture = new T.TextureLoader().load('./townhousefrontfull.png');
            const backTexture = new T.TextureLoader().load('./townhouserearfull.png');
            const roofTexture = new T.TextureLoader().load('./roof.png');
    
            //Defining the materials are the easy part so Ill get it out of the way first
            const houseWallMat = new T.MeshStandardMaterial({ color: params.color,side: T.DoubleSide});
            const frontMaterial = new T.MeshStandardMaterial({ map: frontTexture,side: T.DoubleSide,transparent: true,alphaTest: 0.1});
            const backMaterial = new T.MeshStandardMaterial({map: backTexture,side: T.DoubleSide,transparent: true,alphaTest: 0.1});
            const roofMat = new T.MeshStandardMaterial({map: roofTexture,side: T.DoubleSide});
    
            //Again, we start by making the walls and the first step is to define the verticies for them
            const buildingCorners = new Float32Array([
                -halfWidth, -halfHeight,  halfDepth,  
                 halfWidth, -halfHeight,  halfDepth,  
                 halfWidth, -halfHeight, -halfDepth,  
                -halfWidth, -halfHeight, -halfDepth,  
                -halfWidth,  halfHeight,  halfDepth,  
                 halfWidth,  halfHeight,  halfDepth,  
                 halfWidth,  halfHeight, -halfDepth,  
                -halfWidth,  halfHeight, -halfDepth   
            ]);
    
            //The helper for the creation of the walls
            const buildAWall = (vertices, featureMaterial) => {
                const groupForWalls = new T.Group();
                
                //First, we start off by defining the geometry and we set the positioning of the base
                //using the individial verticies for this wall
                const baseGeo = new T.BufferGeometry();
                const baseWallPositioning = new Float32Array(4 * 3);
                for (let i = 0; i < 4; i++) {
                    const cornerIndex = vertices[i];
                    baseWallPositioning[i * 3] = buildingCorners[cornerIndex * 3];
                    baseWallPositioning[i * 3 + 1] = buildingCorners[cornerIndex * 3 + 1];
                    baseWallPositioning[i * 3 + 2] = buildingCorners[cornerIndex * 3 + 2];
                }
                
                //Next we define our squared sides and our UV mapping
                const wallIndicies = new Uint16Array(
                    [0, 1, 2, 0, 2, 3]);
                const uvMapping = new Float32Array(
                    [0, 0, 1, 0, 1, 1, 0, 1]);
                //Then we set the geometries fro these aspects
                baseGeo.setAttribute('position', new T.BufferAttribute(baseWallPositioning, 3));
                baseGeo.setIndex(new T.BufferAttribute(wallIndicies, 1));
                baseGeo.setAttribute('uv', new T.BufferAttribute(uvMapping, 2));
                
                //Moving on, using the positions of the base verticies, I will find the normal vectors
                //Once I find the vectors, I set my array of normalVectorCoords and set those as a part for the geometry 
                const normal = new T.Vector3();
                const v1 = new T.Vector3().fromArray(baseWallPositioning, 0);
                const v2 = new T.Vector3().fromArray(baseWallPositioning, 3);
                const v3 = new T.Vector3().fromArray(baseWallPositioning, 6);
                //We create two edge vectors from the 3 vectors I found in the last step
                //We fidn their cross product to get the perpendicular vector of the two
                //Then, we normalize to make it a length of 1
                //This will give us the normal vector coming out of this face
                normal.crossVectors(
                    new T.Vector3().subVectors(v2, v1),
                    new T.Vector3().subVectors(v3, v1)
                ).normalize();
                
                //The last step before we set the normal attribute is that we get the normals for all 4 verticies
                //of this wall. Just like above, we'll have 3 components, an X, Y and Z, so we simply 
                //add 0, 1 and 2 as we loop 4 times for each vertex
                const normalVectorCoords = new Float32Array(4 * 3);
                for (let i = 0; i < 4; i++) {
                    normalVectorCoords[i * 3] = normal.x;
                    normalVectorCoords[i * 3 + 1] = normal.y;
                    normalVectorCoords[i * 3 + 2] = normal.z;
                }
                baseGeo.setAttribute('normal', new T.BufferAttribute(normalVectorCoords, 3));
                
                const thisWall = new T.Mesh(baseGeo, houseWallMat);
                groupForWalls.add(thisWall);
                
                //for each verticie, X Y and Z, Ill place the texture then I move it slightly
                //infront of the wall in its normal direction. This is an important step because I ran into
                //issues where the texture interfeared with the wall material and it caused the wall to not display
                //correctly.
                if (featureMaterial) {
                    const wallTextureGeometry = new T.BufferGeometry();
                    const wallTexturePositioning = new Float32Array(4 * 3);
                    for (let i = 0; i < 4; i++) {
                        const cornerIndex = vertices[i];
                        wallTexturePositioning[i * 3] = buildingCorners[cornerIndex * 3];
                        wallTexturePositioning[i * 3 + 1] = buildingCorners[cornerIndex * 3 + 1];
                        wallTexturePositioning[i * 3 + 2] = buildingCorners[cornerIndex * 3 + 2];
                        
                        // Move the feature slightly forward in its normal direction to create some space
                        wallTexturePositioning[i * 3] += normal.x * 0.01;
                        wallTexturePositioning[i * 3 + 1] += normal.y * 0.01;
                        wallTexturePositioning[i * 3 + 2] += normal.z * 0.01;
                    }
                    
                    wallTextureGeometry.setAttribute('position', new T.BufferAttribute(wallTexturePositioning, 3));
                    wallTextureGeometry.setIndex(new T.BufferAttribute(wallIndicies, 1));
                    wallTextureGeometry.setAttribute('uv', new T.BufferAttribute(uvMapping, 2));
                    wallTextureGeometry.setAttribute('normal', new T.BufferAttribute(normalVectorCoords, 3));
                    //The wall is finished now, so we can add the wall to the wall group
                    const textureMesh = new T.Mesh(wallTextureGeometry, featureMaterial);
                    groupForWalls.add(textureMesh);
                }
                return groupForWalls;
            };
    
            //Now that we have all our walls set up we can using the verticies to actually build the walls.
            //This is also where we apply the material with the applied texture to the wall. In the case of the
            //apartment, the front and back have specially edited textures that I made that apply and door and a bunch 
            //of windows with just one texture. This made it SOOOOOO much easier for me to add all the features.
            const frontWall = buildAWall([0, 1, 5, 4], frontMaterial);
            buildingGroup.add(frontWall);
            const rearWall = buildAWall([2, 3, 7, 6], backMaterial);
            buildingGroup.add(rearWall);
            const rightWall = buildAWall([1, 2, 6, 5], null);
            buildingGroup.add(rightWall);
            const leftWall = buildAWall([3, 0, 4, 7], null);
            buildingGroup.add(leftWall);
    
            //Next I'll make the roof, The apartment has an open gable style roof
            const roofHeight = size * 0.3;
            const heightOfHouse = halfHeight + roofHeight;
    
            //like the walls, we define the verticies of the 4 corners
            const roofVertices = new Float32Array([
                -halfWidth, halfHeight,  halfDepth, 
                halfWidth, halfHeight,  halfDepth,  
                halfWidth, halfHeight, -halfDepth, 
                -halfWidth, halfHeight, -halfDepth,  
                //The open gable roof has two top corners that form triagular faces on the sides
                //and two slanted rectangular roof portions
                -halfWidth, heightOfHouse,  0,            
                halfWidth, heightOfHouse,  0             
            ]);
    
            //This is a little different than the simple house as its a bit more complex
            const roofSides = new Uint16Array([
                //Forms the two side triangles for the roof
                0, 3, 4,
                1, 2, 5,
                
                //Forms the front and back rectangular roof portions
                0, 4, 5,
                0, 5, 1,
                3, 2, 5,
                3, 5, 4
            ]);
    
            //Set the UV mapping for the roof portions
            const uvMappingForRoof = new Float32Array([
                //We have to be careful when we form the side trianglar portions
                //I go bottom left, bottom right then the top center to form the triangle
                0, 0,  
                1, 0,  
                0.5, 1, 
                
                0, 0,  
                1, 0,  
                0.5, 1, 
                
                //Then, I move on to the rectangular sloped portions
                //Left slope
                0, 0, 1, 0, 1, 1,
                0, 0, 1, 1, 0, 1,
                //Right slope
                0, 0, 1, 0, 1, 1,
                0, 0, 1, 1, 0, 1
            ]);
    
            //Now that the roof is defined, we can form the geometry 
            const roofGeo = new T.BufferGeometry();
            //Set the verticies, uv map and the indicies
            roofGeo.setAttribute('position', new T.BufferAttribute(roofVertices, 3));
            roofGeo.setAttribute('uv', new T.BufferAttribute(uvMappingForRoof, 2));
            roofGeo.setIndex(new T.BufferAttribute(roofSides, 1));
    
            //Find the normal for the roof geometry
            //I didnt know how to apply this with this roof setup so Deepseek helped me here
            roofGeo.computeVertexNormals();
    
            //Now that all the roof aspects are finsihed, we can form the mesh
            const roofMesh = new T.Mesh(roofGeo, roofMat);
            buildingGroup.add(roofMesh);
    
            //Again the final important step, we use the y positioning to
            //place the building in a way that the roof and building are connected and
            //for one complete apartment building
            buildingGroup.position.y = halfHeight;
    
            super(`ApartmentBuilding-${params.name || ''}`, buildingGroup);
    
            if (params.position) {
                this.objects[0].position.set(
                    params.position.x,
                    params.position.y + halfHeight,
                    params.position.z
                );
            }
            buildingGroup.rotateY(yrot);
        }
    }

    //A basic road. Its literally just a black rectangle I embed into the ground
    export class Roads extends GrObject{
        constructor(params = {}) {
            let group = new T.Group();
            const length = params.length;
            const yrot = params.yrot;
            const roadGeometry = new T.BoxGeometry(2, .5, length);
            const roadMaterial = new T.MeshStandardMaterial({
                color: "black",
                roughness: 0.9
            });
            const roadMesh = new T.Mesh(roadGeometry, roadMaterial);
            group.add(roadMesh);
           
            super(`Roads`, group);  
            if (params.position) {
                this.objects[0].position.set(
                    params.position.x,
                    params.position.y + 2,
                    params.position.z
                );
            }
            group.rotateY(yrot);
        }
    }

    //For sector 5
    //This is a large mashup of Mako energy pipes that over
    //the whole where the upper plate of Sector 5 once was
    export class PipeLatus extends GrObject{
        constructor(params = {}) {
            let group = new T.Group();
            const pipe1Material = new T.MeshStandardMaterial({
                color: '#63625f',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe2Material = new T.MeshStandardMaterial({
                color: '#717680',
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe3Material = new T.MeshStandardMaterial({
                color: "Sliver",
                metalness: 0.7,
                roughness: 0.3
            });
            const pipe1Geometry = new T.CylinderGeometry(1, 1, 20, 16);
            const pipe1 = new T.Mesh(pipe1Geometry, pipe1Material);
            pipe1.position.x = (-25);
            pipe1.position.y = (4);
            pipe1.position.z = (10);
            pipe1.rotateX(Math.PI/2);
            pipe1.rotateZ(5 * Math.PI / 6 );
            group.add(pipe1);
            const pipe2Geometry = new T.CylinderGeometry(1, 1, 30, 16);
            const pipe2 = new T.Mesh(pipe2Geometry, pipe3Material);
            pipe2.position.x = (-35);
            pipe2.position.y = (4);
            pipe2.position.z = (15);
            pipe2.rotateX(Math.PI/2);
            pipe2.rotateZ(5 * Math.PI / 6 );
            group.add(pipe2);
            const pipe3Geometry = new T.CylinderGeometry(1, 1, 33, 16);
            const pipe3 = new T.Mesh(pipe3Geometry, pipe1Material);
            pipe3.position.x = (-38);
            pipe3.position.y = (4);
            pipe3.position.z = (16);
            pipe3.rotateX(Math.PI/2);
            pipe3.rotateZ(5 * Math.PI / 6 );
            group.add(pipe3);
            const pipe4Geometry = new T.CylinderGeometry(2, 2, 26, 16);
            const pipe4 = new T.Mesh(pipe4Geometry, pipe2Material);
            pipe4.position.x = (-30);
            pipe4.position.y = (3);
            pipe4.position.z = (12);
            pipe4.rotateX(Math.PI/2);
            pipe4.rotateZ(5 * Math.PI / 6 );
            group.add(pipe4);
            const pipe5Geometry = new T.CylinderGeometry(2, 2, 31, 16);
            const pipe5 = new T.Mesh(pipe5Geometry, pipe2Material);
            pipe5.position.x = (-30);
            pipe5.position.y = (3);
            pipe5.position.z = (16);
            pipe5.rotateX(Math.PI/2);
            pipe5.rotateZ(-4 * Math.PI / 6 );
            group.add(pipe5);
            const pipe6Geometry = new T.CylinderGeometry(1, 1, 33, 16);
            const pipe6 = new T.Mesh(pipe6Geometry, pipe3Material);
            pipe6.position.x = (-34);
            pipe6.position.y = (4);
            pipe6.position.z = (12);
            pipe6.rotateX(Math.PI/2);
            pipe6.rotateZ(-4 * Math.PI / 6 );
            group.add(pipe6);
            const pipe7Geometry = new T.CylinderGeometry(1, 1, 33, 16);
            const pipe7 = new T.Mesh(pipe7Geometry, pipe1Material);
            pipe7.position.x = (-35);
            pipe7.position.y = (4);
            pipe7.position.z = (10);
            pipe7.rotateX(Math.PI/2);
            pipe7.rotateZ(-4 * Math.PI / 6 );
            group.add(pipe7);
            const pipe8Geometry = new T.CylinderGeometry(1, 1, 33, 16);
            const pipe8 = new T.Mesh(pipe8Geometry, pipe2Material);
            pipe8.position.x = (-30);
            pipe8.position.y = (4);
            pipe8.position.z = (24);
            pipe8.rotateX(Math.PI/2);
            pipe8.rotateZ(-4 * Math.PI / 6 );
            group.add(pipe8);
            const pipe9Geometry = new T.CylinderGeometry(1, 1, 30, 16);
            const pipe9 = new T.Mesh(pipe9Geometry, pipe2Material);
            pipe9.position.x = (-40);
            pipe9.position.y = (4);
            pipe9.position.z = (8);
            pipe9.rotateX(Math.PI/2);
            pipe9.rotateZ(-4 * Math.PI / 6 );
            group.add(pipe9);
            const pipe10Geometry = new T.CylinderGeometry(2, 2, 6, 16);
            const pipe10 = new T.Mesh(pipe10Geometry, pipe1Material);
            pipe10.position.x = (-45);
            pipe10.position.y = (4);
            pipe10.position.z = (4);
            group.add(pipe10);
            const pipe11Geometry = new T.CylinderGeometry(2, 2, 8, 16);
            const pipe11 = new T.Mesh(pipe11Geometry, pipe2Material);
            pipe11.position.x = (-45);
            pipe11.position.y = (4);
            pipe11.position.z = (8);
            group.add(pipe11);
            const pipe12Geometry = new T.CylinderGeometry(2, 2, 6, 16);
            const pipe12 = new T.Mesh(pipe12Geometry, pipe1Material);
            pipe12.position.x = (-19);
            pipe12.position.y = (4);
            pipe12.position.z = (14);
            group.add(pipe12);
            
            super(`PipeLatus`, group);  
        }
    }

    //Create a bunch of simple cone shaped trees with a variety of colors
    //sizes and shapes
    //This is super basic and it came from Workbook 8 just like the basic house
    //and apartment building did
    export class SimplePinetree extends GrObject {
        constructor(params = {}) {
          const pinetree = new T.BufferGeometry();
          const coneHeight = params.height;
          //Sets the number of faces on the cone
          const triangularFaces = params.sides; 
          //Sets the radius of the cone base
          const baseRadius = params.radius;  
      
          //An array of verticies
          const vertices = [];
          //Place the top vertex at the top of the cone
          vertices.push(0, coneHeight, 0);
      
          //An array of verticie vertexNormals
          const vertexNormals = [];
          //Set normal (only temporary for now)
          vertexNormals.push(0, 1, 0); 
      
          //We do the below instead of the defining of individual 
          //coordinate based verticies
          //Create the verticies for the cone base
          for(let i = 0; i < triangularFaces; ++i){
            const baseVertexAngle = ((2 * Math.PI) * (i / triangularFaces));
            //Use the base radus and the cos and sin of the new vertex's angle from the center
            //to determine its equivalent x and y coordinate
            const vertexX = (baseRadius * Math.cos(baseVertexAngle));
            const vertexZ = (baseRadius * Math.sin(baseVertexAngle));
            //Push the verticies for the base to our collection (Y is at 0 always)
            vertices.push(vertexX, 0, vertexZ); 
            //Set our vertexNormals pointing out from the center axis
            vertexNormals.push(vertexX, coneHeight, vertexZ); 
          }
      
          //Set our geometry attribute
          pinetree.setAttribute('position', new T.BufferAttribute(new Float32Array(vertices), 3));
      
          //A set of all our sides
          const wallIndicies = [];
          //For all of the base verticies, we connect them to the top point
          for (let i = 1; i <= triangularFaces; i++) {
            //We get the next side of the cone
            const sideToConnect = ((i % triangularFaces) + 1);
            //connect and place the side into the set of indicies
            wallIndicies.push(0, sideToConnect, i);
          }
      
          //Connect the sides to form the cone shape
          pinetree.setIndex(wallIndicies);
      
          //Normalized the normal verticies, we do this to make the nice even lighting across the sides
          //This part I was especially confused about
          //First we make a temporary use vector to use with individual vertexNormals
          const individualNormal = new T.Vector3();
          //We go through all the vertexNormals in the array
          //We increment by 3s as they come in batches of x, y and z
          for(let i = 0; i < vertexNormals.length; i = i + 3){
            //Load the normal components into the Vector then convert to equivalent normal vector
            individualNormal.set(vertexNormals[i], vertexNormals[i + 1], vertexNormals[i + 2]).normalize();
            //Now that we have the normalized values, we update the orignal array 
            vertexNormals[i] = individualNormal.x;
            vertexNormals[i + 1] = individualNormal.y;
            vertexNormals[i + 2] = individualNormal.z;
          }
      
          pinetree.setAttribute('normal', new T.BufferAttribute(new Float32Array(vertexNormals), 3));
      
          const material3 = new T.MeshStandardMaterial({
            //Make it green
            color: params.color,
          });
      
          //Sets the mesh to assemble the cone in the world
          const mesh = new T.Mesh(pinetree, material3);
          super("SimplePinetree", mesh);
      
          if (params.position) {
              this.objects[0].position.set(
                  params.position.x,
                  params.position.y,
                  params.position.z
              );
          }
        }
      }

      //Creates a military semitruck (from Workbook 8)
      //The actual truck construction is the same as the workbook
      //but I (with Deepseeks help) added on StepWorld motion to make the
      //truck drive in circles on the road around the main tower
      export class SemiTruck extends GrObject {
        constructor(params = {}) {
          //Create a group for the semitruck and all its parts
          let semiTruck = new T.Group();
      
          //Build the cab of the truck
          let cabGeometry = new T.BoxGeometry(1.5, 2, 2);
          let cabMaterial = new T.MeshStandardMaterial({color: "green", metalness: 0.5});
          let cab = new T.Mesh(cabGeometry, cabMaterial);
          cab.position.set(1.5, 1.15, 0);
          semiTruck.add(cab);
      
          //Adds on the windshield and the side windows
          let windowMaterial = new T.MeshStandardMaterial({color: "lightblue"});
          let sideWindowsGeo = new T.BoxGeometry(.5, .8, 1.75);
          let sideWindows = new T.Mesh(sideWindowsGeo, windowMaterial);
          sideWindows.position.set(2.05, 1.5, 0);
          semiTruck.add(sideWindows);
          let windshieldGeometry = new T.BoxGeometry(1.2, 0.7, 2.1);
          let windshield = new T.Mesh(windshieldGeometry, windowMaterial);
          windshield.position.set(1.5, 1.4, 0);
          semiTruck.add(windshield);
      
          //Creates the front grill
          let grillMaterial = new T.MeshStandardMaterial({color: "black"});
          let grillGeo = new T.BoxGeometry(.5, .6, 1.4);
          let grill = new T.Mesh(grillGeo, grillMaterial);
          grill.position.set(2.05, .55, 0);
          semiTruck.add(grill);
      
          //Defines headlight and brakelight materials and geometry
          //Embed them into the body of the truck
          let headlightsGeo = new T.CylinderGeometry(0.125, 0.125, 0.3, 48);
          let headlightsMat = new T.MeshStandardMaterial({color: "Yellow"});
          let headlightLeft = new T.Mesh(headlightsGeo, headlightsMat);
          headlightLeft.rotation.z = Math.PI/2;
          headlightLeft.position.set(2.2, .8, .75);
          semiTruck.add(headlightLeft);
          let headlightRight = new T.Mesh(headlightsGeo, headlightsMat);
          headlightRight.rotation.z = Math.PI/2;
          headlightRight.position.set(2.2, .8, -.75);
          semiTruck.add(headlightRight);
          let brakelightsGeo = new T.CylinderGeometry(0.125, 0.125, 0.3, 48);
          let brakelightsMat = new T.MeshStandardMaterial({color: "Red"});
          let brakelightLeft = new T.Mesh(brakelightsGeo, brakelightsMat);
          brakelightLeft.rotation.z = Math.PI/2;
          brakelightLeft.position.set(-3.4, .35, .825);
          semiTruck.add(brakelightLeft);
          let brakelightRight = new T.Mesh(brakelightsGeo, brakelightsMat);
          brakelightRight.rotation.z = Math.PI/2;
          brakelightRight.position.set(-3.4, .35, -.825);
          semiTruck.add(brakelightRight);
      
          //Build the semi truck trailer
          let trailerGeometry = new T.BoxGeometry(4, 1.95, 2);
          let trailerMaterial = new T.MeshStandardMaterial({color: "darkgray", metalness: 0.5});
          let trailer = new T.Mesh(trailerGeometry, trailerMaterial);
          trailer.position.set(-1.5, 1.15, 0);
          semiTruck.add(trailer);
      
          //Create some negative space for the trailer to look like its open
          let trailerNegGeometry = new T.BoxGeometry(4, 1.5, 1.85);
          let trailerNegMaterial = new T.MeshStandardMaterial({color: "black"});
          let trailerNeg = new T.Mesh(trailerNegGeometry, trailerNegMaterial);
          trailerNeg.position.set(-1.52, 1.25, 0);
          semiTruck.add(trailerNeg);
      
          //Create a "connector" to connect the drivers cab with the trailer
          let connectorGeometry = new T.BoxGeometry(1, .6, 1.5);
          let connectorMaterial = new T.MeshStandardMaterial({color: "darkgray", metalness: 0.9, roughness: 0.1});
          let connector = new T.Mesh(connectorGeometry, connectorMaterial);
          connector.position.set(1, .5, 0);
          semiTruck.add(connector);
      
          //Ill add 6 wheels total so Ill define the geometry and the materials here ahead of time
          let tireGeo = new T.CylinderGeometry(0.3, 0.3, 0.3, 48);
          let tireMat = new T.MeshStandardMaterial({color: "black", roughness: .5});
          //Ill also add steel hubcaps that will be embedded into the tires to look like actual wheels
          let hubGeo = new T.CylinderGeometry(0.15, 0.15, 0.35, 48);
          let hubMat = new T.MeshStandardMaterial({color: "silver", roughness: .5});
          
          //Add on the trucks front wheels and hubs to the cab
          let frontWheel1 = new T.Mesh(tireGeo, tireMat);
          frontWheel1.rotation.z = Math.PI/2;
          frontWheel1.rotation.y = Math.PI/2;
          frontWheel1.position.set(1.45, 0.3, 1);
          semiTruck.add(frontWheel1);
          let fronthub1 = new T.Mesh(hubGeo, hubMat);
          fronthub1.rotation.z = Math.PI/2;
          fronthub1.rotation.y = Math.PI/2;
          fronthub1.position.set(1.45, 0.3, 1);
          semiTruck.add(fronthub1);
          let frontWheel2 = new T.Mesh(tireGeo, tireMat);
          frontWheel2.rotation.z = Math.PI/2;
          frontWheel2.rotation.y = Math.PI/2;
          frontWheel2.position.set(1.45, 0.3, -1);
          semiTruck.add(frontWheel2);
          let fronthub2 = new T.Mesh(hubGeo, hubMat);
          fronthub2.rotation.z = Math.PI/2;
          fronthub2.rotation.y = Math.PI/2;
          fronthub2.position.set(1.45, 0.3, -1);
          semiTruck.add(fronthub2);
      
          //Add wheels and hubs to the trailer (it gets 4)
          let rearWheel1 = new T.Mesh(tireGeo, tireMat);
          rearWheel1.rotation.z = Math.PI/2;
          rearWheel1.rotation.y = Math.PI/2;
          rearWheel1.position.set(-1.45, 0.3, 1);
          semiTruck.add(rearWheel1);
          let rearhub1 = new T.Mesh(hubGeo, hubMat);
          rearhub1.rotation.z = Math.PI/2;
          rearhub1.rotation.y = Math.PI/2;
          rearhub1.position.set(-1.45, 0.3, 1);
          semiTruck.add(rearhub1);
          let rearWheel2 = new T.Mesh(tireGeo, tireMat);
          rearWheel2.rotation.z = Math.PI/2;
          rearWheel2.rotation.y = Math.PI/2;
          rearWheel2.position.set(-1.45, 0.3, -1);
          semiTruck.add(rearWheel2);
          let rearhub2 = new T.Mesh(hubGeo, hubMat);
          rearhub2.rotation.z = Math.PI/2;
          rearhub2.rotation.y = Math.PI/2;
          rearhub2.position.set(-1.45, 0.3, -1);
          semiTruck.add(rearhub2);
          let rearWheel3 = new T.Mesh(tireGeo, tireMat);
          rearWheel3.rotation.z = Math.PI/2;
          rearWheel3.rotation.y = Math.PI/2;
          rearWheel3.position.set(-2.45, 0.3, 1);
          semiTruck.add(rearWheel3);
          let rearhub3 = new T.Mesh(hubGeo, hubMat);
          rearhub3.rotation.z = Math.PI/2;
          rearhub3.rotation.y = Math.PI/2;
          rearhub3.position.set(-2.45, 0.3, 1);
          semiTruck.add(rearhub3);
          let rearWheel4 = new T.Mesh(tireGeo, tireMat);
          rearWheel4.rotation.z = Math.PI/2;
          rearWheel4.rotation.y = Math.PI/2;
          rearWheel4.position.set(-2.45, 0.3, -1);
          semiTruck.add(rearWheel4);
          let rearhub4 = new T.Mesh(hubGeo, hubMat);
          rearhub4.rotation.z = Math.PI/2;
          rearhub4.rotation.y = Math.PI/2;
          rearhub4.position.set(-2.45, 0.3, -1);
          semiTruck.add(rearhub4);
          
          const viewpoint = new T.Group();

          //Needed some help from Deepseek to get my
          //Driveable stuff to work. Because the truck rotates a point
          //it wanted to look at the central point but it needs to look forward
          //To get around this, I made a position in te drivers cab and set it to look
          //in the direction of the trucks travel. I will make this point rideable to
          //make it so we can look out the front of the truck as it drives
          viewpoint.position.set(0, 0.5, -0.5); 
          //Adjust its rotation to make it face forward
          viewpoint.rotation.y = Math.PI/2; 
          cab.add(viewpoint);

          super(`SemiTruck-${params.name || ''}`, semiTruck);
        
          //Set the viewpoint as being rideable to make it look like
          //were driving the truck
          this.rideable = viewpoint;

          //Set basic params for the trucks movement
          this.whole_ob = semiTruck;
          this.speed = params.speed || 0.01; 
          this.angle = 0; 
          this.radius = params.radius || 19; 
          this.centerX = params.centerX || 0; 
          this.centerZ = params.centerZ || 0; 

          //IMPORTANT, set the starting angle so the truck is always
          //driving forward as it drives. Keep track of x and z!
          const initialX = (params.x ? Number(params.x) : 0);
          const initialZ = (params.z ? Number(params.z) : 0);
          this.angle = Math.atan2(initialZ - this.centerZ, initialX - this.centerX);
        
          //Final step, define the scaling and place the truck
          let scale = (params.size ? Number(params.size) : 1);
          semiTruck.scale.set(scale, scale, scale);
          this.whole_ob.position.x = (params.x ? Number(params.x) : 0);
          this.whole_ob.position.y = (params.y ? Number(params.y) : 0);
          this.whole_ob.position.z = (params.z ? Number(params.z) : 0);
          
        }

        //Step world to animate the truck
        stepWorld(delta) {
            //Set the new angle and new x and z pos
            this.angle = (this.angle + this.speed * delta);
            const x = this.centerX + Math.cos(this.angle) * this.radius;
            const z = this.centerZ + Math.sin(this.angle) * this.radius;
            this.whole_ob.position.set(x, this.whole_ob.position.y, z);
            
            //Adjust for its direction of travel
            //and rotate the truck along this path as it moves
            const tangentOfX = -Math.sin(this.angle);
            const tangentOfY = Math.cos(this.angle);
            this.whole_ob.rotation.y = (Math.atan2(tangentOfX, tangentOfY) - Math.PI/2);
        }
      }

      //A basic helicopter
      //I made this for Workbook 7. 
      //This one already flew around in circles but with Deepseek's
      //help, I made its behavior more advanced as it now moves up and down
      //and rolls with the movement of the helicopter
      export class Helicopter extends GrObject {
        constructor(params = {}) {
            // Create the helicopter group
            let helicopter = new T.Group();
            
            //This stuff is the same as the Workbook 7 stuff
            let bodyGeometry = new T.BoxGeometry(0.75, 0.75, 1.25);
            let bodyMaterial = new T.MeshStandardMaterial({ color: "Silver" });
            let body = new T.Mesh(bodyGeometry, bodyMaterial);
            helicopter.add(body);
            let subbodyGeometry = new T.BoxGeometry(.5, 0.5, 0.75);
            let subbody = new T.Mesh(subbodyGeometry, 
                new T.MeshStandardMaterial({ color: "Gray" }));
            subbody.position.z = -0.75;
            subbody.position.y = 0.1;
            helicopter.add(subbody);
            let windshieldGeometry = new T.BoxGeometry(0.8, 0.4, 0.75);
            let windshield = new T.Mesh(windshieldGeometry, 
                new T.MeshStandardMaterial({ color: 0x87CEEB }));
            windshield.position.z = .3;
            windshield.position.y = 0.05;
            helicopter.add(windshield);
            let tailGeometry = new T.CylinderGeometry(0.125, 0.125, 1.5);
            let tail = new T.Mesh(tailGeometry, bodyMaterial);
            tail.position.z = -1.5;
            tail.position.y = 0.1;
            tail.rotateX(Math.PI / 2);
            helicopter.add(tail);
            //Create rotors
            let mainRotor = new T.Group();
            mainRotor.name = "mainRotor";
            let bladeGeometry = new T.BoxGeometry(3, 0.05, 0.3);
            let blade1 = new T.Mesh(bladeGeometry, 
                new T.MeshStandardMaterial({ color: 0x333333 }));
            let blade2 = blade1.clone();
            blade2.rotation.y = Math.PI / 2;
            mainRotor.add(blade1);
            mainRotor.add(blade2);
            mainRotor.position.y = 0.5;
            helicopter.add(mainRotor);
            let subrotor = new T.Group();
            subrotor.name = "subrotor";
            let subbladeGeometry = new T.BoxGeometry(.60, 0.01, 0.10);
            let subblade1 = new T.Mesh(subbladeGeometry, 
                new T.MeshStandardMaterial({ color: 0x333333 }));
            let subblade2 = subblade1.clone();
            subblade2.rotation.y = Math.PI / 2;
            subrotor.add(subblade1);
            subrotor.add(subblade2);
            subrotor.position.set(0.15, 0.15, -2);
            subrotor.rotateZ(Math.PI / 2);
            helicopter.add(subrotor);
    
            // Use the input params to place the helicopter in the sky
            helicopter.position.y = params.y || 4;
            let scale = params.size || 1;
            helicopter.scale.set(scale, scale, scale);
    
            //Just like I did for the semitruck, I create a viewpoint
            //for the rideability aspect to get around the issue of
            //it facing inwards at the direction of travel
            const viewpoint = new T.Group();
            viewpoint.position.set(0, 0.2, 0.3); 
            body.add(viewpoint); 

            super(`Helicopter-${params.name || ''}`, helicopter);
            
            //Set the viewpoint as rideable so we can see out the helicopter's windshield
            this.rideable = viewpoint;
    
            //Set params for the helicopters movement
            this.whole_ob = helicopter;
            this.speed = params.speed || 0.001;
            this.radius = params.radius || 4;
            this.centerX = params.centerX || 0;
            this.centerZ = params.centerZ || 0;
            this.clockwise = params.clockwise !== false; 
            
            //Had some help from Deepseek to implement the up and down and the rolling
            //Sets how far it moves up and down
            this.verticalAmplitude = params.verticalAmplitude || 0.5; 
            //How fast does it go up and down
            this.verticalSpeed = params.verticalSpeed || 2; 
            //Set the original height so we can use it like an "origin to return to"
            this.baseY = params.y || 4; 
            this.verticalOffset = 0; 

            //Find updated angles to use for our positioning
            //If the given parama are undefined, we set defaults
            if (params.x !== undefined && params.z !== undefined) {
                this.angle = Math.atan2(
                    params.z - this.centerZ, 
                    params.x - this.centerX
                );
            } 
            else {
                this.angle = 0;
            }
            
            //Set the positioning and the rotation of the helicopers positioning
            if (params.x !== undefined) this.whole_ob.position.x = params.x;
            if (params.z !== undefined) this.whole_ob.position.z = params.z;
            if (params.yrot !== undefined) this.whole_ob.rotation.y = params.yrot;
        }
    
        //StepWorld to make the helicopter fly
        stepWorld(delta, timeOfDay) {
            //Updates the helicopters flight path in its circle
            this.angle = (this.angle + this.speed * delta * (this.clockwise ? 1 : -1));
            const x = (this.centerX + Math.cos(this.angle) * this.radius);
            const z = (this.centerZ + Math.sin(this.angle) * this.radius);
            //Set the vertical offset from the current positioning
            this.verticalOffset = (Math.sin(timeOfDay * this.verticalSpeed * 0.001) * this.verticalAmplitude);
            
            //Set the positioning for the helicopter including the up and down motion
            this.whole_ob.position.set(x, this.baseY + this.verticalOffset, z);
            
            //Tilts the helicopter up and down as it move up and down like a real helicopter
            const verticalVelocity = (Math.cos(timeOfDay * this.verticalSpeed * 0.001) * this.verticalSpeed);
            this.whole_ob.rotation.x = (verticalVelocity * 0.1);
            
            //Adjust the direction of the helicopter to be accurate with its flight path
            //the helicopter banks from side to side as it turns like a real helicopter
            const tangentOfX = -Math.sin(this.angle) * (this.clockwise ? 1 : -1);
            const tangentOfY = Math.cos(this.angle) * (this.clockwise ? 1 : -1);
            this.whole_ob.rotation.y = Math.atan2(tangentOfX, tangentOfY);
            const amountOfTilt = 0.1;
            this.whole_ob.rotation.z = (-tangentOfX * amountOfTilt);
            
            //Sets the movement of the rotors of the helicopter (this is basicall the same as what I had in Workbook 07)
            const mainRotor = this.whole_ob.getObjectByName("mainRotor");
            const subrotor = this.whole_ob.getObjectByName("subrotor");
            if(mainRotor){
                mainRotor.rotation.y = (mainRotor.rotation.y + 0.5 * delta * 60); 
            }
            if(subrotor){
                subrotor.rotation.x = (subrotor.rotation.x +  1.0 * delta * 60); 
            }
        }
    }

    //Factory obj source - Made by: zorrbox3d on cgtrader.com
    //https://www.cgtrader.com/free-3d-models/exterior/industrial-exterior/station-and-factory-game-assets
    import { OBJLoader } from "../libs/CS559-Three/examples/jsm/loaders/OBJLoader.js";

    //This is very similar to how I loaded some astronaut objects in Workbook 9
    export class Factory extends GrObject {
        constructor(params = {}) {
            //Create a group for the texure
            let factoryGroup = new T.Group();
            
            //Set params for the factories placement
            //Same shtuff and before
            params.name = params.name || "factory";
            params.x = params.x || 0;
            params.y = params.y || 0;
            params.z = params.z || 0;
            params.size = params.size || 1;
            params.color = params.color || 0xaaaaaa;
            params.yrot = params.yrot || 0; 
            
    
            super(`Factory-${params.name}`, factoryGroup);
            
            //Set this group and rotate
            this.whole_ob = factoryGroup;
            this.currentRotation = params.yrot; 
            
            //Load the obj
            new OBJLoader().load(
                params.path || "./models/factory.obj",
                (factoryObj) => {
                    //Use our params to place it correctly
                    factoryObj.position.set(params.x, params.y, params.z);
                    factoryObj.scale.set(params.size, params.size, params.size);
                    factoryObj.rotation.y = params.yrot; 
                    
                    //Use the material to color the factory
                    factoryObj.traverse(obj => {
                        if (obj instanceof T.Mesh) {
                            obj.material = new T.MeshStandardMaterial({
                                color: params.color,
                                metalness: 0.1,
                                roughness: 0.5
                            });
                        }
                    });
                    //Add in the newly loaded model
                    factoryGroup.add(factoryObj);
                    this.loadedObj = factoryObj;
                },
                undefined, 
                //Deepseek reccomended this error load in case this OBJ I downloaded didnt work
                //I thought it was a good idea. It basically just loads in an obviously wrong
                //box instead if something goes wrong
                (error) => {
                    console.error("Error loading factory:", error);
                    const cube = new T.Mesh(
                        new T.BoxGeometry(2, 2, 2),
                        new T.MeshStandardMaterial({ 
                            color: 0xff0000,
                            wireframe: true 
                        })
                    );
                    cube.rotation.y = params.yrot; 
                    factoryGroup.add(cube);
                }
            );
        }
    }

    //This is a pumpjack to extract Mako energy from the Earths core
    //This part has articulated motion
    //I had a lot of trouble getting this stuff to work seemlessly
    //so I used Deepseek to help me create the structure and have everything move correctly
    export class Pumpjack extends GrObject {
        constructor(params = {}) {
            //Set parent class
            const pumpjack = new T.Group();
            super(`Pumpjack-${params.name || ''}`, pumpjack);
            this.whole_ob = pumpjack;
    
            //Set default (shouldnt need there as I pass in all the params)
            params = {
                name: "pumpjack",
                x: 0,
                y: 0,
                z: 0,
                size: 1,
                speed: 1.0,
                color: 0x333333,
                yrot: 0,
                ...params
            };
    
            //Set the material for the frame
            const frameMaterial = new T.MeshStandardMaterial({
                color: params.color,
                metalness: 0.7,
                roughness: 0.5
            });
            //Set the material for the pump
            const pumpMaterial = new T.MeshStandardMaterial({
                color: "black",
                metalness: 0.3,
                roughness: 0.7
            });
    
            //Create the main shape for the pump
            //base
            const base = new T.Mesh(
                new T.BoxGeometry(3, 0.5, 1.5),
                frameMaterial
            );
            base.position.y = 0.25;
            pumpjack.add(base);
    
            //Tower
            const verticalTower = new T.Mesh(
                new T.BoxGeometry(0.3, 3, 0.3),
                frameMaterial
            );
            verticalTower.position.set(0, 1.5, 0);
            pumpjack.add(verticalTower);
    
            //Pump Beam
            const pumpBeam = new T.Group();
            const beam = new T.Mesh(
                new T.BoxGeometry(2.8, 0.2, 0.3),
                frameMaterial
            );
            pumpBeam.add(beam);
            
            //weight on the opposite end of the pump
            const weight = new T.Mesh(
                new T.BoxGeometry(0.8, 0.8, 1),
                frameMaterial
            );
            weight.position.set(-1.2, 0, 0);
            pumpBeam.add(weight);
            
            //Add connecting pump head on the opposite side
            this.connector = new T.Mesh(
                new T.SphereGeometry(0.3, 16, 16),
                frameMaterial
            );
            this.connector.position.set(1.5, 0, 0); 
            pumpBeam.add(this.connector);
            //Position the conector on the end of the beam and have it move with the beam
            //as it goes up and down. Had some trouble getting it to move with everything else
            // (we add it to the pumpjack beam once were done)
            pumpBeam.position.set(0, 3, 0);
            pumpBeam.rotation.z = Math.PI/16;
            pumpjack.add(pumpBeam);
            this.pumpBeam = pumpBeam;
    
            //A group for the pump itself
            const pumpGroup = new T.Group();
            
            //The well that is on the group
            const well = new T.Mesh(
                new T.CylinderGeometry(0.3, 0.3, 1, 16),
                pumpMaterial
            );
            well.position.set(1.5, .5, 0);
            pumpGroup.add(well);
            //pumpRod
            const pumpRod = new T.Mesh(
                new T.CylinderGeometry(0.1, 0.1, 2, 16),
                frameMaterial
            );
            pumpRod.position.set(1.5, 1, 0);
            pumpGroup.add(pumpRod);

            //Add the pump group to the pumpjack big group
            pumpjack.add(pumpGroup);
            this.pumpGroup = pumpGroup;
    
            //Start the animation 
            //set params
            this.pumpjackSpeed = params.speed * 0.001;
            this.animationProgress = 0;
            
            //Use the input params to place the pumpjack correctly
            pumpjack.position.set(params.x, params.y, params.z);
            pumpjack.scale.set(params.size, params.size, params.size);
            pumpjack.rotation.y = params.yrot;
        }
    
        stepWorld(delta) {
            //Set the speed of which the animation progresses
            //We use the time delta to progress it
            this.animationProgress = (this.animationProgress + delta * this.pumpjackSpeed);
            
            //Move the pump beam with sin to make it rock back and forth smoothly
            const beamAngle = Math.sin(this.animationProgress * 0.5) * (Math.PI/6);
            this.pumpBeam.rotation.z = beamAngle;
            
            //The pumep's height is updated as the beam move up and down to make 
            //it look like its pumping with the beam
            //This create articulated motion
            const pumpHeight = (1.77 + Math.sin(this.animationProgress * 0.5) * 0.8);
            //set and position the children of the pump group for accurate motion
            this.pumpGroup.children[1].scale.y = pumpHeight;
            this.pumpGroup.children[1].position.y = (pumpHeight * 0.5);
        }
    }

    //This class is exactly the same as the moving semitruck constructor
    //It just makes somes non moving ones to I can make it look like its parked
    export class SemiTruckNonMoving extends GrObject {
        constructor(params = {}) {
          //Create a group for the semitruck and all its parts
          let semiTruck = new T.Group();
      
          //Build the cab of the truck
          let cabGeometry = new T.BoxGeometry(1.5, 2, 2);
          let cabMaterial = new T.MeshStandardMaterial({color: params.color, metalness: 0.5});
          let cab = new T.Mesh(cabGeometry, cabMaterial);
          cab.position.set(1.5, 1.15, 0);
          semiTruck.add(cab);
      
          //Adds on the windshield and the side windows
          let windowMaterial = new T.MeshStandardMaterial({color: "lightblue"});
          let sideWindowsGeo = new T.BoxGeometry(.5, .8, 1.75);
          let sideWindows = new T.Mesh(sideWindowsGeo, windowMaterial);
          sideWindows.position.set(2.05, 1.5, 0);
          semiTruck.add(sideWindows);
          let windshieldGeometry = new T.BoxGeometry(1.2, 0.7, 2.1);
          let windshield = new T.Mesh(windshieldGeometry, windowMaterial);
          windshield.position.set(1.5, 1.4, 0);
          semiTruck.add(windshield);
      
          //Creates the front grill
          let grillMaterial = new T.MeshStandardMaterial({color: "black"});
          let grillGeo = new T.BoxGeometry(.5, .6, 1.4);
          let grill = new T.Mesh(grillGeo, grillMaterial);
          grill.position.set(2.05, .55, 0);
          semiTruck.add(grill);
      
          //Defines headlight and brakelight materials and geometry
          //Embed them into the body of the truck
          let headlightsGeo = new T.CylinderGeometry(0.125, 0.125, 0.3, 48);
          let headlightsMat = new T.MeshStandardMaterial({color: "Yellow"});
          let headlightLeft = new T.Mesh(headlightsGeo, headlightsMat);
          headlightLeft.rotation.z = Math.PI/2;
          headlightLeft.position.set(2.2, .8, .75);
          semiTruck.add(headlightLeft);
          let headlightRight = new T.Mesh(headlightsGeo, headlightsMat);
          headlightRight.rotation.z = Math.PI/2;
          headlightRight.position.set(2.2, .8, -.75);
          semiTruck.add(headlightRight);
          let brakelightsGeo = new T.CylinderGeometry(0.125, 0.125, 0.3, 48);
          let brakelightsMat = new T.MeshStandardMaterial({color: "Red"});
          let brakelightLeft = new T.Mesh(brakelightsGeo, brakelightsMat);
          brakelightLeft.rotation.z = Math.PI/2;
          brakelightLeft.position.set(-3.4, .35, .825);
          semiTruck.add(brakelightLeft);
          let brakelightRight = new T.Mesh(brakelightsGeo, brakelightsMat);
          brakelightRight.rotation.z = Math.PI/2;
          brakelightRight.position.set(-3.4, .35, -.825);
          semiTruck.add(brakelightRight);
      
          //Build the semi truck trailer
          let trailerGeometry = new T.BoxGeometry(4, 1.95, 2);
          let trailerMaterial = new T.MeshStandardMaterial({color: "darkgray", metalness: 0.5});
          let trailer = new T.Mesh(trailerGeometry, trailerMaterial);
          trailer.position.set(-1.5, 1.15, 0);
          semiTruck.add(trailer);
      
          //Create some negative space for the trailer to look like its open
          let trailerNegGeometry = new T.BoxGeometry(4, 1.5, 1.85);
          let trailerNegMaterial = new T.MeshStandardMaterial({color: "black"});
          let trailerNeg = new T.Mesh(trailerNegGeometry, trailerNegMaterial);
          trailerNeg.position.set(-1.52, 1.25, 0);
          semiTruck.add(trailerNeg);
      
          //Create a "connector" to connect the drivers cab with the trailer
          let connectorGeometry = new T.BoxGeometry(1, .6, 1.5);
          let connectorMaterial = new T.MeshStandardMaterial({color: "darkgray", metalness: 0.9, roughness: 0.1});
          let connector = new T.Mesh(connectorGeometry, connectorMaterial);
          connector.position.set(1, .5, 0);
          semiTruck.add(connector);
      
          //Ill add 6 wheels total so Ill define the geometry and the materials here ahead of time
          let tireGeo = new T.CylinderGeometry(0.3, 0.3, 0.3, 48);
          let tireMat = new T.MeshStandardMaterial({color: "black", roughness: .5});
          //Ill also add steel hubcaps that will be embedded into the tires to look like actual wheels
          let hubGeo = new T.CylinderGeometry(0.15, 0.15, 0.35, 48);
          let hubMat = new T.MeshStandardMaterial({color: "silver", roughness: .5});
          
          //Add on the trucks front wheels and hubs to the cab
          let frontWheel1 = new T.Mesh(tireGeo, tireMat);
          frontWheel1.rotation.z = Math.PI/2;
          frontWheel1.rotation.y = Math.PI/2;
          frontWheel1.position.set(1.45, 0.3, 1);
          semiTruck.add(frontWheel1);
          let fronthub1 = new T.Mesh(hubGeo, hubMat);
          fronthub1.rotation.z = Math.PI/2;
          fronthub1.rotation.y = Math.PI/2;
          fronthub1.position.set(1.45, 0.3, 1);
          semiTruck.add(fronthub1);
          let frontWheel2 = new T.Mesh(tireGeo, tireMat);
          frontWheel2.rotation.z = Math.PI/2;
          frontWheel2.rotation.y = Math.PI/2;
          frontWheel2.position.set(1.45, 0.3, -1);
          semiTruck.add(frontWheel2);
          let fronthub2 = new T.Mesh(hubGeo, hubMat);
          fronthub2.rotation.z = Math.PI/2;
          fronthub2.rotation.y = Math.PI/2;
          fronthub2.position.set(1.45, 0.3, -1);
          semiTruck.add(fronthub2);
      
          //Add wheels and hubs to the trailer (it gets 4)
          let rearWheel1 = new T.Mesh(tireGeo, tireMat);
          rearWheel1.rotation.z = Math.PI/2;
          rearWheel1.rotation.y = Math.PI/2;
          rearWheel1.position.set(-1.45, 0.3, 1);
          semiTruck.add(rearWheel1);
          let rearhub1 = new T.Mesh(hubGeo, hubMat);
          rearhub1.rotation.z = Math.PI/2;
          rearhub1.rotation.y = Math.PI/2;
          rearhub1.position.set(-1.45, 0.3, 1);
          semiTruck.add(rearhub1);
          let rearWheel2 = new T.Mesh(tireGeo, tireMat);
          rearWheel2.rotation.z = Math.PI/2;
          rearWheel2.rotation.y = Math.PI/2;
          rearWheel2.position.set(-1.45, 0.3, -1);
          semiTruck.add(rearWheel2);
          let rearhub2 = new T.Mesh(hubGeo, hubMat);
          rearhub2.rotation.z = Math.PI/2;
          rearhub2.rotation.y = Math.PI/2;
          rearhub2.position.set(-1.45, 0.3, -1);
          semiTruck.add(rearhub2);
          let rearWheel3 = new T.Mesh(tireGeo, tireMat);
          rearWheel3.rotation.z = Math.PI/2;
          rearWheel3.rotation.y = Math.PI/2;
          rearWheel3.position.set(-2.45, 0.3, 1);
          semiTruck.add(rearWheel3);
          let rearhub3 = new T.Mesh(hubGeo, hubMat);
          rearhub3.rotation.z = Math.PI/2;
          rearhub3.rotation.y = Math.PI/2;
          rearhub3.position.set(-2.45, 0.3, 1);
          semiTruck.add(rearhub3);
          let rearWheel4 = new T.Mesh(tireGeo, tireMat);
          rearWheel4.rotation.z = Math.PI/2;
          rearWheel4.rotation.y = Math.PI/2;
          rearWheel4.position.set(-2.45, 0.3, -1);
          semiTruck.add(rearWheel4);
          let rearhub4 = new T.Mesh(hubGeo, hubMat);
          rearhub4.rotation.z = Math.PI/2;
          rearhub4.rotation.y = Math.PI/2;
          rearhub4.position.set(-2.45, 0.3, -1);
          semiTruck.add(rearhub4);
          
          
          super(`SemiTruckNonMoving-${params.name || ''}`, semiTruck);
        
          this.whole_ob = semiTruck;
        
          params = {
            x: 0,
            y: 0,
            z: 0,
            size: 1,
            yrot: 0,  
            ...params
          };
        
          //Set transformations
          semiTruck.position.set(params.x, params.y, params.z);
          semiTruck.scale.set(params.size, params.size, params.size);
          //Set rotation
          semiTruck.rotation.y = params.yrot; 
        }
      }

      let cementMixerObCtr = 0;


    //I made this Cement mixer for Workbook 7
    //That version had a slider that allowed me to move the barrel
    //With Deepseek's help, I had it strip all the user movement out and
    //instead just have he cement drum rotate slowly as an animation.
    export class GrCementMixer extends GrObject {
    constructor(params = {}) {
        //Makes the cement mixer
        //This is basically the same as before
        let cementMixer = new T.Group();
        let chassisGeometry = new T.BoxGeometry(3.2, 0.4, 1);
        let chassisMaterial = new T.MeshStandardMaterial({color: params.color, metalness: 0.9});
        let chassis = new T.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.set(0.25, 0.3, 0);
        cementMixer.add(chassis);
        let wheelGeometry = new T.CylinderGeometry(.275, .275, 1.35);
        let wheelMaterial = new T.MeshStandardMaterial({ color: "black" });
        let frontWheels = new T.Mesh(wheelGeometry, wheelMaterial);
        frontWheels.rotation.x = Math.PI/2;
        frontWheels.position.set(0.8, 0.2, 0);
        cementMixer.add(frontWheels);
        let rearWheels = new T.Mesh(wheelGeometry, wheelMaterial);
        rearWheels.rotation.x = Math.PI/2;
        rearWheels.position.set(-0.8, 0.2, 0);
        cementMixer.add(rearWheels);
        let cabinGeometry = new T.BoxGeometry(1, 1, 1);
        let driversCabin = new T.Mesh(cabinGeometry, chassisMaterial);
        driversCabin.position.set(1.1, 0.75, 0);
        cementMixer.add(driversCabin);
        let windshieldGeometry = new T.BoxGeometry(0.75, 0.70, 0.85);
        let windshieldMaterial = new T.MeshStandardMaterial({color: "Silver"});
        let windshield = new T.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(1.25, 0.80, 0);
        cementMixer.add(windshield);
        let mixerGroup = new T.Group();
        mixerGroup.position.set(-0.5, 0.8, 0);
        cementMixer.add(mixerGroup);
        let drumGeometry = new T.CylinderGeometry(0.45, 0.8, 1.8, 6);
        let drumMaterial = new T.MeshStandardMaterial({color: "Indigo", metalness: 0.5, roughness: 0.1});
        let drumAccents = new T.Mesh(drumGeometry, drumMaterial);
        drumAccents.rotation.z = Math.PI / 2; 
        mixerGroup.add(drumAccents);
        let drumMain = new T.CylinderGeometry(0.45, 0.8, 2.2, 6);
        let drumDetailMaterial = new T.MeshStandardMaterial({color: "Silver", metalness: 0.3, roughness: 0.1, side: T.DoubleSide});
        let drumDetail = new T.Mesh(drumMain, drumDetailMaterial);
        drumDetail.rotation.z = Math.PI / 2;
        mixerGroup.add(drumDetail);

        super(`CementMixer-${cementMixerObCtr++}`, cementMixer);
        this.whole_ob = cementMixer;
        this.mixerGroup = mixerGroup;
        
        //Use our params to place the cemement mixer in the world
        let scale = params.size || 1;
        cementMixer.scale.set(scale, scale, scale);
        cementMixer.position.set(params.x || 0, params.y || 0, params.z || 0);
        
        //Use the param for speed to rotate the drum accordingly
        this.rotationSpeed = params.rotationSpeed || 0.01;
    }

    stepWorld(delta) {
        //Update the drums rotation on X to make it look like its turning
        this.mixerGroup.rotation.x = (this.mixerGroup.rotation.x + (this.rotationSpeed * delta) / 16);
    }
    }

    //Creates the large spotlights on the outside wall of the city
    export class DoubleDomeLight extends GrObject {
        constructor(params = {}) {
            let group = new T.Group();

            const light1Geometry = new T.CylinderGeometry(3, 2.5, 2);
            const light1Material = new T.MeshStandardMaterial({
                color: '#717680',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide,
            });
            const light1mesh = new T.Mesh(light1Geometry, light1Material);
            light1mesh.position.x = (-16);
            light1mesh.position.y = (5);
            light1mesh.position.z = (54);
            //domeMesh.rotateX(-Math.PI/2);
            light1mesh.rotateY(-Math.PI/10);
            light1mesh.rotateX(Math.PI/2);
            group.add(light1mesh);

            const light2Geometry = new T.CylinderGeometry(3, 2.5, 2);
            const light2Material = new T.MeshStandardMaterial({
                color: '#717680',
                metalness: 0.7,
                roughness: 0.3,
                side: T.DoubleSide,
            });
            const light2mesh = new T.Mesh(light2Geometry, light2Material);
            light2mesh.position.x = (-10);
            light2mesh.position.y = (5);
            light2mesh.position.z = (55.5);
            //domeMesh.rotateX(-Math.PI/2);
            light2mesh.rotateY(-Math.PI/10);
            light2mesh.rotateX(Math.PI/2);
            group.add(light2mesh);

            const shine1Geometry = new T.CylinderGeometry(2.25, 1.5, 1.5);
            const shine1Material = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const shine1mesh = new T.Mesh(shine1Geometry, shine1Material);
            shine1mesh.position.x = (-16);
            shine1mesh.position.y = (5);
            shine1mesh.position.z = (54.5);
            //domeMesh.rotateX(-Math.PI/2);
            shine1mesh.rotateY(-Math.PI/10);
            shine1mesh.rotateX(Math.PI/2);
            group.add(shine1mesh);

            const shine2Geometry = new T.CylinderGeometry(2.25, 1.5, 1.5);
            const shine2Material = new T.MeshStandardMaterial({
                color: "White",
                metalness: 0.1,
                roughness: 0.1,
                emissive: 0xffffff, 
                emissiveIntensity: 1.5, 
                transparent: true,
                opacity: 0.9
            });
            const shine2mesh = new T.Mesh(shine2Geometry, shine2Material);
            shine2mesh.position.x = (-10);
            shine2mesh.position.y = (5);
            shine2mesh.position.z = (56);
            //domeMesh.rotateX(-Math.PI/2);
            shine2mesh.rotateY(-Math.PI/10);
            shine2mesh.rotateX(Math.PI/2);
            group.add(shine2mesh);

            super(`DoubleDomeLight`, group);
        }
    }
