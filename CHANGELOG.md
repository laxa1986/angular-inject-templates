3.0.0 (next)
==================
  * ability to embed ng-include
  * update javadoc with comparison with gulp-angular-templatecache

2.1.3 / 2016-02-19
==================
  * Added feature to parse ES2015 based class files with this.templateUrl.

2.1.2 / 2016-02-07
==================
  * fix typo in README.md file

2.1.0 / 2016-02-07
==================
  * option to specify source type: javascript or typescript
  * 3 ways to skip embedding: `skipFile` function, `skipTemplate` function and special comment `/*!*/`

2.0.2 / 2016-01-25
==================
  * Fix logging (processed files where logged even if debug = false)

2.0.1 / 2016-01-25
==================
  * Forgot to include 'lib' directory in the list of distribution files

2.0.0 / 2016-01-24
==================
  * Support typescript syntax templateUrl: string = "template.html"

1.1.0 / 2016-01-09
==================
  * Do not change html attributes case (previously ngIf changed to ngif, which causes errors in Angular2.0 beta)

1.0.0 / 2016-01-01
==================
  * Escape only single quotes. Before: `template:'\'\"'`, Now: `template:'\'"'`
  * Checked support of Angular2.0 templates like `<a [router-link]="['/search']">Search</a>`

0.2.1 / 2015-12-31
==================
  * Bug fix: remove \`templateUrl\` support

0.2.0 / 2015-12-31
==================
  * Added ES6 template string quotes \` support (templateUrl: \`/path/to/template.html\`)

0.1.7 / 2015-12-31
==================
  * Added important note into in README.md (embed templates should be used before source maps initialization)
