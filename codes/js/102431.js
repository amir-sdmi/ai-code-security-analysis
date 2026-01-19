import { useEffect, useState, useRef } from "react";
//Importing components from Fabric.js for canvas manipulation
import { Canvas, PencilBrush, Textbox, Rect, Group, Circle, Triangle, Polygon, FabricImage } from "fabric";
//Connecting to css file for styling
import "./Whiteboard.css";          
//Importing clock and soundcloud components to add to the whiteboard
import Clock from "./Clock.js";
import SoundCloud from "./SoundCloud.js";   

export default function WhiteBoard() {
    //References to the canvas element and the Fabric.js canvas instance
    const canvasRef = useRef(null); 
    const fabricCanvasRef = useRef(null);

    //State variables for what tool (draw, erase, highlight) and shape (square, circle, triangle, hexagon) is currently selected
    const [tool, setTool] = useState(null)
    const [shape, setShape] = useState(null);
    
    //State variables for selected textbox, shape, and group
    const [selectedTextbox, setSelectedTextbox] = useState(null);
    const [selectedShape, setSelectedShape] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);

    //State variables for stroke color and size for drawing and highlighting
    const [strokeColor, setStrokeColor] = useState("#000000");
    const [strokeSize, setStrokeSize] = useState(5);

    //State variables for text or shape formatting options
    const [fontSizeInput, setFontSizeInput] = useState(6);
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    const [textAlignment, setTextAlignment] = useState("left");
    const [borderSizeInput, setBorderSizeInput] = useState(1);
    const [strokeColorInput, setStrokeColorInput] = useState("#000000");
    const [backgroundColorInput, setBackgroundColorInput] = useState("#ffee8c");
    const [borderColorInput, setBorderColorInput] = useState("#000000");

    //State variables for whether the editing menu, shapes menu, clock, or soundcloud is currently open
    const [isShapes, setIsShapes] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
    const [menuPosition2, setMenuPosition2] = useState({x: 0, y: 0});
    const [showSoundCloud, setShowSoundCloud] = useState(false);
    const [showClock, setClock] = useState(false);

    /*Initializes a Fabric.js canvas instance when the canvas element is mounted

    Adds a grid of small, gray dots to the canvas to help user with alignment 
    (Canvas is set to 2x the size of the window for better resolution*/
    useEffect(() => {
        const fabricCanvas = new Canvas(canvasRef.current, {
            isDrawingMode: false,
            backgroundColor: "#fafafa", 
            selection: true,
            subTargetCheck: true,
        });

        fabricCanvasRef.current = fabricCanvas;
        const canvasWidth = window.innerWidth * 2;
        const canvasHeight = window.innerHeight * 2;

        canvasRef.current.width = canvasWidth;
        canvasRef.current.height = canvasHeight;
        fabricCanvas.setDimensions({width: canvasWidth, height: canvasHeight});

        for(let x = 0; x < canvasWidth; x += 30){
            for(let y = 0; y < canvasHeight; y += 30){
            const dot = new Circle({left: x, top: y, radius: 1.5, fill: "#b4b4b4", selectable: false, evented: false, erasable: false});
            fabricCanvas.add(dot);
            }
        }

        fabricCanvas.setZoom(1/2);
    }, []);

    /*Listens for when delete key is pressed and will delete any item selected on the canvas by checking if there is an active object
    
    If there is an active object, it will remove it from the canvas and discard the active object
    If there isn't an active object, it will do nothing*/
    useEffect(() => {
        function deleteObject(event){
            if(event.key === "Delete"){
                const fabricCanvas = fabricCanvasRef.current;
                const activeObject = fabricCanvas.getActiveObject();
                if(activeObject){
                    fabricCanvas.remove(activeObject);
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.requestRenderAll();
                    }
                }
            }

        window.addEventListener("keydown", deleteObject);
        return () => window.removeEventListener("keydown", deleteObject);
    }, []);

    /*Listens for copy and paste events to copy and paste selected objects on the canvas

    When something is pasted, it'll check if the pasted content is an image URL (Doesn't working for encrypted images)
    If pasted content is an image URL, it will create a Fabric.js image object from the URL and add it to the canvas
    The image will be centered on the canvas and scaled down to 50% of its original size
    */
    useEffect(() => {
        const fabricCanvas = fabricCanvasRef.current;
        function handlePaste(event) {
            const pastedText = event.clipboardData.getData("text");
            if(!pastedText){
                return;
            }
            const imageUrlPattern = /(https?:\/\/.*\.(gif|webp|png|jpg|jpeg|svg))/i;
            if(imageUrlPattern.test(pastedText)){
                FabricImage.fromURL(pastedText)
                    .then(img => {
                        console.log("Loaded image:", img);
                        img.set({
                            left: fabricCanvas.width / 2,
                            top: fabricCanvas.height / 2,
                            originX: "center",
                            originY: "center",
                            scaleX: 0.5,
                            scaleY: 0.5,
                        });
                        fabricCanvas.add(img);
                        fabricCanvas.setActiveObject(img);
                        fabricCanvas.requestRenderAll();
                    }
                )
            }
        }
        
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);

    /*Sets up drawing, highlighting, and erasing tools on the canvas based on selected tool

    If the tool is "draw", it will set the brush to a pencil brush with the selected stroke color and size
    If the tool is "highlight", it will be the same as the pencil but the stroke size will be 3 times bigger and the color will be set to a transparent version of the stroke color
    If the tool is "erase", it will disable drawing mode and set up an event listener to erase objects on the canvas when the mouse is moved
    If the tool is not set, it will disable drawing mode*/
    useEffect(() => {
        const fabricCanvas = fabricCanvasRef.current;

        if(tool === "draw"){
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.color = strokeColor;
            fabricCanvas.freeDrawingBrush.width = strokeSize;
            fabricCanvas.freeDrawingBrush.density = 1000;
        } 
        else if(tool === "highlight"){
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
            fabricCanvas.freeDrawingBrush.color = hexToRgba(strokeColor, 0.3);
            fabricCanvas.freeDrawingBrush.width = strokeSize * 3;
            fabricCanvas.freeDrawingBrush.density = 1000;
        } 
        else if(tool === "erase"){
            fabricCanvas.isDrawingMode = false;
            function eraseObject(event){
                const pointer = fabricCanvas.getPointer(event.e);
                const objects = fabricCanvas.getObjects();
                for (let i = 0; i < objects.length; i++) {
                    const obj = objects[i];
                    if (obj.type === "path" || obj.type === "path-group") {
                        if (obj.containsPoint && obj.containsPoint(pointer)) {
                            fabricCanvas.remove(obj);
                        }
                    }
                }
            }
            fabricCanvas.on("mouse:move", eraseObject);
            return () => fabricCanvas.off("mouse:move", eraseObject);
        } 
        else{
            fabricCanvas.isDrawingMode = false;
        }
        fabricCanvas.renderAll();
    }, [tool, strokeColor, strokeSize]);

    /*Adds different shapes to the canvas depending on the selected shape

    If shape isn't null, it will create the corresponding shape on mouse down event
    If the shape is "textbox", it will add a textbox to the canvas and set it as the active object
    If the shape is "square", "circle", "triangle", "hexagon", or "pentagon", it will create the shape and then group it with a textbox in the center*/
    useEffect(() => {
        const fabricCanvas = fabricCanvasRef.current;

        function addShape(event){
            
            const pointer = fabricCanvas.getPointer(event.e);
            let chosenShape = null;
            let textbox = null; 

            if(shape === "textbox"){
                textbox = new Textbox("Tap to edit", {
                    left: pointer.x - 75,
                    top: pointer.y,
                    width: 150,
                    fontSize: 6,
                    fontFamily: "Arial",
                    fill: "#000000",
                    editable: true,
                    breakWords: true,
                });
                fabricCanvas.add(textbox);
                fabricCanvas.setActiveObject(textbox);
                fabricCanvas.renderAll();
                fabricCanvas.off("mouse:down", addShape);
                return;
            }
            else if(shape === "square"){
                chosenShape = new Rect({
                    width: 50,
                    height: 50,
                    fill: "#ffee8c",
                    originX: "center",
                    originY: "center",
                });
            }
            else if(shape === "circle"){
                chosenShape = new Circle({
                    radius: 25,
                    fill: "#ffee8c",
                    originX: "center",
                    originY: "center",
                });
            }
            else if(shape === "triangle"){
                chosenShape = new Triangle({
                    width: 50,
                    height: 50,
                    fill: "#ffee8c",
                    originX: "center",
                    originY: "center",
                });
            }
            else if(shape === "hexagon"){
                chosenShape = new Polygon([{ x: 0, y: -25 }, { x: 21.65, y: -12.5 }, { x: 21.65, y: 12.5 }, { x: 0, y: 25 }, { x: -21.65, y: 12.5 }, { x: -21.65, y: -12.5 }], {
                    fill: "#ffee8c",
                    originX: "center",
                    originY: "center",
                });
            }
            else if(shape === "pentagon") {
                chosenShape = new Polygon([{ x: 0, y: -25 }, { x: 23.78, y: -7.73 }, { x: 14.69, y: 20.23 }, { x: -14.69, y: 20.23 }, { x: -23.78, y: -7.73 }], {
                    fill: "#ffee8c",
                    originX: "center",
                    originY: "center",
                });
            }
            if(!chosenShape){
                return;
            }
            textbox = new Textbox("Double Tap to Edit", {
                width: 40,
                fontSize: 6,
                fill: "#000000",
                backgroundColor: "transparent",
                fontFamily: "Arial",
                editable: true,
                breakWords: true,
                originX: "center",
                originY: "center",
            });
            const group = new Group([chosenShape, textbox], {
                left: pointer.x,
                top: pointer.y,
                originX: "center",
                originY: "center",
            });
            fabricCanvas.add(group);
            fabricCanvas.setActiveObject(group);
            fabricCanvas.renderAll();
            fabricCanvas.off("mouse:down", addShape);
        }
        fabricCanvas.on("mouse:down", addShape);
        return () => fabricCanvas.off("mouse:down", addShape);
    }, [shape]);

    /*Sets up double click event listener to edit textboxes

    When a textbox or a textbox inside a group is double clicked, it will set the selectedTextbox to that textbox 
    It will also enter editing mode for the textbox to be modified 
    */
    useEffect(() => {
        const fabricCanvas = fabricCanvasRef.current;

        function setText(event) {
            const target = event.target;

            if(target.type === "textbox"){
                target.enterEditing && target.enterEditing();
                setSelectedTextbox(target);
                fabricCanvas.requestRenderAll();
            }

            if(target.type === "group"){
                const textbox = target.getObjects().find(obj => obj.type === "textbox");
                if(textbox){
                    fabricCanvas.setActiveObject(target);
                    fabricCanvas.setActiveObject(textbox);
                    setSelectedTextbox(textbox)
                    textbox.enterEditing && textbox.enterEditing();
                    fabricCanvas.requestRenderAll();
                }
            }
        }

        fabricCanvas.on("mouse:dblclick", setText);
        return () => fabricCanvas.off("mouse:dblclick", setText);
    }, []);

    /*Sets up selection and editing of textbox 

    When a textbox or a textbox inside a shape group is selected, it will set the selectedTextbox state and position the editing menu
    When a shape group is selected, it will set the selectedShape and selectedGroup state and position the shape editing menu
    If no textbox or shape is selected, it will reset the selectedTextbox, selectedShape, and selectedGroup state
    */
    useEffect(() => {
        const fabricCanvas = fabricCanvasRef.current;

        function textEditing(){
            const obj = fabricCanvas.getActiveObject();
            if(obj && obj.type === "textbox"){
                setSelectedTextbox(obj);
                const rect = obj.getBoundingRect();
                setFontSizeInput(obj.fontSize);
                const screenPos = canvasToScreenCoords(fabricCanvas, {
                    x: rect.left + rect.width / 2, 
                    y: rect.top
                });
                setMenuPosition({
                    x: screenPos.x,
                    y: screenPos.y - 300
                });
            } 
            else{
                setSelectedTextbox(null);
            }
            if(obj && obj.type === "group"){
                setSelectedGroup(obj);
                const groupObjects = obj.getObjects();
                const shape = groupObjects.find(o => o.type !== "textbox");
                setSelectedShape(shape);
                const rect = shape.getBoundingRect();
                const screenPos = canvasToScreenCoords(fabricCanvas, {
                    x: rect.left + rect.width / 2, 
                    y: rect.top
                });
                setMenuPosition2({
                    x: screenPos.x,
                    y: screenPos.y - 300
                });
            }
            else{
                setSelectedShape(null);
                setSelectedGroup(null);
            }
        }

        fabricCanvas.on("selection:created", textEditing);
        fabricCanvas.on("selection:updated", textEditing);
        fabricCanvas.on("selection:cleared", textEditing);
        fabricCanvas.on("object:moving", textEditing);
        fabricCanvas.on("object:modified", textEditing);

        return () => {
            fabricCanvas.off("selection:created", textEditing);
            fabricCanvas.off("selection:updated", textEditing);
            fabricCanvas.off("selection:cleared", textEditing);
            fabricCanvas.off("object:moving", textEditing);
            fabricCanvas.off("object:modified", textEditing);
        }
    }, []);

    /*Updates selected textbox based on formatting options when they are changed

    If selectedTextbox is null, it will do nothing
    If bold is true, it will set the fontWeight to "bold", otherwise it will set it to "normal"
    If italic is true, it will set the fontStyle to "italic", otherwise it will set it to "normal"
    If underline is true, it will set the underline property to true, otherwise it will set it to false
    It will also set the fontSize and textAlign properties based on the state variables
    Finally, it will request a render of the canvas to update the changes*/
    useEffect(() => {
        if(!selectedTextbox){
            return;
        }

        if(bold){
            selectedTextbox.set("fontWeight", "bold");
        } 
        else{
            selectedTextbox.set("fontWeight", "normal");
        }

        if(italic){
            selectedTextbox.set("fontStyle", "italic");
        } 
        else{
            selectedTextbox.set("fontStyle", "normal");
        }

        selectedTextbox.set("underline", underline);
        selectedTextbox.set("fontSize", fontSizeInput);
        selectedTextbox.set("textAlign", textAlignment);
        selectedTextbox.canvas.requestRenderAll();

    }, [selectedTextbox, fontSizeInput, bold, italic, underline, textAlignment]);

    /*Sets up selected shape based on formatting options when they are changed

    If selectedShape is null, it will do nothing
    It will set the fill, stroke, strokeWidth properties based on the state variables
    It will also set the width and height of the selected group based on the shape's dimensions and border size
    Finally, it will request a render of the canvas to update the changes*/
    useEffect(() => {
        if(!selectedShape || !selectedGroup){
            return;
        }
        selectedShape.set("strokeWidth", borderSizeInput);
        selectedGroup.set("width", selectedShape.width + 2 * borderSizeInput);
        selectedGroup.set("height", selectedShape.height + 2 * borderSizeInput);
        selectedShape.canvas.requestRenderAll();

    }, [selectedShape, borderSizeInput, selectedGroup])

    //Set up color picker for stroke color for drawing and highlighting
    useEffect(() => {
        setTimeout(() => {
            const container = document.getElementById("colorpicker_container");
            if(!container){
                return;
            }
            window.webix.ui({
                view: "colorpicker",
                container: "colorpicker_container",
                value: "#000000",
                on: {
                    onChange: (newColor) => {
                        setStrokeColor(newColor);
                    },
                },
            });
        }, 0);
    }, [isEditing]);

    //Set up color picker for stroke color for textbox text color
    useEffect(() => {
        setTimeout(() => {
            const container = document.getElementById("colorpicker_container2");
            if(!container){
                return;
            }
            container.innerHTML = "";
            window.webix.ui({
                view: "colorpicker",
                container: "colorpicker_container2",
                value: "#000000",
                on: { 
                    onChange: (newColor) => {
                        setStrokeColorInput(newColor);
                        if(selectedTextbox){
                            selectedTextbox.set("fill", newColor);
                            selectedTextbox.canvas?.requestRenderAll();
                        }
                    },
                },
            });
        }, 0);
    }, [selectedTextbox]);

    //Set up color picker for background color for shape fill color
    useEffect(() => {
        setTimeout(() => {
            const container = document.getElementById("colorpicker_container3");
            if(!container){
                return;
            }
            container.innerHTML = "";
            window.webix.ui({
                view: "colorpicker",
                container: "colorpicker_container3",
                value: "#ffee8c",
                on: { 
                    onChange: (newColor) => {
                        setBackgroundColorInput(newColor);
                        if(selectedShape){
                            selectedShape.set("fill", newColor);
                            selectedShape.canvas?.requestRenderAll();
                        }
                    },
                },
            });
        }, 0);
    }, [selectedShape]);

    //Set up color picker for border color for shape border color
    useEffect(() => {
        setTimeout(() => {
            const container = document.getElementById("colorpicker_container4");
            if(!container){
                return;
            }
            container.innerHTML = "";
            window.webix.ui({
                view: "colorpicker",
                container: "colorpicker_container4",
                value: "#000000",
                on: { 
                    onChange: (newColor) => {
                        setBorderColorInput(newColor);
                        if(selectedShape){
                            selectedShape.set("stroke", newColor);
                            selectedShape.canvas?.requestRenderAll();
                        }
                    },
                },
            });
        }, 0);
    }, [selectedShape]);

    //Convert canvas coordinates to screen coordinates for positioning menus (Generated by Copilot)
    function canvasToScreenCoords(canvas, point) {
        const zoom = canvas.getZoom();
        const vpt = canvas.viewportTransform;
        return {
            x: point.x * zoom + vpt[4],
            y: point.y * zoom + vpt[5]
        };
    }

    //Convert hex color to rgba color with specified alpha (Generated by Copilot)
    //Used this to convert color into rgba because hex doesn't support opacity for highlighting
    function hexToRgba(hex, alpha = 1) {
        hex = hex.replace(/^#/, "");
        if (hex.length === 3) {
            hex = hex.split("").map(x => x + x).join("");
        }
        const num = parseInt(hex, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    return(
        <div id = "whiteboard">
            <canvas id = "canvas" ref = {canvasRef}></canvas>
            {/*Main tools: soundcloud and clock*/}
            <div id = "mainTools">
                <button onClick = {() => setShowSoundCloud(!showSoundCloud)}>
                    <img src = "music-Stroke-Rounded.png"></img>
                </button>
                <button onClick = {() => setClock(!showClock)}>
                    <img src = "timer-Stroke-Rounded.png"></img>
                </button>
            </div>
            {/*When buttons in main tools are clicked, soundcloud and clock will appear*/}
            {showSoundCloud && (
                <div className = "floatingWidgets">
                    <SoundCloud/>
                </div>
            )}      
            {showClock && (
                <div className = "floatingWidgets">
                    <Clock/>
                </div>
            )}
            {/*Editing tools: draw, erase, highlight, textbox, shapes*/}
            {/*When editing button is clicked, editing menu will appear with draw, erase, highlight, and color picker*/}
            {/*Editing menu changes value of tool to trigger draw, highlight, erase, brush size changes, and brush color changes*/}
            <div id = "editingTools">
                <button onClick = {() => {setIsEditing(!isEditing)}}>
                    <img src = "editing-Stroke-Rounded.png"/>
                </button>
                {isEditing && (
                    <div id = "editingMenu">
                        <button onClick = {() => setTool(tool === "draw" ? null : "draw")}>
                            <img src = "pencil-Stroke-Rounded.png" alt = "draw"></img>
                        </button>
                        <button onClick = {() => setTool(tool === "erase" ? null : "erase")}>  
                            <img src = "eraser-Stroke-Rounded.png" alt = "erase"></img>
                        </button>
                        <button onClick = {() => setTool(tool === "highlight" ? null : "highlight")}>  
                            <img src = "highlighter-Stroke-Rounded.png" alt = "highlight"></img>
                        </button>
                        <button id = "colorpicker_container"></button>
                        <button onClick = {() => {setStrokeSize(Math.min(25, strokeSize + 5))}}>
                            <img src = "pen-add-Stroke-Rounded.png" alt = "increase pen size"/>
                        </button>
                        <button onClick = {() => {setStrokeSize(Math.max(1, strokeSize - 5))}}>
                            <img src = "pen-minus-Stroke-Rounded.png" alt = "decrease pen size"/>
                        </button>
                    </div>
                )}
                {/*When textbox button is clicked, textbox will be added to canvas and textbox menu will appear*/}
                {/*When shapes button is clicked, shapes menu will appear with square, circle, triangle, pentagon, and hexagon*/}
                {/* Shapes menu changes value of shape to trigger adding shapes to canvas and shape formatting changes*/}
                <button onClick = {() => setShape(shape === "textbox" ? null : "textbox")}>
                    <img src = "text-Stroke-Rounded.png" alt = "text"/>
                </button>
                <button onClick = {() => {setIsShapes(!isShapes)}}> 
                    <img src = "shapes-Stroke-Rounded.png" alt = "undo"/>
                </button>
                {isShapes && (
                    <div id = "shapesMenu">
                        <button onClick = {() => setShape(shape === "square" ? null : "square")}>
                            <img src = "square-Stroke-Rounded.png" alt = "square"/>
                        </button>
                        <button onClick = {() => setShape(shape === "circle" ? null : "circle")}>
                            <img src = "circle-Stroke-Rounded.png" alt = "circle"/>
                        </button>
                        <button onClick = {() => setShape(shape === "triangle" ? null : "triangle")}>
                            <img src = "triangle-Stroke-Rounded.png" alt = "triangle"/>
                        </button>
                        <button onClick = {() => setShape(shape === "pentagon" ? null : "pentagon")}>
                            <img src = "pentagon-Stroke-Rounded.png" alt = "pentagon"/>
                        </button>
                        <button onClick = {() => setShape(shape === "hexagon" ? null : "hexagon")}>
                            <img src = "hexagon-Stroke-Rounded.png" alt = "hexagon"/>
                        </button>
                    </div>
                )}
                {/* When textbox is selected, textbox menu will appear with font size, text color, bold, italic, underline, and text alignment*/}
                {selectedTextbox && (
                <div id = "textEditingTools" style = {{left: `${menuPosition.x}px`, top: `${menuPosition.y}px`}}>
                    <button onClick = {e => setFontSizeInput(Math.min(25, fontSizeInput + 3))}>
                        <img src = "pen-add-Stroke-Rounded.png" alt = "increase font size"></img>
                    </button>
                    <button onClick = {e => setFontSizeInput(Math.max(6, fontSizeInput - 3))}>
                        <img src = "pen-minus-Stroke-Rounded.png" alt = "decrease font size" />
                    </button>
                    <button id = "colorpicker_container2"></button>
                    <button onClick = {e => setBold(!bold)}>
                        <img src = "text-bold-Stroke-Rounded.png" alt = "bold text"/>
                    </button>
                    <button onClick = {e => setItalic(!italic)}>
                        <img src = "text-italic-Stroke-Rounded.png" alt = "italic text"/>
                    </button>
                    <button onClick = {e => setUnderline(!underline)}>
                        <img src="text-underline-Stroke-Rounded.png" alt="underline"/>
                    </button>
                    <button onClick = {e => setTextAlignment("left")}>
                        <img src = "text-align-left-Stroke-Rounded.png" alt = "text align left"/>
                    </button>
                    <button onClick = {e => setTextAlignment("center")}>
                        <img src = "text-align-center-Stroke-Rounded.png" alt = "text align center"/>
                    </button>
                    <button onClick = {e => setTextAlignment("right")}>
                        <img src = "text-align-right-Stroke-Rounded.png" alt = "text align right"/>
                    </button>
                </div>
            )}
            {/* When shape is selected, shape menu will appear with border size, border color, and fill color*/}
            {selectedShape && selectedGroup && (
            <div id = "shapeEditingTools" style = {{left: `${menuPosition2.x}px`, top: `${menuPosition2.y}px`}}>
            <button id = "colorpicker_container3"></button>
            <button onClick = {e => setBorderSizeInput(Math.min(4, borderSizeInput + 1))}>
                <img src="add-square-Stroke-Rounded.png" alt="increase border size" />
            </button>
                <button onClick = {e => setBorderSizeInput(Math.max(0, borderSizeInput - 1))}>
                    <img src = "minus-square-Stroke-Rounded.png" alt = "decrease border size"></img>
                </button>
                <button id = "colorpicker_container4"></button>
            </div>
            )}
            </div>
        </div>
    )
}
