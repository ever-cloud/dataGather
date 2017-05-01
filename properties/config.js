/**
 * Created by lenovo on 2017/3/16.
 */
var config = {};
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader(__dirname+'/config.properties');

config.get = function(key){
    return properties.get(key);
};

module.exports = config;

