const uniColors = {
	"Brock University": "red",
	"Ontario Tech University": "#003C71",
	"University of Waterloo": "#a28900",
	"University of Waterloo – St. Jerome's University": "#a28900",
	"University of Waterloo – Renison University College": "#a28900",
	"Algoma University": "#B3282D",
	"Toronto Metropolitan University": "#004C9B",
	"University of Windsor": "#005596",
	"University of Ottawa": "#8F001A",
	"University of Ottawa – Saint Paul University": "#8F001A",
	"York University": "#FF1908",
	"York University – Glendon Campus": "#FF1908",
	"OCAD University": "black",
	"Trent University": "#003E2D",
	"University of Guelph": "#DDA017",
	"University of Guelph-Humber": "#DDA017",
	"Trent University – Durham Greater Toronto Area": "#003E2D",
	"Lakehead University": "#00427A",
	"Wilfrid Laurier University": "#330072",
	"Wilfrid Laurier University – Brantford Campus": "#330072",
	"Wilfrid Laurier University – Milton Campus": "#330072",
	"Laurentian University": "#FCC917",
	"University of Toronto": "#002A5C",
	"University of Toronto – Mississauga": "#002A5C",
	"University of Toronto – Scarborough": "#002A5C",
	"Carleton University": "#e41c37",
	"Queen's University": "#11335D",
	"Western University": "#4F2683",
	"Western University – Huron University College": "#4F2683",
	"Western University – King's University College": "#4F2683",
	"McMaster University": "#990033",
	"Nipissing University": "#007F60",
	"Royal Military College of Canada": "#FF0000",
};

const data = {
	programs: [],
	programDict: {},
	responses: [],
	universities: [],
	container: null,
	content: null,
	header: null,
	tooltip: null,
	searchTerm: ""
};

const gradeColors = {
	80: "#FF0000",
	81: "#FF1A00",
	82: "#FF3400",
	83: "#FF4E00",
	84: "#FF6900",
	85: "#FF8300",
	86: "#FF9D00",
	87: "#FFB700",
	88: "#FFD200",
	89: "#FFEC00",
	90: "#F7FF00",
	91: "#DDFA00",
	92: "#C3F600",
	93: "#A9F100",
	94: "#8FEB00",
	95: "#75E700",
	96: "#5AE200",
	97: "#40DC00",
	98: "#26D800",
	99: "#0CD300",
	100: "#0CC000"
};

function getGradeColor(grade) {
	if (grade < 80) {
		return gradeColors[80];
	}
	return gradeColors[Math.round(grade)];
}

const components = {
	program: (program) => {
		program.responses = program.responses.sort((a, b) => a.avg - b.avg);
		const avg = program.responses.reduce((acc, val) => acc + val.avg, 0) / program.responses.length;
		const rounded = Math.round(avg * 10) / 10;

		let bottomQuartile = 0, topQuartile = 0;

		if (program.responses.length) {
			bottomQuartile = program.responses[Math.floor(program.responses.length / 4)].avg;
			topQuartile = program.responses[Math.floor(3 * program.responses.length / 4)].avg;
		}

		return `
			<div class="program">
				<span class="programUni" style="color: ${uniColors[program.uni]}">${program.uni.toLowerCase()}</span>
				<span class="programTitle">${program.title}</span>
				<span class="programCode" title="OUAC program code">${program.code}</span>
				<div class="programData">
					${program.responses.length
						? `<span>
							<b>${program.responses.length}</b> responses &bull;
							<b class="programGrade" style="color: ${getGradeColor(rounded)}">${rounded}</b> average &bull;
							<b class="programGrade" style="color: ${getGradeColor(bottomQuartile)}">${bottomQuartile}</b> bottom quartile &bull;
							<b class="programGrade" style="color: ${getGradeColor(topQuartile)}">${topQuartile}</b> top quartile</span>`
						: "No responses yet"
					}
				</div>
				${program.responses.length ? `<span class="programButton" onclick="createGraph(this.parentElement, this, '${program.code}')">Show graph</span>` : ""}
			</div>
		`;
	},
	header: (responses, programsWithResponses) => {
		return `
			<div id="header">
				<h1>Ontario University Acceptances</h1>
				<p>This website lists the averages of people accepted into Ontario university programs. There are a total of <b>${responses}</b> responses for <b>${programsWithResponses}</b> programs. The data is from 2022 to 2024.</p>
				<p>Disclaimer: This data is user-generated and may be inaccurate or biased. Take it with a grain of salt, and make sure to do lots of research before applying!</p>
				<p>To contribute to this website, submit <a href="https://forms.gle/tU3hYmNkEVHHcJjT8" target="_blank">this form</a>.</p>
				<input placeholder="Search for university or program..." id="headerInput">
			</div>
		`;
	},
	graph: (percentages) => {
		if (percentages.length === 0) {
			return "";
		}

		let min = window.innerWidth < 600 ? 85 : 80, max = 100;
		for (let percentage of percentages) {
			min = Math.min(min, Math.round(percentage));
		}

		const arr = new Array(max - min + 1).fill(0);
		for (let percentage of percentages) {
			arr[Math.round(percentage) - min]++;
		}

		let maxNums = 0;
		for (let num of arr) {
			maxNums = Math.max(maxNums, num);
		}

		let result = ``;

		for (let i = min; i <= max; i++) {
			result += `
				<div
					class="graphLine ${arr[i - min] ? "" : "graphLineZero"}"
					data-count="${arr[i - min]}"
					data-percent="${i}"
					style="
						height: ${250 * arr[i - min] / maxNums}px;
						background: ${gradeColors[i] || "red"}
					">
					${max - min > 10 && i % 2 === 0 ? i : ""}
				</div>
			`;
		}

		return `
			<div class="graph">
				${result}
			</div>
		`;
	}
};

const views = {
	main: () => {
		data.content.innerHTML = ``;

		const filtered = [];

		for (let program of data.programs) {
			let toAdd = true;
			for (let word of data.searchTerm.split(" ")) {
				if (!program.title.toLowerCase().includes(word.toLowerCase()) && !program.uni.toLowerCase().includes(word.toLowerCase())) {
					toAdd = false;
				}
			}
			if (toAdd) {
				filtered.push(program);
			}
		}

		const sorted = filtered.sort((a, b) => b.responses.length - a.responses.length);

		for (let i = 0; i < Math.min(10, sorted.length); i++) {
			const program = sorted[i];

			data.content.innerHTML += components.program(program);
		}
	}
};

function readCsvLine(line) {
	let inQuotes = false;
	let current = "";
	const result = [];

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === "," && !inQuotes) {
			result.push(current);
			current = "";
		} else if (char === "\"") {
			inQuotes = !inQuotes;
		} else {
			current += char;
		}
	}

	result.push(current);
	return result;
}

function createGraph(elem, textElem, programCode) {
	if (elem.querySelector(".graph")) {
		textElem.innerText = "Show graph";
		elem.querySelector(".graph").remove();
		return;
	}

	textElem.innerText = "Hide graph";
	elem.innerHTML += components.graph(data.programDict[programCode].responses.map(response => response.avg));

	const graph = elem.querySelector(".graph");
	const lines = graph.querySelectorAll(".graphLine");

	for (let line of lines) {
		line.onmouseover = function() {
			if (!data.tooltip) {
				data.tooltip = document.createElement("div");
				data.tooltip.className = "tooltip";
				document.body.appendChild(data.tooltip);
			}

			data.tooltip.style.display = "block";
			data.tooltip.style.left = this.offsetLeft > window.innerWidth / 2 ? `${this.offsetLeft - 125}px` : `${this.offsetLeft + this.clientWidth}px`;
			data.tooltip.style.top = `${this.offsetTop}px`;
			data.tooltip.innerHTML = `<b style="font-size: 1.1em">${this.getAttribute("data-percent")}%</b><br>Count: ${this.getAttribute("data-count")}`;
		}

		line.onmouseout = function() {
			if (data.tooltip) {
				data.tooltip.remove();
				data.tooltip = null;
			}
		}
	}
}

window.addEventListener("load", () => {
	data.programs = PROGRAM_DATA;
	data.container = document.getElementById("container");
	data.content = document.getElementById("content");
	data.header = document.getElementById("header");

	for (let program of data.programs) {
		program["responses"] = [];
		data.programDict[program.code] = program;

		if (!data.universities.includes(program.uni)) {
			data.universities.push(program.uni);
		}
	}

	for (let line of ALL_RESPONSES.split("\n")) {
		const parsed = readCsvLine(line);

		data.responses.push({
			code: parsed[0],
			avg: Number(parsed[1]),
			date: parsed[2],
			ecs: parsed[3],
			status: parsed[4],
			year: parsed[5]
		});
	}

	for (let response of data.responses) {
		const program = data.programDict[response.code];

		if (!program) {
			continue;
		}

		program["responses"].push(response);
	}

	let numWithResponses = 0;
	for (let program of data.programs) {
		numWithResponses += program.responses.length ? 1 : 0;
	}

	header.innerHTML = components.header(data.responses.length, numWithResponses);
	views.main();

	document.querySelector("#headerInput").oninput = function() {
		data.searchTerm = this.value;
		views.main();
	}
});