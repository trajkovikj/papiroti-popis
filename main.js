// region functions

async function loadPopis() {
    try {
        const response = await fetch('./popis.json');

        if (!response.ok) {
            alert(`HTTP error! status: ${response.status}`);
            return;
        }

        const data = await response.json(); // Converts to JS object
        return data;
    } catch (error) {
        console.error("Failed to load JSON file:", error);
        alert(`Failed to load popis!`);
        return null;
    }
}

async function filterPopis(filter) {
    return new Promise((resolve, reject) => {
        if(filter.type === 'description') {
            window.filteredPopis = window.popis.filter((x) => {
                return x["OPIS"] && filter.searchText && x["OPIS"].toUpperCase().indexOf(filter.searchText.toUpperCase()) !== -1;
            });

            resolve(window.filteredPopis);
        } else if(filter.type === 'code') {
            window.filteredPopis = window.popis.filter((x) => {
                return x["SHIFRA"] && filter.searchText && x["SHIFRA"].toUpperCase().indexOf(filter.searchText.toUpperCase()) !== -1;
            });

            resolve(window.filteredPopis);
        } else {
            reject(`Filter type ${filter.type} is not supported`);
        }
    });
}

async function calculateGrandTotal(data) {
    return new Promise((resolve, reject) => {
        let grandTotal = 0;

        data.forEach((x) => {
            // const rowTotal = calculateRowTotal(x);
            grandTotal = grandTotal + x["TOTAL_KOLICINA"];
        });

        resolve(grandTotal);
    });
}

function calculateRowTotal(row) {
    let grandTotal = 0;

    grandTotal += typeof row["KOLICINA_SALON"] === 'number' ? row["KOLICINA_SALON"] : 0;

    for(let i=1; i<=30; i++) {
        grandTotal += typeof row[`KOLICINA_L${i}`] === 'number' ? row[`KOLICINA_L${i}`] : 0;
    }

    return grandTotal;
}



// endregion

// region grid functions

function getGridColumnDefinitions() {
    const columns = [
        { field: "SHIFRA" },
        { field: "OPIS" },
        { field: "BARKOD" },
        { field: "KOLICINA_SALON", type: 'rightAligned' },
        { field: "SALON" },
    ];

    for(let i=1; i<=30; i++) {
        columns.push({ field: `KOLICINA_L${i}`, type: 'rightAligned'});
        columns.push({ field: `LOKACIJA_${i}` });
    }

    columns.push({ field: "TOTAL_KOLICINA", pinned: 'right', width: 80, type: 'rightAligned'});

    return columns;
}

function getBottomPinnedTotalRow(data) {
    let columnSalonTotal = 0;
    data.forEach((x) => {
        columnSalonTotal += x[`KOLICINA_SALON`];
    });

    const pinnedRow = {
        "SHIFRA": "",
        "OPIS": "",
        "BARKOD": "",
        "KOLICINA_SALON": columnSalonTotal,
        "SALON": "",
    };

    for(let i=1; i<=30; i++) {
        let columnTotal = 0;
        data.forEach((x) => {
            columnTotal += x[`KOLICINA_L${i}`];
        });

        pinnedRow[`KOLICINA_L${i}`] = columnTotal;
        pinnedRow[`LOKACIJA_${i}`] = "";
    }

    let pinnedColumnTotal = 0;
    data.forEach((x) => {
        pinnedColumnTotal += x["TOTAL_KOLICINA"];
    });
    pinnedRow["TOTAL_KOLICINA"] = pinnedColumnTotal;

    return [pinnedRow];
}

function updateGridData(newData) {
    window.gridApi.setGridOption('rowData', newData);

    const pinnedRow = getBottomPinnedTotalRow(newData);
    window.gridApi.setGridOption('pinnedBottomRowData', pinnedRow);
}

function initializeGrid(data) {
    const defaultColDef = {
        editable: false,
        flex: 1,
        minWidth: 100,
        filter: true,
        enableRowGroup: false,
        enablePivot: false,
        enableValue: false,
    };

    const columnDef = getGridColumnDefinitions();

    const gridOptions = {
        theme: agGrid.themeBalham,
        columnDefs: columnDef,
        rowData: data,
        defaultColDef: defaultColDef,
        sideBar: false,
    };

    window.gridApi = agGrid.createGrid(
        document.querySelector("#myGrid"),
        gridOptions,
    );
}

async function onDataUpdate(data) {
    const grandTotal = await calculateGrandTotal(data);
    window.grandTotalSelector.innerText = grandTotal;

    updateGridData(data);
}

// endregion


// region startup

window.searchTypeSelector = document.getElementById("search-type");
window.searchTextSelector = document.getElementById("search-text");
window.grandTotalSelector = document.getElementById("grand-total-value");

document.getElementById('search-button').addEventListener('click', () => {

    const filter = {
        type: window.searchTypeSelector.value,
        searchText: window.searchTextSelector.value,
    };

    filterPopis(filter).then(async (result) => {
        await onDataUpdate(result);
    }).catch((error) => {
        alert(error);
    });
});

document.getElementById('load-full-data-button').addEventListener('click', async () => {
    await onDataUpdate(window.popis);
});

initializeGrid([]);

loadPopis().then(async (popis) => {
    window.popis = popis;

    window.popis.forEach((item) => {
        item["TOTAL_KOLICINA"] = calculateRowTotal(item);
    });

    await onDataUpdate(window.popis);
});


// endregion
