// Copyright 2008 The Closure Linter Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview There is nothing wrong w/ this javascript.
 *
 */

goog.provide('goog.something');
goog.provide('goog.something.Else');
/** @suppress {extraProvide} */
goog.provide('goog.something.Extra');
goog.provide('goog.something.SomeTypeDef');
goog.provide('goog.somethingelse.someMethod');
goog.provide('goog.super.long.DependencyNameThatForcesTheLineToBeOverEightyCharacters');
goog.provide('notInClosurizedNamespacesSoNotExtra');

goog.require('dummy.foo');
goog.require('dummy.foo.someSpecificallyRequiredMethod');
goog.require('goog.Class');
goog.require('goog.Class.Enum');
/** @suppress {extraRequire} */
goog.require('goog.extra.require');
goog.require('goog.package');
goog.require('goog.package.ClassName');
goog.require('goog.package.OtherClassName');
goog.require('goog.super.long.DependencyNameThatForcesTheLineToBeOverEightyCharacters2');
goog.require('goog.super.long.DependencyNameThatForcesTheLineToBeOverEightyCharacters3');
goog.require('notInClosurizedNamespacesSoNotExtra');

dummy.foo.someMethod();
dummy.foo.someSpecificallyRequiredMethod();


// Regression test for bug 3473189. Both of these 'goog.provide' tokens should
// be completely ignored by alphabetization checks.
if (typeof goog != 'undefined' && typeof goog.provide == 'function') {
  goog.provide('goog.something.SomethingElse');
}


var x = new goog.Class();
goog.package.staticFunction();

var y = goog.Class.Enum.VALUE;


// This should not trigger a goog.require.
var somethingPrivate = goog.somethingPrivate.PrivateEnum_.VALUE;


/**
 * This method is provided directly, instead of its namespace.
 */
goog.somethingelse.someMethod = function() {};


/**
 * Defining a private property on a required namespace should not trigger a
 * provide of that namespace. Yes, people actually do this.
 * @private
 */
goog.Class.privateProperty_ = 1;


/**
 * @typedef {string}
 */
goog.something.SomeTypeDef;


/**
 * @typedef {string}
 * @private
 */
goog.something.SomePrivateTypeDef_;


/**
 * Some variable that is declared but not initialized.
 * @type {string|undefined}
 * @private
 */
goog.something.somePrivateVariable_;


/**
 * Private variable.
 * @type {number}
 * @private
 */
goog.something.private_ = 10;



/**
 * A really long class name to provide and usage of a really long class name to
 * be required.
 * @constructor
 */
goog.super.long.DependencyNameThatForcesTheLineToBeOverEightyCharacters =
    function() {
  var x = new goog.super.long.
      DependencyNameThatForcesTheLineToBeOverEightyCharacters2();
  var x = new goog.super.long
      .DependencyNameThatForcesTheLineToBeOverEightyCharacters3();
};


/**
 * Static function.
 */
goog.something.staticFunction = function() {
  // Tests that namespace usages are identified using 'namespace.' not just
  // 'namespace'.
  googSomething.property;
  dummySomething.property;
  goog.package.ClassName.        // A comment in between the identifier pieces.
      IDENTIFIER_SPLIT_OVER_MULTIPLE_LINES;
  goog.package.OtherClassName.property = 1;

  // Don't just use goog.bar for missing namespace, hard coded to never require
  // goog since it's never provided.
  var mockConstructor = control.createConstructorMock(
      /** @suppress {missingRequire} */ goog.foo.bar, 'Baz');

  goog.require('goog.shouldBeIgnored');
};



/**
 * Constructor for Else.
 * @constructor
 */
goog.something.Else = function() {
  /** @suppress {missingRequire} */
  var mockConstructor = this.control.createConstructorMock(
      goog.foo.bar, 'Baz');
};



/**
 * Constructor for SomethingElse.
 * @constructor
 */
goog.something.SomethingElse = function() {};


/**
 * @suppress {missingProvide}
 */
goog.suppress.someMethod = function() {};
