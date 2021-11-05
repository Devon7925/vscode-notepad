import type { ActivationFunction } from 'vscode-notebook-renderer';
import rendererCss from './style.css';

declare global {
  interface Window {
    vals: any;
    doUpdate: any;
    expressions: string[];
  }
}

const Parser = require('expr-eval').Parser;
const parser = new Parser();

export const activate: ActivationFunction = () => {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.textContent = rendererCss;
  document.head.appendChild(style);
  return {
    renderOutputItem(data, element) {
      if (data.mime === 'x-application/grapher') {
        element.innerHTML = "";
        for (const line of data.text().split(/\r?\n/)) {
          if (line.startsWith("slider ")) {
            const trimmed = line.replace("slider ", "");
            const match_data = /(\w+)(?:\sfrom\s([0-9]+(?:\.[0-9]*)?))?(?:\sto\s([0-9]+(?:\.[0-9]*)?))?(?:\sby\s([0-9]+(?:\.[0-9]*)?))?/.exec(trimmed);
            if (match_data) {
              element.innerHTML += `<img src="https://math.justforfun.click/$/${match_data[1]}" style="filter:invert(1)"><input type="range" min="${match_data[2] ? match_data[2] : 0}" max="${match_data[3] ? match_data[3] : 1}" step="${match_data[4] ? match_data[4] : 0.01}" onchange="window.vals['${match_data[1]}']=this.value;window.doUpdate();"/><p class="value_display" variable="${match_data[1]}"></p></br>`;
            }
            continue;
          }
          window.expressions.push(line);
          element.innerHTML += `<img src="https://math.justforfun.click/$/${line}" style="filter:invert(1)"><p class="value_display" variable="${line.split("=")[0]}"></p></br>`;
        }
        // element.innerHTML += `<img src="https://math.azureedge.net/$/sum_{i=1}^100 x_i + y_i"/>`;
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
  for (const expr of window.expressions) {
    const match_data = /(\w+)/.exec(expr);
    if(match_data) {
      try {
        window.vals[match_data[1]] = parser.evaluate(`${expr};${match_data[1]}`, window.vals);
      } catch (error) {
        window.vals[match_data[1]] = 0;
      }
    }
  }
  for (const variable in window.vals) {
    if (document.querySelectorAll("p[variable='" + variable + "']").length > 0) {
      document.querySelectorAll("p[variable='" + variable + "']")[0].innerHTML = window.vals[variable];
    }
  };
};