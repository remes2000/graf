const display = document.getElementById('display');

//set up context menu
display.addEventListener('contextmenu', e => {
    e.preventDefault();
    drawContextMenu(e.pageX,e.pageY,[contextMenuItem('Create new node', (w) => drawNode(e.offsetX, e.offsetY))]);
});


//global variables
const width = display.offsetWidth;
const height = display.offsetHeight;
const layer = new Konva.Layer();
const nodes = [];
let nodeIdCounter = 0;
let lineIdCounter = 0;
let currentLine = null;

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

    nodeGroup.on('dragmove', e => {
        const virtualNode = nodes.find(n => n.konvaId === nodeGroup._id);
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
        });
        layer.draw();
    });

    nodeGroup.on('contextmenu', e => {
        e.evt.preventDefault();
        const menuItems = [];
        menuItems.push(contextMenuItem('Delete node', (w) => deleteNode(e.currentTarget)));
        if(!!currentLine){
            menuItems.push(contextMenuItem('Connect this node', (w) => connectLineToNode(e.currentTarget)));
        } else {
            menuItems.push(contextMenuItem('Create edge', (w) => createEdge(e.currentTarget)));
        }

        drawContextMenu(e.evt.pageX,e.evt.pageY, menuItems);
        e.evt.stopPropagation();
    });

    nodeGroup.add(nodeIdLabel);
    nodes.push({id: `node${nodeIdCounter}`, konvaId: nodeGroup._id, arrows: []});
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
        const menuItems = [
            contextMenuItem('Delete edge', () => deleteEdge(e.currentTarget))
        ];
        drawContextMenu(e.evt.pageX,e.evt.pageY, menuItems);
        e.evt.stopPropagation();
    });

    line.on('mouseover', function() {
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

function connectLineToNode(node){
    currentLine.attrs.points = getConnectorPoints({x: currentLine.attrs.points[0], y: currentLine.attrs.points[1]}, {x: node.getX() + node.children[0].getX(), y: node.getY() + node.children[0].getY()});
    layer.draw();

    const virtualNode = nodes.find(n => n.konvaId === node._id);
    virtualNode.arrows.push(currentLine.attrs.id);
    currentLine.attrs.endNodeId = virtualNode.id;

    const startNode = nodes.find(n => n.id === currentLine.attrs.startNodeId);
    startNode.arrows.push(currentLine.attrs.id);

    currentLine = null;
}

function deleteEdge(edge){
    const edgeId = edge.attrs.id;
    const startNode = nodes.find(n => n.id === edge.attrs.startNodeId);
    const endNode = nodes.find(n => n.id === edge.attrs.endNodeId);
    startNode.arrows.splice(startNode.arrows.findIndex(a => a.id === edgeId), 1);
    endNode.arrows.splice(endNode.arrows.findIndex(a => a.id === edgeId), 1);
    edge.destroy();
    layer.draw();
}