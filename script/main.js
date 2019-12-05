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
        id: nodeIdCounter,
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
        const arrow = stage.findOne(virtualNode.arrows[0]+'');
        arrow.points = getConnectorPoints({x: arrow.points[0], y: arrow.points[1]}, {x: e.currentTarget.getX() + e.currentTarget.children[0].getX(), y: e.currentTarget.getY() + e.currentTarget.children[0].getY()});
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
    nodes.push({id: nodeIdCounter, konvaId: nodeGroup._id, arrows: []});
    layer.add(nodeGroup);
    layer.draw();
    nodeIdCounter++;
}

function deleteNode(node){
    node.destroy();
    nodes.splice(nodes.findIndex(n => n.konvaId === node._id), 1);
    layer.draw();
}

function createEdge(node){
    const line = new Konva.Arrow({
        points: [node.getX() + node.children[0].getX(), node.getY() + node.children[0].getY()],
        stroke: 'black',
        strokeWidth: 4,
    });
    currentLine = line;

    layer.add(line);
    layer.draw();
    line.moveToBottom();
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

function connectLineToNode(node){
    currentLine.attrs.points = getConnectorPoints({x: currentLine.attrs.points[0], y: currentLine.attrs.points[1]}, {x: node.getX() + node.children[0].getX(), y: node.getY() + node.children[0].getY()});
    layer.draw();
    const virtualNode = nodes.find(n => n.konvaId === node._id);
    virtualNode.arrows.push(currentLine._id);

    currentLine = null;
}