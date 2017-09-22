var fs = require('fs');
var pathModule = require('path');
var cssProcessor = require('clean-css');
var lessProcessor = require('less');

var extend = require('./utils').extend;
var Angular1Processor = require('./Angular1Processor');

//const TEMPLATE_BEGIN = Buffer('styles:string[]=[');
const TEMPLATE_BEGIN = Buffer('styles:[');
const TEMPLATE_END = Buffer(']');

var Angular2TypeScriptStylesProcessor = extend(Angular1Processor, {
	init : function(config) {
        this._super.init(config);

        if (!this.config.styleOptions) {
            this.config.styleOptions = {};
        }

		var styleType = this.config.styleType;
		var styleOptions = this.config.styleOptions;
	    switch (styleType) {
        	case 'less':
				this.minimizer = {
					template: function(path) {
						return path.replace(/\.css$/, ".less");
					},
					process: function(path, source, cb) {
						var processorOptions = Object.assign({}, styleOptions);
						processorOptions["filename"] = path;
						lessProcessor.render(source, processorOptions, function(err, minified) {
							if (err) {
								cb(minified == null ? err : minified.errors, null);
								return;
							}
							cb(null, minified.css);
						});
					}
				};
            	break;
        	case 'css':
        	default:
            	this.minimizer = {
					template: function(path) {
						return path;
					},
					process: function(path, source, cb) {
						new cssProcessor(styleOptions).minify(source, function(err, minified) {
							if (err) {
								cb(minified.errors, null);
								return;
							}
							cb(null, minified.styles);
						});
					}
				};
    	}
    },
    /**
     * @override
     */
    getPattern : function() {
        // for typescript: 'styleUrls: string[] = ["template.css"]'
        //return '[\'"]?styleUrls[\'"]?[\\s]*:[\\s]*string\[][\\s]*=[\\s]*(\[[^](.[^]*?)\])';
		return '[\'"]?styleUrls[\'"]?[\\s]*:[\\s]*(\[[^](.[^]*?)\])';
    },

	/**
     * Find next "styleUrls:", and try to replace url with content if template available, less then maximum size.
     * This is recursive function: it call itself until one of two condition happens:
     * - error happened (error emitted in pipe and stop recursive calls)
     * - no 'styleUrls' left (call 'fileCallback' and stop recursive calls)
     *
     * @param {Object} fileContext source file content
     * @param {Object} match Regexp.exec result
     * @param {Function} cb to call after match replaced
     * @param {Function} onErr error handler
     */
    replaceMatch : function(fileContext, match, cb, onErr) {
		var urls = JSON.parse(match[1].replace(/'/g, '"'));
        var relativeTemplatePath = match[1];
        var templatePath = pathModule.join(fileContext.path, relativeTemplatePath);
        var warnNext = function(msg) {
            this.logger.warn(msg);
            cb();
        }.bind(this);
        var onError = this.config.skipErrors ? warnNext : onErr;

		var embedTemplate = this.embedTemplate.bind(this);
		var minimizer = this.minimizer;

		var _this = this;
		var templateBuffers = [];
		var numFiles = urls.length;
		urls.map(function (relativeTemplatePath) {
			var templatePath = pathModule.join(fileContext.path, minimizer.template(relativeTemplatePath));
			_this.logger.debug('template path: %s', templatePath);

			if (_this.config.maxSize) {
				var fileStat = fs.statSync(templatePath);
            	if (fileStat && fileStat.size > _this.config.maxSize) {
                	warnNext('template file "' + templatePath + '" exceeds configured max size "' + _this.config.maxSize + '" actual size is "' + fileStat.size + '"');
                	return;
            	}
        	}

 			fs.readFile(templatePath, {encoding: _this.config.templateEncoding}, function(err, templateContent) {
            	if (err) {
                	onError('Can\'t read template file: "' + templatePath + '". Error details: ' + err);
                	return;
            	}
            	minimizer.process(templatePath, templateContent, function (err, minifiedContent) {
                	if (err) {
						onError('Error while minifying angular style template "' + templatePath + '". Error from "style minimizer" plugin: ' + err);
                    	return;
                	}
                	var beginTmpl = templateBuffers.length == 0 ? '\'' : ',\n\'';
            		var num = templateBuffers.push(new Buffer(beginTmpl + _this.escapeSingleQuotes(minifiedContent) + '\''));
					if (num == numFiles) {
						cb(embedTemplate(match, Buffer.concat(templateBuffers)));
					}
            	});
        	});
		});
    },

    /**
     * @override
     */
    embedTemplate : function(match, templateBuffer) {
        return {
            start : match.index,
            length: match[0].length,
            replace: [TEMPLATE_BEGIN, templateBuffer, TEMPLATE_END]
        }
    }
});

module.exports = Angular2TypeScriptStylesProcessor;