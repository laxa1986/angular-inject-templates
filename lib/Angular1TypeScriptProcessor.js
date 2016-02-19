var extend = require('./utils').extend;
var Angular1Processor = require('./Angular1Processor');

const TEMPLATE_BEGIN = Buffer('this.template:string=\'');
const TEMPLATE_END = Buffer('\'');

var Angular2TypeScriptProcessor = extend(Angular1Processor, {
    /**
     * @returns {String} pattern to search
     */
    getPattern : function() {
        // for typescript: 'templateUrl: string = "template.html"'
        return '[\'"]?this\.templateUrl[\'"]?[\\s]*:[\\s]*string[\\s]*=[\\s]*[\'"`]([^\'"`]+)[\'"`]';
    },

    embedTemplate : function(match, templateBuffer) {
        return {
            start : match.index,
            length: match[0].length,
            replace: [TEMPLATE_BEGIN, templateBuffer, TEMPLATE_END]
        }
    }
});

module.exports = Angular2TypeScriptProcessor;
