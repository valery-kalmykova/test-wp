// STATIC UTILITY FUNCTIONS
class Utils {
	constructor(){
		if (this instanceof StaticClass) {
			throw Error('A static class cannot be instantiated.');
		}
	}
	static isUrl(url){
		//https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
		return url.search(/(!http(s)?:\/\/)?(www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?]*)/g) !== -1; 
	}
	static isFile(url){
		return Utils.isUrl(url) && new RegExp(/^.*\.(jpg|png|svg|gif|doc|docx|xls|xlsx|ppt|pptx|pdf|zip|rar|7z)$/i).test(url.split("/").pop()) && (url.split("\.").length-1) > 1; 
	}
	static isArray(obj){
		return Array.isArray(obj);
	}
	static verifyLinks(urls){
		return Utils.isArray(urls) ? urls.map(url => "https://" + Utils.verifyLink(url)) : "https://" + Utils.verifyLink(urls);
	}
	static verifyLink(url){
		return url.replace(/^.*?\:/, "").replace("//", "").replaceAll("//", "/"); 
	}
	static linksToRel(urls){
		return Utils.isArray(urls) ? urls.map(url => Utils.linkToRel(url)) : Utils.linkToRel(urls);
	}
	static linkToRel(url){
		let link = url.trim().replace(/.*\:\/\//i, '').replace(/\/\//ig, '/').replace(/.*?\//i, '/');
		return link[0] == "/" ? link : "/"+link;
	}
	static stringToArray(str, delim = "\n"){
		return str.split(delim);
	}
	static arrayToString(arr, delim = "\n"){
		return arr.join(delim);
	}
	static StringArrayToObjectArray(arr, tag = "td"){
		return arr.map(s => {
			let obj = {};
			obj[tag] = s;
			return obj;
		});
	}
	static optionsFromObjectHtml(obj, func = (val) => {return "<option value='"+val+"'>"+val+"</option>"}){
		return Object.values(obj).map(v => func(v)).join("");
	}
	static filterUnique(arr){
		return [... new Set(arr)];
	}
	static getOptionsById(id){
		return [... document.getElementById(id).querySelectorAll("option")].filter(opt => (opt.selected || opt.checked) && opt.value != "");
	}
	static multiSelectValues(id){
		return Utils.getOptionsById(id).map(opt => opt.value);
	}
	static clearValue(id){
		document.getElementById(id).value = "";
	}
	static objectsToTable(data, headArr = undefined){
		// input: 
		// 1) Array of Objects, Array of Arrays of Ojects
		// 2) Table heading (Array of strings)
		// 3) #id of element to modify innerHTML
		return "<table style='text-align: left;'>"+ 
			(headArr ? "<thead><tr>"+headArr.map(h => "<th>"+h+"</th>").join("")+"</tr></thead>" : "") + 
			"<tbody>"+Utils.objectsToTableRows(data)+"</tbody></table>";
	}
	static objectsToTableRows(objArr){
		// Recursive, accepts Array of Objects, Array of Arrays of Ojects
		// Returns HTML string of table rows
		return objArr.map(obj => Array.isArray(obj) ? Utils.objectsToTableRows(obj) : Utils.objectToTableRow(obj) ).join("");
	}
	static objectToTableRow(obj){
		// Accept Object, returns HTML string 1 row of table, filters for Object, arrays, uses "class" key to highlight row.
		return "<tr class='"+(obj["class"] || "")+"'>" + 
			Object.entries(obj)
				.filter(([k, v]) => k != "class" && k != "label" && typeof v != "object")
				.map(([k, v], i) => {
					return	k == "url" ?  "<td><a href='"+obj["url"]+"' target='_blank'>"+(obj["label"] || obj["url"])+"</a></td>" : 
							k == "th" ? "<th>"+obj[k]+"</th>" : 
							k == "b" ? "<td><b>"+obj[k]+"</b></td>" : 
							"<td>"+obj[k]+"</td>";
				})
				.join("") + "</tr>";
	}
}
// OUTPUT MANAGER
class OutputManager{
	constructor(container, buttonList){
		// buttonList = ["html", "text", "xlsx", "open", "input", "download"]
		this.handlers = {
			"html" : this.btnHtml,
			"text" : this.btnText, 
			"xlsx" : this.btnXlsx, 
			"open" : this.btnOpenAll, 
			"input": this.btnOut2In,
			"download": this.btnDownloadAll
		};
		this.buttons = [];
		this.createOutputContainer(container, buttonList);
	}
	createOutputContainer(container, buttonList){
		let label = document.createElement("div");
			label.className = "col sm center";
			label.innerHTML = "<label>Output: <span id='output-total'></span></label>";
		let buttons = document.createElement("div");
			buttons.className = "col lg inline end";
			buttonList.forEach(btn => {
				if (this.handlers[btn]){
					this.buttons[btn] = this.handlers[btn]();
					buttons.appendChild(this.buttons[btn]);
				}
			});
		let controls = document.createElement("div");
			controls.className = "row";
			controls.appendChild(label);
			controls.appendChild(buttons);
		this.output = document.createElement("div");
		this.output.className = "col lg";
		this.output.id = "output-data";
		let output = document.createElement("div");
			output.className = "row";
			output.style = "overflow: auto; margin: 0;";
			output.appendChild(this.output);
		let footer = document.createElement("div");
			footer.className = "col lg"; 
			footer.id = "output-footer";
		container.appendChild(controls);
		container.appendChild(output);
		container.appendChild(footer);
	}
	createControls(){
		let out = document.createElement("div");
		out.className = "col lg";
		buttonList.forEach(btn => {
			if (this.handlers[btn]){
				this.buttons[btn] = this.handlers[btn]();
				out.appendChild(this.buttons[btn]);
			}
		});
		return out;
	}
	btnHtml(){
		let btn = document.createElement("button");
			btn.innerText = "Copy HTML";
			btn.title = "Copy as HTML, with formatting"
			btn.addEventListener("click", () => {
				OutputManager.copy(document.getElementById("output-data").innerHTML);
			});
		return btn;
	}
	btnText(){
		let btn = document.createElement("button");
			btn.innerHTML = "Copy Text";
			btn.title = "Copy as plain text"
			btn.addEventListener("click", () => {
				OutputManager.copy(document.getElementById("output-data").innerText);
			});
		return btn;
	}
	btnXlsx(){
		let btn = document.createElement("button");
			btn.innerHTML = "Download XLSX";
			btn.title = "Download output as an excel spreadsheet"
			btn.addEventListener("click", OutputManager.saveCopydeck);
		return btn;
	}
	btnOpenAll(){
		let btn = document.createElement("button");
			btn.innerHTML = "Open All";
			btn.title = "Open all links in new tabs"
			btn.addEventListener("click", () => {
				let intent = true;
				let urls = [... document.getElementById("output-data").querySelectorAll("a")].map(a => a.href);
					if (urls.length > 40 ){
						intent = confirm("Are you sure you want to open: "+urls.length+" links?");
					}
					if (intent) {
						urls.forEach(u => window.open(u, "_blank"));
					}
			});
		return btn;
	}
	btnDownloadAll(){
		let btn = document.createElement("button");
			btn.innerHTML = "Download Files";
			btn.title = "In any of links is a file, then download it"
			btn.addEventListener("click", () => {
				[... document.getElementById("output-data").querySelectorAll("a")].map(a => a.href).filter(url => Utils.isFile(url)).forEach(u => OutputManager.saveFile(Utils.verifyLinks(u)));
			});
		return btn;
	}
	btnOut2In(target){
		let btn = document.createElement("button");
			btn.innerHTML = "&#129093;&nbsp;INPUT";
			btn.title = "Copy output to input field"
			btn.addEventListener("click", () => {
				target.value = [... document.getElementById("output-data").querySelectorAll("tbody tr")].map(row => row.querySelector("td").innerText).join("\n");
			});
		return btn;
	}
	printOutput(data, heading = undefined){
		this.output.innerHTML = Utils.objectsToTable(data, heading);
	}
	static saveCopydeck(){
		let table = document.getElementById("output").getElementsByTagName("table")[0];
		if (table){
			let rows = [... table.querySelectorAll("tr")].map(row => {
				let cols = [... row.querySelectorAll("th,td")].map(col => {
					let cell = col.innerText;
					return {t: "s", v: (cell ? cell : ""), w: (cell ? cell : ""), s: { alignment: { wrapText: true } } };
				});
				return cols;
			});
			var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows);
			XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
			var filename = prompt("Please enter name for file:", "Url_List_"+ new Date().toJSON().slice(0, 10) );
			if(filename != null) {
				XLSX.writeFile(wb, filename+".xlsx", {bookType:'xlsx', bookSST:true, type: 'binary'});
			}
		}
	}
	static saveFile(url, name = ""){
		fetch(url).then(response => response.blob()).then(blob => {
			const link = document.createElement("a"); 
			link.href = URL.createObjectURL(blob); 
			link.download = name || url.split("/").pop(); 
			link.click(); 
		}).catch(e => {
			Utils.logger("ERROR URL: "+url+"\n"+e); 
		}); 
	}
	static copy(str) {
		function listener(e) {
			e.clipboardData.setData("text/html", str);
			e.clipboardData.setData("text/plain", str);
			e.preventDefault();
		}
		document.addEventListener("copy", listener);
		document.execCommand("copy");
		document.removeEventListener("copy", listener);
	}
	
}

function loadSitesList(){
	let select = document.getElementById("sites");
	let out = "<option value='ng' selected='selected'>ALL NG</option>"
			+ "<option value='en'>ENG</option>"
			+ "<option value='nen'>NON-ENG</option>"
			+ "<option value='lite'>LITE</option>"
			+ "<option value='' disabled>-------</option>";
	out += Object.values(config.sites).map(site => {
		return "<option class='sites-"+(site.tags.includes("lite") ? "lite" : site.tags.includes("en") ? "en" : "full")+"' value='"+site.domain+"'>"+site.domain.toUpperCase()+"</option>";
	}).join("");
	select.innerHTML = out;
	// select.size = select.querySelectorAll("option").length; // Dynamic size
}
function getLocList(){
	let loc = new Array();
	let options = Utils.multiSelectValues("sites") || [];
	options.forEach(opt => {
		// NON-EN
		if (opt === "nen") {
			loc.push("be", "cojp", "combr", "comcn", "comtr", "de", "dk", "es", "fi", "fr", "it", "latam", "me", "nl", "no", "ru", "se");
		}
		// ALL EN
		else if (opt === "en") { 
			loc.push("com", "comau", "coin", "couk", "coza", "me-en", "usa");
		}
		// ALL NG
		else if (opt === "ng") {
			loc.push("be", "coin", "cojp", "com", "comau", "combr", "comcn", "comtr", "couk", "coza", "de", "dk", "es", "fi", "fr", "it", "latam", "me", "me-en", "nl", "no", "ru", "se", "usa");
		}
		// LITE SITES
		else if (opt === "lite") { 
			loc.push("afrique", "bg", "ca", "cafr", "cokr", "comhk", "comtw", "comvn", "coth", "cz", "gr", "hu", "id", "kz", "kzru","ma", "pt", "ro", "rs");
		}
		else {
			loc.push(opt);
		}
	});
	return Utils.filterUnique(loc);
}
function printOutput(data, heading = undefined){
	document.getElementById("output-data").innerHTML = Utils.objectsToTable(data, heading);
	let total = document.getElementById("output-data").querySelectorAll("tr").length;
	document.getElementById("output-total").innerHTML = total ? "("+total+" items)" : "";
}
function getInputArray(){
	return document.getElementById("navigator-input").value.split(/[;,\s\n]+/).map(s => s.trim()).filter(s => s).map(s => s.toLowerCase());
}
function outputAsInput(){
	document.getElementById("navigator-input").value = [... document.getElementById("output-data").querySelectorAll("td")].map(row => row.textContent).join("\n");
}
function extractLinksFromInput(){
	let input = getInputArray().filter(s => Utils.isUrl(s));
	printOutput(input.length ? Utils.StringArrayToObjectArray(input, "url") : [{ class: "err", td: "No Links Found Within Input Field..."}]);
}
function getLinks(){
	let paths = getPaths();
	let locales = getLocList();
	let result = locales.map(loc => getLocLinks(loc, paths));
	printOutput(result);
}
function getLocLinks(site, pages){
	let target = document.getElementById("pub-target").querySelector("input:checked").value;
	let branch = document.getElementById("navigator-branch").value || "master";
	let loc = (site == "cafr" && target != "editor") ? "ca" : site;
	let out = pages.map(page => {
		let res = {};
		if (pages.length == 1) res.th = site.toUpperCase();
		res.url = getDomains(loc, target, branch)+( (site == "cafr" && target != "editor") ? "/fr" : "") + getParams(page);
		return res;
	});
	return (pages.length > 1) ? [{"th": site.toUpperCase()}].concat(out) : out;
}
function getPaths(){
	let vals = document.getElementById("navigator-input").value || "/";
	return vals.split(/[\s,]+/).filter(f => f != "").map(url =>{ 
		let res = Utils.linksToRel(url);
		return ((res == "/" && document.getElementById("pub-target").querySelector("input:checked").value == "editor") ? "/homepage" : res);
	});
}
function getParams(result = ""){
	//let result = "";
	if (document.getElementById("navigator-redirects").checked){
		result+= (result.includes("?") ? "&" : "?")+"ignoreredirects=true";
	}
	if (document.getElementById("navigator-mmzr").checked){
		result+= (result.includes("?") ? "&" : "?")+"no_maxymiser=1";
	}
	if (document.getElementById("navigator-gtm").checked){
		result+= (result.includes("?") ? "&" : "?")+"no_gtm=1";
	}
	if (document.getElementById("navigator-omni").checked){
		result+= (result.includes("?") ? "&" : "?")+"no_omniture=1";
	}
	if (document.getElementById("navigator-geocode").value.length == 2 && !(result.includes("ipcountry") || result.includes("clientgeoip"))){
		result+= (result.includes("?") ? "&" : "?")+document.getElementById("navigator-geo").value+"="+document.getElementById("navigator-geocode").value.toUpperCase();
	}
	if (document.getElementById("navigator-platform").value){
		result+= (result.includes("?") ? "&" : "?")+"platform="+document.getElementById("navigator-platform").value;
	}
	if (document.getElementById("navigator-curdate").value){
		result+= (result.includes("?") ? "&" : "?")+"curdate="+ new Date(document.getElementById("navigator-curdate").value).toJSON().slice(0, 19)+"Z";
	}
	return result;
}
function getDomains(dom, target, branch){
	switch (target) {
		case "live" : return "https://"+config.domains[dom];
		case "rc" : return "https://rc."+dom+".kaspersky-labs.com";
		case "branch" : return "https://"+branch+"_master."+dom+".prod.renderer.kaspersky-labs.com";
		case "license" : return "https://license-local_"+branch+"_master."+dom+".prod.renderer.kaspersky-labs.com";
		case "editor" : return "https://site-editor.kaspersky-labs.com/"+branch+"/"+dom+"/pageEditor";
		case "test" : return "https://"+branch+"_test-st."+dom+".test.renderer.kaspersky-labs.com";
	}
}
function overrideLocalesFromInput(){
	let res = getInputArray().map(str => {
		let match = Object.values(config.sites).filter(site => site.alias.includes(str));
		return match.length ? match[0].domain : undefined;
	}).filter(val => val);
	if (res.length){
		document.getElementById("sites").querySelectorAll("option").forEach(opt => {
			if (res.includes(opt.value)) opt.selected = true;
			else opt.selected = false;
		});
		document.getElementById("navigator-input").value = "";
	}
}

function makeGeoCode(){
	document.getElementById("navigator-geocode-list").innerHTML = config.geoIP.map(c => "<option>"+c+"</option>").join("");
}
function switchTheme(){
	let theme = document.getElementById("theme");
	if (theme) {
		theme.remove();
	}
	else {
		theme = document.createElement("link");
		theme.id = "theme";
		theme.rel = "stylesheet";
		theme.type = "text/css";
		theme.href = "./css/theme-light.css";
		document.head.appendChild(theme);
	}
}
function run(){
	loadSitesList();
	makeGeoCode();
	let output = new OutputManager(document.getElementById("output"), ["html","text","xlsx","open"]);
	let tribute = new Tribute({
			collection: [
				{ 
					trigger: "@", 
					values: Object.entries(config.pages).map(([key, val]) => { return {key: key, value: val} }), 
					selectTemplate: (item) => item.original.value
				},
				{ 
					trigger: "?", 
					values: Object.entries(config.verdicts).map(([key, val]) => { return {key: key, value: val} }), 
					selectTemplate: (item) => "/renewal-center/"+item.original.value+"?serial="+item.original.key
				}
			],
			replaceTextSuffix: "\n"
		});
	tribute.attach(document.getElementById("navigator-input"));
	document.getElementById("navigator-go-btn").addEventListener("click", getLinks);
	document.getElementById("navigator-scope-btn").addEventListener("click", overrideLocalesFromInput);
	document.getElementById("navigator-links-btn").addEventListener("click", extractLinksFromInput);
	document.getElementById("navigator-o2i-btn").addEventListener("click", outputAsInput);
	document.getElementById("theme-btn").addEventListener("click", switchTheme);
	document.getElementById("navigator-trim-btn").addEventListener("click", () => {
		document.getElementById("navigator-input").value = Utils.linksToRel(document.getElementById("navigator-input").value.split('\n')).join("\n");
	});
	document.getElementById("navigator-uniq-btn").addEventListener("click", () => {
		document.getElementById("navigator-input").value = Utils.filterUnique(document.getElementById("navigator-input").value.split('\n')).join("\n");
	});
}
