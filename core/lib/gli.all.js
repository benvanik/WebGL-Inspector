// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  Øyvind Sean Kinsey http://kinsey.no/blog (2010)
//
// Information and discussions
// http://jspoker.pokersource.info/skin/test-printstacktrace.html
// http://eriwen.com/javascript/js-stack-trace/
// http://eriwen.com/javascript/stacktrace-update/
// http://pastie.org/253058
//
// guessFunctionNameFromLines comes from firebug
//
// Software License Agreement (BSD License)
//
// Copyright (c) 2007, Parakey Inc.
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above
//   copyright notice, this list of conditions and the
//   following disclaimer.
//
// * Redistributions in binary form must reproduce the above
//   copyright notice, this list of conditions and the
//   following disclaimer in the documentation and/or other
//   materials provided with the distribution.
//
// * Neither the name of Parakey Inc. nor the names of its
//   contributors may be used to endorse or promote products
//   derived from this software without specific prior
//   written permission of Parakey Inc.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
// IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
// OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

/**
* Main function giving a function stack trace with a forced or passed in Error 
*
* @cfg {Error} e The error to create a stacktrace from (optional)
* @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
* @return {Array} of Strings with functions, lines, files, and arguments where possible 
*/
function printStackTrace(options) {
    var ex = (options && options.e) ? options.e : null;
    var guess = options ? !!options.guess : true;

    var p = printStackTrace.cachedImpl || new printStackTrace.implementation();
    printStackTrace.cachedImpl = p;
    var result = p.run(ex);
    return (guess) ? p.guessFunctions(result) : result;
}

printStackTrace.implementation = function () { };

printStackTrace.implementation.prototype = {
    
    // CHANGE: cache all regular expressions
    regex: {
        chromeReplaces: [
            [/^[^\n]*\n/, ''],
            [/^[^\n]*\n/, ''],
            [/^[^\(]+?[\n$]/gm, ''],
            [/^\s+at\s+/gm, ''],
            [/^Object.<anonymous>\s*\(/gm, '{anonymous}()@']
        ],
        firefoxReplaces: [
            [/^[^\n]*\n/, ''],
            [/(?:\n@:0)?\s+$/m, ''],
            [/^\(/gm, '{anonymous}(']
        ],
        fnRE: /function\s*([\w\-$]+)?\s*\(/i,
        reStack: /\{anonymous\}\(.*\)@(\w+:\/\/([\-\w\.]+)+(:\d+)?[^:]+):(\d+):?(\d+)?/,
        reFunctionArgNames: /function ([^(]*)\(([^)]*)\)/,
        reGuessFunction: /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(function|eval|new Function)/
    },

    run: function (ex) {
        // Use either the stored mode, or resolve it
        var mode = this._mode || this.mode();
        if (mode === 'other') {
            return this.other(arguments.callee);
        } else {
            ex = ex ||
                (function () {
                    try {
                        var _err = __undef__ << 1;
                    } catch (e) {
                        return e;
                    }
                })();
            return this[mode](ex);
        }
    },

    /**
    * @return {String} mode of operation for the environment in question.
    */
    mode: function () {
        try {
            var _err = __undef__ << 1;
        } catch (e) {
            if (e['arguments']) {
                return (this._mode = 'chrome');
            } else if (window.opera && e.stacktrace) {
                return (this._mode = 'opera10');
            } else if (e.stack) {
                return (this._mode = 'firefox');
            } else if (window.opera && !('stacktrace' in e)) { //Opera 9-
                return (this._mode = 'opera');
            }
        }
        return (this._mode = 'other');
    },

    /**
    * Given a context, function name, and callback function, overwrite it so that it calls
    * printStackTrace() first with a callback and then runs the rest of the body.
    * 
    * @param {Object} context of execution (e.g. window)
    * @param {String} functionName to instrument
    * @param {Function} function to call with a stack trace on invocation
    */
    instrumentFunction: function (context, functionName, callback) {
        context = context || window;
        context['_old' + functionName] = context[functionName];
        context[functionName] = function () {
            callback.call(this, printStackTrace());
            return context['_old' + functionName].apply(this, arguments);
        };
        context[functionName]._instrumented = true;
    },

    /**
    * Given a context and function name of a function that has been
    * instrumented, revert the function to it's original (non-instrumented)
    * state.
    *
    * @param {Object} context of execution (e.g. window)
    * @param {String} functionName to de-instrument
    */
    deinstrumentFunction: function (context, functionName) {
        if (context[functionName].constructor === Function &&
                context[functionName]._instrumented &&
                context['_old' + functionName].constructor === Function) {
            context[functionName] = context['_old' + functionName];
        }
    },

    /**
    * Given an Error object, return a formatted Array based on Chrome's stack string.
    * 
    * @param e - Error object to inspect
    * @return Array<String> of function calls, files and line numbers
    */
    chrome: function (e) {
        // CHANGE: use replacement list
        var chromeReplaces = this.regex.chromeReplaces;
        var x = e.stack;
        for (var n = 0; n < chromeReplaces.length; n++) {
            x = x.replace(chromeReplaces[n][0], chromeReplaces[n][1]);
        }
        return x.split('\n');
        //return e.stack.replace(/^[^\n]*\n/, '').replace(/^[^\n]*\n/, '').replace(/^[^\(]+?[\n$]/gm, '').replace(/^\s+at\s+/gm, '').replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').split('\n');
    },

    /**
    * Given an Error object, return a formatted Array based on Firefox's stack string.
    * 
    * @param e - Error object to inspect
    * @return Array<String> of function calls, files and line numbers
    */
    firefox: function (e) {
        // CHANGE: use replacement list
        var firefoxReplaces = this.regex.firefoxReplaces;
        var x = e.stack;
        for (var n = 0; n < firefoxReplaces.length; n++) {
            x = x.replace(firefoxReplaces[n][0], firefoxReplaces[n][1]);
        }
        return x.split('\n');
        //return e.stack.replace(/^[^\n]*\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
    },

    /**
    * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
    * 
    * @param e - Error object to inspect
    * @return Array<String> of function calls, files and line numbers
    */
    opera10: function (e) {
        var stack = e.stacktrace;
        var lines = stack.split('\n'), ANON = '{anonymous}',
            lineRE = /.*line (\d+), column (\d+) in ((<anonymous function\:?\s*(\S+))|([^\(]+)\([^\)]*\))(?: in )?(.*)\s*$/i, i, j, len;
        for (i = 2, j = 0, len = lines.length; i < len - 2; i++) {
            if (lineRE.test(lines[i])) {
                var location = RegExp.$6 + ':' + RegExp.$1 + ':' + RegExp.$2;
                var fnName = RegExp.$3;
                fnName = fnName.replace(/<anonymous function\s?(\S+)?>/g, ANON);
                lines[j++] = fnName + '@' + location;
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Opera 7.x-9.x only!
    opera: function (e) {
        var lines = e.message.split('\n'), ANON = '{anonymous}',
            lineRE = /Line\s+(\d+).*script\s+(http\S+)(?:.*in\s+function\s+(\S+))?/i,
            i, j, len;

        for (i = 4, j = 0, len = lines.length; i < len; i += 2) {
            //TODO: RegExp.exec() would probably be cleaner here
            if (lineRE.test(lines[i])) {
                lines[j++] = (RegExp.$3 ? RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 : ANON + '()@' + RegExp.$2 + ':' + RegExp.$1) + ' -- ' + lines[i + 1].replace(/^\s+/, '');
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Safari, IE, and others
    other: function (curr) {
        var ANON = '{anonymous}', fnRE = this.regex.fnRE,
            stack = [], j = 0, fn, args;

        var maxStackSize = 10;
        while (curr && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments']);
            stack[j++] = fn + '(' + this.stringifyArguments(args) + ')';
            curr = curr.caller;
        }
        return stack;
    },

    /**
    * Given arguments array as a String, subsituting type names for non-string types.
    *
    * @param {Arguments} object
    * @return {Array} of Strings with stringified arguments
    */
    stringifyArguments: function (args) {
        for (var i = 0; i < args.length; ++i) {
            var arg = args[i];
            if (arg === undefined) {
                args[i] = 'undefined';
            } else if (arg === null) {
                args[i] = 'null';
            } else if (arg.constructor) {
                if (arg.constructor === Array) {
                    if (arg.length < 3) {
                        args[i] = '[' + this.stringifyArguments(arg) + ']';
                    } else {
                        args[i] = '[' + this.stringifyArguments(Array.prototype.slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(Array.prototype.slice.call(arg, -1)) + ']';
                    }
                } else if (arg.constructor === Object) {
                    args[i] = '#object';
                } else if (arg.constructor === Function) {
                    args[i] = '#function';
                } else if (arg.constructor === String) {
                    args[i] = '"' + arg + '"';
                }
            }
        }
        return args.join(',');
    },

    sourceCache: {},

    /**
    * @return the text from a given URL.
    */
    ajax: function (url) {
        var req = this.createXMLHTTPObject();
        if (!req) {
            return;
        }
        req.open('GET', url, false);
        req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
        req.send('');
        return req.responseText;
    },

    /**
    * Try XHR methods in order and store XHR factory.
    *
    * @return <Function> XHR function or equivalent
    */
    createXMLHTTPObject: function () {
        var xmlhttp, XMLHttpFactories = [
            function () {
                return new XMLHttpRequest();
            }, function () {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }, function () {
                return new ActiveXObject('Msxml3.XMLHTTP');
            }, function () {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                this.createXMLHTTPObject = XMLHttpFactories[i];
                return xmlhttp;
            } catch (e) { }
        }
    },

    /**
    * Given a URL, check if it is in the same domain (so we can get the source
    * via Ajax).
    *
    * @param url <String> source url
    * @return False if we need a cross-domain request
    */
    isSameDomain: function (url) {
        return url.indexOf(location.hostname) !== -1;
    },

    /**
    * Get source code from given URL if in the same domain.
    *
    * @param url <String> JS source URL
    * @return <String> Source code
    */
    getSource: function (url) {
        if (!(url in this.sourceCache)) {
            this.sourceCache[url] = this.ajax(url).split('\n');
        }
        return this.sourceCache[url];
    },

    guessFunctions: function (stack) {
        for (var i = 0; i < stack.length; ++i) {
            var reStack = this.regex.reStack;
            var frame = stack[i], m = reStack.exec(frame);
            if (m) {
                var file = m[1], lineno = m[4]; //m[7] is character position in Chrome
                if (file && this.isSameDomain(file) && lineno) {
                    var functionName = this.guessFunctionName(file, lineno);
                    stack[i] = frame.replace('{anonymous}', functionName);
                }
            }
        }
        return stack;
    },

    guessFunctionName: function (url, lineNo) {
        try {
            return this.guessFunctionNameFromLines(lineNo, this.getSource(url));
        } catch (e) {
            return 'getSource failed with url: ' + url + ', exception: ' + e.toString();
        }
    },

    guessFunctionNameFromLines: function (lineNo, source) {
        var reFunctionArgNames = this.regex.reFunctionArgNames;
        var reGuessFunction = this.regex.reGuessFunction;
        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        var line = "", maxLines = 10;
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;
            if (line !== undefined) {
                var m = reGuessFunction.exec(line);
                if (m && m[1]) {
                    return m[1];
                } else {
                    m = reFunctionArgNames.exec(line);
                    if (m && m[1]) {
                        return m[1];
                    }
                }
            }
        }
        return '(?)';
    }
};/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/SyntaxHighlighter
 *
 * SyntaxHighlighter is donationware. If you are using it, please donate.
 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
 *
 * @version
 * 3.0.83 (July 02 2010)
 * 
 * @copyright
 * Copyright (C) 2004-2010 Alex Gorbatchev.
 *
 * @license
 * Dual licensed under the MIT and GPL licenses.
 */
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('K M;I(M)1S 2U("2a\'t 4k M 4K 2g 3l 4G 4H");(6(){6 r(f,e){I(!M.1R(f))1S 3m("3s 15 4R");K a=f.1w;f=M(f.1m,t(f)+(e||""));I(a)f.1w={1m:a.1m,19:a.19?a.19.1a(0):N};H f}6 t(f){H(f.1J?"g":"")+(f.4s?"i":"")+(f.4p?"m":"")+(f.4v?"x":"")+(f.3n?"y":"")}6 B(f,e,a,b){K c=u.L,d,h,g;v=R;5K{O(;c--;){g=u[c];I(a&g.3r&&(!g.2p||g.2p.W(b))){g.2q.12=e;I((h=g.2q.X(f))&&h.P===e){d={3k:g.2b.W(b,h,a),1C:h};1N}}}}5v(i){1S i}5q{v=11}H d}6 p(f,e,a){I(3b.Z.1i)H f.1i(e,a);O(a=a||0;a<f.L;a++)I(f[a]===e)H a;H-1}M=6(f,e){K a=[],b=M.1B,c=0,d,h;I(M.1R(f)){I(e!==1d)1S 3m("2a\'t 5r 5I 5F 5B 5C 15 5E 5p");H r(f)}I(v)1S 2U("2a\'t W 3l M 59 5m 5g 5x 5i");e=e||"";O(d={2N:11,19:[],2K:6(g){H e.1i(g)>-1},3d:6(g){e+=g}};c<f.L;)I(h=B(f,c,b,d)){a.U(h.3k);c+=h.1C[0].L||1}Y I(h=n.X.W(z[b],f.1a(c))){a.U(h[0]);c+=h[0].L}Y{h=f.3a(c);I(h==="[")b=M.2I;Y I(h==="]")b=M.1B;a.U(h);c++}a=15(a.1K(""),n.Q.W(e,w,""));a.1w={1m:f,19:d.2N?d.19:N};H a};M.3v="1.5.0";M.2I=1;M.1B=2;K C=/\\$(?:(\\d\\d?|[$&`\'])|{([$\\w]+)})/g,w=/[^5h]+|([\\s\\S])(?=[\\s\\S]*\\1)/g,A=/^(?:[?*+]|{\\d+(?:,\\d*)?})\\??/,v=11,u=[],n={X:15.Z.X,1A:15.Z.1A,1C:1r.Z.1C,Q:1r.Z.Q,1e:1r.Z.1e},x=n.X.W(/()??/,"")[1]===1d,D=6(){K f=/^/g;n.1A.W(f,"");H!f.12}(),y=6(){K f=/x/g;n.Q.W("x",f,"");H!f.12}(),E=15.Z.3n!==1d,z={};z[M.2I]=/^(?:\\\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\\29-26-f]{2}|u[\\29-26-f]{4}|c[A-3o-z]|[\\s\\S]))/;z[M.1B]=/^(?:\\\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\\d*|x[\\29-26-f]{2}|u[\\29-26-f]{4}|c[A-3o-z]|[\\s\\S])|\\(\\?[:=!]|[?*+]\\?|{\\d+(?:,\\d*)?}\\??)/;M.1h=6(f,e,a,b){u.U({2q:r(f,"g"+(E?"y":"")),2b:e,3r:a||M.1B,2p:b||N})};M.2n=6(f,e){K a=f+"/"+(e||"");H M.2n[a]||(M.2n[a]=M(f,e))};M.3c=6(f){H r(f,"g")};M.5l=6(f){H f.Q(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g,"\\\\$&")};M.5e=6(f,e,a,b){e=r(e,"g"+(b&&E?"y":""));e.12=a=a||0;f=e.X(f);H b?f&&f.P===a?f:N:f};M.3q=6(){M.1h=6(){1S 2U("2a\'t 55 1h 54 3q")}};M.1R=6(f){H 53.Z.1q.W(f)==="[2m 15]"};M.3p=6(f,e,a,b){O(K c=r(e,"g"),d=-1,h;h=c.X(f);){a.W(b,h,++d,f,c);c.12===h.P&&c.12++}I(e.1J)e.12=0};M.57=6(f,e){H 6 a(b,c){K d=e[c].1I?e[c]:{1I:e[c]},h=r(d.1I,"g"),g=[],i;O(i=0;i<b.L;i++)M.3p(b[i],h,6(k){g.U(d.3j?k[d.3j]||"":k[0])});H c===e.L-1||!g.L?g:a(g,c+1)}([f],0)};15.Z.1p=6(f,e){H J.X(e[0])};15.Z.W=6(f,e){H J.X(e)};15.Z.X=6(f){K e=n.X.1p(J,14),a;I(e){I(!x&&e.L>1&&p(e,"")>-1){a=15(J.1m,n.Q.W(t(J),"g",""));n.Q.W(f.1a(e.P),a,6(){O(K c=1;c<14.L-2;c++)I(14[c]===1d)e[c]=1d})}I(J.1w&&J.1w.19)O(K b=1;b<e.L;b++)I(a=J.1w.19[b-1])e[a]=e[b];!D&&J.1J&&!e[0].L&&J.12>e.P&&J.12--}H e};I(!D)15.Z.1A=6(f){(f=n.X.W(J,f))&&J.1J&&!f[0].L&&J.12>f.P&&J.12--;H!!f};1r.Z.1C=6(f){M.1R(f)||(f=15(f));I(f.1J){K e=n.1C.1p(J,14);f.12=0;H e}H f.X(J)};1r.Z.Q=6(f,e){K a=M.1R(f),b,c;I(a&&1j e.58()==="3f"&&e.1i("${")===-1&&y)H n.Q.1p(J,14);I(a){I(f.1w)b=f.1w.19}Y f+="";I(1j e==="6")c=n.Q.W(J,f,6(){I(b){14[0]=1f 1r(14[0]);O(K d=0;d<b.L;d++)I(b[d])14[0][b[d]]=14[d+1]}I(a&&f.1J)f.12=14[14.L-2]+14[0].L;H e.1p(N,14)});Y{c=J+"";c=n.Q.W(c,f,6(){K d=14;H n.Q.W(e,C,6(h,g,i){I(g)5b(g){24"$":H"$";24"&":H d[0];24"`":H d[d.L-1].1a(0,d[d.L-2]);24"\'":H d[d.L-1].1a(d[d.L-2]+d[0].L);5a:i="";g=+g;I(!g)H h;O(;g>d.L-3;){i=1r.Z.1a.W(g,-1)+i;g=1Q.3i(g/10)}H(g?d[g]||"":"$")+i}Y{g=+i;I(g<=d.L-3)H d[g];g=b?p(b,i):-1;H g>-1?d[g+1]:h}})})}I(a&&f.1J)f.12=0;H c};1r.Z.1e=6(f,e){I(!M.1R(f))H n.1e.1p(J,14);K a=J+"",b=[],c=0,d,h;I(e===1d||+e<0)e=5D;Y{e=1Q.3i(+e);I(!e)H[]}O(f=M.3c(f);d=f.X(a);){I(f.12>c){b.U(a.1a(c,d.P));d.L>1&&d.P<a.L&&3b.Z.U.1p(b,d.1a(1));h=d[0].L;c=f.12;I(b.L>=e)1N}f.12===d.P&&f.12++}I(c===a.L){I(!n.1A.W(f,"")||h)b.U("")}Y b.U(a.1a(c));H b.L>e?b.1a(0,e):b};M.1h(/\\(\\?#[^)]*\\)/,6(f){H n.1A.W(A,f.2S.1a(f.P+f[0].L))?"":"(?:)"});M.1h(/\\((?!\\?)/,6(){J.19.U(N);H"("});M.1h(/\\(\\?<([$\\w]+)>/,6(f){J.19.U(f[1]);J.2N=R;H"("});M.1h(/\\\\k<([\\w$]+)>/,6(f){K e=p(J.19,f[1]);H e>-1?"\\\\"+(e+1)+(3R(f.2S.3a(f.P+f[0].L))?"":"(?:)"):f[0]});M.1h(/\\[\\^?]/,6(f){H f[0]==="[]"?"\\\\b\\\\B":"[\\\\s\\\\S]"});M.1h(/^\\(\\?([5A]+)\\)/,6(f){J.3d(f[1]);H""});M.1h(/(?:\\s+|#.*)+/,6(f){H n.1A.W(A,f.2S.1a(f.P+f[0].L))?"":"(?:)"},M.1B,6(){H J.2K("x")});M.1h(/\\./,6(){H"[\\\\s\\\\S]"},M.1B,6(){H J.2K("s")})})();1j 2e!="1d"&&(2e.M=M);K 1v=6(){6 r(a,b){a.1l.1i(b)!=-1||(a.1l+=" "+b)}6 t(a){H a.1i("3e")==0?a:"3e"+a}6 B(a){H e.1Y.2A[t(a)]}6 p(a,b,c){I(a==N)H N;K d=c!=R?a.3G:[a.2G],h={"#":"1c",".":"1l"}[b.1o(0,1)]||"3h",g,i;g=h!="3h"?b.1o(1):b.5u();I((a[h]||"").1i(g)!=-1)H a;O(a=0;d&&a<d.L&&i==N;a++)i=p(d[a],b,c);H i}6 C(a,b){K c={},d;O(d 2g a)c[d]=a[d];O(d 2g b)c[d]=b[d];H c}6 w(a,b,c,d){6 h(g){g=g||1P.5y;I(!g.1F){g.1F=g.52;g.3N=6(){J.5w=11}}c.W(d||1P,g)}a.3g?a.3g("4U"+b,h):a.4y(b,h,11)}6 A(a,b){K c=e.1Y.2j,d=N;I(c==N){c={};O(K h 2g e.1U){K g=e.1U[h];d=g.4x;I(d!=N){g.1V=h.4w();O(g=0;g<d.L;g++)c[d[g]]=h}}e.1Y.2j=c}d=e.1U[c[a]];d==N&&b!=11&&1P.1X(e.13.1x.1X+(e.13.1x.3E+a));H d}6 v(a,b){O(K c=a.1e("\\n"),d=0;d<c.L;d++)c[d]=b(c[d],d);H c.1K("\\n")}6 u(a,b){I(a==N||a.L==0||a=="\\n")H a;a=a.Q(/</g,"&1y;");a=a.Q(/ {2,}/g,6(c){O(K d="",h=0;h<c.L-1;h++)d+=e.13.1W;H d+" "});I(b!=N)a=v(a,6(c){I(c.L==0)H"";K d="";c=c.Q(/^(&2s;| )+/,6(h){d=h;H""});I(c.L==0)H d;H d+\'<17 1g="\'+b+\'">\'+c+"</17>"});H a}6 n(a,b){a.1e("\\n");O(K c="",d=0;d<50;d++)c+="                    ";H a=v(a,6(h){I(h.1i("\\t")==-1)H h;O(K g=0;(g=h.1i("\\t"))!=-1;)h=h.1o(0,g)+c.1o(0,b-g%b)+h.1o(g+1,h.L);H h})}6 x(a){H a.Q(/^\\s+|\\s+$/g,"")}6 D(a,b){I(a.P<b.P)H-1;Y I(a.P>b.P)H 1;Y I(a.L<b.L)H-1;Y I(a.L>b.L)H 1;H 0}6 y(a,b){6 c(k){H k[0]}O(K d=N,h=[],g=b.2D?b.2D:c;(d=b.1I.X(a))!=N;){K i=g(d,b);I(1j i=="3f")i=[1f e.2L(i,d.P,b.23)];h=h.1O(i)}H h}6 E(a){K b=/(.*)((&1G;|&1y;).*)/;H a.Q(e.3A.3M,6(c){K d="",h=N;I(h=b.X(c)){c=h[1];d=h[2]}H\'<a 2h="\'+c+\'">\'+c+"</a>"+d})}6 z(){O(K a=1E.36("1k"),b=[],c=0;c<a.L;c++)a[c].3s=="20"&&b.U(a[c]);H b}6 f(a){a=a.1F;K b=p(a,".20",R);a=p(a,".3O",R);K c=1E.4i("3t");I(!(!a||!b||p(a,"3t"))){B(b.1c);r(b,"1m");O(K d=a.3G,h=[],g=0;g<d.L;g++)h.U(d[g].4z||d[g].4A);h=h.1K("\\r");c.39(1E.4D(h));a.39(c);c.2C();c.4C();w(c,"4u",6(){c.2G.4E(c);b.1l=b.1l.Q("1m","")})}}I(1j 3F!="1d"&&1j M=="1d")M=3F("M").M;K e={2v:{"1g-27":"","2i-1s":1,"2z-1s-2t":11,1M:N,1t:N,"42-45":R,"43-22":4,1u:R,16:R,"3V-17":R,2l:11,"41-40":R,2k:11,"1z-1k":11},13:{1W:"&2s;",2M:R,46:11,44:11,34:"4n",1x:{21:"4o 1m",2P:"?",1X:"1v\\n\\n",3E:"4r\'t 4t 1D O: ",4g:"4m 4B\'t 51 O 1z-1k 4F: ",37:\'<!4T 1z 4S "-//4V//3H 4W 1.0 4Z//4Y" "1Z://2y.3L.3K/4X/3I/3H/3I-4P.4J"><1z 4I="1Z://2y.3L.3K/4L/5L"><3J><4N 1Z-4M="5G-5M" 6K="2O/1z; 6J=6I-8" /><1t>6L 1v</1t></3J><3B 1L="25-6M:6Q,6P,6O,6N-6F;6y-2f:#6x;2f:#6w;25-22:6v;2O-3D:3C;"><T 1L="2O-3D:3C;3w-32:1.6z;"><T 1L="25-22:6A-6E;">1v</T><T 1L="25-22:.6C;3w-6B:6R;"><T>3v 3.0.76 (72 73 3x)</T><T><a 2h="1Z://3u.2w/1v" 1F="38" 1L="2f:#3y">1Z://3u.2w/1v</a></T><T>70 17 6U 71.</T><T>6T 6X-3x 6Y 6D.</T></T><T>6t 61 60 J 1k, 5Z <a 2h="6u://2y.62.2w/63-66/65?64=5X-5W&5P=5O" 1L="2f:#3y">5R</a> 5V <2R/>5U 5T 5S!</T></T></3B></1z>\'}},1Y:{2j:N,2A:{}},1U:{},3A:{6n:/\\/\\*[\\s\\S]*?\\*\\//2c,6m:/\\/\\/.*$/2c,6l:/#.*$/2c,6k:/"([^\\\\"\\n]|\\\\.)*"/g,6o:/\'([^\\\\\'\\n]|\\\\.)*\'/g,6p:1f M(\'"([^\\\\\\\\"]|\\\\\\\\.)*"\',"3z"),6s:1f M("\'([^\\\\\\\\\']|\\\\\\\\.)*\'","3z"),6q:/(&1y;|<)!--[\\s\\S]*?--(&1G;|>)/2c,3M:/\\w+:\\/\\/[\\w-.\\/?%&=:@;]*/g,6a:{18:/(&1y;|<)\\?=?/g,1b:/\\?(&1G;|>)/g},69:{18:/(&1y;|<)%=?/g,1b:/%(&1G;|>)/g},6d:{18:/(&1y;|<)\\s*1k.*?(&1G;|>)/2T,1b:/(&1y;|<)\\/\\s*1k\\s*(&1G;|>)/2T}},16:{1H:6(a){6 b(i,k){H e.16.2o(i,k,e.13.1x[k])}O(K c=\'<T 1g="16">\',d=e.16.2x,h=d.2X,g=0;g<h.L;g++)c+=(d[h[g]].1H||b)(a,h[g]);c+="</T>";H c},2o:6(a,b,c){H\'<2W><a 2h="#" 1g="6e 6h\'+b+" "+b+\'">\'+c+"</a></2W>"},2b:6(a){K b=a.1F,c=b.1l||"";b=B(p(b,".20",R).1c);K d=6(h){H(h=15(h+"6f(\\\\w+)").X(c))?h[1]:N}("6g");b&&d&&e.16.2x[d].2B(b);a.3N()},2x:{2X:["21","2P"],21:{1H:6(a){I(a.V("2l")!=R)H"";K b=a.V("1t");H e.16.2o(a,"21",b?b:e.13.1x.21)},2B:6(a){a=1E.6j(t(a.1c));a.1l=a.1l.Q("47","")}},2P:{2B:6(){K a="68=0";a+=", 18="+(31.30-33)/2+", 32="+(31.2Z-2Y)/2+", 30=33, 2Z=2Y";a=a.Q(/^,/,"");a=1P.6Z("","38",a);a.2C();K b=a.1E;b.6W(e.13.1x.37);b.6V();a.2C()}}}},35:6(a,b){K c;I(b)c=[b];Y{c=1E.36(e.13.34);O(K d=[],h=0;h<c.L;h++)d.U(c[h]);c=d}c=c;d=[];I(e.13.2M)c=c.1O(z());I(c.L===0)H d;O(h=0;h<c.L;h++){O(K g=c[h],i=a,k=c[h].1l,j=3W 0,l={},m=1f M("^\\\\[(?<2V>(.*?))\\\\]$"),s=1f M("(?<27>[\\\\w-]+)\\\\s*:\\\\s*(?<1T>[\\\\w-%#]+|\\\\[.*?\\\\]|\\".*?\\"|\'.*?\')\\\\s*;?","g");(j=s.X(k))!=N;){K o=j.1T.Q(/^[\'"]|[\'"]$/g,"");I(o!=N&&m.1A(o)){o=m.X(o);o=o.2V.L>0?o.2V.1e(/\\s*,\\s*/):[]}l[j.27]=o}g={1F:g,1n:C(i,l)};g.1n.1D!=N&&d.U(g)}H d},1M:6(a,b){K c=J.35(a,b),d=N,h=e.13;I(c.L!==0)O(K g=0;g<c.L;g++){b=c[g];K i=b.1F,k=b.1n,j=k.1D,l;I(j!=N){I(k["1z-1k"]=="R"||e.2v["1z-1k"]==R){d=1f e.4l(j);j="4O"}Y I(d=A(j))d=1f d;Y 6H;l=i.3X;I(h.2M){l=l;K m=x(l),s=11;I(m.1i("<![6G[")==0){m=m.4h(9);s=R}K o=m.L;I(m.1i("]]\\>")==o-3){m=m.4h(0,o-3);s=R}l=s?m:l}I((i.1t||"")!="")k.1t=i.1t;k.1D=j;d.2Q(k);b=d.2F(l);I((i.1c||"")!="")b.1c=i.1c;i.2G.74(b,i)}}},2E:6(a){w(1P,"4k",6(){e.1M(a)})}};e.2E=e.2E;e.1M=e.1M;e.2L=6(a,b,c){J.1T=a;J.P=b;J.L=a.L;J.23=c;J.1V=N};e.2L.Z.1q=6(){H J.1T};e.4l=6(a){6 b(j,l){O(K m=0;m<j.L;m++)j[m].P+=l}K c=A(a),d,h=1f e.1U.5Y,g=J,i="2F 1H 2Q".1e(" ");I(c!=N){d=1f c;O(K k=0;k<i.L;k++)(6(){K j=i[k];g[j]=6(){H h[j].1p(h,14)}})();d.28==N?1P.1X(e.13.1x.1X+(e.13.1x.4g+a)):h.2J.U({1I:d.28.17,2D:6(j){O(K l=j.17,m=[],s=d.2J,o=j.P+j.18.L,F=d.28,q,G=0;G<s.L;G++){q=y(l,s[G]);b(q,o);m=m.1O(q)}I(F.18!=N&&j.18!=N){q=y(j.18,F.18);b(q,j.P);m=m.1O(q)}I(F.1b!=N&&j.1b!=N){q=y(j.1b,F.1b);b(q,j.P+j[0].5Q(j.1b));m=m.1O(q)}O(j=0;j<m.L;j++)m[j].1V=c.1V;H m}})}};e.4j=6(){};e.4j.Z={V:6(a,b){K c=J.1n[a];c=c==N?b:c;K d={"R":R,"11":11}[c];H d==N?c:d},3Y:6(a){H 1E.4i(a)},4c:6(a,b){K c=[];I(a!=N)O(K d=0;d<a.L;d++)I(1j a[d]=="2m")c=c.1O(y(b,a[d]));H J.4e(c.6b(D))},4e:6(a){O(K b=0;b<a.L;b++)I(a[b]!==N)O(K c=a[b],d=c.P+c.L,h=b+1;h<a.L&&a[b]!==N;h++){K g=a[h];I(g!==N)I(g.P>d)1N;Y I(g.P==c.P&&g.L>c.L)a[b]=N;Y I(g.P>=c.P&&g.P<d)a[h]=N}H a},4d:6(a){K b=[],c=2u(J.V("2i-1s"));v(a,6(d,h){b.U(h+c)});H b},3U:6(a){K b=J.V("1M",[]);I(1j b!="2m"&&b.U==N)b=[b];a:{a=a.1q();K c=3W 0;O(c=c=1Q.6c(c||0,0);c<b.L;c++)I(b[c]==a){b=c;1N a}b=-1}H b!=-1},2r:6(a,b,c){a=["1s","6i"+b,"P"+a,"6r"+(b%2==0?1:2).1q()];J.3U(b)&&a.U("67");b==0&&a.U("1N");H\'<T 1g="\'+a.1K(" ")+\'">\'+c+"</T>"},3Q:6(a,b){K c="",d=a.1e("\\n").L,h=2u(J.V("2i-1s")),g=J.V("2z-1s-2t");I(g==R)g=(h+d-1).1q().L;Y I(3R(g)==R)g=0;O(K i=0;i<d;i++){K k=b?b[i]:h+i,j;I(k==0)j=e.13.1W;Y{j=g;O(K l=k.1q();l.L<j;)l="0"+l;j=l}a=j;c+=J.2r(i,k,a)}H c},49:6(a,b){a=x(a);K c=a.1e("\\n");J.V("2z-1s-2t");K d=2u(J.V("2i-1s"));a="";O(K h=J.V("1D"),g=0;g<c.L;g++){K i=c[g],k=/^(&2s;|\\s)+/.X(i),j=N,l=b?b[g]:d+g;I(k!=N){j=k[0].1q();i=i.1o(j.L);j=j.Q(" ",e.13.1W)}i=x(i);I(i.L==0)i=e.13.1W;a+=J.2r(g,l,(j!=N?\'<17 1g="\'+h+\' 5N">\'+j+"</17>":"")+i)}H a},4f:6(a){H a?"<4a>"+a+"</4a>":""},4b:6(a,b){6 c(l){H(l=l?l.1V||g:g)?l+" ":""}O(K d=0,h="",g=J.V("1D",""),i=0;i<b.L;i++){K k=b[i],j;I(!(k===N||k.L===0)){j=c(k);h+=u(a.1o(d,k.P-d),j+"48")+u(k.1T,j+k.23);d=k.P+k.L+(k.75||0)}}h+=u(a.1o(d),c()+"48");H h},1H:6(a){K b="",c=["20"],d;I(J.V("2k")==R)J.1n.16=J.1n.1u=11;1l="20";J.V("2l")==R&&c.U("47");I((1u=J.V("1u"))==11)c.U("6S");c.U(J.V("1g-27"));c.U(J.V("1D"));a=a.Q(/^[ ]*[\\n]+|[\\n]*[ ]*$/g,"").Q(/\\r/g," ");b=J.V("43-22");I(J.V("42-45")==R)a=n(a,b);Y{O(K h="",g=0;g<b;g++)h+=" ";a=a.Q(/\\t/g,h)}a=a;a:{b=a=a;h=/<2R\\s*\\/?>|&1y;2R\\s*\\/?&1G;/2T;I(e.13.46==R)b=b.Q(h,"\\n");I(e.13.44==R)b=b.Q(h,"");b=b.1e("\\n");h=/^\\s*/;g=4Q;O(K i=0;i<b.L&&g>0;i++){K k=b[i];I(x(k).L!=0){k=h.X(k);I(k==N){a=a;1N a}g=1Q.4q(k[0].L,g)}}I(g>0)O(i=0;i<b.L;i++)b[i]=b[i].1o(g);a=b.1K("\\n")}I(1u)d=J.4d(a);b=J.4c(J.2J,a);b=J.4b(a,b);b=J.49(b,d);I(J.V("41-40"))b=E(b);1j 2H!="1d"&&2H.3S&&2H.3S.1C(/5s/)&&c.U("5t");H b=\'<T 1c="\'+t(J.1c)+\'" 1g="\'+c.1K(" ")+\'">\'+(J.V("16")?e.16.1H(J):"")+\'<3Z 5z="0" 5H="0" 5J="0">\'+J.4f(J.V("1t"))+"<3T><3P>"+(1u?\'<2d 1g="1u">\'+J.3Q(a)+"</2d>":"")+\'<2d 1g="17"><T 1g="3O">\'+b+"</T></2d></3P></3T></3Z></T>"},2F:6(a){I(a===N)a="";J.17=a;K b=J.3Y("T");b.3X=J.1H(a);J.V("16")&&w(p(b,".16"),"5c",e.16.2b);J.V("3V-17")&&w(p(b,".17"),"56",f);H b},2Q:6(a){J.1c=""+1Q.5d(1Q.5n()*5k).1q();e.1Y.2A[t(J.1c)]=J;J.1n=C(e.2v,a||{});I(J.V("2k")==R)J.1n.16=J.1n.1u=11},5j:6(a){a=a.Q(/^\\s+|\\s+$/g,"").Q(/\\s+/g,"|");H"\\\\b(?:"+a+")\\\\b"},5f:6(a){J.28={18:{1I:a.18,23:"1k"},1b:{1I:a.1b,23:"1k"},17:1f M("(?<18>"+a.18.1m+")(?<17>.*?)(?<1b>"+a.1b.1m+")","5o")}}};H e}();1j 2e!="1d"&&(2e.1v=1v);',62,441,'||||||function|||||||||||||||||||||||||||||||||||||return|if|this|var|length|XRegExp|null|for|index|replace|true||div|push|getParam|call|exec|else|prototype||false|lastIndex|config|arguments|RegExp|toolbar|code|left|captureNames|slice|right|id|undefined|split|new|class|addToken|indexOf|typeof|script|className|source|params|substr|apply|toString|String|line|title|gutter|SyntaxHighlighter|_xregexp|strings|lt|html|test|OUTSIDE_CLASS|match|brush|document|target|gt|getHtml|regex|global|join|style|highlight|break|concat|window|Math|isRegExp|throw|value|brushes|brushName|space|alert|vars|http|syntaxhighlighter|expandSource|size|css|case|font|Fa|name|htmlScript|dA|can|handler|gm|td|exports|color|in|href|first|discoveredBrushes|light|collapse|object|cache|getButtonHtml|trigger|pattern|getLineHtml|nbsp|numbers|parseInt|defaults|com|items|www|pad|highlighters|execute|focus|func|all|getDiv|parentNode|navigator|INSIDE_CLASS|regexList|hasFlag|Match|useScriptTags|hasNamedCapture|text|help|init|br|input|gi|Error|values|span|list|250|height|width|screen|top|500|tagName|findElements|getElementsByTagName|aboutDialog|_blank|appendChild|charAt|Array|copyAsGlobal|setFlag|highlighter_|string|attachEvent|nodeName|floor|backref|output|the|TypeError|sticky|Za|iterate|freezeTokens|scope|type|textarea|alexgorbatchev|version|margin|2010|005896|gs|regexLib|body|center|align|noBrush|require|childNodes|DTD|xhtml1|head|org|w3|url|preventDefault|container|tr|getLineNumbersHtml|isNaN|userAgent|tbody|isLineHighlighted|quick|void|innerHTML|create|table|links|auto|smart|tab|stripBrs|tabs|bloggerMode|collapsed|plain|getCodeLinesHtml|caption|getMatchesHtml|findMatches|figureOutLineNumbers|removeNestedMatches|getTitleHtml|brushNotHtmlScript|substring|createElement|Highlighter|load|HtmlScript|Brush|pre|expand|multiline|min|Can|ignoreCase|find|blur|extended|toLowerCase|aliases|addEventListener|innerText|textContent|wasn|select|createTextNode|removeChild|option|same|frame|xmlns|dtd|twice|1999|equiv|meta|htmlscript|transitional|1E3|expected|PUBLIC|DOCTYPE|on|W3C|XHTML|TR|EN|Transitional||configured|srcElement|Object|after|run|dblclick|matchChain|valueOf|constructor|default|switch|click|round|execAt|forHtmlScript|token|gimy|functions|getKeywords|1E6|escape|within|random|sgi|another|finally|supply|MSIE|ie|toUpperCase|catch|returnValue|definition|event|border|imsx|constructing|one|Infinity|from|when|Content|cellpadding|flags|cellspacing|try|xhtml|Type|spaces|2930402|hosted_button_id|lastIndexOf|donate|active|development|keep|to|xclick|_s|Xml|please|like|you|paypal|cgi|cmd|webscr|bin|highlighted|scrollbars|aspScriptTags|phpScriptTags|sort|max|scriptScriptTags|toolbar_item|_|command|command_|number|getElementById|doubleQuotedString|singleLinePerlComments|singleLineCComments|multiLineCComments|singleQuotedString|multiLineDoubleQuotedString|xmlComments|alt|multiLineSingleQuotedString|If|https|1em|000|fff|background|5em|xx|bottom|75em|Gorbatchev|large|serif|CDATA|continue|utf|charset|content|About|family|sans|Helvetica|Arial|Geneva|3em|nogutter|Copyright|syntax|close|write|2004|Alex|open|JavaScript|highlighter|July|02|replaceChild|offset|83'.split('|'),0,{}))
/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/SyntaxHighlighter
 *
 * SyntaxHighlighter is donationware. If you are using it, please donate.
 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
 *
 * @version
 * 3.0.83 (July 02 2010)
 * 
 * @copyright
 * Copyright (C) 2004-2010 Alex Gorbatchev.
 *
 * @license
 * Dual licensed under the MIT and GPL licenses.
 */
;(function()
{
	// CommonJS
	if (typeof(SyntaxHighlighter) == 'undefined' && typeof(require) != 'undefined') {
		SyntaxHighlighter = require('shCore').SyntaxHighlighter;
	}

	function Brush()
	{
		// Copyright 2006 Shin, YoungJin
	
		var datatypes =	'void float int bool vec2 vec3 vec4 bvec2 bvec3 bvec4 ivec2 ivec3 ivec4 mat2 mat3 mat4 sampler2D samplerCube ';

		var keywords =	'precision highp mediump lowp ' +
                        'in out inout ' +
                        'attribute const break continue do else for if discard return uniform varying struct void while ' +
                        'gl_Position gl_PointSize ' +
                        'gl_FragCoord gl_FrontFacing gl_FragColor gl_FragData gl_PointCoord ' +
                        'gl_DepthRange ' +
                        'gl_MaxVertexAttribs gl_MaxVertexUniformVectors gl_MaxVaryingVectors gl_MaxVertexTextureImageUnits gl_MaxCombinedTextureImageUnits gl_MaxTextureImageUnits gl_MaxFragmentUniformVectors gl_MaxDrawBuffers ';
					
		var functions =	'radians degrees sin cos tan asin acos atan ' +
                        'pow exp log exp2 log2 sqrt inversesqrt ' +
                        'abs sign floor ceil fract mod min max clamp mix step smoothstep ' +
                        'length distance dot cross normalize faceforward reflect refract ' +
                        'matrixCompMult ' +
                        'lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not ' +
                        'texture2D texture2DProj texture2DLod texture2DProjLod textureCube textureCubeLod ';

		this.regexList = [
			{ regex: SyntaxHighlighter.regexLib.singleLineCComments,	css: 'comments' },			// one line comments
			{ regex: SyntaxHighlighter.regexLib.multiLineCComments,		css: 'comments' },			// multiline comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,		css: 'string' },			// strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,		css: 'string' },			// strings
			{ regex: /^ *#.*/gm,										css: 'preprocessor' },
			{ regex: new RegExp(this.getKeywords(datatypes), 'gm'),		css: 'color1 bold' },
			{ regex: new RegExp(this.getKeywords(functions), 'gm'),		css: 'functions bold' },
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),		css: 'keyword bold' }
			];
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['glsl', 'vs', 'fs'];

	SyntaxHighlighter.brushes.GLSL = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
// Hack to always define a console
if (!window["console"]) {
    window.console = { log: function () { } };
}


function glinamespace(name) {
    var parts = name.split(".");
    var current = window;
    for (var n = 0; n < parts.length; n++) {
        var part = parts[n];
        current[part] = current[part] || {};
        current = current[part];
    }
    return current;
}

function glisubclass(parent, child, args) {
    parent.apply(child, args);

    // TODO: this sucks - do it right

    for (var propertyName in parent.prototype) {
        if (propertyName == "constructor") {
            continue;
        }
        if (!child.__proto__[propertyName]) {
            child.__proto__[propertyName] = parent.prototype[propertyName];
        }
    }

    for (var propertyName in parent) {
        child[propertyName] = parent[propertyName];
    }
};

function glitypename(value) {
    function stripConstructor(value) {
        if (value) {
            return value.replace("Constructor", "");
        } else {
            return value;
        }
    };
    if (value) {
        var mangled = value.constructor.toString();
        if (mangled) {
            var matches = mangled.match(/function (.+)\(/);
            if (matches) {
                // ...function Foo()...
                if (matches[1] == "Object") {
                    // Hrm that's likely not right...
                    // constructor may be fubar
                    mangled = value.toString();
                } else {
                    return stripConstructor(matches[1]);
                }
            }

            // [object Foo]
            matches = mangled.match(/\[object (.+)\]/);
            if (matches) {
                return stripConstructor(matches[1]);
            }
        }
    }
    return null;
};

function scrollIntoViewIfNeeded(el) {
    if (el.scrollIntoViewIfNeeded) {
        el.scrollIntoViewIfNeeded();
    } else {
        // TODO: determine if el is in the current view of the parent
        var scrollTop = el.offsetParent.scrollTop;
        var scrollBottom = el.offsetParent.scrollTop + el.offsetParent.clientHeight;
        var elTop = el.offsetTop;
        var elBottom = el.offsetTop + el.offsetHeight;
        if ((elTop < scrollTop) || (elTop > scrollBottom)) {
            el.scrollIntoView();
        }
    }
};

(function () {
    var util = glinamespace("gli.util");

    util.getWebGLContext = function (canvas, baseAttrs, attrs) {
        var finalAttrs = {
            preserveDrawingBuffer: true
        };

        // baseAttrs are all required and attrs are ORed in
        if (baseAttrs) {
            for (var k in baseAttrs) {
                finalAttrs[k] = baseAttrs[k];
            }
        }
        if (attrs) {
            for (var k in attrs) {
                if (finalAttrs[k] === undefined) {
                    finalAttrs[k] = attrs[k];
                } else {
                    finalAttrs[k] |= attrs[k];
                }
            }
        }

        var contextName = "experimental-webgl";
        var gl = null;
        try {
            if (canvas.getContextRaw) {
                gl = canvas.getContextRaw(contextName, finalAttrs);
            } else {
                gl = canvas.getContext(contextName, finalAttrs);
            }
        } catch (e) {
            // ?
            alert("Unable to get WebGL context: " + e);
        }

        if (gl) {
            gli.enableAllExtensions(gl);
            gli.hacks.installAll(gl);
        }

        return gl;
    };

    // Adjust TypedArray types to have consistent toString methods
    var typedArrayToString = function () {
        var s = "";
        var maxIndex = Math.min(64, this.length);
        for (var n = 0; n < maxIndex; n++) {
            s += this[n];
            if (n < this.length - 1) {
                s += ",";
            }
        }
        if (maxIndex < this.length) {
            s += ",... (" + (this.length) + " total)";
        }
        return s;
    };
    Int8Array.prototype.toString = typedArrayToString;
    Uint8Array.prototype.toString = typedArrayToString;
    Int16Array.prototype.toString = typedArrayToString;
    Uint16Array.prototype.toString = typedArrayToString;
    Int32Array.prototype.toString = typedArrayToString;
    Uint32Array.prototype.toString = typedArrayToString;
    Float32Array.prototype.toString = typedArrayToString;

    util.typedArrayToString = function (array) {
        if (array) {
            return typedArrayToString.apply(array);
        } else {
            return "(null)";
        }
    };

    util.isTypedArray = function (value) {
        if (value) {
            var typename = glitypename(value);
            switch (typename) {
                case "Int8Array":
                case "Uint8Array":
                case "Int16Array":
                case "Uint16Array":
                case "Int32Array":
                case "Uint32Array":
                case "Float32Array":
                    return true;
            }
            return false;
        } else {
            return false;
        }
    };

    util.arrayCompare = function (a, b) {
        if (a && b && a.length == b.length) {
            for (var n = 0; n < a.length; n++) {
                if (a[n] !== b[n]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };

    util.isWebGLResource = function (value) {
        if (value) {
            var typename = glitypename(value);
            switch (typename) {
                case "WebGLBuffer":
                case "WebGLFramebuffer":
                case "WebGLProgram":
                case "WebGLRenderbuffer":
                case "WebGLShader":
                case "WebGLTexture":
                    return true;
            }
            return false;
        } else {
            return false;
        }
    }

    function prepareDocumentElement(el) {
        // FF requires all content be in a document before it'll accept it for playback
        if (window.navigator.product == "Gecko") {
            var frag = document.createDocumentFragment();
            frag.appendChild(el);
        }
    };

    util.clone = function (arg) {
        if (arg) {
            if ((arg.constructor == Number) || (arg.constructor == String)) {
                // Fast path for immutables
                return arg;
            } else if (arg.constructor == Array) {
                return arg.slice(); // ghetto clone
            } else if (arg instanceof ArrayBuffer) {
                // There may be a better way to do this, but I don't know it
                var target = new ArrayBuffer(arg.byteLength);
                var sourceView = new DataView(arg, 0, arg.byteLength);
                var targetView = new DataView(target, 0, arg.byteLength);
                for (var n = 0; n < arg.byteLength; n++) {
                    targetView.setUint8(n, sourceView.getUint8(n));
                }
                return target;
            } else if (util.isTypedArray(arg)) {
                //} else if (arg instanceof ArrayBufferView) {
                // HACK: at least Chromium doesn't have ArrayBufferView as a known type (for some reason)
                var target = null;
                if (arg instanceof Int8Array) {
                    target = new Int8Array(arg);
                } else if (arg instanceof Uint8Array) {
                    target = new Uint8Array(arg);
                } else if (arg instanceof Int16Array) {
                    target = new Int16Array(arg);
                } else if (arg instanceof Uint16Array) {
                    target = new Uint16Array(arg);
                } else if (arg instanceof Int32Array) {
                    target = new Int32Array(arg);
                } else if (arg instanceof Uint32Array) {
                    target = new Uint32Array(arg);
                } else if (arg instanceof Float32Array) {
                    target = new Float32Array(arg);
                } else {
                    target = arg;
                }
                return target;
            } else if (glitypename(arg) == "ImageData") {
                var dummyCanvas = document.createElement("canvas");
                var dummyContext = dummyCanvas.getContext("2d");
                var target = dummyContext.createImageData(arg);
                for (var n = 0; n < arg.data.length; n++) {
                    target.data[n] = arg.data[n];
                }
                return target;
            } else if (arg instanceof HTMLCanvasElement) {
                // TODO: better way of doing this?
                var target = arg.cloneNode(true);
                var ctx = target.getContext("2d");
                ctx.drawImage(arg, 0, 0);
                prepareDocumentElement(target);
                return target;
            } else if (arg instanceof HTMLImageElement) {
                // TODO: clone image data (src?)
                var target = arg.cloneNode(true);
                target.width = arg.width;
                target.height = arg.height;
                prepareDocumentElement(target);
                return target;
            } else if (arg instanceof HTMLVideoElement) {
                // TODO: clone video data (is this even possible? we want the exact frame at the time of upload - maybe preserve seek time?)
                var target = arg.cloneNode(true);
                prepareDocumentElement(target);
                return target;
            } else {
                return arg;
            }
        } else {
            return arg;
        }
    };

})();
(function () {
    var hacks = glinamespace("gli.hacks");

    hacks.installAll = function (gl) {
        if (gl.__hasHacksInstalled) {
            return;
        }
        gl.__hasHacksInstalled = true;
    };

})();
(function () {
    var gli = glinamespace("gli");

    function installFrameTerminatorExtension(gl) {
        var ext = {};

        ext.frameEvent = new gli.EventSource("frameEvent");

        ext.frameTerminator = function () {
            ext.frameEvent.fire();
        };

        return {
            name: "GLI_frame_terminator",
            object: ext
        };
    };

    gli.installExtensions = function (gl) {
        var extensionStrings = [];
        var extensionObjects = {};

        // Setup extensions
        var frameTerminatorExt = installFrameTerminatorExtension(gl);
        extensionStrings.push(frameTerminatorExt.name);
        extensionObjects[frameTerminatorExt.name] = frameTerminatorExt.object;

        // Patch in new extensions
        var original_getSupportedExtensions = gl.getSupportedExtensions;
        gl.getSupportedExtensions = function () {
            var supportedExtensions = original_getSupportedExtensions.apply(gl);
            for (var n = 0; n < extensionStrings.length; n++) {
                supportedExtensions.push(extensionStrings[n]);
            }
            return supportedExtensions;
        };
        var original_getExtension = gl.getExtension;
        gl.getExtension = function (name) {
            var ext = extensionObjects[name];
            if (ext) {
                return ext;
            } else {
                return original_getExtension.apply(gl, arguments);
            }
        };
    };

    gli.enableAllExtensions = function (gl) {
        if (!gl.getSupportedExtensions) {
            return;
        }

        var extensionNames = gl.getSupportedExtensions();
        for (var n = 0; n < extensionNames.length; n++) {
            var extensionName = extensionNames[n];
            var extension = gl.getExtension(extensionName);
            // Ignore result
        }
    };

})();
(function () {
    var gli = glinamespace("gli");

    var EventSource = function (name) {
        this.name = name;
        this.listeners = [];
    };

    EventSource.prototype.addListener = function (target, callback) {
        this.listeners.push({
            target: target,
            callback: callback
        });
    };

    EventSource.prototype.removeListener = function (target, callback) {
        for (var n = 0; n < this.listeners.length; n++) {
            var listener = this.listeners[n];
            if (listener.target === target) {
                if (callback) {
                    if (listener.callback === callback) {
                        this.listeners.splice(n, 1);
                        break;
                    }
                } else {
                    this.listeners.splice(n, 1);
                }
            }
        }
    };

    EventSource.prototype.fire = function () {
        for (var n = 0; n < this.listeners.length; n++) {
            var listener = this.listeners[n];
            //try {
                listener.callback.apply(listener.target, arguments);
            //} catch (e) {
            //    console.log("exception thrown in target of event " + this.name + ": " + e);
            //}
        }
    };

    EventSource.prototype.fireDeferred = function () {
        var self = this;
        var args = arguments;
        (gli.host.setTimeout || window.setTimeout)(function () {
            self.fire.apply(self, args);
        }, 0);
    };

    gli.EventSource = EventSource;

})();
(function () {
    var gli = glinamespace("gli");
    var info = glinamespace("gli.info");

    var UIType = {
        ENUM: 0, // a specific enum
        ARRAY: 1, // array of values (tightly packed)
        BOOL: 2,
        LONG: 3,
        ULONG: 4,
        COLORMASK: 5, // 4 bools
        OBJECT: 6, // some WebGL object (texture/program/etc)
        WH: 7, // width x height (array with 2 values)
        RECT: 8, // x, y, w, h (array with 4 values)
        STRING: 9, // some arbitrary string
        COLOR: 10, // 4 floats
        FLOAT: 11,
        BITMASK: 12, // 32bit boolean mask
        RANGE: 13, // 2 floats
        MATRIX: 14 // 2x2, 3x3, or 4x4 matrix
    };

    var UIInfo = function (type, values) {
        this.type = type;
        this.values = values;
    };

    var FunctionType = {
        GENERIC: 0,
        DRAW: 1
    };

    var FunctionInfo = function (staticgl, name, returnType, args, type) {
        this.name = name;
        this.returnType = returnType;
        this.args = args;
        this.type = type;
    };
    FunctionInfo.prototype.getArgs = function (call) {
        return this.args;
    };

    var FunctionParam = function (staticgl, name, ui) {
        this.name = name;
        this.ui = ui;
    };

    function setupFunctionInfos(gl) {
        if (info.functions) {
            return;
        }

        var texParamNames = ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MAX_ANISOTROPY_EXT"];

        var functionInfos = [
            new FunctionInfo(gl, "activeTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.ENUM, ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"]))
            ]),
            new FunctionInfo(gl, "attachShader", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindAttribLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "bindBuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindFramebuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindRenderbuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindTexture", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "blendColor", null, new UIInfo(UIType.COLOR)),
            new FunctionInfo(gl, "blendEquation", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"]))
            ]),
            new FunctionInfo(gl, "blendEquationSeparate", null, [
                new FunctionParam(gl, "modeRGB", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
                new FunctionParam(gl, "modeAlpha", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"]))
            ]),
            new FunctionInfo(gl, "blendFunc", null, [
                new FunctionParam(gl, "sfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))
            ]),
            new FunctionInfo(gl, "blendFuncSeparate", null, [
                new FunctionParam(gl, "srcRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dstRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
                new FunctionParam(gl, "srcAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dstAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))
            ]),
            new FunctionInfo(gl, "bufferData", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "sizeOrData", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "usage", new UIInfo(UIType.ENUM, ["STREAM_DRAW", "STATIC_DRAW", "DYNAMIC_DRAW"]))
            ]),
            new FunctionInfo(gl, "bufferSubData", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "offset", new UIInfo(UIType.ULONG)),
                new FunctionParam(gl, "data", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "checkFramebufferStatus", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"]))
            ]),
            new FunctionInfo(gl, "clear", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK, ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT", "STENCIL_BUFFER_BIT"]))
            ]),
            new FunctionInfo(gl, "clearColor", null, new UIInfo(UIType.COLOR)),
            new FunctionInfo(gl, "clearDepth", null, [
                new FunctionParam(gl, "depth", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "clearStencil", null, [
                new FunctionParam(gl, "s", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "colorMask", null, new UIInfo(UIType.COLORMASK)),
            new FunctionInfo(gl, "compileShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "copyTexImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "border", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "copyTexSubImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "createBuffer", null, [
            ]),
            new FunctionInfo(gl, "createFramebuffer", null, [
            ]),
            new FunctionInfo(gl, "createProgram", null, [
            ]),
            new FunctionInfo(gl, "createRenderbuffer", null, [
            ]),
            new FunctionInfo(gl, "createShader", null, [
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["VERTEX_SHADER", "FRAGMENT_SHADER"]))
            ]),
            new FunctionInfo(gl, "createTexture", null, [
            ]),
            new FunctionInfo(gl, "cullFace", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"]))
            ]),
            new FunctionInfo(gl, "deleteBuffer", null, [
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteFramebuffer", null, [
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteRenderbuffer", null, [
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "depthFunc", null, [
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"]))
            ]),
            new FunctionInfo(gl, "depthMask", null, [
                new FunctionParam(gl, "flag", new UIInfo(UIType.BOOL))
            ]),
            new FunctionInfo(gl, "depthRange", null, [
                new FunctionParam(gl, "zNear", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "zFar", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "detachShader", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "disable", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "disableVertexAttribArray", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "drawArrays", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"])),
                new FunctionParam(gl, "first", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG))
            ], FunctionType.DRAW),
            new FunctionInfo(gl, "drawElements", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"])),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT", "UNSIGNED_INT"])),
                new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))
            ], FunctionType.DRAW),
            new FunctionInfo(gl, "enable", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "enableVertexAttribArray", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "finish", null, [
            ]),
            new FunctionInfo(gl, "flush", null, [
            ]),
            new FunctionInfo(gl, "framebufferRenderbuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "renderbuffertarget", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "framebufferTexture2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER", "DEPTH_ATTACHMENT"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "textarget", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "frontFace", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["CW", "CCW"]))
            ]),
            new FunctionInfo(gl, "generateMipmap", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"]))
            ]),
            new FunctionInfo(gl, "getActiveAttrib", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "getActiveUniform", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "getAttachedShaders", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getAttribLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getParameter", null, [
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["ACTIVE_TEXTURE", "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "ALPHA_BITS", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "BLUE_BITS", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "COMPRESSED_TEXTURE_FORMATS", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_BITS", "DEPTH_CLEAR_VALUE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_TEST", "DEPTH_WRITEMASK", "DITHER", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "GREEN_BITS", "IMPLEMENTATION_COLOR_READ_FORMAT", "IMPLEMENTATION_COLOR_READ_TYPE", "LINE_WIDTH", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "MAX_CUBE_MAP_TEXTURE_SIZE", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_RENDERBUFFER_SIZE", "MAX_TEXTURE_IMAGE_UNITS", "MAX_TEXTURE_SIZE", "MAX_VARYING_VECTORS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VIEWPORT_DIMS", "NUM_COMPRESSED_TEXTURE_FORMATS", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RED_BITS", "RENDERBUFFER_BINDING", "RENDERER", "SAMPLE_BUFFERS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SAMPLES", "SCISSOR_BOX", "SCISSOR_TEST", "SHADING_LANGUAGE_VERSION", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_BITS", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "SUBPIXEL_BITS", "TEXTURE_BINDING_2D", "TEXTURE_BINDING_CUBE_MAP", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VENDOR", "VERSION", "VIEWPORT", "MAX_TEXTURE_MAX_ANISOTROPY_EXT"]))
            ]),
            new FunctionInfo(gl, "getBufferParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["BUFFER_SIZE", "BUFFER_USAGE"]))
            ]),
            new FunctionInfo(gl, "getError", null, [
            ]),
            new FunctionInfo(gl, "getSupportedExtensions", null, [
            ]),
            new FunctionInfo(gl, "getExtension", null, [
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getFramebufferAttachmentParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE"]))
            ]),
            new FunctionInfo(gl, "getProgramParameter", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["DELETE_STATUS", "LINK_STATUS", "VALIDATE_STATUS", "INFO_LOG_LENGTH", "ATTACHED_SHADERS", "ACTIVE_ATTRIBUTES", "ACTIVE_ATTRIBUTE_MAX_LENGTH", "ACTIVE_UNIFORMS", "ACTIVE_UNIFORM_MAX_LENGTH"]))
            ]),
            new FunctionInfo(gl, "getProgramInfoLog", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getRenderbufferParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["RENDERBUFFER_WIDTH", "RENDERBUFFER_HEIGHT", "RENDERBUFFER_INTERNAL_FORMAT", "RENDERBUFFER_RED_SIZE", "RENDERBUFFER_GREEN_SIZE", "RENDERBUFFER_BLUE_SIZE", "RENDERBUFFER_ALPHA_SIZE", "RENDERBUFFER_DEPTH_SIZE", "RENDERBUFFER_STENCIL_SIZE"]))
            ]),
            new FunctionInfo(gl, "getShaderParameter", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["SHADER_TYPE", "DELETE_STATUS", "COMPILE_STATUS", "INFO_LOG_LENGTH", "SHADER_SOURCE_LENGTH"]))
            ]),
            new FunctionInfo(gl, "getShaderInfoLog", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getShaderSource", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getTexParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MAX_ANISOTROPY_EXT"]))
            ]),
            new FunctionInfo(gl, "getUniform", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)) // TODO: find a way to treat this as an integer? browsers don't like this...
            ]),
            new FunctionInfo(gl, "getUniformLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getVertexAttrib", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", "VERTEX_ATTRIB_ARRAY_ENABLED", "VERTEX_ATTRIB_ARRAY_SIZE", "VERTEX_ATTRIB_ARRAY_STRIDE", "VERTEX_ATTRIB_ARRAY_TYPE", "VERTEX_ATTRIB_ARRAY_NORMALIZED", "CURRENT_VERTEX_ATTRIB"]))
            ]),
            new FunctionInfo(gl, "getVertexAttribOffset", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_POINTER"]))
            ]),
            new FunctionInfo(gl, "hint", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["GENERATE_MIPMAP_HINT", "FRAGMENT_SHADER_DERIVATIVE_HINT_OES"])),
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FASTEST", "NICEST", "DONT_CARE"]))
            ]),
            new FunctionInfo(gl, "isBuffer", null, [
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isEnabled", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "isFramebuffer", null, [
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isRenderbuffer", null, [
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "lineWidth", null, [
                new FunctionParam(gl, "width", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "linkProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "pixelStorei", null, [
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["PACK_ALIGNMENT", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL"])),
                new FunctionParam(gl, "param", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "polygonOffset", null, [
                new FunctionParam(gl, "factor", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "units", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "readPixels", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "RGB", "RGBA"])),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])),
                new FunctionParam(gl, "pixels", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "renderbufferStorage", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["RGBA4", "RGB565", "RGB5_A1", "DEPTH_COMPONENT16", "STENCIL_INDEX8"])),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "sampleCoverage", null, [
                new FunctionParam(gl, "value", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "invert", new UIInfo(UIType.BOOL))
            ]),
            new FunctionInfo(gl, "scissor", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "shaderSource", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "source", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "stencilFunc", null, [
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
                new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilFuncSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
                new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilMask", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilMaskSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilOp", null, [
                new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))
            ]),
            new FunctionInfo(gl, "stencilOpSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))
            ]),
            new FunctionInfo(gl, "texImage2D", null, null), // handled specially below
            new FunctionInfo(gl, "texParameterf", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, texParamNames)),
                new FunctionParam(gl, "param", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "texParameteri", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, texParamNames)),
                new FunctionParam(gl, "param", new UIInfo(UIType.ENUM, ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR", "CLAMP_TO_EDGE", "MIRRORED_REPEAT", "REPEAT"]))
            ]),
            new FunctionInfo(gl, "texSubImage2D", null, null), // handled specially below
            new FunctionInfo(gl, "uniform1f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform1fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform1i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform1iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform2f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform2fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform2i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform2iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform3f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform3fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform3i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "z", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform3iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform4f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform4fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform4i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "z", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "w", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform4iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniformMatrix2fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "uniformMatrix3fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "uniformMatrix4fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "useProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "validateProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "vertexAttrib1f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib1fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib2f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib2fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib3f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib3fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib4f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib4fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttribPointer", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "size", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["BYTE", "UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "FIXED", "FLOAT"])),
                new FunctionParam(gl, "normalized", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "stride", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "viewport", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ])
        ];

        // Build lookup
        for (var n = 0; n < functionInfos.length; n++) {
            functionInfos[functionInfos[n].name] = functionInfos[n];
        }

        var textureTypes = new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1", "FLOAT", "HALF_FLOAT_OES", "UNSIGNED_SHORT", "UNSIGNED_INT"]);
        functionInfos["texImage2D"].getArgs = function (call) {
            var args = [];
            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])));
            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA", "DEPTH_COMPONENT"])));
            if (call.args.length == 9) {
                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA", "DEPTH_COMPONENT"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA", "DEPTH_COMPONENT"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
            }
            return args;
        };
        functionInfos["texSubImage2D"].getArgs = function (call) {
            var args = [];
            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])));
            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
            if (call.args.length == 9) {
                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
            }
            return args;
        };

        info.functions = functionInfos;
    };

    var StateParameter = function (staticgl, name, readOnly, ui) {
        this.value = staticgl[name];
        this.name = name;
        this.readOnly = readOnly;
        this.ui = ui;

        this.getter = function (gl) {
            try {
                return gl.getParameter(gl[this.name]);
            } catch (e) {
                console.log("unable to get state parameter " + this.name);
                return null;
            }
        };
    };

    function setupStateParameters(gl) {
        if (info.stateParameters) {
            return;
        }

        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

        var hintValues = ["FASTEST", "NICEST", "DONT_CARE"];
        var stateParameters = [
            new StateParameter(gl, "ACTIVE_TEXTURE", false, new UIInfo(UIType.ENUM, ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"])),
            new StateParameter(gl, "ALIASED_LINE_WIDTH_RANGE", true, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "ALIASED_POINT_SIZE_RANGE", true, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "ALPHA_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "BLEND", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "BLEND_COLOR", false, new UIInfo(UIType.COLOR)),
            new StateParameter(gl, "BLEND_DST_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
            new StateParameter(gl, "BLEND_DST_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
            new StateParameter(gl, "BLEND_EQUATION_ALPHA", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
            new StateParameter(gl, "BLEND_EQUATION_RGB", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
            new StateParameter(gl, "BLEND_SRC_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
            new StateParameter(gl, "BLEND_SRC_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
            new StateParameter(gl, "BLUE_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "COLOR_CLEAR_VALUE", false, new UIInfo(UIType.COLOR)),
            new StateParameter(gl, "COLOR_WRITEMASK", false, new UIInfo(UIType.COLORMASK)),
            new StateParameter(gl, "CULL_FACE", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "CULL_FACE_MODE", false, new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
            new StateParameter(gl, "CURRENT_PROGRAM", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "DEPTH_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "DEPTH_CLEAR_VALUE", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "DEPTH_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "EQUAL", "LEQUAL", "GREATER", "NOTEQUAL", "GEQUAL", "ALWAYS"])),
            new StateParameter(gl, "DEPTH_RANGE", false, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "DEPTH_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "DEPTH_WRITEMASK", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "DITHER", true, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "ELEMENT_ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", false, new UIInfo(UIType.ENUM, hintValues)),
            new StateParameter(gl, "FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "FRONT_FACE", false, new UIInfo(UIType.ENUM, ["CW", "CCW"])),
            new StateParameter(gl, "GENERATE_MIPMAP_HINT", false, new UIInfo(UIType.ENUM, hintValues)),
            new StateParameter(gl, "GREEN_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "LINE_WIDTH", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_CUBE_MAP_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_RENDERBUFFER_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_MAX_ANISOTROPY_EXT", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VARYING_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_ATTRIBS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VIEWPORT_DIMS", true, new UIInfo(UIType.WH)),
            new StateParameter(gl, "PACK_ALIGNMENT", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "POLYGON_OFFSET_FACTOR", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "POLYGON_OFFSET_FILL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "POLYGON_OFFSET_UNITS", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "RED_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "RENDERBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "RENDERER", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "SAMPLE_BUFFERS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "SAMPLE_COVERAGE_INVERT", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SAMPLE_COVERAGE_VALUE", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "SAMPLES", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "SCISSOR_BOX", false, new UIInfo(UIType.RECT)),
            new StateParameter(gl, "SCISSOR_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SHADING_LANGUAGE_VERSION", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "STENCIL_BACK_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
            new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_REF", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_BACK_VALUE_MASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_BACK_WRITEMASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_CLEAR_VALUE", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
            new StateParameter(gl, "STENCIL_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_REF", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "STENCIL_VALUE_MASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_WRITEMASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "SUBPIXEL_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "UNPACK_ALIGNMENT", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "UNPACK_COLORSPACE_CONVERSION_WEBGL", false, new UIInfo(UIType.ENUM, ["NONE", "BROWSER_DEFAULT_WEBGL"])),
            new StateParameter(gl, "UNPACK_FLIP_Y_WEBGL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "UNPACK_PREMULTIPLY_ALPHA_WEBGL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "VENDOR", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "VERSION", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "VIEWPORT", false, new UIInfo(UIType.RECT))
        ];

        for (var n = 0; n < maxTextureUnits; n++) {
            var param = new StateParameter(gl, "TEXTURE_BINDING_2D_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_2D);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }
        for (var n = 0; n < maxTextureUnits; n++) {
            var param = new StateParameter(gl, "TEXTURE_BINDING_CUBE_MAP_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }

        // Build lookup
        for (var n = 0; n < stateParameters.length; n++) {
            stateParameters[stateParameters[n].name] = stateParameters[n];
        }

        info.stateParameters = stateParameters;
    };

    function setupEnumMap(gl) {
        if (info.enumMap) {
            return;
        }

        var enumMap = {};
        for (var n in gl) {
            if (typeof gl[n] == 'number') {
                enumMap[gl[n]] = n;
            }
        }

        info.enumMap = enumMap;
    };

    gli.UIType = UIType;
    gli.FunctionType = FunctionType;
    //info.functions - deferred
    //info.stateParameters - deferred
    //info.enumMap - deferred

    info.enumToString = function (n) {
        var string = info.enumMap[n];
        if (string !== undefined) {
            return string;
        }
        return "0x" + n.toString(16);
    };

    info.initialize = function (gl) {
        setupFunctionInfos(gl);
        setupStateParameters(gl);
        setupEnumMap(gl);
    };
})();
(function () {
    var controls = glinamespace("gli.controls");

    var SplitterBar = function (parentElement, direction, minValue, maxValue, customStyle, changeCallback) {
        var self = this;
        var doc = parentElement.ownerDocument;

        var el = this.el = doc.createElement("div");
        parentElement.appendChild(el);

        el.className = customStyle || ("splitter-" + direction);

        var lastValue = 0;

        function mouseMove(e) {
            var newValue;

            if (direction == "horizontal") {
                var dy = e.screenY - lastValue;
                lastValue = e.screenY;

                var height = parseInt(parentElement.style.height);
                height -= dy;
                height = Math.max(minValue, height);
                height = Math.min(window.innerHeight - maxValue, height);
                parentElement.style.height = height + "px";
                newValue = height;
            } else {
                var dx = e.screenX - lastValue;
                lastValue = e.screenX;

                var width = parseInt(parentElement.style.width);
                width -= dx;
                width = Math.max(minValue, width);
                width = Math.min(window.innerWidth - maxValue, width);
                parentElement.style.width = width + "px";
                newValue = width;
            }

            if (changeCallback) {
                changeCallback(newValue);
            }

            e.preventDefault();
            e.stopPropagation();
        };

        function mouseUp(e) {
            endResize();
            e.preventDefault();
            e.stopPropagation();
        };

        function beginResize() {
            doc.addEventListener("mousemove", mouseMove, true);
            doc.addEventListener("mouseup", mouseUp, true);
            if (direction == "horizontal") {
                doc.body.style.cursor = "n-resize";
            } else {
                doc.body.style.cursor = "e-resize";
            }
        };

        function endResize() {
            doc.removeEventListener("mousemove", mouseMove, true);
            doc.removeEventListener("mouseup", mouseUp, true);
            doc.body.style.cursor = "";
        };

        el.onmousedown = function (e) {
            beginResize();
            if (direction == "horizontal") {
                lastValue = e.screenY;
            } else {
                lastValue = e.screenX;
            }
            e.preventDefault();
            e.stopPropagation();
        };

        // TODO: save splitter value somewhere across sessions?
    };

    controls.SplitterBar = SplitterBar;
})();
(function () {
    var gli = glinamespace("gli");

    var Settings = function () {
        this.global = {
            captureOn: [],
            showHud: false,
            popupHud: false,
            enableTimeline: true
        };

        this.session = {
            showRedundantCalls: true,
            showDepthDiscarded: true,
            enableTimeline: false,
            hudVisible: false,
            hudHeight: 275,
            hudPopupWidth: 1200,
            hudPopupHeight: 500,
            traceSplitter: 400,
            textureSplitter: 240,
            counterToggles: {}
        };

        this.load();
    };

    Settings.prototype.setGlobals = function (globals) {
        for (var n in globals) {
            this.global[n] = globals[n];
        }
    };

    Settings.prototype.load = function () {
        var sessionString = localStorage["__gli"];
        if (sessionString) {
            var sessionObj = JSON.parse(sessionString);
            for (var n in sessionObj) {
                this.session[n] = sessionObj[n];
            }
        }
    };
    Settings.prototype.save = function () {
        localStorage["__gli"] = JSON.stringify(this.session);
    };

    gli.settings = new Settings();
})();
(function () {
    var host = glinamespace("gli.host");

    function errorBreak() {
        throw "WebGL error!";
    };

    function startCapturing(context) {
        context.ignoreErrors();
        context.captureFrame = true;
        //context.notifier.postMessage("capturing frame " + context.frameNumber + "...");
    };

    function stopCapturing(context) {
        context.notifier.postMessage("captured frame " + (context.frameNumber - 1));
        context.captureFrame = false;
        context.ignoreErrors();

        var frame = context.currentFrame;

        context.markFrame(null); // mark end

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, frame);
        }
    };

    function frameEnded(context) {
        if (context.inFrame) {
            context.inFrame = false;
            context.statistics.endFrame();
            context.frameCompleted.fire();
            context.ignoreErrors();
        }
    };

    function frameSeparator(context) {
        context.frameNumber++;

        // Start or stop capturing
        if (context.captureFrame) {
            if (context.captureFrameEnd == context.frameNumber) {
                stopCapturing(context);
            }
        } else {
            if (context.captureFrameStart == context.frameNumber) {
                startCapturing(context);
            }
        }

        if (context.captureFrame) {
            context.markFrame(context.frameNumber);
        }

        context.statistics.beginFrame();

        // Even though we are watching most timing methods, we can't be too safe
        original_setTimeout(function () {
            host.frameTerminator.fire();
        }, 0);
    };

    function wrapFunction(context, functionName) {
        var originalFunction = context.rawgl[functionName];
        var statistics = context.statistics;
        var callsPerFrame = statistics.callsPerFrame;
        return function () {
            var gl = context.rawgl;

            var stack = null;
            function generateStack() {
                // Generate stack trace
                var stackResult = printStackTrace();
                // ignore garbage
                stackResult = stackResult.slice(4);
                // Fix up our type
                stackResult[0] = stackResult[0].replace("[object Object].", "gl.");
                return stackResult;
            };

            if (context.inFrame == false) {
                // First call of a new frame!
                context.inFrame = true;
                frameSeparator(context);
            }

            // PRE:
            var call = null;
            if (context.captureFrame) {
                // NOTE: for timing purposes this should be the last thing before the actual call is made
                stack = stack || (context.options.resourceStacks ? generateStack() : null);
                call = context.currentFrame.allocateCall(functionName, arguments);
            }

            callsPerFrame.value++;

            if (context.captureFrame) {
                // Ignore all errors before this call is made
                gl.ignoreErrors();
            }

            // Call real function
            var result = originalFunction.apply(context.rawgl, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.NO_ERROR;
            if (!context.options.ignoreErrors || context.captureFrame) {
                error = gl.getError();
            }

            // POST:
            if (context.captureFrame) {
                if (error != context.NO_ERROR) {
                    stack = stack || generateStack();
                }
                call.complete(result, error, stack);
            }

            if (error != context.NO_ERROR) {
                context.errorMap[error] = true;

                if (context.options.breakOnError) {
                    // TODO: backtrace?
                    errorBreak();
                }
            }

            // If this is the frame separator then handle it
            if (context.options.frameSeparators.indexOf(functionName) >= 0) {
                frameEnded(context);
            }

            return result;
        };
    };

    var CaptureContext = function (canvas, rawgl, options) {
        var defaultOptions = {
            ignoreErrors: true,
            breakOnError: false,
            resourceStacks: false,
            callStacks: false,
            frameSeparators: gli.settings.global.captureOn
        };
        options = options || defaultOptions;
        for (var n in defaultOptions) {
            if (options[n] === undefined) {
                options[n] = defaultOptions[n];
            }
        }

        this.options = options;
        this.canvas = canvas;
        this.rawgl = rawgl;
        this.isWrapped = true;

        this.notifier = new host.Notifier();

        this.rawgl.canvas = canvas;
        gli.info.initialize(this.rawgl);

        this.attributes = rawgl.getContextAttributes ? rawgl.getContextAttributes() : {};

        this.statistics = new host.Statistics();

        this.frameNumber = 0;
        this.inFrame = false;

        // Function to call when capture completes
        this.captureCallback = null;
        // Frame range to capture (inclusive) - if inside a capture window, captureFrame == true
        this.captureFrameStart = null;
        this.captureFrameEnd = null;
        this.captureFrame = false;
        this.currentFrame = null;

        this.errorMap = {};

        this.enabledExtensions = [];

        this.frameCompleted = new gli.EventSource("frameCompleted");
        this.frameCompleted.addListener(this, function() {
            frameSeparator(this);
        });

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // NOTE: this should also happen really early, but after hacks
        gli.installExtensions(rawgl);

        // Listen for inferred frame termination and extension termination
        function frameEndedWrapper() {
            frameEnded(this);
        };
        host.frameTerminator.addListener(this, frameEndedWrapper);
        var ext = rawgl.getExtension("GLI_frame_terminator");
        ext.frameEvent.addListener(this, frameEndedWrapper);

        // Clone all properties in context and wrap all functions
        for (var propertyName in rawgl) {
            if (typeof rawgl[propertyName] == 'function') {
                // Functions
                this[propertyName] = wrapFunction(this, propertyName, rawgl[propertyName]);
            } else {
                // Enums/constants/etc
                this[propertyName] = rawgl[propertyName];
            }
        }

        // Rewrite getError so that it uses our version instead
        this.getError = function () {
            for (var error in this.errorMap) {
                if (this.errorMap[error]) {
                    this.errorMap[error] = false;
                    return error;
                }
            }
            return this.NO_ERROR;
        };

        // Unlogged pass-through of getContextAttributes and isContextLost
        this.isContextLost = function() {
            return rawgl.isContextLost();
        };
        this.getContextAttributes = function() {
            return rawgl.getContextAttributes();
        };

        // Capture all extension requests
        // We only support a few right now, so filter
        // New extensions that add tokens will needs to have support added in
        // the proper places, such as Info.js for enum values and the resource
        // system for new resources
        var validExts = [
            'GLI_frame_terminator',
            'OES_texture_float',
            'OES_texture_half_float',
            'OES_standard_derivatives',
            'OES_element_index_uint',
            'EXT_texture_filter_anisotropic',
            'OES_depth_texture'
        ];
        for (var n = 0, l = validExts.length; n < l; n++) {
            validExts.push('MOZ_' + validExts[n]);
            validExts.push('WEBKIT_' + validExts[n]);
        }
        function containsInsensitive(list, name) {
            name = name.toLowerCase();
            for (var n = 0; n < list.length; n++) {
                if (list[n].toLowerCase() == name) {
                    return true;
                }
            }
        };
        var original_getSupportedExtensions = this.getSupportedExtensions;
        this.getSupportedExtensions = function() {
            var exts = original_getSupportedExtensions.call(this);
            var usableExts = [];
            for (var n = 0; n < exts.length; n++) {
                if (containsInsensitive(validExts, exts[n])) {
                    usableExts.push(exts[n]);
                }
            }
            return usableExts;
        };
        var original_getExtension = this.getExtension;
        this.getExtension = function (name) {
            if (!containsInsensitive(validExts, name)) {
                return null;
            }
            var result = original_getExtension.apply(this, arguments);
            if (result) {
                // Nasty, but I never wrote this to support new constants properly
                switch (name.toLowerCase()) {
                    case 'oes_texture_half_float':
                        this['HALF_FLOAT_OES'] = 0x8D61;
                        break;
                    case 'oes_standard_derivatives':
                        this['FRAGMENT_SHADER_DERIVATIVE_HINT_OES'] = 0x8B8B;
                        break;
                    case 'ext_texture_filter_anisotropic':
                    case 'moz_ext_texture_filter_anisotropic':
                    case 'webkit_ext_texture_filter_anisotropic':
                        this['TEXTURE_MAX_ANISOTROPY_EXT'] = 0x84FE;
                        this['MAX_TEXTURE_MAX_ANISOTROPY_EXT'] = 0x84FF;
                        break;
                }

                this.enabledExtensions.push(name);
            }
            return result;
        };

        // Add a few helper methods
        this.ignoreErrors = rawgl.ignoreErrors = function () {
            while (this.getError() != this.NO_ERROR);
        };

        // Add debug methods
        this.mark = function () {
            if (context.captureFrame) {
                context.currentFrame.mark(arguments);
            }
        };

        // TODO: before or after we wrap? if we do it here (after), then timings won't be affected by our captures
        this.resources = new gli.host.ResourceCache(this);
    };

    CaptureContext.prototype.markFrame = function (frameNumber) {
        if (this.currentFrame) {
            // Close the previous frame
            this.currentFrame.end(this.rawgl);
            this.currentFrame = null;
        }

        if (frameNumber == null) {
            // Abort if not a real frame
            return;
        }

        var frame = new gli.host.Frame(this.canvas, this.rawgl, frameNumber, this.resources);
        this.currentFrame = frame;
    };

    CaptureContext.prototype.requestCapture = function (callback) {
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    host.CaptureContext = CaptureContext;

    host.frameTerminator = new gli.EventSource("frameTerminator");

    // This replaces setTimeout/setInterval with versions that, after the user code is called, try to end the frame
    // This should be a reliable way to bracket frame captures, unless the user is doing something crazy (like
    // rendering in mouse event handlers)
    var timerHijacking = {
        value: 0, // 0 = normal, N = ms between frames, Infinity = stopped
        activeIntervals: [],
        activeTimeouts: []
    };

    function hijackedDelay(delay) {
        var maxDelay = Math.max(delay, timerHijacking.value);
        if (!isFinite(maxDelay)) {
            maxDelay = 999999999;
        }
        return maxDelay;
    }

    host.setFrameControl = function (value) {
        timerHijacking.value = value;

        // Reset all intervals
        var intervals = timerHijacking.activeIntervals;
        for (var n = 0; n < intervals.length; n++) {
            var interval = intervals[n];
            original_clearInterval(interval.currentId);
            var maxDelay = hijackedDelay(interval.delay);
            interval.currentId = original_setInterval(interval.wrappedCode, maxDelay);
        }

        // Reset all timeouts
        var timeouts = timerHijacking.activeTimeouts;
        for (var n = 0; n < timeouts.length; n++) {
            var timeout = timeouts[n];
            original_clearTimeout(timeout.originalId);
            var maxDelay = hijackedDelay(timeout.delay);
            timeout.currentId = original_setTimeout(timeout.wrappedCode, maxDelay);
        }
    };

    function wrapCode(code, args) {
        args = args ? Array.prototype.slice.call(args, 2) : [];
        return function () {
            try {
                if (code) {
                    if (glitypename(code) == "String") {
                        eval(code);
                    } else {
                        code.apply(window, args);
                    }
                }
            } finally {
                host.frameTerminator.fire();
            }
        };
    };

    var original_setInterval = window.setInterval;
    window.setInterval = function (code, delay) {
        var maxDelay = hijackedDelay(delay);
        var wrappedCode = wrapCode(code, arguments);
        var intervalId = original_setInterval.apply(window, [wrappedCode, maxDelay]);
        timerHijacking.activeIntervals.push({
            originalId: intervalId,
            currentId: intervalId,
            code: code,
            wrappedCode: wrappedCode,
            delay: delay
        });
        return intervalId;
    };
    var original_clearInterval = window.clearInterval;
    window.clearInterval = function (intervalId) {
        for (var n = 0; n < timerHijacking.activeIntervals.length; n++) {
            if (timerHijacking.activeIntervals[n].originalId == intervalId) {
                var interval = timerHijacking.activeIntervals[n];
                timerHijacking.activeIntervals.splice(n, 1);
                return original_clearInterval.apply(window, [interval.currentId]);
            }
        }
        return original_clearInterval.apply(window, arguments);
    };
    var original_setTimeout = window.setTimeout;
    window.setTimeout = function (code, delay) {
        var maxDelay = hijackedDelay(delay);
        var wrappedCode = wrapCode(code, arguments);
        var cleanupCode = function () {
            // Need to remove from the active timeout list
            window.clearTimeout(timeoutId); // why is this here?
            wrappedCode();
        };
        var timeoutId = original_setTimeout.apply(window, [cleanupCode, maxDelay]);
        timerHijacking.activeTimeouts.push({
            originalId: timeoutId,
            currentId: timeoutId,
            code: code,
            wrappedCode: wrappedCode,
            delay: delay
        });
        return timeoutId;
    };
    var original_clearTimeout = window.clearTimeout;
    window.clearTimeout = function (timeoutId) {
        for (var n = 0; n < timerHijacking.activeTimeouts.length; n++) {
            if (timerHijacking.activeTimeouts[n].originalId == timeoutId) {
                var timeout = timerHijacking.activeTimeouts[n];
                timerHijacking.activeTimeouts.splice(n, 1);
                return original_clearTimeout.apply(window, [timeout.currentId]);
            }
        }
        return original_clearTimeout.apply(window, arguments);
    };

    // Some apps, like q3bsp, use the postMessage hack - because of that, we listen in and try to use it too
    // Note that there is a race condition here such that we may fire in BEFORE the app message, but oh well
    window.addEventListener("message", function () {
        host.frameTerminator.fire();
    }, false);

    // Support for requestAnimationFrame-like APIs
    var requestAnimationFrameNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "operaRequestAnimationFrame",
        "msAnimationFrame"
    ];
    for (var n = 0; n < requestAnimationFrameNames.length; n++) {
        var name = requestAnimationFrameNames[n];
        if (window[name]) {
            (function(name) {
                var originalFn = window[name];
                var lastFrameTime = (new Date());
                window[name] = function(callback, element) {
                    var time = (new Date());
                    var delta = (time - lastFrameTime);
                    if (delta > timerHijacking.value) {
                        lastFrameTime = time;
                        var wrappedCallback = function() {
                            try {
                                callback.apply(window, arguments);
                            } finally {
                                host.frameTerminator.fire();
                            }
                        };
                        return originalFn.call(window, wrappedCallback, element);
                    } else {
                        window.setTimeout(function() {
                            callback(Date.now());
                        }, delta);
                    }
                };
            })(name);
        }
    }

    // Everything in the inspector should use these instead of the global values
    host.setInterval = function () {
        return original_setInterval.apply(window, arguments);
    };
    host.clearInterval = function () {
        return original_clearInterval.apply(window, arguments);
    };
    host.setTimeout = function () {
        return original_setTimeout.apply(window, arguments);
    };
    host.clearTimeout = function () {
        return original_clearTimeout.apply(window, arguments);
    };

    // options: {
    //     ignoreErrors: bool - ignore errors on calls (can drastically speed things up)
    //     breakOnError: bool - break on gl error
    //     resourceStacks: bool - collect resource creation/deletion callstacks
    //     callStacks: bool - collect callstacks for each call
    //     frameSeparators: ['finish'] / etc
    // }
    host.inspectContext = function (canvas, rawgl, options) {
        // Ignore if we have already wrapped the context
        if (rawgl.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return rawgl;
        }

        var wrapped = new CaptureContext(canvas, rawgl, options);

        return wrapped;
    };

})();
(function () {
    var host = glinamespace("gli.host");

    var stateParameters = null;
    function setupStateParameters(gl) {
        stateParameters = [
            { name: "ACTIVE_TEXTURE" },
            { name: "ALIASED_LINE_WIDTH_RANGE" },
            { name: "ALIASED_POINT_SIZE_RANGE" },
            { name: "ALPHA_BITS" },
            { name: "ARRAY_BUFFER_BINDING" },
            { name: "BLEND" },
            { name: "BLEND_COLOR" },
            { name: "BLEND_DST_ALPHA" },
            { name: "BLEND_DST_RGB" },
            { name: "BLEND_EQUATION_ALPHA" },
            { name: "BLEND_EQUATION_RGB" },
            { name: "BLEND_SRC_ALPHA" },
            { name: "BLEND_SRC_RGB" },
            { name: "BLUE_BITS" },
            { name: "COLOR_CLEAR_VALUE" },
            { name: "COLOR_WRITEMASK" },
            { name: "CULL_FACE" },
            { name: "CULL_FACE_MODE" },
            { name: "CURRENT_PROGRAM" },
            { name: "DEPTH_BITS" },
            { name: "DEPTH_CLEAR_VALUE" },
            { name: "DEPTH_FUNC" },
            { name: "DEPTH_RANGE" },
            { name: "DEPTH_TEST" },
            { name: "DEPTH_WRITEMASK" },
            { name: "DITHER" },
            { name: "ELEMENT_ARRAY_BUFFER_BINDING" },
            { name: "FRAMEBUFFER_BINDING" },
            { name: "FRONT_FACE" },
            { name: "GENERATE_MIPMAP_HINT" },
            { name: "GREEN_BITS" },
            { name: "LINE_WIDTH" },
            { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_CUBE_MAP_TEXTURE_SIZE" },
            { name: "MAX_FRAGMENT_UNIFORM_VECTORS" },
            { name: "MAX_RENDERBUFFER_SIZE" },
            { name: "MAX_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_TEXTURE_SIZE" },
            { name: "MAX_VARYING_VECTORS" },
            { name: "MAX_VERTEX_ATTRIBS" },
            { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_VERTEX_UNIFORM_VECTORS" },
            { name: "MAX_VIEWPORT_DIMS" },
            { name: "PACK_ALIGNMENT" },
            { name: "POLYGON_OFFSET_FACTOR" },
            { name: "POLYGON_OFFSET_FILL" },
            { name: "POLYGON_OFFSET_UNITS" },
            { name: "RED_BITS" },
            { name: "RENDERBUFFER_BINDING" },
            { name: "RENDERER" },
            { name: "SAMPLE_BUFFERS" },
            { name: "SAMPLE_COVERAGE_INVERT" },
            { name: "SAMPLE_COVERAGE_VALUE" },
            { name: "SAMPLES" },
            { name: "SCISSOR_BOX" },
            { name: "SCISSOR_TEST" },
            { name: "SHADING_LANGUAGE_VERSION" },
            { name: "STENCIL_BACK_FAIL" },
            { name: "STENCIL_BACK_FUNC" },
            { name: "STENCIL_BACK_PASS_DEPTH_FAIL" },
            { name: "STENCIL_BACK_PASS_DEPTH_PASS" },
            { name: "STENCIL_BACK_REF" },
            { name: "STENCIL_BACK_VALUE_MASK" },
            { name: "STENCIL_BACK_WRITEMASK" },
            { name: "STENCIL_BITS" },
            { name: "STENCIL_CLEAR_VALUE" },
            { name: "STENCIL_FAIL" },
            { name: "STENCIL_FUNC" },
            { name: "STENCIL_PASS_DEPTH_FAIL" },
            { name: "STENCIL_PASS_DEPTH_PASS" },
            { name: "STENCIL_REF" },
            { name: "STENCIL_TEST" },
            { name: "STENCIL_VALUE_MASK" },
            { name: "STENCIL_WRITEMASK" },
            { name: "SUBPIXEL_BITS" },
            { name: "UNPACK_ALIGNMENT" },
            { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL" },
            { name: "UNPACK_FLIP_Y_WEBGL" },
            { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL" },
            { name: "VENDOR" },
            { name: "VERSION" },
            { name: "VIEWPORT" }
        ];

        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            var param = { name: "TEXTURE_BINDING_2D_" + n };
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_2D);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }
        for (var n = 0; n < maxTextureUnits; n++) {
            var param = { name: "TEXTURE_BINDING_CUBE_MAP_" + n };
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }

        // Setup values
        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            param.value = gl[param.name];
        }
    };

    function defaultGetParameter(gl, name) {
        try {
            return gl.getParameter(gl[name]);
        } catch (e) {
            console.log("unable to get state parameter " + name);
            return null;
        }
    };

    var StateSnapshot = function (gl) {
        if (stateParameters == null) {
            setupStateParameters(gl);
        }

        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            var value = param.getter ? param.getter(gl) : defaultGetParameter(gl, param.name);
            this[param.value ? param.value : param.name] = value;
        }

        this.attribs = [];
        var attribEnums = [gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING, gl.VERTEX_ATTRIB_ARRAY_ENABLED, gl.VERTEX_ATTRIB_ARRAY_SIZE, gl.VERTEX_ATTRIB_ARRAY_STRIDE, gl.VERTEX_ATTRIB_ARRAY_TYPE, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED, gl.CURRENT_VERTEX_ATTRIB];
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            var values = {};
            for (var m = 0; m < attribEnums.length; m++) {
                values[attribEnums[m]] = gl.getVertexAttrib(n, attribEnums[m]);
                // TODO: replace buffer binding with ref
            }
            values[0] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            this.attribs.push(values);
        }
    };

    StateSnapshot.prototype.clone = function () {
        var cloned = {};
        for (var k in this) {
            cloned[k] = gli.util.clone(this[k]);
        }
        return cloned;
    };

    function getTargetValue(value) {
        if (value) {
            if (value.trackedObject) {
                return value.trackedObject.mirror.target;
            } else {
                return value;
            }
        } else {
            return null;
        }
    };

    StateSnapshot.prototype.apply = function (gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, getTargetValue(this[gl.FRAMEBUFFER_BINDING]));
        gl.bindRenderbuffer(gl.RENDERBUFFER, getTargetValue(this[gl.RENDERBUFFER_BINDING]));

        gl.viewport(this[gl.VIEWPORT][0], this[gl.VIEWPORT][1], this[gl.VIEWPORT][2], this[gl.VIEWPORT][3]);

        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            if (this["TEXTURE_BINDING_2D_" + n]) {
                gl.bindTexture(gl.TEXTURE_2D, getTargetValue(this["TEXTURE_BINDING_2D_" + n]));
            } else {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, getTargetValue(this["TEXTURE_BINDING_CUBE_MAP_" + n]));
            }
        }

        gl.clearColor(this[gl.COLOR_CLEAR_VALUE][0], this[gl.COLOR_CLEAR_VALUE][1], this[gl.COLOR_CLEAR_VALUE][2], this[gl.COLOR_CLEAR_VALUE][3]);
        gl.colorMask(this[gl.COLOR_WRITEMASK][0], this[gl.COLOR_WRITEMASK][1], this[gl.COLOR_WRITEMASK][2], this[gl.COLOR_WRITEMASK][3]);

        if (this[gl.DEPTH_TEST]) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
        gl.clearDepth(this[gl.DEPTH_CLEAR_VALUE]);
        gl.depthFunc(this[gl.DEPTH_FUNC]);
        gl.depthRange(this[gl.DEPTH_RANGE][0], this[gl.DEPTH_RANGE][1]);
        gl.depthMask(this[gl.DEPTH_WRITEMASK]);

        if (this[gl.BLEND]) {
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }
        gl.blendColor(this[gl.BLEND_COLOR][0], this[gl.BLEND_COLOR][1], this[gl.BLEND_COLOR][2], this[gl.BLEND_COLOR][3]);
        gl.blendEquationSeparate(this[gl.BLEND_EQUATION_RGB], this[gl.BLEND_EQUATION_ALPHA]);
        gl.blendFuncSeparate(this[gl.BLEND_SRC_RGB], this[gl.BLEND_DST_RGB], this[gl.BLEND_SRC_ALPHA], this[gl.BLEND_DST_ALPHA]);

        //gl.DITHER, // ??????????????????????????????????????????????????????????

        if (this[gl.CULL_FACE]) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
        gl.cullFace(this[gl.CULL_FACE_MODE]);
        gl.frontFace(this[gl.FRONT_FACE]);

        gl.lineWidth(this[gl.LINE_WIDTH]);

        if (this[gl.POLYGON_OFFSET_FILL]) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
        } else {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
        gl.polygonOffset(this[gl.POLYGON_OFFSET_FACTOR], this[gl.POLYGON_OFFSET_UNITS]);

        if (this[gl.SAMPLE_COVERAGE]) {
            gl.enable(gl.SAMPLE_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_COVERAGE);
        }
        if (this[gl.SAMPLE_ALPHA_TO_COVERAGE]) {
            gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
        gl.sampleCoverage(this[gl.SAMPLE_COVERAGE_VALUE], this[gl.SAMPLE_COVERAGE_INVERT]);

        if (this[gl.SCISSOR_TEST]) {
            gl.enable(gl.SCISSOR_TEST);
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.scissor(this[gl.SCISSOR_BOX][0], this[gl.SCISSOR_BOX][1], this[gl.SCISSOR_BOX][2], this[gl.SCISSOR_BOX][3]);

        if (this[gl.STENCIL_TEST]) {
            gl.enable(gl.STENCIL_TEST);
        } else {
            gl.disable(gl.STENCIL_TEST);
        }
        gl.clearStencil(this[gl.STENCIL_CLEAR_VALUE]);
        gl.stencilFuncSeparate(gl.FRONT, this[gl.STENCIL_FUNC], this[gl.STENCIL_REF], this[gl.STENCIL_VALUE_MASK]);
        gl.stencilFuncSeparate(gl.BACK, this[gl.STENCIL_BACK_FUNC], this[gl.STENCIL_BACK_REF], this[gl.STENCIL_BACK_VALUE_MASK]);
        gl.stencilOpSeparate(gl.FRONT, this[gl.STENCIL_FAIL], this[gl.STENCIL_PASS_DEPTH_FAIL], this[gl.STENCIL_PASS_DEPTH_PASS]);
        gl.stencilOpSeparate(gl.BACK, this[gl.STENCIL_BACK_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_PASS]);
        gl.stencilMaskSeparate(gl.FRONT, this[gl.STENCIL_WRITEMASK]);
        gl.stencilMaskSeparate(gl.BACK, this[gl.STENCIL_BACK_WRITEMASK]);

        gl.hint(gl.GENERATE_MIPMAP_HINT, this[gl.GENERATE_MIPMAP_HINT]);

        gl.pixelStorei(gl.PACK_ALIGNMENT, this[gl.PACK_ALIGNMENT]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this[gl.UNPACK_ALIGNMENT]);
        //gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this[gl.UNPACK_COLORSPACE_CONVERSION_WEBGL]); ////////////////////// NOT YET SUPPORTED IN SOME BROWSERS
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this[gl.UNPACK_FLIP_Y_WEBGL]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this[gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

        var program = getTargetValue(this[gl.CURRENT_PROGRAM]);
        // HACK: if not linked, try linking
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.linkProgram(program);
        }
        gl.useProgram(program);

        for (var n = 0; n < this.attribs.length; n++) {
            var values = this.attribs[n];
            if (values[gl.VERTEX_ATTRIB_ARRAY_ENABLED]) {
                gl.enableVertexAttribArray(n);
            } else {
                gl.disableVertexAttribArray(n);
            }
            if (values[gl.CURRENT_VERTEX_ATTRIB]) {
                gl.vertexAttrib4fv(n, values[gl.CURRENT_VERTEX_ATTRIB]);
            }
            var buffer = getTargetValue(values[gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING]);
            if (buffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.vertexAttribPointer(n, values[gl.VERTEX_ATTRIB_ARRAY_SIZE], values[gl.VERTEX_ATTRIB_ARRAY_TYPE], values[gl.VERTEX_ATTRIB_ARRAY_NORMALIZED], values[gl.VERTEX_ATTRIB_ARRAY_STRIDE], values[0]);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, getTargetValue(this[gl.ARRAY_BUFFER_BINDING]));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, getTargetValue(this[gl.ELEMENT_ARRAY_BUFFER_BINDING]));

        gl.activeTexture(this[gl.ACTIVE_TEXTURE]);
    };

    host.StateSnapshot = StateSnapshot;
})();
(function () {
    var host = glinamespace("gli.host");

    var CallType = {
        MARK: 0,
        GL: 1
    };

    var Call = function (ordinal, type, name, sourceArgs, frame) {
        this.ordinal = ordinal;
        this.time = (new Date()).getTime();

        this.type = type;
        this.name = name;
        this.stack = null;

        this.isRedundant = false;

        // Clone arguments
        var args = [];
        for (var n = 0; n < sourceArgs.length; n++) {
            if (sourceArgs[n] && sourceArgs[n].sourceUniformName) {
                args[n] = sourceArgs[n]; // TODO: pull out uniform reference
            } else {
                args[n] = gli.util.clone(sourceArgs[n]);

                if (gli.util.isWebGLResource(args[n])) {
                    var tracked = args[n].trackedObject;
                    args[n] = tracked;

                    // TODO: mark resource access based on type
                    if (true) {
                        frame.markResourceRead(tracked);
                    }
                    if (true) {
                        frame.markResourceWrite(tracked);
                    }
                }
            }
        }
        this.args = args;

        // Set upon completion
        this.duration = 0;
        this.result = null;
        this.error = null;
    };

    Call.prototype.complete = function (result, error, stack) {
        this.duration = (new Date()).getTime() - this.time;
        this.result = result;
        this.error = error;
        this.stack = stack;
    };

    Call.prototype.transformArgs = function (gl) {
        var args = [];
        for (var n = 0; n < this.args.length; n++) {
            args[n] = this.args[n];

            if (args[n]) {
                if (args[n].mirror) {
                    // Translate from resource -> mirror target
                    args[n] = args[n].mirror.target;
                } else if (args[n].sourceUniformName) {
                    // Get valid uniform location on new context
                    args[n] = gl.getUniformLocation(args[n].sourceProgram.mirror.target, args[n].sourceUniformName);
                }
            }
        }
        return args;
    };

    Call.prototype.emit = function (gl) {
        var args = this.transformArgs(gl);

        //while (gl.getError() != gl.NO_ERROR);

        // TODO: handle result?
        try {
            gl[this.name].apply(gl, args);
        } catch (e) {
            console.log("exception during replay of " + this.name + ": " + e);
        }
        //console.log("call " + call.name);

        //var error = gl.getError();
        //if (error != gl.NO_ERROR) {
        //    console.log(error);
        //}
    };

    var Frame = function (canvas, rawgl, frameNumber, resourceCache) {
        var attrs = rawgl.getContextAttributes ? rawgl.getContextAttributes() : {};
        this.canvasInfo = {
            width: canvas.width,
            height: canvas.height,
            attributes: attrs
        };

        this.frameNumber = frameNumber;
        this.initialState = new gli.host.StateSnapshot(rawgl);
        this.screenshot = null;

        this.hasCheckedRedundancy = false;
        this.redundantCalls = 0;

        this.resourcesUsed = [];
        this.resourcesRead = [];
        this.resourcesWritten = [];

        this.calls = [];

        // Mark all bound resources as read
        for (var n in this.initialState) {
            var value = this.initialState[n];
            if (gli.util.isWebGLResource(value)) {
                this.markResourceRead(value.trackedObject);
                // TODO: differentiate between framebuffers (as write) and the reads
            }
        }
        for (var n = 0; n < this.initialState.attribs.length; n++) {
            var attrib = this.initialState.attribs[n];
            for (var m in attrib) {
                var value = attrib[m];
                if (gli.util.isWebGLResource(value)) {
                    this.markResourceRead(value.trackedObject);
                }
            }
        }

        this.resourceVersions = resourceCache.captureVersions();
        this.captureUniforms(rawgl, resourceCache.getPrograms());
    };

    Frame.prototype.captureUniforms = function (rawgl, allPrograms) {
        // Capture all program uniforms - nasty, but required to get accurate playback when not all uniforms are set each frame
        this.uniformValues = [];
        for (var n = 0; n < allPrograms.length; n++) {
            var program = allPrograms[n];
            var target = program.target;
            var values = {};

            var uniformCount = rawgl.getProgramParameter(target, rawgl.ACTIVE_UNIFORMS);
            for (var m = 0; m < uniformCount; m++) {
                var activeInfo = rawgl.getActiveUniform(target, m);
                if (activeInfo) {
                    var loc = rawgl.getUniformLocation(target, activeInfo.name);
                    var value = rawgl.getUniform(target, loc);
                    values[activeInfo.name] = {
                        size: activeInfo.size,
                        type: activeInfo.type,
                        value: value
                    };
                }
            }

            this.uniformValues.push({
                program: program,
                values: values
            });
        }
    };

    Frame.prototype.applyUniforms = function (gl) {
        var originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);

        for (var n = 0; n < this.uniformValues.length; n++) {
            var program = this.uniformValues[n].program;
            var values = this.uniformValues[n].values;

            var target = program.mirror.target;
            if (!target) {
                continue;
            }

            gl.useProgram(target);

            for (var name in values) {
                var data = values[name];
                var loc = gl.getUniformLocation(target, name);

                var baseName = "uniform";
                var type;
                var size;
                switch (data.type) {
                    case gl.FLOAT:
                        type = "f";
                        size = 1;
                        break;
                    case gl.FLOAT_VEC2:
                        type = "f";
                        size = 2;
                        break;
                    case gl.FLOAT_VEC3:
                        type = "f";
                        size = 3;
                        break;
                    case gl.FLOAT_VEC4:
                        type = "f";
                        size = 4;
                        break;
                    case gl.INT:
                    case gl.BOOL:
                        type = "i";
                        size = 1;
                        break;
                    case gl.INT_VEC2:
                    case gl.BOOL_VEC2:
                        type = "i";
                        size = 2;
                        break;
                    case gl.INT_VEC3:
                    case gl.BOOL_VEC3:
                        type = "i";
                        size = 3;
                        break;
                    case gl.INT_VEC4:
                    case gl.BOOL_VEC4:
                        type = "i";
                        size = 4;
                        break;
                    case gl.FLOAT_MAT2:
                        baseName += "Matrix";
                        type = "f";
                        size = 2;
                        break;
                    case gl.FLOAT_MAT3:
                        baseName += "Matrix";
                        type = "f";
                        size = 3;
                        break;
                    case gl.FLOAT_MAT4:
                        baseName += "Matrix";
                        type = "f";
                        size = 4;
                        break;
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        type = "i";
                        size = 1;
                        break;
                }
                var funcName = baseName + size + type;
                if (data.value && data.value.length !== undefined) {
                    funcName += "v";
                }
                if (baseName.indexOf("Matrix") != -1) {
                    gl[funcName].apply(gl, [loc, false, data.value]);
                } else {
                    gl[funcName].apply(gl, [loc, data.value]);
                }
            }
        }

        gl.useProgram(originalProgram);
    };

    Frame.prototype.end = function (rawgl) {
        var canvas = rawgl.canvas;

        // Take a picture! Note, this may fail for many reasons, but seems ok right now
        this.screenshot = document.createElement("canvas");
        var frag = document.createDocumentFragment();
        frag.appendChild(this.screenshot);
        this.screenshot.width = canvas.width;
        this.screenshot.height = canvas.height;
        var ctx2d = this.screenshot.getContext("2d");
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(canvas, 0, 0);
    };

    Frame.prototype.mark = function (args) {
        var call = new Call(this.calls.length, CallType.MARK, "mark", args, this);
        this.calls.push(call);
        call.complete(undefined, undefined); // needed?
        return call;
    };

    Frame.prototype.allocateCall = function (name, args) {
        var call = new Call(this.calls.length, CallType.GL, name, args, this);
        this.calls.push(call);
        return call;
    };

    Frame.prototype.findResourceVersion = function (resource) {
        for (var n = 0; n < this.resourceVersions.length; n++) {
            if (this.resourceVersions[n].resource == resource) {
                return this.resourceVersions[n].value;
            }
        }
        return null;
    };

    Frame.prototype.findResourceUsages = function (resource) {
        // Quick check to see if we have it marked as being used
        if (this.resourcesUsed.indexOf(resource) == -1) {
            // Unused this frame
            return null;
        }

        // Search all call args
        var usages = [];
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            for (var m = 0; m < call.args.length; m++) {
                if (call.args[m] == resource) {
                    usages.push(call);
                }
            }
        }
        return usages;
    };

    Frame.prototype.markResourceRead = function (resource) {
        // TODO: faster check (this can affect performance)
        if (resource) {
            if (this.resourcesUsed.indexOf(resource) == -1) {
                this.resourcesUsed.push(resource);
            }
            if (this.resourcesRead.indexOf(resource) == -1) {
                this.resourcesRead.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    this.markResourceRead(dependentResources[n]);
                }
            }
        }
    };

    Frame.prototype.markResourceWrite = function (resource) {
        // TODO: faster check (this can affect performance)
        if (resource) {
            if (this.resourcesUsed.indexOf(resource) == -1) {
                this.resourcesUsed.push(resource);
            }
            if (this.resourcesWritten.indexOf(resource) == -1) {
                this.resourcesWritten.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    this.markResourceWrite(dependentResources[n]);
                }
            }
        }
    };

    Frame.prototype.getResourcesUsedOfType = function (typename) {
        var results = [];
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            if (!resource.target) {
                continue;
            }
            if (typename == glitypename(resource.target)) {
                results.push(resource);
            }
        }
        return results;
    };

    Frame.prototype._lookupResourceVersion = function (resource) {
        // TODO: faster lookup
        for (var m = 0; m < this.resourceVersions.length; m++) {
            if (this.resourceVersions[m].resource.id === resource.id) {
                return this.resourceVersions[m].value;
            }
        }
        return null;
    };

    Frame.prototype.makeActive = function (gl, force, options, exclusions) {
        options = options || {};
        exclusions = exclusions || [];

        // Sort resources by creation order - this ensures that shaders are ready before programs, etc
        // Since dependencies are fairly straightforward, this *should* be ok
        // 0 - Buffer
        // 1 - Texture
        // 2 - Renderbuffer
        // 3 - Framebuffer
        // 4 - Shader
        // 5 - Program
        this.resourcesUsed.sort(function (a, b) {
            return a.creationOrder - b.creationOrder;
        });

        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            if (exclusions.indexOf(resource) != -1) {
                continue;
            }

            var version = this._lookupResourceVersion(resource);
            if (!version) {
                continue;
            }

            resource.restoreVersion(gl, version, force, options);
        }

        this.initialState.apply(gl);
        this.applyUniforms(gl);
    };

    Frame.prototype.cleanup = function (gl) {
        // Unbind everything
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        var dummyBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dummyBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(12), gl.STATIC_DRAW);
        for (var n = 0; n < maxVertexAttrs; n++) {
            gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
        }
        gl.deleteBuffer(dummyBuffer);
        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }

        // Dispose all objects
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            resource.disposeMirror();
        }
    };

    Frame.prototype.switchMirrors = function (setName) {
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            resource.switchMirror(setName);
        }
    };

    Frame.prototype.resetAllMirrors = function () {
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            resource.disposeAllMirrors();
        }
    };

    host.CallType = CallType;
    host.Call = Call;
    host.Frame = Frame;
})();
(function () {
    var host = glinamespace("gli.host");

    function requestCapture(context) {
        context.requestCapture(function (context, frame) {
            for (var n = 0; n < frame.calls.length; n++) {
                var call = frame.calls[n];
                call.info = gli.info.functions[call.name];
            }
            context.frames.push(frame);
            if (context.ui) {
                context.ui.appendFrame(frame);
            }
        });
    };

    var InlineWindow = function (context) {
        var self = this;
        this.context = context;

        var w = this.element = document.createElement("div");
        w.className = "yui3-cssreset inline-window-host";

        // TODO: validate height better?
        var hudHeight = gli.settings.session.hudHeight;
        hudHeight = Math.max(112, Math.min(hudHeight, window.innerHeight - 42));
        w.style.height = hudHeight + "px";

        document.body.appendChild(w);

        this.splitter = new gli.controls.SplitterBar(w, "horizontal", 112, 42, null, function (newHeight) {
            context.ui.layout();
            gli.settings.session.hudHeight = newHeight;
            gli.settings.save();
        });

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, window);
        }

        context.ui = new gli.ui.Window(context, window.document, w);
        
        this.opened = true;
        gli.settings.session.hudVisible = true;
        gli.settings.save();
    };
    InlineWindow.prototype.focus = function () {
    };
    InlineWindow.prototype.close = function () {
        if (this.element) {
            document.body.removeChild(this.element);

            this.context.ui = null;
            this.context.window = null;

            this.element = null;
            this.context = null;
            this.splitter = null;
            this.opened = false;
            gli.settings.session.hudVisible = false;
            gli.settings.save();
        }
    };
    InlineWindow.prototype.isOpened = function () {
        return this.opened;
    };
    InlineWindow.prototype.toggle = function () {
        if (this.opened) {
            this.element.style.display = "none";
        } else {
            this.element.style.display = "";
        }
        this.opened = !this.opened;
        gli.settings.session.hudVisible = this.opened;
        gli.settings.save();
        
        var self = this;
        gli.host.setTimeout(function () {
            self.context.ui.layout();
        }, 0);
    };

    var PopupWindow = function (context) {
        var self = this;
        this.context = context;

        gli.settings.session.hudVisible = true;
        gli.settings.save();

        var startupWidth = gli.settings.session.hudPopupWidth ? gli.settings.session.hudPopupWidth : 1000;
        var startupHeight = gli.settings.session.hudPopupHeight ? gli.settings.session.hudPopupHeight : 500;
        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + startupWidth + ",innerHeight=" + startupHeight);
        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body class='yui3-cssreset' style='margin: 0px; padding: 0px;'></body></html>");

        window.addEventListener("beforeunload", function () {
            w.close();
        }, false);

        w.addEventListener("unload", function () {
            context.window.browserWindow.opener.focus();
            context.window = null;
        }, false);

        // Key handler to listen for state changes
        w.document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    w.opener.focus();
                    handled = true;
                    break;
                case 123: // F12
                    requestCapture(context);
                    handled = true;
                    break;
            };

            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
        
        w.addEventListener("resize", function () {
            context.ui.layout();
            gli.settings.session.hudPopupWidth = w.innerWidth;
            gli.settings.session.hudPopupHeight = w.innerHeight;
            gli.settings.save()
        }, false);

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        }

        gli.host.setTimeout(function () {
            context.ui = new w.gli.ui.Window(context, w.document);
        }, 0);
    };
    PopupWindow.prototype.focus = function () {
        this.browserWindow.focus();
    };
    PopupWindow.prototype.close = function () {
        this.browserWindow.close();
        this.browserWindow = null;
        this.context.window = null;
        gli.settings.session.hudVisible = false;
        gli.settings.save();
    };
    PopupWindow.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    function requestFullUI(context, hiddenByDefault) {
        if (gli.settings.global.popupHud) {
            if (context.window) {
                if (context.window.isOpened()) {
                    context.window.focus();
                } else {
                    context.window.close();
                }
            }

            if (!context.window) {
                if (!hiddenByDefault) {
                    context.window = new PopupWindow(context);
                }
            }
        } else {
            if (!context.window) {
                context.window = new InlineWindow(context);
                if (hiddenByDefault) {
                    context.window.toggle();
                }
            } else {
                context.window.toggle();
            }
        }
    };

    function injectUI(ui) {
        var context = ui.context;

        var button1 = document.createElement("div");
        button1.style.zIndex = "99999";
        button1.style.position = "absolute";
        button1.style.right = "38px";
        button1.style.top = "5px";
        button1.style.cursor = "pointer";
        button1.style.backgroundColor = "rgba(50,10,10,0.8)";
        button1.style.color = "red";
        button1.style.fontSize = "8pt";
        button1.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        button1.style.fontWeight = "bold";
        button1.style.padding = "5px";
        button1.style.border = "1px solid red";
        button1.style.webkitUserSelect = "none";
        button1.style.mozUserSelect = "none";
        button1.title = "Capture frame (F12)";
        button1.innerHTML = "Capture";
        document.body.appendChild(button1);

        button1.addEventListener("click", function () {
            requestCapture(context);
        }, false);

        var button2 = document.createElement("div");
        button2.style.zIndex = "99999";
        button2.style.position = "absolute";
        button2.style.right = "5px";
        button2.style.top = "5px";
        button2.style.cursor = "pointer";
        button2.style.backgroundColor = "rgba(10,50,10,0.8)";
        button2.style.color = "rgb(0,255,0)";
        button2.style.fontSize = "8pt";
        button2.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        button2.style.fontWeight = "bold";
        button2.style.padding = "5px";
        button2.style.border = "1px solid rgb(0,255,0)";
        button2.style.webkitUserSelect = "none";
        button2.style.mozUserSelect = "none";
        button2.title = "Show full inspector (F11)";
        button2.innerHTML = "UI";
        document.body.appendChild(button2);

        button2.addEventListener("click", function () {
            requestFullUI(context);
        }, false);
    };

    function injectHandlers(ui) {
        var context = ui.context;

        // Key handler to listen for capture requests
        document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 122: // F11
                    requestFullUI(context);
                    handled = true;
                    break;
                case 123: // F12
                    requestCapture(context);
                    handled = true;
                    break;
            };

            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
    };

    var HostUI = function (context) {
        this.context = context;

        injectUI(this);
        injectHandlers(this);

        this.context.frames = [];

        var spinIntervalId;
        spinIntervalId = gli.host.setInterval(function () {
            var ready = false;
            var cssUrl = null;
            if (window["gliloader"]) {
                cssUrl = gliloader.pathRoot;
            } else {
                cssUrl = window.gliCssUrl;
            }
            ready = cssUrl && cssUrl.length;
            if (ready) {
                var hudVisible = gli.settings.session.hudVisible || gli.settings.global.showHud;
                requestFullUI(context, !hudVisible);
                gli.host.clearInterval(spinIntervalId);
            }
        }, 16);
    };

    host.requestFullUI = requestFullUI;
    host.HostUI = HostUI;
})();
(function () {
    var host = glinamespace("gli.host");

    var Notifier = function () {
        this.div = document.createElement("div");
        this.div.style.zIndex = "99999";
        this.div.style.position = "absolute";
        this.div.style.left = "5px";
        this.div.style.top = "5px";
        this.div.style.webkitTransition = "opacity .5s ease-in-out";
        this.div.style.opacity = "0";
        this.div.style.color = "yellow";
        this.div.style.fontSize = "8pt";
        this.div.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        this.div.style.backgroundColor = "rgba(0,0,0,0.8)";
        this.div.style.padding = "5px";
        this.div.style.border = "1px solid yellow";
        document.body.appendChild(this.div);
        
        this.hideTimeout = -1;
    };
    
    Notifier.prototype.postMessage = function(message) {
        console.log(message);
        this.div.style.opacity = "1";
        this.div.innerHTML = message;
        
        var self = this;
        if (this.hideTimeout >= 0) {
            gli.host.clearTimeout(this.hideTimeout);
            this.hideTimeout = -1;
        }
        this.hideTimeout = gli.host.setTimeout(function() {
            self.div.style.opacity = "0";
        }, 2000);
    };

    host.Notifier = Notifier;
})();
(function () {
    var host = glinamespace("gli.host");

    var ResourceVersion = function () {
        this.versionNumber = 0;
        this.target = null;
        this.parameters = {};
        this.calls = [];
        this.extras = {};
    };

    ResourceVersion.prototype.setParameters = function (params) {
        this.parameters = {};
        for (var n in params) {
            this.parameters[n] = params[n];
        }
    };

    ResourceVersion.prototype.setExtraParameters = function (name, params) {
        this.extras[name] = {};
        for (var n in params) {
            this.extras[name][n] = params[n];
        }
    };

    ResourceVersion.prototype.pushCall = function (name, sourceArgs) {
        var args = [];
        for (var n = 0; n < sourceArgs.length; n++) {
            args[n] = gli.util.clone(sourceArgs[n]);

            if (gli.util.isWebGLResource(args[n])) {
                var tracked = args[n].trackedObject;
                args[n] = tracked;
            }
        }
        var call = new gli.host.Call(this.calls.length, gli.host.CallType.GL, name, args);
        call.info = gli.info.functions[call.name];
        call.complete(); // needed?
        this.calls.push(call);
    };

    ResourceVersion.prototype.clone = function () {
        var clone = new ResourceVersion();
        clone.target = this.target;
        clone.setParameters(this.parameters);
        for (var n = 0; n < this.calls.length; n++) {
            clone.calls[n] = this.calls[n];
        }
        for (var n in this.extras) {
            clone.setExtraParameters(n, this.extras[n]);
        }
        return clone;
    };

    // Incrmeents with each resource allocated
    var uniqueId = 0;

    var Resource = function (gl, frameNumber, stack, target) {
        this.id = uniqueId++;
        this.status = Resource.ALIVE;

        this.defaultName = "res " + this.id;

        this.target = target;
        target.trackedObject = this;

        this.mirror = {
            gl: null,
            target: null,
            version: null
        };
        this.mirrorSets = {};
        this.mirrorSets["default"] = this.mirror;

        this.creationFrameNumber = frameNumber;
        this.creationStack = stack;
        this.deletionStack = null;

        // previousVersion is the previous version that was captured
        // currentVersion is the version as it is at the current point in time
        this.previousVersion = null;
        this.currentVersion = new ResourceVersion();
        this.versionNumber = 0;
        this.dirty = true;

        this.modified = new gli.EventSource("modified");
        this.deleted = new gli.EventSource("deleted");
    };

    Resource.ALIVE = 0;
    Resource.DEAD = 1;

    Resource.prototype.getName = function () {
        if (this.target.displayName) {
            return this.target.displayName;
        } else {
            return this.defaultName;
        }
    };

    Resource.prototype.setName = function (name, ifNeeded) {
        if (ifNeeded) {
            if (this.target.displayName) {
                return;
            }
        }
        if (this.target.displayName != name) {
            this.target.displayName = name;
            this.modified.fireDeferred(this);
        }
    };

    Resource.prototype.captureVersion = function () {
        this.dirty = false;
        return this.currentVersion;
    };

    Resource.prototype.markDirty = function (reset) {
        if (!this.dirty) {
            this.previousVersion = this.currentVersion;
            this.currentVersion = reset ? new ResourceVersion() : this.previousVersion.clone();
            this.versionNumber++;
            this.currentVersion.versionNumber = this.versionNumber;
            this.dirty = true;
            this.cachedPreview = null; // clear a preview if we have one
            this.modified.fireDeferred(this);
        } else {
            if (reset) {
                this.currentVersion = new ResourceVersion();
            }
            this.modified.fireDeferred(this);
        }
    };

    Resource.prototype.markDeleted = function (stack) {
        this.status = Resource.DEAD;
        this.deletionStack = stack;

        // TODO: hang on to object?
        //this.target = null;

        this.deleted.fireDeferred(this);
    };

    Resource.prototype.restoreVersion = function (gl, version, force, options) {
        if (force || (this.mirror.version != version)) {
            this.disposeMirror();

            this.mirror.gl = gl;
            this.mirror.version = version;
            this.mirror.target = this.createTarget(gl, version, options);
            this.mirror.target.trackedObject = this;
        } else {
            // Already at the current version
        }
    };

    Resource.prototype.switchMirror = function (setName) {
        setName = setName || "default";
        var oldMirror = this.mirror;
        var newMirror = this.mirrorSets[setName];
        if (oldMirror == newMirror) {
            return;
        }
        if (!newMirror) {
            newMirror = {
                gl: null,
                target: null,
                version: null
            };
            this.mirrorSets[setName] = newMirror;
        }
        this.mirror = newMirror;
    };

    Resource.prototype.disposeMirror = function () {
        if (this.mirror.target) {
            this.deleteTarget(this.mirror.gl, this.mirror.target);
            this.mirror.gl = null;
            this.mirror.target = null;
            this.mirror.version = null;
        }
    };

    Resource.prototype.disposeAllMirrors = function () {
        for (var setName in this.mirrorSets) {
            var mirror = this.mirrorSets[setName];
            if (mirror && mirror.target) {
                this.deleteTarget(mirror.gl, mirror.target);
                mirror.gl = null;
                mirror.target = null;
                mirror.version = null;
            }
        }
    };

    Resource.prototype.createTarget = function (gl, version, options) {
        console.log("unimplemented createTarget");
        return null;
    };

    Resource.prototype.deleteTarget = function (gl, target) {
        console.log("unimplemented deleteTarget");
    };

    Resource.prototype.replayCalls = function (gl, version, target, filter) {
        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
                if (args[m] == this) {
                    args[m] = target;
                } else if (args[m] && args[m].mirror) {
                    args[m] = args[m].mirror.target;
                }
            }

            if (filter) {
                if (filter(call, args) == false) {
                    continue;
                }
            }

            gl[call.name].apply(gl, args);
        }
    }

    host.ResourceVersion = ResourceVersion;
    host.Resource = Resource;
})();
(function () {
    var host = glinamespace("gli.host");
    var resources = glinamespace("gli.resources");

    function setCaptures(cache, context) {
        var gl = context; //.rawgl;

        var generateStack;
        if (context.options.resourceStacks) {
            generateStack = function () {
                // Generate stack trace
                var stack = printStackTrace();
                // ignore garbage
                stack = stack.slice(4);
                // Fix up our type
                stack[0] = stack[0].replace("[object Object].", "gl.");
                return stack;
            };
        } else {
            generateStack = function () { return null; }
        }

        function captureCreateDelete(typeName) {
            var originalCreate = gl["create" + typeName];
            gl["create" + typeName] = function () {
                // Track object count
                gl.statistics[typeName.toLowerCase() + "Count"].value++;

                var result = originalCreate.apply(gl, arguments);
                var tracked = new resources[typeName](gl, context.frameNumber, generateStack(), result, arguments);
                if (tracked) {
                    cache.registerResource(tracked);
                }
                return result;
            };
            var originalDelete = gl["delete" + typeName];
            gl["delete" + typeName] = function () {
                // Track object count
                gl.statistics[typeName.toLowerCase() + "Count"].value--;

                var tracked = arguments[0] ? arguments[0].trackedObject : null;
                if (tracked) {
                    // Track total buffer and texture bytes consumed
                    if (typeName == "Buffer") {
                        gl.statistics.bufferBytes.value -= tracked.estimatedSize;
                    } else if (typeName == "Texture") {
                        gl.statistics.textureBytes.value -= tracked.estimatedSize;
                    }

                    tracked.markDeleted(generateStack());
                }
                originalDelete.apply(gl, arguments);
            };
        };

        captureCreateDelete("Buffer");
        captureCreateDelete("Framebuffer");
        captureCreateDelete("Program");
        captureCreateDelete("Renderbuffer");
        captureCreateDelete("Shader");
        captureCreateDelete("Texture");

        var glvao = gl.getExtension("OES_vertex_array_object");
        if (glvao) {
            (function() {
                var originalCreate = glvao.createVertexArrayOES;
                glvao.createVertexArrayOES = function () {
                    // Track object count
                    gl.statistics["vertexArrayObjectCount"].value++;

                    var result = originalCreate.apply(glvao, arguments);
                    var tracked = new resources.VertexArrayObjectOES(gl, context.frameNumber, generateStack(), result, arguments);
                    if (tracked) {
                        cache.registerResource(tracked);
                    }
                    return result;
                };
                var originalDelete = glvao.deleteVertexArrayOES;
                glvao.deleteVertexArrayOES = function () {
                    // Track object count
                    gl.statistics["vertexArrayObjectCount"].value--;

                    var tracked = arguments[0] ? arguments[0].trackedObject : null;
                    if (tracked) {
                        tracked.markDeleted(generateStack());
                    }
                    originalDelete.apply(glvao, arguments);
                };
            })();
        }

        resources.Buffer.setCaptures(gl);
        resources.Framebuffer.setCaptures(gl);
        resources.Program.setCaptures(gl);
        resources.Renderbuffer.setCaptures(gl);
        resources.Shader.setCaptures(gl);
        resources.Texture.setCaptures(gl);
        resources.VertexArrayObjectOES.setCaptures(gl);
    };

    var ResourceCache = function (context) {
        this.context = context;

        this.resources = [];

        this.resourceRegistered = new gli.EventSource("resourceRegistered");

        setCaptures(this, context);
    };

    ResourceCache.prototype.registerResource = function (resource) {
        this.resources.push(resource);
        this.resourceRegistered.fire(resource);
    };

    ResourceCache.prototype.captureVersions = function () {
        var allResources = [];
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            allResources.push({
                resource: resource,
                value: resource.captureVersion()
            });
        }
        return allResources;
    };

    ResourceCache.prototype.getResources = function (name) {
        var selectedResources = [];
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            var typename = glitypename(resource.target);
            if (typename == name) {
                selectedResources.push(resource);
            }
        }
        return selectedResources;
    };

    ResourceCache.prototype.getResourceById = function (id) {
        // TODO: fast lookup
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            if (resource.id === id) {
                return resource;
            }
        }
        return null;
    };

    ResourceCache.prototype.getTextures = function () {
        return this.getResources("WebGLTexture");
    };

    ResourceCache.prototype.getBuffers = function () {
        return this.getResources("WebGLBuffer");
    };

    ResourceCache.prototype.getPrograms = function () {
        return this.getResources("WebGLProgram");
    };

    host.ResourceCache = ResourceCache;
})();
(function () {
    var host = glinamespace("gli.host");

    var Counter = function (name, description, unit, color, enabledByDefault) {
        this.name = name;
        this.description = description;
        this.unit = unit;
        this.color = color;
        this.enabled = enabledByDefault;

        this.value = 0;
        this.previousValue = 0;
        this.averageValue = 0;
    };

    var Statistics = function () {
        this.counters = [];

        this.counters.push(new Counter("frameTime", "Frame Time", "ms", "rgb(0,0,0)", true));
        this.counters.push(new Counter("drawsPerFrame", "Draws/Frame", null, "rgb(255,0,0)", true));
        this.counters.push(new Counter("primitivesPerFrame", "Primitives/Frame", null, "rgb(100,0,0)", true));
        this.counters.push(new Counter("callsPerFrame", "Calls/Frame", null, "rgb(100,0,0)", false));
        this.counters.push(new Counter("redundantCalls", "Redundant Call %", null, "rgb(0,100,0)", false));
        this.counters.push(new Counter("textureCount", "Textures", null, "rgb(0,255,0)", true));
        this.counters.push(new Counter("bufferCount", "Buffers", null, "rgb(0,100,0)", true));
        this.counters.push(new Counter("programCount", "Programs", null, "rgb(0,200,0)", true));
        this.counters.push(new Counter("framebufferCount", "Framebuffers", null, "rgb(0,0,0)", false));
        this.counters.push(new Counter("renderbufferCount", "Renderbuffers", null, "rgb(0,0,0)", false));
        this.counters.push(new Counter("shaderCount", "Shaders", null, "rgb(0,0,0)", false));
        this.counters.push(new Counter("vertexArrayObjectCount", "VAOs", null, "rgb(0,0,0)", false));
        this.counters.push(new Counter("textureBytes", "Texture Memory", "MB", "rgb(0,0,255)", true));
        this.counters.push(new Counter("bufferBytes", "Buffer Memory", "MB", "rgb(0,0,100)", true));
        this.counters.push(new Counter("textureWrites", "Texture Writes/Frame", "MB", "rgb(255,255,0)", true));
        this.counters.push(new Counter("bufferWrites", "Buffer Writes/Frame", "MB", "rgb(100,100,0)", true));
        this.counters.push(new Counter("textureReads", "Texture Reads/Frame", "MB", "rgb(0,255,255)", true));

        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];
            this[counter.name] = counter;
        }

        this.history = [];
    };

    Statistics.prototype.clear = function () {
        this.history.length = 0;
    };

    Statistics.prototype.beginFrame = function () {
        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];
            counter.previousValue = counter.value;
        }

        this.frameTime.value = 0;
        this.drawsPerFrame.value = 0;
        this.primitivesPerFrame.value = 0;
        this.callsPerFrame.value = 0;
        this.redundantCalls.value = 0;
        this.textureWrites.value = 0;
        this.bufferWrites.value = 0;
        this.textureReads.value = 0;

        this.startTime = (new Date()).getTime();
    };

    Statistics.prototype.endFrame = function () {
        this.frameTime.value = (new Date()).getTime() - this.startTime;

        // Redundant call calculation
        if (this.callsPerFrame.value > 0) {
            this.redundantCalls.value = this.redundantCalls.value / this.callsPerFrame.value * 100;
        } else {
            this.redundantCalls.value = 0;
        }

        var slice = [];
        slice[this.counters.length - 1] = 0;
        for (var n = 0; n < this.counters.length; n++) {
            var counter = this.counters[n];

            // Average things and store the values off
            // TODO: better average calculation
            if (counter.averageValue == 0) {
                counter.averageValue = counter.value;
            } else {
                counter.averageValue = (counter.value * 75 + counter.averageValue * 25) / 100;
            }

            // Store in history
            slice[n] = counter.averageValue;
        }

        //this.history.push(slice);
    };

    host.Statistics = Statistics;
})();
(function () {
    var resources = glinamespace("gli.resources");

    var Buffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 0;

        this.defaultName = "Buffer " + this.id;

        this.type = gl.ARRAY_BUFFER; // ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER

        this.parameters = {};
        this.parameters[gl.BUFFER_SIZE] = 0;
        this.parameters[gl.BUFFER_USAGE] = gl.STATIC_DRAW;

        this.currentVersion.type = this.type;
        this.currentVersion.structure = null;
        this.currentVersion.lastDrawState = null;
        this.currentVersion.setParameters(this.parameters);

        this.estimatedSize = 0;
    };

    Buffer.prototype.refresh = function (gl) {
        var paramEnums = [gl.BUFFER_SIZE, gl.BUFFER_USAGE];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getBufferParameter(this.type, paramEnums[n]);
        }
    };

    Buffer.getTracked = function (gl, args) {
        var bindingEnum;
        switch (args[0]) {
            default:
            case gl.ARRAY_BUFFER:
                bindingEnum = gl.ARRAY_BUFFER_BINDING;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                bindingEnum = gl.ELEMENT_ARRAY_BUFFER_BINDING;
                break;
        }
        var glbuffer = gl.rawgl.getParameter(bindingEnum);
        if (glbuffer == null) {
            // Going to fail
            return null;
        }
        return glbuffer.trackedObject;
    };

    Buffer.setCaptures = function (gl) {
        var original_bufferData = gl.bufferData;
        gl.bufferData = function () {
            // Track buffer writes
            var totalBytes = 0;
            if (arguments[1] && arguments[1].byteLength) {
                totalBytes = arguments[1].byteLength;
            } else {
                totalBytes = arguments[1];
            }
            gl.statistics.bufferWrites.value += totalBytes;

            var tracked = Buffer.getTracked(gl, arguments);
            tracked.type = arguments[0];

            // Track total buffer bytes consumed
            gl.statistics.bufferBytes.value -= tracked.estimatedSize;
            gl.statistics.bufferBytes.value += totalBytes;
            tracked.estimatedSize = totalBytes;

            tracked.markDirty(true);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.structure = null;
            tracked.currentVersion.lastDrawState = null;
            tracked.currentVersion.pushCall("bufferData", arguments);
            var result = original_bufferData.apply(gl, arguments);
            tracked.refresh(gl.rawgl);
            tracked.currentVersion.setParameters(tracked.parameters);
            return result;
        };

        var original_bufferSubData = gl.bufferSubData;
        gl.bufferSubData = function () {
            // Track buffer writes
            var totalBytes = 0;
            if (arguments[2]) {
                totalBytes = arguments[2].byteLength;
            }
            gl.statistics.bufferWrites.value += totalBytes;

            var tracked = Buffer.getTracked(gl, arguments);
            tracked.type = arguments[0];
            tracked.markDirty(false);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.structure = null;
            tracked.currentVersion.lastDrawState = null;
            tracked.currentVersion.pushCall("bufferSubData", arguments);
            return original_bufferSubData.apply(gl, arguments);
        };

        // This is constant, so fetch once
        var maxVertexAttribs = gl.rawgl.getParameter(gl.MAX_VERTEX_ATTRIBS);

        function assignDrawStructure(arguments) {
            var rawgl = gl.rawgl;
            var mode = arguments[0];

            var drawState = {
                mode: mode,
                elementArrayBuffer: null,
                elementArrayBufferType: null,
                first: 0,
                offset: 0,
                count: 0
            };
            if (arguments.length == 3) {
                // drawArrays
                drawState.first = arguments[1];
                drawState.count = arguments[2];
            } else {
                // drawElements
                var glelementArrayBuffer = rawgl.getParameter(rawgl.ELEMENT_ARRAY_BUFFER_BINDING);
                drawState.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
                drawState.elementArrayBufferType = arguments[2];
                drawState.offset = arguments[3];
                drawState.count = arguments[1];
            }

            // TODO: cache all draw state so that we don't have to query each time
            var allDatas = {};
            var allBuffers = [];
            for (var n = 0; n < maxVertexAttribs; n++) {
                if (rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
                    var glbuffer = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
                    var buffer = glbuffer.trackedObject;
                    if (buffer.currentVersion.structure) {
                        continue;
                    }

                    var size = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_SIZE);
                    var stride = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_STRIDE);
                    var offset = rawgl.getVertexAttribOffset(n, rawgl.VERTEX_ATTRIB_ARRAY_POINTER);
                    var type = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_TYPE);
                    var normalized = rawgl.getVertexAttrib(n, rawgl.VERTEX_ATTRIB_ARRAY_NORMALIZED);

                    var datas = allDatas[buffer.id];
                    if (!datas) {
                        datas = allDatas[buffer.id] = [];
                        allBuffers.push(buffer);
                    }

                    datas.push({
                        size: size,
                        stride: stride,
                        offset: offset,
                        type: type,
                        normalized: normalized
                    });
                }
            }

            // TODO: build structure
            for (var n = 0; n < allBuffers.length; n++) {
                var buffer = allBuffers[n];
                var datas = allDatas[buffer.id];
                datas.sort(function (a, b) {
                    return a.offset - b.offset;
                });

                buffer.currentVersion.structure = datas;
                buffer.currentVersion.lastDrawState = drawState;
            }
        };

        function calculatePrimitiveCount(gl, mode, count) {
            switch (mode) {
                case gl.POINTS:
                    return count;
                case gl.LINE_STRIP:
                    return count - 1;
                case gl.LINE_LOOP:
                    return count;
                case gl.LINES:
                    return count / 2;
                case gl.TRIANGLE_STRIP:
                    return count - 2;
                default:
                case gl.TRIANGLES:
                    return count / 3;
            }
        };

        var origin_drawArrays = gl.drawArrays;
        gl.drawArrays = function () {
            //void drawArrays(GLenum mode, GLint first, GLsizei count);
            if (gl.captureFrame) {
                assignDrawStructure(arguments);
            }

            // Track draw stats
            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[2]);
            gl.statistics.drawsPerFrame.value++;
            gl.statistics.primitivesPerFrame.value += totalPrimitives;

            return origin_drawArrays.apply(gl, arguments);
        };

        var origin_drawElements = gl.drawElements;
        gl.drawElements = function () {
            //void drawElements(GLenum mode, GLsizei count, GLenum type, GLsizeiptr offset);
            if (gl.captureFrame) {
                assignDrawStructure(arguments);
            }

            // Track draw stats
            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[1]);
            gl.statistics.drawsPerFrame.value++;
            gl.statistics.primitivesPerFrame.value += totalPrimitives

            return origin_drawElements.apply(gl, arguments);
        };
    };

    Buffer.prototype.createTarget = function (gl, version, options) {
        options = options || {};

        var buffer = gl.createBuffer();
        gl.bindBuffer(version.target, buffer);

        // Filter uploads if requested
        var uploadFilter = null;
        if (options.ignoreBufferUploads) {
            uploadFilter = function uploadFilter(call, args) {
                if ((call.name == "bufferData") || (call.name == "bufferSubData")) {
                    return false;
                }
                return true;
            };
        }

        this.replayCalls(gl, version, buffer, uploadFilter);

        return buffer;
    };

    Buffer.prototype.deleteTarget = function (gl, target) {
        gl.deleteBuffer(target);
    };

    Buffer.prototype.constructVersion = function (gl, version) {
        // Find the last bufferData call to initialize the data
        var subDataCalls = [];
        var data = null;
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            if (call.name == "bufferData") {
                var sourceArray = call.args[1];
                if (sourceArray.constructor == Number) {
                    // Size - create an empty array
                    data = new ArrayBuffer(sourceArray);
                    break;
                } else {
                    // Has to be an ArrayBuffer or ArrayBufferView
                    data = gli.util.clone(sourceArray);
                    break;
                }
            } else if (call.name == "bufferSubData") {
                // Queue up for later
                subDataCalls.unshift(call);
            }
        }
        if (!data) {
            // No bufferData calls!
            return [];
        }

        // Apply bufferSubData calls
        for (var n = 0; n < subDataCalls.length; n++) {
            var call = subDataCalls[n];
            var offset = call.args[1];
            var sourceArray = call.args[2];

            var view;
            switch (glitypename(sourceArray)) {
                case "Int8Array":
                    view = new Int8Array(data, offset);
                    break;
                case "Uint8Array":
                    view = new Uint8Array(data, offset);
                    break;
                case "Int16Array":
                    view = new Int16Array(data, offset);
                    break;
                case "Uint16Array":
                    view = new Uint16Array(data, offset);
                    break;
                case "Int32Array":
                    view = new Int32Array(data, offset);
                    break;
                case "Uint32Array":
                    view = new Uint32Array(data, offset);
                    break;
                case "Float32Array":
                    view = new Float32Array(data, offset);
                    break;
            }
            for (var i = 0; i < sourceArray.length; i++) {
                view[i] = sourceArray[i];
            }
        }

        return data;
    };

    resources.Buffer = Buffer;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var Framebuffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 3;

        this.defaultName = "Framebuffer " + this.id;

        // Track the attachments a framebuffer has (watching framebufferRenderbuffer/etc calls)
        this.attachments = {};

        this.parameters = {};
        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
        // These parameters are per-attachment
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL] = 0;
        //this.parameters[gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE] = 0;

        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("attachments", this.attachments);
    };

    Framebuffer.prototype.getDependentResources = function () {
        var resources = [];
        for (var n in this.attachments) {
            var attachment = this.attachments[n];
            if (resources.indexOf(attachment) == -1) {
                resources.push(attachment);
            }
        }
        return resources;
    };

    Framebuffer.prototype.refresh = function (gl) {
        // Attachments: COLOR_ATTACHMENT0, DEPTH_ATTACHMENT, STENCIL_ATTACHMENT
        //var paramEnums = [gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE];
        //for (var n = 0; n < paramEnums.length; n++) {
        //    this.parameters[paramEnums[n]] = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, attachment, paramEnums[n]);
        //}
    };

    Framebuffer.getTracked = function (gl, args) {
        // only FRAMEBUFFER
        var bindingEnum = gl.FRAMEBUFFER_BINDING;
        var glframebuffer = gl.getParameter(bindingEnum);
        if (glframebuffer == null) {
            // Going to fail
            return null;
        }
        return glframebuffer.trackedObject;
    };

    Framebuffer.setCaptures = function (gl) {
        var original_framebufferRenderbuffer = gl.framebufferRenderbuffer;
        gl.framebufferRenderbuffer = function () {
            var tracked = Framebuffer.getTracked(gl, arguments);
            tracked.markDirty(false);
            // TODO: remove existing calls for this attachment
            tracked.currentVersion.pushCall("framebufferRenderbuffer", arguments);

            // Save attachment
            tracked.attachments[arguments[1]] = arguments[3] ? arguments[3].trackedObject : null;
            tracked.currentVersion.setExtraParameters("attachments", tracked.attachments);

            var result = original_framebufferRenderbuffer.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };

        var original_framebufferTexture2D = gl.framebufferTexture2D;
        gl.framebufferTexture2D = function () {
            var tracked = Framebuffer.getTracked(gl, arguments);
            tracked.markDirty(false);
            // TODO: remove existing calls for this attachment
            tracked.currentVersion.pushCall("framebufferTexture2D", arguments);

            // Save attachment
            tracked.attachments[arguments[1]] = arguments[3] ? arguments[3].trackedObject : null;
            tracked.currentVersion.setExtraParameters("attachments", tracked.attachments);

            var result = original_framebufferTexture2D.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };
    };

    Framebuffer.prototype.createTarget = function (gl, version) {
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        this.replayCalls(gl, version, framebuffer);

        return framebuffer;
    };

    Framebuffer.prototype.deleteTarget = function (gl, target) {
        gl.deleteFramebuffer(target);
    };

    resources.Framebuffer = Framebuffer;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var Program = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 5;

        this.defaultName = "Program " + this.id;

        this.shaders = [];

        this.parameters = {};
        this.parameters[gl.DELETE_STATUS] = 0;
        this.parameters[gl.LINK_STATUS] = 0;
        this.parameters[gl.VALIDATE_STATUS] = 0;
        this.parameters[gl.ATTACHED_SHADERS] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTES] = 0;
        this.parameters[gl.ACTIVE_UNIFORMS] = 0;
        this.infoLog = null;

        this.uniformInfos = [];
        this.attribInfos = [];
        this.attribBindings = {};

        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
        this.currentVersion.setExtraParameters("uniformInfos", this.uniformInfos);
        this.currentVersion.setExtraParameters("attribInfos", this.attribInfos);
        this.currentVersion.setExtraParameters("attribBindings", this.attribBindings);
    };

    Program.prototype.getDependentResources = function () {
        return this.shaders;
    };

    Program.prototype.getShader = function (type) {
        for (var n = 0; n < this.shaders.length; n++) {
            var shader = this.shaders[n];
            if (shader.type == type) {
                return shader;
            }
        }
        return null;
    }

    Program.prototype.getVertexShader = function (gl) {
        return this.getShader(gl.VERTEX_SHADER);
    };

    Program.prototype.getFragmentShader = function (gl) {
        return this.getShader(gl.FRAGMENT_SHADER);
    };

    Program.prototype.getUniformInfos = function (gl, target) {
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);

        var uniformInfos = [];
        var uniformCount = gl.getProgramParameter(target, gl.ACTIVE_UNIFORMS);
        for (var n = 0; n < uniformCount; n++) {
            var activeInfo = gl.getActiveUniform(target, n);
            if (activeInfo) {
                var loc = gl.getUniformLocation(target, activeInfo.name);
                var value = gli.util.clone(gl.getUniform(target, loc));
                value = (value !== null) ? value : 0;

                var isSampler = false;
                var textureType;
                var bindingEnum;
                var textureValue = null;
                switch (activeInfo.type) {
                    case gl.SAMPLER_2D:
                        isSampler = true;
                        textureType = gl.TEXTURE_2D;
                        bindingType = gl.TEXTURE_BINDING_2D;
                        break;
                    case gl.SAMPLER_CUBE:
                        isSampler = true;
                        textureType = gl.TEXTURE_CUBE_MAP;
                        bindingType = gl.TEXTURE_BINDING_CUBE_MAP;
                        break;
                }
                if (isSampler) {
                    gl.activeTexture(gl.TEXTURE0 + value);
                    var texture = gl.getParameter(bindingType);
                    textureValue = texture ? texture.trackedObject : null;
                }

                uniformInfos[n] = {
                    index: n,
                    name: activeInfo.name,
                    size: activeInfo.size,
                    type: activeInfo.type,
                    value: value,
                    textureValue: textureValue
                };
            }
            if (gl.ignoreErrors) {
                gl.ignoreErrors();
            }
        }

        gl.activeTexture(originalActiveTexture);
        return uniformInfos;
    };

    Program.prototype.getAttribInfos = function (gl, target) {
        var attribInfos = [];
        var remainingAttribs = gl.getProgramParameter(target, gl.ACTIVE_ATTRIBUTES);
        var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        var attribIndex = 0;
        while (remainingAttribs > 0) {
            var activeInfo = gl.getActiveAttrib(target, attribIndex);
            if (activeInfo && activeInfo.type) {
                remainingAttribs--;
                var loc = gl.getAttribLocation(target, activeInfo.name);
                var bufferBinding = gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
                attribInfos.push({
                    index: attribIndex,
                    loc: loc,
                    name: activeInfo.name,
                    size: activeInfo.size,
                    type: activeInfo.type,
                    state: {
                        enabled: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
                        buffer: bufferBinding ? bufferBinding.trackedObject : null,
                        size: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_SIZE),
                        stride: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
                        type: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_TYPE),
                        normalized: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
                        pointer: gl.getVertexAttribOffset(loc, gl.VERTEX_ATTRIB_ARRAY_POINTER),
                        value: gl.getVertexAttrib(loc, gl.CURRENT_VERTEX_ATTRIB)
                    }
                });
            }
            if (gl.ignoreErrors) {
                gl.ignoreErrors();
            }
            attribIndex++;
            if (attribIndex >= maxAttribs) {
                break;
            }
        }
        return attribInfos;
    };

    Program.prototype.refresh = function (gl) {
        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_UNIFORMS];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);
    };

    Program.setCaptures = function (gl) {
        var original_attachShader = gl.attachShader;
        gl.attachShader = function () {
            if (arguments[0] && arguments[1]) {
                var tracked = arguments[0].trackedObject;
                var trackedShader = arguments[1].trackedObject;
                tracked.shaders.push(trackedShader);
                tracked.parameters[gl.ATTACHED_SHADERS]++;
                tracked.markDirty(false);
                tracked.currentVersion.setParameters(tracked.parameters);
                tracked.currentVersion.pushCall("attachShader", arguments);
            }
            return original_attachShader.apply(gl, arguments);
        };

        var original_detachShader = gl.detachShader;
        gl.detachShader = function () {
            if (arguments[0] && arguments[1]) {
                var tracked = arguments[0].trackedObject;
                var trackedShader = arguments[1].trackedObject;
                var index = tracked.shaders.indexOf(trackedShader);
                if (index >= 0) {
                    tracked.shaders.splice(index, 1);
                }
                tracked.parameters[gl.ATTACHED_SHADERS]--;
                tracked.markDirty(false);
                tracked.currentVersion.setParameters(tracked.parameters);
                tracked.currentVersion.pushCall("detachShader", arguments);
            }
            return original_detachShader.apply(gl, arguments);
        };

        var original_linkProgram = gl.linkProgram;
        gl.linkProgram = function () {
            var tracked = arguments[0].trackedObject;
            var result = original_linkProgram.apply(gl, arguments);

            // Refresh params
            tracked.refresh(gl.rawgl);

            // Grab uniforms
            tracked.uniformInfos = tracked.getUniformInfos(gl, tracked.target);

            // Grab attribs
            tracked.attribInfos = tracked.getAttribInfos(gl, tracked.target);

            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("linkProgram", arguments);
            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
            tracked.currentVersion.setExtraParameters("uniformInfos", tracked.uniformInfos);
            tracked.currentVersion.setExtraParameters("attribInfos", tracked.attribInfos);
            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

            return result;
        };

        var original_bindAttribLocation = gl.bindAttribLocation;
        gl.bindAttribLocation = function () {
            var tracked = arguments[0].trackedObject;
            var index = arguments[1];
            var name = arguments[2];
            tracked.attribBindings[index] = name;

            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("bindAttribLocation", arguments);
            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

            return original_bindAttribLocation.apply(gl, arguments);
        };

        // Cache off uniform name so that we can retrieve it later
        var original_getUniformLocation = gl.getUniformLocation;
        gl.getUniformLocation = function () {
            var result = original_getUniformLocation.apply(gl, arguments);
            if (result) {
                var tracked = arguments[0].trackedObject;
                result.sourceProgram = tracked;
                result.sourceUniformName = arguments[1];
            }
            return result;
        };
    };

    Program.prototype.createTarget = function (gl, version, options) {
        options = options || {};

        var program = gl.createProgram();

        this.replayCalls(gl, version, program);

        return program;
    };

    Program.prototype.deleteTarget = function (gl, target) {
        gl.deleteProgram(target);
    };

    resources.Program = Program;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var Renderbuffer = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 2;

        this.defaultName = "Renderbuffer " + this.id;

        this.parameters = {};
        this.parameters[gl.RENDERBUFFER_WIDTH] = 0;
        this.parameters[gl.RENDERBUFFER_HEIGHT] = 0;
        this.parameters[gl.RENDERBUFFER_INTERNAL_FORMAT] = gl.RGBA4;
        this.parameters[gl.RENDERBUFFER_RED_SIZE] = 0;
        this.parameters[gl.RENDERBUFFER_GREEN_SIZE] = 0;
        this.parameters[gl.RENDERBUFFER_BLUE_SIZE] = 0;
        this.parameters[gl.RENDERBUFFER_ALPHA_SIZE] = 0;
        this.parameters[gl.RENDERBUFFER_DEPTH_SIZE] = 0;
        this.parameters[gl.RENDERBUFFER_STENCIL_SIZE] = 0;

        this.currentVersion.setParameters(this.parameters);
    };

    Renderbuffer.prototype.refresh = function (gl) {
        var paramEnums = [gl.RENDERBUFFER_WIDTH, gl.RENDERBUFFER_HEIGHT, gl.RENDERBUFFER_INTERNAL_FORMAT, gl.RENDERBUFFER_RED_SIZE, gl.RENDERBUFFER_GREEN_SIZE, gl.RENDERBUFFER_BLUE_SIZE, gl.RENDERBUFFER_ALPHA_SIZE, gl.RENDERBUFFER_DEPTH_SIZE, gl.RENDERBUFFER_STENCIL_SIZE];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getRenderbufferParameter(gl.RENDERBUFFER, paramEnums[n]);
        }
    };

    Renderbuffer.getTracked = function (gl, args) {
        // only RENDERBUFFER
        var bindingEnum = gl.RENDERBUFFER_BINDING;
        var glrenderbuffer = gl.getParameter(bindingEnum);
        if (glrenderbuffer == null) {
            // Going to fail
            return null;
        }
        return glrenderbuffer.trackedObject;
    };

    Renderbuffer.setCaptures = function (gl) {
        var original_renderbufferStorage = gl.renderbufferStorage;
        gl.renderbufferStorage = function () {
            var tracked = Renderbuffer.getTracked(gl, arguments);
            tracked.markDirty(true);
            tracked.currentVersion.pushCall("renderbufferStorage", arguments);

            var result = original_renderbufferStorage.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };
    };

    Renderbuffer.prototype.createTarget = function (gl, version) {
        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);

        this.replayCalls(gl, version, renderbuffer);

        return renderbuffer;
    };

    Renderbuffer.prototype.deleteTarget = function (gl, target) {
        gl.deleteRenderbuffer(target);
    };

    resources.Renderbuffer = Renderbuffer;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var Shader = function (gl, frameNumber, stack, target, args) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 4;

        this.defaultName = "Shader " + this.id;

        this.type = args[0]; // VERTEX_SHADER, FRAGMENT_SHADER

        this.source = null;

        this.parameters = {};
        this.parameters[gl.SHADER_TYPE] = this.type;
        this.parameters[gl.DELETE_STATUS] = 0;
        this.parameters[gl.COMPILE_STATUS] = 0;
        this.infoLog = null;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
    };

    Shader.prototype.refresh = function (gl) {
        var paramEnums = [gl.SHADER_TYPE, gl.DELETE_STATUS, gl.COMPILE_STATUS];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getShaderParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getShaderInfoLog(this.target);
    };

    Shader.setCaptures = function (gl) {
        var original_shaderSource = gl.shaderSource;
        gl.shaderSource = function () {
            var tracked = arguments[0].trackedObject;
            tracked.source = arguments[1];
            tracked.markDirty(true);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("shaderSource", arguments);
            return original_shaderSource.apply(gl, arguments);
        };

        var original_compileShader = gl.compileShader;
        gl.compileShader = function () {
            var tracked = arguments[0].trackedObject;
            tracked.markDirty(false);
            var result = original_compileShader.apply(gl, arguments);
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
            tracked.currentVersion.pushCall("compileShader", arguments);
            return result;
        };
    };

    Shader.prototype.createTarget = function (gl, version, options) {
        var shader = gl.createShader(version.target);

        this.replayCalls(gl, version, shader, function (call, args) {
            if (options.fragmentShaderOverride) {
                if (call.name == "shaderSource") {
                    if (version.target == gl.FRAGMENT_SHADER) {
                        args[1] = options.fragmentShaderOverride;
                    }
                }
            }
            return true;
        });

        return shader;
    };

    Shader.prototype.deleteTarget = function (gl, target) {
        gl.deleteShader(target);
    };

    resources.Shader = Shader;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var Texture = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 1;

        this.defaultName = "Texture " + this.id;

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);

        this.estimatedSize = 0;
    };

    Texture.prototype.guessSize = function (gl, version, face) {
        version = version || this.currentVersion;
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            if (call.name == "texImage2D") {
                if (face) {
                    if (call.args[0] != face) {
                        continue;
                    }
                }
                if (call.args.length == 9) {
                    return [call.args[3], call.args[4]];
                } else {
                    var sourceObj = call.args[5];
                    if (sourceObj) {
                        return [sourceObj.width, sourceObj.height];
                    } else {
                        return null;
                    }
                }
            }
        }
        return null;
    };

    Texture.prototype.refresh = function (gl) {
        var paramEnums = [gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MIN_FILTER, gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
        }
    };

    Texture.getTracked = function (gl, args) {
        var bindingEnum;
        switch (args[0]) {
            case gl.TEXTURE_2D:
                bindingEnum = gl.TEXTURE_BINDING_2D;
                break;
            case gl.TEXTURE_CUBE_MAP:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                bindingEnum = gl.TEXTURE_BINDING_CUBE_MAP;
                break;
        }
        var gltexture = gl.rawgl.getParameter(bindingEnum);
        if (gltexture == null) {
            // Going to fail
            return null;
        }
        return gltexture.trackedObject;
    };

    Texture.setCaptures = function (gl) {
        // TODO: copyTexImage2D
        // TODO: copyTexSubImage2D

        var original_texParameterf = gl.texParameterf;
        gl.texParameterf = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                tracked.parameters[arguments[1]] = arguments[2];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                tracked.currentVersion.setParameters(tracked.parameters);
            }

            return original_texParameterf.apply(gl, arguments);
        };
        var original_texParameteri = gl.texParameteri;
        gl.texParameteri = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                tracked.parameters[arguments[1]] = arguments[2];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                tracked.currentVersion.setParameters(tracked.parameters);
            }

            return original_texParameteri.apply(gl, arguments);
        };

        function pushPixelStoreState(gl, version) {
            var pixelStoreEnums = [gl.PACK_ALIGNMENT, gl.UNPACK_ALIGNMENT, gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.UNPACK_FLIP_Y_WEBGL, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL];
            for (var n = 0; n < pixelStoreEnums.length; n++) {
                var pixelStoreEnum = pixelStoreEnums[n];
                if (pixelStoreEnum === undefined) {
                    continue;
                }
                var value = gl.getParameter(pixelStoreEnums[n]);
                version.pushCall("pixelStorei", [pixelStoreEnum, value]);
            }
        };

        function calculateBpp(gl, format, type) {
            switch (type) {
                default:
                case gl.UNSIGNED_BYTE:
                    switch (format) {
                        case gl.ALPHA:
                        case gl.LUMINANCE:
                            return 1;
                        case gl.LUMINANCE_ALPHA:
                            return 2;
                        case gl.RGB:
                            return 3;
                        default:
                        case gl.RGBA:
                            return 4;
                    }
                    return 4;
                case gl.UNSIGNED_SHORT_5_6_5:
                    return 2;
                case gl.UNSIGNED_SHORT_4_4_4_4:
                    return 2;
                case gl.UNSIGNED_SHORT_5_5_5_1:
                    return 2;
            }
        };

        var original_texImage2D = gl.texImage2D;
        gl.texImage2D = function () {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = arguments[3] * arguments[4] * calculateBpp(gl, arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[5];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = width * height * calculateBpp(gl, arguments[3], arguments[4]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];

                // Track total texture bytes consumed
                gl.statistics.textureBytes.value -= tracked.estimatedSize;
                gl.statistics.textureBytes.value += totalBytes;
                tracked.estimatedSize = totalBytes;

                // If a 2D texture this is always a reset, otherwise it may be a single face of the cube
                if (arguments[0] == gl.TEXTURE_2D) {
                    tracked.markDirty(true);
                    tracked.currentVersion.setParameters(tracked.parameters);
                } else {
                    // Cube face - always partial
                    tracked.markDirty(false);
                }
                tracked.currentVersion.target = tracked.type;

                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("texImage2D", arguments);

                // If this is an upload from something with a URL and we haven't been named yet, auto name us
                if (arguments.length == 6) {
                    var sourceArg = arguments[5];
                    if (sourceArg && sourceArg.src) {
                        if (!tracked.target.displayName) {
                            var filename = sourceArg.src;
                            var lastSlash = filename.lastIndexOf("/");
                            if (lastSlash >= 0) {
                                filename = filename.substr(lastSlash + 1);
                            }
                            var lastDot = filename.lastIndexOf(".");
                            if (lastDot >= 0) {
                                filename = filename.substr(0, lastDot);
                            }
                            tracked.setName(filename, true);
                        }
                    }
                }
            }

            return original_texImage2D.apply(gl, arguments);
        };

        var original_texSubImage2D = gl.texSubImage2D;
        gl.texSubImage2D = function () {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = arguments[4] * arguments[5] * calculateBpp(gl, arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[6];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = width * height * calculateBpp(gl, arguments[4], arguments[5]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("texSubImage2D", arguments);
            }

            return original_texSubImage2D.apply(gl, arguments);
        };

        var original_generateMipmap = gl.generateMipmap;
        gl.generateMipmap = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                // TODO: figure out what to do with mipmaps
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("generateMipmap", arguments);
            }

            return original_generateMipmap.apply(gl, arguments);
        };

        var original_readPixels = gl.readPixels;
        gl.readPixels = function () {
            var result = original_readPixels.apply(gl, arguments);
            if (result) {
                // Track texture reads
                // NOTE: only RGBA is supported for reads
                var totalBytes = arguments[2] * arguments[3] * 4;
                gl.statistics.textureReads.value += totalBytes;
            }
            return result;
        };
    };

    // If a face is supplied the texture created will be a 2D texture containing only the given face
    Texture.prototype.createTarget = function (gl, version, options, face) {
        options = options || {};
        var target = version.target;
        if (face) {
            target = gl.TEXTURE_2D;
        }

        var texture = gl.createTexture();
        gl.bindTexture(target, texture);

        for (var n in version.parameters) {
            gl.texParameteri(target, parseInt(n), version.parameters[n]);
        }

        this.replayCalls(gl, version, texture, function (call, args) {
            // Filter uploads if requested
            if (options.ignoreTextureUploads) {
                if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
                    return false;
                }
            }

            // Filter non-face calls and rewrite the target if this is a face-specific call
            if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
                if (face && (args.length > 0)) {
                    if (args[0] != face) {
                        return false;
                    }
                    args[0] = gl.TEXTURE_2D;
                }
            } else if (call.name == "generateMipmap") {
                args[0] = target;
            }
            return true;
        });

        return texture;
    };

    Texture.prototype.deleteTarget = function (gl, target) {
        gl.deleteTexture(target);
    };

    resources.Texture = Texture;

})();
(function () {
    var resources = glinamespace("gli.resources");

    var VertexArrayObjectOES = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 2;

        this.defaultName = "VAO " + this.id;

        this.parameters = {};

        this.currentVersion.setParameters(this.parameters);
    };

    VertexArrayObjectOES.prototype.refresh = function (gl) {
    };

    VertexArrayObjectOES.getTracked = function (gl, args) {
        var ext = gl.getExtension("OES_vertex_array_object");
        var glvao = gl.getParameter(ext.VERTEX_ARRAY_BINDING_OES);
        if (glvao == null) {
            // Going to fail
            return null;
        }
        return glvao.trackedObject;
    };

    VertexArrayObjectOES.setCaptures = function (gl) {
        var ext = gl.getExtension("OES_vertex_array_object");
        
        /*
        var original_renderbufferStorage = gl.renderbufferStorage;
        gl.renderbufferStorage = function () {
            var tracked = VertexArrayObjectOES.getTracked(gl, arguments);
            tracked.markDirty(true);
            tracked.currentVersion.pushCall("renderbufferStorage", arguments);

            var result = original_renderbufferStorage.apply(gl, arguments);

            // HACK: query the parameters now - easier than calculating all of them
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);

            return result;
        };*/
    };

    VertexArrayObjectOES.prototype.createTarget = function (gl, version) {
        var ext = gl.getExtension("OES_vertex_array_object");
        
        var vao = ext.createVertexArrayOES();
        ext.bindVertexArrayOES(vao);

        this.replayCalls(gl, version, vao);

        return vao;
    };

    VertexArrayObjectOES.prototype.deleteTarget = function (gl, target) {
        var ext = gl.getExtension("OES_vertex_array_object");
        ext.deleteVertexArrayOES(target);
    };

    resources.VertexArrayObjectOES = VertexArrayObjectOES;

})();
(function () {
    var replay = glinamespace("gli.replay");

    var Controller = function () {
        this.output = {};

        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;

        this.stepCompleted = new gli.EventSource("stepCompleted");
    };

    Controller.prototype.setOutput = function (canvas) {
        this.output.canvas = canvas;
        
        // TODO: pull attributes from source somehow?
        var gl = this.output.gl = gli.util.getWebGLContext(canvas, null, null);
        gli.info.initialize(gl);
    };

    Controller.prototype.reset = function (force) {
        if (this.currentFrame) {
            var gl = this.output.gl;
            if (force) {
                this.currentFrame.cleanup(gl);
            }
        }

        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;
    };

    Controller.prototype.getCurrentState = function () {
        return new gli.host.StateSnapshot(this.output.gl);
    };

    Controller.prototype.openFrame = function (frame, suppressEvents, force, useDepthShader) {
        var gl = this.output.gl;

        this.currentFrame = frame;
        
        if (useDepthShader) {
            frame.switchMirrors();
        } else {
            frame.switchMirrors("depth");
        }

        var depthShader = null;
        if (useDepthShader) {
            depthShader =
                "precision highp float;\n" +
                "vec4 packFloatToVec4i(const float value) {\n" +
                "   const vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\n" +
                "   const vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\n" +
                "   vec4 res = fract(value * bitSh);\n" +
                "   res -= res.xxyz * bitMsk;\n" +
                "   return res;\n" +
                "}\n" +
                "void main() {\n" +
                "   gl_FragColor = packFloatToVec4i(gl_FragCoord.z);\n" +
                //"   gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);\n" +
                "}";
        }
        frame.makeActive(gl, force, {
            fragmentShaderOverride: depthShader,
            ignoreTextureUploads: useDepthShader
        });

        this.beginStepping();
        this.callIndex = 0;
        this.endStepping(suppressEvents);
    };

    function emitMark(mark) {
        console.log("mark hit");
    };

    Controller.prototype.issueCall = function (callIndex) {
        var gl = this.output.gl;

        if (this.currentFrame == null) {
            return false;
        }
        if (this.callIndex + 1 > this.currentFrame.calls.length) {
            return false;
        }

        if (callIndex >= 0) {
            this.callIndex = callIndex;
        } else {
            callIndex = this.callIndex;
        }

        var call = this.currentFrame.calls[callIndex];

        switch (call.type) {
            case 0: // MARK
                emitMark(call);
                break;
            case 1: // GL
                call.emit(gl);
                break;
        }

        return true;
    };

    Controller.prototype.beginStepping = function () {
        this.stepping = true;
    };

    Controller.prototype.endStepping = function (suppressEvents, overrideCallIndex) {
        this.stepping = false;
        if (!suppressEvents) {
            var callIndex = overrideCallIndex || this.callIndex;
            this.stepCompleted.fire(callIndex);
        }
    };

    Controller.prototype.stepUntil = function (callIndex) {
        if (this.callIndex > callIndex) {
            var frame = this.currentFrame;
            this.reset();
            this.openFrame(frame);
        }
        var wasStepping = this.stepping;
        if (!wasStepping) {
            this.beginStepping();
        }
        while (this.callIndex <= callIndex) {
            if (this.issueCall()) {
                this.callIndex++;
            } else {
                this.endStepping();
                return false;
            }
        }
        if (!wasStepping) {
            this.endStepping();
        }
        return true;
    };

    Controller.prototype.stepForward = function () {
        return this.stepUntil(this.callIndex);
    };

    Controller.prototype.stepBackward = function () {
        if (this.callIndex == 0) {
            return false;
        }
        return this.stepUntil(this.callIndex - 2);
    };

    Controller.prototype.stepUntilError = function () {
        //
    };

    Controller.prototype.stepUntilDraw = function () {
        this.beginStepping();
        while (this.issueCall()) {
            var call = this.currentFrame.calls[this.callIndex];
            var info = gli.info.functions[call.name];
            if (info.type == gli.FunctionType.DRAW) {
                this.callIndex++;
                break;
            } else {
                this.callIndex++;
            }
        }
        this.endStepping();
    };

    Controller.prototype.stepUntilEnd = function () {
        this.beginStepping();
        while (this.stepForward());
        this.endStepping();
    };

    Controller.prototype.runFrame = function (frame) {
        this.openFrame(frame);
        this.stepUntilEnd();
    };

    Controller.prototype.runIsolatedDraw = function (frame, targetCall) {
        this.openFrame(frame, true);

        var gl = this.output.gl;

        this.beginStepping();
        while (true) {
            var call = this.currentFrame.calls[this.callIndex];
            var shouldExec = false;

            if (call.name == "clear") {
                // Allow clear calls
                shouldExec = true;
            } else if (call == targetCall) {
                // The target call
                shouldExec = true;

                // Before executing the call, clear the color buffer
                var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
                var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
                gl.colorMask(true, true, true, true);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
                gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
            } else {
                var info = gli.info.functions[call.name];
                if (info.type == gli.FunctionType.DRAW) {
                    // Ignore all other draws
                    shouldExec = false;
                } else {
                    shouldExec = true;
                }
            }

            if (shouldExec) {
                if (!this.issueCall()) {
                    break;
                }
            }

            this.callIndex++;
            if (call == targetCall) {
                break;
            }
        }

        var finalCallIndex = this.callIndex;

        this.openFrame(frame, true);

        this.endStepping(false, finalCallIndex);
    };
    
    function packFloatToVec4i(value) {
       //vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
       //vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
       //vec4 res = fract(value * bitSh);
       var r = value * 256 * 256 * 256;
       var g = value * 256 * 256;
       var b = value * 256;
       var a = value;
       r = r - Math.floor(r);
       g = g - Math.floor(g);
       b = b - Math.floor(b);
       a = a - Math.floor(a);
       //res -= res.xxyz * bitMsk;
       g -= r / 256.0;
       b -= g / 256.0;
       a -= b / 256.0;
       return [r, g, b, a];
    };
    
    Controller.prototype.runDepthDraw = function (frame, targetCall) {
        this.openFrame(frame, true, undefined, true);

        var gl = this.output.gl;
        
        this.beginStepping();
        while (true) {
            var call = this.currentFrame.calls[this.callIndex];
            var shouldExec = true;
            
            var arg0;
            switch (call.name) {
            case "clear":
                arg0 = call.args[0];
                // Only allow depth clears if depth mask is set
                if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
                    call.args[0] = call.args[0] & gl.DEPTH_BUFFER_BIT;
                    if (arg0 & gl.DEPTH_BUFFER_BIT) {
                        call.args[0] |= gl.COLOR_BUFFER_BIT;
                    }
                    var d = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
                    var vd = packFloatToVec4i(d);
                    gl.clearColor(vd[0], vd[1], vd[2], vd[3]);
                } else {
                    shouldExec = false;
                }
                break;
            case "drawArrays":
            case "drawElements":
                // Only allow draws if depth mask is set
                if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
                    // Reset state to what we need
                    gl.disable(gl.BLEND);
                    gl.colorMask(true, true, true, true);
                } else {
                    shouldExec = false;
                }
                break;
            default:
                break;
            }

            if (shouldExec) {
                if (!this.issueCall()) {
                    break;
                }
            }
            
            switch (call.name) {
            case "clear":
                call.args[0] = arg0;
                break;
            default:
                break;
            }

            this.callIndex++;
            if (call == targetCall) {
                break;
            }
        }

        var finalCallIndex = this.callIndex;

        this.openFrame(frame, true);

        this.endStepping(false, finalCallIndex);
    };

    replay.Controller = Controller;

})();
(function () {
    var replay = glinamespace("gli.replay");

    var RedundancyChecker = function () {
        function prepareCanvas(canvas) {
            var frag = document.createDocumentFragment();
            frag.appendChild(canvas);
            var gl = gli.util.getWebGLContext(canvas);
            return gl;
        };
        this.canvas = document.createElement("canvas");
        var gl = this.gl = prepareCanvas(this.canvas);

        // Cache off uniform name so that we can retrieve it later
        var original_getUniformLocation = gl.getUniformLocation;
        gl.getUniformLocation = function () {
            var result = original_getUniformLocation.apply(gl, arguments);
            if (result) {
                var tracked = arguments[0].trackedObject;
                result.sourceProgram = tracked;
                result.sourceUniformName = arguments[1];
            }
            return result;
        };
    };

    var stateCacheModifiers = {
        activeTexture: function (texture) {
            this.stateCache["ACTIVE_TEXTURE"] = texture;
        },
        bindBuffer: function (target, buffer) {
            switch (target) {
                case this.ARRAY_BUFFER:
                    this.stateCache["ARRAY_BUFFER_BINDING"] = buffer;
                    break;
                case this.ELEMENT_ARRAY_BUFFER:
                    this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] = buffer;
                    break;
            }
        },
        bindFramebuffer: function (target, framebuffer) {
            this.stateCache["FRAMEBUFFER_BINDING"] = framebuffer;
        },
        bindRenderbuffer: function (target, renderbuffer) {
            this.stateCache["RENDERBUFFER_BINDING"] = renderbuffer;
        },
        bindTexture: function (target, texture) {
            var activeTexture = (this.stateCache["ACTIVE_TEXTURE"] - this.TEXTURE0);
            switch (target) {
                case this.TEXTURE_2D:
                    this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] = texture;
                    break;
                case this.TEXTURE_CUBE_MAP:
                    this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] = texture;
                    break;
            }
        },
        blendEquation: function (mode) {
            this.stateCache["BLEND_EQUATION_RGB"] = mode;
            this.stateCache["BLEND_EQUATION_ALPHA"] = mode;
        },
        blendEquationSeparate: function (modeRGB, modeAlpha) {
            this.stateCache["BLEND_EQUATION_RGB"] = modeRGB;
            this.stateCache["BLEND_EQUATION_ALPHA"] = modeAlpha;
        },
        blendFunc: function (sfactor, dfactor) {
            this.stateCache["BLEND_SRC_RGB"] = sfactor;
            this.stateCache["BLEND_SRC_ALPHA"] = sfactor;
            this.stateCache["BLEND_DST_RGB"] = dfactor;
            this.stateCache["BLEND_DST_ALPHA"] = dfactor;
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            this.stateCache["BLEND_SRC_RGB"] = srcRGB;
            this.stateCache["BLEND_SRC_ALPHA"] = srcAlpha;
            this.stateCache["BLEND_DST_RGB"] = dstRGB;
            this.stateCache["BLEND_DST_ALPHA"] = dstAlpha;
        },
        clearColor: function (red, green, blue, alpha) {
            this.stateCache["COLOR_CLEAR_VALUE"] = [red, green, blue, alpha];
        },
        clearDepth: function (depth) {
            this.stateCache["DEPTH_CLEAR_VALUE"] = depth;
        },
        clearStencil: function (s) {
            this.stateCache["STENCIL_CLEAR_VALUE"] = s;
        },
        colorMask: function (red, green, blue, alpha) {
            this.stateCache["COLOR_WRITEMASK"] = [red, green, blue, alpha];
        },
        cullFace: function (mode) {
            this.stateCache["CULL_FACE_MODE"] = mode;
        },
        depthFunc: function (func) {
            this.stateCache["DEPTH_FUNC"] = func;
        },
        depthMask: function (flag) {
            this.stateCache["DEPTH_WRITEMASK"] = flag;
        },
        depthRange: function (zNear, zFar) {
            this.stateCache["DEPTH_RANGE"] = [zNear, zFar];
        },
        disable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    this.stateCache["BLEND"] = false;
                    break;
                case this.CULL_FACE:
                    this.stateCache["CULL_FACE"] = false;
                    break;
                case this.DEPTH_TEST:
                    this.stateCache["DEPTH_TEST"] = false;
                    break;
                case this.POLYGON_OFFSET_FILL:
                    this.stateCache["POLYGON_OFFSET_FILL"] = false;
                    break;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = false;
                    break;
                case this.SAMPLE_COVERAGE:
                    this.stateCache["SAMPLE_COVERAGE"] = false;
                    break;
                case this.SCISSOR_TEST:
                    this.stateCache["SCISSOR_TEST"] = false;
                    break;
                case this.STENCIL_TEST:
                    this.stateCache["STENCIL_TEST"] = false;
                    break;
            }
        },
        disableVertexAttribArray: function (index) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = false;
        },
        enable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    this.stateCache["BLEND"] = true;
                    break;
                case this.CULL_FACE:
                    this.stateCache["CULL_FACE"] = true;
                    break;
                case this.DEPTH_TEST:
                    this.stateCache["DEPTH_TEST"] = true;
                    break;
                case this.POLYGON_OFFSET_FILL:
                    this.stateCache["POLYGON_OFFSET_FILL"] = true;
                    break;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = true;
                    break;
                case this.SAMPLE_COVERAGE:
                    this.stateCache["SAMPLE_COVERAGE"] = true;
                    break;
                case this.SCISSOR_TEST:
                    this.stateCache["SCISSOR_TEST"] = true;
                    break;
                case this.STENCIL_TEST:
                    this.stateCache["STENCIL_TEST"] = true;
                    break;
            }
        },
        enableVertexAttribArray: function (index) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = true;
        },
        frontFace: function (mode) {
            this.stateCache["FRONT_FACE"] = mode;
        },
        hint: function (target, mode) {
            switch (target) {
                case this.GENERATE_MIPMAP_HINT:
                    this.stateCache["GENERATE_MIPMAP_HINT"] = mode;
                    break;
            }
        },
        lineWidth: function (width) {
            this.stateCache["LINE_WIDTH"] = width;
        },
        pixelStorei: function (pname, param) {
            switch (pname) {
                case this.PACK_ALIGNMENT:
                    this.stateCache["PACK_ALIGNMENT"] = param;
                    break;
                case this.UNPACK_ALIGNMENT:
                    this.stateCache["UNPACK_ALIGNMENT"] = param;
                    break;
                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                    this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] = param;
                    break;
                case this.UNPACK_FLIP_Y_WEBGL:
                    this.stateCache["UNPACK_FLIP_Y_WEBGL"] = param;
                    break;
                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                    this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] = param;
                    break;
            }
        },
        polygonOffset: function (factor, units) {
            this.stateCache["POLYGON_OFFSET_FACTOR"] = factor;
            this.stateCache["POLYGON_OFFSET_UNITS"] = units;
        },
        sampleCoverage: function (value, invert) {
            this.stateCache["SAMPLE_COVERAGE_VALUE"] = value;
            this.stateCache["SAMPLE_COVERAGE_INVERT"] = invert;
        },
        scissor: function (x, y, width, height) {
            this.stateCache["SCISSOR_BOX"] = [x, y, width, height];
        },
        stencilFunc: function (func, ref, mask) {
            this.stateCache["STENCIL_FUNC"] = func;
            this.stateCache["STENCIL_REF"] = ref;
            this.stateCache["STENCIL_VALUE_MASK"] = mask;
            this.stateCache["STENCIL_BACK_FUNC"] = func;
            this.stateCache["STENCIL_BACK_REF"] = ref;
            this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
        },
        stencilFuncSeparate: function (face, func, ref, mask) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_FUNC"] = func;
                    this.stateCache["STENCIL_REF"] = ref;
                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_FUNC"] = func;
                    this.stateCache["STENCIL_BACK_REF"] = ref;
                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_FUNC"] = func;
                    this.stateCache["STENCIL_REF"] = ref;
                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
                    this.stateCache["STENCIL_BACK_FUNC"] = func;
                    this.stateCache["STENCIL_BACK_REF"] = ref;
                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                    break;
            }
        },
        stencilMask: function (mask) {
            this.stateCache["STENCIL_WRITEMASK"] = mask;
            this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
        },
        stencilMaskSeparate: function (face, mask) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_WRITEMASK"] = mask;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_WRITEMASK"] = mask;
                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                    break;
            }
        },
        stencilOp: function (fail, zfail, zpass) {
            this.stateCache["STENCIL_FAIL"] = fail;
            this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
            this.stateCache["STENCIL_BACK_FAIL"] = fail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_FAIL"] = fail;
                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_FAIL"] = fail;
                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                    break;
            }
        },
        uniformN: function (location, v) {
            if (!location) {
                return;
            }
            var program = location.sourceProgram;
            if (v.slice !== undefined) {
                v = v.slice();
            } else {
                v = new Float32Array(v);
            }
            program.uniformCache[location.sourceUniformName] = v;
        },
        uniform1f: function (location, v0) {
            stateCacheModifiers.uniformN.call(this, location, [v0]);
        },
        uniform2f: function (location, v0, v1) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
        },
        uniform3f: function (location, v0, v1, v2) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4f: function (location, v0, v1, v2, v3) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1i: function (location, v0) {
            stateCacheModifiers.uniformN.call(this, location, [v0]);
        },
        uniform2i: function (location, v0, v1) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1]);
        },
        uniform3i: function (location, v0, v1, v2) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4i: function (location, v0, v1, v2, v3) {
            stateCacheModifiers.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1fv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform2fv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform3fv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform4fv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform1iv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform2iv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform3iv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniform4iv: function (location, v) {
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix2fv: function (location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix3fv: function (location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        uniformMatrix4fv: function (location, transpose, v) {
            // TODO: transpose
            stateCacheModifiers.uniformN.call(this, location, v);
        },
        useProgram: function (program) {
            this.stateCache["CURRENT_PROGRAM"] = program;
        },
        vertexAttrib1f: function (indx, x) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, 0, 0, 1];
        },
        vertexAttrib2f: function (indx, x, y) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, 0, 1];
        },
        vertexAttrib3f: function (indx, x, y, z) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, 1];
        },
        vertexAttrib4f: function (indx, x, y, z, w) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [x, y, z, w];
        },
        vertexAttrib1fv: function (indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], 0, 0, 1];
        },
        vertexAttrib2fv: function (indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], 0, 1];
        },
        vertexAttrib3fv: function (indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], 1];
        },
        vertexAttrib4fv: function (indx, v) {
            this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx] = [v[0], v[1], v[2], v[3]];
        },
        vertexAttribPointer: function (indx, size, type, normalized, stride, offset) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] = size;
            this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] = type;
            this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] = normalized;
            this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] = stride;
            this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] = offset;
            this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] = this.stateCache["ARRAY_BUFFER_BINDING"];
        },
        viewport: function (x, y, width, height) {
            this.stateCache["VIEWPORT"] = [x, y, width, height];
        }
    };

    var redundantChecks = {
        activeTexture: function (texture) {
            return this.stateCache["ACTIVE_TEXTURE"] == texture;
        },
        bindBuffer: function (target, buffer) {
            switch (target) {
                case this.ARRAY_BUFFER:
                    return this.stateCache["ARRAY_BUFFER_BINDING"] == buffer;
                case this.ELEMENT_ARRAY_BUFFER:
                    return this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] == buffer;
            }
        },
        bindFramebuffer: function (target, framebuffer) {
            return this.stateCache["FRAMEBUFFER_BINDING"] == framebuffer;
        },
        bindRenderbuffer: function (target, renderbuffer) {
            return this.stateCache["RENDERBUFFER_BINDING"] == renderbuffer;
        },
        bindTexture: function (target, texture) {
            var activeTexture = (this.stateCache["ACTIVE_TEXTURE"] - this.TEXTURE0);
            switch (target) {
                case this.TEXTURE_2D:
                    return this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] == texture;
                case this.TEXTURE_CUBE_MAP:
                    return this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] == texture;
            }
        },
        blendEquation: function (mode) {
            return (this.stateCache["BLEND_EQUATION_RGB"] == mode) && (this.stateCache["BLEND_EQUATION_ALPHA"] == mode);
        },
        blendEquationSeparate: function (modeRGB, modeAlpha) {
            return (this.stateCache["BLEND_EQUATION_RGB"] == modeRGB) && (this.stateCache["BLEND_EQUATION_ALPHA"] == modeAlpha);
        },
        blendFunc: function (sfactor, dfactor) {
            return (this.stateCache["BLEND_SRC_RGB"] == sfactor) && (this.stateCache["BLEND_SRC_ALPHA"] == sfactor) &&
                   (this.stateCache["BLEND_DST_RGB"] == dfactor) && (this.stateCache["BLEND_DST_ALPHA"] == dfactor);
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            return (this.stateCache["BLEND_SRC_RGB"] == srcRGB) && (this.stateCache["BLEND_SRC_ALPHA"] == srcAlpha) &&
                   (this.stateCache["BLEND_DST_RGB"] == dstRGB) && (this.stateCache["BLEND_DST_ALPHA"] == dstAlpha);
        },
        clearColor: function (red, green, blue, alpha) {
            return gli.util.arrayCompare(this.stateCache["COLOR_CLEAR_VALUE"], [red, green, blue, alpha]);
        },
        clearDepth: function (depth) {
            return this.stateCache["DEPTH_CLEAR_VALUE"] == depth;
        },
        clearStencil: function (s) {
            return this.stateCache["STENCIL_CLEAR_VALUE"] == s;
        },
        colorMask: function (red, green, blue, alpha) {
            return gli.util.arrayCompare(this.stateCache["COLOR_WRITEMASK"], [red, green, blue, alpha]);
        },
        cullFace: function (mode) {
            return this.stateCache["CULL_FACE_MODE"] == mode;
        },
        depthFunc: function (func) {
            return this.stateCache["DEPTH_FUNC"] == func;
        },
        depthMask: function (flag) {
            return this.stateCache["DEPTH_WRITEMASK"] == flag;
        },
        depthRange: function (zNear, zFar) {
            return gli.util.arrayCompare(this.stateCache["DEPTH_RANGE"], [zNear, zFar]);
        },
        disable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.stateCache["BLEND"] == false;
                case this.CULL_FACE:
                    return this.stateCache["CULL_FACE"] == false;
                case this.DEPTH_TEST:
                    return this.stateCache["DEPTH_TEST"] == false;
                case this.POLYGON_OFFSET_FILL:
                    return this.stateCache["POLYGON_OFFSET_FILL"] == false;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == false;
                case this.SAMPLE_COVERAGE:
                    return this.stateCache["SAMPLE_COVERAGE"] == false;
                case this.SCISSOR_TEST:
                    return this.stateCache["SCISSOR_TEST"] == false;
                case this.STENCIL_TEST:
                    return this.stateCache["STENCIL_TEST"] == false;
            }
        },
        disableVertexAttribArray: function (index) {
            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == false;
        },
        enable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.stateCache["BLEND"] == true;
                case this.CULL_FACE:
                    return this.stateCache["CULL_FACE"] == true;
                case this.DEPTH_TEST:
                    return this.stateCache["DEPTH_TEST"] == true;
                case this.POLYGON_OFFSET_FILL:
                    return this.stateCache["POLYGON_OFFSET_FILL"] == true;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == true;
                case this.SAMPLE_COVERAGE:
                    return this.stateCache["SAMPLE_COVERAGE"] == true;
                case this.SCISSOR_TEST:
                    return this.stateCache["SCISSOR_TEST"] == true;
                case this.STENCIL_TEST:
                    return this.stateCache["STENCIL_TEST"] == true;
            }
        },
        enableVertexAttribArray: function (index) {
            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == true;
        },
        frontFace: function (mode) {
            return this.stateCache["FRONT_FACE"] == mode;
        },
        hint: function (target, mode) {
            switch (target) {
                case this.GENERATE_MIPMAP_HINT:
                    return this.stateCache["GENERATE_MIPMAP_HINT"] == mode;
            }
        },
        lineWidth: function (width) {
            return this.stateCache["LINE_WIDTH"] == width;
        },
        pixelStorei: function (pname, param) {
            switch (pname) {
                case this.PACK_ALIGNMENT:
                    return this.stateCache["PACK_ALIGNMENT"] == param;
                case this.UNPACK_ALIGNMENT:
                    return this.stateCache["UNPACK_ALIGNMENT"] == param;
                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                    return this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] == param;
                case this.UNPACK_FLIP_Y_WEBGL:
                    return this.stateCache["UNPACK_FLIP_Y_WEBGL"] == param;
                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                    return this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] == param;
            }
        },
        polygonOffset: function (factor, units) {
            return (this.stateCache["POLYGON_OFFSET_FACTOR"] == factor) && (this.stateCache["POLYGON_OFFSET_UNITS"] == units);
        },
        sampleCoverage: function (value, invert) {
            return (this.stateCache["SAMPLE_COVERAGE_VALUE"] == value) && (this.stateCache["SAMPLE_COVERAGE_INVERT"] == invert);
        },
        scissor: function (x, y, width, height) {
            return gli.util.arrayCompare(this.stateCache["SCISSOR_BOX"], [x, y, width, height]);
        },
        stencilFunc: function (func, ref, mask) {
            return
                (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) &&
                (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
        },
        stencilFuncSeparate: function (face, func, ref, mask) {
            switch (face) {
                case this.FRONT:
                    return (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask);
                case this.BACK:
                    return (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
                case this.FRONT_AND_BACK:
                    return (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) &&
                           (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
            }
        },
        stencilMask: function (mask) {
            return (this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask);
        },
        stencilMaskSeparate: function (face, mask) {
            switch (face) {
                case this.FRONT:
                    return this.stateCache["STENCIL_WRITEMASK"] == mask;
                case this.BACK:
                    return this.stateCache["STENCIL_BACK_WRITEMASK"] == mask;
                case this.FRONT_AND_BACK:
                    return (this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask);
            }
        },
        stencilOp: function (fail, zfail, zpass) {
            return (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
                   (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    return (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass);
                case this.BACK:
                    return (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
                case this.FRONT_AND_BACK:
                    return (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
                           (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
            }
        },
        uniformN: function (location, v) {
            if (!location) {
                return true;
            }
            var program = location.sourceProgram;
            if (!program.uniformCache) return false;
            return gli.util.arrayCompare(program.uniformCache[location.sourceUniformName], v);
        },
        uniform1f: function (location, v0) {
            return redundantChecks.uniformN.call(this, location, [v0]);
        },
        uniform2f: function (location, v0, v1) {
            return redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3f: function (location, v0, v1, v2) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4f: function (location, v0, v1, v2, v3) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1i: function (location, v0) {
            return redundantChecks.uniformN.call(this, location, [v0]);
        },
        uniform2i: function (location, v0, v1) {
            return redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3i: function (location, v0, v1, v2) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4i: function (location, v0, v1, v2, v3) {
            return redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1fv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform2fv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform3fv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform4fv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform1iv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform2iv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform3iv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniform4iv: function (location, v) {
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix2fv: function (location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix3fv: function (location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix4fv: function (location, transpose, v) {
            // TODO: transpose
            return redundantChecks.uniformN.call(this, location, v);
        },
        useProgram: function (program) {
            return this.stateCache["CURRENT_PROGRAM"] == program;
        },
        vertexAttrib1f: function (indx, x) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, 0, 0, 1]);
        },
        vertexAttrib2f: function (indx, x, y) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, 0, 1]);
        },
        vertexAttrib3f: function (indx, x, y, z) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, 1]);
        },
        vertexAttrib4f: function (indx, x, y, z, w) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [x, y, z, w]);
        },
        vertexAttrib1fv: function (indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], 0, 0, 1]);
        },
        vertexAttrib2fv: function (indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], 0, 1]);
        },
        vertexAttrib3fv: function (indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], [v[0], v[1], v[2], 1]);
        },
        vertexAttrib4fv: function (indx, v) {
            return gli.util.arrayCompare(this.stateCache["CURRENT_VERTEX_ATTRIB_" + indx], v);
        },
        vertexAttribPointer: function (indx, size, type, normalized, stride, offset) {
            return (this.stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + indx] == size) &&
                   (this.stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + indx] == type) &&
                   (this.stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + indx] == normalized) &&
                   (this.stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + indx] == stride) &&
                   (this.stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + indx] == offset) &&
                   (this.stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + indx] == this.stateCache["ARRAY_BUFFER_BINDING"]);
        },
        viewport: function (x, y, width, height) {
            return gli.util.arrayCompare(this.stateCache["VIEWPORT"], [x, y, width, height]);
        }
    };

    RedundancyChecker.prototype.initializeStateCache = function (gl) {
        var stateCache = {};

        var stateParameters = ["ACTIVE_TEXTURE", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_WRITEMASK", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "LINE_WIDTH", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RENDERBUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SCISSOR_BOX", "SCISSOR_TEST", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VIEWPORT"];
        for (var n = 0; n < stateParameters.length; n++) {
            try {
                stateCache[stateParameters[n]] = gl.getParameter(gl[stateParameters[n]]);
            } catch (e) {
                // Ignored
            }
        }
        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            stateCache["TEXTURE_BINDING_2D_" + n] = gl.getParameter(gl.TEXTURE_BINDING_2D);
            stateCache["TEXTURE_BINDING_CUBE_MAP_" + n] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
        }
        gl.activeTexture(originalActiveTexture);
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
            stateCache["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            stateCache["VERTEX_ATTRIB_ARRAY_SIZE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
            stateCache["VERTEX_ATTRIB_ARRAY_STRIDE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
            stateCache["VERTEX_ATTRIB_ARRAY_TYPE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
            stateCache["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
            stateCache["VERTEX_ATTRIB_ARRAY_POINTER_" + n] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            stateCache["CURRENT_VERTEX_ATTRIB_" + n] = gl.getVertexAttrib(n, gl.CURRENT_VERTEX_ATTRIB);
        }

        return stateCache;
    };

    RedundancyChecker.prototype.cacheUniformValues = function (gl, frame) {
        var originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);

        for (var n = 0; n < frame.uniformValues.length; n++) {
            var program = frame.uniformValues[n].program;
            var values = frame.uniformValues[n].values;

            var target = program.mirror.target;
            if (!target) {
                continue;
            }

            program.uniformCache = {};

            gl.useProgram(target);

            for (var name in values) {
                var data = values[name];
                var loc = gl.getUniformLocation(target, name);

                switch (data.type) {
                    case gl.FLOAT:
                    case gl.FLOAT_VEC2:
                    case gl.FLOAT_VEC3:
                    case gl.FLOAT_VEC4:
                    case gl.INT:
                    case gl.INT_VEC2:
                    case gl.INT_VEC3:
                    case gl.INT_VEC4:
                    case gl.BOOL:
                    case gl.BOOL_VEC2:
                    case gl.BOOL_VEC3:
                    case gl.BOOL_VEC4:
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        if (data.value && data.value.length !== undefined) {
                            program.uniformCache[name] = data.value;
                        } else {
                            program.uniformCache[name] = [data.value];
                        }
                        break;
                    case gl.FLOAT_MAT2:
                    case gl.FLOAT_MAT3:
                    case gl.FLOAT_MAT4:
                        program.uniformCache[name] = data.value;
                        break;
                }
            }
        }

        gl.useProgram(originalProgram);
    };

    RedundancyChecker.prototype.run = function (frame) {
        // TODO: if we every support editing, we may want to recheck
        if (frame.hasCheckedRedundancy) {
            return;
        }
        frame.hasCheckedRedundancy = true;

        var gl = this.gl;

        frame.switchMirrors("redundancy");
        frame.makeActive(gl, false, {
            ignoreBufferUploads: true,
            ignoreTextureUploads: true
        });

        // Setup initial state cache (important to do here so we have the frame initial state)
        gl.stateCache = this.initializeStateCache(gl);

        // Cache all uniform values for checking
        this.cacheUniformValues(gl, frame);

        var redundantCalls = 0;
        var calls = frame.calls;
        for (var n = 0; n < calls.length; n++) {
            var call = calls[n];
            if (call.type !== 1) {
                continue;
            }

            var redundantCheck = redundantChecks[call.name];
            var stateCacheModifier = stateCacheModifiers[call.name];
            if (!redundantCheck && !stateCacheModifier) {
                continue;
            }

            var args = call.transformArgs(gl);

            if (redundantCheck && redundantCheck.apply(gl, args)) {
                redundantCalls++;
                call.isRedundant = true;
            }

            if (stateCacheModifier) {
                stateCacheModifier.apply(gl, args);
            }
        }

        frame.redundantCalls = redundantCalls;

        frame.cleanup(gl);
        frame.switchMirrors();
    };

    var cachedChecker = null;
    RedundancyChecker.checkFrame = function (frame) {
        if (!cachedChecker) {
            cachedChecker = new RedundancyChecker();
        }

        cachedChecker.run(frame);
    };

    replay.RedundancyChecker = RedundancyChecker;

})();
(function () {
    var ui = glinamespace("gli.ui");
    var host = glinamespace("gli.host");

    var Toolbar = function (w) {
        var self = this;
        var document = w.document;

        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("window-toolbar")[0]
        };
        this.buttons = {};

        function appendRightRegion(title, buttons) {
            var regionDiv = document.createElement("div");
            regionDiv.className = "toolbar-right-region";

            var titleDiv = document.createElement("div");
            titleDiv.className = "toolbar-right-region-title";
            titleDiv.innerHTML = title;
            regionDiv.appendChild(titleDiv);

            var activeIndex = 0;
            var previousSelection = null;

            for (var n = 0; n < buttons.length; n++) {
                var button = buttons[n];

                var buttonSpan = document.createElement("span");
                if (button.name) {
                    buttonSpan.innerHTML = button.name;
                }
                if (button.className) {
                    buttonSpan.className = button.className;
                }
                buttonSpan.title = button.title ? button.title : button.name;
                regionDiv.appendChild(buttonSpan);
                button.el = buttonSpan;

                (function (n, button) {
                    buttonSpan.onclick = function () {
                        if (previousSelection) {
                            previousSelection.el.className = previousSelection.el.className.replace(" toolbar-right-region-active", "");
                        }
                        previousSelection = button;
                        button.el.className += " toolbar-right-region-active";

                        button.onclick.apply(self);
                    };
                })(n, button);

                if (n < buttons.length - 1) {
                    var sep = document.createElement("div");
                    sep.className = "toolbar-right-region-sep";
                    sep.innerHTML = " | ";
                    regionDiv.appendChild(sep);
                }
            }

            // Select first
            buttons[0].el.onclick();

            self.elements.bar.appendChild(regionDiv);
        };
        function appendRightButtons(buttons) {
            var regionDiv = document.createElement("div");
            regionDiv.className = "toolbar-right-buttons";

            for (var n = 0; n < buttons.length; n++) {
                var button = buttons[n];

                var buttonDiv = document.createElement("div");
                if (button.name) {
                    buttonDiv.innerHTML = button.name;
                }
                buttonDiv.className = "toolbar-right-button";
                if (button.className) {
                    buttonDiv.className += " " + button.className;
                }
                buttonDiv.title = button.title ? button.title : button.name;
                regionDiv.appendChild(buttonDiv);
                button.el = buttonDiv;

                (function (button) {
                    buttonDiv.onclick = function () {
                        button.onclick.apply(self);
                    };
                })(button);

                if (n < buttons.length - 1) {
                    var sep = document.createElement("div");
                    sep.className = "toolbar-right-buttons-sep";
                    sep.innerHTML = "&nbsp;";
                    regionDiv.appendChild(sep);
                }
            }

            self.elements.bar.appendChild(regionDiv);
        };

        appendRightButtons([
            /*{
                title: "Options",
                className: "toolbar-right-button-options",
                onclick: function () {
                    alert("options");
                }
            },*/
            {
                title: "Hide inspector (F11)",
                className: "toolbar-right-button-close",
                onclick: function () {
                    gli.host.requestFullUI(w.context);
                }
            }
        ]);
		/*
        appendRightRegion("Version: ", [
            {
                name: "Live",
                onclick: function () {
                    w.setActiveVersion(null);
                }
            },
            {
                name: "Current",
                onclick: function () {
                    w.setActiveVersion("current");
                }
            }
        ]);
        */
        appendRightRegion("Frame Control: ", [
            {
                name: "Normal",
                onclick: function () {
                    host.setFrameControl(0);
                }
            },
            {
                name: "Slowed",
                onclick: function () {
                    host.setFrameControl(250);
                }
            },
            {
                name: "Paused",
                onclick: function () {
                    host.setFrameControl(Infinity);
                }
            }
        ]);
    };
    Toolbar.prototype.addSelection = function (name, tip) {
        var self = this;

        var el = document.createElement("div");
        el.className = "toolbar-button toolbar-button-enabled toolbar-button-command-" + name;

        el.title = tip;
        el.innerHTML = tip;

        el.onclick = function () {
            self.window.selectTab(name);
        };

        this.elements.bar.appendChild(el);

        this.buttons[name] = el;
    };
    Toolbar.prototype.toggleSelection = function (name) {
        for (var n in this.buttons) {
            var el = this.buttons[n];
            el.className = el.className.replace("toolbar-button-selected", "toolbar-button-enabled");
        }
        var el = this.buttons[name];
        if (el) {
            el.className = el.className.replace("toolbar-button-disabled", "toolbar-button-selected");
            el.className = el.className.replace("toolbar-button-enabled", "toolbar-button-selected");
        }
    };

    function writeDocument(document, elementHost) {
        var root = document.createElement("div");
        root.className = "window";

        // Toolbar
        // <div class="window-toolbar">
        // ...
        var toolbar = document.createElement("div");
        toolbar.className = "window-toolbar";
        root.appendChild(toolbar);

        // Middle
        // <div class="window-middle">
        // ...
        var middle = document.createElement("div");
        middle.className = "window-middle";
        root.appendChild(middle);

        if (elementHost) {
            elementHost.appendChild(root);
        } else {
            document.body.appendChild(root);
        }

        root.elements = {
            toolbar: toolbar,
            middle: middle
        };

        return root;
    };

    // TODO: move to helper place
    function appendbr(el) {
        var br = document.createElement("br");
        el.appendChild(br);
    };
    function appendClear(el) {
        var clearDiv = document.createElement("div");
        clearDiv.style.clear = "both";
        el.appendChild(clearDiv);
    };
    function appendSeparator(el) {
        var div = document.createElement("div");
        div.className = "info-separator";
        el.appendChild(div);
        appendbr(el);
    };
    function appendParameters(gl, el, obj, parameters, parameterEnumValues) {
        var table = document.createElement("table");
        table.className = "info-parameters";

        for (var n = 0; n < parameters.length; n++) {
            var enumName = parameters[n];
            var value = obj.parameters[gl[enumName]];

            var tr = document.createElement("tr");
            tr.className = "info-parameter-row";

            var tdkey = document.createElement("td");
            tdkey.className = "info-parameter-key";
            tdkey.innerHTML = enumName;
            tr.appendChild(tdkey);

            var tdvalue = document.createElement("td");
            tdvalue.className = "info-parameter-value";
            if (parameterEnumValues && parameterEnumValues[n]) {
                var valueFound = false;
                for (var m = 0; m < parameterEnumValues[n].length; m++) {
                    if (value == gl[parameterEnumValues[n][m]]) {
                        tdvalue.innerHTML = parameterEnumValues[n][m];
                        valueFound = true;
                        break;
                    }
                }
                if (!valueFound) {
                    tdvalue.innerHTML = value + " (unknown)";
                }
            } else {
                tdvalue.innerHTML = value; // TODO: convert to something meaningful?
            }
            tr.appendChild(tdvalue);

            table.appendChild(tr);
        }

        el.appendChild(table);
    };
    function appendStateParameterRow(w, gl, table, state, param) {
        var tr = document.createElement("tr");
        tr.className = "info-parameter-row";

        var tdkey = document.createElement("td");
        tdkey.className = "info-parameter-key";
        tdkey.innerHTML = param.name;
        tr.appendChild(tdkey);

        var value;
        if (param.value) {
            value = state[param.value];
        } else {
            value = state[param.name];
        }

        // Grab tracked objects
        if (value && value.trackedObject) {
            value = value.trackedObject;
        }

        var tdvalue = document.createElement("td");
        tdvalue.className = "info-parameter-value";

        var text = "";
        var clickhandler = null;

        var UIType = gli.UIType;
        var ui = param.ui;
        switch (ui.type) {
            case UIType.ENUM:
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    if (value == gl[enumName]) {
                        anyMatches = true;
                        text = enumName;
                    }
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                break;
            case UIType.ARRAY:
                text = "[" + value + "]";
                break;
            case UIType.BOOL:
                text = value ? "true" : "false";
                break;
            case UIType.LONG:
                text = value;
                break;
            case UIType.ULONG:
                text = value;
                break;
            case UIType.COLORMASK:
                text = value;
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value.target && gli.util.isWebGLResource(value.target)) {
                    var typename = glitypename(value.target);
                    switch (typename) {
                        case "WebGLBuffer":
                            clickhandler = function () {
                                w.showBuffer(value, true);
                            };
                            break;
                        case "WebGLFramebuffer":
                            break;
                        case "WebGLProgram":
                            clickhandler = function () {
                                w.showProgram(value, true);
                            };
                            break;
                        case "WebGLRenderbuffer":
                            break;
                        case "WebGLShader":
                            break;
                        case "WebGLTexture":
                            clickhandler = function () {
                                w.showTexture(value, true);
                            };
                            break;
                    }
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value) {
                    var typename = glitypename(value);
                    switch (typename) {
                        case "WebGLUniformLocation":
                            text = '"' + value.sourceUniformName + '"';
                            break;
                    }
                }
                break;
            case UIType.WH:
                text = value[0] + " x " + value[1];
                break;
            case UIType.RECT:
                if (value) {
                    text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
                } else {
                    text = "null";
                }
                break;
            case UIType.STRING:
                text = '"' + value + '"';
                break;
            case UIType.COLOR:
                text = "<div class='info-parameter-color' style='background-color: rgba(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + "," + value[3] + ") !important;'></div> rgba(" + value[0] + ", " + value[1] + ", " + value[2] + ", " + value[3] + ")";
                // TODO: color tip
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                text = "0x" + value.toString(16);
                // TODO: bitmask tip
                break;
            case UIType.RANGE:
                text = value[0] + " - " + value[1];
                break;
            case UIType.MATRIX:
                switch (value.length) {
                    default: // ?
                        text = "[matrix]";
                        break;
                    case 4: // 2x2
                        text = "[matrix 2x2]";
                        break;
                    case 9: // 3x3
                        text = "[matrix 3x3]";
                        break;
                    case 16: // 4x4
                        text = "[matrix 4x4]";
                        break;
                }
                // TODO: matrix tip
                text = "[" + value + "]";
                break;
        }

        tdvalue.innerHTML = text;
        if (clickhandler) {
            tdvalue.className += " trace-call-clickable";
            tdvalue.onclick = function (e) {
                clickhandler();
                e.preventDefault();
                e.stopPropagation();
            };
        }

        tr.appendChild(tdvalue);

        table.appendChild(tr);
    };
    function appendMatrices(gl, el, type, size, value) {
        switch (type) {
            case gl.FLOAT_MAT2:
                for (var n = 0; n < size; n++) {
                    var offset = n * 4;
                    ui.appendMatrix(el, value, offset, 2);
                }
                break;
            case gl.FLOAT_MAT3:
                for (var n = 0; n < size; n++) {
                    var offset = n * 9;
                    ui.appendMatrix(el, value, offset, 3);
                }
                break;
            case gl.FLOAT_MAT4:
                for (var n = 0; n < size; n++) {
                    var offset = n * 16;
                    ui.appendMatrix(el, value, offset, 4);
                }
                break;
        }
    };
    function appendMatrix(el, value, offset, size) {
        var div = document.createElement("div");

        var openSpan = document.createElement("span");
        openSpan.innerHTML = "[";
        div.appendChild(openSpan);

        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                var v = value[offset + i * size + j];
                div.appendChild(document.createTextNode(ui.padFloat(v)));
                if (!((i == size - 1) && (j == size - 1))) {
                    var comma = document.createElement("span");
                    comma.innerHTML = ",&nbsp;";
                    div.appendChild(comma);
                }
            }
            if (i < size - 1) {
                appendbr(div);
                var prefix = document.createElement("span");
                prefix.innerHTML = "&nbsp;";
                div.appendChild(prefix);
            }
        }

        var closeSpan = document.createElement("span");
        closeSpan.innerHTML = "&nbsp;]";
        div.appendChild(closeSpan);

        el.appendChild(div);
    };
    function appendArray(el, value) {
        var div = document.createElement("div");

        var openSpan = document.createElement("span");
        openSpan.innerHTML = "[";
        div.appendChild(openSpan);

        var s = "";
        var maxIndex = Math.min(64, value.length);
        var isFloat = glitypename(value).indexOf("Float") >= 0;
        for (var n = 0; n < maxIndex; n++) {
            if (isFloat) {
                s += ui.padFloat(value[n]);
            } else {
                s += "&nbsp;" + ui.padInt(value[n]);
            }
            if (n < value.length - 1) {
                s += ",&nbsp;";
            }
        }
        if (maxIndex < value.length) {
            s += ",... (" + (value.length) + " total)";
        }
        var strSpan = document.createElement("span");
        strSpan.innerHTML = s;
        div.appendChild(strSpan);

        var closeSpan = document.createElement("span");
        closeSpan.innerHTML = "&nbsp;]";
        div.appendChild(closeSpan);

        el.appendChild(div);
    };
    ui.padInt = function (v) {
        var s = String(v);
        if (s >= 0) {
            s = " " + s;
        }
        s = s.substr(0, 11);
        while (s.length < 11) {
            s = " " + s;
        }
        return s.replace(/ /g, "&nbsp;");
    };
    ui.padFloat = function (v) {
        var s = String(v);
        if (s >= 0.0) {
            s = " " + s;
        }
        if (s.indexOf(".") == -1) {
            s += ".";
        }
        s = s.substr(0, 12);
        while (s.length < 12) {
            s += "0";
        }
        return s;
    };
    ui.appendbr = appendbr;
    ui.appendClear = appendClear;
    ui.appendSeparator = appendSeparator;
    ui.appendParameters = appendParameters;
    ui.appendStateParameterRow = appendStateParameterRow;
    ui.appendMatrices = appendMatrices;
    ui.appendMatrix = appendMatrix;
    ui.appendArray = appendArray;

    var Window = function (context, document, elementHost) {
        var self = this;
        this.context = context;
        this.document = document;
        this.browserWindow = window;

        this.root = writeDocument(document, elementHost);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.tabs = {};
        this.currentTab = null;
        this.windows = {};

        this.activeVersion = "current"; // or null for live
        this.activeFilter = null;

        var middle = this.root.elements.middle;
        function addTab(name, tip, implType) {
            var tab = new ui.Tab(self, middle, name);

            if (implType) {
                implType.apply(tab, [self]);
            }

            self.toolbar.addSelection(name, tip);

            self.tabs[name] = tab;
        };

        addTab("trace", "Trace", ui.TraceTab);
        addTab("timeline", "Timeline", ui.TimelineTab);
        addTab("state", "State", ui.StateTab);
        addTab("textures", "Textures", ui.TexturesTab);
        addTab("buffers", "Buffers", ui.BuffersTab);
        addTab("programs", "Programs", ui.ProgramsTab);
        //addTab("performance", "Performance", ui.PerformanceTab);

        this.selectTab("trace");

        window.addEventListener("beforeunload", function () {
            for (var n in self.windows) {
                var w = self.windows[n];
                if (w) {
                    w.close();
                }
            }
        }, false);

        gli.host.setTimeout(function () {
            self.selectTab("trace", true);
        }, 0);
    };

    Window.prototype.layout = function () {
        for (var n in this.tabs) {
            var tab = this.tabs[n];
            if (tab.layout) {
                tab.layout();
            }
        }
    };

    Window.prototype.selectTab = function (name, force) {
        if (name.name) {
            name = name.name;
        }
        if (this.currentTab && this.currentTab.name == name && !force) {
            return;
        }
        var tab = this.tabs[name];
        if (!tab) {
            return;
        }

        if (this.currentTab) {
            this.currentTab.loseFocus();
            this.currentTab = null;
        }

        this.currentTab = tab;
        this.currentTab.gainFocus();
        this.toolbar.toggleSelection(name);

        if (tab.layout) {
            tab.layout();
        }
        if (tab.refresh) {
            tab.refresh();
        }
    };

    Window.prototype.setActiveVersion = function (version) {
        if (this.activeVersion == version) {
            return;
        }
        this.activeVersion = version;
        if (this.currentTab.refresh) {
            this.currentTab.refresh();
        }
    };

    Window.prototype.setActiveFilter = function (filter) {
        if (this.activeFilter == filter) {
            return;
        }
        this.activeFilter = filter;
        console.log("would set active filter: " + filter);
    };

    Window.prototype.appendFrame = function (frame) {
        var tab = this.tabs["trace"];
        this.selectTab(tab);
        tab.listing.appendValue(frame);
        tab.listing.selectValue(frame);
    };

    Window.prototype.showTrace = function (frame, callOrdinal) {
        var tab = this.tabs["trace"];
        this.selectTab(tab);
        if (this.controller.currentFrame != frame) {
            tab.listing.selectValue(frame);
        }
        tab.traceView.stepUntil(callOrdinal);
    };

    Window.prototype.showResource = function (resourceTab, resource, switchToCurrent) {
        if (switchToCurrent) {
            // TODO: need to update UI to be able to do this
            //this.setActiveVersion("current");
        }
        var tab = this.tabs[resourceTab];
        this.selectTab(tab);
        tab.listing.selectValue(resource);
        this.browserWindow.focus();
    };

    Window.prototype.showTexture = function (texture, switchToCurrent) {
        this.showResource("textures", texture, switchToCurrent);
    };

    Window.prototype.showBuffer = function (buffer, switchToCurrent) {
        this.showResource("buffers", buffer, switchToCurrent);
    };

    Window.prototype.showProgram = function (program, switchToCurrent) {
        this.showResource("programs", program, switchToCurrent);
    };

    ui.Window = Window;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var Tab = function (w, container, name) {
        this.name = name;
        this.hasFocus = false;

        var el = this.el = document.createElement("div");
        el.className = "window-tab-root";
        container.appendChild(el);

        this.gainedFocus = new gli.EventSource("gainedFocus");
        this.lostFocus = new gli.EventSource("lostFocus");
    };
    Tab.prototype.gainFocus = function () {
        this.hasFocus = true;
        this.el.className += " window-tab-selected";
        this.gainedFocus.fire();
    };
    Tab.prototype.loseFocus = function () {
        this.lostFocus.fire();
        this.hasFocus = false;
        this.el.className = this.el.className.replace(" window-tab-selected", "");
    };

    // TODO: don't use a shared template, or find a better way of doing it!
    Tab.genericLeftRightView =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '       <div class="window-right-inner">' +
        '           <!-- scrolling contents -->' +
        '       </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- state list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- toolbar --></div>' +
        '    </div>' +
        '</div>';

    ui.Tab = Tab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var LeftListing = function (w, elementRoot, cssBase, itemGenerator) {
        var self = this;
        this.window = w;
        this.elements = {
            list: elementRoot.getElementsByClassName("window-left-listing")[0],
            toolbar: elementRoot.getElementsByClassName("window-left-toolbar")[0]
        };
        
        // Hide toolbar until the first button is added
        this.toolbarHeight = this.elements.toolbar.style.height;
        this.elements.toolbar.style.display = "none";
        this.elements.toolbar.style.height = "0px";
        this.elements.list.style.bottom = "0px";

        this.cssBase = cssBase;
        this.itemGenerator = itemGenerator;

        this.valueEntries = [];

        this.previousSelection = null;

        this.valueSelected = new gli.EventSource("valueSelected");
    };
    
    LeftListing.prototype.addButton = function(name) {
        // Show the toolbar
        this.elements.toolbar.style.display = "";
        this.elements.toolbar.style.height = this.toolbarHeight;
        this.elements.list.style.bottom = this.toolbarHeight;
        
        var event = new gli.EventSource("buttonClicked");
        
        var buttonEl = document.createElement("div");
        buttonEl.className = "mini-button";
        
        var leftEl = document.createElement("div");
        leftEl.className = "mini-button-left";
        buttonEl.appendChild(leftEl);
        
        var spanEl = document.createElement("div");
        spanEl.className = "mini-button-span";
        spanEl.innerHTML = name;
        buttonEl.appendChild(spanEl);
        
        var rightEl = document.createElement("div");
        rightEl.className = "mini-button-right";
        buttonEl.appendChild(rightEl);
        
        this.elements.toolbar.appendChild(buttonEl);
        
        buttonEl.onclick = function (e) {
            event.fire();
            e.preventDefault();
            e.stopPropagation();
        };
        
        return event;
    };

    LeftListing.prototype.appendValue = function (value) {
        var self = this;
        var document = this.window.document;

        // <div class="XXXX-item">
        //     ??
        // </div>

        var el = document.createElement("div");
        el.className = this.cssBase + "-item listing-item";

        this.itemGenerator(el, value);

        this.elements.list.appendChild(el);

        el.onclick = function () {
            self.selectValue(value);
        };

        this.valueEntries.push({
            value: value,
            element: el
        });
        value.uielement = el;
    };

    LeftListing.prototype.resort = function () {
        // TODO: restort
    };

    LeftListing.prototype.removeValue = function (value) {
    };

    LeftListing.prototype.selectValue = function (value) {
        if (this.previousSelection) {
            var el = this.previousSelection.element;
            el.className = el.className.replace(" " + this.cssBase + "-item-selected listing-item-selected", "");
            this.previousSelection = null;
        }

        var valueObj = null;
        for (var n = 0; n < this.valueEntries.length; n++) {
            if (this.valueEntries[n].value == value) {
                valueObj = this.valueEntries[n];
                break;
            }
        }
        this.previousSelection = valueObj;
        if (valueObj) {
            valueObj.element.className += " " + this.cssBase + "-item-selected listing-item-selected";
        }

        if (value) {
            scrollIntoViewIfNeeded(value.uielement);
        }

        this.valueSelected.fire(value);
    };
    
    LeftListing.prototype.getScrollState = function () {
        return {
            list: this.elements.list.scrollTop
        };
    };
    
    LeftListing.prototype.setScrollState = function (state) {
        if (!state) {
            return;
        }
        this.elements.list.scrollTop = state.list;
    };

    ui.LeftListing = LeftListing;
})();
(function () {
    var ui = glinamespace("gli.ui");

    // options: {
    //     splitterKey: 'traceSplitter' / etc
    //     title: 'Texture'
    //     selectionName: 'Face' / etc
    //     selectionValues: ['sel 1', 'sel 2', ...]
    //     disableSizing: true/false
    //     transparentCanvas: true/false
    // }

    var SurfaceInspector = function (view, w, elementRoot, options) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {
            toolbar: elementRoot.getElementsByClassName("surface-inspector-toolbar")[0],
            statusbar: elementRoot.getElementsByClassName("surface-inspector-statusbar")[0],
            view: elementRoot.getElementsByClassName("surface-inspector-inner")[0]
        };
        this.options = options;

        var defaultWidth = 240;
        var width = gli.settings.session[options.splitterKey];
        if (width) {
            width = Math.max(240, Math.min(width, window.innerWidth - 400));
        } else {
            width = defaultWidth;
        }
        this.elements.view.style.width = width + "px";
        this.splitter = new gli.controls.SplitterBar(this.elements.view, "vertical", 240, 800, "splitter-inspector", function (newWidth) {
            view.setInspectorWidth(newWidth);
            self.layout();

            if (self.elements.statusbar) {
                self.elements.statusbar.style.width = newWidth + "px";
            }

            gli.settings.session[options.splitterKey] = newWidth;
            gli.settings.save();
        });
        view.setInspectorWidth(width);

        // Add view options
        var optionsDiv = document.createElement("div");
        optionsDiv.className = "surface-inspector-options";
        optionsDiv.style.display = "none";
        var optionsSpan = document.createElement("span");
        optionsSpan.innerHTML = options.selectionName + ": ";
        optionsDiv.appendChild(optionsSpan);
        var optionsList = document.createElement("select");
        optionsList.className = "";
        optionsDiv.appendChild(optionsList);
        this.setSelectionValues = function (selectionValues) {
            optionsList.innerHTML = "";
            if (selectionValues) {
                for (var n = 0; n < selectionValues.length; n++) {
                    var selectionOption = document.createElement("option");
                    selectionOption.innerHTML = selectionValues[n];
                    optionsList.appendChild(selectionOption);
                }
            }
        };
        this.setSelectionValues(options.selectionValues);
        this.elements.toolbar.appendChild(optionsDiv);
        this.elements.faces = optionsDiv;
        this.optionsList = optionsList;
        optionsList.onchange = function () {
            if (self.activeOption != optionsList.selectedIndex) {
                self.activeOption = optionsList.selectedIndex;
                self.updatePreview();
            }
        };

        // Add sizing options
        var sizingDiv = document.createElement("div");
        sizingDiv.className = "surface-inspector-sizing";
        if (this.options.disableSizing) {
            sizingDiv.style.display = "none";
        }
        var nativeSize = document.createElement("span");
        nativeSize.title = "Native resolution (100%)";
        nativeSize.innerHTML = "100%";
        nativeSize.onclick = function () {
            self.sizingMode = "native";
            self.layout();
        };
        sizingDiv.appendChild(nativeSize);
        var sepSize = document.createElement("div");
        sepSize.className = "surface-inspector-sizing-sep";
        sepSize.innerHTML = " | ";
        sizingDiv.appendChild(sepSize);
        var fitSize = document.createElement("span");
        fitSize.title = "Fit to inspector window";
        fitSize.innerHTML = "Fit";
        fitSize.onclick = function () {
            self.sizingMode = "fit";
            self.layout();
        };
        sizingDiv.appendChild(fitSize);
        this.elements.toolbar.appendChild(sizingDiv);
        this.elements.sizingDiv = sizingDiv;

        function getLocationString(x, y) {
            var width = self.canvas.width;
            var height = self.canvas.height;
            var tx = String(Math.round(x / width * 1000) / 1000);
            var ty = String(Math.round(y / height * 1000) / 1000);
            if (tx.length == 1) {
                tx += ".000";
            }
            while (tx.length < 5) {
                tx += "0";
            }
            if (ty.length == 1) {
                ty += ".000";
            }
            while (ty.length < 5) {
                ty += "0";
            }
            return x + ", " + y + " (" + tx + ", " + ty + ")";
        };

        // Statusbar (may not be present)
        var updatePixelPreview = null;
        var pixelDisplayMode = "location";
        var statusbar = this.elements.statusbar;
        var pixelCanvas = statusbar && statusbar.getElementsByClassName("surface-inspector-pixel")[0];
        var locationSpan = statusbar && statusbar.getElementsByClassName("surface-inspector-location")[0];
        if (statusbar) {
            statusbar.style.width = width + "px";
        }
        if (statusbar && pixelCanvas && locationSpan) {
            var lastX = 0;
            var lastY = 0;
            updatePixelPreview = function (x, y) {
                pixelCanvas.style.display = "none";

                if ((x === null) || (y === null)) {
                    locationSpan.innerHTML = "";
                    return;
                }

                lastX = x;
                lastY = y;

                var gl = gli.util.getWebGLContext(self.canvas);
                var pixel = new Uint8Array(4);
                gl.readPixels(x, self.canvas.height - y - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
                var r = pixel[0];
                var g = pixel[1];
                var b = pixel[2];
                var a = pixel[3];
                var pixelStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

                // Draw preview in the pixel canvas
                pixelCanvas.style.display = "";
                var pctx = pixelCanvas.getContext("2d");
                pctx.clearRect(0, 0, 1, 1);
                pctx.fillStyle = pixelStyle;
                pctx.fillRect(0, 0, 1, 1);

                switch (pixelDisplayMode) {
                    case "location":
                        locationSpan.innerHTML = getLocationString(x, y);
                        break;
                    case "color":
                        locationSpan.innerHTML = pixelStyle;
                        break;
                }
            };
            statusbar.addEventListener("click", function () {
                if (pixelDisplayMode == "location") {
                    pixelDisplayMode = "color";
                } else {
                    pixelDisplayMode = "location";
                }
                updatePixelPreview(lastX, lastY);
            }, false);

            this.clearPixel = function () {
                updatePixelPreview(null, null);
            };
        } else {
            this.clearPixel = function () { };
        }

        // Display canvas
        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        if (options.transparentCanvas) {
            canvas.className += " surface-inspector-canvas-transparent";
        } else {
            canvas.className += " surface-inspector-canvas";
        }
        canvas.style.display = "none";
        canvas.width = 1;
        canvas.height = 1;
        this.elements.view.appendChild(canvas);

        function getPixelPosition(e) {
            var x = e.offsetX || e.layerX;
            var y = e.offsetY || e.layerY;
            switch (self.sizingMode) {
                case "fit":
                    var scale = parseFloat(self.canvas.style.width) / self.canvas.width;
                    x /= scale;
                    y /= scale;
                    break;
                case "native":
                    break;
            }
            return [Math.floor(x), Math.floor(y)];
        };

        canvas.addEventListener("click", function (e) {
            var pos = getPixelPosition(e);
            self.inspectPixel(pos[0], pos[1], getLocationString(pos[0], pos[1]));
        }, false);

        if (updatePixelPreview) {
            canvas.addEventListener("mousemove", function (e) {
                var pos = getPixelPosition(e);
                updatePixelPreview(pos[0], pos[1]);
            }, false);
        }

        this.sizingMode = "fit";
        this.resizeHACK = false;
        this.elements.view.style.overflow = "";

        this.activeOption = 0;

        gli.host.setTimeout(function () {
            self.setupPreview();
            self.layout();
        }, 0);
    };

    SurfaceInspector.prototype.inspectPixel = function (x, y, locationString) {
    };

    SurfaceInspector.prototype.setupPreview = function () {
        this.activeOption = 0;
    };

    SurfaceInspector.prototype.updatePreview = function () {
    };

    SurfaceInspector.prototype.layout = function () {
        var self = this;
        this.clearPixel();

        var size = this.querySize();
        if (!size) {
            return;
        }

        if (this.options.autoFit) {
            this.canvas.style.left = "";
            this.canvas.style.top = "";
            this.canvas.style.width = "";
            this.canvas.style.height = "";
            var parentWidth = this.elements.view.clientWidth;
            var parentHeight = this.elements.view.clientHeight;
            this.canvas.width = parentWidth;
            this.canvas.height = parentHeight;
            self.updatePreview();
        } else {
            switch (this.sizingMode) {
                case "native":
                    this.elements.view.style.overflow = "auto";
                    this.canvas.style.left = "";
                    this.canvas.style.top = "";
                    this.canvas.style.width = "";
                    this.canvas.style.height = "";
                    break;
                case "fit":
                    this.elements.view.style.overflow = "";

                    var parentWidth = this.elements.view.clientWidth;
                    var parentHeight = this.elements.view.clientHeight;
                    var parentar = parentHeight / parentWidth;
                    var ar = size[1] / size[0];

                    var width;
                    var height;
                    if (ar * parentWidth < parentHeight) {
                        width = parentWidth;
                        height = (ar * parentWidth);
                    } else {
                        height = parentHeight;
                        width = (parentHeight / ar);
                    }
                    if (width && height) {
                        this.canvas.style.width = width + "px";
                        this.canvas.style.height = height + "px";
                    }

                    this.canvas.style.left = ((parentWidth / 2) - (width / 2)) + "px";
                    this.canvas.style.top = ((parentHeight / 2) - (height / 2)) + "px";

                    // HACK: force another layout because we may have changed scrollbar status
                    if (this.resizeHACK) {
                        this.resizeHACK = false;
                    } else {
                        this.resizeHACK = true;
                        gli.host.setTimeout(function () {
                            self.layout();
                        }, 0);
                    }
                    break;
            }
        }
    };

    SurfaceInspector.prototype.reset = function () {
        this.elements.view.scrollLeft = 0;
        this.elements.view.scrollTop = 0;
    };

    ui.SurfaceInspector = SurfaceInspector;
})();
(function () {
    var ui = glinamespace("gli.ui");

    function generateFunctionDisplay(context, call, el) {
        var sig = "";

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            sig += "UNK ";
        } else {
            sig += "void ";
        }

        sig += call.info.name + "(";

        var argInfos = call.info.getArgs(call);
        if (argInfos.length || argInfos.length == 0) {
            for (var n = 0; n < argInfos.length; n++) {
                var argInfo = argInfos[n];
                if (n != 0) {
                    sig += ", ";
                }
                sig += argInfo.name;
            }
        } else {
            if (argInfos) {
                var UIType = gli.UIType;
                switch (argInfos.ui) {
                    case UIType.COLORMASK:
                        sig += "r, g, b, a";
                        break;
                    case UIType.COLOR:
                        sig += "r, g, b, a";
                        break;
                }
            }
        }

        sig += ")";

        var functionSpan = document.createElement("span");
        functionSpan.innerHTML = call.info.name;
        functionSpan.title = sig;
        el.appendChild(functionSpan);
    };

    function generateValueString(context, call, ui, value, argIndex) {
        var gl = context;
        var UIType = gli.UIType;

        var text = null;

        var argInfos = call.info.getArgs(call);

        // If no UI provided, fake one and guess
        if (!ui) {
            ui = {};
            ui.type = UIType.OBJECT;
        }
        if (value && value.trackedObject) {
            // Got passed a real gl object instead of our tracked one - fixup
            value = value.trackedObject;
        }

        switch (ui.type) {
            case UIType.ENUM:
                var anyMatches = false;
                for (var i = 0; i < ui.values.length; i++) {
                    var enumName = ui.values[i];
                    if (value == gl[enumName]) {
                        anyMatches = true;
                        text = enumName;
                    }
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                break;
            case UIType.ARRAY:
                text = "[" + value + "]";
                break;
            case UIType.BOOL:
                text = value ? "true" : "false";
                break;
            case UIType.LONG:
                text = value;
                break;
            case UIType.ULONG:
                text = value;
                break;
            case UIType.COLORMASK:
                text = value;
                //outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
                //outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
                //outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
                //outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value.target && gli.util.isWebGLResource(value.target)) {
                    var typename = glitypename(value.target);
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value) {
                    var typename = glitypename(value);
                    switch (typename) {
                        case "WebGLUniformLocation":
                            text = '"' + value.sourceUniformName + '"';
                            break;
                    }
                }
                break;
            case UIType.WH:
                text = value[0] + " x " + value[1];
                break;
            case UIType.RECT:
                text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
                break;
            case UIType.STRING:
                text = '"' + value + '"';
                break;
            case UIType.COLOR:
                text = value;
                //outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
                //                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
                //                ")</span>";
                // TODO: color tip
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                text = "0x" + value.toString(16);
                // TODO: bitmask tip
                break;
            case UIType.RANGE:
                text = value[0] + " - " + value[1];
                break;
            case UIType.MATRIX:
                switch (value.length) {
                    default: // ?
                        text = "[matrix]";
                        break;
                    case 4: // 2x2
                        text = "[matrix 2x2]";
                        break;
                    case 9: // 3x3
                        text = "[matrix 3x3]";
                        break;
                    case 16: // 4x4
                        text = "[matrix 4x4]";
                        break;
                }
                // TODO: matrix tip
                text = "[" + value + "]";
                break;
        }

        return text;
    };

    function generateValueDisplay(w, context, call, el, ui, value, argIndex) {
        var vel = document.createElement("span");

        var gl = context;
        var UIType = gli.UIType;

        var text = null;
        var tip = null;
        var clickhandler = null;

        var argInfos = call.info.getArgs(call);
        if (argInfos.length || argInfos.length == 0) {
            var argInfo = argInfos[argIndex];
            if (argInfo) {
                tip = argInfo.name;
            }
        } else {
            if (argInfos) {
                switch (argInfos.ui) {
                    case UIType.COLORMASK:
                        break;
                    case UIType.COLOR:
                        break;
                }
            }
        }

        // If no UI provided, fake one and guess
        if (!ui) {
            ui = {};
            ui.type = UIType.OBJECT;
        }
        if (value && value.trackedObject) {
            // Got passed a real gl object instead of our tracked one - fixup
            value = value.trackedObject;
        }

        // This slows down large traces - need to do all tips on demand instead
        var useEnumTips = false;

        switch (ui.type) {
            case UIType.ENUM:
                var enumTip = tip;
                enumTip += ":\r\n";
                var anyMatches = false;
                if (useEnumTips) {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        enumTip += enumName;
                        if (value == gl[enumName]) {
                            anyMatches = true;
                            text = enumName;
                            enumTip += " <---";
                        }
                        enumTip += "\r\n";
                    }
                    tip = enumTip;
                } else {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        if (value == gl[enumName]) {
                            anyMatches = true;
                            text = enumName;
                        }
                    }
                }
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                break;
            case UIType.ARRAY:
                text = "[" + value + "]";
                break;
            case UIType.BOOL:
                text = value ? "true" : "false";
                break;
            case UIType.LONG:
                text = value;
                break;
            case UIType.ULONG:
                text = value;
                break;
            case UIType.COLORMASK:
                text = value;
                //outputHTML += "R<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[0] ? "checked='checked'" : "") + "/>";
                //outputHTML += "G<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[1] ? "checked='checked'" : "") + "/>";
                //outputHTML += "B<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[2] ? "checked='checked'" : "") + "/>";
                //outputHTML += "A<input type='checkbox' " + (readOnly ? "disabled='disabled'" : "") + " " + (value[3] ? "checked='checked'" : "") + "/>";
                break;
            case UIType.OBJECT:
                // TODO: custom object output based on type
                text = value ? value : "null";
                if (value && value.target && gli.util.isWebGLResource(value.target)) {
                    var typename = glitypename(value.target);
                    switch (typename) {
                        case "WebGLBuffer":
                            clickhandler = function () {
                                w.showBuffer(value, true);
                            };
                            break;
                        case "WebGLFramebuffer":
                            break;
                        case "WebGLProgram":
                            clickhandler = function () {
                                w.showProgram(value, true);
                            };
                            break;
                        case "WebGLRenderbuffer":
                            break;
                        case "WebGLShader":
                            break;
                        case "WebGLTexture":
                            clickhandler = function () {
                                w.showTexture(value, true);
                            };
                            break;
                    }
                    text = "[" + value.getName() + "]";
                } else if (gli.util.isTypedArray(value)) {
                    text = "[" + value + "]";
                } else if (value) {
                    var typename = glitypename(value);
                    switch (typename) {
                        case "WebGLUniformLocation":
                            text = '"' + value.sourceUniformName + '"';
                            break;
                    }
                }
                break;
            case UIType.WH:
                text = value[0] + " x " + value[1];
                break;
            case UIType.RECT:
                text = value[0] + ", " + value[1] + " " + value[2] + " x " + value[3];
                break;
            case UIType.STRING:
                text = '"' + value + '"';
                break;
            case UIType.COLOR:
                text = value;
                //                outputHTML += "<span style='color: rgb(" + (value[0] * 255) + "," + (value[1] * 255) + "," + (value[2] * 255) + ")'>rgba(" +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[0] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[1] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[2] + "'/>, " +
                //                                "<input type='text' " + (readOnly ? "readonly='readonly'" : "") + " value='" + value[3] + "'/>" +
                //                                ")</span>";
                // TODO: color tip
                break;
            case UIType.FLOAT:
                text = value;
                break;
            case UIType.BITMASK:
                // If enum values present use them (they are flags), otherwise just a hex value
                text = "";
                if (ui.values && ui.values.length) {
                    for (var i = 0; i < ui.values.length; i++) {
                        var enumName = ui.values[i];
                        if (value & gl[enumName]) {
                            if (text.length) {
                                text += " | " + enumName;
                            } else {
                                text = enumName;
                            }
                        }
                    }
                } else {
                    text = "0x" + value.toString(16);
                }
                // TODO: bitmask tip
                break;
            case UIType.RANGE:
                text = value[0] + " - " + value[1];
                break;
            case UIType.MATRIX:
                switch (value.length) {
                    default: // ?
                        text = "[matrix]";
                        break;
                    case 4: // 2x2
                        text = "[matrix 2x2]";
                        break;
                    case 9: // 3x3
                        text = "[matrix 3x3]";
                        break;
                    case 16: // 4x4
                        text = "[matrix 4x4]";
                        break;
                }
                // TODO: matrix tip
                text = "[" + value + "]";
                break;
        }

        vel.innerHTML = text;
        vel.title = tip;

        if (clickhandler) {
            vel.className += " trace-call-clickable";
            vel.onclick = function (e) {
                clickhandler();
                e.preventDefault();
                e.stopPropagation();
            };
        }

        el.appendChild(vel);
    };

    function populateCallString(context, call) {
        var s = call.info.name;
        s += "(";

        var argInfos = call.info.getArgs(call);
        if (argInfos.length || argInfos.length == 0) {
            for (var n = 0; n < call.args.length; n++) {
                var argInfo = (n < argInfos.length) ? argInfos[n] : null;
                var argValue = call.args[n];
                if (n != 0) {
                    s += ", ";
                }
                s += generateValueString(context, call, argInfo ? argInfo.ui : null, argValue, n);
            }
        } else {
            // Special argument formatter
            s += generateValueString(w, context, call, argInfos, call.args);
        }

        s += ")";

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            s += " = ";
            s += generateValueString(context, call, call.info.returnType, call.result);
            //el.appendChild(document.createTextNode(call.result)); // TODO: pretty
        }

        return s;
    };

    function populateCallLine(w, call, el) {
        var context = w.context;

        generateFunctionDisplay(context, call, el);

        el.appendChild(document.createTextNode("("));

        var argInfos = call.info.getArgs(call);
        if (argInfos.length || argInfos.length == 0) {
            for (var n = 0; n < call.args.length; n++) {
                var argInfo = (n < argInfos.length) ? argInfos[n] : null;
                var argValue = call.args[n];
                if (n != 0) {
                    el.appendChild(document.createTextNode(", "));
                }
                generateValueDisplay(w, context, call, el, argInfo ? argInfo.ui : null, argValue, n);
            }
        } else {
            // Special argument formatter
            generateValueDisplay(w, context, call, el, argInfos, call.args);
        }

        el.appendChild(document.createTextNode(")"));

        // TODO: return type must be set in info.js
        //if (call.info.returnType) {
        if (call.result) {
            el.appendChild(document.createTextNode(" = "));
            generateValueDisplay(w, context, call, el, call.info.returnType, call.result);
            //el.appendChild(document.createTextNode(call.result)); // TODO: pretty
        }
    };

    function appendHistoryLine(gl, el, call) {
        // <div class="history-call">
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        // </div>

        var callRoot = document.createElement("div");
        callRoot.className = "usage-call";

        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(gl.ui, call, line);
        callRoot.appendChild(line);

        el.appendChild(callRoot);

        // TODO: click to expand stack trace?
    };

    function appendCallLine(gl, el, frame, call) {
        // <div class="usage-call">
        //     <div class="usage-call-ordinal">
        //         NNNN
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        // </div>

        var callRoot = document.createElement("div");
        callRoot.className = "usage-call usage-call-clickable";

        callRoot.onclick = function (e) {
            // Jump to trace view and run until ordinal
            gl.ui.showTrace(frame, call.ordinal);
            e.preventDefault();
            e.stopPropagation();
        };

        var ordinal = document.createElement("div");
        ordinal.className = "usage-call-ordinal";
        ordinal.innerHTML = call.ordinal;
        callRoot.appendChild(ordinal);

        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(gl.ui, call, line);
        callRoot.appendChild(line);

        el.appendChild(callRoot);
    };
    
    function appendObjectRef(context, el, value) {
        var w = context.ui;
        
        var clickhandler = null;
        var text = value ? value : "null";
        if (value && value.target && gli.util.isWebGLResource(value.target)) {
            var typename = glitypename(value.target);
            switch (typename) {
                case "WebGLBuffer":
                    clickhandler = function () {
                        w.showBuffer(value, true);
                    };
                    break;
                case "WebGLFramebuffer":
                    break;
                case "WebGLProgram":
                    clickhandler = function () {
                        w.showProgram(value, true);
                    };
                    break;
                case "WebGLRenderbuffer":
                    break;
                case "WebGLShader":
                    break;
                case "WebGLTexture":
                    clickhandler = function () {
                        w.showTexture(value, true);
                    };
                    break;
            }
            text = "[" + value.getName() + "]";
        } else if (gli.util.isTypedArray(value)) {
            text = "[" + value + "]";
        } else if (value) {
            var typename = glitypename(value);
            switch (typename) {
                case "WebGLUniformLocation":
                    text = '"' + value.sourceUniformName + '"';
                    break;
            }
        }

        var vel = document.createElement("span");
        vel.innerHTML = text;

        if (clickhandler) {
            vel.className += " trace-call-clickable";
            vel.onclick = function (e) {
                clickhandler();
                e.preventDefault();
                e.stopPropagation();
            };
        }
        
        el.appendChild(vel);
    };

    function generateUsageList(gl, el, frame, resource) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "Usage in frame " + frame.frameNumber;
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "resource-usage";
        el.appendChild(rootEl);

        var usages = frame.findResourceUsages(resource);
        if (usages == null) {
            var notUsed = document.createElement("div");
            notUsed.innerHTML = "Not used in this frame";
            rootEl.appendChild(notUsed);
        } else if (usages.length == 0) {
            var notUsed = document.createElement("div");
            notUsed.innerHTML = "Used but not referenced in this frame";
            rootEl.appendChild(notUsed);
        } else {
            for (var n = 0; n < usages.length; n++) {
                var call = usages[n];
                appendCallLine(gl, rootEl, frame, call);
            }
        }
    };

    ui.populateCallString = populateCallString;
    ui.populateCallLine = populateCallLine;
    ui.appendHistoryLine = appendHistoryLine;
    ui.appendCallLine = appendCallLine;
    ui.appendObjectRef = appendObjectRef;
    ui.generateUsageList = generateUsageList;

})();
(function () {
    var ui = glinamespace("gli.ui");

    var PopupWindow = function (context, name, title, defaultWidth, defaultHeight) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=" + defaultWidth + ",innerHeight=" + defaultHeight + "");
        w.document.writeln("<html><head><title>" + title + "</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        w.focus();

        w.addEventListener("unload", function () {
            self.dispose();
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            context.ui.windows[name] = null;
        }, false);

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        } else {
            var targets = [w.document.body, w.document.head, w.document.documentElement];
            for (var n = 0; n < targets.length; n++) {
                var target = targets[n];
                if (target) {
                    var link = w.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = window["gliCssUrl"];
                    target.appendChild(link);
                    break;
                }
            }
        }

        this.elements = {};

        gli.host.setTimeout(function () {
            var doc = self.browserWindow.document;
            var body = doc.body;

            var toolbarDiv = self.elements.toolbarDiv = doc.createElement("div");
            toolbarDiv.className = "popup-toolbar";
            body.appendChild(toolbarDiv);

            var innerDiv = self.elements.innerDiv = doc.createElement("div");
            innerDiv.className = "popup-inner";
            body.appendChild(innerDiv);

            self.setup();
        }, 0);
    };

    PopupWindow.prototype.addToolbarToggle = function (name, tip, defaultValue, callback) {
        var self = this;
        var doc = this.browserWindow.document;
        var toolbarDiv = this.elements.toolbarDiv;

        var input = doc.createElement("input");
        input.style.width = "inherit";
        input.style.height = "inherit";

        input.type = "checkbox";
        input.title = tip;
        input.checked = defaultValue;

        input.onchange = function () {
            callback.apply(self, [input.checked]);
        };

        var span = doc.createElement("span");
        span.innerHTML = "&nbsp;" + name;

        span.onclick = function () {
            input.checked = !input.checked;
            callback.apply(self, [input.checked]);
        };

        var el = doc.createElement("div");
        el.className = "popup-toolbar-toggle";
        el.appendChild(input);
        el.appendChild(span);

        toolbarDiv.appendChild(el);

        callback.apply(this, [defaultValue]);
    };

    PopupWindow.prototype.buildPanel = function () {
        var doc = this.browserWindow.document;

        var panelOuter = doc.createElement("div");
        panelOuter.className = "popup-panel-outer";

        var panel = doc.createElement("div");
        panel.className = "popup-panel";

        panelOuter.appendChild(panel);
        this.elements.innerDiv.appendChild(panelOuter);
        return panel;
    };

    PopupWindow.prototype.setup = function () {
    };

    PopupWindow.prototype.dispose = function () {
    };

    PopupWindow.prototype.focus = function () {
        this.browserWindow.focus();
    };

    PopupWindow.prototype.close = function () {
        this.dispose();
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.context.ui.windows[name] = null;
    };

    PopupWindow.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
    };

    PopupWindow.show = function (context, type, name, callback) {
        var existing = context.ui.windows[name];
        if (existing && existing.isOpened()) {
            existing.focus();
            if (callback) {
                callback(existing);
            }
        } else {
            if (existing) {
                existing.dispose();
            }
            context.ui.windows[name] = new type(context, name);
            if (callback) {
                gli.host.setTimeout(function () {
                    // May have somehow closed in the interim
                    var popup = context.ui.windows[name];
                    if (popup) {
                        callback(popup);
                    }
                }, 0);
            }
        }
    };

    ui.PopupWindow = PopupWindow;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var BufferPreview = function (canvas) {
        this.document = canvas.ownerDocument;
        this.canvas = canvas;
        this.drawState = null;
        
        var expandLink = this.expandLink = document.createElement("span");
        expandLink.className = "surface-inspector-collapsed";
        expandLink.innerHTML = "Show preview";
        expandLink.style.visibility = "collapse";
        canvas.parentNode.appendChild(expandLink);

        var gl = this.gl = gli.util.getWebGLContext(canvas);
        
        var vsSource =
        'uniform mat4 u_projMatrix;' +
        'uniform mat4 u_modelViewMatrix;' +
        'uniform mat4 u_modelViewInvMatrix;' +
        'uniform bool u_enableLighting;' +
        'attribute vec3 a_position;' +
        'attribute vec3 a_normal;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    gl_Position = u_projMatrix * u_modelViewMatrix * vec4(a_position, 1.0);' +
        '    if (u_enableLighting) {' +
        '        vec3 lightDirection = vec3(0.0, 0.0, 1.0);' +
        '        vec4 normalT = u_modelViewInvMatrix * vec4(a_normal, 1.0);' +
        '        float lighting = max(dot(normalT.xyz, lightDirection), 0.0);' +
        '        v_lighting = vec3(0.2, 0.2, 0.2) + vec3(1.0, 1.0, 1.0) * lighting;' +
        '    } else {' +
        '        v_lighting = vec3(1.0, 1.0, 1.0);' +
        '    }' +
        '    gl_PointSize = 3.0;' +
        '}';
        var fsSource =
        'precision highp float;' +
        'uniform bool u_wireframe;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    vec4 color;' +
        '    if (u_wireframe) {' +
        '        color = vec4(1.0, 1.0, 1.0, 0.4);' +
        '    } else {' +
        '        color = vec4(1.0, 0.0, 0.0, 1.0);' +
        '    }' +
        '    gl_FragColor = vec4(color.rgb * v_lighting, color.a);' +
        '}';

        // Initialize shaders
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        var program = this.program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        this.program.a_position = gl.getAttribLocation(this.program, "a_position");
        this.program.a_normal = gl.getAttribLocation(this.program, "a_normal");
        this.program.u_projMatrix = gl.getUniformLocation(this.program, "u_projMatrix");
        this.program.u_modelViewMatrix = gl.getUniformLocation(this.program, "u_modelViewMatrix");
        this.program.u_modelViewInvMatrix = gl.getUniformLocation(this.program, "u_modelViewInvMatrix");
        this.program.u_enableLighting = gl.getUniformLocation(this.program, "u_enableLighting");
        this.program.u_wireframe = gl.getUniformLocation(this.program, "u_wireframe");

        // Default state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.disable(gl.CULL_FACE);

        this.camera = {
            defaultDistance: 5,
            distance: 5,
            rotx: 0,
            roty: 0
        };
    };

    BufferPreview.prototype.resetCamera = function () {
        this.camera.distance = this.camera.defaultDistance;
        this.camera.rotx = 0;
        this.camera.roty = 0;
        this.draw();
    };

    BufferPreview.prototype.dispose = function () {
        var gl = this.gl;
        
        this.setBuffer(null);

        gl.deleteProgram(this.program);
        this.program = null;

        this.gl = null;
        this.canvas = null;
    };

    BufferPreview.prototype.draw = function () {
        var gl = this.gl;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if (!this.drawState) {
            return;
        }
        var ds = this.drawState;

        // Setup projection matrix
        var zn = 0.1;
        var zf = 1000.0; // TODO: normalize depth range based on buffer?
        var fovy = 45.0;
        var top = zn * Math.tan(fovy * Math.PI / 360.0);
        var bottom = -top;
        var aspectRatio = (this.canvas.width / this.canvas.height);
        var left = bottom * aspectRatio;
        var right = top * aspectRatio;
        var projMatrix = new Float32Array([
            2 * zn / (right - left), 0, 0, 0,
            0, 2 * zn / (top - bottom), 0, 0,
            (right + left) / (right - left), 0, -(zf + zn) / (zf - zn), -1,
            0, (top + bottom) / (top - bottom), -2 * zf * zn / (zf - zn), 0
        ]);
        gl.uniformMatrix4fv(this.program.u_projMatrix, false, projMatrix);

        var M = {
            m00: 0, m01: 1, m02: 2, m03: 3,
            m10: 4, m11: 5, m12: 6, m13: 7,
            m20: 8, m21: 9, m22: 10, m23: 11,
            m30: 12, m31: 13, m32: 14, m33: 15
        };
        function matrixMult(a, b) {
            var c = new Float32Array(16);
            c[M.m00] = a[M.m00] * b[M.m00] + a[M.m01] * b[M.m10] + a[M.m02] * b[M.m20] + a[M.m03] * b[M.m30];
            c[M.m01] = a[M.m00] * b[M.m01] + a[M.m01] * b[M.m11] + a[M.m02] * b[M.m21] + a[M.m03] * b[M.m31];
            c[M.m02] = a[M.m00] * b[M.m02] + a[M.m01] * b[M.m12] + a[M.m02] * b[M.m22] + a[M.m03] * b[M.m32];
            c[M.m03] = a[M.m00] * b[M.m03] + a[M.m01] * b[M.m13] + a[M.m02] * b[M.m23] + a[M.m03] * b[M.m33];
            c[M.m10] = a[M.m10] * b[M.m00] + a[M.m11] * b[M.m10] + a[M.m12] * b[M.m20] + a[M.m13] * b[M.m30];
            c[M.m11] = a[M.m10] * b[M.m01] + a[M.m11] * b[M.m11] + a[M.m12] * b[M.m21] + a[M.m13] * b[M.m31];
            c[M.m12] = a[M.m10] * b[M.m02] + a[M.m11] * b[M.m12] + a[M.m12] * b[M.m22] + a[M.m13] * b[M.m32];
            c[M.m13] = a[M.m10] * b[M.m03] + a[M.m11] * b[M.m13] + a[M.m12] * b[M.m23] + a[M.m13] * b[M.m33];
            c[M.m20] = a[M.m20] * b[M.m00] + a[M.m21] * b[M.m10] + a[M.m22] * b[M.m20] + a[M.m23] * b[M.m30];
            c[M.m21] = a[M.m20] * b[M.m01] + a[M.m21] * b[M.m11] + a[M.m22] * b[M.m21] + a[M.m23] * b[M.m31];
            c[M.m22] = a[M.m20] * b[M.m02] + a[M.m21] * b[M.m12] + a[M.m22] * b[M.m22] + a[M.m23] * b[M.m32];
            c[M.m23] = a[M.m20] * b[M.m03] + a[M.m21] * b[M.m13] + a[M.m22] * b[M.m23] + a[M.m23] * b[M.m33];
            c[M.m30] = a[M.m30] * b[M.m00] + a[M.m31] * b[M.m10] + a[M.m32] * b[M.m20] + a[M.m33] * b[M.m30];
            c[M.m31] = a[M.m30] * b[M.m01] + a[M.m31] * b[M.m11] + a[M.m32] * b[M.m21] + a[M.m33] * b[M.m31];
            c[M.m32] = a[M.m30] * b[M.m02] + a[M.m31] * b[M.m12] + a[M.m32] * b[M.m22] + a[M.m33] * b[M.m32];
            c[M.m33] = a[M.m30] * b[M.m03] + a[M.m31] * b[M.m13] + a[M.m32] * b[M.m23] + a[M.m33] * b[M.m33];
            return c;
        };
        function matrixInverse(m) {
            var inv = new Float32Array(16);
            inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
            inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
            inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
            inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
            inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
            inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
            inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
            inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
            inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
            inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
            inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
            inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
            inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
            inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
            inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
            inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
            var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
            if (det == 0.0)
                return null;
            det = 1.0 / det;
            for (var i = 0; i < 16; i++)
                inv[i] = inv[i] * det;
            return inv;
        };

        // Build the view matrix
        /*this.camera = {
        distance: 5,
        rotx: 0,
        roty: 0
        };*/
        var cx = Math.cos(-this.camera.roty);
        var sx = Math.sin(-this.camera.roty);
        var xrotMatrix = new Float32Array([
            1, 0, 0, 0,
            0, cx, -sx, 0,
            0, sx, cx, 0,
            0, 0, 0, 1
        ]);
        var cy = Math.cos(-this.camera.rotx);
        var sy = Math.sin(-this.camera.rotx);
        var yrotMatrix = new Float32Array([
            cy, 0, sy, 0,
            0, 1, 0, 0,
            -sy, 0, cy, 0,
            0, 0, 0, 1
        ]);
        var zoomMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -this.camera.distance * 5, 1
        ]);
        var rotationMatrix = matrixMult(yrotMatrix, xrotMatrix);
        var modelViewMatrix = matrixMult(rotationMatrix, zoomMatrix);
        gl.uniformMatrix4fv(this.program.u_modelViewMatrix, false, modelViewMatrix);

        // Inverse view matrix (for lighting)
        var modelViewInvMatrix = matrixInverse(modelViewMatrix);
        function transpose(m) {
            var rows = 4, cols = 4;
            var elements = new Array(16), ni = cols, i, nj, j;
            do {
                i = cols - ni;
                nj = rows;
                do {
                    j = rows - nj;
                    elements[i * 4 + j] = m[j * 4 + i];
                } while (--nj);
            } while (--ni);
            return elements;
        };
        modelViewInvMatrix = transpose(modelViewInvMatrix);
        gl.uniformMatrix4fv(this.program.u_modelViewInvMatrix, false, modelViewInvMatrix);

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        if (!this.triBuffer) {
            // No custom buffer, draw raw user stuff
            gl.uniform1i(this.program.u_enableLighting, 0);
            gl.uniform1i(this.program.u_wireframe, 0);
            gl.enableVertexAttribArray(this.program.a_position);
            gl.disableVertexAttribArray(this.program.a_normal);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBufferTarget);
            gl.vertexAttribPointer(this.program.a_position, ds.position.size, ds.position.type, ds.position.normalized, ds.position.stride, ds.position.offset);
            gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, ds.position.stride, 0);
            if (this.elementArrayBufferTarget) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBufferTarget);
                gl.drawElements(ds.mode, ds.count, ds.elementArrayType, ds.offset);
            } else {
                gl.drawArrays(ds.mode, ds.first, ds.count);
            }
        } else {
            // Draw triangles
            if (this.triBuffer) {
                gl.uniform1i(this.program.u_enableLighting, 1);
                gl.uniform1i(this.program.u_wireframe, 0);
                gl.enableVertexAttribArray(this.program.a_position);
                gl.enableVertexAttribArray(this.program.a_normal);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
                gl.vertexAttribPointer(this.program.a_position, 3, gl.FLOAT, false, 24, 0);
                gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, 24, 12);
                gl.drawArrays(gl.TRIANGLES, 0, this.triBuffer.count);
            }

            // Draw wireframe
            if (this.lineBuffer) {
                gl.enable(gl.DEPTH_TEST);
                gl.enable(gl.BLEND);
                gl.uniform1i(this.program.u_enableLighting, 0);
                gl.uniform1i(this.program.u_wireframe, 1);
                gl.enableVertexAttribArray(this.program.a_position);
                gl.disableVertexAttribArray(this.program.a_normal);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
                gl.vertexAttribPointer(this.program.a_position, 3, gl.FLOAT, false, 0, 0);
                gl.vertexAttribPointer(this.program.a_normal, 3, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINES, 0, this.lineBuffer.count);
            }
        }
    };

    function extractAttribute(gl, buffer, version, attrib) {
        var data = buffer.constructVersion(gl, version);
        if (!data) {
            return null;
        }
        var dataBuffer = data.buffer ? data.buffer : data;

        var result = [];

        var byteAdvance = 0;
        switch (attrib.type) {
            case gl.BYTE:
            case gl.UNSIGNED_BYTE:
                byteAdvance = 1 * attrib.size;
                break;
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
                byteAdvance = 2 * attrib.size;
                break;
            default:
            case gl.FLOAT:
                byteAdvance = 4 * attrib.size;
                break;
        }
        var stride = attrib.stride ? attrib.stride : byteAdvance;
        var byteOffset = 0;
        while (byteOffset < data.byteLength) {
            var readView = null;
            switch (attrib.type) {
                case gl.BYTE:
                    readView = new Int8Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.UNSIGNED_BYTE:
                    readView = new Uint8Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.SHORT:
                    readView = new Int16Array(dataBuffer, byteOffset, attrib.size);
                    break;
                case gl.UNSIGNED_SHORT:
                    readView = new Uint16Array(dataBuffer, byteOffset, attrib.size);
                    break;
                default:
                case gl.FLOAT:
                    readView = new Float32Array(dataBuffer, byteOffset, attrib.size);
                    break;
            }

            // HACK: this is completely and utterly stupidly slow
            // TODO: speed up extracting attributes
            switch (attrib.size) {
                case 1:
                    result.push([readView[0], 0, 0, 0]);
                    break;
                case 2:
                    result.push([readView[0], readView[1], 0, 0]);
                    break;
                case 3:
                    result.push([readView[0], readView[1], readView[2], 0]);
                    break;
                case 4:
                    result.push([readView[0], readView[1], readView[2], readView[3]]);
                    break;
            }

            byteOffset += stride;
        }

        return result;
    };

    function buildTriangles(gl, drawState, start, count, positionData, indices) {
        var triangles = [];

        var end = start + count;

        // Emit triangles
        switch (drawState.mode) {
            case gl.TRIANGLES:
                if (indices) {
                    for (var n = start; n < end; n += 3) {
                        triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
                    }
                } else {
                    for (var n = start; n < end; n += 3) {
                        triangles.push([n, n + 1, n + 2]);
                    }
                }
                break;
            case gl.TRIANGLE_FAN:
                if (indices) {
                    triangles.push([indices[start], indices[start + 1], indices[start + 2]]);
                    for (var n = start + 2; n < end; n++) {
                        triangles.push([indices[start], indices[n], indices[n + 1]]);
                    }
                } else {
                    triangles.push([start, start + 1, start + 2]);
                    for (var n = start + 2; n < end; n++) {
                        triangles.push([start, n, n + 1]);
                    }
                }
                break;
            case gl.TRIANGLE_STRIP:
                if (indices) {
                    for (var n = start; n < end - 2; n++) {
                        if (indices[n] == indices[n + 1]) {
                            // Degenerate
                            continue;
                        }
                        if (n % 2 == 0) {
                            triangles.push([indices[n], indices[n + 1], indices[n + 2]]);
                        } else {
                            triangles.push([indices[n + 2], indices[n + 1], indices[n]]);
                        }
                    }
                } else {
                    for (var n = start; n < end - 2; n++) {
                        if (n % 2 == 0) {
                            triangles.push([n, n + 1, n + 2]);
                        } else {
                            triangles.push([n + 2, n + 1, n]);
                        }
                    }
                }
                break;
        }

        return triangles;
    };

    // from tdl
    function normalize(a) {
        var r = [];
        var n = 0.0;
        var aLength = a.length;
        for (var i = 0; i < aLength; i++) {
            n += a[i] * a[i];
        }
        n = Math.sqrt(n);
        if (n > 0.00001) {
            for (var i = 0; i < aLength; i++) {
                r[i] = a[i] / n;
            }
        } else {
            r = [0, 0, 0];
        }
        return r;
    };

    // drawState: {
    //     mode: enum
    //     arrayBuffer: [value, version]
    //     position: { size: enum, type: enum, normalized: bool, stride: n, offset: n }
    //     elementArrayBuffer: [value, version]/null
    //     elementArrayType: UNSIGNED_BYTE/UNSIGNED_SHORT/null
    //     first: n (if no elementArrayBuffer)
    //     offset: n bytes (if elementArrayBuffer)
    //     count: n
    // }
    BufferPreview.prototype.setBuffer = function (drawState, force) {
        var self = this;
        var gl = this.gl;
        if (this.arrayBufferTarget) {
            this.arrayBuffer.deleteTarget(gl, this.arrayBufferTarget);
            this.arrayBufferTarget = null;
            this.arrayBuffer = null;
        }
        if (this.elementArrayBufferTarget) {
            this.elementArrayBuffer.deleteTarget(gl, this.elementArrayBufferTarget);
            this.elementArrayBufferTarget = null;
            this.elementArrayBuffer = null;
        }

        var maxPreviewBytes = 40000;
        if (drawState && !force && drawState.arrayBuffer[1].parameters[gl.BUFFER_SIZE] > maxPreviewBytes) {
            // Buffer is really big - delay populating
            this.expandLink.style.visibility = "visible";
            this.expandLink.onclick = function () {
                self.setBuffer(drawState, true);
                self.expandLink.style.visibility = "collapse";
            };
            this.drawState = null;
            this.draw();
        } else if (drawState) {
            if (drawState.arrayBuffer) {
                this.arrayBuffer = drawState.arrayBuffer[0];
                var version = drawState.arrayBuffer[1];
                this.arrayBufferTarget = this.arrayBuffer.createTarget(gl, version);
            }
            if (drawState.elementArrayBuffer) {
                this.elementArrayBuffer = drawState.elementArrayBuffer[0];
                var version = drawState.elementArrayBuffer[1];
                this.elementArrayBufferTarget = this.elementArrayBuffer.createTarget(gl, version);
            }

            // Grab all position data as a list of vec4
            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], drawState.position);

            // Pull out indices (or null if none)
            var indices = null;
            if (drawState.elementArrayBuffer) {
                indices = drawState.elementArrayBuffer[0].constructVersion(gl, drawState.elementArrayBuffer[1]);
            }

            // Get interested range
            var start;
            var count = drawState.count;
            if (drawState.elementArrayBuffer) {
                // Indexed
                start = drawState.offset;
                switch (drawState.elementArrayType) {
                    case gl.UNSIGNED_BYTE:
                        start /= 1;
                        break;
                    case gl.UNSIGNED_SHORT:
                        start /= 2;
                        break;
                }
            } else {
                // Unindexed
                start = drawState.first;
            }

            // Get all triangles as a list of 3-set [v1,v2,v3] vertex indices
            var areTriangles = false;
            switch (drawState.mode) {
                case gl.TRIANGLES:
                case gl.TRIANGLE_FAN:
                case gl.TRIANGLE_STRIP:
                    areTriangles = true;
                    break;
            }
            if (areTriangles) {
                this.triangles = buildTriangles(gl, drawState, start, count, positionData, indices);
                var i;

                // Generate interleaved position + normal data from triangles as a TRIANGLES list
                var triData = new Float32Array(this.triangles.length * 3 * 3 * 2);
                i = 0;
                for (var n = 0; n < this.triangles.length; n++) {
                    var tri = this.triangles[n];
                    var v1 = positionData[tri[0]];
                    var v2 = positionData[tri[1]];
                    var v3 = positionData[tri[2]];

                    // a = v2 - v1
                    var a = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
                    // b = v3 - v1
                    var b = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
                    // a x b
                    var normal = normalize([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);

                    triData[i++] = v1[0]; triData[i++] = v1[1]; triData[i++] = v1[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                    triData[i++] = v2[0]; triData[i++] = v2[1]; triData[i++] = v2[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                    triData[i++] = v3[0]; triData[i++] = v3[1]; triData[i++] = v3[2];
                    triData[i++] = normal[0]; triData[i++] = normal[1]; triData[i++] = normal[2];
                }
                this.triBuffer = gl.createBuffer();
                this.triBuffer.count = this.triangles.length * 3;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.triBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, triData, gl.STATIC_DRAW);

                // Generate LINES list for wireframe
                var lineData = new Float32Array(this.triangles.length * 3 * 2 * 3);
                i = 0;
                for (var n = 0; n < this.triangles.length; n++) {
                    var tri = this.triangles[n];
                    var v1 = positionData[tri[0]];
                    var v2 = positionData[tri[1]];
                    var v3 = positionData[tri[2]];
                    lineData[i++] = v1[0]; lineData[i++] = v1[1]; lineData[i++] = v1[2];
                    lineData[i++] = v2[0]; lineData[i++] = v2[1]; lineData[i++] = v2[2];
                    lineData[i++] = v2[0]; lineData[i++] = v2[1]; lineData[i++] = v2[2];
                    lineData[i++] = v3[0]; lineData[i++] = v3[1]; lineData[i++] = v3[2];
                    lineData[i++] = v3[0]; lineData[i++] = v3[1]; lineData[i++] = v3[2];
                    lineData[i++] = v1[0]; lineData[i++] = v1[1]; lineData[i++] = v1[2];
                }
                this.lineBuffer = gl.createBuffer();
                this.lineBuffer.count = this.triangles.length * 3 * 2;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW);
            } else {
                this.triangles = null;
                this.triBuffer = null;
                this.lineBuffer = null;
            }

            // Determine the extents of the interesting region
            var minx = Number.MAX_VALUE; var miny = Number.MAX_VALUE; var minz = Number.MAX_VALUE;
            var maxx = Number.MIN_VALUE; var maxy = Number.MIN_VALUE; var maxz = Number.MIN_VALUE;
            if (indices) {
                for (var n = start; n < start + count; n++) {
                    var vec = positionData[indices[n]];
                    minx = Math.min(minx, vec[0]); maxx = Math.max(maxx, vec[0]);
                    miny = Math.min(miny, vec[1]); maxy = Math.max(maxy, vec[1]);
                    minz = Math.min(minz, vec[2]); maxz = Math.max(maxz, vec[2]);
                }
            } else {
                for (var n = start; n < start + count; n++) {
                    var vec = positionData[n];
                    minx = Math.min(minx, vec[0]); maxx = Math.max(maxx, vec[0]);
                    miny = Math.min(miny, vec[1]); maxy = Math.max(maxy, vec[1]);
                    minz = Math.min(minz, vec[2]); maxz = Math.max(maxz, vec[2]);
                }
            }
            var maxd = 0;
            var extents = [minx, miny, minz, maxx, maxy, maxz];
            for (var n = 0; n < extents.length; n++) {
                maxd = Math.max(maxd, Math.abs(extents[n]));
            }

            // Now have a bounding box for the mesh
            // TODO: set initial view based on bounding box
            this.camera.defaultDistance = maxd;
            this.resetCamera();
            
            this.drawState = drawState;
            this.draw();
        } else {
            this.drawState = null;
            this.draw();
        }
    };

    BufferPreview.prototype.setupDefaultInput = function () {
        var self = this;

        // Drag rotate
        var lastValueX = 0;
        var lastValueY = 0;
        function mouseMove(e) {
            var dx = e.screenX - lastValueX;
            var dy = e.screenY - lastValueY;
            lastValueX = e.screenX;
            lastValueY = e.screenY;

            var camera = self.camera;
            camera.rotx += dx * Math.PI / 180;
            camera.roty += dy * Math.PI / 180;
            self.draw();

            e.preventDefault();
            e.stopPropagation();
        };
        function mouseUp(e) {
            endDrag();
            e.preventDefault();
            e.stopPropagation();
        };
        function beginDrag() {
            self.document.addEventListener("mousemove", mouseMove, true);
            self.document.addEventListener("mouseup", mouseUp, true);
            self.canvas.style.cursor = "move";
            self.document.body.style.cursor = "move";
        };
        function endDrag() {
            self.document.removeEventListener("mousemove", mouseMove, true);
            self.document.removeEventListener("mouseup", mouseUp, true);
            self.canvas.style.cursor = "";
            self.document.body.style.cursor = "";
        };
        this.canvas.onmousedown = function (e) {
            beginDrag();
            lastValueX = e.screenX;
            lastValueY = e.screenY;
            e.preventDefault();
            e.stopPropagation();
        };

        // Zoom
        this.canvas.onmousewheel = function (e) {
            var delta = 0;
            if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                var camera = self.camera;
                camera.distance -= delta * (camera.defaultDistance / 10.0);
                camera.distance = Math.max(camera.defaultDistance / 10.0, camera.distance);
                self.draw();
            }

            e.preventDefault();
            e.stopPropagation();
            e.returnValue = false;
        };
        this.canvas.addEventListener("DOMMouseScroll", this.canvas.onmousewheel, false);
    };

    ui.BufferPreview = BufferPreview;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TexturePreviewGenerator = function (canvas, useMirror) {
        this.useMirror = useMirror;

        if (canvas) {
            // Re-use the canvas passed in
        } else {
            // Create a canvas for previewing
            canvas = document.createElement("canvas");
            canvas.className = "gli-reset";

            // HACK: this gets things working in firefox
            var frag = document.createDocumentFragment();
            frag.appendChild(canvas);
        }
        this.canvas = canvas;

        var gl = this.gl = gli.util.getWebGLContext(canvas);

        var vsSource =
        'attribute vec2 a_position;' +
        'attribute vec2 a_uv;' +
        'varying vec2 v_uv;' +
        'void main() {' +
        '    gl_Position = vec4(a_position, 0.0, 1.0);' +
        '    v_uv = a_uv;' +
        '}';
        var fs2dSource =
        'precision highp float;' +
        'uniform sampler2D u_sampler0;' +
        'varying vec2 v_uv;' +
        'void main() {' +
        '    gl_FragColor = texture2D(u_sampler0, v_uv);' +
        '}';

        // Initialize shaders
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        var fs2d = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs2d, fs2dSource);
        gl.compileShader(fs2d);
        var program2d = this.program2d = gl.createProgram();
        gl.attachShader(program2d, vs);
        gl.attachShader(program2d, fs2d);
        gl.linkProgram(program2d);
        gl.deleteShader(vs);
        gl.deleteShader(fs2d);
        gl.useProgram(program2d);
        program2d.u_sampler0 = gl.getUniformLocation(program2d, "u_sampler0");
        program2d.a_position = gl.getAttribLocation(program2d, "a_position");
        program2d.a_uv = gl.getAttribLocation(program2d, "a_uv");
        gl.useProgram(null);

        var vertices = new Float32Array([
            -1, -1, 0, 1,
             1, -1, 1, 1,
            -1, 1, 0, 0,
            -1, 1, 0, 0,
             1, -1, 1, 1,
             1, 1, 1, 0
        ]);
        var buffer = this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    TexturePreviewGenerator.prototype.dispose = function() {
        var gl = this.gl;

        gl.deleteProgram(this.program2d);
        this.program2d = null;

        gl.deleteBuffer(this.buffer);
        this.buffer = null;

        this.gl = null;
        this.canvas = null;
    };

    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if ((this.canvas.width != desiredWidth) || (this.canvas.height != desiredHeight)) {
            this.canvas.width = desiredWidth;
            this.canvas.height = desiredHeight;
        }

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.colorMask(true, true, true, true);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (texture && version) {
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

            gl.useProgram(this.program2d);
            gl.uniform1i(this.program2d.u_sampler0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

            gl.enableVertexAttribArray(0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(this.program2d.a_position, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(this.program2d.a_uv, 2, gl.FLOAT, false, 16, 8);

            var gltex;
            if (this.useMirror) {
                gltex = texture.mirror.target;
            } else {
                gltex = texture.createTarget(gl, version, null, targetFace);
            }

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gltex);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (!this.useMirror) {
                texture.deleteTarget(gl, gltex);
            }
        }
    };

    TexturePreviewGenerator.prototype.capture = function (doc) {
        var targetCanvas = doc.createElement("canvas");
        targetCanvas.className = "gli-reset";
        targetCanvas.width = this.canvas.width;
        targetCanvas.height = this.canvas.height;
        try {
            var ctx = targetCanvas.getContext("2d");
            if (doc == this.canvas.ownerDocument) {
                ctx.drawImage(this.canvas, 0, 0);
            } else {
                // Need to extract the data and copy manually, as doc->doc canvas
                // draws aren't supported for some stupid reason
                var srcctx = this.canvas.getContext("2d");
                if (srcctx) {
                    var srcdata = srcctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    ctx.putImageData(srcdata, 0, 0);
                } else {
                    var dataurl = this.canvas.toDataURL();
                    var img = doc.createElement("img");
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = dataurl;
                }
            }
        } catch (e) {
            window.console.log('unable to draw texture preview');
            window.console.log(e);
        }
        return targetCanvas;
    };

    TexturePreviewGenerator.prototype.buildItem = function (w, doc, gl, texture, closeOnClick, useCache) {
        var self = this;

        var el = doc.createElement("div");
        el.className = "texture-picker-item";
        if (texture.status == gli.host.Resource.DEAD) {
            el.className += " texture-picker-item-deleted";
        }

        var previewContainer = doc.createElement("div");
        previewContainer.className = "texture-picker-item-container";
        el.appendChild(previewContainer);

        function updatePreview() {
            var preview = null;
            if (useCache && texture.cachedPreview) {
                // Preview exists - use it
                preview = texture.cachedPreview;
            }
            if (!preview) {
                // Preview does not exist - create it
                // TODO: pick the right version
                var version = texture.currentVersion;
                var targetFace;
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        targetFace = null;
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X; // pick a different face?
                        break;
                }
                var size = texture.guessSize(gl, version, targetFace);
                var desiredWidth = 128;
                var desiredHeight = 128;
                if (size) {
                    if (size[0] > size[1]) {
                        desiredWidth = 128;
                        desiredHeight = 128 / (size[0] / size[1]);
                    } else {
                        desiredHeight = 128;
                        desiredWidth = 128 / (size[1] / size[0]);
                    }
                }
                self.draw(texture, version, targetFace, desiredWidth, desiredHeight);
                preview = self.capture(doc);
                var x = (128 / 2) - (desiredWidth / 2);
                var y = (128 / 2) - (desiredHeight / 2);
                preview.style.marginLeft = x + "px";
                preview.style.marginTop = y + "px";
                if (useCache) {
                    texture.cachedPreview = preview;
                }
            }
            if (preview) {
                // TODO: setup
                preview.className = "";
                if (preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
                previewContainer.innerHTML = "";
                previewContainer.appendChild(preview);
            }
        };

        updatePreview();

        var iconDiv = doc.createElement("div");
        iconDiv.className = "texture-picker-item-icon";
        switch (texture.type) {
            case gl.TEXTURE_2D:
                iconDiv.className += " texture-picker-item-icon-2d";
                break;
            case gl.TEXTURE_CUBE_MAP:
                iconDiv.className += " texture-picker-item-icon-cube";
                break;
        }
        el.appendChild(iconDiv);

        var titleDiv = doc.createElement("div");
        titleDiv.className = "texture-picker-item-title";
        titleDiv.innerHTML = texture.getName();
        el.appendChild(titleDiv);

        el.onclick = function (e) {
            w.context.ui.showTexture(texture);
            if (closeOnClick) {
                w.close(); // TODO: do this?
            }
            e.preventDefault();
            e.stopPropagation();
        };

        texture.modified.addListener(self, function (texture) {
            texture.cachedPreview = null;
            updatePreview();
        });
        texture.deleted.addListener(self, function (texture) {
            el.className += " texture-picker-item-deleted";
        });

        return el;
    };

    ui.TexturePreviewGenerator = TexturePreviewGenerator;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TraceTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-trace-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '                <canvas class="gli-reset surface-inspector-pixel" width="1" height="1"></canvas>' +
        '                <span class="surface-inspector-location"></span>' +
        '            </div>' +
        '        </div>' +
        '        <div class="window-trace-outer">' +
        '            <div class="window-trace">' +
        '                <div class="trace-minibar">' +
        '                    <!-- minibar -->' +
        '                </div>' +
        '                <div class="trace-listing">' +
        '                    <!-- call trace -->' +
        '                </div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- toolbar --></div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.listing = new gli.ui.LeftListing(w, this.el, "frame", function (el, frame) {
            var canvas = document.createElement("canvas");
            canvas.className = "gli-reset frame-item-preview";
            canvas.style.cursor = "pointer";
            canvas.width = 80;
            canvas.height = frame.screenshot.height / frame.screenshot.width * 80;

            // Draw the data - hacky, but easiest?
            var ctx2d = canvas.getContext("2d");
            ctx2d.drawImage(frame.screenshot, 0, 0, canvas.width, canvas.height);

            el.appendChild(canvas);

            var number = document.createElement("div");
            number.className = "frame-item-number";
            number.innerHTML = frame.frameNumber;
            el.appendChild(number);
        });
        this.traceView = new gli.ui.TraceView(w, this.el);

        this.listing.valueSelected.addListener(this, function (frame) {
            this.traceView.setFrame(frame);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
            scrollStates.traceView = this.traceView.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
            this.traceView.setScrollState(scrollStates.traceView);
        });

        var context = w.context;
        for (var n = 0; n < context.frames.length; n++) {
            var frame = context.frames[n];
            this.listing.appendValue(frame);
        }
        if (context.frames.length > 0) {
            this.listing.selectValue(context.frames[context.frames.length - 1]);
        }

        this.layout = function () {
            this.traceView.layout();
        };
    };

    ui.TraceTab = TraceTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TraceMinibar = function (view, w, elementRoot) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            bar: elementRoot.getElementsByClassName("trace-minibar")[0]
        };
        this.buttons = {};
        this.toggles = {};

        this.controller = w.controller;

        this.controller.stepCompleted.addListener(this, function (callIndex) {
            if (callIndex == 0) {
                self.lastCallIndex = null;
            } else {
                self.lastCallIndex = callIndex - 1;
            }
        });

        var buttonHandlers = {};

        function addButton(bar, name, tip, callback) {
            var el = w.document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled trace-minibar-command-" + name;

            el.title = tip;
            el.innerHTML = " ";

            el.onclick = function () {
                if (el.className.indexOf("disabled") != -1) {
                    return;
                }
                callback.apply(self);
            };
            buttonHandlers[name] = callback;

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        addButton(this.elements.bar, "run", "Playback entire frame (F9)", function () {
            this.controller.stepUntilEnd();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-forward", "Step forward one call (F8)", function () {
            if (this.controller.stepForward() == false) {
                this.controller.reset();
                this.controller.openFrame(this.view.frame);
            }
            this.refreshState();
        });
        addButton(this.elements.bar, "step-back", "Step backward one call (F6)", function () {
            this.controller.stepBackward();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-until-draw", "Skip to the next draw call (F7)", function () {
            this.controller.stepUntilDraw();
            this.refreshState();
        });
        /*
        addButton(this.elements.bar, "step-until-error", "Run until an error occurs", function () {
        alert("step-until-error");
        this.controller.stepUntilError();
        this.refreshState();
        });
        */
        addButton(this.elements.bar, "restart", "Restart from the beginning of the frame (F10)", function () {
            this.controller.openFrame(this.view.frame);
            this.refreshState();
        });

        // TODO: move to shared code
        function addToggle(bar, defaultValue, name, tip, callback) {
            var input = w.document.createElement("input");
            input.style.width = "inherit";
            input.style.height = "inherit";

            input.type = "checkbox";
            input.title = tip;
            input.checked = defaultValue;

            input.onchange = function () {
                callback.apply(self, [input.checked]);
            };

            var span = w.document.createElement("span");
            span.innerHTML = "&nbsp;" + name;

            span.onclick = function () {
                input.checked = !input.checked;
                callback.apply(self, [input.checked]);
            };

            var el = w.document.createElement("div");
            el.className = "trace-minibar-toggle";
            el.appendChild(input);
            el.appendChild(span);

            bar.appendChild(el);

            callback.apply(self, [defaultValue]);

            self.toggles[name] = input;
        };

        var traceCallRedundantBackgroundColor = "#FFFFD1";
        var redundantStylesheet = w.document.createElement("style");
        redundantStylesheet.type = "text/css";
        redundantStylesheet.appendChild(w.document.createTextNode(".trace-call-redundant { background-color: " + traceCallRedundantBackgroundColor + "; }"));
        w.document.getElementsByTagName("head")[0].appendChild(redundantStylesheet);
        var stylesheet = null;
        for (var n = 0; n < w.document.styleSheets.length; n++) {
            var ss = w.document.styleSheets[n];
            if (ss.ownerNode == redundantStylesheet) {
                stylesheet = ss;
                break;
            }
        }
        var redundantRule = null;
        // Grabbed on demand in case it hasn't loaded yet

        var defaultShowRedundant = gli.settings.session.showRedundantCalls;
        addToggle(this.elements.bar, defaultShowRedundant, "Redundant Calls", "Display redundant calls in yellow", function (checked) {
            if (!stylesheet) {
                return;
            }
            if (!redundantRule) {
                for (var n = 0; n < stylesheet.cssRules.length; n++) {
                    var rule = stylesheet.cssRules[n];
                    if (rule.selectorText == ".trace-call-redundant") {
                        redundantRule = rule;
                        break;
                    }
                }
            }

            if (checked) {
                redundantRule.style.backgroundColor = traceCallRedundantBackgroundColor;
            } else {
                redundantRule.style.backgroundColor = "transparent";
            }

            gli.settings.session.showRedundantCalls = checked;
            gli.settings.save();
        });

        w.document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 117: // F6
                    buttonHandlers["step-back"].apply(self);
                    handled = true;
                    break;
                case 118: // F7
                    buttonHandlers["step-until-draw"].apply(self);
                    handled = true;
                    break;
                case 119: // F8
                    buttonHandlers["step-forward"].apply(self);
                    handled = true;
                    break;
                case 120: // F9
                    buttonHandlers["run"].apply(self);
                    handled = true;
                    break;
                case 121: // F10
                    buttonHandlers["restart"].apply(self);
                    handled = true;
                    break;
            };

            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);

        //this.update();
    };
    TraceMinibar.prototype.refreshState = function (ignoreScroll) {
        //var newState = new gli.StateCapture(this.replaygl);
        this.view.traceListing.setActiveCall(this.lastCallIndex, ignoreScroll);
        //this.window.stateHUD.showState(newState);
        //this.window.outputHUD.refresh();

        if (this.view.frame) {
            this.view.updateActiveFramebuffer();
        }
    };
    TraceMinibar.prototype.stepUntil = function (callIndex) {
        if (this.controller.callIndex > callIndex) {
            this.controller.reset();
            this.controller.openFrame(this.view.frame, true);
            this.controller.stepUntil(callIndex);
        } else {
            this.controller.stepUntil(callIndex);
        }
        this.refreshState();
    };
    TraceMinibar.prototype.reset = function () {
        this.update();
    };
    TraceMinibar.prototype.update = function () {
        var self = this;

        if (this.view.frame) {
            this.controller.reset();
            this.controller.runFrame(this.view.frame);
            this.controller.openFrame(this.view.frame);
        } else {
            this.controller.reset();
            // TODO: clear canvas
            //console.log("would clear canvas");
        }

        function toggleButton(name, enabled) {
            var el = self.buttons[name];
            if (el) {
                if (enabled) {
                    el.className = el.className.replace("trace-minibar-button-disabled", "trace-minibar-button-enabled");
                } else {
                    el.className = el.className.replace("trace-minibar-button-enabled", "trace-minibar-button-disabled");
                }
            }
        };

        for (var n in this.buttons) {
            toggleButton(n, false);
        }

        toggleButton("run", true);
        toggleButton("step-forward", true);
        toggleButton("step-back", true);
        toggleButton("step-until-error", true);
        toggleButton("step-until-draw", true);
        toggleButton("restart", true);

        this.refreshState();

        //this.window.outputHUD.refresh();
    };

    var TraceView = function (w, elementRoot) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w, elementRoot);
        this.traceListing = new gli.ui.TraceListing(this, w, elementRoot);

        this.inspectorElements = {
            "window-trace-outer": elementRoot.getElementsByClassName("window-trace-outer")[0],
            "window-trace": elementRoot.getElementsByClassName("window-trace")[0],
            "window-trace-inspector": elementRoot.getElementsByClassName("window-trace-inspector")[0],
            "trace-minibar": elementRoot.getElementsByClassName("trace-minibar")[0]
        };
        this.inspector = new gli.ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'traceSplitter',
            title: 'Replay Preview',
            selectionName: 'Buffer',
            selectionValues: null /* set later */
        });
        this.inspector.activeFramebuffers = [];
        this.inspector.querySize = function () {
            if (this.activeFramebuffers) {
                var framebuffer = this.activeFramebuffers[this.optionsList.selectedIndex];
                if (framebuffer) {
                    var gl = this.gl;
                    var originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.mirror.target);
                    var texture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
                    if (texture && texture.trackedObject) {
                        return texture.trackedObject.guessSize(gl);
                    }
                }
            }
            return [context.canvas.width, context.canvas.height];
        };
        this.inspector.reset = function () {
            this.layout();
            if (w.windows.pixelHistory) {
                if (w.windows.pixelHistory.isOpened()) {
                    w.windows.pixelHistory.clear();
                } else {
                    w.windows.pixelHistory.close();
                }
            }
            if (w.windows.drawInfo) {
                if (w.windows.drawInfo.isOpened()) {
                    w.windows.drawInfo.clear();
                } else {
                    w.windows.drawInfo.close();
                }
            }
        };
        this.inspector.inspectPixel = function (x, y, locationString) {
            if (!self.frame) {
                return;
            }
            gli.ui.PopupWindow.show(w.context, gli.ui.PixelHistory, "pixelHistory", function (popup) {
                popup.inspectPixel(self.frame, x, y, locationString);
            });
        };
        this.inspector.setupPreview = function () {
            if (this.previewer) {
                return;
            }
            this.previewer = new ui.TexturePreviewGenerator(this.canvas, true);
            this.gl = this.previewer.gl;
        };
        this.inspector.updatePreview = function () {
            this.layout();

            var gl = this.gl;
            gl.flush();

            // NOTE: index 0 is always null
            var framebuffer = this.activeFramebuffers[this.optionsList.selectedIndex];
            if (!framebuffer) {
                // Default framebuffer - redraw everything up to the current call (required as we've thrown out everything)
                this.canvas.width = context.canvas.width;
                this.canvas.height = context.canvas.height;
            }

            var controller = self.window.controller;
            var callIndex = controller.callIndex;
            controller.reset();
            controller.openFrame(self.frame, true);
            controller.stepUntil(callIndex - 1);

            if (framebuffer) {
                // User framebuffer - draw quad with the contents of the framebuffer
                var originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.mirror.target);
                var texture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
                gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
                if (texture) {
                    texture = texture.trackedObject;
                }
                if (texture) {
                    var size = texture.guessSize(gl);
                    var desiredWidth = 1;
                    var desiredHeight = 1;
                    if (size) {
                        desiredWidth = size[0];
                        desiredHeight = size[1];
                        this.canvas.style.display = "";
                    } else {
                        this.canvas.style.display = "none";
                    }
                    this.previewer.draw(texture, texture.currentVersion, null, desiredWidth, desiredHeight);
                } else {
                    // ?
                    console.log("invalid framebuffer attachment");
                    this.canvas.style.display = "none";
                }
            }
        };
        this.inspector.canvas.style.display = "";

        w.controller.setOutput(this.inspector.canvas);

        // TODO: watch for parent canvas size changes and update
        this.inspector.canvas.width = context.canvas.width;
        this.inspector.canvas.height = context.canvas.height;

        this.frame = null;
    };

    TraceView.prototype.setInspectorWidth = function (newWidth) {
        //.window-trace-outer margin-left: -480px !important; /* -2 * window-inspector.width */
        //.window-trace margin-left: 240px !important;
        //.trace-minibar right: 240px; /* window-trace-inspector */
        //.trace-listing right: 240px; /* window-trace-inspector */
        this.inspectorElements["window-trace-outer"].style.marginLeft = (-2 * newWidth) + "px";
        this.inspectorElements["window-trace"].style.marginLeft = newWidth + "px";
        this.inspectorElements["window-trace-inspector"].style.width = newWidth + "px";
        this.inspectorElements["trace-minibar"].style.right = newWidth + "px";
        this.traceListing.elements.list.style.right = newWidth + "px";
    };

    TraceView.prototype.layout = function () {
        this.inspector.layout();
    };

    TraceView.prototype.reset = function () {
        this.frame = null;

        this.minibar.reset();
        this.traceListing.reset();
        this.inspector.reset();
    };

    TraceView.prototype.setFrame = function (frame) {
        var gl = this.window.context;

        this.reset();
        this.frame = frame;

        // Check for redundancy, if required
        gli.replay.RedundancyChecker.checkFrame(frame);

        // Find interesting calls
        var bindFramebufferCalls = [];
        var errorCalls = [];
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            if (call.name == "bindFramebuffer") {
                bindFramebufferCalls.push(call);
            }
            if (call.error) {
                errorCalls.push(call);
            }
        }

        // Setup support for multiple framebuffers
        var activeFramebuffers = [];
        if (bindFramebufferCalls.length > 0) {
            for (var n = 0; n < bindFramebufferCalls.length; n++) {
                var call = bindFramebufferCalls[n];
                var framebuffer = call.args[1];
                if (framebuffer) {
                    if (activeFramebuffers.indexOf(framebuffer) == -1) {
                        activeFramebuffers.push(framebuffer);
                    }
                }
            }
        }
        if (activeFramebuffers.length) {
            var names = [];
            // Index 0 is always default - push to activeFramebuffers to keep consistent
            activeFramebuffers.unshift(null);
            for (var n = 0; n < activeFramebuffers.length; n++) {
                var framebuffer = activeFramebuffers[n];
                if (framebuffer) {
                    names.push(framebuffer.getName());
                } else {
                    names.push("Default");
                }
            }
            this.inspector.setSelectionValues(names);
            this.inspector.elements.faces.style.display = "";
            this.inspector.optionsList.selectedIndex = 0;
        } else {
            this.inspector.setSelectionValues(null);
            this.inspector.elements.faces.style.display = "none";
        }
        this.inspector.activeOption = 0;
        this.inspector.activeFramebuffers = activeFramebuffers;

        // Print out errors to console
        if (errorCalls.length) {
            console.log(" ");
            console.log("Frame " + frame.frameNumber + " errors:");
            console.log("----------------------");
            for (var n = 0; n < errorCalls.length; n++) {
                var call = errorCalls[n];

                var callString = ui.populateCallString(this.window.context, call);
                var errorString = gli.info.enumToString(call.error);
                console.log(" " + errorString + " <= " + callString);

                // Stack (if present)
                if (call.stack) {
                    for (var m = 0; m < call.stack.length; m++) {
                        console.log("   - " + call.stack[m]);
                    }
                }
            }
            console.log(" ");
        }

        // Run the frame
        this.traceListing.setFrame(frame);
        this.minibar.update();
        this.traceListing.scrollToCall(0);
    };

    TraceView.prototype.guessActiveFramebuffer = function (callIndex) {
        // Can't trust the current state, so walk the calls to try to find a bindFramebuffer call
        for (var n = this.minibar.lastCallIndex - 1; n >= 0; n--) {
            var call = this.frame.calls[n];
            if (call.info.name == "bindFramebuffer") {
                return call.args[1];
                break;
            }
        }
        return null;
    };

    TraceView.prototype.updateActiveFramebuffer = function () {
        var gl = this.window.controller.output.gl;

        var callIndex = this.minibar.lastCallIndex - 1;
        var framebuffer = this.guessActiveFramebuffer(callIndex);

        if (this.inspector.activeFramebuffers.length) {
            for (var n = 0; n < this.inspector.activeFramebuffers.length; n++) {
                if (this.inspector.activeFramebuffers[n] == framebuffer) {
                    // Found in list at index n
                    if (this.inspector.optionsList.selectedIndex != n) {
                        // Differs - update to current
                        this.inspector.optionsList.selectedIndex = n;
                        this.inspector.activeOption = n;
                        this.inspector.updatePreview();
                    } else {
                        // Same - nothing to do
                        this.inspector.updatePreview();
                    }
                    break;
                }
            }
        }
    };

    TraceView.prototype.stepUntil = function (callIndex) {
        this.minibar.stepUntil(callIndex);
    };

    TraceView.prototype.getScrollState = function () {
        return {
            listing: this.traceListing.getScrollState()
        };
    };

    TraceView.prototype.setScrollState = function (state) {
        if (!state) {
            return;
        }
        this.traceListing.setScrollState(state.listing);
    };

    ui.TraceView = TraceView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TraceListing = function (view, w, elementRoot) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            list: elementRoot.getElementsByClassName("trace-listing")[0]
        };

        this.calls = [];

        this.activeCall = null;
    };

    TraceListing.prototype.reset = function () {
        this.activeCall = null;
        this.calls.length = 0;

        // Swap out the element for faster clear
        var oldList = this.elements.list;
        var newList = document.createElement("div");
        newList.className = "trace-listing";
        newList.style.cssText = oldList.style.cssText;
        var parentNode = oldList.parentNode;
        parentNode.replaceChild(newList, oldList);
        this.elements.list = newList;
    };

    function addCall(listing, container, frame, call) {
        var document = listing.window.document;
        var gl = listing.window.context;

        // <div class="trace-call">
        //     <div class="trace-call-icon">
        //         &nbsp;
        //     </div>
        //     <div class="trace-call-line">
        //         hello world
        //     </div>
        //     <div class="trace-call-actions">
        //         ??
        //     </div>
        // </div>

        var el = document.createElement("div");
        el.className = "trace-call";

        var icon = document.createElement("div");
        icon.className = "trace-call-icon";
        el.appendChild(icon);
        
        var ordinal = document.createElement("div");
        ordinal.className = "trace-call-ordinal";
        ordinal.innerHTML = call.ordinal;
        el.appendChild(ordinal);

        // Actions must go before line for floating to work right
        var info = gli.info.functions[call.name];
        if (info.type == gli.FunctionType.DRAW) {
            var actions = document.createElement("div");
            actions.className = "trace-call-actions";

            var infoAction = document.createElement("div");
            infoAction.className = "trace-call-action trace-call-action-info";
            infoAction.title = "View draw information";
            actions.appendChild(infoAction);
            infoAction.onclick = function (e) {
                gli.ui.PopupWindow.show(listing.window.context, gli.ui.DrawInfo, "drawInfo", function (popup) {
                    popup.inspectDrawCall(frame, call);
                });
                e.preventDefault();
                e.stopPropagation();
            };

            var isolateAction = document.createElement("div");
            isolateAction.className = "trace-call-action trace-call-action-isolate";
            isolateAction.title = "Run draw call isolated";
            actions.appendChild(isolateAction);
            isolateAction.onclick = function (e) {
                listing.window.controller.runIsolatedDraw(frame, call);
                //listing.window.controller.runDepthDraw(frame, call);
                listing.view.minibar.refreshState(true);
                e.preventDefault();
                e.stopPropagation();
            };

            el.appendChild(actions);
        }

        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(listing.window, call, line);
        el.appendChild(line);

        if (call.isRedundant) {
            el.className += " trace-call-redundant";
        }
        if (call.error) {
            el.className += " trace-call-error";

            var errorString = gli.info.enumToString(call.error);
            var extraInfo = document.createElement("div");
            extraInfo.className = "trace-call-extra";
            var errorName = document.createElement("span");
            errorName.innerHTML = errorString;
            extraInfo.appendChild(errorName);
            el.appendChild(extraInfo);

            // If there is a stack, add to tooltip
            if (call.stack) {
                var line0 = call.stack[0];
                extraInfo.title = line0;
            }
        }

        container.appendChild(el);

        var index = listing.calls.length;
        el.onclick = function () {
            listing.view.minibar.stepUntil(index);
        };

        listing.calls.push({
            call: call,
            element: el,
            icon: icon
        });
    };

    TraceListing.prototype.setFrame = function (frame) {
        this.reset();

        var container = document.createDocumentFragment();

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            addCall(this, container, frame, call);
        }

        this.elements.list.appendChild(container);

        this.elements.list.scrollTop = 0;
    };

    TraceListing.prototype.setActiveCall = function (callIndex, ignoreScroll) {
        if (this.activeCall == callIndex) {
            return;
        }

        if (this.activeCall != null) {
            // Clean up previous changes
            var oldel = this.calls[this.activeCall].element;
            oldel.className = oldel.className.replace("trace-call-highlighted", "");
            var oldicon = this.calls[this.activeCall].icon;
            oldicon.className = oldicon.className.replace("trace-call-icon-active", "");
        }

        this.activeCall = callIndex;

        if (callIndex === null) {
            if (!ignoreScroll) {
                this.scrollToCall(0);
            }
        } else {
            var el = this.calls[callIndex].element;
            el.className += " trace-call-highlighted";
            var icon = this.calls[callIndex].icon;
            icon.className += " trace-call-icon-active";

            if (!ignoreScroll) {
                this.scrollToCall(callIndex);
            }
        }
    };

    TraceListing.prototype.scrollToCall = function (callIndex) {
        var el = this.calls[callIndex].icon;
        scrollIntoViewIfNeeded(el);
    };

    TraceListing.prototype.getScrollState = function () {
        return {
            list: this.elements.list.scrollTop
        };
    };

    TraceListing.prototype.setScrollState = function (state) {
        this.elements.list.scrollTop = state.list;
    };

    ui.TraceListing = TraceListing;

})();
(function () {
    var ui = glinamespace("gli.ui");

    var TimelineTab = function (w) {
        this.el.innerHTML =
            '<div class="window-right-outer">' +
            '    <div class="window-right">' +
            '        <canvas class="gli-reset timeline-canvas"></canvas>' +
            '    </div>' +
            '    <div class="window-left">' +
            '    </div>' +
            '</div>';

        this.timelineView = new gli.ui.TimelineView(w, this.el);

        this.lostFocus.addListener(this, function () {
            this.timelineView.suspendUpdating();
        });
        this.gainedFocus.addListener(this, function () {
            this.timelineView.resumeUpdating();
        });
    };

    ui.TimelineTab = TimelineTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TimelineView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-outer")[0],
            left: elementRoot.getElementsByClassName("window-left")[0],
            right: elementRoot.getElementsByClassName("window-right")[0]
        };

        var statistics = this.window.context.statistics;

        this.displayCanvas = elementRoot.getElementsByClassName("timeline-canvas")[0];

        if (gli.settings.session.enableTimeline) {
            this.displayCanvas.width = 800;
            this.displayCanvas.height = 200;

            this.elements.left.style.overflow = "auto";

            this.canvases = [];
            for (var n = 0; n < 2; n++) {
                var canvas = document.createElement("canvas");
                canvas.className = "gli-reset";
                canvas.width = 800;
                canvas.height = 200;
                this.canvases.push(canvas);
            }
            this.activeCanvasIndex = 0;

            // Load enabled status
            var counterToggles = gli.settings.session.counterToggles;
            if (counterToggles) {
                for (var n = 0; n < statistics.counters.length; n++) {
                    var counter = statistics.counters[n];
                    var toggle = counterToggles[counter.name];
                    if (toggle === true) {
                        counter.enabled = true;
                    } else if (toggle === false) {
                        counter.enabled = false;
                    } else {
                        // Default
                    }
                }
            }

            function appendKeyRow(keyRoot, counter) {
                var row = document.createElement("div");
                row.className = "timeline-key-row";
                if (counter.enabled) {
                    row.className += " timeline-key-row-enabled";
                }

                var colorEl = document.createElement("div");
                colorEl.className = "timeline-key-color";
                colorEl.style.backgroundColor = counter.color;
                row.appendChild(colorEl);

                var nameEl = document.createElement("div");
                nameEl.className = "timeline-key-name";
                nameEl.innerHTML = counter.description;
                row.appendChild(nameEl);

                keyRoot.appendChild(row);

                row.onclick = function () {
                    counter.enabled = !counter.enabled;
                    if (!counter.enabled) {
                        row.className = row.className.replace(" timeline-key-row-enabled", "");
                    } else {
                        row.className += " timeline-key-row-enabled";
                    }

                    gli.settings.session.counterToggles[counter.name] = counter.enabled;
                    gli.settings.save();
                };
            };

            var keyRoot = document.createElement("div");
            keyRoot.className = "timeline-key";
            for (var n = 0; n < statistics.counters.length; n++) {
                var counter = statistics.counters[n];
                appendKeyRow(keyRoot, counter);
            }
            this.elements.left.appendChild(keyRoot);

            // Install a frame watcher
            this.updating = false;
            var updateCount = 0;
            this.window.context.frameCompleted.addListener(this, function () {
                // TODO: hold updates for a bit? Could affect perf to do this every frame
                updateCount++;
                if (updateCount % 2 == 0) {
                    // Only update every other frame
                    self.appendFrame();
                }
            });
        } else {
            // Hide canvas
            this.displayCanvas.style.display = "none";
        }

        // Show help message
        var enableMessage = document.createElement("a");
        enableMessage.className = "timeline-enable-link";
        if (gli.settings.session.enableTimeline) {
            enableMessage.innerHTML = "Timeline enabled - click to disable";
        } else {
            enableMessage.innerHTML = "Timeline disabled - click to enable";
        }
        enableMessage.onclick = function (e) {
            gli.settings.session.enableTimeline = !gli.settings.session.enableTimeline;
            gli.settings.save();
            window.location.reload();
            e.preventDefault();
            e.stopPropagation();
        };
        this.elements.right.insertBefore(enableMessage, this.elements.right.firstChild);
    };

    TimelineView.prototype.suspendUpdating = function () {
        this.updating = false;
    };

    TimelineView.prototype.resumeUpdating = function () {
        this.updating = true;
    };

    TimelineView.prototype.appendFrame = function () {
        var statistics = this.window.context.statistics;

        var canvas = this.canvases[this.activeCanvasIndex];
        this.activeCanvasIndex = (this.activeCanvasIndex + 1) % this.canvases.length;
        var oldCanvas = this.canvases[this.activeCanvasIndex];

        var ctx = canvas.getContext("2d");

        // Draw old
        ctx.drawImage(oldCanvas, -1, 0);

        // Clear newly revealed line
        var x = canvas.width - 1;
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(x - 1, 0, 2, canvas.height);

        // Draw counter values
        for (var n = 0; n < statistics.counters.length; n++) {
            var counter = statistics.counters[n];
            if (!counter.enabled) {
                continue;
            }
            var v = Math.round(counter.value);
            var pv = Math.round(counter.previousValue);
            var y = canvas.height - v;
            var py = canvas.height - pv;
            ctx.beginPath();
            ctx.moveTo(x - 1, py + 0.5);
            ctx.lineTo(x, y + 0.5);
            ctx.strokeStyle = counter.color;
            ctx.stroke();
        }

        // Only do the final composite if we have focus
        if (this.updating) {
            var displayCtx = this.displayCanvas.getContext("2d");
            displayCtx.drawImage(canvas, 0, 0);
        }
    };

    TimelineView.prototype.refresh = function () {
        // 
    };

    ui.TimelineView = TimelineView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var StateTab = function (w) {
        this.el.innerHTML =
            '<div class="window-whole-outer">' +
            '    <div class="window-whole">' +
            '       <div class="window-whole-inner">' +
            '           <!-- scrolling contents -->' +
            '       </div>' +
            '    </div>' +
            '</div>';

        this.stateView = new gli.ui.StateView(w, this.el);

        this.stateView.setState();

        this.refresh = function () {
            this.stateView.setState();
        };
    };

    ui.StateTab = StateTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var StateView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
        };
    };

    function generateStateDisplay(w, el, state) {
        var gl = w.context;

        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = "State Snapshot";
        el.appendChild(titleDiv);

        var table = document.createElement("table");
        table.className = "info-parameters";

        var stateParameters = gli.info.stateParameters;
        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            gli.ui.appendStateParameterRow(w, gl, table, state, param);
        }

        el.appendChild(table);
    };

    StateView.prototype.setState = function () {
        var rawgl = this.window.context.rawgl;
        var state = null;
        switch (this.window.activeVersion) {
            case null:
                state = new gli.host.StateSnapshot(rawgl);
                break;
            case "current":
                state = this.window.controller.getCurrentState();
                break;
        }

        this.elements.view.innerHTML = "";
        if (state) {
            generateStateDisplay(this.window, this.elements.view, state);
        }

        this.elements.view.scrollTop = 0;
    };

    ui.StateView = StateView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TexturesTab = function (w) {
        var html =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-texture-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '                <canvas class="gli-reset surface-inspector-pixel" width="1" height="1"></canvas>' +
        '                <span class="surface-inspector-location"></span>' +
        '            </div>' +
        '        </div>' +
        '        <div class="window-texture-outer">' +
        '            <div class="texture-listing">' +
        '                <!-- call trace -->' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- buttons --></div>' +
        '    </div>' +
        '</div>';
        this.el.innerHTML = html;

        this.listing = new gli.ui.LeftListing(w, this.el, "texture", function (el, texture) {
            var gl = w.context;

            if (texture.status == gli.host.Resource.DEAD) {
                el.className += " texture-item-deleted";
            }

            switch (texture.type) {
                case gl.TEXTURE_2D:
                    el.className += " texture-item-2d";
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    el.className += " texture-item-cube";
                    break;
            }

            var number = document.createElement("div");
            number.className = "texture-item-number";
            number.innerHTML = texture.getName();
            el.appendChild(number);

            var row = document.createElement("div");
            row.className = "texture-item-row";

            function updateSize() {
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        var guessedSize = texture.guessSize(gl);
                        if (guessedSize) {
                            row.innerHTML = guessedSize[0] + " x " + guessedSize[1];
                        } else {
                            row.innerHTML = "? x ?";
                        }
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        break;
                }
            };
            updateSize();

            if (row.innerHTML != "") {
                el.appendChild(row);
            }

            texture.modified.addListener(this, function (texture) {
                number.innerHTML = texture.getName();
                updateSize();
                // TODO: refresh view if selected
            });
            texture.deleted.addListener(this, function (texture) {
                el.className += " texture-item-deleted";
            });
        });

        this.listing.addButton("Browse All").addListener(this, function () {
            gli.ui.PopupWindow.show(w.context, gli.ui.TexturePicker, "texturePicker", function (popup) {
            });
        });

        this.textureView = new gli.ui.TextureView(w, this.el);

        this.listing.valueSelected.addListener(this, function (texture) {
            this.textureView.setTexture(texture);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append textures already present
        var context = w.context;
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            this.listing.appendValue(texture);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLTexture") {
                this.listing.appendValue(resource);
            }
        });

        this.layout = function () {
            this.textureView.layout();
        };

        this.refresh = function () {
            this.textureView.setTexture(this.textureView.currentTexture);
        };
    };

    ui.TexturesTab = TexturesTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TextureView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("texture-listing")[0]
        };

        this.inspectorElements = {
            "window-texture-outer": elementRoot.getElementsByClassName("window-texture-outer")[0],
            "window-texture-inspector": elementRoot.getElementsByClassName("window-texture-inspector")[0],
            "texture-listing": elementRoot.getElementsByClassName("texture-listing")[0]
        };
        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'textureSplitter',
            title: 'Texture Preview',
            selectionName: 'Face',
            selectionValues: ["POSITIVE_X", "NEGATIVE_X", "POSITIVE_Y", "NEGATIVE_Y", "POSITIVE_Z", "NEGATIVE_Z"]
        });
        this.inspector.currentTexture = null;
        this.inspector.currentVersion = null;
        this.inspector.getTargetFace = function (gl) {
            var targetFace;
            switch (this.currentTexture.type) {
                case gl.TEXTURE_2D:
                    targetFace = null;
                    break;
                case gl.TEXTURE_CUBE_MAP:
                    targetFace = gl.TEXTURE_CUBE_MAP_POSITIVE_X + this.activeOption;
                    break;
            }
            return targetFace;
        };
        this.inspector.querySize = function () {
            var gl = this.gl;
            if (!this.currentTexture || !this.currentVersion) {
                return null;
            }
            var targetFace = this.getTargetFace(gl);
            return this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
        };
        this.inspector.setupPreview = function () {
            if (this.previewer) {
                return;
            }
            this.previewer = new ui.TexturePreviewGenerator(this.canvas, false);
            this.gl = this.previewer.gl;
        };
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            var targetFace = this.getTargetFace(gl);
            var size = this.currentTexture.guessSize(gl, this.currentVersion, targetFace);
            var desiredWidth = 1;
            var desiredHeight = 1;
            if (size) {
                desiredWidth = size[0];
                desiredHeight = size[1];
                this.canvas.style.display = "";
            } else {
                this.canvas.style.display = "none";
            }

            this.previewer.draw(this.currentTexture, this.currentVersion, targetFace, desiredWidth, desiredHeight);
        };
        this.inspector.setTexture = function (texture, version) {
            var gl = this.window.context;

            if (texture) {
                this.options.title = "Texture Preview: " + texture.getName();
            } else {
                this.options.title = "Texture Preview: (none)";
            }

            this.currentTexture = texture;
            this.currentVersion = version;
            this.activeOption = 0;
            this.optionsList.selectedIndex = 0;

            if (texture) {
                // Setup UI
                switch (texture.type) {
                    case gl.TEXTURE_2D:
                        this.elements.faces.style.display = "none";
                        break;
                    case gl.TEXTURE_CUBE_MAP:
                        this.elements.faces.style.display = "";
                        break;
                }
                this.updatePreview();
            } else {
                // Clear everything
                this.elements.faces.style.display = "none";
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.canvas.style.display = "none";
            }

            this.reset();
            this.layout();
        };

        this.currentTexture = null;
    };

    TextureView.prototype.setInspectorWidth = function (newWidth) {
        //.window-texture-outer margin-left: -800px !important; /* -2 * window-texture-inspector.width */
        //.window-texture margin-left: 400px !important; /* window-texture-inspector.width */
        //.texture-listing right: 400px; /* window-texture-inspector */
        this.inspectorElements["window-texture-outer"].style.marginLeft = (-2 * newWidth) + "px";
        this.inspectorElements["window-texture-inspector"].style.width = newWidth + "px";
        this.inspectorElements["texture-listing"].style.right = newWidth + "px";
    };

    TextureView.prototype.layout = function () {
        this.inspector.layout();
    };

    function createImageDataFromPixels(gl, pixelStoreState, width, height, format, type, source) {
        var canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(width, height);
        
        // TODO: support all pixel store state
        //UNPACK_ALIGNMENT
        //UNPACK_COLORSPACE_CONVERSION_WEBGL
        //UNPACK_FLIP_Y_WEBGL
        //UNPACK_PREMULTIPLY_ALPHA_WEBGL
        var unpackAlignment = pixelStoreState["UNPACK_ALIGNMENT"];
        if (unpackAlignment === undefined) {
            unpackAlignment = 4;
        }
        if (pixelStoreState["UNPACK_COLORSPACE_CONVERSION_WEBGL"] !== gl.BROWSER_DEFAULT_WEBGL) {
            console.log("unsupported: UNPACK_COLORSPACE_CONVERSION_WEBGL != BROWSER_DEFAULT_WEBGL");
        }
        if (pixelStoreState["UNPACK_FLIP_Y_WEBGL"]) {
            console.log("unsupported: UNPACK_FLIP_Y_WEBGL = true");
        }
        if (pixelStoreState["UNPACK_PREMULTIPLY_ALPHA_WEBGL"]) {
            console.log("unsupported: UNPACK_PREMULTIPLY_ALPHA_WEBGL = true");
        }
        
        // TODO: implement all texture formats
        var sn = 0;
        var dn = 0;
        switch (type) {
            case gl.UNSIGNED_BYTE:
                switch (format) {
                    case gl.ALPHA:
                        var strideDiff = width % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 1, dn += 4) {
                                imageData.data[dn + 0] = 0;
                                imageData.data[dn + 1] = 0;
                                imageData.data[dn + 2] = 0;
                                imageData.data[dn + 3] = source[sn];
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGB:
                        var strideDiff = (width * 3) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 3, dn += 4) {
                                imageData.data[dn + 0] = source[sn + 0];
                                imageData.data[dn + 1] = source[sn + 1];
                                imageData.data[dn + 2] = source[sn + 2];
                                imageData.data[dn + 3] = 255;
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGBA:
                        var strideDiff = (width * 4) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 4, dn += 4) {
                                imageData.data[dn + 0] = source[sn + 0];
                                imageData.data[dn + 1] = source[sn + 1];
                                imageData.data[dn + 2] = source[sn + 2];
                                imageData.data[dn + 3] = source[sn + 3];
                            }
                            sn += strideDiff;
                        }
                        break;
                    default:
                        console.log("unsupported texture format");
                        return null;
                }
                break;
            case gl.UNSIGNED_SHORT_5_6_5:
                console.log("todo: UNSIGNED_SHORT_5_6_5");
                return null;
            case gl.UNSIGNED_SHORT_4_4_4_4:
                console.log("todo: UNSIGNED_SHORT_4_4_4_4");
                return null;
            case gl.UNSIGNED_SHORT_5_5_5_1:
                console.log("todo: UNSIGNED_SHORT_5_5_5_1");
                return null;
            case gl.FLOAT:
                switch (format) {
                    case gl.ALPHA:
                        var strideDiff = width % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 1, dn += 4) {
                                imageData.data[dn + 0] = 0;
                                imageData.data[dn + 1] = 0;
                                imageData.data[dn + 2] = 0;
                                imageData.data[dn + 3] = Math.floor(source[sn] * 255.0);
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGB:
                        var strideDiff = (width * 3) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 3, dn += 4) {
                                imageData.data[dn + 0] = Math.floor(source[sn + 0] * 255.0);
                                imageData.data[dn + 1] = Math.floor(source[sn + 1] * 255.0);
                                imageData.data[dn + 2] = Math.floor(source[sn + 2] * 255.0);
                                imageData.data[dn + 3] = 255;
                            }
                            sn += strideDiff;
                        }
                        break;
                    case gl.RGBA:
                        var strideDiff = (width * 4) % unpackAlignment;
                        for (var y = 0; y < height; y++) {
                            for (var x = 0; x < width; x++, sn += 4, dn += 4) {
                                imageData.data[dn + 0] = Math.floor(source[sn + 0] * 255.0);
                                imageData.data[dn + 1] = Math.floor(source[sn + 1] * 255.0);
                                imageData.data[dn + 2] = Math.floor(source[sn + 2] * 255.0);
                                imageData.data[dn + 3] = Math.floor(source[sn + 3] * 255.0);
                            }
                            sn += strideDiff;
                        }
                        break;
                    default:
                        console.log("unsupported texture format");
                        return null;
                }
                break;
            default:
                console.log("unsupported texture type");
                return null;
        }

        return imageData;
    };

    function appendHistoryLine(gl, el, texture, version, call) {
        if (call.name == "pixelStorei") {
            // Don't care about these for now - maybe they will be useful in the future
            return;
        }

        gli.ui.appendHistoryLine(gl, el, call);

        if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
            // Gather up pixel store state between this call and the previous one
            var pixelStoreState = {};
            for (var i = version.calls.indexOf(call) - 1; i >= 0; i--) {
                var prev = version.calls[i];
                if ((prev.name == "texImage2D") || (prev.name == "texSubImage2D")) {
                    break;
                }
                var pname = gli.info.enumMap[prev.args[0]];
                pixelStoreState[pname] = prev.args[1];
            }
            
            // TODO: display src of last arg (either data, img, video, etc)
            var sourceArg = null;
            for (var n = 0; n < call.args.length; n++) {
                var arg = call.args[n];
                if (arg) {
                    if ((arg instanceof HTMLCanvasElement) ||
                        (arg instanceof HTMLImageElement) ||
                        (arg instanceof HTMLVideoElement)) {
                        sourceArg = gli.util.clone(arg);
                    } else if (glitypename(arg) == "ImageData") {
                        sourceArg = arg;
                    } else if (arg.length) {
                        // Likely an array of some kind
                        sourceArg = arg;
                    }
                }
            }

            // Fixup arrays by converting to ImageData
            if (sourceArg && sourceArg.length) {
                var width;
                var height;
                var format;
                var type;
                if (call.name == "texImage2D") {
                    width = call.args[3];
                    height = call.args[4];
                    format = call.args[6];
                    type = call.args[7];
                } else {
                    width = call.args[4];
                    height = call.args[5];
                    format = call.args[6];
                    type = call.args[7];
                }
                sourceArg = createImageDataFromPixels(gl, pixelStoreState, width, height, format, type, sourceArg);
            }

            // Fixup ImageData
            if (sourceArg && glitypename(sourceArg) == "ImageData") {
                // Draw into a canvas
                var canvas = document.createElement("canvas");
                canvas.className = "gli-reset";
                canvas.width = sourceArg.width;
                canvas.height = sourceArg.height;
                var ctx = canvas.getContext("2d");
                ctx.putImageData(sourceArg, 0, 0);
                sourceArg = canvas;
            }

            if (sourceArg) {
                var dupeEl = sourceArg;
                
                // Grab the size before we muck with the element
                var size = [dupeEl.width, dupeEl.height];
                
                dupeEl.style.width = "100%";
                dupeEl.style.height = "100%";

                if (dupeEl.src) {
                    var srcEl = document.createElement("div");
                    srcEl.className = "texture-history-src";
                    srcEl.innerHTML = "Source: ";
                    var srcLinkEl = document.createElement("span");
                    srcLinkEl.className = "texture-history-src-link";
                    srcLinkEl.target = "_blank";
                    srcLinkEl.href = dupeEl.src;
                    srcLinkEl.innerHTML = dupeEl.src;
                    srcEl.appendChild(srcLinkEl);
                    el.appendChild(srcEl);
                }

                var dupeRoot = document.createElement("div");
                dupeRoot.className = "texture-history-dupe";
                dupeRoot.appendChild(dupeEl);
                el.appendChild(dupeRoot);

                // Resize on click logic
                var parentWidth = 512; // TODO: pull from parent?
                var parentHeight = Math.min(size[1], 128);
                var parentar = parentHeight / parentWidth;
                var ar = size[1] / size[0];

                var width;
                var height;
                if (ar * parentWidth < parentHeight) {
                    width = parentWidth;
                    height = (ar * parentWidth);
                } else {
                    height = parentHeight;
                    width = (parentHeight / ar);
                }
                dupeRoot.style.width = width + "px";
                dupeRoot.style.height = height + "px";

                var sizedToFit = true;
                dupeRoot.onclick = function (e) {
                    sizedToFit = !sizedToFit;
                    if (sizedToFit) {
                        dupeRoot.style.width = width + "px";
                        dupeRoot.style.height = height + "px";
                    } else {
                        dupeRoot.style.width = size[0] + "px";
                        dupeRoot.style.height = size[1] + "px";
                    }
                    e.preventDefault();
                    e.stopPropagation();
                };
            }
        }
    };

    function generateTextureHistory(gl, el, texture, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "History";
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "texture-history";
        el.appendChild(rootEl);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            appendHistoryLine(gl, rootEl, texture, version, call);
        }
    };

    function generateTextureDisplay(gl, el, texture, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = texture.getName();
        el.appendChild(titleDiv);

        var repeatEnums = ["REPEAT", "CLAMP_TO_EDGE", "MIRROR_REPEAT"];
        var filterEnums = ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR"];
        gli.ui.appendParameters(gl, el, texture, ["TEXTURE_WRAP_S", "TEXTURE_WRAP_T", "TEXTURE_MIN_FILTER", "TEXTURE_MAG_FILTER"], [repeatEnums, repeatEnums, filterEnums, filterEnums]);
        gli.ui.appendbr(el);

        gli.ui.appendSeparator(el);

        generateTextureHistory(gl, el, texture, version);
        gli.ui.appendbr(el);

        var frame = gl.ui.controller.currentFrame;
        if (frame) {
            gli.ui.appendSeparator(el);
            gli.ui.generateUsageList(gl, el, frame, texture);
            gli.ui.appendbr(el);
        }
    };

    TextureView.prototype.setTexture = function (texture) {
        this.currentTexture = texture;

        var version = null;
        if (texture) {
            switch (this.window.activeVersion) {
                case null:
                    version = texture.currentVersion;
                    break;
                case "current":
                    var frame = this.window.controller.currentFrame;
                    if (frame) {
                        version = frame.findResourceVersion(texture);
                    }
                    version = version || texture.currentVersion; // Fallback to live
                    break;
            }
        }

        this.elements.listing.innerHTML = "";
        if (texture) {
            generateTextureDisplay(this.window.context, this.elements.listing, texture, version);
        }

        this.inspector.setTexture(texture, version);

        this.elements.listing.scrollTop = 0;
    };

    ui.TextureView = TextureView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var TexturePicker = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Texture Browser", 610, 600]);
    };

    TexturePicker.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var doc = this.browserWindow.document;
        var gl = context;

        this.previewer = new gli.ui.TexturePreviewGenerator();
        
        // Append textures already present
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            var el = this.previewer.buildItem(this, doc, gl, texture, true, true);
            this.elements.innerDiv.appendChild(el);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, this.resourceRegistered);
    };
    
    TexturePicker.prototype.dispose = function () {
        this.context.resources.resourceRegistered.removeListener(this);
    };
    
    TexturePicker.prototype.resourceRegistered = function (resource) {
        var doc = this.browserWindow.document;
        var gl = this.context;
        if (glitypename(resource.target) == "WebGLTexture") {
            var el = this.previewer.buildItem(this, doc, gl, resource, true);
            this.elements.innerDiv.appendChild(el);
        }
    };

    ui.TexturePicker = TexturePicker;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var BuffersTab = function (w) {
        this.el.innerHTML =
        '<div class="window-right-outer">' +
        '    <div class="window-right">' +
        '        <div class="window-inspector window-buffer-inspector">' +
        '            <div class="surface-inspector-toolbar">' +
        '                <!-- toolbar -->' +
        '            </div>' +
        '            <div class="surface-inspector-inner">' +
        '                <!-- inspector -->' +
        '            </div>' +
        '            <div class="surface-inspector-statusbar">' +
        '            </div>' +
        '        </div>' +
        '        <div class="window-buffer-outer">' +
        '            <div class="buffer-listing">' +
        '                <!-- scrolling contents -->' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '    <div class="window-left">' +
        '        <div class="window-left-listing">' +
        '            <!-- frame list -->' +
        '        </div>' +
        '        <div class="window-left-toolbar">' +
        '            <!-- buttons --></div>' +
        '    </div>' +
        '</div>';

        this.listing = new gli.ui.LeftListing(w, this.el, "buffer", function (el, buffer) {
            var gl = w.context;

            if (buffer.status == gli.host.Resource.DEAD) {
                el.className += " buffer-item-deleted";
            }

            switch (buffer.type) {
                case gl.ARRAY_BUFFER:
                    el.className += " buffer-item-array";
                    break;
                case gl.ELEMENT_ARRAY_BUFFER:
                    el.className += " buffer-item-element-array";
                    break;
            }

            var number = document.createElement("div");
            number.className = "buffer-item-number";
            number.innerHTML = buffer.getName();
            el.appendChild(number);

            buffer.modified.addListener(this, function (buffer) {
                // TODO: refresh view if selected
                //console.log("refresh buffer row");

                // Type may have changed - update it
                el.className = el.className.replace(" buffer-item-array", "").replace(" buffer-item-element-array", "");
                switch (buffer.type) {
                    case gl.ARRAY_BUFFER:
                        el.className += " buffer-item-array";
                        break;
                    case gl.ELEMENT_ARRAY_BUFFER:
                        el.className += " buffer-item-element-array";
                        break;
                }
            });
            buffer.deleted.addListener(this, function (buffer) {
                el.className += " buffer-item-deleted";
            });
        });
        this.bufferView = new gli.ui.BufferView(w, this.el);

        this.listing.valueSelected.addListener(this, function (buffer) {
            this.bufferView.setBuffer(buffer);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append buffers already present
        var context = w.context;
        var buffers = context.resources.getBuffers();
        for (var n = 0; n < buffers.length; n++) {
            var buffer = buffers[n];
            this.listing.appendValue(buffer);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLBuffer") {
                this.listing.appendValue(resource);
            }
        });

        // When we lose focus, reselect the buffer - shouldn't mess with things too much, and also keeps the DOM small if the user had expanded things
        this.lostFocus.addListener(this, function () {
            if (this.listing.previousSelection) {
                this.listing.selectValue(this.listing.previousSelection.value);
            }
        });

        this.layout = function () {
            this.bufferView.layout();
        };

        this.refresh = function () {
            this.bufferView.setBuffer(this.bufferView.currentBuffer);
        };
    };

    ui.BuffersTab = BuffersTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    function shouldShowPreview(gl, buffer, version) {
        return !!buffer && (buffer.type == gl.ARRAY_BUFFER) && !!version.structure && !!version.lastDrawState;
    }

    var BufferView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right")[0],
            listing: elementRoot.getElementsByClassName("buffer-listing")[0]
        };

        this.inspectorElements = {
            "window-buffer-outer": elementRoot.getElementsByClassName("window-buffer-outer")[0],
            "window-buffer-inspector": elementRoot.getElementsByClassName("window-buffer-inspector")[0],
            "buffer-listing": elementRoot.getElementsByClassName("buffer-listing")[0]
        };
        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'bufferSplitter',
            title: 'Buffer Preview',
            selectionName: null,
            selectionValues: null,
            disableSizing: true,
            transparentCanvas: true,
            autoFit: true
        });
        this.inspector.currentBuffer = null;
        this.inspector.currentVersion = null;
        this.inspector.querySize = function () {
            var gl = this.gl;
            if (!this.currentBuffer || !this.currentVersion) {
                return null;
            }
            return [256, 256]; // ?
        };
        this.inspector.setupPreview = function () {
            var self = this;
            if (this.previewer) {
                return;
            }

            this.previewer = new ui.BufferPreview(this.canvas);
            this.gl = this.previewer.gl;

            this.canvas.width = 256;
            this.canvas.height = 256;

            this.previewer.setupDefaultInput();
        }
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            this.previewer.draw();
        };
        this.inspector.setBuffer = function (buffer, version) {
            var gl = this.gl;

            var showPreview = shouldShowPreview(gl, buffer, version);
            if (showPreview) {
                // Setup UI
                this.canvas.width = 256;
                this.canvas.height = 256;
                this.canvas.style.display = "";
                this.updatePreview();
            } else {
                // Clear everything
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.canvas.style.display = "none";
            }

            if (showPreview) {
                this.options.title = "Buffer Preview: " + buffer.getName();
            } else {
                this.options.title = "Buffer Preview: (none)";
            }

            this.currentBuffer = buffer;
            this.currentVersion = version;
            this.activeOption = 0;
            this.optionsList.selectedIndex = 0;

            this.reset();
            this.layout();

            if (showPreview) {
                this.previewer.setBuffer(buffer.previewOptions);
            }
        };

        this.currentBuffer = null;
    };

    BufferView.prototype.setInspectorWidth = function (newWidth) {
        //.window-buffer-outer margin-left: -800px !important; /* -2 * window-buffer-inspector.width */
        //.window-buffer margin-left: 400px !important; /* window-buffer-inspector.width */
        //.buffer-listing right: 400px; /* window-buffer-inspector */
        this.inspectorElements["window-buffer-outer"].style.marginLeft = (-2 * newWidth) + "px";
        this.inspectorElements["window-buffer-inspector"].style.width = newWidth + "px";
        this.inspectorElements["buffer-listing"].style.right = newWidth + "px";
    };

    BufferView.prototype.layout = function () {
        this.inspector.layout();
    };

    function appendHistoryLine(gl, el, buffer, call) {
        gli.ui.appendHistoryLine(gl, el, call);

        // TODO: other custom stuff?
    }

    function generateBufferHistory(gl, el, buffer, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = "History";
        el.appendChild(titleDiv);

        var rootEl = document.createElement("div");
        rootEl.className = "buffer-history";
        el.appendChild(rootEl);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            appendHistoryLine(gl, rootEl, buffer, call);
        }
    };

    function generateGenericArrayBufferContents(gl, el, buffer, version) {
        var data = buffer.constructVersion(gl, version);

        var table = document.createElement("table");
        table.className = "buffer-data";
        for (var n = 0; n < data.length; n++) {
            var tr = document.createElement("tr");
            var tdkey = document.createElement("td");
            tdkey.className = "buffer-data-key";
            tdkey.innerHTML = n;
            tr.appendChild(tdkey);
            var tdvalue = document.createElement("td");
            tdvalue.className = "buffer-data-value";
            tdvalue.innerHTML = data[n];
            tr.appendChild(tdvalue);
            table.appendChild(tr);
        }
        el.appendChild(table);
    };

    function generateArrayBufferContents(gl, el, buffer, version) {
        if (!version.structure) {
            generateGenericArrayBufferContents(gl, el, buffer, version);
            return;
        }

        var data = buffer.constructVersion(gl, version);
        var datas = version.structure;
        var stride = datas[0].stride;
        if (stride == 0) {
            // Calculate stride from last byte
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                switch (datas[m].type) {
                    case gl.BYTE:
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        break;
                    case gl.SHORT:
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        break;
                }
                stride = Math.max(stride, datas[m].offset + byteAdvance);
            }
        }

        var table = document.createElement("table");
        table.className = "buffer-data";
        var byteOffset = 0;
        var itemOffset = 0;
        while (byteOffset < data.byteLength) {
            var tr = document.createElement("tr");

            var tdkey = document.createElement("td");
            tdkey.className = "buffer-data-key";
            tdkey.innerHTML = itemOffset;
            tr.appendChild(tdkey);

            var innerOffset = byteOffset;
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                var readView = null;
                var dataBuffer = data.buffer ? data.buffer : data;
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Int8Array(dataBuffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Uint8Array(dataBuffer, innerOffset, datas[m].size);
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Int16Array(dataBuffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Uint16Array(dataBuffer, innerOffset, datas[m].size);
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        readView = new Float32Array(dataBuffer, innerOffset, datas[m].size);
                        break;
                }
                innerOffset += byteAdvance;

                for (var i = 0; i < datas[m].size; i++) {
                    var td = document.createElement("td");
                    td.className = "buffer-data-value";
                    if ((m != datas.length - 1) && (i == datas[m].size - 1)) {
                        td.className += " buffer-data-value-end";
                    }
                    td.innerHTML = readView[i];
                    tr.appendChild(td);
                }
            }

            byteOffset += stride;
            itemOffset++;
            table.appendChild(tr);
        }
        el.appendChild(table);
    };

    function generateBufferDisplay(view, gl, el, buffer, version) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = buffer.getName();
        switch (buffer.type) {
            case gl.ARRAY_BUFFER:
                titleDiv.innerHTML += " / ARRAY_BUFFER";
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                titleDiv.innerHTML += " / ELEMENT_ARRAY_BUFFER";
                break;
        }
        el.appendChild(titleDiv);

        gli.ui.appendParameters(gl, el, buffer, ["BUFFER_SIZE", "BUFFER_USAGE"], [null, ["STREAM_DRAW", "STATIC_DRAW", "DYNAMIC_DRAW"]]);
        gli.ui.appendbr(el);

        var showPreview = shouldShowPreview(gl, buffer, version);
        if (showPreview) {
            gli.ui.appendSeparator(el);

            var previewDiv = document.createElement("div");
            previewDiv.className = "info-title-secondary";
            previewDiv.innerHTML = "Preview Options";
            el.appendChild(previewDiv);

            var previewContainer = document.createElement("div");

            // Tools for choosing preview options
            var previewOptions = document.createElement("table");
            previewOptions.className = "buffer-preview";

            function updatePreviewSettings() {
                var options = buffer.previewOptions;

                // Draw options
                options.mode = gl.POINTS + modeSelect.selectedIndex;
                options.positionIndex = attributeSelect.selectedIndex;
                options.position = version.structure[options.positionIndex];

                // Element array buffer options
                if (elementArraySelect.selectedIndex == 0) {
                    // Unindexed
                    options.elementArrayBuffer = null;
                } else {
                    var option = elementArraySelect.options[elementArraySelect.selectedIndex];
                    var elid = parseInt(option.value);
                    var elbuffer = gl.resources.getResourceById(elid);
                    options.elementArrayBuffer = [elbuffer, elbuffer.currentVersion];
                }
                switch (sizeSelect.selectedIndex) {
                    case 0:
                        options.elementArrayType = gl.UNSIGNED_BYTE;
                        break;
                    case 1:
                        options.elementArrayType = gl.UNSIGNED_SHORT;
                        break;
                }

                // Range options
                if (options.elementArrayBuffer) {
                    options.offset = parseInt(startInput.value);
                } else {
                    options.first = parseInt(startInput.value);
                }
                options.count = parseInt(countInput.value);

                try {
                    view.inspector.setBuffer(buffer, version);
                } catch (e) {
                    view.inspector.setBuffer(null, null);
                    console.log("exception while setting buffer preview: " + e);
                }
            };

            // Draw settings
            var drawRow = document.createElement("tr");
            {
                var col0 = document.createElement("td");
                var span0 = document.createElement("span");
                span0.innerHTML = "Mode: ";
                col0.appendChild(span0);
                drawRow.appendChild(col0);
            }
            {
                var col1 = document.createElement("td");
                var modeSelect = document.createElement("select");
                var modeEnums = ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN"];
                for (var n = 0; n < modeEnums.length; n++) {
                    var option = document.createElement("option");
                    option.innerHTML = modeEnums[n];
                    modeSelect.appendChild(option);
                }
                modeSelect.onchange = function () {
                    updatePreviewSettings();
                };
                col1.appendChild(modeSelect);
                drawRow.appendChild(col1);
            }
            {
                var col2 = document.createElement("td");
                var span1 = document.createElement("span");
                span1.innerHTML = "Position Attribute: ";
                col2.appendChild(span1);
                drawRow.appendChild(col2);
            }
            {
                var col3 = document.createElement("td");
                var attributeSelect = document.createElement("select");
                for (var n = 0; n < version.structure.length; n++) {
                    var attrInfo = version.structure[n];
                    var option = document.createElement("option");
                    var typeString;
                    switch (attrInfo.type) {
                        case gl.BYTE:
                            typeString = "BYTE";
                            break;
                        case gl.UNSIGNED_BYTE:
                            typeString = "UNSIGNED_BYTE";
                            break;
                        case gl.SHORT:
                            typeString = "SHORT";
                            break;
                        case gl.UNSIGNED_SHORT:
                            typeString = "UNSIGNED_SHORT";
                            break;
                        default:
                        case gl.FLOAT:
                            typeString = "FLOAT";
                            break;
                    }
                    option.innerHTML = "+" + attrInfo.offset + " / " + attrInfo.size + " * " + typeString;
                    attributeSelect.appendChild(option);
                }
                attributeSelect.onchange = function () {
                    updatePreviewSettings();
                };
                col3.appendChild(attributeSelect);
                drawRow.appendChild(col3);
            }
            previewOptions.appendChild(drawRow);

            // ELEMENT_ARRAY_BUFFER settings
            var elementArrayRow = document.createElement("tr");
            {
                var col0 = document.createElement("td");
                var span0 = document.createElement("span");
                span0.innerHTML = "Element Array: ";
                col0.appendChild(span0);
                elementArrayRow.appendChild(col0);
            }
            {
                var col1 = document.createElement("td");
                var elementArraySelect = document.createElement("select");
                var noneOption = document.createElement("option");
                noneOption.innerHTML = "[unindexed]";
                noneOption.value = null;
                elementArraySelect.appendChild(noneOption);
                var allBuffers = gl.resources.getBuffers();
                for (var n = 0; n < allBuffers.length; n++) {
                    var elBuffer = allBuffers[n];
                    if (elBuffer.type == gl.ELEMENT_ARRAY_BUFFER) {
                        var option = document.createElement("option");
                        option.innerHTML = elBuffer.getName();
                        option.value = elBuffer.id;
                        elementArraySelect.appendChild(option);
                    }
                }
                elementArraySelect.onchange = function () {
                    updatePreviewSettings();
                };
                col1.appendChild(elementArraySelect);
                elementArrayRow.appendChild(col1);
            }
            {
                var col2 = document.createElement("td");
                var span1 = document.createElement("span");
                span1.innerHTML = "Element Type: ";
                col2.appendChild(span1);
                elementArrayRow.appendChild(col2);
            }
            {
                var col3 = document.createElement("td");
                var sizeSelect = document.createElement("select");
                var sizeEnums = ["UNSIGNED_BYTE", "UNSIGNED_SHORT"];
                for (var n = 0; n < sizeEnums.length; n++) {
                    var option = document.createElement("option");
                    option.innerHTML = sizeEnums[n];
                    sizeSelect.appendChild(option);
                }
                sizeSelect.onchange = function () {
                    updatePreviewSettings();
                };
                col3.appendChild(sizeSelect);
                elementArrayRow.appendChild(col3);
            }
            previewOptions.appendChild(elementArrayRow);

            // Range settings
            var rangeRow = document.createElement("tr");
            {
                var col0 = document.createElement("td");
                var span0 = document.createElement("span");
                span0.innerHTML = "Start: ";
                col0.appendChild(span0);
                rangeRow.appendChild(col0);
            }
            {
                var col1 = document.createElement("td");
                var startInput = document.createElement("input");
                startInput.type = "text";
                startInput.value = "0";
                startInput.onchange = function () {
                    updatePreviewSettings();
                };
                col1.appendChild(startInput);
                rangeRow.appendChild(col1);
            }
            {
                var col2 = document.createElement("td");
                var span1 = document.createElement("span");
                span1.innerHTML = "Count: ";
                col2.appendChild(span1);
                rangeRow.appendChild(col2);
            }
            {
                var col3 = document.createElement("td");
                var countInput = document.createElement("input");
                countInput.type = "text";
                countInput.value = "0";
                countInput.onchange = function () {
                    updatePreviewSettings();
                };
                col3.appendChild(countInput);
                rangeRow.appendChild(col3);
            }
            previewOptions.appendChild(rangeRow);

            // Set all defaults based on draw state
            {
                var options = buffer.previewOptions;

                // Draw options
                modeSelect.selectedIndex = options.mode - gl.POINTS;
                attributeSelect.selectedIndex = options.positionIndex;

                // Element array buffer options
                if (options.elementArrayBuffer) {
                    // TODO: speed up lookup
                    for (var n = 0; n < elementArraySelect.options.length; n++) {
                        var option = elementArraySelect.options[n];
                        if (option.value == options.elementArrayBuffer[0].id) {
                            elementArraySelect.selectedIndex = n;
                            break;
                        }
                    }
                } else {
                    elementArraySelect.selectedIndex = 0; // unindexed
                }
                switch (options.elementArrayType) {
                    case gl.UNSIGNED_BYTE:
                        sizeSelect.selectedIndex = 0;
                        break;
                    case gl.UNSIGNED_SHORT:
                        sizeSelect.selectedIndex = 1;
                        break;
                }

                // Range options
                if (options.elementArrayBuffer) {
                    startInput.value = options.offset;
                } else {
                    startInput.value = options.first;
                }
                countInput.value = options.count;
            }

            previewContainer.appendChild(previewOptions);

            el.appendChild(previewContainer);
            gli.ui.appendbr(el);

            gli.ui.appendSeparator(el);
        }

        if (version.structure) {
            // TODO: some kind of fancy structure editor/overload?
            var attribs = version.structure;

            var structDiv = document.createElement("div");
            structDiv.className = "info-title-secondary";
            structDiv.innerHTML = "Structure (from last draw)";
            el.appendChild(structDiv);

            var table = document.createElement("table");
            table.className = "buffer-struct";

            var tr = document.createElement("tr");
            var td = document.createElement("th");
            td.innerHTML = "offset";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "size";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "type";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "stride";
            tr.appendChild(td);
            td = document.createElement("th");
            td.innerHTML = "normalized";
            tr.appendChild(td);
            table.appendChild(tr);

            for (var n = 0; n < attribs.length; n++) {
                var attrib = attribs[n];

                var tr = document.createElement("tr");

                td = document.createElement("td");
                td.innerHTML = attrib.offset;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = attrib.size;
                tr.appendChild(td);
                td = document.createElement("td");
                switch (attrib.type) {
                    case gl.BYTE:
                        td.innerHTML = "BYTE";
                        break;
                    case gl.UNSIGNED_BYTE:
                        td.innerHTML = "UNSIGNED_BYTE";
                        break;
                    case gl.SHORT:
                        td.innerHTML = "SHORT";
                        break;
                    case gl.UNSIGNED_SHORT:
                        td.innerHTML = "UNSIGNED_SHORT";
                        break;
                    default:
                    case gl.FLOAT:
                        td.innerHTML = "FLOAT";
                        break;
                }
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = attrib.stride;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = attrib.normalized;
                tr.appendChild(td);

                table.appendChild(tr);
            }

            el.appendChild(table);
            gli.ui.appendbr(el);
        }

        gli.ui.appendSeparator(el);

        generateBufferHistory(gl, el, buffer, version);
        gli.ui.appendbr(el);

        var frame = gl.ui.controller.currentFrame;
        if (frame) {
            gli.ui.appendSeparator(el);
            gli.ui.generateUsageList(gl, el, frame, buffer);
            gli.ui.appendbr(el);
        }

        gli.ui.appendSeparator(el);

        var contentsDiv = document.createElement("div");
        contentsDiv.className = "info-title-secondary";
        contentsDiv.innerHTML = "Contents";
        el.appendChild(contentsDiv);

        var contentsContainer = document.createElement("div");

        function populateContents() {
            contentsContainer.innerHTML = "";
            var frag = document.createDocumentFragment();
            switch (buffer.type) {
                case gl.ARRAY_BUFFER:
                    generateArrayBufferContents(gl, frag, buffer, version);
                    break;
                case gl.ELEMENT_ARRAY_BUFFER:
                    generateGenericArrayBufferContents(gl, frag, buffer, version);
                    break;
            }
            contentsContainer.appendChild(frag);
        };

        if (buffer.parameters[gl.BUFFER_SIZE] > 40000) {
            // Buffer is really big - delay populating
            var expandLink = document.createElement("span");
            expandLink.className = "buffer-data-collapsed";
            expandLink.innerHTML = "Show buffer contents";
            expandLink.onclick = function () {
                populateContents();
            };
            contentsContainer.appendChild(expandLink);
        } else {
            // Auto-expand
            populateContents();
        }

        el.appendChild(contentsContainer);

        gli.ui.appendbr(el);
    }

    BufferView.prototype.setBuffer = function (buffer) {
        this.currentBuffer = buffer;

        this.elements.listing.innerHTML = "";
        if (buffer) {
            var version;
            switch (this.window.activeVersion) {
                case null:
                    version = buffer.currentVersion;
                    break;
                case "current":
                    var frame = this.window.controller.currentFrame;
                    if (frame) {
                        version = frame.findResourceVersion(buffer);
                    }
                    version = version || buffer.currentVersion; // Fallback to live
                    break;
            }

            // Setup user preview options if not defined
            var lastDrawState = version.lastDrawState;
            if (!buffer.previewOptions && lastDrawState) {
                var elementArrayBufferArray = null;
                if (lastDrawState.elementArrayBuffer) {
                    elementArrayBufferArray = [lastDrawState.elementArrayBuffer, null];
                    // TODO: pick the right version of the ELEMENT_ARRAY_BUFFER
                    elementArrayBufferArray[1] = elementArrayBufferArray[0].currentVersion;
                }

                // TODO: pick the right position attribute
                var positionIndex = 0;
                var positionAttr = version.structure[positionIndex];

                var drawState = {
                    mode: lastDrawState.mode,
                    arrayBuffer: [buffer, version],
                    positionIndex: positionIndex,
                    position: positionAttr,
                    elementArrayBuffer: elementArrayBufferArray,
                    elementArrayType: lastDrawState.elementArrayBufferType,
                    first: lastDrawState.first,
                    offset: lastDrawState.offset,
                    count: lastDrawState.count
                };

                buffer.previewOptions = drawState;
            }

            try {
                this.inspector.setBuffer(buffer, version);
            } catch (e) {
                this.inspector.setBuffer(null, null);
                console.log("exception while setting up buffer preview: " + e);
            }

            generateBufferDisplay(this, this.window.context, this.elements.listing, buffer, version);
        } else {
            this.inspector.setBuffer(null, null);
        }

        this.elements.listing.scrollTop = 0;
    };

    ui.BufferView = BufferView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var ProgramsTab = function (w) {
        var self = this;
        this.el.innerHTML = genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "program", function (el, program) {
            var gl = w.context;

            if (program.status == gli.host.Resource.DEAD) {
                el.className += " program-item-deleted";
            }

            var number = document.createElement("div");
            number.className = "program-item-number";
            number.innerHTML = program.getName();
            el.appendChild(number);

            var vsrow = document.createElement("div");
            vsrow.className = "program-item-row";
            el.appendChild(vsrow);
            var fsrow = document.createElement("div");
            fsrow.className = "program-item-row";
            el.appendChild(fsrow);

            function updateShaderReferences() {
                var vs = program.getVertexShader(gl);
                var fs = program.getFragmentShader(gl);
                vsrow.innerHTML = "VS: " + (vs ? ("Shader " + vs.id) : "[none]");
                fsrow.innerHTML = "FS: " + (fs ? ("Shader " + fs.id) : "[none]");
            }
            updateShaderReferences();

            program.modified.addListener(this, function (program) {
                updateShaderReferences();
                if (self.programView.currentProgram == program) {
                    self.programView.setProgram(program);
                }
            });
            program.deleted.addListener(this, function (program) {
                el.className += " program-item-deleted";
            });

        });
        this.programView = new gli.ui.ProgramView(w, this.el);

        this.listing.valueSelected.addListener(this, function (program) {
            this.programView.setProgram(program);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append programs already present
        var context = w.context;
        var programs = context.resources.getPrograms();
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];
            this.listing.appendValue(program);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLProgram") {
                this.listing.appendValue(resource);
            }
        });

        this.refresh = function () {
            this.programView.setProgram(this.programView.currentProgram);
        };
    };

    ui.ProgramsTab = ProgramsTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var ProgramView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };

        this.currentProgram = null;
    };

    function prettyPrintSource(el, source, highlightLines) {
        var div = document.createElement("div");
        div.innerHTML = source;
        el.appendChild(div);

        var firstLine = 1;
        var firstChar = source.search(/./);
        if (firstChar > 0) {
            firstLine += firstChar;
        }

        SyntaxHighlighter.highlight({
            brush: 'glsl',
            'first-line': firstLine,
            highlight: highlightLines,
            toolbar: false
        }, div);
    };

    function generateShaderDisplay(gl, el, shader) {
        var shaderType = (shader.type == gl.VERTEX_SHADER) ? "Vertex" : "Fragment";

        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-secondary";
        titleDiv.innerHTML = shaderType + " " + shader.getName();
        el.appendChild(titleDiv);

        gli.ui.appendParameters(gl, el, shader, ["COMPILE_STATUS", "DELETE_STATUS"]);

        var highlightLines = [];
        if (shader.infoLog && shader.infoLog.length > 0) {
            var errorLines = shader.infoLog.match(/^ERROR: [0-9]+:[0-9]+: /gm);
            if (errorLines) {
                for (var n = 0; n < errorLines.length; n++) {
                    // expecting: 'ERROR: 0:LINE: '
                    var errorLine = errorLines[n];
                    errorLine = parseInt(errorLine.match(/ERROR: [0-9]+:([0-9]+): /)[1]);
                    highlightLines.push(errorLine);
                }
            }
        }

        var sourceDiv = document.createElement("div");
        sourceDiv.className = "shader-info-source";
        if (shader.source) {
            prettyPrintSource(sourceDiv, shader.source, highlightLines);
        } else {
            sourceDiv.innerHTML = "[no source uploaded]";
        }
        el.appendChild(sourceDiv);

        if (shader.infoLog && shader.infoLog.length > 0) {
            var infoDiv = document.createElement("div");
            infoDiv.className = "program-info-log";
            infoDiv.innerHTML = shader.infoLog.replace(/\n/, "<br/>");
            el.appendChild(infoDiv);
            gli.ui.appendbr(el);
        }
    };

    function appendTable(context, gl, el, program, name, tableData, valueCallback) {
        // [ordinal, name, size, type, optional value]
        var table = document.createElement("table");
        table.className = "program-attribs";

        var tr = document.createElement("tr");
        var td = document.createElement("th");
        td.innerHTML = "idx";
        tr.appendChild(td);
        td = document.createElement("th");
        td.className = "program-attribs-name";
        td.innerHTML = name + " name";
        tr.appendChild(td);
        td = document.createElement("th");
        td.innerHTML = "size";
        tr.appendChild(td);
        td = document.createElement("th");
        td.className = "program-attribs-type";
        td.innerHTML = "type";
        tr.appendChild(td);
        if (valueCallback) {
            td = document.createElement("th");
            td.className = "program-attribs-value";
            td.innerHTML = "value";
            tr.appendChild(td);
        }
        table.appendChild(tr);

        for (var n = 0; n < tableData.length; n++) {
            var row = tableData[n];

            var tr = document.createElement("tr");
            td = document.createElement("td");
            td.innerHTML = row[0];
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = row[1];
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = row[2];
            tr.appendChild(td);
            td = document.createElement("td");
            switch (row[3]) {
                case gl.FLOAT:
                    td.innerHTML = "FLOAT";
                    break;
                case gl.FLOAT_VEC2:
                    td.innerHTML = "FLOAT_VEC2";
                    break;
                case gl.FLOAT_VEC3:
                    td.innerHTML = "FLOAT_VEC3";
                    break;
                case gl.FLOAT_VEC4:
                    td.innerHTML = "FLOAT_VEC4";
                    break;
                case gl.INT:
                    td.innerHTML = "INT";
                    break;
                case gl.INT_VEC2:
                    td.innerHTML = "INT_VEC2";
                    break;
                case gl.INT_VEC3:
                    td.innerHTML = "INT_VEC3";
                    break;
                case gl.INT_VEC4:
                    td.innerHTML = "INT_VEC4";
                    break;
                case gl.BOOL:
                    td.innerHTML = "BOOL";
                    break;
                case gl.BOOL_VEC2:
                    td.innerHTML = "BOOL_VEC2";
                    break;
                case gl.BOOL_VEC3:
                    td.innerHTML = "BOOL_VEC3";
                    break;
                case gl.BOOL_VEC4:
                    td.innerHTML = "BOOL_VEC4";
                    break;
                case gl.FLOAT_MAT2:
                    td.innerHTML = "FLOAT_MAT2";
                    break;
                case gl.FLOAT_MAT3:
                    td.innerHTML = "FLOAT_MAT3";
                    break;
                case gl.FLOAT_MAT4:
                    td.innerHTML = "FLOAT_MAT4";
                    break;
                case gl.SAMPLER_2D:
                    td.innerHTML = "SAMPLER_2D";
                    break;
                case gl.SAMPLER_CUBE:
                    td.innerHTML = "SAMPLER_CUBE";
                    break;
            }
            tr.appendChild(td);
            
            if (valueCallback) {
                td = document.createElement("td");
                valueCallback(n, td);
                tr.appendChild(td);
            }
            
            table.appendChild(tr);
        }

        el.appendChild(table);
    };

    function appendUniformInfos(gl, el, program, isCurrent) {
        var tableData = [];
        var uniformInfos = program.getUniformInfos(gl, program.target);
        for (var n = 0; n < uniformInfos.length; n++) {
            var uniformInfo = uniformInfos[n];
            tableData.push([uniformInfo.index, uniformInfo.name, uniformInfo.size, uniformInfo.type]);
        }
        appendTable(gl, gl, el, program, "uniform", tableData, null);
    };

    function appendAttributeInfos(gl, el, program) {
        var tableData = [];
        var attribInfos = program.getAttribInfos(gl, program.target);
        for (var n = 0; n < attribInfos.length; n++) {
            var attribInfo = attribInfos[n];
            tableData.push([attribInfo.index, attribInfo.name, attribInfo.size, attribInfo.type]);
        }
        appendTable(gl, gl, el, program, "attribute", tableData, null);
    };

    function generateProgramDisplay(gl, el, program, version, isCurrent) {
        var titleDiv = document.createElement("div");
        titleDiv.className = "info-title-master";
        titleDiv.innerHTML = program.getName();
        el.appendChild(titleDiv);

        gli.ui.appendParameters(gl, el, program, ["LINK_STATUS", "VALIDATE_STATUS", "DELETE_STATUS", "ACTIVE_UNIFORMS", "ACTIVE_ATTRIBUTES"]);
        gli.ui.appendbr(el);

        if (program.parameters[gl.ACTIVE_UNIFORMS] > 0) {
            appendUniformInfos(gl, el, program, isCurrent);
            gli.ui.appendbr(el);
        }
        if (program.parameters[gl.ACTIVE_ATTRIBUTES] > 0) {
            appendAttributeInfos(gl, el, program);
            gli.ui.appendbr(el);
        }

        if (program.infoLog && program.infoLog.length > 0) {
            var infoDiv = document.createElement("div");
            infoDiv.className = "program-info-log";
            infoDiv.innerHTML = program.infoLog.replace(/\n/, "<br/>");
            el.appendChild(infoDiv);
            gli.ui.appendbr(el);
        }
        
        var frame = gl.ui.controller.currentFrame;
        if (frame) {
            gli.ui.appendSeparator(el);
            gli.ui.generateUsageList(gl, el, frame, program);
            gli.ui.appendbr(el);
        }

        var vertexShader = program.getVertexShader(gl);
        var fragmentShader = program.getFragmentShader(gl);
        if (vertexShader) {
            var vertexShaderDiv = document.createElement("div");
            gli.ui.appendSeparator(el);
            generateShaderDisplay(gl, el, vertexShader);
        }
        if (fragmentShader) {
            var fragmentShaderDiv = document.createElement("div");
            gli.ui.appendSeparator(el);
            generateShaderDisplay(gl, el, fragmentShader);
        }
    };

    ProgramView.prototype.setProgram = function (program) {
        this.currentProgram = program;

        this.elements.view.innerHTML = "";
        if (program) {

            var version;
            var isCurrent = false;
            switch (this.window.activeVersion) {
                case null:
                    version = program.currentVersion;
                    break;
                case "current":
                    var frame = this.window.controller.currentFrame;
                    if (frame) {
                        version = frame.findResourceVersion(program);
                        isCurrent = true;
                    }
                    version = version || program.currentVersion; // Fallback to live
                    break;
            }

            generateProgramDisplay(this.window.context, this.elements.view, program, version, isCurrent);
        }

        this.elements.view.scrollTop = 0;
    };

    ui.ProgramView = ProgramView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var ProgramsTab = function (w) {
        var self = this;
        this.el.innerHTML = gli.ui.Tab.genericLeftRightView;

        this.listing = new gli.ui.LeftListing(w, this.el, "program", function (el, program) {
            var gl = w.context;

            if (program.status == gli.host.Resource.DEAD) {
                el.className += " program-item-deleted";
            }

            var number = document.createElement("div");
            number.className = "program-item-number";
            number.innerHTML = program.getName();
            el.appendChild(number);

            var vsrow = document.createElement("div");
            vsrow.className = "program-item-row";
            el.appendChild(vsrow);
            var fsrow = document.createElement("div");
            fsrow.className = "program-item-row";
            el.appendChild(fsrow);

            function updateShaderReferences() {
                var vs = program.getVertexShader(gl);
                var fs = program.getFragmentShader(gl);
                vsrow.innerHTML = "VS: " + (vs ? ("Shader " + vs.id) : "[none]");
                fsrow.innerHTML = "FS: " + (fs ? ("Shader " + fs.id) : "[none]");
            }
            updateShaderReferences();

            program.modified.addListener(this, function (program) {
                updateShaderReferences();
                if (self.programView.currentProgram == program) {
                    self.programView.setProgram(program);
                }
            });
            program.deleted.addListener(this, function (program) {
                el.className += " program-item-deleted";
            });

        });
        this.programView = new gli.ui.ProgramView(w, this.el);

        this.listing.valueSelected.addListener(this, function (program) {
            this.programView.setProgram(program);
        });

        var scrollStates = {};
        this.lostFocus.addListener(this, function () {
            scrollStates.listing = this.listing.getScrollState();
        });
        this.gainedFocus.addListener(this, function () {
            this.listing.setScrollState(scrollStates.listing);
        });

        // Append programs already present
        var context = w.context;
        var programs = context.resources.getPrograms();
        for (var n = 0; n < programs.length; n++) {
            var program = programs[n];
            this.listing.appendValue(program);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLProgram") {
                this.listing.appendValue(resource);
            }
        });

        this.refresh = function () {
            this.programView.setProgram(this.programView.currentProgram);
        };
    };

    ui.ProgramsTab = ProgramsTab;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var PerformanceView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
        };
    };

    ui.PerformanceView = PerformanceView;
})();
(function () {
    var ui = glinamespace("gli.ui");

    function padValue(v, l) {
        v = String(v);
        var n = v.length;
        while (n < l) {
            v = "&nbsp;" + v;
            n++;
        }
        return v;
    };

    var DrawInfo = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Draw Info", 863, 600]);
    };

    DrawInfo.prototype.setup = function () {
        var self = this;
        var context = this.context;

        // TODO: toolbar buttons/etc
    };

    DrawInfo.prototype.dispose = function () {
        this.bufferCanvas = null;
        this.bufferCanvasOuter = null;
        if (this.bufferPreviewer) {
            this.bufferPreviewer.dispose();
            this.bufferPreviewer = null;
        }
        if (this.texturePreviewer) {
            this.texturePreviewer.dispose();
            this.texturePreviewer = null;
        }

        this.canvas = null;
        this.gl = null;
    };

    DrawInfo.prototype.demandSetup = function () {
        // This happens around here to work around some Chromium issues with
        // creating WebGL canvases in differing documents

        if (this.gl) {
            return;
        }

        var doc = this.browserWindow.document;

        // TODO: move to shared code
        function prepareCanvas(canvas) {
            var frag = document.createDocumentFragment();
            frag.appendChild(canvas);
            var gl = gli.util.getWebGLContext(canvas);
            return gl;
        };
        this.canvas = document.createElement("canvas");
        this.gl = prepareCanvas(this.canvas);

        this.texturePreviewer = new gli.ui.TexturePreviewGenerator();

        var bufferCanvas = this.bufferCanvas = doc.createElement("canvas");
        bufferCanvas.className = "gli-reset drawinfo-canvas";
        bufferCanvas.width = 256;
        bufferCanvas.height = 256;
        var bufferCanvasOuter = this.bufferCanvasOuter = doc.createElement("div");
        bufferCanvasOuter.style.position = "relative";
        bufferCanvasOuter.appendChild(bufferCanvas);

        this.bufferPreviewer = new gli.ui.BufferPreview(bufferCanvas);
        this.bufferPreviewer.setupDefaultInput();
    };

    DrawInfo.prototype.clear = function () {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info";
        this.elements.innerDiv.innerHTML = "";
    };

    DrawInfo.prototype.addCallInfo = function (frame, call, drawInfo) {
        var self = this;
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();

        // Call line
        var callLine = doc.createElement("div");
        callLine.className = "drawinfo-call";
        gli.ui.appendCallLine(this.context, callLine, frame, call);
        panel.appendChild(callLine);

        // ELEMENT_ARRAY_BUFFER (if an indexed call)
        if (call.name == "drawElements") {
            var elementArrayLine = doc.createElement("div");
            elementArrayLine.className = "drawinfo-elementarray trace-call-line";
            elementArrayLine.style.paddingLeft = "42px";
            elementArrayLine.innerHTML = "ELEMENT_ARRAY_BUFFER: "
            gli.ui.appendObjectRef(this.context, elementArrayLine, drawInfo.args.elementArrayBuffer);
            panel.appendChild(elementArrayLine);
            gli.ui.appendClear(panel);
        }

        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);

        // Guess the position attribute
        var positionIndex = (function guessPositionIndex(attribInfos) {
            // Look for any attributes that sound like a position ('pos'/'position'/etc)
            // and have the right type (vec2/vec3/vec4)
            for (var n = 0; n < drawInfo.attribInfos.length; n++) {
                var attrib = drawInfo.attribInfos[n];
                if (attrib.name.toLowerCase().indexOf("pos") != -1) {
                    switch (attrib.type) {
                    case gl.INT_VEC2:
                    case gl.INT_VEC3:
                    case gl.INT_VEC4:
                    case gl.FLOAT_VEC2:
                    case gl.FLOAT_VEC3:
                    case gl.FLOAT_VEC4:
                        return n;
                    }
                }
            }

            // Look for the first vec3 attribute
            for (var n = 0; n < drawInfo.attribInfos.length; n++) {
                var attrib = drawInfo.attribInfos[n];
                if (attrib.type == gl.FLOAT_VEC3) {
                    return n;
                }
            }

            return -1;
        })(drawInfo.attribInfos);

        // Setup default preview options
        var previewOptions = null;
        if (positionIndex >= 0) {
            var positionBuffer = drawInfo.attribInfos[positionIndex].state.buffer;
            var indexBuffer = drawInfo.args.elementArrayBuffer;
            previewOptions = {
                mode: drawInfo.args.mode,
                arrayBuffer: [positionBuffer, positionBuffer.mirror.version],
                positionIndex: positionIndex,
                position: drawInfo.attribInfos[positionIndex].state,
                elementArrayBuffer: indexBuffer ? [indexBuffer, indexBuffer.mirror.version] : null,
                elementArrayType: drawInfo.args.elementArrayType,
                offset: drawInfo.args.offset,
                first: drawInfo.args.first,
                count: drawInfo.args.count
            };
        }

        // Buffer preview item
        var bufferDiv = doc.createElement("div");
        bufferDiv.className = "drawinfo-canvas-outer";
        bufferDiv.appendChild(this.bufferCanvasOuter);
        innerDiv.appendChild(bufferDiv);
        this.bufferPreviewer.setBuffer(previewOptions);
        this.bufferPreviewer.draw();

        // Frame preview item
        var frameDiv = doc.createElement("div");
        frameDiv.className = "drawinfo-canvas-outer";
        var cc = doc.createElement("canvas");
        cc.className = "gli-reset drawinfo-canvas drawinfo-canvas-trans";
        cc.width = 256;
        cc.height = 256;
        frameDiv.appendChild(cc);
        innerDiv.appendChild(frameDiv);

        // Isolated preview item
        var frameDiv = doc.createElement("div");
        frameDiv.className = "drawinfo-canvas-outer";
        var cc = doc.createElement("canvas");
        cc.className = "gli-reset drawinfo-canvas drawinfo-canvas-trans";
        cc.width = 256;
        cc.height = 256;
        frameDiv.appendChild(cc);
        innerDiv.appendChild(frameDiv);

        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);

        var optionsDiv = doc.createElement("div");
        optionsDiv.className = "drawinfo-options";

        var attributeSelect = doc.createElement("select");
        var maxAttribNameLength = 0;
        var maxBufferNameLength = 0;
        for (var n = 0; n < drawInfo.attribInfos.length; n++) {
            maxAttribNameLength = Math.max(maxAttribNameLength, drawInfo.attribInfos[n].name.length);
            var buffer = drawInfo.attribInfos[n].state.buffer;
            if (buffer) {
                maxBufferNameLength = Math.max(maxBufferNameLength, buffer.getName().length);
            }
        }
        for (var n = 0; n < drawInfo.attribInfos.length; n++) {
            var attrib = drawInfo.attribInfos[n];
            var option = doc.createElement("option");
            var typeString;
            switch (attrib.state.type) {
                case gl.BYTE:
                    typeString = "BYTE";
                    break;
                case gl.UNSIGNED_BYTE:
                    typeString = "UNSIGNED_BYTE";
                    break;
                case gl.SHORT:
                    typeString = "SHORT";
                    break;
                case gl.UNSIGNED_SHORT:
                    typeString = "UNSIGNED_SHORT";
                    break;
                default:
                case gl.FLOAT:
                    typeString = "FLOAT";
                    break;
            }
            option.innerHTML = padValue(attrib.name, maxAttribNameLength) + ": ";
            if (attrib.state.buffer) {
                option.innerHTML += padValue("[" + attrib.state.buffer.getName() + "]", maxBufferNameLength) + " " + padValue("+" + attrib.state.pointer, 4) + " / " + attrib.state.size + " * " + typeString;
            } else {
                option.innerHTML += gli.util.typedArrayToString(attrib.state.value);
            }
            attributeSelect.appendChild(option);
        }
        attributeSelect.selectedIndex = positionIndex;
        attributeSelect.onchange = function () {
            frame.switchMirrors("drawinfo");
            previewOptions.positionIndex = attributeSelect.selectedIndex;
            previewOptions.position = drawInfo.attribInfos[previewOptions.positionIndex].state;
            var positionBuffer = drawInfo.attribInfos[previewOptions.positionIndex].state.buffer;
            previewOptions.arrayBuffer = [positionBuffer, positionBuffer.mirror.version];
            try {
                self.bufferPreviewer.setBuffer(previewOptions);
            } catch (e) {
                console.log("error trying to preview buffer: " + e);
            }
            self.bufferPreviewer.draw();
            frame.switchMirrors();
        };
        optionsDiv.appendChild(attributeSelect);

        innerDiv.appendChild(optionsDiv);

        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);
    };

    DrawInfo.prototype.appendTable = function (el, drawInfo, name, tableData, valueCallback) {
        var doc = this.browserWindow.document;
        var gl = this.gl;

        // [ordinal, name, size, type, optional value]
        var table = doc.createElement("table");
        table.className = "program-attribs";

        var tr = doc.createElement("tr");
        var td = doc.createElement("th");
        td.innerHTML = "idx";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.className = "program-attribs-name";
        td.innerHTML = name + " name";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.innerHTML = "size";
        tr.appendChild(td);
        td = doc.createElement("th");
        td.className = "program-attribs-type";
        td.innerHTML = "type";
        tr.appendChild(td);
        if (valueCallback) {
            td = doc.createElement("th");
            td.className = "program-attribs-value";
            td.innerHTML = "value";
            tr.appendChild(td);
        }
        table.appendChild(tr);

        for (var n = 0; n < tableData.length; n++) {
            var row = tableData[n];

            var tr = doc.createElement("tr");
            td = doc.createElement("td");
            td.innerHTML = row[0];
            tr.appendChild(td);
            td = doc.createElement("td");
            td.innerHTML = row[1];
            tr.appendChild(td);
            td = doc.createElement("td");
            td.innerHTML = row[2];
            tr.appendChild(td);
            td = doc.createElement("td");
            switch (row[3]) {
                case gl.FLOAT:
                    td.innerHTML = "FLOAT";
                    break;
                case gl.FLOAT_VEC2:
                    td.innerHTML = "FLOAT_VEC2";
                    break;
                case gl.FLOAT_VEC3:
                    td.innerHTML = "FLOAT_VEC3";
                    break;
                case gl.FLOAT_VEC4:
                    td.innerHTML = "FLOAT_VEC4";
                    break;
                case gl.INT:
                    td.innerHTML = "INT";
                    break;
                case gl.INT_VEC2:
                    td.innerHTML = "INT_VEC2";
                    break;
                case gl.INT_VEC3:
                    td.innerHTML = "INT_VEC3";
                    break;
                case gl.INT_VEC4:
                    td.innerHTML = "INT_VEC4";
                    break;
                case gl.BOOL:
                    td.innerHTML = "BOOL";
                    break;
                case gl.BOOL_VEC2:
                    td.innerHTML = "BOOL_VEC2";
                    break;
                case gl.BOOL_VEC3:
                    td.innerHTML = "BOOL_VEC3";
                    break;
                case gl.BOOL_VEC4:
                    td.innerHTML = "BOOL_VEC4";
                    break;
                case gl.FLOAT_MAT2:
                    td.innerHTML = "FLOAT_MAT2";
                    break;
                case gl.FLOAT_MAT3:
                    td.innerHTML = "FLOAT_MAT3";
                    break;
                case gl.FLOAT_MAT4:
                    td.innerHTML = "FLOAT_MAT4";
                    break;
                case gl.SAMPLER_2D:
                    td.innerHTML = "SAMPLER_2D";
                    break;
                case gl.SAMPLER_CUBE:
                    td.innerHTML = "SAMPLER_CUBE";
                    break;
            }
            tr.appendChild(td);

            if (valueCallback) {
                td = doc.createElement("td");
                valueCallback(n, td);
                tr.appendChild(td);
            }

            table.appendChild(tr);
        }

        el.appendChild(table);
    };

    DrawInfo.prototype.appendUniformInfos = function (el, drawInfo) {
        var self = this;
        var doc = this.browserWindow.document;
        var gl = this.gl;

        var uniformInfos = drawInfo.uniformInfos;
        var tableData = [];
        for (var n = 0; n < uniformInfos.length; n++) {
            var uniformInfo = uniformInfos[n];
            tableData.push([uniformInfo.index, uniformInfo.name, uniformInfo.size, uniformInfo.type]);
        }
        this.appendTable(el, drawInfo, "uniform", tableData, function (n, el) {
            var uniformInfo = uniformInfos[n];
            if (uniformInfo.textureValue) {
                // Texture value
                var texture = uniformInfo.textureValue;

                var samplerDiv = doc.createElement("div");
                samplerDiv.className = "drawinfo-sampler-value";
                samplerDiv.innerHTML = "Sampler: " + uniformInfo.value;
                el.appendChild(samplerDiv);
                el.innerHTML += "&nbsp;";
                gli.ui.appendObjectRef(self.context, el, uniformInfo.textureValue);

                if (texture) {
                    var item = self.texturePreviewer.buildItem(self, doc, gl, texture, false, false);
                    item.className += " drawinfo-sampler-thumb";
                    el.appendChild(item);
                }
            } else {
                // Normal value
                switch (uniformInfo.type) {
                    case gl.FLOAT_MAT2:
                    case gl.FLOAT_MAT3:
                    case gl.FLOAT_MAT4:
                        gli.ui.appendMatrices(gl, el, uniformInfo.type, uniformInfo.size, uniformInfo.value);
                        break;
                    case gl.FLOAT:
                        el.innerHTML = "&nbsp;" + gli.ui.padFloat(uniformInfo.value);
                        break;
                    case gl.INT:
                    case gl.BOOL:
                        el.innerHTML = "&nbsp;" + gli.ui.padInt(uniformInfo.value);
                        break;
                    default:
                        if (uniformInfo.value.hasOwnProperty("length")) {
                            gli.ui.appendArray(el, uniformInfo.value);
                        } else {
                            // TODO: prettier display
                            el.innerHTML = uniformInfo.value;
                        }
                        break;
                }
            }
        });
    };

    DrawInfo.prototype.appendAttribInfos = function (el, drawInfo) {
        var self = this;
        var doc = this.browserWindow.document;
        var gl = this.gl;

        var attribInfos = drawInfo.attribInfos;
        var tableData = [];
        for (var n = 0; n < attribInfos.length; n++) {
            var attribInfo = attribInfos[n];
            tableData.push([attribInfo.index, attribInfo.name, attribInfo.size, attribInfo.type]);
        }
        this.appendTable(el, drawInfo, "attribute", tableData, function (n, el) {
            var attribInfo = attribInfos[n];
            if (attribInfo.state.buffer) {
                el.innerHTML = "Buffer: ";
                gli.ui.appendObjectRef(self.context, el, attribInfo.state.buffer);
                var typeString;
                switch (attribInfo.state.type) {
                    case gl.BYTE:
                        typeString = "BYTE";
                        break;
                    case gl.UNSIGNED_BYTE:
                        typeString = "UNSIGNED_BYTE";
                        break;
                    case gl.SHORT:
                        typeString = "SHORT";
                        break;
                    case gl.UNSIGNED_SHORT:
                        typeString = "UNSIGNED_SHORT";
                        break;
                    default:
                    case gl.FLOAT:
                        typeString = "FLOAT";
                        break;
                }
                var specifierSpan = doc.createElement("span");
                specifierSpan.innerHTML = " " + padValue("+" + attribInfo.state.pointer, 4) + " / " + attribInfo.state.size + " * " + typeString + (attribInfo.state.normalized ? " N" : "");
                el.appendChild(specifierSpan);
            } else {
                el.innerHTML = "Constant: ";
                // TODO: pretty print
                el.innerHTML += attribInfo.state.value;
            }
        });
    };

    DrawInfo.prototype.addProgramInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();

        // Name
        var programLine = doc.createElement("div");
        programLine.className = "drawinfo-program trace-call-line";
        programLine.innerHTML = "<b>Program</b>: ";
        gli.ui.appendObjectRef(this.context, programLine, drawInfo.program);
        panel.appendChild(programLine);
        gli.ui.appendClear(panel);
        gli.ui.appendClear(innerDiv);
        gli.ui.appendbr(innerDiv);

        // Uniforms
        this.appendUniformInfos(innerDiv, drawInfo);
        gli.ui.appendbr(innerDiv);

        // Vertex attribs
        this.appendAttribInfos(innerDiv, drawInfo);
        gli.ui.appendbr(innerDiv);
    };

    DrawInfo.prototype.addStateInfo = function (frame, call, drawInfo) {
        var doc = this.browserWindow.document;
        var gl = this.gl;
        var innerDiv = this.elements.innerDiv;

        var panel = this.buildPanel();

        var programLine = doc.createElement("div");
        programLine.className = "drawinfo-program trace-call-line";
        programLine.innerHTML = "<b>State</b>";
        // TODO: link to state object
        panel.appendChild(programLine);
        gli.ui.appendClear(panel);
        gli.ui.appendClear(innerDiv);

        var vertexState = [
            "CULL_FACE",
            "CULL_FACE_MODE",
            "FRONT_FACE",
            "LINE_WIDTH"
        ];

        var fragmentState = [
            "BLEND",
            "BLEND_EQUATION_RGB",
            "BLEND_EQUATION_ALPHA",
            "BLEND_SRC_RGB",
            "BLEND_SRC_ALPHA",
            "BLEND_DST_RGB",
            "BLEND_DST_ALPHA",
            "BLEND_COLOR"
        ];

        var depthStencilState = [
            "DEPTH_TEST",
            "DEPTH_FUNC",
            "DEPTH_RANGE",
            "POLYGON_OFFSET_FILL",
            "POLYGON_OFFSET_FACTOR",
            "POLYGON_OFFSET_UNITS",
            "STENCIL_TEST",
            "STENCIL_FUNC",
            "STENCIL_REF",
            "STENCIL_VALUE_MASK",
            "STENCIL_FAIL",
            "STENCIL_PASS_DEPTH_FAIL",
            "STENCIL_PASS_DEPTH_PASS",
            "STENCIL_BACK_FUNC",
            "STENCIL_BACK_REF",
            "STENCIL_BACK_VALUE_MASK",
            "STENCIL_BACK_FAIL",
            "STENCIL_BACK_PASS_DEPTH_FAIL",
            "STENCIL_BACK_PASS_DEPTH_PASS"
        ];

        var outputState = [
            "VIEWPORT",
            "SCISSOR_TEST",
            "SCISSOR_BOX",
            "COLOR_WRITEMASK",
            "DEPTH_WRITEMASK",
            "STENCIL_WRITEMASK",
            "FRAMEBUFFER_BINDING"
        // TODO: RTT / renderbuffers/etc
        ];

        function generateStateTable(el, name, state, enumNames) {
            var titleDiv = doc.createElement("div");
            titleDiv.className = "info-title-master";
            titleDiv.innerHTML = name;
            el.appendChild(titleDiv);

            var table = doc.createElement("table");
            table.className = "info-parameters";

            var stateParameters = gli.info.stateParameters;
            for (var n = 0; n < enumNames.length; n++) {
                var enumName = enumNames[n];
                var param = stateParameters[enumName];
                gli.ui.appendStateParameterRow(this.window, gl, table, state, param);
            }

            el.appendChild(table);
        };

        generateStateTable(innerDiv, "Vertex State", drawInfo.state, vertexState);
        generateStateTable(innerDiv, "Fragment State", drawInfo.state, fragmentState);
        generateStateTable(innerDiv, "Depth/Stencil State", drawInfo.state, depthStencilState);
        generateStateTable(innerDiv, "Output State", drawInfo.state, outputState);
    };

    DrawInfo.prototype.captureDrawInfo = function (frame, call) {
        var gl = this.gl;

        var drawInfo = {
            args: {
                mode: 0,
                elementArrayBuffer: null,
                elementArrayType: 0,
                first: 0,
                offset: 0,
                count: 0
            },
            program: null,
            uniformInfos: [],
            attribInfos: [],
            state: null
        };

        // Args
        switch (call.name) {
            case "drawArrays":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.first = call.args[1];
                drawInfo.args.count = call.args[2];
                break;
            case "drawElements":
                drawInfo.args.mode = call.args[0];
                drawInfo.args.count = call.args[1];
                drawInfo.args.elementArrayType = call.args[2];
                drawInfo.args.offset = call.args[3];
                var glelementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
                drawInfo.args.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
                break;
        }

        // Program
        var glprogram = gl.getParameter(gl.CURRENT_PROGRAM);
        drawInfo.program = glprogram ? glprogram.trackedObject : null;
        if (glprogram) {
            drawInfo.uniformInfos = drawInfo.program.getUniformInfos(gl, glprogram);
            drawInfo.attribInfos = drawInfo.program.getAttribInfos(gl, glprogram);
        }

        // Capture entire state for blend mode/etc
        drawInfo.state = new gli.host.StateSnapshot(gl);

        return drawInfo;
    };

    DrawInfo.prototype.inspectDrawCall = function (frame, drawCall) {
        var doc = this.browserWindow.document;
        doc.title = "Draw Info: #" + drawCall.ordinal + " " + drawCall.name;

        var innerDiv = this.elements.innerDiv;
        innerDiv.innerHTML = "";

        this.demandSetup();

        // Prep canvas
        var width = frame.canvasInfo.width;
        var height = frame.canvasInfo.height;
        this.canvas.width = width;
        this.canvas.height = height;
        var gl = this.gl;

        // Prepare canvas
        frame.switchMirrors("drawinfo");
        frame.makeActive(gl, true, {
            ignoreTextureUploads: true
        });

        // Issue all calls (minus the draws we don't care about) and stop at our draw
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            if (call == drawCall) {
                // Call we want
            } else {
                // Skip other draws/etc
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        continue;
                }
            }

            call.emit(gl);

            if (call == drawCall) {
                break;
            }
        }

        // Capture interesting draw info
        var drawInfo = this.captureDrawInfo(frame, drawCall);

        this.addCallInfo(frame, drawCall, drawInfo);
        this.addProgramInfo(frame, drawCall, drawInfo);
        this.addStateInfo(frame, drawCall, drawInfo);

        gli.ui.appendbr(innerDiv);

        // Restore all resource mirrors
        frame.switchMirrors(null);
    };

    ui.DrawInfo = DrawInfo;
})();
(function () {
    var ui = glinamespace("gli.ui");

    var PixelHistory = function (context, name) {
        glisubclass(gli.ui.PopupWindow, this, [context, name, "Pixel History", 926, 600]);
    };

    PixelHistory.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var doc = this.browserWindow.document;

        var defaultShowDepthDiscarded = gli.settings.session.showDepthDiscarded;
        this.addToolbarToggle("Show Depth Discarded Draws", "Display draws discarded by depth test", defaultShowDepthDiscarded, function (checked) {
            gli.settings.session.showDepthDiscarded = checked;
            gli.settings.save();

            if (self.current) {
                var current = self.current;
                self.inspectPixel(current.frame, current.x, current.y, current.locationString);
            }
        });

        var loadingMessage = this.loadingMessage = doc.createElement("div");
        loadingMessage.className = "pixelhistory-loading";
        loadingMessage.innerHTML = "Loading... (this may take awhile)";

        // TODO: move to shared code
        function prepareCanvas(canvas) {
            var frag = doc.createDocumentFragment();
            frag.appendChild(canvas);
            var gl = gli.util.getWebGLContext(canvas, context.attributes, null);
            return gl;
        };
        this.canvas1 = doc.createElement("canvas");
        this.canvas2 = doc.createElement("canvas");
        this.gl1 = prepareCanvas(this.canvas1);
        this.gl2 = prepareCanvas(this.canvas2);
    };

    PixelHistory.prototype.dispose = function () {
        if (this.current) {
            var frame = this.current.frame;
            frame.switchMirrors("pixelhistory1");
            frame.cleanup(this.gl1);
            frame.switchMirrors("pixelhistory2");
            frame.cleanup(this.gl2);
            frame.switchMirrors();
        }
        this.current = null;
        this.canvas1 = this.canvas2 = null;
        this.gl1 = this.gl2 = null;
    };

    PixelHistory.prototype.clear = function () {
        this.current = null;

        this.browserWindow.document.title = "Pixel History";

        this.clearPanels();
    };

    PixelHistory.prototype.clearPanels = function () {
        this.elements.innerDiv.scrollTop = 0;
        this.elements.innerDiv.innerHTML = "";
    };

    PixelHistory.prototype.addPanel = function (gl, frame, call) {
        var doc = this.browserWindow.document;

        var panel = this.buildPanel();

        var callLine = doc.createElement("div");
        callLine.className = "pixelhistory-call";
        var callParent = callLine;
        if (call.history.isDepthDiscarded) {
            // If discarded by the depth test, strike out the line
            callParent = document.createElement("strike");
            callLine.appendChild(callParent);
        }
        gli.ui.appendCallLine(this.context, callParent, frame, call);
        panel.appendChild(callLine);

        // Only add color info if not discarded
        if (!call.history.isDepthDiscarded) {
            function addColor(doc, colorsLine, colorMask, name, canvas, subscript) {
                // Label
                // Canvas
                // rgba(r, g, b, a)

                var div = doc.createElement("div");
                div.className = "pixelhistory-color";

                var labelSpan = doc.createElement("span");
                labelSpan.className = "pixelhistory-color-label";
                labelSpan.innerHTML = name;
                div.appendChild(labelSpan);

                canvas.className = "gli-reset pixelhistory-color-canvas";
                div.appendChild(canvas);

                var rgba = getPixelRGBA(canvas.getContext("2d"));
                if (rgba) {
                    var rgbaSpan = doc.createElement("span");
                    rgbaSpan.className = "pixelhistory-color-rgba";
                    var rv = Math.floor(rgba[0] * 255);
                    var gv = Math.floor(rgba[1] * 255);
                    var bv = Math.floor(rgba[2] * 255);
                    var av = Math.floor(rgba[3] * 255);
                    if (!colorMask[0]) {
                        rv = "<strike>" + rv + "</strike>";
                    }
                    if (!colorMask[1]) {
                        gv = "<strike>" + gv + "</strike>";
                    }
                    if (!colorMask[2]) {
                        bv = "<strike>" + bv + "</strike>";
                    }
                    if (!colorMask[3]) {
                        av = "<strike>" + av + "</strike>";
                    }
                    var subscripthtml = "<sub>" + subscript + "</sub>";
                    rgbaSpan.innerHTML =
                    "R" + subscripthtml + ": " + rv + "<br/>" +
                    "G" + subscripthtml + ": " + gv + "<br/>" +
                    "B" + subscripthtml + ": " + bv + "<br/>" +
                    "A" + subscripthtml + ": " + av;
                    div.appendChild(rgbaSpan);
                }

                colorsLine.appendChild(div);
            };

            var colorsLine = doc.createElement("div");
            colorsLine.className = "pixelhistory-colors";
            addColor(doc, colorsLine, call.history.colorMask, "Source", call.history.self, "s");
            addColor(doc, colorsLine, [true, true, true, true], "Dest", call.history.pre, "d");
            addColor(doc, colorsLine, [true, true, true, true], "Result", call.history.post, "r");

            if (call.history.blendEnabled) {
                var letters = ["R", "G", "B", "A"];
                var rgba_pre = getPixelRGBA(call.history.pre.getContext("2d"));
                var rgba_self = getPixelRGBA(call.history.self.getContext("2d"));
                var rgba_post = getPixelRGBA(call.history.post.getContext("2d"));
                var hasPixelValues = rgba_pre && rgba_self && rgba_post;
                var a_pre, a_self, a_post;
                if (hasPixelValues) {
                    a_pre = rgba_pre[3];
                    a_self = rgba_self[3];
                    a_post = rgba_post[3];
                }

                function genBlendString(index) {
                    var letter = letters[index];
                    var blendColor = call.history.blendColor[index];
                    var blendEqu;
                    var blendSrc;
                    var blendDst;
                    switch (index) {
                        case 0:
                        case 1:
                        case 2:
                            blendEqu = call.history.blendEquRGB;
                            blendSrc = call.history.blendSrcRGB;
                            blendDst = call.history.blendDstRGB;
                            break;
                        case 3:
                            blendEqu = call.history.blendEquAlpha;
                            blendSrc = call.history.blendSrcAlpha;
                            blendDst = call.history.blendDstAlpha;
                            break;
                    }

                    var x_pre = rgba_pre ? rgba_pre[index] : undefined;
                    var x_self = rgba_self ? rgba_self[index] : undefined;
                    var x_post = rgba_post ? rgba_post[index] : undefined;
                    function genFactor(factor) {
                        switch (factor) {
                            case gl.ZERO:
                                return ["0", 0];
                            case gl.ONE:
                                return ["1", 1];
                            case gl.SRC_COLOR:
                                return [letter + "<sub>s</sub>", x_self];
                            case gl.ONE_MINUS_SRC_COLOR:
                                return ["1 - " + letter + "<sub>s</sub>", 1 - x_self];
                            case gl.DST_COLOR:
                                return [letter + "<sub>d</sub>", x_pre];
                            case gl.ONE_MINUS_DST_COLOR:
                                return ["1 - " + letter + "<sub>d</sub>", 1 - x_pre];
                            case gl.SRC_ALPHA:
                                return ["A<sub>s</sub>", a_self];
                            case gl.ONE_MINUS_SRC_ALPHA:
                                return ["1 - A<sub>s</sub>", 1 - a_self];
                            case gl.DST_ALPHA:
                                return ["A<sub>d</sub>", a_pre];
                            case gl.ONE_MINUS_DST_ALPHA:
                                return ["1 - A<sub>d</sub>", 1 - a_pre];
                            case gl.CONSTANT_COLOR:
                                return [letter + "<sub>c</sub>", blendColor[index]];
                            case gl.ONE_MINUS_CONSTANT_COLOR:
                                return ["1 - " + letter + "<sub>c</sub>", 1 - blendColor[index]];
                            case gl.CONSTANT_ALPHA:
                                return ["A<sub>c</sub>", blendColor[3]];
                            case gl.ONE_MINUS_CONSTANT_ALPHA:
                                return ["1 - A<sub>c</sub>", 1 - blendColor[3]];
                            case gl.SRC_ALPHA_SATURATE:
                                if (index == 3) {
                                    return ["1", 1];
                                } else {
                                    return ["i", Math.min(a_self, 1 - a_pre)];
                                }
                        }
                    };
                    var sfactor = genFactor(blendSrc);
                    var dfactor = genFactor(blendDst);
                    var s = letter + "<sub>s</sub>(" + sfactor[0] + ")";
                    var d = letter + "<sub>d</sub>(" + dfactor[0] + ")";
                    function fixFloat(n) {
                        var f = Math.round(n * 10000) / 10000;
                        var s = String(f);
                        if (s.length == 1) {
                            s += ".0000";
                        }
                        while (s.length < 6) {
                            s += "0";
                        }
                        return s;
                    };
                    var largs = ["s", "d"];
                    var args = [s, d];
                    var equstr = "";
                    switch (blendEqu) {
                        case gl.FUNC_ADD:
                            equstr = "+";
                            break;
                        case gl.FUNC_SUBTRACT:
                            equstr = "-";
                            break;
                        case gl.FUNC_REVERSE_SUBTRACT:
                            equstr = "-";
                            largs = ["d", "s"];
                            args = [d, s];
                            break;
                    }
                    var str = letter + "<sub>r</sub> = " + args[0] + " " + equstr + " " + args[1];
                    var nstr;
                    if (hasPixelValues) {
                        var ns = fixFloat(x_self) + "(" + fixFloat(sfactor[1]) + ")";
                        var nd = fixFloat(x_pre) + "(" + fixFloat(dfactor[1]) + ")";
                        var nargs = [ns, nd];
                        switch (blendEqu) {
                            case gl.FUNC_ADD:
                            case gl.FUNC_SUBTRACT:
                                break;
                            case gl.FUNC_REVERSE_SUBTRACT:
                                nargs = [nd, ns];
                                break;
                        }
                        nstr = fixFloat(x_post) + " = " + nargs[0] + "&nbsp;" + equstr + "&nbsp;" + nargs[1] + "<sub>&nbsp;</sub>"; // last sub for line height fix
                    } else {
                        nstr = "";
                    }
                    return [str, nstr];
                };
                var rs = genBlendString(0);
                var gs = genBlendString(1);
                var bs = genBlendString(2);
                var as = genBlendString(3);
                var blendingLine2 = doc.createElement("div");
                blendingLine2.className = "pixelhistory-blending pixelhistory-blending-equ";
                blendingLine2.innerHTML = rs[0] + "<br/>" + gs[0] + "<br/>" + bs[0] + "<br/>" + as[0];
                colorsLine.appendChild(blendingLine2);
                if (hasPixelValues) {
                    var blendingLine1 = doc.createElement("div");
                    blendingLine1.className = "pixelhistory-blending pixelhistory-blending-values";
                    blendingLine1.innerHTML = rs[1] + "<br/>" + gs[1] + "<br/>" + bs[1] + "<br/>" + as[1];
                    colorsLine.appendChild(blendingLine1);
                }
            } else {
                var blendingLine = doc.createElement("div");
                blendingLine.className = "pixelhistory-blending";
                blendingLine.innerHTML = "blending disabled";
                colorsLine.appendChild(blendingLine);
            }

            gli.ui.appendClear(colorsLine);
            panel.appendChild(colorsLine);
        }

        return panel;
    };

    PixelHistory.prototype.addClear = function (gl, frame, call) {
        var panel = this.addPanel(gl, frame, call);

        //
    };

    PixelHistory.prototype.addDraw = function (gl, frame, call) {
        var panel = this.addPanel(gl, frame, call);

        //
    };

    function clearColorBuffer(gl) {
        var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
        var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        gl.colorMask(true, true, true, true);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
        gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
    };

    function getPixelRGBA(ctx) {
        var imageData = null;
        try {
            imageData = ctx.getImageData(0, 0, 1, 1);
        } catch (e) {
            // Likely a security error due to cross-domain dirty flag set on the canvas
        }
        if (imageData) {
            var r = imageData.data[0] / 255.0;
            var g = imageData.data[1] / 255.0;
            var b = imageData.data[2] / 255.0;
            var a = imageData.data[3] / 255.0;
            return [r, g, b, a];
        } else {
            console.log("unable to read back pixel");
            return null;
        }
    };

    function readbackRGBA(canvas, gl, x, y) {
        // NOTE: this call may fail due to security errors
        var pixel = new Uint8Array(4);
        try {
            gl.readPixels(x, canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel;
        } catch (e) {
            console.log("unable to read back pixel");
            return null;
        }
    };

    function readbackPixel(canvas, gl, doc, x, y) {
        var readbackCanvas = doc.createElement("canvas");
        readbackCanvas.width = readbackCanvas.height = 1;
        var frag = doc.createDocumentFragment();
        frag.appendChild(readbackCanvas);
        var ctx = readbackCanvas.getContext("2d");

        // First attempt to read the pixel the fast way
        var pixel = readbackRGBA(canvas, gl, x, y);
        if (pixel) {
            // Fast - write to canvas and return
            var imageData = ctx.createImageData(1, 1);
            imageData.data[0] = pixel[0];
            imageData.data[1] = pixel[1];
            imageData.data[2] = pixel[2];
            imageData.data[3] = pixel[3];
            ctx.putImageData(imageData, 0, 0);
        } else {
            // Slow - blit entire canvas
            ctx.clearRect(0, 0, 1, 1);
            ctx.drawImage(canvas, x, y, 1, 1, 0, 0, 1, 1);
        }

        return readbackCanvas;
    };

    function gatherInterestingResources(gl, resourcesUsed) {
        var markResourceUsed = null;
        markResourceUsed = function (resource) {
            if (resourcesUsed.indexOf(resource) == -1) {
                resourcesUsed.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    markResourceUsed(dependentResources[n]);
                }
            }
        };

        var currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        if (currentProgram) {
            markResourceUsed(currentProgram.trackedObject);
        }

        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        var maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            var tex2d = gl.getParameter(gl.TEXTURE_BINDING_2D);
            if (tex2d) {
                markResourceUsed(tex2d.trackedObject);
            }
            var texCube = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
            if (texCube) {
                markResourceUsed(texCube.trackedObject);
            }
        }
        gl.activeTexture(originalActiveTexture);

        var indexBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (indexBuffer) {
            markResourceUsed(indexBuffer.trackedObject);
        }

        var vertexBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        if (vertexBuffer) {
            markResourceUsed(vertexBuffer.trackedObject);
        }
        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttrs; n++) {
            vertexBuffer = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            if (vertexBuffer) {
                markResourceUsed(vertexBuffer.trackedObject);
            }
        }
    };

    PixelHistory.prototype.beginLoading = function () {
        var doc = this.browserWindow.document;
        doc.body.style.cursor = "wait !important";
        this.elements.innerDiv.appendChild(this.loadingMessage);
    };

    PixelHistory.prototype.endLoading = function () {
        var doc = this.browserWindow.document;
        doc.body.style.cursor = "";
        this.elements.innerDiv.removeChild(this.loadingMessage);
    };

    PixelHistory.prototype.inspectPixel = function (frame, x, y, locationString) {
        var self = this;
        var doc = this.browserWindow.document;
        doc.title = "Pixel History: " + locationString;

        this.current = {
            frame: frame,
            x: x,
            y: y,
            locationString: locationString
        };

        this.clearPanels();
        this.beginLoading();

        gli.host.setTimeout(function () {
            self.inspectPixelCore(frame, x, y);
        }, 20);
    };

    PixelHistory.prototype.inspectPixelCore = function (frame, x, y) {
        var doc = this.browserWindow.document;

        var width = frame.canvasInfo.width;
        var height = frame.canvasInfo.height;

        var canvas1 = this.canvas1;
        var canvas2 = this.canvas2;
        canvas1.width = width; canvas1.height = height;
        canvas2.width = width; canvas2.height = height;
        var gl1 = this.gl1;
        var gl2 = this.gl2;

        // Canvas 1: no texture data, faked fragment shaders - for draw detection
        // Canvas 2: full playback - for color information

        // Prepare canvas 1 and hack all the programs
        var pass1Shader =
            "precision highp float;" +
            "void main() {" +
            "    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);" +
            "}";
        canvas1.width = 1; canvas1.width = width;
        frame.switchMirrors("pixelhistory1");
        frame.makeActive(gl1, false, {
            ignoreTextureUploads: true,
            fragmentShaderOverride: pass1Shader
        });

        // Issue all calls, read-back to detect changes, and mark the relevant calls
        var writeCalls = [];
        var resourcesUsed = [];
        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];

            var needReadback = false;
            switch (call.name) {
                case "clear":
                    // Only deal with clears that affect the color buffer
                    if (call.args[0] & gl1.COLOR_BUFFER_BIT) {
                        needReadback = true;
                    }
                    break;
                case "drawArrays":
                case "drawElements":
                    needReadback = true;
                    break;
            }
            // If the current framebuffer is not the default one, skip the call
            // TODO: support pixel history on other framebuffers?
            if (gl1.getParameter(gl1.FRAMEBUFFER_BINDING)) {
                needReadback = false;
            }

            if (needReadback) {
                // Clear color buffer only (we need depth buffer to be valid)
                clearColorBuffer(gl1);
            }

            function applyPass1Call() {
                var originalBlendEnable = null;
                var originalColorMask = null;
                var unmungedColorClearValue = null;
                if (needReadback) {
                    // Disable blending during draws
                    originalBlendEnable = gl1.isEnabled(gl1.BLEND);
                    gl1.disable(gl1.BLEND);

                    // Enable all color channels to get fragment output
                    originalColorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
                    gl1.colorMask(true, true, true, true);

                    // Clear calls get munged so that we make sure we can see their effects
                    if (call.name == "clear") {
                        unmungedColorClearValue = gl1.getParameter(gl1.COLOR_CLEAR_VALUE);
                        gl1.clearColor(1, 1, 1, 1);
                    }
                }

                // Issue call
                call.emit(gl1);

                if (needReadback) {
                    // Restore blend mode
                    if (originalBlendEnable != null) {
                        if (originalBlendEnable) {
                            gl1.enable(gl1.BLEND);
                        } else {
                            gl1.disable(gl1.BLEND);
                        }
                    }

                    // Restore color mask
                    if (originalColorMask) {
                        gl1.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
                    }

                    // Restore clear color
                    if (unmungedColorClearValue) {
                        gl1.clearColor(unmungedColorClearValue[0], unmungedColorClearValue[1], unmungedColorClearValue[2], unmungedColorClearValue[3]);
                    }
                }
            };
            applyPass1Call();

            var isWrite = false;
            function checkForPass1Write(isDepthDiscarded) {
                var rgba = readbackRGBA(canvas1, gl1, x, y);
                if (rgba && (rgba[0])) {
                    // Call had an effect!
                    isWrite = true;
                    call.history = {};
                    call.history.isDepthDiscarded = isDepthDiscarded;
                    call.history.colorMask = gl1.getParameter(gl1.COLOR_WRITEMASK);
                    call.history.blendEnabled = gl1.isEnabled(gl1.BLEND);
                    call.history.blendEquRGB = gl1.getParameter(gl1.BLEND_EQUATION_RGB);
                    call.history.blendEquAlpha = gl1.getParameter(gl1.BLEND_EQUATION_ALPHA);
                    call.history.blendSrcRGB = gl1.getParameter(gl1.BLEND_SRC_RGB);
                    call.history.blendSrcAlpha = gl1.getParameter(gl1.BLEND_SRC_ALPHA);
                    call.history.blendDstRGB = gl1.getParameter(gl1.BLEND_DST_RGB);
                    call.history.blendDstAlpha = gl1.getParameter(gl1.BLEND_DST_ALPHA);
                    call.history.blendColor = gl1.getParameter(gl1.BLEND_COLOR);
                    writeCalls.push(call);

                    // Stash off a bunch of useful resources
                    gatherInterestingResources(gl1, resourcesUsed);
                }
            };
            if (needReadback) {
                checkForPass1Write(false);
            }

            if (needReadback) {
                // If we are looking for depth discarded pixels and we were not picked up as a write, try again
                // NOTE: we only need to do this if depth testing is enabled!
                var isDepthTestEnabled = gl1.isEnabled(gl1.DEPTH_TEST);
                var isDraw = false;
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        isDraw = true;
                        break;
                }
                if (isDraw && isDepthTestEnabled && !isWrite && gli.settings.session.showDepthDiscarded) {
                    // Reset depth test settings
                    var originalDepthTest = gl1.isEnabled(gl1.DEPTH_TEST);
                    var originalDepthMask = gl1.getParameter(gl1.DEPTH_WRITEMASK);
                    gl1.disable(gl1.DEPTH_TEST);
                    gl1.depthMask(false);

                    // Call again
                    applyPass1Call();

                    // Restore depth test settings
                    if (originalDepthTest) {
                        gl1.enable(gl1.DEPTH_TEST);
                    } else {
                        gl1.disable(gl1.DEPTH_TEST);
                    }
                    gl1.depthMask(originalDepthMask);

                    // Check for write
                    checkForPass1Write(true);
                }
            }
        }

        // TODO: cleanup canvas 1 resources?

        // Find resources that were not used so we can exclude them
        var exclusions = [];
        // TODO: better search
        for (var n = 0; n < frame.resourcesUsed.length; n++) {
            var resource = frame.resourcesUsed[n];
            var typename = glitypename(resource.target);
            switch (typename) {
                case "WebGLTexture":
                case "WebGLProgram":
                case "WebGLShader":
                case "WebGLBuffer":
                    if (resourcesUsed.indexOf(resource) == -1) {
                        // Not used - exclude
                        exclusions.push(resource);
                    }
                    break;
            }
        }

        // Prepare canvas 2 for pulling out individual contribution
        canvas2.width = 1; canvas2.width = width;
        frame.switchMirrors("pixelhistory2");
        frame.makeActive(gl2, false, null, exclusions);

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var isWrite = writeCalls.indexOf(call) >= 0;

            // Ignore things that don't affect this pixel
            var ignore = false;
            if (!isWrite) {
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        ignore = true;
                        break;
                }
            }
            if (ignore) {
                continue;
            }

            var originalBlendEnable = null;
            var originalColorMask = null;
            if (isWrite) {
                // Clear color buffer only (we need depth buffer to be valid)
                clearColorBuffer(gl2);

                // Disable blending during draws
                originalBlendEnable = gl2.isEnabled(gl2.BLEND);
                gl2.disable(gl2.BLEND);

                // Enable all color channels to get fragment output
                originalColorMask = gl2.getParameter(gl2.COLOR_WRITEMASK);
                gl2.colorMask(true, true, true, true);
            }

            call.emit(gl2);

            if (isWrite) {
                // Restore blend mode
                if (originalBlendEnable != null) {
                    if (originalBlendEnable) {
                        gl2.enable(gl2.BLEND);
                    } else {
                        gl2.disable(gl2.BLEND);
                    }
                }

                // Restore color mask
                if (originalColorMask) {
                    gl2.colorMask(originalColorMask[0], originalColorMask[1], originalColorMask[2], originalColorMask[3]);
                }
            }

            if (isWrite) {
                // Read back the written fragment color
                call.history.self = readbackPixel(canvas2, gl2, doc, x, y);
            }
        }

        // Prepare canvas 2 for pulling out blending before/after
        canvas2.width = 1; canvas2.width = width;
        frame.makeActive(gl2, false, null, exclusions);

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            var isWrite = writeCalls.indexOf(call) >= 0;

            // Ignore things that don't affect this pixel
            var ignore = false;
            if (!isWrite) {
                switch (call.name) {
                    case "drawArrays":
                    case "drawElements":
                        ignore = true;
                        break;
                }
            }
            if (ignore) {
                continue;
            }

            if (isWrite) {
                // Read prior color
                call.history.pre = readbackPixel(canvas2, gl2, doc, x, y);
            }

            call.emit(gl2);

            if (isWrite) {
                // Read new color
                call.history.post = readbackPixel(canvas2, gl2, doc, x, y);
            }

            if (isWrite) {
                switch (call.name) {
                    case "clear":
                        this.addClear(gl2, frame, call);
                        break;
                    case "drawArrays":
                    case "drawElements":
                        this.addDraw(gl2, frame, call);
                        break;
                }
            }
        }

        // TODO: cleanup canvas 2 resources?

        // Restore all resource mirrors
        frame.switchMirrors(null);

        this.endLoading();
    };

    ui.PixelHistory = PixelHistory;
})();
