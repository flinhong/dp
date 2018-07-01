// by Frank Lin

function frData() {
    function Init() {

        var fileSelect = document.getElementById('file-upload'),
            fileDrag = document.getElementById('file-drag'),
            submitButton = document.getElementById('submit-button');

        fileSelect.addEventListener('change', fileSelectHandler, false);

        // Is XHR2 available?
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            // File Drop
            fileDrag.addEventListener('dragover', fileDragHover, false);
            fileDrag.addEventListener('dragleave', fileDragHover, false);
            fileDrag.addEventListener('drop', fileSelectHandler, false);
        }
    }

    function fileDragHover(e) {
        var fileDrag = document.getElementById('file-drag');

        e.stopPropagation();
        e.preventDefault();

        fileDrag.className = (e.type === 'dragover' ? 'hover' : 'modal-body file-upload');
    }

    function fileSelectHandler(e) {
        // Fetch FileList object
        var files = e.target.files || e.dataTransfer.files;

        // Cancel event and hover styling
        fileDragHover(e);

        // Process all File objects
        for (var i = 0, f; f = files[i]; i++) {
            parseFile(f);
        }
    }

    // Output
    function output(msg) {
        // Response
        var m = document.getElementById('messages');
        m.innerHTML = msg;
    }

    function parseFile(file) {

        var fileName = file.name;

        var isGood = (/\.(?=txt|csv)/gi).test(fileName);
        if (isGood) {
            //   document.getElementById('start').classList.add("hidden");
            document.getElementById('response').classList.remove("hidden");
            fileName = fileName.split('.')[0];
            console.log("file", fileName);
            $('table').removeClass('hidden');
            $('.input-group').removeClass('hidden');
            $('footer').removeClass('hidden');
            $('#para-table').empty();
            let area = $('#area').val();
            console.log(area);
            readTextFile(file, fileName, area);
        } else {
            document.getElementById('file-image').classList.add("hidden");
            document.getElementById('notimage').classList.remove("hidden");
            document.getElementById('start').classList.remove("hidden");
            document.getElementById('response').classList.add("hidden");
            document.getElementById("file-upload-form").reset();
        }
    }

    function readTextFile(file, fileName, area) {
        area ? area : 0.06;
        var reader = new FileReader();
        var voltages = [];
        var currents = [];
        var currentDensities = [];
        reader.onload = function () {
            var text = reader.result;
            var lines = text.split('\n');
            // console.log(lines);
            // console.log();
            
            if (isNaN(lines[0].split('-')[0]) && isNaN(lines[0].split('/')[0])) { // detec data type, new or old
                console.log('new data');
                for (var line = 0; line < lines.length - 1; line++) {
                    var lineText = lines[line].split('\t');
                    voltages.push(lineText[0] * 1);
                    currents.push(lineText[1] * 1);
                    currentDensities.push(lineText[1] * 1000 / area)
                }
            } else {
                console.log('old data')
                for (var line = 4; line < lines.length - 16; line++) {
                    var lineText = lines[line].split(' ');
                    // console.log(lineText);
                    voltages.push(lineText[0] * 1); // convert string to number
                    currents.push(lineText[8] * 1);
                    currentDensities.push(lineText[16] * 1);
                }
            }

            // console.log(voltages);
            // console.log(currents);
            let lightPower = 100;
            procssData(voltages, currents, currentDensities, fileName, lightPower);
        }
        reader.readAsText(file);
    }

    function procssData(voltages, currents, currentDensities, fileName, lightPower) {

        lightPower ? lightPower : 100;
        let voc = 0;
        let jsc = 0;
        let isc = 0;
        let ff = 0;
        let eff = 0;
        let power = [];

        if (voltages[0] <= 0 ) {
            for (var i = 0; i < voltages.length; i++) {
                if (voltages[i] >= 0 && jsc === 0) {
                    jsc = (currentDensities[i] + currentDensities[i-1]) / 2;
                    isc = (currents[i] + currents[i-1]) / 2;
                }
                if (currentDensities[i] > 0 && voc === 0) {
                    voc = (voltages[i] + voltages[i-1]) / 2;
                }
            }

        } else {
            for (var i = voltages.length - 1; i >= 0; i--) {
                if (voltages[i] <= 0 && jsc === 0) {
                    jsc = (currentDensities[i] + currentDensities[i-1]) / 2;
                    isc = (currents[i] + currents[i-1]) / 2;
                }
                if (currentDensities[i] > 0 && voc === 0) {
                    voc = (voltages[i] + voltages[i-1]) / 2;
                }
            }
        }

        for (var i = 0; i < voltages.length; i++) {
            if (voltages[i] > 0 && voltages[i] < voc) {
                power.push(Math.abs(voltages[i] * currents[i]));
            }
        }

        let pmax = Math.max.apply(Math, power);

        ff = pmax / Math.abs(voc * isc);
        eff = (voc * jsc * ff) / lightPower;

        jsc = Math.abs(jsc).toFixed(4);
        voc = voc.toFixed(4);
        ff = ff.toFixed(4);
        eff = (Math.abs(eff) * 100).toFixed(4);

        console.log("jsc", jsc);
        console.log("voc", voc);
        console.log("pmax", pmax);
        console.log("ff", ff);
        console.log("eff", eff);

        let html = `<tr>
            <th scope="row">${fileName}</th>
            <td>${voc}</td>
            <td>${jsc}</td>
            <td>${ff}</td>
            <td>${eff}</td>
        </tr>`;

        $('#para-table').append(html);
    }

    // Check for the various File API support.
    if (window.File && window.FileList && window.FileReader) {
        Init();
    } else {
        document.getElementById('file-drag').style.display = 'none';
    }
}

frData();