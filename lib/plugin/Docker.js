//Client.plugins = Client.plugins || [];
//Client.plugins.push();
"use strict";
var log = require('../log');
var Docker = require('dockerode');
var Client = require('../Client');
var docker = new Docker({socketPath: '/var/run/docker.sock'});
let dockerPlugins = {
    name: 'docker',
    isInit : false,
    init: function(){
        if(this.isInit) return;
        log.info("docker plugins init");
        this.isInit = true;
        ctx.font = '30px Impact';
    },
    run : function(message, callback){
        let self = this;
        if(typeof message == 'object'){
            let content = message.Content;
            log.info('content=' + content);
            if(content && content.startsWith('docker ')) {
                log.info('条件满足,执行插件');
                let args = content.split(' ');
                if(args.length < 2){
                    return;
                }
                let command = args[1].trim();
                if(command == 'ps'){
                    docker.listContainers((err, containers) => {
                        if(err){
                            Client.sendMessage({ToUserName: message.FromUserName, Content: JSON.stringify(err)}, (err) => {
                                if(err) log.error(err);
                                callback(null, 'ok')
                            });
                        } else {
                            if(containers && containers.length > 0){
                                let messageContent = '';
                                containers.forEach(function(container){
                                    messageContent+= container.Id.substr(0,10) + '  ' + container.Names[0] + '  ' + container.Image + '\r\n';
                                });
                                Client.sendMessage({ToUserName: message.FromUserName, Content: messageContent}, (err) => {
                                    if(err) log.error(err);
                                    callback(null, 'ok')
                                });
                            } else {
                                Client.sendMessage({ToUserName: message.FromUserName, Content: '没有正在运行的容器!'}, (err) => {
                                    if(err) log.error(err);
                                    callback(null, 'ok')
                                });
                            }
                        }
                    });
                } else if (command == 'inspect'){
                    if(args.length < 3){
                        Client.sendMessage({ToUserName: message.FromUserName, Content: 'error args'}, (err) => {
                            if(err) log.error(err);
                            callback(null, 'ok')
                        });
                        return;
                    }
                    var container = docker.getContainer(args[2]);
                    container.inspect(function (err, data) {
                        if(err) {
                            Client.sendMessage({ToUserName: message.FromUserName, Content: JSON.stringify(err)}, (err) => {
                                if(err) log.error(err);
                                callback(null, 'ok')
                            });
                        } else {
                            if(data){
                                let messageContent = '';
                                for(var key in data) {
                                    if(data.hasOwnProperty(key)) {
                                        if(data[key] instanceof Array){
                                            messageContent+= key + ': ' + data[key].join(',') + '\r\n';
                                        } else if (data[key] instanceof Object){
                                            messageContent+= key + ': ' + JSON.stringify(data[key]) + '\r\n';
                                        } else {
                                            messageContent+= key + ': ' + data[key] + '\r\n';
                                        }
                                    }
                                }
                                Client.sendMessage({ToUserName: message.FromUserName, Content: messageContent}, (err) => {
                                    if(err) log.error(err);
                                    callback(null, 'ok')
                                });
                            } else {
                                Client.sendMessage({ToUserName: message.FromUserName, Content: '没有找到此容器的信息'}, (err) => {
                                    if(err) log.error(err);
                                    callback(null, 'ok')
                                });
                            }

                        }
                    });
                }
                callback(null, 'ok');
            }
        }
        callback(null, '忽略此插件');
    },
    paint: function(type, content, callback){
        console.log(content);
        if(type == 'ps'){
            content.forEach(function (containerInfo, n) {
                ctx.fillText(containerInfo.Id.substr(0,10), 10, n * 40);
                ctx.fillText(containerInfo.Names, 100, n * 40);
            });
            var fs = require('fs')
                , out = fs.createWriteStream(__dirname + '/text.png')
                , stream = canvas.pngStream();

            stream.on('data', function(chunk){
                out.write(chunk);
            });
            stream.on('end', function(){
                console.log('saved png');
                callback();
            });
        }
    }

};

module.exports = dockerPlugins;
