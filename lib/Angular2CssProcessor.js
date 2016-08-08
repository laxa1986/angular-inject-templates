var extend = require('./utils').extend;
var Angular1Processor = require('./Angular1Processor');
var fs = require('fs');
var pathModule = require('path');
var Minimize = require('minimize');

const TEMPLATE_BEGIN = Buffer('styles:[\'');
const TEMPLATE_END = Buffer('\']');

function escapeSingleQuotes(string) {
    const ESCAPING = {
        '\'': '\\\'',
        '\\': '\\\\',
        '\n': '\\n',
        '\r': '\\r',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
    };
    return string.replace(/['\\\n\r\u2028\u2029]/g, function (character) {
        return ESCAPING[character];
    });
}


var Angular2CssProcessor = extend(Angular1Processor, {
    /**
     * @override
     */
    getPattern: function () {
        // for typescript: 'styleUrls: string[] = ["template.css","template1.css"]'
        return '[\'"]?styleUrls[\'"]?[\\s]*:[[\\s]*(.*)]';
    },

    /**
     * @override
     */
    embedTemplate: function (match, templateBuffer) {
        return {
            start: match.index,
            length: match[0].length,
            replace: [TEMPLATE_BEGIN, templateBuffer, TEMPLATE_END]
        }
    },

    replaceMatch: function (fileContext, match, cb, onErr) {
        var result = match[1].split(",");
        var self = this;
        var text = "";
        var embedTemplate = this.embedTemplate.bind(this);
        if (result.length > 1) {
            result.forEach(function (item, idx) {
                item = item.replace(/'|"/g, '');
                self.getFileContent(fileContext, item, onErr).then(function (data) {
                    text += data;
                    if (idx == (result.length - 1)) {
                        var templateBuffer = Buffer(escapeSingleQuotes(text));
                        cb(embedTemplate(match, templateBuffer));
                    }
                });
            });
        }
        else {
            result = match[1].trim();
            var res = result.replace(/'|"/g, '');
            this.getFileContent(fileContext, res, onErr).then(function (data) {
                var templateBuffer = Buffer(escapeSingleQuotes(data));
                cb(embedTemplate(match, templateBuffer));
            });
            ;
        }
    },

    getFileContent: function (fileContext, match, onErr) {
        var relativeTemplatePath = match;
        var templatePath = pathModule.join(fileContext.path, relativeTemplatePath);
        var warnNext = function (msg) {
            this.logger.warn(msg);
            cb();
        }.bind(this);
        var onError = this.config.skipErrors ? warnNext : onErr;

        this.logger.debug('template path: %s', templatePath);
        if (this.config.maxSize) {
            var fileStat = fs.statSync(templatePath);
            if (fileStat && fileStat.size > this.config.maxSize) {
                warnNext('template file "' + templatePath + '" exceeds configured max size "' + this.config.maxSize + '" actual size is "' + fileStat.size + '"');
                return;
            }
        }

        var embedTemplate = this.embedTemplate.bind(this);
        var minimizer = this.minimizer;
        var self = this;
        return new Promise(
            function (resolve, reject) {
                fs.readFile(templatePath, {encoding: self.config.templateEncoding}, function (err, templateContent) {
                    if (err) {
                        onError('Can\'t read template file: "' + templatePath + '". Error details: ' + err);
                        return;
                    }
                    minimizer.parse(templateContent, function (err, minifiedContent) {
                        if (err) {
                            onError('Error while minifying angular template "' + templatePath + '". Error from "minimize" plugin: ' + err);
                            return;
                        }
                        resolve(minifiedContent);
                    });
                });
            });
    }
});

module.exports = Angular2CssProcessor;