# [backgammon.js](../README.md) :: Creating rules for backgammon.js

Currently three rules have been implemented:
 
- [`RuleBgCasual`](lib/rules/RuleBgCasual.js)
- [`RuleBgGulbara`](lib/rules/RuleBgGulbara.js)
- [`RuleBgTapa`](lib/rules/RuleBgTapa.js)

These are rules for the three variants of backgammon popular in Bulgaria. If in your country or region you play those variants in a different way, or play some other variants, you are free to create a new rule.

Want a rule where every second dice is 6:6, well, nothing prevents you from creating one :)

1. Use one of the built-in examples as a starting point and create a new file in directory [`lib/rules/`](../lib/rules/).

   The filename should start with prefix `Rule`, followed by `ISO 3166-1 alpha-2` country code (the country where this variant of the game is popular  - eg. `Bg` for `Bulgaria`) and the name of the rule. Don't use spaces or punctuation/special characters in the filename.

   The file should contain a class that inherits from built-in `Rule` class and implements all abstract methods. Again, use built-in rules as example. The name of the class should match the name of the file.
   
   Lets say your ISO country code is CC and you want to use the name `YourRule` for it. In this case both filename and class name should be `RuleCCYourRule`.

2. After you have created the new rule, you need to enable the rule in both server and client.

   To enable the new rule in server:

   - Open file `app/server/config.js`
   - Add the name of the new rule to the `enabledRules` array:

             var config = {
               'rulePath': '../../lib/rules/',
               'enabledRules': [
                 'RuleBgCasual',
                 'RuleBgGulbara',
                 'RuleBgTapa',
                 'RuleCCYourRule'  // <- Added a rule with country
                                   //    code `CC` and class name RuleCCYourRule.
               ]
             };

   To enable the new rule in client:

   - Open file `app/browser/js/config.js`
   - Add the name of the new rule to the `selectableRules` array:

             var config = {
               'containerID': 'backgammon',
               'boardUI': '../app/browser/js/SimpleBoardUI.js',
               'defaultRule': 'RuleBgCasual',
               'selectableRules': [
                 'RuleBgCasual',
                 'RuleBgGulbara',
                 'RuleBgTapa',
                 'RuleCCYourRule'  // <- Added a rule with country
                                   //    code `CC` and class name RuleCCYourRule.
               ]
             };

   - Open file `app/browser/js/main.js` and add a new require after others:
     
     `require('../../../lib/rules/RuleCCYourRule.js');`
     
   - Open file and add a new require after others:
     
     `require('./rules/RuleBgCasual.js');`
     
     *Note that the relative path is not the same as the previous one.*
   
   - cd to `app/browser` directory and rebuild `bundle.js` with the following command:
     
     `npm run build`
     
     or
     
     `npm run watch`, if you want changes to be automatically rebuild as you edit the javascript files.
     
3. Start server and test if your rule can be selected at home page.
