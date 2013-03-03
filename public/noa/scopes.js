NOA(function(NOA){

	scopes = {};

	NOA.define("noa/scopes", scopes);

    var SCOPE = [{}]; //empty start scope

    scopes.getCurrentScope = function() {
        return SCOPE[0];
    };


    scopes.getFromScope = function(name) {
        var s = scopes.getCurrentScope();

        while (s != null) {
            if (name in s)
                return s[name];
            s = s.$PARENTSCOPE$;
        }

        throw "NOA: Undefined variable: " + name;
    };


    scopes.newScope = function(basescope) {
        return {
            $PARENTSCOPE$ : basescope //MWE: lets hope nobody ever names his variable '$PARENTSCOPE$'...
        }
    };


    scopes.pushScope = function(scope) {
        scopes.SCOPE.unshift(scope);
    };

    scopes.popScope = function() {
        scopes.SCOPE.shift();
    };
})