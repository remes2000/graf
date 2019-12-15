function runBfs(graph, startNode, endNode){
    let nodes = graph.get(startNode.id).map(n => Object.assign({parent: startNode}, n));
    let searched = [];
    let counter = 1;
    while(nodes.length > 0){
        const node = nodes.shift();
        if(searched.findIndex(n => n.id === node.id) !== -1){
            continue;
        }

        setTimeout(() => animateNode(node.id), 150 * counter);
        counter++;

        if(node.endNode){
            return setTimeout(() => drawPath(backTraceRouteBFS(node)), 150 * counter+1);

        }
        else { 
            nodes = nodes.concat(graph.get(node.id).map(n => Object.assign({parent: node}, n)));
            searched.push(node);
        }
    }
    return console.log("NO SUCH A PATH");
}

function backTraceRouteBFS(endNode){
    const steps = [];
    let parent = endNode; 
    while(parent){
        steps.push(parent);
        parent = parent.parent;
    }
    return steps.reverse().map(n => n.id);
}