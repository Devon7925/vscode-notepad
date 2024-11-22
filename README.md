# Notepad Notebook

This is a work in progress extension to use vscode to take notes in a multimedia format.
It uses vs code's custom notbook capabilities.
![An example image of the notepad](media/example.png)
Using this you can display:

* Well formated text using markdown
* Images using markdown
* Javascript code and it's output using `javascript` language
* Interactive well displayed math using `graph-spec` language
* Display websites inline using `url` language

You can also use `mathFunctions` to define js functions that you can use in the math.

Within math cells you can use:

* `name=value` to define a variable
* `slider name` to create a slider. You can also use the syntax `slider name from 0 to 10 by 1` to define the range of the slider and the smallest change in value. You can choose to disclude any of the terms, but they must be in the same order.
* `display math` to just display math without any effects. Note asciimath is used for rendering.
* `value math` to just display math and it's result when evaluated without any effects.
