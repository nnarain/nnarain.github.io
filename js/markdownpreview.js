var converter = new showdown.Converter();

function getMarkdownPreview(markdownText)
{
    var htmlText = "";
    
    if(markdownText)
    {    
        htmlText = converter.makeHtml(markdownText);
    }
    
    return htmlText;
}
