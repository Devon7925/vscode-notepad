import type { ActivationFunction } from 'vscode-notebook-renderer';
require('./style.css');

declare global {
  interface Window {
    vals: any;
    doUpdate: any;
    expressions: {
      text:string,
      type:string
    }[];
  }
}

const Parser = require('expr-eval').Parser;
const parser = new Parser();

function escapeHTML(str: string) {
  var p = document.createElement("p");
  p.innerText = str;
  return p.innerHTML.replace(/"/g, "\\\"");
}

export const activate: ActivationFunction = () => {
  return {
    renderOutputItem(data, element) {
      if (data.mime === 'x-application/grapher') {
        element.innerHTML = "";
        for (const line of data.text().split(/\r?\n/)) {
          if (line.startsWith("slider ")) {
            const trimmed = line.replace("slider ", "");
            const match_data = /(\w+)(?:\sfrom\s([0-9]+(?:\.[0-9]*)?))?(?:\sto\s([0-9]+(?:\.[0-9]*)?))?(?:\sby\s([0-9]+(?:\.[0-9]*)?))?(?:\sdefault\s([0-9]+(?:\.[0-9]*)?))?/.exec(trimmed);
            if (match_data) {
              let min = match_data[2] ? parseFloat(match_data[2]) : 0;
              let max = match_data[3] ? parseFloat(match_data[3]) : 1;
              let value = match_data[5] ? match_data[5] : (min+max)/2;
              window.vals[match_data[1]] = value;
              element.innerHTML += `<div class="line-box"><img class="math-display" src="https://math.justforfun.click/$/${encodeURI(match_data[1])}"><input class="slider" type="range" min="${min}" max="${max}" value="${value}" step="${match_data[4] ? match_data[4] : 0.01}" oninput="window.vals['${match_data[1]}']=this.value;window.doUpdate();"/><p class="value_display" variable="${match_data[1]}"></p></div>`;
            }
            continue;
          }else if (line.startsWith("display ")) {
            const trimmed = encodeURI(line.replace("display ", ""));
            element.innerHTML += `<div class="line-box"><img class="math-display" src="https://math.justforfun.click/$/${trimmed}"></div>`;
            continue;
          }else if (line.startsWith("value ")) {
            const trimmed = line.replace("value ", "");
            window.expressions.push({text:trimmed,type:"value"});
            element.innerHTML += `<div class="line-box"><img class="math-display" src="https://math.justforfun.click/$/${encodeURI(trimmed)}"><p class="value_display" expression="${trimmed}"></p></div>`;
            continue;
          }
          const match_data = /(\w+)/.exec(line);
          if (match_data) {
            window.expressions.push({text:line,type:"assignment"});
            let newHTML = "";
            newHTML += `<div class="line-box"><img class="math-display" src="https://math.justforfun.click/$/${encodeURI(line)}">`;
            if(!/^\w+=\d+(\.\d*)?$/.test(line)) {
              newHTML += `<p class="value_display" variable="${match_data[1]}"></p>`;
            }
            newHTML += `</div>`;
            element.innerHTML += newHTML;
          }
        }
      }else if (data.mime === 'x-application/grapher/js') {
        'use strict';
        
        const cellContent = data.text();
        let log = "";
        const prevLogFunc = console.log;
        console.log = function() {
          log += [...arguments].map((x)=>x.toString()).join(' ') + '\n';
        };
        let newMathFunctions = eval(`var mathFunctions = {};${cellContent};mathFunctions`);
        console.log = prevLogFunc;
        element.innerText = log;

        parser.functions = {...parser.functions, ...newMathFunctions};
      }
      window.doUpdate();
    }
  };
};
window.vals = {};
window.expressions = [];
window.doUpdate = function () {
  let expressioncache:{[k:string]:string} = {};

  for (const expr of window.expressions) {
    if (expr.type === "assignment") {
      const match_data = /(\w+)/.exec(expr.text);
      if(match_data) {
        try {
          window.vals[match_data[1]] = parser.evaluate(`${expr.text};${match_data[1]}`, window.vals);
        } catch (error) {
          window.vals[match_data[1]] = "null";
        }
      }
    } else if (expr.type === "value") {
      let result:any;
      try {
        result = parser.evaluate(`${expr.text}`, window.vals);
      } catch (error) {
        result = "null";
      }
      expressioncache[expr.text] = result;
    }
  }
  for (const variable in window.vals) {
    document.querySelectorAll("p[variable='" + variable + "']").forEach((elem) => {
      if(typeof window.vals[variable] === 'function') {
        elem.innerHTML = "function";
      }else{
        elem.innerHTML = window.vals[variable];
      }
    });
  };
  for (const expr in expressioncache) {
    document.querySelectorAll(`p[expression='${expr}']`).forEach((elem) => {
      elem.innerHTML = expressioncache[expr];
    });
  }
};