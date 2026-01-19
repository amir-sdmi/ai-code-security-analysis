import React, { useState } from 'react';
import './DDorganizer.css';


function DDorganizer(props) {
    //console.log("DD: ", props.invList);
    //every new dropzone needs to add the following:
    //  const [listNewDZ, setNewDZ] = useState([itemsInDZNow])
    //  handleDrop() update conditional loop
    //  return() update view template

    //create individual state of list for items in each location
    const [listStorage, setStorage] = useState(props.invList.filter(item => item.location === "storage"));
    const [listProduce1, setProduce1] = useState(props.invList.filter(item => item.location === "produce1"));
    const [listProduce2, setProduce2] = useState(props.invList.filter(item => item.location === "produce2"));
    const [listAisle1, setAisle1] = useState(props.invList.filter(item => item.location === "aisle1"));
    const [listAisle2, setAisle2] = useState(props.invList.filter(item => item.location === "aisle2"));
    const [listFreezer1, setFreezer1] = useState(props.invList.filter(item => item.location === "freezer1"));
    const [listFreezer2, setFreezer2] = useState(props.invList.filter(item => item.location === "freezer2"));

    //State for getting the item thats being dragged
    const [dragging, setDragging] = useState(null);
    //State for DZ at dragStart
    const [DZstart, setDZstart] = useState(null);
    //State for DZ at dragEnd
    const [DZend, setDZend] = useState(null);

    //init dropzone properties thru loop
    // not reliable bc script loaded before DOM; cannot get HTMLelement => null
    // const dropzones = ["storage", "produce1", "produce2", "aisle1", "aisle2", "freezer1", "freezer2"];
    // window.onload = dropzones.forEach((id) => {
    //     const dz = document.getElementById(id);
    //     console.log("loop:", dz, id);

    //     dz.ondragover = (e) => {handleDragOver(e, id)};
    //     dz.ondragleave = (e) => {handleDragLeave(e, id)};
    //     dz.ondrop = (e) => {handleDrop(e, id)}; 

    // })


    //register the item's SKU when drag start
    const handleDragStart = (event, SKU, zoneID) => {
        console.log("start", event);
        event.dataTransfer.setData('text/plain', SKU);
        setDragging(SKU);
        setDZstart(zoneID);
    }

    const handleDragOver = (event, zoneID) => {
        event.preventDefault();
        //console.log("over", event.target);

        const dz = document.getElementById(zoneID);
        dz.style.backgroundColor = "#363b46";
    }
    const handleDragLeave = (event, zoneID) => {
        event.preventDefault();
        //console.log("leave", event.target);

        const dz = document.getElementById(zoneID);
        dz.style.backgroundColor = "#282c34";
    }

    const handleDrop = (event, zoneID) => {
        event.preventDefault();
        //pass back to parent ASAP due to sync issue of state if done later on.
        props.setLoc(dragging, zoneID);

        setDZend(zoneID);
        console.log("handleDrop before: ", zoneID, DZend);

        const dragItemSKU = event.dataTransfer.getData('text/plain');
        const draggedItem = props.invList.find(item => item.SKU === dragItemSKU);

        // Remove from the starting zone list (suggested by ChatGPT)
        if (DZstart) {
            const setZone = {
                storage: setStorage,
                produce1: setProduce1,
                produce2: setProduce2,
                aisle1: setAisle1,
                aisle2: setAisle2,
                freezer1: setFreezer1,
                freezer2: setFreezer2,
            };
            setZone[DZstart](prev => prev.filter(item => item.SKU !== dragItemSKU));
        }

        // Add item to the new zone
        const setNewZone = {
            storage: setStorage,
            produce1: setProduce1,
            produce2: setProduce2,
            aisle1: setAisle1,
            aisle2: setAisle2,
            freezer1: setFreezer1,
            freezer2: setFreezer2,
        };
        setNewZone[zoneID](prev => [...prev, draggedItem]);

        console.log("handledrop pass data back: ", dragItemSKU, DZend);
        const dz = document.getElementById(zoneID);
        dz.style.backgroundColor = "#282c34";
    }




    //could not assign JSX element properties thru loops bc script ran before template is set up?
    //window.onload did not work as a fix.
    return (
        <div id="locContainer">
            <div className="dropZones" id="storage"
                onDragOver={(e) => { handleDragOver(e, "storage") }}
                onDragLeave={(e) => { handleDragLeave(e, "storage") }}
                onDrop={(e) => { handleDrop(e, "storage") }}
            ><p>Storage</p>
                {listStorage.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "storage")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="produce1"
                onDragOver={(e) => { handleDragOver(e, "produce1") }}
                onDragLeave={(e) => { handleDragLeave(e, "produce1") }}
                onDrop={(e) => { handleDrop(e, "produce1") }}
            ><p>Produce Area 1</p>
                {listProduce1.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "produce1")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="produce2"
                onDragOver={(e) => { handleDragOver(e, "produce2") }}
                onDragLeave={(e) => { handleDragLeave(e, "produce2") }}
                onDrop={(e) => { handleDrop(e, "produce2") }}
            ><p>Produce Area 2</p>
                {listProduce2.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "produce2")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="aisle1"
                onDragOver={(e) => { handleDragOver(e, "aisle1") }}
                onDragLeave={(e) => { handleDragLeave(e, "aisle1") }}
                onDrop={(e) => { handleDrop(e, "aisle1") }}
            ><p>Aisle 1</p>
                {listAisle1.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "aisle1")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="aisle2"
                onDragOver={(e) => { handleDragOver(e, "aisle2") }}
                onDragLeave={(e) => { handleDragLeave(e, "aisle2") }}
                onDrop={(e) => { handleDrop(e, "aisle2") }}
            ><p>Aisle 2</p>
                {listAisle2.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "aisle2")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="freezer1"
                onDragOver={(e) => { handleDragOver(e, "freezer1") }}
                onDragLeave={(e) => { handleDragLeave(e, "freezer1") }}
                onDrop={(e) => { handleDrop(e, "freezer1") }}
            ><p>Freezer 1</p>
                {listFreezer1.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "freezer1")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
            <div className="dropZones" id="freezer2"
                onDragOver={(e) => { handleDragOver(e, "freezer2") }}
                onDragLeave={(e) => { handleDragLeave(e, "freezer2") }}
                onDrop={(e) => { handleDrop(e, "freezer2") }}
            ><p>Freezer 2</p>
                {listFreezer2.map(item => (
                    <div className='itemContainer' key={item.SKU}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item.SKU, "freezer2")}>
                        <p>{item.name}</p>
                        <img src={item.image} alt={"image of " + item.name}></img>
                        <p>SKU: {item.SKU}</p>
                    </div>
                ))}
            </div>
        </div>
    )

}

export default DDorganizer;