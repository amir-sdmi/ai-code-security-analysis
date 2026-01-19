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
        // drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0]);
        // drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

        // // Draw top face
        // gl.uniform4f(u_FragColor, rgba[0]* 0.9, rgba[1]* 0.9, rgba[2]* 0.9, rgba[3]);
        // drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        // drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 0]);

        // // Draw left face
        // gl.uniform4f(u_FragColor, rgba[0]* 0.8, rgba[1]* 0.8, rgba[2]* 0.8, rgba[3]);
        // drawTriangle3DUV([0, 0, 0, 0, 0, 1, 0, 1, 1], [0, 0, 1, 0, 1, 1]);
        // drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 1, 0], [0, 0, 1, 1, 0, 1]);

        // // Draw right face
        // gl.uniform4f(u_FragColor, rgba[0]* 0.7, rgba[1]* 0.7, rgba[2]* 0.7, rgba[3]);
        // drawTriangle3DUV([1, 0, 0, 1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1]);
        // drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 0, 1]);

        // // Draw bottom face
        // gl.uniform4f(u_FragColor, rgba[0]* 0.6, rgba[1]* 0.6, rgba[2]* 0.6, rgba[3]);
        // drawTriangle3DUV([0, 0, 0, 0, 0, 1, 1, 0, 1], [0, 0, 0, 1, 1, 1]);
        // drawTriangle3DUV([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 0, 1, 1, 0, 1]);

        // // Draw back face
        // gl.uniform4f(u_FragColor, rgba[0]* 0.5, rgba[1]* 0.5, rgba[2]* 0.5, rgba[3]);
        // drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [0, 0, 0, 1, 1, 1]);
        // drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 0, 1]);

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