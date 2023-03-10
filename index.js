// 0000 0001 0010 0011 | 0100 0101 0110 0111 | 1000 1001 1010 1011 | 1100 1101 1110 1111
//    0    1    2    3 |    4    5    6    7 |    8    9   10   11 |   12   13   14   15
// 0000 0001 0011 0010 | 0110 0111 0101 0100 | 1100 1101 1111 1110 | 1010 1011 1001 1000
//    0    1    3    2 |    6    7    5    4 |   12   13   15   14 |   10   11    9    8
const ns = [0, 1, 3, 2, 6, 7, 5, 4, 12, 13, 15, 14, 10, 11, 9, 8];

let inputs;
let outputs;
let numberOfX;
let mapWidth;
let numberOfY;
let mapHeight;
let map;
let mapRowFormulas;
let mapColumnFormulas;
let groups;
let formula;
let handleDontCare;

let mapShowIndices;
let signTrue;
let signFalse;
let signDontCare;
const signAnd = '&#8901;';

class Formula {
	toHtml() {
		return '';
	}

	// TODO: static or private?
	nameToHtml(name, negate) {
		return (negate ? '<span style="text-decoration: overline">' : '<span>') + name + '</span>';
	}
}

// TODO: move into formula class
function getInputName(index, negate) {
	return (negate ? '<span style="text-decoration: overline">' : '<span>') + inputs[index] + '</span>';
}

function getOutput(index) {
	const output = outputs[index];
	if (output == true)
		return signTrue;
	else if (output == false)
		return signFalse;
	else
		return signDontCare;	
}

function toggleOutput(index) {
	const output = outputs[index];
	if (handleDontCare) {
		if (output == true)
			outputs[index] = null;
		else if (output == false)
			outputs[index] = true;
		else
			outputs[index] = false;
	} else {
		outputs[index] = !output;
	}
}

function updateTruthTable() {
	let truthTable = document.getElementById('truth-table');
	while (truthTable.rows.length > 0)
		truthTable.deleteRow(0);

	let truthTableHead = document.createElement('thead');
	truthTable.appendChild(truthTableHead);

	let row = document.createElement('tr');
	truthTableHead.appendChild(row);
	let cell = document.createElement('th');
	row.appendChild(cell);
	cell.classList.add('text-center');
	cell.setAttribute('scope', 'col');
	for (let i = 0; i < inputs.length; i++) {
		cell = document.createElement('th');
		row.appendChild(cell);
		cell.setAttribute('scope', 'col');
		cell.classList.add('text-center');
		cell.innerHTML = getInputName(i, false);
	}
	cell = document.createElement('th');
	row.appendChild(cell);
	cell.classList.add('text-center');
	cell.setAttribute('scope', 'col');
	cell.textContent = 'Y';
	cell.onclick = function () {
		for (let i = 0; i < outputs.length; i++)
			toggleOutput(i);
		update();
	};

	let truthTableBody = document.createElement('tbody');
	truthTable.appendChild(truthTableBody);
//	truthTableBody.className = 'table-group-divider';

	for (let i = 0; i < outputs.length; i++) {
		let row = document.createElement('tr');
		truthTableBody.appendChild(row)
		row.id = 'truth-tr-' + i;
		row.onclick = function () {
			toggleOutput(i);
			update();
		};
		row.onmouseenter = function () {
			let row = document.getElementById('truth-tr-' + i);
			row.classList.add('table-active');
			let cell = document.getElementById('map-td-' + i);
			cell.classList.add('table-active');
		}
		row.onmouseleave = function () {
			let row = document.getElementById('truth-tr-' + i);
			row.classList.remove('table-active');
			let cell = document.getElementById('map-td-' + i);
			cell.classList.remove('table-active');
		}
		let cell = document.createElement('th');
		row.appendChild(cell);
		cell.classList.add('text-center');
		cell.innerHTML = i.toString();
		for (let j = 0; j < inputs.length; j++) {
			cell = document.createElement('td');
			row.appendChild(cell);
			cell.classList.add('text-center');
			cell.innerHTML = (i & 1 << (inputs.length - j - 1)) ? signTrue : signFalse;
		}
		cell = document.createElement('td');
		row.appendChild(cell);
		cell.id = 'truth-td-' + i;
		cell.classList.add('text-center');
		cell.innerHTML = getOutput(i);
	}
}

function updateMap() {
	for (let y = 0; y < mapHeight; y++) {
		for (let x = 0; x < mapWidth; x++) {
			const oi = ns[y] * mapWidth + ns[x];
			const v = outputs[oi];
			map[x][y] = { value: v, outputIndex: oi };
		}
	}

	for (let i = 0; i < mapWidth; i++) {
		let f = '';
		for (let j = 0; j < numberOfX; j++) {
			if (j > 0)
				f += signAnd;
			f += getInputName(numberOfY + j, !(ns[i] & (1 << (numberOfX - j - 1))));
		}
		mapColumnFormulas[i] = f;
	}

	for (let i = 0; i < mapHeight; i++) {
		let f = '';
		for (let j = 0; j < numberOfY; j++) {
			if (j > 0)
				f += signAnd;
			f+= getInputName(j, !(ns[i] & (1 << (numberOfY - j - 1))));
		}
		mapRowFormulas[i] = f;
	}

	let mapTable = document.getElementById('map-table');
	while (mapTable.rows.length > 0)
		mapTable.deleteRow(0);

	let mapTableHead = document.createElement('thead');
	mapTable.appendChild(mapTableHead);
	let row = document.createElement('tr');
	mapTableHead.appendChild(row);
	let cell = document.createElement('th');
	row.appendChild(cell);
	cell.classList.add('text-center');
	for (let i = 0; i < mapWidth; i++) {
		cell = document.createElement('th');
		row.appendChild(cell);
		cell.classList.add('text-center');
		cell.innerHTML = mapColumnFormulas[i];
	}

	let mapTableBody = document.createElement('tbody');
	mapTable.appendChild(mapTableBody);
	for (let i = 0; i < mapHeight; i++) {
		row = document.createElement('tr');
		mapTableBody.appendChild(row);

		cell = document.createElement('th');
		row.appendChild(cell);
		cell.classList.add('text-center');
		cell.classList.add('align-middle');
		cell.innerHTML = mapRowFormulas[i];

		for (let j = 0; j < mapWidth; j++) {
			const outputIndex = map[j][i].outputIndex;
			cell = document.createElement('td');
			row.appendChild(cell);
			cell.id = 'map-td-' + outputIndex;
			cell.classList.add('text-center');
			let html = getOutput(outputIndex);
			if (mapShowIndices)
				html += '<p style="font-size:8px; margin:0">' + outputIndex + '&nbsp;|&nbsp;' + outputIndex.toString(2).padStart(inputs.length, '0') + '</p>';
			cell.innerHTML = html;
			cell.onclick = function () {
				toggleOutput(outputIndex);
				update();
			};
			cell.onmouseenter = function () {
				let row = document.getElementById('truth-tr-' + outputIndex);
				row.classList.add('table-active');
				let cell = document.getElementById('map-td-' + outputIndex);
				cell.classList.add('table-active');
			}
			cell.onmouseleave = function () {
				let row = document.getElementById('truth-tr-' + outputIndex);
				row.classList.remove('table-active');
				let cell = document.getElementById('map-td-' + outputIndex);
				cell.classList.remove('table-active');
			}
		}
	}
}

function getGroup(x, y, width, height) {
	let result = { outputs: [], formula: '' };

	let d = 0;
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			const m = map[(x + i) % mapWidth][(y + j) % mapHeight];
			if (m.value == false)
				return null;
			else if (m.value == null)
				d++;
			result.outputs.push(m.outputIndex);
		}
	}

	if (d == (width * height)) 
		return null;

	result.outputs.sort(function(a, b) { return a - b });

	if (width == mapWidth && height == mapHeight) {
		result.formula = '1';
	} else if (width == 1 && height == 1) {
		result.formula = mapRowFormulas[y] + signAnd + 
			mapColumnFormulas[x];
	} else if (width == mapWidth && height == 1) {
		result.formula = mapRowFormulas[y];
	} else if (width == 1 && height == mapHeight) {
		result.formula = mapColumnFormulas[x];
	} else {
	// TODO: build up formula
		result.formula = '';
	}

	return result;
}

function updateGroups() {
	let groupsTable = document.getElementById('groups-table');
	while (groupsTable.rows.length > 0)
		groupsTable.deleteRow(0);

	groups = new Array();

	let g = getGroup(0, 0, mapWidth, mapHeight);
	if (g != null) {
		groups.push(g);
	} else {
		// TODO: columns
		//for (let j = numberOfX - 1; j > 0; j--) {
			for (let i = 0; i < mapWidth; i++) {
				g = getGroup(i, 0, 1, mapHeight);
				if (g != null)
					groups.push(g);
			}
		//}
		// TODO: rows
		//for (let j = numberOfX - 1; j > 0; j--) {
			for (let i = 0; i < mapHeight; i++) {
				g = getGroup(0, i, mapWidth, 1);
				if (g != null)
					groups.push(g);
			}
		//}

		// TODO: boxes size > 1
	}

	for (let x = 0; x < mapWidth; x++) {
		for (let y = 0; y < mapHeight; y++) {
			const m = map[x][y];
			if (m.value != true)
				continue;
			let alone = true;
			for (g of groups) {
				if (g.outputs.indexOf(m.outputIndex) > -1) {
					alone = false;
					break;
				}
			}
			if (alone) {
				g = getGroup(x, y, 1, 1);
				groups.push(g);
			}
		}
	}

	if (groups.length == 0) {
		formula = '0';
	} else {
		formula = '';
		for (let i = 0; i < groups.length; i++) {
			let g = groups[i];
			if (i > 0)
				formula += '+';
			formula += g.formula;
		}
	}

 	let groupsTableHead = document.createElement('thead');
 	groupsTable.appendChild(groupsTableHead);
	let row = document.createElement('tr');
	groupsTableHead.appendChild(row);
	let cell = document.createElement('th');
	row.appendChild(cell);
	cell = document.createElement('th');
	row.appendChild(cell);
	cell.textContent = 'Outputs';
	cell = document.createElement('th');
	row.appendChild(cell);
	cell.textContent = 'Formula';

 	let groupsTableBody = document.createElement('tbody');
 	groupsTable.appendChild(groupsTableBody);
 	for (let i = 0; i < groups.length; i++) {
 		row = document.createElement('tr');
 		groupsTableBody.appendChild(row);
		row.id = 'groups-tr-' + i;
		row.onmouseenter = function () {
			let row = document.getElementById('groups-tr-' + i);
			row.classList.add('table-active');
			for (let j = 0; j < groups[i].outputs.length; j++) {
				let outputIndex = groups[i].outputs[j];
				let row = document.getElementById('truth-tr-' + outputIndex);
				row.classList.add('table-active');
				let cell = document.getElementById('map-td-' + outputIndex);
				cell.classList.add('table-active');
			}
		}
		row.onmouseleave = function () {
			let row = document.getElementById('groups-tr-' + i);
			row.classList.remove('table-active');
			for (let j = 0; j < groups[i].outputs.length; j++) {
				let outputIndex = groups[i].outputs[j];
				let row = document.getElementById('truth-tr-' + outputIndex);
				row.classList.remove('table-active');
				let cell = document.getElementById('map-td-' + outputIndex);
				cell.classList.remove('table-active');
			}
		}

 		cell = document.createElement('th');
 		row.appendChild(cell);
		cell.textContent = i + 1;
		cell.classList.add('text-center');

		cell = document.createElement('td');
		row.appendChild(cell);
		cell.textContent = groups[i].outputs.join(', ');

		cell = document.createElement('td');
		row.appendChild(cell);
		cell.innerHTML = groups[i].formula;
	}

	let span = document.getElementById('formula');
	span.innerHTML = formula;
}

function update() {
	updateTruthTable();
	updateMap();
	updateGroups();
}

function setNumberOfInputs(n) {
	let r = document.getElementById('number-of-inputs-' + n);
	r.checked= true;

	inputs = new Array(n);
	for (let i = 0; i < inputs.length; i++) {
		inputs[i] = String.fromCharCode(65 + i);
	}

	outputs = new Array(1 << inputs.length);
	for (let i = 0; i < outputs.length; i++) {
		outputs[i] = false;
	}

	numberOfX = Math.floor(inputs.length / 2);
	mapWidth = 1 << numberOfX;
	numberOfY = Math.ceil(inputs.length / 2);
	mapHeight = 1 << numberOfY;

	if (map == null) {
		map = new Array(mapWidth);
		for (let x = 0; x < mapWidth; x++)
			map[x] = new Array(mapHeight);
	} else {
		while (map.length < mapWidth)
			map.push(new Array(mapHeight));
		for (let x = 0; x < mapWidth; x++) {
			while (map[x].length < mapHeight)
				map[x].push({});
		}
	}

	mapColumnFormulas = new Array(mapWidth);
	mapRowFormulas = new Array(mapHeight);
}

function setHandleDontCare(v) {
	let r = document.getElementById('handle-dontcare-' + (v ? 'yes' : 'no'));
	r.checked= true;

	handleDontCare = v;

	for (let i = 0; i < outputs.length; i++) {
		if (outputs[i] == null) 
			outputs[i] = false;
	}
}

function setDisplayStyle(n) {
	let r = document.getElementById('display-style-' + n);
	r.checked= true;

	switch (n) {
		case 1:
			signTrue = '1';
			signFalse = '&nbsp;';
			signDontCare = 'x';
			break;
		case 2:
			signTrue = '1';
			signFalse = '0';
			signDontCare = 'x';
			break;
		case 3:
			signTrue = '1';
			signFalse = '0';
			signDontCare = '&nbsp;';
			break;
	}
}

function setMapShowIndices(v) {
	let r = document.getElementById('map-showindices-' + (v ? 'yes' : 'no'));
	r.checked= true;

	mapShowIndices = v;
}

window.onload = function () {
	setNumberOfInputs(4);
	setHandleDontCare(true);
	setDisplayStyle(1);
	setMapShowIndices(true);

	outputs[4] = true;
	outputs[5] = true;
	outputs[6] = true;
	outputs[7] = true;

	update();
}
 