"use strict";

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function (request, response) {
    response.success("Hello world!");
});

Parse.Cloud.define("copyTemplates", function (request, response) {
    var fromId = request.params.fromId;
    var toId = request.params.toId;
    console.log("copyTemplates from '" + fromId + "' to '" + toId + "'");

    var Company = Parse.Object.extend("Company");
    var TemplateWalkthru = Parse.Object.extend("templateWalkthru");
    var toCompany = new Company();
    var fromCompany = new Company();
    fromCompany.id = fromId;
    toCompany.id = toId;

    var templateWalkthruQuery = new Parse.Query("templateWalkthru");
    templateWalkthruQuery.equalTo("company", fromCompany);
    templateWalkthruQuery.include("name");
    templateWalkthruQuery.find({
        success: function (results) {
            console.log("copyTemplates: results.length=" + result.length);
            for (var i = 0; i < results.length; i++) {
                var workingTemplateWalkthru = results[i];
                var newTemplateWalkthru = new TemplateWalkthru();
                newTemplateWalkthru.set("name", workingTemplateWalkthru.name);
                newTemplateWalkthru.set("company", toCompany);
                newTemplateWalkthru.save(null, {
                    success: function (templateWalkthru) {
                        alert("new templateWalkthru created with id: " + templateWalkthru.id);

                    },
                    error: function (templateWalkthru, error) {
                        alert("failed saving templateWalkthru with error:" + error);
                    }
                });
            }

        }
    });
});

Parse.Cloud.beforeDelete("Park", function (request, response) {
    var query = new Parse.Query("Unit");
    query.equalTo("park", request.object);
    query.count({
        success: function (count) {
            if (count > 0) {
                response.error("cloudParkDeleteFailHasUnits");
            } else {
                response.success();
            }
        },
        error: function (error) {
            response.error("Error " + error.code + " : " + error.message + " when getting Unit count.");
        }
    });
});


Parse.Cloud.beforeDelete("Unit", function (request, response) {
    var query = new Parse.Query("WalkthruFile");
    query.equalTo("unit", request.object);
    query.count({
        success: function (count) {
            if (count > 0) {
                response.error("cloudUnitDeleteFailHasReports");
            } else {
                response.success();
            }
        },
        error: function (error) {
            response.error("Error " + error.code + " : " + error.message + " when getting Report count.");
        }
    });
});

//var _ = require(["underscore"]);
Parse.Cloud.beforeSave(Parse.User, function (request, response) {
    console.error("user beforeSave");
    var maxSearchTerms = 10;

    var user = request.object;
    var firstName = user.get("firstName");
    var lastName = user.get("lastName");
    var userName = user.get("username");
    var words = [];

    if (undefined != firstName) {
        Array.prototype.push.apply(words, firstName.toLowerCase().split(" "));

    }
    if (undefined != lastName) {
        Array.prototype.push.apply(words, lastName.toLowerCase().split(" "));

    }
    if (undefined != userName) {
        Array.prototype.push.apply(words, userName.toLowerCase().split("@"));
    }

    for (var i = 0; i < maxSearchTerms; i++) {
        var searchTerm = "";
        if (i < words.length) {
            searchTerm = words[i];
        }
        request.object.set("st" + i, searchTerm);
    }


    console.log("user beforeSave");
    response.success();

});


Parse.Cloud.beforeSave("Company", function (request, response) {
    console.log("company beforeSave: " + request.object.get("companyName"));
    var maxSearchTerms = 10;
    var company = request.object;
    var words = [""];
    var companyName = company.get("companyName");
    var contactName = company.get("contactName");
    var contactEmail = company.get("contactEmail");
    if (undefined != companyName) {
        console.log(companyName);
        Array.prototype.push.apply(words, companyName.toLowerCase().split(" "));
    }

    if (undefined != contactName) {
        Array.prototype.push.apply(words, contactName.toLowerCase().split(" "));
    }

    if (undefined != contactEmail) {
        Array.prototype.push.apply(words, contactEmail.toLowerCase().split("@"));
    }


    for (var i = 0; i < maxSearchTerms; i++) {
        var searchTerm = "";
        if (i < words.length) {
            searchTerm = words[i];
        }
        company.set("st" + i, searchTerm);
    }
    response.success();

});


Parse.Cloud.job("searchTermCompanyMigration", function (request, status) {
    console.log("searchTermCompanyMigration");
    Parse.Cloud.useMasterKey();
    var maxSearchTerms = 10;
    var i = 0;
    var query = new Parse.Query("Company");
    query.equalTo("st9", undefined);
    console.log(query);
    query.find({
        success: function (results) {
            //var user = results[i];
            //results[i].set("st9", "bla");
            //console.log("about to save: " + i);
            if (results.length > 0) {
                console.log("saving company " + results[0].get("companyname"));
                results[0].save(null).
                then (function (userAgain) {
                        console.log("saved company " + userAgain.get("companyname"));
                        status.success("saved company " + userAgain.get("companyname"));
                    },
                    function (error) {
                        console.error(error);
                        status.error(error);
                    }
                );
            }
            else {
                status.success("0");
            }
        },
        error: function (error) {
            status.error(error);
            console.log(error);
        }
    })

});

Parse.Cloud.job("searchTermUserMigration", function (request, status) {
    console.log("searchTermUserMigration");
    Parse.Cloud.useMasterKey();
    var maxSearchTerms = 10;
    var i = 0;
    var query = new Parse.Query(Parse.User);
    query.equalTo("st9", undefined);
    console.log(query);
    query.find({
        success: function (results) {
            //var user = results[i];
            //results[i].set("st9", "bla");
            //console.log("about to save: " + i);
            if (results.length > 0) {
                console.log("saving user " + results[0].get("username"));
                results[0].save(null).
                then (function (userAgain) {
                        console.log("saved user " + userAgain.get("username"));
                        status.success("saved user " + userAgain.get("username"));
                    },
                    function (error) {
                        console.error(error);
                        status.error(error);
                    }
                );
            }
            else {
                status.success("Zero results");
            }
        },
        error: function (error) {
            status.error(error);
            console.log(error);
        }
    })
});