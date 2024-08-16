
import * as math from "mathjs";

const urlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

let $url: JQuery<HTMLElement>;
let $time: JQuery<HTMLElement>;
let $input: JQuery<HTMLInputElement>;
let $suggestions: JQuery<HTMLElement>;

let inProgressRequest: JQuery.jqXHR<any> | undefined;

let currentSuggestions = [ ];
let selectedSuggestionIndex = -1;
let selectedSuggestion: HTMLElement | undefined;
let originalQuery = "";
let mathScope = { };
let history: string[] = [ ];
let selectedHistoryIndex = -1;

function onLoad() {
    $url = $("#header-filename");
    $time = $("#header-time");
    $input = $("#search-bar");
    $suggestions = $("#search-suggestions");

    $url.text("[ " + document.URL + " ]");

    updateTime();
    setInterval(updateTime, 1000);

    $input.on("keypress", keypress);
    $input.on("input", input);
    $input.on("keydown", keydown);

    const searchBar = $input[0];
    searchBar.setSelectionRange(0, searchBar.value.length);
    input.bind(searchBar)();
}

function getDateTimeString(): string {
    const dt = new Date();
    const padL = (nr: any, len = 2, chr = `0`) => `${nr}`.padStart(2, chr);

    return `${dt.getFullYear()}-${padL(dt.getMonth()+1)}-${padL(dt.getDate())} ${padL(dt.getHours())}:${padL(dt.getMinutes())}:${padL(dt.getSeconds())}`;
}

function updateTime() {
    $time.text(getDateTimeString());
}

function addSuggestion(suggestion: string) {
    const $suggestion = $(`<p class='suggestion' value='${suggestion}'>${suggestion}</p>`);
    $suggestions.append($suggestion);
}

function setSuggestions(suggestions: string[]) {
    selectedSuggestionIndex = -1;
    currentSuggestions = suggestions;
    $suggestions.html("");
    suggestions.forEach(addSuggestion);
} 

function clearSuggestions() {
    inProgressRequest?.abort();
    selectedSuggestionIndex = -1;
    selectedSuggestion = undefined;
    currentSuggestions = [ ];
    $suggestions.html("");
}

function keydown(this: HTMLInputElement, e: JQuery.KeyDownEvent) {
    if(e.key == "Backspace") {
        // if(!this.value.startsWith("="))
        refreshSearchBar();
        // const terms = this.value.substring(0, this.value.length - 1).trim().split(" ").filter(x => x != "");
        // googleSuggest(terms);
    }
    else if(e.key == "Escape") {
        if(selectedSuggestionIndex == -1 && selectedHistoryIndex == -1) {
            clearSuggestions();
        }
        else {
            selectedHistoryIndex = -1;
            selectedSuggestionIndex = -1;
            updateSelectedSuggestion();
            $input.val(originalQuery);
        }
        e.preventDefault();
    }
    else if(e.key == "ArrowUp") {
        if(currentSuggestions.length == 0) {
            if(selectedHistoryIndex == -1) {
                originalQuery = $input.val()!;
            }
            selectedHistoryIndex += 1;
            if(selectedHistoryIndex >= history.length) {
                selectedHistoryIndex = history.length - 1;
            }
            $input.val(history[selectedHistoryIndex]);
        }
        else {
            if(selectedSuggestionIndex == -1) {
                originalQuery = $input.val()!;
            }
            selectedSuggestionIndex += 1;
            if(selectedSuggestionIndex >= currentSuggestions.length) {
                selectedSuggestionIndex = 0;
            }
            updateSelectedSuggestion();
        }
        e.preventDefault();
    }
    else if(e.key == "ArrowDown") {
        if(currentSuggestions.length == 0) {
            if(selectedHistoryIndex == -1) {
                originalQuery = $input.val()!;
            }
            selectedHistoryIndex -= 1;
            if(selectedHistoryIndex < 0) {
                selectedHistoryIndex = -1;
                $input.val(originalQuery);
            }
            else {
                $input.val(history[selectedHistoryIndex]);
            }
        }
        else {
            if(selectedSuggestionIndex == -1) {
                originalQuery = $input.val()!;
            }
            selectedSuggestionIndex -= 1;
            if(selectedSuggestionIndex < 0) {
                selectedSuggestionIndex = currentSuggestions.length - 1;
            }
            updateSelectedSuggestion();
        }
        e.preventDefault();
    }
}

function updateSelectedSuggestion() {
    if(selectedSuggestion) {
        selectedSuggestion.classList.remove("selected");
        selectedSuggestion.innerText = selectedSuggestion.attributes.getNamedItem("value")?.value!;
    }
    if(selectedSuggestionIndex == -1) return;
    selectedSuggestion = $suggestions.children()[selectedSuggestionIndex];
    selectedSuggestion.classList.add("selected");
    const suggestion = selectedSuggestion.attributes.getNamedItem("value")?.value!;
    selectedSuggestion.innerText = "[ " + suggestion + " ]";
    $input.val(suggestion);
}

function googleSuggest(terms: string[]) {
    inProgressRequest?.abort();
    if(terms.length == 0) return;
    inProgressRequest = $.ajax({
        url: 'https://suggestqueries.google.com/complete/search?client=chrome&q=' + terms.join("+"),
        type: 'GET',
        dataType: 'jsonp',
        success: response => setSuggestions(response[1]),
        error: console.error
    });
}

function refreshSearchBar() {
    input.bind($input[0])();
}

function input(this: HTMLInputElement) {
    const query = this.value;

    if(query.length == 0) {
        clearSuggestions();
        return;
    }

    if(query.startsWith("=")) {
        const result = math.evaluate(query.substring(1), { ...mathScope });
        clearSuggestions();
        if(result !== undefined) {
            const resultString = math.string(result);
            addSuggestion(resultString);
        }
        return;
    }
    else if(!urlRegex.test(query)) {
        const terms = query.trim().split(" ").filter(x => x != "");
        googleSuggest(terms);
    }
}

function keypress(this: HTMLInputElement, e: JQuery.KeyPressEvent) {
    if(e.key != "Enter") return;

    const query = this.value;

    selectedHistoryIndex = -1;
    history.unshift(query);

    if(query.startsWith("=")) {
        math.evaluate(query.substring(1), mathScope);
        $input.val("");
    }
    else if(urlRegex.test(query)) {
        location.href = query;
    }
    else {
        const terms = query.trim().split(" ").filter(x => x != "");
        location.href = "https://www.google.com/search?q=" + terms.join("+");
    }
}

$(onLoad);