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
	typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;

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
                    return matches[1];
                }
            }
            
            // [object Foo]
            matches = mangled.match(/\[object (.+)\]/);
            if (matches) {
                return matches[1];
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
                var sourceView = new DataView(arg, 0, source.byteLength);
                var targetView = new DataView(target, 0, target.byteLength);
                for (var n = 0; n < source.byteLength; n++) {
                    targetView.setUInt8(n, sourceView.getUInt8(n));
                }
                return target;
            } else if (arg.__proto__.__proto__.constructor.toString().indexOf("ArrayBufferView") > 0) {
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
                } else if (arg instanceof Float64Array) {
                    target = new Float64Array(arg);
                } else {
                    target = arg;
                }
                return target;
            } else if (arg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
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
    
    hacks.installMissingConstants = function (gl) {
        
        // HACK: due to some missing constants in ff, ensure that they are present before we do anything
        // https://bugzilla.mozilla.org/show_bug.cgi?id=611924
        
        if (!gl.VIEWPORT) {
            gl.VIEWPORT = 0x0BA2;
        }
        
    };

    hacks.installANGLEStateLookaside = function (gl) {

        // HACK: due to an ANGLE bug, we don't get the values for enable/disable caps
        // http://code.google.com/p/angleproject/issues/detail?id=69

        var brokenEnums = ["BLEND", "CULL_FACE", "DEPTH_TEST", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"];

        // All default to false except DITHER
        gl.boolLookaside = {};
        for (var n = 0; n < brokenEnums.length; n++) {
            gl.boolLookaside[gl[brokenEnums[n]]] = false;
        }
        gl.boolLookaside[gl.DITHER] = true;

        // Snoop enable()/disable()
        var originalEnable = gl.enable;
        gl.enable = function (cap) {
            this.boolLookaside[cap] = true;
            return originalEnable.apply(this, arguments);
        };
        var originalDisable = gl.disable;
        gl.disable = function (cap) {
            this.boolLookaside[cap] = false;
            return originalDisable.apply(this, arguments);
        };

        // Wrap getParameter() to use our lookaside when required
        var originalGetParameter = gl.getParameter;
        gl.getParameter = function (cap) {
            if (gl.boolLookaside[cap] !== undefined) {
                return gl.boolLookaside[cap];
            } else {
                return originalGetParameter.apply(gl, arguments);
            }
        };

    };
    
    hacks.installAll = function (gl) {
        hacks.installMissingConstants(gl);
        hacks.installANGLEStateLookaside(gl);
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
            if ((listener.target === target) && (listener.callback === callback)) {
                this.listeners.splice(n, 1);
                break;
            }
        }
    };

    EventSource.prototype.fire = function () {
        for (var n = 0; n < this.listeners.length; n++) {
            var listener = this.listeners[n];
            try {
                listener.callback.apply(listener.target, arguments);
            } catch (e) {
                console.log("exception thrown in target of event " + this.name + ": " + e);
            }
        }
    };

    EventSource.prototype.fireDeferred = function () {
        var self = this;
        var args = arguments;
        setTimeout(function () {
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
        // TODO: flags
            new FunctionInfo(gl, "clear", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.ULONG))
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
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"])),
                new FunctionParam(gl, "first", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG))
            ], FunctionType.DRAW),
            new FunctionInfo(gl, "drawElements", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"])),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT"])),
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
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
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
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["ACTIVE_TEXTURE", "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "ALPHA_BITS", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "BLUE_BITS", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "COMPRESSED_TEXTURE_FORMATS", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_BITS", "DEPTH_CLEAR_VALUE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_TEST", "DEPTH_WRITEMASK", "DITHER", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "GREEN_BITS", "IMPLEMENTATION_COLOR_READ_FORMAT", "IMPLEMENTATION_COLOR_READ_TYPE", "LINE_WIDTH", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "MAX_CUBE_MAP_TEXTURE_SIZE", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_RENDERBUFFER_SIZE", "MAX_TEXTURE_IMAGE_UNITS", "MAX_TEXTURE_SIZE", "MAX_VARYING_VECTORS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VIEWPORT_DIMS", "NUM_COMPRESSED_TEXTURE_FORMATS", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RED_BITS", "RENDERBUFFER_BINDING", "RENDERER", "SAMPLE_BUFFERS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SAMPLES", "SCISSOR_BOX", "SCISSOR_TEST", "SHADING_LANGUAGE_VERSION", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_BITS", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "SUBPIXEL_BITS", "TEXTURE_BINDING_2D", "TEXTURE_BINDING_CUBE_MAP", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VENDOR", "VERSION", "VIEWPORT"]))
            ]),
            new FunctionInfo(gl, "getBufferParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["BUFFER_SIZE", "BUFFER_USAGE"]))
            ]),
            new FunctionInfo(gl, "getError", null, [
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
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"]))
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
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["GENERATE_MIPMAP_HINT"])),
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
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"])),
                new FunctionParam(gl, "param", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "texParameteri", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"])),
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

        functionInfos["texImage2D"].getArgs = function (call) {
            var args = [];
            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])));
            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
            if (call.args.length == 9) {
                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])));
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
                args.push(new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])));
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

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

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
            new StateParameter(gl, "FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "FRONT_FACE", false, new UIInfo(UIType.ENUM, ["CW", "CCW"])),
            new StateParameter(gl, "GENERATE_MIPMAP_HINT", false, new UIInfo(UIType.ENUM, ["FASTEST", "NICEST", "DONT_CARE"])),
            new StateParameter(gl, "GREEN_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "IMPLEMENTATION_COLOR_READ_FORMAT", true, new UIInfo(UIType.ULONG)),
            new StateParameter(gl, "IMPLEMENTATION_COLOR_READ_TYPE", true, new UIInfo(UIType.ULONG)),
            new StateParameter(gl, "LINE_WIDTH", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_CUBE_MAP_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_RENDERBUFFER_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VARYING_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_ATTRIBS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VIEWPORT_DIMS", true, new UIInfo(UIType.WH)),
            new StateParameter(gl, "NUM_COMPRESSED_TEXTURE_FORMATS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "PACK_ALIGNMENT", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "POLYGON_OFFSET_FACTOR", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "POLYGON_OFFSET_FILL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "POLYGON_OFFSET_UNITS", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "RED_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "RENDERBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "RENDERER", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "SAMPLE_ALPHA_TO_COVERAGE", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SAMPLE_BUFFERS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "SAMPLE_COVERAGE", false, new UIInfo(UIType.BOOL)),
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

    gli.UIType = UIType;
    gli.FunctionType = FunctionType;
    //info.functions - deferred
    //info.stateParameters - deferred

    info.initialize = function (gl) {
        setupFunctionInfos(gl);
        setupStateParameters(gl);
    };
})();
(function () {
    var controls = glinamespace("gli.controls");

    var SplitterBar = function (parentElement, direction, minValue, maxValue, customStyle, changeCallback) {
        var self = this;

        var el = this.el = document.createElement("div");
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
            document.addEventListener("mousemove", mouseMove, true);
            document.addEventListener("mouseup", mouseUp, true);
            if (direction == "horizontal") {
                document.body.style.cursor = "n-resize";
            } else {
                document.body.style.cursor = "e-resize";
            }
        };

        function endResize() {
            document.removeEventListener("mousemove", mouseMove, true);
            document.removeEventListener("mouseup", mouseUp, true);
            document.body.style.cursor = "";
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
            enableTimeline: false,
            hudVisible: false,
            hudHeight: 275,
            traceSplitter: 240,
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
        
        // When this timeout gets called we can be pretty sure we are done with the current frame
        setTimeout(function () {
            frameEnded(context);
        }, 0);
    };

    function arrayCompare(a, b) {
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
            var activeTexture = this.stateCache["ACTIVE_TEXTURE"];
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
        useProgram: function (program) {
            this.stateCache["CURRENT_PROGRAM"] = program;
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
            var activeTexture = this.stateCache["ACTIVE_TEXTURE"];
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
            return
            (this.stateCache["BLEND_SRC_RGB"] == sfactor) && (this.stateCache["BLEND_SRC_ALPHA"] == sfactor) &&
            (this.stateCache["BLEND_DST_RGB"] == dfactor) && (this.stateCache["BLEND_DST_ALPHA"] == dfactor);
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            return
            (this.stateCache["BLEND_SRC_RGB"] == srcRGB) && (this.stateCache["BLEND_SRC_ALPHA"] == srcAlpha) &&
            (this.stateCache["BLEND_DST_RGB"] == dstRGB) && (this.stateCache["BLEND_DST_ALPHA"] == dstAlpha);
        },
        clearColor: function (red, green, blue, alpha) {
            return arrayCompare(this.stateCache["COLOR_CLEAR_VALUE"], [red, green, blue, alpha]);
        },
        clearDepth: function (depth) {
            return this.stateCache["DEPTH_CLEAR_VALUE"] == depth;
        },
        clearStencil: function (s) {
            return this.stateCache["STENCIL_CLEAR_VALUE"] == s;
        },
        colorMask: function (red, green, blue, alpha) {
            return arrayCompare(this.stateCache["COLOR_WRITEMASK"], [red, green, blue, alpha]);
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
            return arrayCompare(this.stateCache["DEPTH_RANGE"], [zNear, zFar]);
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
            return arrayCompare(this.stateCache["SCISSOR_BOX"], [x, y, width, height]);
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
                    return
                    (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) &&
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
            return
            (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
            (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    return (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass);
                case this.BACK:
                    return (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
                case this.FRONT_AND_BACK:
                    return
                    (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
                    (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
            }
        },
        useProgram: function (program) {
            return this.stateCache["CURRENT_PROGRAM"] == program;
        },
        viewport: function (x, y, width, height) {
            return arrayCompare(this.stateCache["VIEWPORT"], [x, y, width, height]);
        }
    };

    function wrapFunction(context, functionName) {
        var originalFunction = context.rawgl[functionName];
        var redundantCheck = redundantChecks[functionName];
        var stateCacheModifier = stateCacheModifiers[functionName];
        var statistics = context.statistics;
        var callsPerFrame = statistics.callsPerFrame;
        var redundantCalls = statistics.redundantCalls;
        return function () {
            var gl = context.rawgl;

            var stack = null;
            function generateStack() {
                // Generate stack trace
                var stack = printStackTrace();
                // ignore garbage
                stack = stack.slice(4);
                // Fix up our type
                stack[0] = stack[0].replace("[object Object].", "gl.");
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
                call = context.currentFrame.allocateCall(functionName, stack, arguments);
            }

            callsPerFrame.value++;

            // Redundant call tracking
            if (redundantCheck && redundantCheck.apply(context, arguments)) {
                if (call) {
                    call.isRedundant = true;
                }
                // Add to aggregate stats
                redundantCalls.value++;
                // TODO: mark up per-call stats
            }
            
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

            // If the call modifies state, cache the right value
            if (stateCacheModifier) {
                stateCacheModifier.apply(context, arguments);
            }

            // POST:
            if (context.captureFrame) {
                call.complete(result, error);
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

        this.frameCompleted = new gli.EventSource("frameCompleted");

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // NOTE: this should also happen really early, but after hacks
        gli.installExtensions(rawgl);

        // Setup frame terminator callback
        var ext = rawgl.getExtension("GLI_frame_terminator");
        ext.frameEvent.addListener(this, function () {
            frameEnded(this);
        });

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

        // Used by redundant state lookup code
        this.stateCache = {};
        var stateParameters = ["ACTIVE_TEXTURE", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "CULL_FACE", "CULL_FACE_MODE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_WRITEMASK", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "LINE_WIDTH", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RENDERBUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SCISSOR_BOX", "SCISSOR_TEST", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VIEWPORT"];
        for (var n = 0; n < stateParameters.length; n++) {
            try {
                this.stateCache[stateParameters[n]] = rawgl.getParameter(rawgl[stateParameters[n]]);
            } catch (e) {
                // Ignored
            }
        }
        var maxTextureUnits = rawgl.getParameter(rawgl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            this.stateCache["TEXTURE_BINDING_2D_" + n] = null;
            this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + n] = null;
        }
        var maxVertexAttribs = rawgl.getParameter(rawgl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = false;
        }

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

        var frame = new gli.host.Frame(this.rawgl, frameNumber);
        frame.resourceVersions = this.resources.captureVersions();
        this.currentFrame = frame;
    };

    CaptureContext.prototype.requestCapture = function (callback) {
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    host.CaptureContext = CaptureContext;

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
            { name: "NUM_COMPRESSED_TEXTURE_FORMATS" },
            { name: "PACK_ALIGNMENT" },
            { name: "POLYGON_OFFSET_FACTOR" },
            { name: "POLYGON_OFFSET_FILL" },
            { name: "POLYGON_OFFSET_UNITS" },
            { name: "RED_BITS" },
            { name: "RENDERBUFFER_BINDING" },
            { name: "RENDERER" },
            { name: "SAMPLE_ALPHA_TO_COVERAGE" },
            { name: "SAMPLE_BUFFERS" },
            { name: "SAMPLE_COVERAGE" },
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

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
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

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
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
        gl.stencilFuncSeparate(gl.FRONT, this[gl.STENCIL_BACK_FUNC], this[gl.STENCIL_BACK_REF], this[gl.STENCIL_VALUE_BACK_MASK]);
        gl.stencilOpSeparate(gl.FRONT, this[gl.STENCIL_FAIL], this[gl.STENCIL_PASS_DEPTH_FAIL], this[gl.STENCIL_PASS_DEPTH_PASS]);
        gl.stencilOpSeparate(gl.BACK, this[gl.STENCIL_BACK_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_PASS]);
        gl.stencilMaskSeparate(this[gl.STENCIL_WRITEMASK], this[gl.STENCIL_BACK_WRITEMASK]);

        gl.hint(gl.GENERATE_MIPMAP_HINT, this[gl.GENERATE_MIPMAP_HINT]);

        gl.pixelStorei(gl.PACK_ALIGNMENT, this[gl.PACK_ALIGNMENT]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this[gl.UNPACK_ALIGNMENT]);
        //gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this[gl.UNPACK_COLORSPACE_CONVERSION_WEBGL]); ////////////////////// NOT YET SUPPORTED IN SOME BROWSERS
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this[gl.UNPACK_FLIP_Y_WEBGL]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this[gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

        gl.useProgram(getTargetValue(this[gl.CURRENT_PROGRAM]));

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
            gl.bindBuffer(gl.ARRAY_BUFFER, getTargetValue(values[gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING]));
            gl.vertexAttribPointer(n, values[gl.VERTEX_ATTRIB_ARRAY_SIZE], values[gl.VERTEX_ATTRIB_ARRAY_TYPE], values[gl.VERTEX_ATTRIB_ARRAY_NORMALIZED], values[gl.VERTEX_ATTRIB_ARRAY_STRIDE], values[0]);
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

    var Call = function (ordinal, type, name, stack, sourceArgs, frame) {
        this.ordinal = ordinal;
        this.time = (new Date()).getTime();

        this.type = type;
        this.name = name;
        this.stack = stack;

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

    Call.prototype.complete = function (result, error) {
        this.duration = (new Date()).getTime() - this.time;
        this.result = result;
        this.error = error;
    };

    var Frame = function (rawgl, frameNumber) {
        this.frameNumber = frameNumber;
        this.initialState = new gli.host.StateSnapshot(rawgl);
        this.screenshot = null;

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

        // Initialized later
        this.resourceVersions = null;
    };

    Frame.prototype.end = function (rawgl) {
        var canvas = rawgl.canvas;

        // Take a picture! Note, this may fail for many reasons, but seems ok right now
        this.screenshot = document.createElement("canvas");
        this.screenshot.width = canvas.width;
        this.screenshot.height = canvas.height;
        var ctx2d = this.screenshot.getContext("2d");
        ctx2d.drawImage(canvas, 0, 0);
    };

    Frame.prototype.mark = function (args) {
        var call = new Call(this.calls.length, CallType.MARK, "mark", null, args);
        this.calls.push(call);
        call.complete(undefined, undefined); // needed?
        return call;
    };

    Frame.prototype.allocateCall = function (name, stack, args) {
        var call = new Call(this.calls.length, CallType.GL, name, stack, args, this);
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

    Frame.prototype.makeActive = function (gl) {

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

            // TODO: faster lookup
            var version = null;
            for (var m = 0; m < this.resourceVersions.length; m++) {
                if (this.resourceVersions[m].resource.id === resource.id) {
                    version = this.resourceVersions[m].value;
                    break;
                }
            }

            resource.restoreVersion(gl, version);
        }

        this.initialState.apply(gl);
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

        // Keep the UI at the bottom of the page even if scrolling
        document.addEventListener("scroll", function () {
            w.style.bottom = -window.pageYOffset + "px";
        }, false);

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
    };

    var PopupWindow = function (context) {
        var self = this;
        this.context = context;

        gli.settings.session.hudVisible = true;
        gli.settings.save();

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=1000,innerHeight=350");
        w.document.writeln("<html><head><title>WebGL Inspector</title></head><body style='margin: 0px; padding: 0px;'></body></html>");

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

        w.gli = window.gli;

        if (window["gliloader"]) {
            gliloader.load(["ui_css"], function () { }, w);
        }

        setTimeout(function () {
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

        window.setTimeout(function () {
            var hudVisible = gli.settings.session.hudVisible || gli.settings.global.showHud;
            requestFullUI(context, !hudVisible);
        }, 50);
    };

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
            clearTimeout(this.hideTimeout);
            this.hideTimeout = -1;
        }
        this.hideTimeout = setTimeout(function() {
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
        var call = new gli.host.Call(this.calls.length, gli.host.CallType.GL, name, null, args);
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
            target: null,
            version: null
        };

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

    Resource.prototype.restoreVersion = function (gl, version) {
        if (this.mirror.version != version) {
            this.mirror.version = version;

            this.disposeMirror(gl);
            this.mirror.target = this.createTarget(gl, version);
            this.mirror.target.trackedObject = this;
        } else {
            // Already at the current version
        }
    };

    Resource.prototype.disposeMirror = function (gl) {
        if (this.mirror.target) {
            this.deleteTarget(gl, this.mirror.target);
            this.mirror.target = null;
        }
    };

    Resource.prototype.createTarget = function (gl, version) {
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
                cache.registerResource(tracked);
                return result;
            };
            var originalDelete = gl["delete" + typeName];
            gl["delete" + typeName] = function () {
                // Track object count
                gl.statistics[typeName.toLowerCase() + "Count"].value--;
                
                var tracked = arguments[0].trackedObject;
                
                // Track total buffer and texture bytes consumed
                if (typeName == "Buffer") {
                    gl.statistics.bufferBytes.value -= tracked.estimatedSize;
                } else if (typeName == "Texture") {
                    gl.statistics.textureBytes.value -= tracked.estimatedSize;
                }
                
                tracked.markDeleted(generateStack());
                originalDelete.apply(gl, arguments);
            };
        };

        captureCreateDelete("Buffer");
        captureCreateDelete("Framebuffer");
        captureCreateDelete("Program");
        captureCreateDelete("Renderbuffer");
        captureCreateDelete("Shader");
        captureCreateDelete("Texture");

        resources.Buffer.setCaptures(gl);
        resources.Framebuffer.setCaptures(gl);
        resources.Program.setCaptures(gl);
        resources.Renderbuffer.setCaptures(gl);
        resources.Shader.setCaptures(gl);
        resources.Texture.setCaptures(gl);
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

    //(typename.indexOf("WebGLFramebuffer") >= 0) ||
    //(typename.indexOf("WebGLRenderbuffer") >= 0) ||
    //(typename.indexOf("WebGLShader") >= 0) ||

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
            case gl.ARRAY_BUFFER:
                bindingEnum = gl.ARRAY_BUFFER_BINDING;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                bindingEnum = gl.ELEMENT_ARRAY_BUFFER_BINDING;
                break;
        }
        var glbuffer = gl.getParameter(bindingEnum);
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
            tracked.refresh(gl);
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
                var glelementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
                drawState.elementArrayBuffer = glelementArrayBuffer ? glelementArrayBuffer.trackedObject : null;
                drawState.elementArrayBufferType = arguments[2];
                drawState.offset = arguments[3];
                drawState.count = arguments[1];
            }

            // TODO: cache all draw state so that we don't have to query each time
            var rawgl = gl.rawgl;
            var allDatas = {};
            var allBuffers = [];
            for (var n = 0; n < maxVertexAttribs; n++) {
                if (rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED)) {
                    var glbuffer = rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
                    var buffer = glbuffer.trackedObject;
                    if (buffer.currentVersion.structure) {
                        continue;
                    }

                    var size = rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
                    var stride = rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
                    var offset = rawgl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
                    var type = rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
                    var normalized = rawgl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);

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
            assignDrawStructure(arguments);

            // Track draw stats
            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[2]);
            gl.statistics.drawsPerFrame.value++;
            gl.statistics.primitivesPerFrame.value += totalPrimitives;

            return origin_drawArrays.apply(gl, arguments);
        };

        var origin_drawElements = gl.drawElements;
        gl.drawElements = function () {
            //void drawElements(GLenum mode, GLsizei count, GLenum type, GLsizeiptr offset);
            assignDrawStructure(arguments);

            // Track draw stats
            var totalPrimitives = calculatePrimitiveCount(gl, arguments[0], arguments[1]);
            gl.statistics.drawsPerFrame.value++;
            gl.statistics.primitivesPerFrame.value += totalPrimitives

            return origin_drawElements.apply(gl, arguments);
        };
    };

    Buffer.prototype.createTarget = function (gl, version) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(version.target, buffer);

        this.replayCalls(gl, version, buffer);

        return buffer;
    };

    Buffer.prototype.deleteTarget = function (gl, target) {
        gl.deleteBuffer(target);
    };

    Buffer.prototype.constructVersion = function (gl, version) {
        // TODO: construct entire buffer by applying the calls ourselves - today, we just take the first bufferData...
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            if (call.name == "bufferData") {
                var sourceArray = call.args[1];
                if (sourceArray.constructor == Number) {
                    // Size
                    return new ArrayBuffer(0);
                } else {
                    // Has to be an ArrayBuffer or ArrayBufferView
                    return sourceArray;
                }
            }
        }
        return [];
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
        this.parameters[gl.INFO_LOG_LENGTH] = 0;
        this.parameters[gl.ATTACHED_SHADERS] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTES] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTE_MAX_LENGTH] = 0;
        this.parameters[gl.ACTIVE_UNIFORMS] = 0;
        this.parameters[gl.ACTIVE_UNIFORM_MAX_LENGTH] = 0;
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

    Program.prototype.refresh = function (gl) {
        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.INFO_LOG_LENGTH, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_ATTRIBUTE_MAX_LENGTH, gl.ACTIVE_UNIFORMS, gl.ACTIVE_UNIFORM_MAX_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);
    };

    Program.setCaptures = function (gl) {
        var original_attachShader = gl.attachShader;
        gl.attachShader = function () {
            var tracked = arguments[0].trackedObject;
            var trackedShader = arguments[1].trackedObject;
            tracked.shaders.push(trackedShader);
            tracked.parameters[gl.ATTACHED_SHADERS]++;
            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("attachShader", arguments);
            return original_attachShader.apply(gl, arguments);
        };

        var original_detachShader = gl.detachShader;
        gl.detachShader = function () {
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
            return original_detachShader.apply(gl, arguments);
        };

        var original_linkProgram = gl.linkProgram;
        gl.linkProgram = function () {
            var tracked = arguments[0].trackedObject;
            var result = original_linkProgram.apply(gl, arguments);

            // Refresh params
            tracked.refresh(gl);

            // Grab uniforms
            tracked.uniformInfos = [];
            for (var n = 0; n < tracked.parameters[gl.ACTIVE_UNIFORMS]; n++) {
                var activeInfo = gl.getActiveUniform(tracked.target, n);
                if (activeInfo) {
                    var loc = gl.getUniformLocation(tracked.target, activeInfo.name);
                    var value = gli.util.clone(gl.getUniform(tracked.target, loc));
                    tracked.uniformInfos[n] = value;
                }
                gl.ignoreErrors();
            }

            // Grab attribs
            tracked.attribInfos = [];
            var remainingAttribs = tracked.parameters[gl.ACTIVE_ATTRIBUTES];
            var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            var attribIndex = 0;
            while (remainingAttribs > 0) {
                var activeInfo = gl.getActiveAttrib(tracked.target, attribIndex);
                if (activeInfo && activeInfo.type) {
                    remainingAttribs--;
                    var loc = gl.getAttribLocation(tracked.target, activeInfo.name);
                    tracked.attribInfos.push({
                        index: attribIndex,
                        loc: loc,
                        name: activeInfo.name
                    });
                }
                gl.ignoreErrors();
                attribIndex++;
                if (attribIndex >= maxAttribs) {
                    break;
                }
            }

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

    Program.prototype.createTarget = function (gl, version) {
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
        this.parameters[gl.INFO_LOG_LENGTH] = 0;
        this.parameters[gl.SHADER_SOURCE_LENGTH] = 0;
        this.infoLog = null;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
    };

    Shader.prototype.refresh = function (gl) {
        var paramEnums = [gl.SHADER_TYPE, gl.DELETE_STATUS, gl.COMPILE_STATUS, gl.INFO_LOG_LENGTH, gl.SHADER_SOURCE_LENGTH];
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

    Shader.prototype.createTarget = function (gl, version) {
        var shader = gl.createShader(version.target);

        this.replayCalls(gl, version, shader);

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
        var gltexture = gl.getParameter(bindingEnum);
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
                pushPixelStoreState(gl, tracked.currentVersion);
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
                pushPixelStoreState(gl, tracked.currentVersion);
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
    Texture.prototype.createTarget = function (gl, version, face) {
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
        try {
            if (canvas.getContextRaw) {
                this.output.gl = canvas.getContextRaw("experimental-webgl");
            } else {
                this.output.gl = canvas.getContext("experimental-webgl");
            }
        } catch (e) {
            // ?
            alert("Unable to create replay canvas: " + e);
        }
        gli.hacks.installAll(this.output.gl);
        gli.info.initialize(this.output.gl);
    };

    Controller.prototype.reset = function () {
        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;
    };

    Controller.prototype.getCurrentState = function () {
        return new gli.host.StateSnapshot(this.output.gl);
    };

    Controller.prototype.openFrame = function (frame) {
        var gl = this.output.gl;

        this.currentFrame = frame;

        frame.makeActive(gl);

        this.beginStepping();
        this.callIndex = 0;
        this.endStepping();
    };

    function emitMark(mark) {
        console.log("mark hit");
    };

    function emitCall(gl, call) {
        var args = [];
        for (var n = 0; n < call.args.length; n++) {
            args[n] = call.args[n];

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

        // TODO: handle result?
        gl[call.name].apply(gl, args);
        //console.log("call " + call.name);
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
                emitCall(gl, call);
                break;
        }

        return true;
    };

    Controller.prototype.beginStepping = function () {
        this.stepping = true;
    };

    Controller.prototype.endStepping = function () {
        this.stepping = false;
        this.stepCompleted.fire();
    };

    Controller.prototype.stepUntil = function (callIndex) {
        if (this.callIndex > callIndex) {
            var frame = this.currentFrame;
            this.reset();
            this.openFrame(frame);
        }
        this.beginStepping();
        while (this.callIndex <= callIndex) {
            if (this.issueCall()) {
                this.callIndex++;
            } else {
                this.endStepping();
                return false;
            }
        }
        this.endStepping();
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
        this.openFrame(frame);

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
                var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
                gl.colorMask(true, true, true, true);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
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
        this.openFrame(frame);
        this.endStepping();
    };

    replay.Controller = Controller;

})();
(function () {
    var ui = glinamespace("gli.ui");

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
                buttonSpan.innerHTML = button.name;
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

        /*appendRightRegion("Filter: ", [
        {
        name: "All",
        onclick: function () {
        w.setActiveFilter(null);
        }
        },
        {
        name: "Alive",
        onclick: function () {
        w.setActiveFilter("alive");
        }
        },
        {
        name: "Dead",
        onclick: function () {
        w.setActiveFilter("dead");
        }
        },
        {
        name: "Current",
        onclick: function () {
        w.setActiveFilter("current");
        }
        }
        ]);*/
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
    function appendSeparator(el) {
        var div = document.createElement("div");
        div.className = "info-separator";
        el.appendChild(div);
        gli.ui.appendbr(el);
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
    ui.appendbr = appendbr;
    ui.appendSeparator = appendSeparator;
    ui.appendParameters = appendParameters;

    var Window = function (context, document, elementHost) {
        var self = this;
        this.context = context;
        this.document = document;

        this.root = writeDocument(document, elementHost);

        this.controller = new gli.replay.Controller();

        this.toolbar = new Toolbar(this);
        this.tabs = {};
        this.currentTab = null;

        this.activeVersion = null;
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
            if (self.texturePicker) {
                self.texturePicker.close();
            }
        }, false);

        window.setTimeout(function () {
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
    //     transparentCanvas: false
    // }

    var SurfaceInspector = function (view, w, elementRoot, options) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {
            toolbar: elementRoot.getElementsByClassName("surface-inspector-toolbar")[0],
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
        var selectionValues = options.selectionValues;
        if (selectionValues) {
            for (var n = 0; n < selectionValues.length; n++) {
                var selectionOption = document.createElement("option");
                selectionOption.innerHTML = selectionValues[n];
                optionsList.appendChild(selectionOption);
            }
        }
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

        this.sizingMode = "fit";
        this.resizeHACK = false;
        this.elements.view.style.overflow = "";

        this.activeOption = 0;

        setTimeout(function () {
            self.setupPreview();
            self.layout();
        }, 0);
    };

    SurfaceInspector.prototype.setupPreview = function () {
    };

    SurfaceInspector.prototype.updatePreview = function () {
    };

    SurfaceInspector.prototype.layout = function () {
        var size = this.querySize();
        if (!size) {
            return;
        }

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
                this.canvas.style.width = width + "px";
                this.canvas.style.height = height + "px";

                this.canvas.style.left = ((parentWidth / 2) - (width / 2)) + "px";
                this.canvas.style.top = ((parentHeight / 2) - (height / 2)) + "px";

                // HACK: force another layout because we may have changed scrollbar status
                if (this.resizeHACK) {
                    this.resizeHACK = false;
                } else {
                    this.resizeHACK = true;
                    this.layout();
                }
                break;
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
                if (anyMatches == false) {
                    if (value === undefined) {
                        text = "undefined";
                    } else {
                        text = "?? 0x" + value.toString(16) + " ??";
                    }
                }
                if (useEnumTips) {
                    tip = enumTip;
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

    function appendCallLine(gl, el, frame, call, resource) {
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
                appendCallLine(gl, rootEl, frame, call, resource);
            }
        }
    };

    ui.populateCallLine = populateCallLine;
    ui.appendHistoryLine = appendHistoryLine;
    ui.generateUsageList = generateUsageList;

})();
(function () {
    var ui = glinamespace("gli.ui");

    var TexturePreviewGenerator = function (canvas) {
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

        try {
            if (canvas.getContextRaw) {
                this.gl = canvas.getContextRaw("experimental-webgl");
            } else {
                this.gl = canvas.getContext("experimental-webgl");
            }
        } catch (e) {
            // ?
            alert("Unable to create texture preview canvas: " + e);
        }
        gli.hacks.installAll(this.gl);
        var gl = this.gl;

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

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

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
        gl.useProgram(program2d);
        var samplerUniform = gl.getUniformLocation(program2d, "u_sampler0");
        gl.uniform1i(samplerUniform, 0);

        var vertices = [
            -1, -1, 0, 1,
             1, -1, 1, 1,
            -1, 1, 0, 0,
            -1, 1, 0, 0,
             1, -1, 1, 1,
             1, 1, 1, 0
        ];
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        var positionAttr = gl.getAttribLocation(this.program2d, "a_position");
        gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 16, 0);
        var uvAttr = gl.getAttribLocation(this.program2d, "a_uv");
        gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 16, 8);
    };

    TexturePreviewGenerator.prototype.draw = function (texture, version, targetFace, desiredWidth, desiredHeight) {
        var gl = this.gl;

        this.canvas.width = desiredWidth;
        this.canvas.height = desiredHeight;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (!texture || !version) {
            return;
        }

        var gltex = texture.createTarget(gl, version, targetFace);

        gl.activeTexture(gl.TEXTURE0);

        gl.useProgram(this.program2d);
        gl.bindTexture(gl.TEXTURE_2D, gltex);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        texture.deleteTarget(gl, gltex);
    };

    TexturePreviewGenerator.prototype.capture = function () {
        var targetCanvas = document.createElement("canvas");
        targetCanvas.className = "gli-reset";
        targetCanvas.width = this.canvas.width;
        targetCanvas.height = this.canvas.height;
        var ctx = targetCanvas.getContext("2d");
        ctx.drawImage(this.canvas, 0, 0);
        return targetCanvas;
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

        this.controller = w.controller;

        this.controller.stepCompleted.addListener(this, function () {
            if (w.controller.callIndex == 0) {
                self.lastCallIndex = null;
            } else {
                self.lastCallIndex = w.controller.callIndex - 1;
            }
        });

        var buttonHandlers = {};

        function addButton(bar, name, tip, callback) {
            var el = w.document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled trace-minibar-command-" + name;

            el.title = tip;
            el.innerHTML = " ";

            el.onclick = function () {
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
        addButton(this.elements.bar, "step-until-draw", "Run until the next draw call (F7)", function () {
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
    };
    TraceMinibar.prototype.stepUntil = function (callIndex) {
        if (this.controller.callIndex > callIndex) {
            this.controller.reset();
            this.controller.openFrame(this.view.frame);
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
        } else {
            this.controller.reset();
            // TODO: clear canvas
            console.log("would clear canvas");
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

        //this.window.outputHUD.refresh();
    };

    var TraceView = function (w, elementRoot) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w, elementRoot);
        this.traceListing = new gli.ui.TraceListing(this, w, elementRoot);

        this.inspector = new gli.ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'traceSplitter',
            title: 'Replay Preview',
            selectionName: 'Buffer',
            selectionValues: null /* set later */
        });
        this.inspector.querySize = function () {
            return [context.canvas.width, context.canvas.height];
        };
        this.inspector.reset = function () {
            this.layout();
        };
        this.inspector.canvas.style.display = "";

        w.controller.setOutput(this.inspector.canvas);

        // TODO: watch for parent canvas size changes and update
        this.inspector.canvas.width = context.canvas.width;
        this.inspector.canvas.height = context.canvas.height;

        this.frame = null;
    };

    TraceView.prototype.setInspectorWidth = function (newWidth) {
        var document = this.window.document;

        //.window-trace-outer margin-left: -480px !important; /* -2 * window-inspector.width */
        //.window-trace margin-left: 240px !important;
        //.trace-minibar right: 240px; /* window-trace-inspector */
        //.trace-listing right: 240px; /* window-trace-inspector */
        document.getElementsByClassName("window-trace-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-trace")[0].style.marginLeft = newWidth + "px !important";
        document.getElementsByClassName("window-trace-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("trace-minibar")[0].style.right = newWidth + "px !important";
        document.getElementsByClassName("trace-listing")[0].style.right = newWidth + "px !important";
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
        this.reset();
        this.frame = frame;

        this.traceListing.setFrame(frame);
        this.minibar.update();
        this.traceListing.scrollToCall(0);
    };
    
    TraceView.prototype.stepUntil = function(callIndex) {
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
        this.elements.list.innerHTML = "";
    };

    function addCall(listing, frame, call) {
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

        var line = document.createElement("div");
        line.className = "trace-call-line";
        ui.populateCallLine(listing.window, call, line);
        el.appendChild(line);

        var info = gli.info.functions[call.name];
        if (info.type == gli.FunctionType.DRAW) {
            var actions = document.createElement("div");
            actions.className = "trace-call-actions";

            var isolateAction = document.createElement("div");
            isolateAction.className = "trace-call-action trace-call-action-isolate";
            isolateAction.title = "Run draw call isolated";
            actions.appendChild(isolateAction);
            isolateAction.onclick = function (e) {
                listing.window.controller.runIsolatedDraw(frame, call);
                listing.view.minibar.refreshState(true);
                e.preventDefault();
                e.stopPropagation();
            };

            el.appendChild(actions);
        }

        if (call.isRedundant) {
            el.className += " trace-call-redundant";
        }
        if (call.error) {
            el.className += " trace-call-error";
            // TODO: show error somehow?
            var errorString = "[unknown]";
            switch (call.error) {
                case gl.NO_ERROR:
                    errorString = "NO_ERROR";
                    break;
                case gl.INVALID_ENUM:
                    errorString = "INVALID_ENUM";
                    break;
                case gl.INVALID_VALUE:
                    errorString = "INVALID_VALUE";
                    break;
                case gl.INVALID_OPERATION:
                    errorString = "INVALID_OPERATION";
                    break;
                case gl.OUT_OF_MEMORY:
                    errorString = "OUT_OF_MEMORY";
                    break;
            }
            var extraInfo = document.createElement("div");
            extraInfo.className = "trace-call-extra";
            var errorName = document.createElement("span");
            errorName.innerHTML = errorString;
            extraInfo.appendChild(errorName);
            el.appendChild(extraInfo);
        }

        listing.elements.list.appendChild(el);

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

        for (var n = 0; n < frame.calls.length; n++) {
            var call = frame.calls[n];
            addCall(this, frame, call);
        }

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

    function generateParameterRow(w, gl, table, state, param) {
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
            generateParameterRow(w, gl, table, state, param);
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
                updateSize();
                // TODO: refresh view if selected
            });
            texture.deleted.addListener(this, function (texture) {
                el.className += " texture-item-deleted";
            });
        });

        this.listing.addButton("Browse All").addListener(this, function () {
            if (w.texturePicker && w.texturePicker.isOpened()) {
                w.texturePicker.focus();
            } else {
                w.texturePicker = new gli.ui.TexturePicker(w.context);
            }
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
            this.previewer = new ui.TexturePreviewGenerator(this.canvas);
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
        var document = this.window.document;

        //.window-texture-outer margin-left: -800px !important; /* -2 * window-texture-inspector.width */
        //.window-texture margin-left: 400px !important; /* window-texture-inspector.width */
        //.texture-listing right: 400px; /* window-texture-inspector */
        document.getElementsByClassName("window-texture-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-texture-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("texture-listing")[0].style.right = newWidth + "px !important";
    };

    TextureView.prototype.layout = function () {
        this.inspector.layout();
    };

    function createImageDataFromPixels(gl, width, height, format, type, source) {
        var canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        var ctx = canvas.getContext("2d");
        var imageData = ctx.createImageData(width, height);

        // TODO: implement all texture formats
        switch (type) {
            case gl.UNSIGNED_BYTE:
                switch (format) {
                    case gl.RGB:
                        for (var sn = 0, dn = 0; sn < width * height * 3; sn += 3, dn += 4) {
                            imageData.data[dn + 0] = source[sn + 0];
                            imageData.data[dn + 1] = source[sn + 1];
                            imageData.data[dn + 2] = source[sn + 2];
                            imageData.data[dn + 3] = 255;
                        }
                        break;
                    case gl.RGBA:
                        for (var n = 0; n < width * height * 4; n++) {
                            imageData.data[n] = source[n];
                        }
                        break;
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
        }

        return imageData;
    };

    function appendHistoryLine(gl, el, texture, call) {
        if (call.name == "pixelStorei") {
            // Don't care about these for now - maybe they will be useful in the future
            return;
        }

        gli.ui.appendHistoryLine(gl, el, call);

        if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
            // TODO: display src of last arg (either data, img, video, etc)
            var sourceArg = null;
            for (var n = 0; n < call.args.length; n++) {
                var arg = call.args[n];
                if (arg) {
                    if ((arg instanceof HTMLCanvasElement) ||
                        (arg instanceof HTMLImageElement) ||
                        (arg instanceof HTMLVideoElement)) {
                        sourceArg = gli.util.clone(arg);
                    } else if (arg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
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
                sourceArg = createImageDataFromPixels(gl, width, height, format, type, sourceArg);
            }

            // Fixup ImageData
            if (sourceArg && sourceArg.__proto__.constructor.toString().indexOf("ImageData") > 0) {
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
                    var srcLinkEl = document.createElement("a");
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
            appendHistoryLine(gl, rootEl, texture, call);
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

    var TexturePicker = function (context) {
        var self = this;
        this.context = context;

        var w = this.browserWindow = window.open("about:blank", "_blank", "location=no,menubar=no,scrollbars=no,status=no,toolbar=no,innerWidth=610,innerHeight=600");
        w.document.writeln("<html><head><title>Texture Browser</title></head><body style='margin: 0px; padding: 0px;'></body></html>");
        w.focus();

        w.addEventListener("unload", function () {
            if (self.browserWindow) {
                self.browserWindow.closed = true;
                self.browserWindow = null;
            }
            context.ui.texturePicker = null;
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

        setTimeout(function () {
            self.previewer = new gli.ui.TexturePreviewGenerator();
            self.setup();
        }, 0);
    };

    TexturePicker.prototype.setup = function () {
        var self = this;
        var context = this.context;
        var gl = context;

        // Build UI
        var body = this.browserWindow.document.body;

        var toolbarDiv = document.createElement("div");
        toolbarDiv.className = "texture-picker-toolbar";
        body.appendChild(toolbarDiv);

        var pickerDiv = document.createElement("div");
        pickerDiv.className = "texture-picker-inner";
        body.appendChild(pickerDiv);

        function addTexture(texture) {
            var el = document.createElement("div");
            el.className = "texture-picker-item";
            if (texture.status == gli.host.Resource.DEAD) {
                el.className += " texture-picker-item-deleted";
            }
            pickerDiv.appendChild(el);

            var previewContainer = document.createElement("div");
            previewContainer.className = "texture-picker-item-container";
            el.appendChild(previewContainer);

            function updatePreview() {
                var preview = null;
                if (texture.cachedPreview) {
                    // Preview exists - use it
                    preview = texture.cachedPreview;
                } else {
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
                    self.previewer.draw(texture, version, targetFace, desiredWidth, desiredHeight);
                    preview = self.previewer.capture();
                    var x = (128 / 2) - (desiredWidth / 2);
                    var y = (128 / 2) - (desiredHeight / 2);
                    preview.style.marginLeft = x + "px !important";
                    preview.style.marginTop = y + "px !important";
                    texture.cachedPreview = preview;
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

            var iconDiv = document.createElement("div");
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

            var titleDiv = document.createElement("div");
            titleDiv.className = "texture-picker-item-title";
            titleDiv.innerHTML = texture.getName();
            el.appendChild(titleDiv);

            el.onclick = function (e) {
                self.context.ui.showTexture(texture);
                self.close(); // TODO: do this?
                e.preventDefault();
                e.stopPropagation();
            };

            texture.modified.addListener(this, function (texture) {
                texture.cachedPreview = null;
                updatePreview();
            });
            texture.deleted.addListener(this, function (texture) {
                el.className += " texture-picker-item-deleted";
            });
        };

        // Append textures already present
        var textures = context.resources.getTextures();
        for (var n = 0; n < textures.length; n++) {
            var texture = textures[n];
            addTexture(texture);
        }

        // Listen for changes
        context.resources.resourceRegistered.addListener(this, function (resource) {
            if (glitypename(resource.target) == "WebGLTexture") {
                addTexture(resource);
            }
        });
    };

    TexturePicker.prototype.focus = function () {
        this.browserWindow.focus();
    };
    TexturePicker.prototype.close = function () {
        if (this.browserWindow) {
            this.browserWindow.close();
            this.browserWindow = null;
        }
        this.context.ui.texturePicker = null;
    };
    TexturePicker.prototype.isOpened = function () {
        return this.browserWindow && !this.browserWindow.closed;
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

        this.inspector = new ui.SurfaceInspector(this, w, elementRoot, {
            splitterKey: 'bufferSplitter',
            title: 'Buffer Preview',
            selectionName: null,
            selectionValues: null,
            disableSizing: true,
            transparentCanvas: true
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
            
            // Drag rotate
            var lastValueX = 0;
            var lastValueY = 0;
            function mouseMove (e) {
                var dx = e.screenX - lastValueX;
                var dy = e.screenY - lastValueY;
                lastValueX = e.screenX;
                lastValueY = e.screenY;
                
                var camera = self.previewer.camera;
                camera.rotx += dx * Math.PI / 180;
                camera.roty += dy * Math.PI / 180;
                self.previewer.draw();
                
                e.preventDefault();
                e.stopPropagation();
            };
            function mouseUp(e) {
                endDrag();
                e.preventDefault();
                e.stopPropagation();
            };
            function beginDrag() {
                document.addEventListener("mousemove", mouseMove, true);
                document.addEventListener("mouseup", mouseUp, true);
                self.canvas.style.cursor = "move";
                document.body.style.cursor = "move";
            };
            function endDrag() {
                document.removeEventListener("mousemove", mouseMove, true);
                document.removeEventListener("mouseup", mouseUp, true);
                self.canvas.style.cursor = "";
                document.body.style.cursor = "";
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
                    var camera = self.previewer.camera;
                    camera.distance -= delta;
                    camera.distance = Math.max(1, camera.distance);
                    self.previewer.draw();
                }
                
                e.preventDefault();
                e.stopPropagation();
                e.returnValue = false;
            };
            this.canvas.addEventListener("DOMMouseScroll", this.canvas.onmousewheel, false);
        }
        this.inspector.updatePreview = function () {
            var gl = this.gl;

            this.previewer.setBuffer(this.drawState);
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
                this.previewer.setBuffer(buffer.previewOptions);
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
        };

        this.currentBuffer = null;
    };

    BufferView.prototype.setInspectorWidth = function (newWidth) {
        var document = this.window.document;

        //.window-buffer-outer margin-left: -800px !important; /* -2 * window-buffer-inspector.width */
        //.window-buffer margin-left: 400px !important; /* window-buffer-inspector.width */
        //.buffer-listing right: 400px; /* window-buffer-inspector */
        document.getElementsByClassName("window-buffer-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-buffer-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("buffer-listing")[0].style.right = newWidth + "px !important";
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
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Int8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Uint8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Int16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Uint16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        readView = new Float32Array(data.buffer, innerOffset, datas[m].size);
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
                
                view.inspector.setBuffer(buffer, version);
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
                var modeEnums = ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"];
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
            var datas = version.structure;

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

            for (var n = 0; n < datas.length; n++) {
                var data = datas[n];

                var tr = document.createElement("tr");

                td = document.createElement("td");
                td.innerHTML = data.offset;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = data.size;
                tr.appendChild(td);
                td = document.createElement("td");
                switch (data.type) {
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
                td.innerHTML = data.stride;
                tr.appendChild(td);
                td = document.createElement("td");
                td.innerHTML = data.normalized;
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
            var expandLink = document.createElement("a");
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

            this.inspector.setBuffer(buffer, version);

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

    var BufferPreview = function (canvas) {
        this.canvas = canvas;
        this.drawState = null;

        try {
            if (canvas.getContextRaw) {
                this.gl = canvas.getContextRaw("experimental-webgl");
            } else {
                this.gl = canvas.getContext("experimental-webgl");
            }
        } catch (e) {
            // ?
            alert("Unable to create texture preview canvas: " + e);
        }
        gli.hacks.installAll(this.gl);
        var gl = this.gl;

        var vsSource =
        'uniform mat4 u_projMatrix;' +
        'uniform mat4 u_modelViewMatrix;' +
        'uniform mat4 u_modelViewInvMatrix;' +
        'uniform bool u_enableLighting;' +
        'attribute vec3 a_position;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    gl_Position = u_projMatrix * u_modelViewMatrix * vec4(a_position, 1.0);' +
        '    if (u_enableLighting) {' +
        '        vec3 lightDirection = vec3(-1.0, 0.0, 0.0);' +
        '        vec3 normal = vec3(0.0, 0.0, 1.0);' +
        '        vec4 normalT = u_modelViewInvMatrix * vec4(normal, 1.0);' +
        '        float lighting = max(dot(normalT.xyz, lightDirection), 0.0);' +
        '        v_lighting = vec3(1.0, 1.0, 1.0) * lighting;' +
        '    } else {' +
        '        v_lighting = vec3(1.0, 1.0, 1.0);' +
        '    }' +
        '    gl_PointSize = 3.0;' +
        '}';
        var fsSource =
        'precision highp float;' +
        'varying vec3 v_lighting;' +
        'void main() {' +
        '    vec4 color = vec4(1.0, 0.0, 0.0, 1.0);' +
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
        this.program.u_projMatrix = gl.getUniformLocation(this.program, "u_projMatrix");
        this.program.u_modelViewMatrix = gl.getUniformLocation(this.program, "u_modelViewMatrix");
        this.program.u_modelViewInvMatrix = gl.getUniformLocation(this.program, "u_modelViewInvMatrix");
        this.program.u_enableLighting = gl.getUniformLocation(this.program, "u_enableLighting");

        gl.enableVertexAttribArray(this.program.a_position);

        // Default state
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

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
        this.setBuffer(null);

        gl.deleteProgram(this.program);
        this.program = null;

        this.gl = null;
        this.canvas = null;
    };

    BufferPreview.prototype.draw = function () {
        if (!this.drawState) {
            return;
        }

        var ds = this.drawState;
        var gl = this.gl;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Lighting
        var enableLighting;
        switch (ds.mode) {
            case gl.POINTS:
            case gl.LINE_LOOP:
            case gl.LINE_STRIP:
            case gl.LINES:
                enableLighting = false;
                break;
            default:
                enableLighting = true;
                break;
        }
        // TODO: forced off for now because I need normal generation
        enableLighting = false;
        gl.uniform1i(this.program.u_enableLighting, enableLighting ? 1 : 0);

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
        function matrixMult (a, b) {
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
        function matrixInverse (m) {
            var inv = new Float32Array(16);
            inv[0] =   m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
            inv[4] =  -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
            inv[8] =   m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
            inv[12] = -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
            inv[1] =  -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
            inv[5] =   m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
            inv[9] =  -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
            inv[13] =  m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
            inv[2] =   m[1]*m[6]*m[15]  - m[1]*m[7]*m[14]  - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];
            inv[6] =  -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14]  + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];
            inv[10] =  m[0]*m[5]*m[15]  - m[0]*m[7]*m[13]  - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];
            inv[14] = -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13]  + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];
            inv[3] =  -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10]  + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];
            inv[7] =   m[0]*m[6]*m[11]  - m[0]*m[7]*m[10]  - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];
            inv[11] = -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]   + m[4]*m[1]*m[11] - m[4]*m[3]*m[9]  - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];
            inv[15] =  m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]   - m[4]*m[1]*m[10] + m[4]*m[2]*m[9]  + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];
            var det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
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
        gl.uniformMatrix4fv(this.program.u_modelViewInvMatrix, true, modelViewInvMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.arrayBufferTarget);
        gl.vertexAttribPointer(this.program.a_position, ds.position.size, ds.position.type, ds.position.normalized, ds.position.stride, ds.position.offset);

        if (this.elementArrayBufferTarget) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.elementArrayBufferTarget);
            gl.drawElements(ds.mode, ds.count, ds.elementArrayType, ds.offset);
        } else {
            gl.drawArrays(ds.mode, ds.first, ds.count);
        }
    };

    function extractAttribute(gl, buffer, version, attributeIndex) {
        var data = buffer.constructVersion(gl, version);
        if (!data) {
            return null;
        }

        var result = [];

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

        var byteOffset = 0;
        var itemOffset = 0;
        while (byteOffset < data.byteLength) {
            var innerOffset = byteOffset;
            for (var m = 0; m < datas.length; m++) {
                var byteAdvance = 0;
                var readView = null;
                switch (datas[m].type) {
                    case gl.BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Int8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_BYTE:
                        byteAdvance = 1 * datas[m].size;
                        readView = new Uint8Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Int16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    case gl.UNSIGNED_SHORT:
                        byteAdvance = 2 * datas[m].size;
                        readView = new Uint16Array(data.buffer, innerOffset, datas[m].size);
                        break;
                    default:
                    case gl.FLOAT:
                        byteAdvance = 4 * datas[m].size;
                        readView = new Float32Array(data.buffer, innerOffset, datas[m].size);
                        break;
                }
                innerOffset += byteAdvance;

                if (m == attributeIndex) {
                    // HACK: this is completely and utterly stupidly slow
                    // TODO: speed up extracting attributes
                    for (var i = 0; i < datas[m].size; i++) {
                        result.push(readView[i]);
                    }
                }
            }

            byteOffset += stride;
            itemOffset++;
        }

        return result;
    }

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
    BufferPreview.prototype.setBuffer = function (drawState) {
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

        if (drawState) {
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

            // Determine the extents of the interesting region
            var attributeIndex = 0;
            var positionData = extractAttribute(gl, drawState.arrayBuffer[0], drawState.arrayBuffer[1], attributeIndex);

            // TODO: determine actual start/end
            var version = drawState.arrayBuffer[1];
            var attr = version.structure[attributeIndex];
            var startIndex = 0;
            var endIndex = positionData.length / attr.size;

            var minx = Number.MAX_VALUE;
            var miny = Number.MAX_VALUE;
            var minz = Number.MAX_VALUE;
            var maxx = Number.MIN_VALUE;
            var maxy = Number.MIN_VALUE;
            var maxz = Number.MIN_VALUE;
            for (var n = startIndex; n < endIndex; n++) {
                var m = n * attr.size;
                var x = positionData[m + 0];
                var y = positionData[m + 1];
                var z = attr.size >= 3 ? positionData[m + 2] : 0;
                minx = Math.min(minx, x);
                miny = Math.min(miny, y);
                minz = Math.min(minz, z);
                maxx = Math.max(maxx, x);
                maxy = Math.max(maxy, y);
                maxz = Math.max(maxz, z);
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
        }

        this.drawState = drawState;
        this.draw();
    };

    // TODO: input/etc

    ui.BufferPreview = BufferPreview;
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

    function appendTable(gl, el, program, name, tableData, hasValue) {
        // [ordinal, name, size, type, optional value]
        var table = document.createElement("table");
        table.className = "program-attribs";

        var tr = document.createElement("tr");
        var td = document.createElement("th");
        td.innerHTML = "ordinal";
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
        if (hasValue) {
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
            if (hasValue) {
                td = document.createElement("td");
                td.innerHTML = row[4];
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        el.appendChild(table);
    };

    function appendUniformInfos(context, el, program, isCurrent) {
        var gl = !isCurrent ? context : context.ui.controller.output.gl;
        var target = !isCurrent ? program.target : program.mirror.target;

        var tableData = [];
        var uniformCount = program.parameters[gl.ACTIVE_UNIFORMS];
        for (var n = 0; n < uniformCount; n++) {
            var activeInfo = gl.getActiveUniform(target, n);
            if (activeInfo) {
                var loc = gl.getUniformLocation(target, activeInfo.name);
                var value = gl.getUniform(target, loc);
                tableData.push([n, activeInfo.name, activeInfo.size, activeInfo.type, value]);
            }
        }
        appendTable(gl, el, program, "uniform", tableData, true);

        if (gl.ignoreErrors) {
            gl.ignoreErrors();
        }
    };

    function appendAttributeInfos(gl, el, program) {
        var tableData = [];
        var remainingAttribs = program.parameters[gl.ACTIVE_ATTRIBUTES];
        var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        var attribIndex = 0;
        while (remainingAttribs > 0) {
            var activeInfo = gl.getActiveAttrib(program.target, attribIndex);
            if (activeInfo && activeInfo.type) {
                remainingAttribs--;
                tableData.push([attribIndex, activeInfo.name, activeInfo.size, activeInfo.type]);
            }
            attribIndex++;
            if (attribIndex >= maxAttribs) {
                break;
            }
        }
        appendTable(gl, el, program, "attribute", tableData, false);

        if (gl.ignoreErrors) {
            gl.ignoreErrors();
        }
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
