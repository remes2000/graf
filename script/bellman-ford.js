function runBellmanFord(graph, startNode, endNode){
    const costs = generateCostsBellmanFord(graph, startNode);
    const parents = generateParentsBellmanFord(graph, startNode);
    for(let k of graph.keys()){
        for(let key of graph.keys()){
            if(costs.get(key) === Number.POSITIVE_INFINITY) { continue; }
            graph.get(key).forEach(n => {
                const newCost = costs.get(key) + n.distance;
                if(newCost<costs.get(n.id)){
                    costs.set(n.id, newCost);
                    parents.set(n.id, key);
                }
            });
        }
    }

    //console.log(backTraceRouteBellmanFord(parents, startNode.id, endNode.id));
    drawPath(backTraceRouteBellmanFord(parents, startNode.id, endNode.id));
}

function generateCostsBellmanFord(graph, startNode){
    const costs = new Map();
    for(key of graph.keys()){
        if(key === startNode.id){
            costs.set(key, 0);
            continue;
        }
        if(graph.get(startNode.id).findIndex(n => n.id === key) !== -1){
            costs.set(key, graph.get(startNode.id).find(n => n.id === key).distance);
            continue;
        }
        costs.set(key, Number.POSITIVE_INFINITY);
    }
    return costs;
}

function generateParentsBellmanFord(graph, startNode){
    const parents = new Map();
    for(key of graph.keys()){
        if(key === startNode.id){
            parents.set(key, null);
            continue;
        }
        if(graph.get(startNode.id).findIndex(n => n.id === key) !== -1){
            parents.set(key, startNode.id);
            continue;
        }
        parents.set(key, null);
    }
    return parents;
}

function backTraceRouteBellmanFord(parents, startNodeId, endNodeId){
    const steps = [endNodeId];
    let parent = parents.get(endNodeId);
    while(parent){
        if(steps.includes(parent)){
            throw 'CYCLE FOUND';
        }
        steps.push(parent);
        parent = parents.get(parent);
    }
    return steps.reverse();
}