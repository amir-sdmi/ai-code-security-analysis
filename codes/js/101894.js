class Cube {
    constructor () {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -1;
    }
    render() {
        // rendering the other faces using 3DUV done using Copilot
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        // var size = this.size;

        // Pass the color of a point to u_FragColor variable 
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);    

        // rewrote the below part to use 3DUV properly using Microsoft Copilot because i was having drawing issues

        // Draw front face
        drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 1, 1, 0, 1, 1]);
        drawTriangle3DUV([0, 0, 0,  0, 1, 0,  1, 1, 0], [0, 1, 0, 0, 1, 0]);

        // Draw top face
        gl.uniform4f(u_FragColor, rgba[0]* 0.9, rgba[1]* 0.9, rgba[2]* 0.9, rgba[3]);
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);


        // Draw left face
        gl.uniform4f(u_FragColor, rgba[0]* 0.8, rgba[1]* 0.8, rgba[2]* 0.8, rgba[3]);
        drawTriangle3DUV([0, 0, 0, 0, 0, 1, 0, 1, 1], [1, 0, 1, 1, 0, 1]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0]);

        // Draw right face
        gl.uniform4f(u_FragColor, rgba[0]* 0.7, rgba[1]* 0.7, rgba[2]* 0.7, rgba[3]);
        drawTriangle3DUV([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

        // Draw bottom face
        gl.uniform4f(u_FragColor, rgba[0]* 0.6, rgba[1]* 0.6, rgba[2]* 0.6, rgba[3]);
        drawTriangle3DUV([0, 0, 0, 0, 0, 1, 1, 0, 1], [1, 1, 1, 0, 0, 0]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0]);

        // Draw back face
        gl.uniform4f(u_FragColor, rgba[0]* 0.5, rgba[1]* 0.5, rgba[2]* 0.5, rgba[3]);
        drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1]);
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0]);

    }

    // used ChatGPT to fix texturing of cubes and drawTriangle3DUV
    renderfast() {
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        var allverts = [];
        var uvCoords = [];
    
        // Front face
        allverts.push(0, 0, 0, 1, 0, 0, 1, 1, 0); // Triangle 1
        uvCoords.push(0, 0, 1, 0, 1, 1);
    
        allverts.push(0, 0, 0, 1, 1, 0, 0, 1, 0); // Triangle 2
        uvCoords.push(0, 0, 1, 1, 0, 1);
    
        // Back face
        allverts.push(1, 0, 1, 0, 0, 1, 0, 1, 1); // Triangle 1
        uvCoords.push(1, 0, 0, 0, 0, 1);
    
        allverts.push(1, 0, 1, 0, 1, 1, 1, 1, 1); // Triangle 2
        uvCoords.push(1, 0, 0, 1, 1, 1);
    
        // Top face
        allverts.push(0, 1, 0, 1, 1, 0, 1, 1, 1); // Triangle 1
        uvCoords.push(0, 1, 1, 1, 1, 0);
    
        allverts.push(0, 1, 0, 1, 1, 1, 0, 1, 1); // Triangle 2
        uvCoords.push(0, 1, 1, 0, 0, 1);
    
        // Bottom face
        allverts.push(0, 0, 0, 1, 0, 0, 1, 0, 1); // Triangle 1
        uvCoords.push(0, 0, 1, 0, 1, 1);
    
        allverts.push(0, 0, 0, 1, 0, 1, 0, 0, 1); // Triangle 2
        uvCoords.push(0, 0, 1, 1, 0, 0);
    
        // Right face
        allverts.push(1, 0, 0, 1, 1, 0, 1, 1, 1); // Triangle 1
        uvCoords.push(0.5, 0, 0.5, 1, 1, 1);
    
        allverts.push(1, 0, 0, 1, 1, 1, 1, 0, 1); // Triangle 2
        uvCoords.push(0.5, 0, 1, 1, 1, 0.5);
    
        // Left face
        allverts.push(0, 0, 0, 0, 1, 0, 0, 1, 1); // Triangle 1
        uvCoords.push(0, 0, 0, 1, 0.5, 1);
    
        allverts.push(0, 0, 0, 0, 1, 1, 0, 0, 1); // Triangle 2
        uvCoords.push(0, 0, 0.5, 1, 1, 0.5);
    
        // Draw the vertices and texture coordinates
        drawTriangle3DUV(allverts, uvCoords);
    }
    
    // renderfast() {
    //     var rgba = this.color;
    //     gl.uniform1i(u_whichTexture, this.textureNum);
    //     gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    //     gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    //     var allverts = [];
    //     var uvCoords = [];

    //     // Front face (counter-clockwise order)

        
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 1, 0, 0,  // bottom-right
    //                                 1, 1, 0]); // top-right
        
    //     uvCoords = uvCoords.concat([0, 0, 1, 0, 1, 1]);

    //     // Front face (continued, second triangle)
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 1, 1, 0,  // top-right
    //                                 0, 1, 0]); // top-left 

    //     uvCoords = uvCoords.concat([0, 0, 1, 1, 0, 1]);

    //     // Back face (counter-clockwise order)
    //     allverts = allverts.concat([1, 0, 1,  // bottom-left
    //                                 0, 0, 1,  // bottom-right
    //                                 0, 1, 1]); // top-right
    //     uvCoords = uvCoords.concat([1, 0, 0, 0, 0, 1]);

    //     // Back face (continued, second triangle)
    //     allverts = allverts.concat([1, 0, 1,  // bottom-left
    //                                 0, 1, 1,  // top-right
    //                                 1, 1, 1]); // top-left 
    //     uvCoords = uvCoords.concat([1, 0, 0, 1, 1, 1]);

    //     // Top face (counter-clockwise order)
    //     allverts = allverts.concat([0, 1, 0,  // bottom-left
    //                                 1, 1, 0,  // bottom-right
    //                                 1, 1, 1]); // top-right
    //     uvCoords = uvCoords.concat([0, 1, 1, 1, 1, 0]);

        
    //                                 // Top face (continued, second triangle)
    //     allverts = allverts.concat([0, 1, 0,  // bottom-left
    //                                 1, 1, 1,  // top-right
    //                                 0, 1, 1]); // top-left 
    //     uvCoords = uvCoords.concat([0, 1, 1, 0, 0, 1]);
    //     // Bottom face (counter-clockwise order)
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 1, 0, 0,  // bottom-right
    //                                 1, 0, 1]); // top-right
    //     uvCoords = uvCoords.concat([0, 0, 1, 0, 1, 1]);

    //     // Bottom face (continued, second triangle)
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 1, 0, 1,  // top-right
    //                                 0, 0, 1]); // top-left 
    //     uvCoords = uvCoords.concat([0, 0, 1, 1, 0, 0]);
    //     // Right face (counter-clockwise order)
    //     allverts = allverts.concat([1, 0, 0,  // bottom-left
    //                                 1, 1, 0,  // bottom-right
    //                                 1, 1, 1]); // top-right

    //     // Right face (continued, second triangle)
    //     allverts = allverts.concat([1, 0, 0,  // bottom-left
    //                                 1, 1, 1,  // top-right
    //                                 1, 0, 1]); // top-left 
        
    //     uvCoords = uvCoords.concat([0.5, 0, 0.5, 1, 1, 1]);
    //     // Left face (counter-clockwise order)
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 0, 1, 0,  // bottom-right
    //                                 0, 1, 1]); // top-right
    //     uvCoords = uvCoords.concat([0, 0, 0, 1, 0.5, 1]);
    //     // Left face (continued, second triangle)
    //     allverts = allverts.concat([0, 0, 0,  // bottom-left
    //                                 0, 1, 1,  // top-right
    //                                 0, 0, 1]); // top-left 

    //     //Assuming you have a function to bind and draw attributes and buffers
    //     //drawTriangle3D(allverts);
    //     drawTriangle3DUV(allverts, uvCoords);
    //     //drawTriangle3DUV(uvCoords + allverts);
    //     //drawTriangle3DUV(uvCoords);
    //     // for (var i = 0; i < allverts.length; i += 9) {
    //     //     drawTriangle3D(allverts.slice(i, i + 9));
    //     //   }
    //     //drawTriangle3D(allverts);
    //   }
      
    drawCube(M, color) {
        // Set the color uniform variable
        gl.uniform4fv(u_FragColor, color);

        // Set the model matrix uniform variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

        // Draw the cube
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);    
        
        // Change lighting using uniform4f

         // Draw front face
        drawTriangle3D([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 1, 1, 0]);

        // Draw top face
        gl.uniform4f(u_FragColor, color[0]* 0.9, color[1]* 0.9, color[2]* 0.9, color[3]);
        drawTriangle3D([0, 1, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([0, 1, 0, 0, 1, 1, 1, 1, 1]);

        // Draw left face
        gl.uniform4f(u_FragColor, color[0]* 0.8, color[1]* 0.8, color[2]* 0.8, color[3]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 0, 1, 1]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 0, 1, 1]);

        // Draw right face
        gl.uniform4f(u_FragColor, color[0]* 0.7, color[1]* 0.7, color[2]* 0.7, color[3]);

        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 0, 0, 1, 0, 1, 1, 1, 1]);

        // Draw bottom face
        gl.uniform4f(u_FragColor, color[0]* 0.6, color[1]* 0.6, color[2]* 0.6, color[3]);

        drawTriangle3D([0, 0, 0, 1, 0, 0, 1, 0, 1]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);

        // Draw back face
        gl.uniform4f(u_FragColor, color[0]* 0.5, color[1]* 0.5, color[2]* 0.5, color[3]);

        drawTriangle3D([0, 0, 1, 1, 1, 1, 1, 0, 1]);
        drawTriangle3D([0, 0, 1, 0, 1, 1, 1, 1, 1]);
    }
}