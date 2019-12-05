function contextMenuItem(content, callback){
    return {
        content,
        onClick: callback
    }
}

function generateContextMenuItem(item){
    const listItem = document.createElement('li');
    listItem.addEventListener('click', () => {
        hideContextMenu();
        item.onClick();
    });
    listItem.innerHTML = item.content;
    return listItem;
}

function hideContextMenu(){
    if(contextMenuVisible()){
        const contextMenu = document.querySelector('.context-menu');
        document.querySelector('body').removeChild(contextMenu);
    }
}

function contextMenuVisible(){
    return !!document.querySelector('.context-menu');
}

function drawContextMenu(left, top, items){
    if(contextMenuVisible()){
        hideContextMenu();
    }

    window.addEventListener('click', e => {
        if(contextMenuVisible){hideContextMenu()}
    });

    //create context menu
    const container = document.createElement('div');
    container.classList.add('context-menu');
    container.style.display = 'block';
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    const ul = document.createElement('ul');
    items.forEach(item => {
        ul.appendChild(generateContextMenuItem(item));
    });
    container.appendChild(ul);
    document.querySelector('body').appendChild(container);
}

//drawContextMenu(0,0,[contextMenuItem('first', () => alert('xd')),contextMenuItem('second', () => alert('xd')),contextMenuItem('third', () => alert('xd'))])