const display = document.getElementById('display');

//set up context menu
display.addEventListener('contextmenu', e => {
    e.preventDefault();
    console.log(e);
    drawContextMenu(e.pageX,e.pageY,[contextMenuItem('Create new node', (w) => drawNode(e.offsetX, e.offsetY))]);
});
const width = display.offsetWidth;
const height = display.offsetHeight;

const stage = new Konva.Stage({
    container: 'display',
    width,
    height
});
const layer = new Konva.Layer();
stage.add(layer);
layer.draw();

let nodeIdCounter = 0;

function drawNode(x, y){
    const nodeGroup = new Konva.Group({
        draggable: true,
    });

    const node = new Konva.Circle({
        x,
        y,
        radius: 20,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4
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

    nodeGroup.add(nodeIdLabel);

    layer.add(nodeGroup);
    layer.draw();
    nodeIdCounter++;
}