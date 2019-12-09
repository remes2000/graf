function runBfs(graph, startNode, endNode){
    console.log(graph, startNode, endNode);
    let nodes = graph[startNode.id].map(n => Object.assign(n, {parent: startNode}));
    while(nodes.length > 0){
        const node = nodes.shift();
        if(node.endNode){
            let b = node;
            while(b){
                console.log(b.id);
                b = b.parent;
            }
            return console.log("FOUND END NODE IS ", node.id);
        } else {
            nodes = nodes.concat(graph[node.id].map(n => Object.assign(n, {parent: node})));
        }
    }
    return console.log("NO SUCH PATH");
}