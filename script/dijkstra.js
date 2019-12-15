function runDijkstra(graph, startNode, endNode){
    const costs = generateCosts(graph, startNode);
    const parents = generateParents(graph, startNode);
    const processed = [];
    let counter = 1;
    let node = getNodeWithLowestPrice(costs, processed, graph);
    while(node){
        const nodeId = node+"";
        setTimeout(() => animateNode(nodeId), 150 * counter);
        counter++;

        const cost = costs.get(node);
        const neighbors = graph.get(node);
        neighbors.forEach(neighbor => {
            const newCost = cost + neighbor.distance;
            if(costs.get(neighbor.id)>newCost){
                costs.set(neighbor.id, newCost);
                parents.set(neighbor.id, node);
            }
        });
        processed.push(node);
        node = getNodeWithLowestPrice(costs, processed, graph);
    }

    setTimeout(() => drawPath(backTraceRouteDijkstra(parents, startNode.id, endNode.id)), 150 * counter+1)
}

function getNodeWithLowestPrice(costs,processed, graph){
    let lowestCost = Number.POSITIVE_INFINITY;
    let lowestCostNodeId = null;
    for(key of costs.keys()){
        if(processed.indexOf(key) !== -1){
            continue;
        }

        const cost = costs.get(key);
        if(cost < lowestCost){
            lowestCost = cost;
            lowestCostNodeId = key; 
        }
    }
    return lowestCostNodeId;
}

function generateCosts(graph, startNode){
    const costs = new Map();
    for(key of graph.keys()){
        if(key === startNode.id){
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

function generateParents(graph, startNode){
    const parents = new Map();
    for(key of graph.keys()){
        if(key === startNode.id){
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

function backTraceRouteDijkstra(parents, startNodeId, endNodeId){
    const steps = [endNodeId];
    let parent = parents.get(endNodeId);
    while(parent){
        steps.push(parent);
        parent = parents.get(parent);
    }
    return steps.reverse();
}