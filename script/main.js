const display = document.getElementById('display');

//set up context menu
display.addEventListener('contextmenu', e => {
    e.preventDefault();
    drawContextMenu(e.pageX,e.pageY,[contextMenuItem('Create new node', (w) => drawNode(e.offsetX, e.offsetY))]);
});

document.getElementById('show-weights').addEventListener('click', e => {
    if(e.srcElement.checked){
        showAllWeights();
    } else {
        hideAllWeights();
    }
});

document.querySelector('#BFS').addEventListener('click', () => changeMode("BFS"));
document.querySelector('#DIJKSTRA').addEventListener('click', () => changeMode("DIJKSTRA"));
document.querySelector('#BELLMAN-FORD').addEventListener('click', () => changeMode("BELLMAN-FORD"));

//global variables
const width = display.offsetWidth;
const height = display.offsetHeight;
const layer = new Konva.Layer();
let nodes = [];
let nodeIdCounter = 0;
let lineIdCounter = 0;
let currentLine = null;
let previousLine = null; 

//mode
let mode = '';
changeMode("BFS");

const stage = new Konva.Stage({
    container: 'display',
    width,
    height
});

stage.add(layer);
layer.draw();

stage.on('mousemove', (e) => {
    if(!!currentLine){
        updateLine(e.evt.offsetX, e.evt.offsetY);
    }
});

stage.on('dblclick', e => {
    if(e.evt.which !== 1){
        return;
    }
    drawNode(e.evt.offsetX, e.evt.offsetY);
})

document.querySelector('html').addEventListener('keydown', event => {
    if(event.keyCode === 27 && !!currentLine){
        currentLine.destroy();
        layer.draw();
        currentLine = null;
    }
});

function drawNode(x, y){
    const nodeGroup = new Konva.Group({
        id: `node${nodeIdCounter}`,
        draggable: true,
        x: 0,
        y: 0
    });

    const node = new Konva.Circle({
        x,
        y,
        radius: 20,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4,
    });
    nodeGroup.add(node);

    const nodeIdLabel = new Konva.Text({
        x,
        y,
        text: nodeIdCounter+'',
        fontSize: 30,
        fontFamily: 'Calibri',
    });
    nodeIdLabel.offsetX(nodeIdLabel.width() / 2);
    nodeIdLabel.offsetY(nodeIdLabel.height() / 2);

    nodeGroup.on('mouseover', function() {
        display.style.cursor = 'pointer';
    });

    nodeGroup.on('mouseout', function() {
        display.style.cursor = 'crosshair';
    });

    nodeGroup.on('dragstart', e => {
        if(!!currentLine && currentLine.attrs.startNodeId === nodeGroup.attrs.id){
            currentLine.destroy();
            previousLine = currentLine;
            currentLine = null;
            layer.draw();
        }
    });

    nodeGroup.on('dragend', e => {
        if(!!previousLine && previousLine.attrs.startNodeId === nodeGroup.attrs.id){
            createEdge(e.currentTarget);
            previousLine = false;
        }
    });

    nodeGroup.on('dragmove', e => {
        const virtualNode = nodes.find(n => n.id === nodeGroup.attrs.id);

        if(!!currentLine && currentLine.attrs.startNodeId === nodeGroup.attrs.id){
            return;
        }

        virtualNode.arrows.forEach(arrowId => {
            const arrow = layer.findOne('#'+arrowId);
            const startNode = layer.findOne('#'+arrow.attrs.startNodeId);
            const endNode = layer.findOne('#'+arrow.attrs.endNodeId);
            if(arrow.attrs.startNodeId === nodeGroup.attrs.id){
                arrow.attrs.points = getConnectorPoints(
                    {x: e.currentTarget.getX() + e.currentTarget.children[0].getX(), y: e.currentTarget.getY() + e.currentTarget.children[0].getY()},
                    {x: endNode.getX() + endNode.children[0].getX(), y: endNode.getY() + endNode.children[0].getY()},
                );
            } else {
                arrow.attrs.points = getConnectorPoints(
                    {x: startNode.getX() + startNode.children[0].getX(), y: startNode.getY() + startNode.children[0].getY()},
                    {x: e.currentTarget.getX() + e.currentTarget.children[0].getX(), y: e.currentTarget.getY() + e.currentTarget.children[0].getY()},
                );
            }
            const label = layer.findOne(`#label${arrowId}`);
            const labelPosition = getEdgeWeightLabelPosition(arrow);
            label.attrs.x = labelPosition.x;
            label.attrs.y = labelPosition.y;
            label.attrs.rotation = 0;
            label.rotate(labelPosition.angle);
        });
        layer.draw();
    });

    nodeGroup.on('contextmenu', e => {
        e.evt.preventDefault();
        const menuItems = [];
        menuItems.push(contextMenuItem('Delete node', (w) => deleteNode(e.currentTarget)));
        if(!!currentLine){
            if(currentLine.attrs.startNodeId !== nodeGroup.attrs.id && !connectionExists(nodes.find(n => n.id === nodeGroup.attrs.id), nodes.find(n => n.id === currentLine.attrs.startNodeId))){
                menuItems.push(contextMenuItem('Connect this node', (w) => connectLineToNode(e.currentTarget)));
            }
        } else {
            menuItems.push(contextMenuItem('Create edge', (w) => createEdge(e.currentTarget)));
        }

        menuItems.push(contextMenuItem('Set as start node', w => setStartNode(nodeGroup.attrs.id)));
        menuItems.push(contextMenuItem('Set as end node', w => setEndNode(nodeGroup.attrs.id)));

        drawContextMenu(e.evt.pageX,e.evt.pageY, menuItems);
        e.evt.stopPropagation();
    });

    nodeGroup.on('dblclick', e => {
        e.cancelBubble = true;
        if(e.evt.which !== 1){
            return;
        }

        if(!currentLine){
            createEdge(e.currentTarget);
        } else {
            connectLineToNode(e.currentTarget);
        }
    });

    nodeGroup.add(nodeIdLabel);
    nodes.push({id: `node${nodeIdCounter}`, konvaId: nodeGroup._id, arrows: [], startNode: false, endNode: false});
    layer.add(nodeGroup);
    layer.draw();
    nodeIdCounter++;
}

function deleteNode(node){
    const virtualNode = nodes.find(n => n.konvaId === node._id);
    const arrows = [...virtualNode.arrows];
    arrows.forEach(arrow => {
        deleteEdge(layer.findOne('#'+arrow));
    });

    if(!!currentLine && currentLine.attrs.startNodeId === virtualNode.id){
        currentLine.destroy();
        currentLine = null;
    }

    node.destroy();
    nodes.splice(nodes.indexOf(virtualNode), 1);
    layer.draw();
}

function createEdge(node){
    const line = new Konva.Arrow({
        points: [node.getX() + node.children[0].getX(), node.getY() + node.children[0].getY()],
        stroke: 'black',
        strokeWidth: 4,
        id: `edge${lineIdCounter}`,
        startNodeId: node.attrs.id
    });

    line.on('contextmenu', e => {        
        e.evt.preventDefault();
        if(currentLine && currentLine.attrs.id === line.attrs.id){
            return;
        }

        e.evt.stopPropagation();

        const menuItems = [
            contextMenuItem('Delete edge', () => deleteEdge(e.currentTarget)),
            contextMenuTextfield('Edge weight', e => setEdgeWeight(line.attrs.id,e.srcElement.value), layer.findOne(`#label${line.attrs.id}`).children[0].getAttr('text')),
        ];
        drawContextMenu(e.evt.pageX,e.evt.pageY, menuItems);
    });

    line.on('mouseover', function() {
        if(currentLine && currentLine.attrs.id === line.attrs.id){
            return;
        }

        display.style.cursor = 'pointer';
    });

    line.on('mouseout', function() {
        display.style.cursor = 'crosshair';
    });

    currentLine = line;

    layer.add(line);
    layer.draw();
    line.moveToBottom();
    layer.draw();
    lineIdCounter++;
}

function setEdgeWeight(lineId, data){
    const label = layer.findOne(`#label${lineId}`);
    label.children[0].setAttr('text', data);
    label.offsetX(label.width() / 2);
    label.offsetY(label.height());
    layer.draw();
}

function getConnectorPoints(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let angle = Math.atan2(-dy, dx);

    const radius = 30;

    return [
      from.x + -radius * Math.cos(angle + Math.PI),
      from.y + radius * Math.sin(angle + Math.PI),
      to.x + -radius * Math.cos(angle),
      to.y + radius * Math.sin(angle)
    ];
  }

function updateLine(x, y){
    if(!currentLine){
        throw `Line not found`;
    }

    const newPoints = [];
    newPoints.push(currentLine.attrs.points[0]);
    newPoints.push(currentLine.attrs.points[1]);
    newPoints.push(x);
    newPoints.push(y);

    currentLine.attrs.points = newPoints;
    layer.draw();
}

function connectionExists(startNode, endNode){
    let result = false;
    startNode.arrows.forEach(sn => {
        if(endNode.arrows.includes(sn)){
            result = true;
        }
    });
    return result;
}

function getEdgeWeightLabelPosition(edge){
    let angle = Math.atan2(edge.attrs.points[3]-edge.attrs.points[1],edge.attrs.points[2]-edge.attrs.points[0])*180/Math.PI;
    if(!(angle>=-90&&angle<=90)){
        angle = Math.atan2(edge.attrs.points[1]-edge.attrs.points[3],edge.attrs.points[0]-edge.attrs.points[2])*180/Math.PI;
    }
    return {
        x: (edge.attrs.points[0]+edge.attrs.points[2])/2,
        y: (edge.attrs.points[1]+edge.attrs.points[3])/2,
        angle
    }
}

function connectLineToNode(node){
    if(node.attrs.id === currentLine.attrs.startNodeId) {
        return;
    }

    const startNode = nodes.find(n => n.id === currentLine.attrs.startNodeId);
    const virtualNode = nodes.find(n => n.konvaId === node._id);

    if(connectionExists(startNode, virtualNode)){
        return;
    }

    currentLine.attrs.points = getConnectorPoints({x: currentLine.attrs.points[0], y: currentLine.attrs.points[1]}, {x: node.getX() + node.children[0].getX(), y: node.getY() + node.children[0].getY()});
    
    //Draw edge weight
    const edgeWeightLabel = new Konva.Label({
        x: getEdgeWeightLabelPosition(currentLine).x,
        y: getEdgeWeightLabelPosition(currentLine).y,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 1,
        id: `label${currentLine.attrs.id}`
      });

      edgeWeightLabel.add(
          new Konva.Text({
            text: '1',
            fontFamily: 'Calibri',
            fontSize: 18,
            padding: 5,
            fill: 'black'
          })
      );

    edgeWeightLabel.offsetX(edgeWeightLabel.width() / 2);
    edgeWeightLabel.offsetY(edgeWeightLabel.height());
    edgeWeightLabel.rotate(getEdgeWeightLabelPosition(currentLine).angle);

    if(!document.getElementById('show-weights').checked){
        edgeWeightLabel.hide();
    }

    layer.add(edgeWeightLabel);
    layer.draw();

    virtualNode.arrows.push(currentLine.attrs.id);
    currentLine.attrs.endNodeId = virtualNode.id;

    startNode.arrows.push(currentLine.attrs.id);

        currentLine = null;
}

function deleteEdge(edge){
    const edgeId = edge.attrs.id+"";
    const startNode = nodes.find(n => n.id === edge.attrs.startNodeId);
    const endNode = nodes.find(n => n.id === edge.attrs.endNodeId);
    const label = layer.findOne(`#label${edgeId}`);
    label.destroy();
    startNode.arrows.splice(startNode.arrows.findIndex(a => a === edgeId), 1);
    endNode.arrows.splice(endNode.arrows.findIndex(a => a === edgeId), 1);
    edge.destroy();
    layer.draw();
}

function setStartNode(id){
    const node = nodes.find(n => n.id === id);
    if(!node){
        throw 'Node not found';
    }

    nodes.forEach(n => {
        if(n.startNode){
            n.startNode = false;
            const nDrawing = layer.findOne('#'+n.id);
            nDrawing.children[0].attrs.fill = 'white';
            nDrawing.children[1].attrs.fill = 'black';
        }
    });

    node.startNode = true;
    node.endNode = false;
    const nodeDrawing = layer.findOne('#'+node.id);
    nodeDrawing.children[0].attrs.fill = '#388e3c';
    nodeDrawing.children[1].attrs.fill = 'white';
    layer.draw();
}

function setEndNode(id){
    const node = nodes.find(n => n.id === id);
    if(!node){
        throw 'Node not found';
    }
    nodes.forEach(n => {
        if(n.endNode){
            n.endNode = false;
            const nDrawing = layer.findOne('#'+n.id);
            nDrawing.children[0].attrs.fill = 'white';
            nDrawing.children[1].attrs.fill = 'black';
        }
    });

    node.startNode = false;
    node.endNode = true;
    const nodeDrawing = layer.findOne('#'+node.id);
    nodeDrawing.children[0].attrs.fill = '#ff9800';
    nodeDrawing.children[1].attrs.fill = 'white';
    layer.draw();
}

function changeMode(newMode){
    mode = newMode;
    resetModeButtons();
    document.querySelector('#'+newMode).classList.add('selected');
}

function resetModeButtons(){
    document.querySelector('#BFS').classList.remove('selected');
    document.querySelector('#DIJKSTRA').classList.remove('selected');
    document.querySelector('#BELLMAN-FORD').classList.remove('selected');
}

document.getElementById('run').addEventListener('click', () => {
    blockButtons();
    hideMessage();
    runAlgorithm();
});
document.getElementById('clear-path').addEventListener('click', () => {
    hideMessage();
    clearPath();
});
document.getElementById('clear-all').addEventListener('click', () => {
    hideMessage();
    clearAll();
});

function runAlgorithm(){
    //TODO add validation
    clearPath();
    const hashMap = generateHashMap();
    switch(mode){
        case 'BFS':
            runBfs(hashMap, nodes.find(n => n.startNode), nodes.find(n => n.endNode));
        break;
        case 'DIJKSTRA':
            runDijkstra(hashMap, nodes.find(n => n.startNode), nodes.find(n => n.endNode));
        break;
        case 'BELLMAN-FORD':
            runBellmanFord(hashMap, nodes.find(n => n.startNode), nodes.find(n => n.endNode));
        break;
    }
}

function generateHashMap(){
    let graph = new Map();
    nodes.forEach(n => {
        graph.set(n.id, getNeighbours(n));
    });
    return graph;
}

function getNeighbours(node){
    const arrows = node.arrows.map(a => {
        return layer.findOne('#'+a);
    });

    return arrows.filter(a => a.attrs.startNodeId === node.id)
                    .map(a => {
                        const node = nodes[nodes.findIndex(n => n.id === a.attrs.endNodeId)];
                        const distance = layer.findOne(`#label${a.attrs.id}`).children[0].attrs.text;
                        node.distance = distance*1;
                        return Object.assign({}, node);
                    });
}

function drawPath(steps){
    const pathNodes = steps.map(s => nodes.find(n => n.id === s));
    for(let i=0; i<pathNodes.length; i++){
        const node = pathNodes[i];
        const realNode = layer.findOne('#'+node.id);
        realNode.children[0].attrs.stroke = '#0288D1';
        if(i<pathNodes.length-1){
            const nextNode = pathNodes[i+1];
            const arrow = node.arrows.find(a => layer.findOne('#'+a).attrs.endNodeId===nextNode.id);
            layer.findOne('#'+arrow).attrs.stroke = '#0288D1';
        }
    }
    layer.draw();
}

function animateNode(nodeId){
    const node = layer.findOne('#'+nodeId); 
    const fill = node.children[0].getAttr('fill');
    node.children[0].setAttr('fill', '#0288D1');
    layer.draw();
    setTimeout(() => {
        node.children[0].setAttr('fill', fill);
        layer.draw();
    }, 100);
}

function clearPath(){
    nodes.forEach(node => {
        layer.findOne('#'+node.id).children[0].attrs.stroke = 'black';
        node.arrows.forEach(arrow => {
            layer.findOne('#'+arrow).attrs.stroke = 'black';
        });
    });
    layer.draw();
}

function clearAll(){
    nodes.forEach(node => {
        node.arrows.forEach(arrow => {
            deleteEdge(layer.findOne('#'+arrow));
        });
    });
    const nodeIds = nodes.map(n => n.id);
    nodeIds.forEach(id => deleteNode(layer.findOne('#'+id)));
    nodes = [];
    nodeIdCounter = 0;
    lineIdCounter = 0;
    currentLine = null;
    previousLine = null; 
    layer.draw();
}

function showAllWeights(){

}

function hideAllWeights(){
    nodes.forEach(node => {
        node.arrows.forEach(arrow => {
            const label = layer.findOne(`#label${arrow}`);
            label.hide();
        });
    });
    layer.draw();
}

function showAllWeights(){
    nodes.forEach(node => {
        node.arrows.forEach(arrow => {
            const label = layer.findOne(`#label${arrow}`);
            label.show();
        });
    });
    layer.draw();
}

function showMessage(type, content){
    const display = document.getElementById('message');
    display.innerHTML = content;
    if(type==="ERROR"){
        display.classList.add("error");
    }
    if(type==="SUCCESS"){
        display.classList.add("success");
    }
}

function hideMessage(){
    const display = document.getElementById('message');
    display.innerHTML = "";
    display.classList.remove("error");
    display.classList.remove("success");
}

function blockButtons(){
    disableRunButton(true);
    disableClearPathButton(true);
    disableClearAllButton(true);
}

function unclockButtons(){
    disableRunButton(false);
    disableClearPathButton(false);
    disableClearAllButton(false);
}

function disableRunButton(disable){
    if(disable){
        document.getElementById('run').setAttribute('disabled', disable);
    } else {
        document.getElementById('run').removeAttribute('disabled');
    }
}

function disableClearPathButton(disable){
    if(disable){
        document.getElementById('clear-path').setAttribute('disabled', disable);
    } else {
        document.getElementById('clear-path').removeAttribute('disabled');
    }
}

function disableClearAllButton(disable){
    if(disable){
        document.getElementById('clear-all').setAttribute('disabled', disable)
    } else {
        document.getElementById('clear-all').removeAttribute('disabled');
    }
}