/**
 * Copyright (c) 2018, OCEAN
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Created by Il Yeup, Ahn in KETI on 2019-07-01.
 */

var fs = require('fs');
var mqtt = require('mqtt');
var {nanoid} = require("nanoid");
const {exec} = require("child_process");

var net = require('net');
var udp = require('dgram');

var mavlink = require('./mavlibrary/mavlink.js');

// var control_drone_info_topic = '/Mobius/' + conf.rtk + '/Control_Drone_Info';
var control_drone_info_topic = '';

global.drone_info_file_update_flag = 0;

let include_sitl = false;

init();

function init() {
    rtv('/Mobius/' + conf.rtk + '?rcn=1', conf.aei, 0, (rsc, res_body, count) => {
        if (rsc === '2000') {
            rtv('/Mobius/' + conf.rtk + '/DroneList?rcn=1', conf.aei, 0, (rsc, res_body, count) => {
                if (rsc === '2000') {
                    rtv('/Mobius/' + conf.rtk + '/DroneList/la', conf.aei, 0, (rsc, res_body, count) => {
                        if (rsc === '2000') {
                            if (res_body.hasOwnProperty('m2m:cin')) {
                                if (res_body['m2m:cin'].hasOwnProperty('con')) {
                                    conf.drone = res_body['m2m:cin'].con;
                                    console.log(conf.drone);

                                    fs.writeFileSync(drone_info_file, JSON.stringify(conf.drone, null, 4), 'utf8');
                                    control_drone_info_topic = '/Mobius/' + conf.rtk + '/DroneList';

                                    for (let idx in conf.drone) {
                                        if (conf.drone.hasOwnProperty(idx)) {
                                            if (conf.drone[idx].name === conf.sitl.name) {
                                                include_sitl = true;
                                            }
                                        }
                                    }
                                    if (!include_sitl) {
                                        conf.drone.unshift(conf.sitl);
                                        include_sitl = false;
                                    }

                                    mqtt_connect(conf.cse.host);

                                    delsub('/Mobius/' + conf.rtk + '/DroneList/check_sub', 0, function (rsc, res_body, count) {
                                        crtsub('/Mobius/' + conf.rtk + '/DroneList', conf.aei, 'check_sub', 'mqtt://' + conf.cse.host + '/' + conf.aei + '?ct=json', 0, function () {
                                            let noti_topic = '/oneM2M/req/+/' + conf.aei + '/json';
                                            mqtt_client.subscribe(noti_topic);
                                        });
                                    });
                                }
                            }
                        } else {
                            crtci('/Mobius/' + conf.rtk + '/DroneList', conf.aei, conf.drone, 0, () => {
                                // console.log(conf.drone);
                                control_drone_info_topic = '/Mobius/' + conf.rtk + '/DroneList';

                                for (let idx in conf.drone) {
                                    if (conf.drone.hasOwnProperty(idx)) {
                                        if (conf.drone[idx].name === conf.sitl.name) {
                                            include_sitl = true;
                                        }
                                    }
                                }
                                if (!include_sitl) {
                                    conf.drone.unshift(conf.sitl);
                                    include_sitl = false;
                                }

                                mqtt_connect(conf.cse.host);

                                delsub('/Mobius/' + conf.rtk + '/DroneList/check_sub', 0, function (rsc, res_body, count) {
                                    crtsub('/Mobius/' + conf.rtk + '/DroneList', conf.aei, 'check_sub', 'mqtt://' + conf.cse.host + '/' + conf.aei + '?ct=json', 0, function () {
                                        let noti_topic = '/oneM2M/req/+/' + conf.aei + '/json';
                                        mqtt_client.subscribe(noti_topic);
                                    });
                                });
                            });
                        }
                    });
                } else {
                    crtcnt('/Mobius/' + conf.rtk, conf.aei, 'DroneList', 0, (rsc, res_body, count) => {
                        if (parseInt(rsc) < 5000) {
                            crtci('/Mobius/' + conf.rtk + '/DroneList', conf.aei, conf.drone, 0, () => {
                                // console.log(conf.drone);
                                control_drone_info_topic = '/Mobius/' + conf.rtk + '/DroneList';

                                for (let idx in conf.drone) {
                                    if (conf.drone.hasOwnProperty(idx)) {
                                        if (conf.drone[idx].name === conf.sitl.name) {
                                            include_sitl = true;
                                        }
                                    }
                                }
                                if (!include_sitl) {
                                    conf.drone.unshift(conf.sitl);
                                    include_sitl = false;
                                }

                                mqtt_connect(conf.cse.host);

                                delsub('/Mobius/' + conf.rtk + '/DroneList/check_sub', 0, function (rsc, res_body, count) {
                                    crtsub('/Mobius/' + conf.rtk + '/DroneList', conf.aei, 'check_sub', 'mqtt://' + conf.cse.host + '/' + conf.aei + '?ct=json', 0, function () {
                                        let noti_topic = '/oneM2M/req/+/' + conf.aei + '/json';
                                        mqtt_client.subscribe(noti_topic);
                                    });
                                });
                            });
                        }
                    });
                }
            });
        } else {
            crtae('/Mobius', conf.aei, conf.rtk, 0, (rsc, res_body, count) => {
                if (parseInt(rsc) < 5000) {
                    crtcnt('/Mobius/' + conf.rtk, conf.aei, 'DroneList', 0, (rsc, res_body, count) => {
                        crtci('/Mobius/' + conf.rtk + '/DroneList', conf.aei, conf.drone, 0, (rsc, res_body, count) => {
                            console.log(rsc, res_body);
                            control_drone_info_topic = '/Mobius/' + conf.rtk + '/DroneList';

                            for (let idx in conf.drone) {
                                if (conf.drone.hasOwnProperty(idx)) {
                                    if (conf.drone[idx].name === conf.sitl.name) {
                                        include_sitl = true;
                                    }
                                }
                            }
                            if (!include_sitl) {
                                conf.drone.unshift(conf.sitl);
                                include_sitl = false;
                            }

                            mqtt_connect(conf.cse.host);

                            delsub('/Mobius/' + conf.rtk + '/DroneList/check_sub', 0, function (rsc, res_body, count) {
                                crtsub('/Mobius/' + conf.rtk + '/DroneList', conf.aei, 'check_sub', 'mqtt://' + conf.cse.host + '/' + conf.aei + '?ct=json', 0, function () {
                                    let noti_topic = '/oneM2M/req/+/' + conf.aei + '/json';
                                    mqtt_client.subscribe(noti_topic);
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

function mqtt_connect(serverip) {
    if (mqtt_client == null) {
        if (conf.usesecure === 'disable') {
            var connectOptions = {
                host: serverip,
                port: conf.cse.mqttport,
                protocol: "mqtt",
                keepalive: 10,
                clientId: 'mqtt_' + conf.rtk + '_' + nanoid(15),
                protocolId: "MQTT",
                protocolVersion: 4,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 2000,
                rejectUnauthorized: false
            };
        } else {
            connectOptions = {
                host: serverip,
                port: conf.cse.mqttport,
                protocol: "mqtts",
                keepalive: 10,
                clientId: 'mqtts_' + conf.rtk + '_' + nanoid(15),
                protocolId: "MQTT",
                protocolVersion: 4,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 2000,
                key: fs.readFileSync("./server-key.pem"),
                cert: fs.readFileSync("./server-crt.pem"),
                rejectUnauthorized: false
            };
        }

        mqtt_client = mqtt.connect(connectOptions);

        mqtt_client.on('connect', function () {
            if (conf.running_type === 'local') {
                mqtt_client.subscribe(control_drone_info_topic);
                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                        mqtt_client.subscribe(noti_topic);
                        console.log('subscribe - ' + noti_topic);

                        if (conf.commLink === 'udp') {
                            var arr_topic = noti_topic.split('/');
                            arr_topic.pop();
                            noti_topic = arr_topic.join('/');
                            createUdpCommLink(conf.drone[idx].system_id, 14550, noti_topic);
                        } else if (conf.commLink === 'tcp') {
                            createTcpCommLink(conf.drone[idx].system_id, 9000 + parseInt(conf.drone[idx].system_id, 10), noti_topic);
                        }
                    }
                }
            } else if (conf.running_type === 'global') {
                retrieve_drone();
            } else {
                console.log('[mqtt_client.on] conf.running_type is incorrect');
            }
        });

        mqtt_client.on('message', function (topic, message) {
            if (message[0] == 0xfe || message[0] == 0xfd) {
                send_to_gcs_from_drone(topic, message);
            } else if (topic == control_drone_info_topic) {
                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        if (conf.drone[idx].name !== conf.sitl.name) {
                            var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                            mqtt_client.unsubscribe(noti_topic);
                            console.log('unsubscribe - ' + noti_topic);
                        }
                    }
                }

                fs.writeFileSync(drone_info_file, JSON.stringify(JSON.parse(message.toString()), null, 4), 'utf8');
                conf.drone = JSON.parse(fs.readFileSync(drone_info_file, 'utf8'));
                conf.drone.unshift(conf.sitl);
                drone_info_file_update_flag = 1;

                for (var idx in conf.drone) {
                    if (conf.drone.hasOwnProperty(idx)) {
                        if (conf.drone[idx].name !== conf.sitl.name) {
                            var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                            mqtt_client.subscribe(noti_topic);
                            console.log('subscribe - ' + noti_topic);
                        }
                    }
                }

                exec('pm2 restart nCube-RTK', (error, stdout, stderr) => {
                    if (error) {
                        console.log('error: ' + error);
                    }
                    if (stdout) {
                        console.log('stdout: ' + stdout);
                    }
                    if (stderr) {
                        console.log('stderr: ' + stderr);
                    }
                });
            } else if (topic.includes('/oneM2M/req/')) {
                var jsonObj = JSON.parse(message.toString());

                if (jsonObj['m2m:rqp'] == null) {
                    jsonObj['m2m:rqp'] = jsonObj;
                }

                onem2m_mqtt_noti_action(topic.split('/'), jsonObj);
            }
        });

        mqtt_client.on('error', function (err) {
            console.log(err.message);
            mqtt_client = null;
            mqtt_connect(serverip);
        });
    }
}

function parse_sgn(rqi, pc, callback) {
    if (pc.sgn) {
        var nmtype = pc['sgn'] != null ? 'short' : 'long';
        var sgnObj = {};
        var cinObj = {};
        sgnObj = pc['sgn'] != null ? pc['sgn'] : pc['singleNotification'];

        if (nmtype === 'long') {
            console.log('oneM2M spec. define only short name for resource')
        } else { // 'short'
            if (sgnObj.sur) {
                if (sgnObj.sur.charAt(0) != '/') {
                    sgnObj.sur = '/' + sgnObj.sur;
                }
                var path_arr = sgnObj.sur.split('/');
            }

            if (sgnObj.nev) {
                if (sgnObj.nev.rep) {
                    if (sgnObj.nev.rep['m2m:cin']) {
                        sgnObj.nev.rep.cin = sgnObj.nev.rep['m2m:cin'];
                        delete sgnObj.nev.rep['m2m:cin'];
                    }

                    if (sgnObj.nev.rep.cin) {
                        cinObj = sgnObj.nev.rep.cin;
                    } else {
                        console.log('[mqtt_noti_action] m2m:cin is none');
                        cinObj = null;
                    }
                } else {
                    console.log('[mqtt_noti_action] rep tag of m2m:sgn.nev is none. m2m:notification format mismatch with oneM2M spec.');
                    cinObj = null;
                }
            } else if (sgnObj.sud) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.sud = sgnObj.sud;
            } else if (sgnObj.vrq) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.vrq = sgnObj.vrq;
            } else {
                console.log('[mqtt_noti_action] nev tag of m2m:sgn is none. m2m:notification format mismatch with oneM2M spec.');
                cinObj = null;
            }
        }
    } else {
        console.log('[mqtt_noti_action] m2m:sgn tag is none. m2m:notification format mismatch with oneM2M spec.');
        console.log(pc);
    }

    callback(path_arr, cinObj, rqi);
}

function response_mqtt(rsp_topic, rsc, to, fr, rqi, inpc, bodytype) {
    var rsp_message = {};
    rsp_message['m2m:rsp'] = {};
    rsp_message['m2m:rsp'].rsc = rsc;
    rsp_message['m2m:rsp'].to = to;
    rsp_message['m2m:rsp'].fr = fr;
    rsp_message['m2m:rsp'].rqi = rqi;
    rsp_message['m2m:rsp'].pc = inpc;

    if (bodytype === 'xml') {
    } else if (bodytype === 'cbor') {
    } else { // 'json'
        mqtt_client.publish(rsp_topic, JSON.stringify(rsp_message['m2m:rsp']));
    }
}

function onem2m_mqtt_noti_action(topic_arr, jsonObj) {
    if (jsonObj != null) {
        var bodytype = 'json';
        if (topic_arr[5] != null) {
            bodytype = topic_arr[5];
        }

        var op = (jsonObj['m2m:rqp']['op'] == null) ? '' : jsonObj['m2m:rqp']['op'];
        var to = (jsonObj['m2m:rqp']['to'] == null) ? '' : jsonObj['m2m:rqp']['to'];
        var fr = (jsonObj['m2m:rqp']['fr'] == null) ? '' : jsonObj['m2m:rqp']['fr'];
        var rqi = (jsonObj['m2m:rqp']['rqi'] == null) ? '' : jsonObj['m2m:rqp']['rqi'];
        var pc = {};
        pc = (jsonObj['m2m:rqp']['pc'] == null) ? {} : jsonObj['m2m:rqp']['pc'];

        if (pc['m2m:sgn']) {
            pc.sgn = {};
            pc.sgn = pc['m2m:sgn'];
            delete pc['m2m:sgn'];
        }

        parse_sgn(rqi, pc, function (path_arr, cinObj, rqi) {
            if (cinObj) {
                if (cinObj.sud || cinObj.vrq) {
                    var resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                    response_mqtt(resp_topic, 2001, '', conf.aei, rqi, '', topic_arr[5]);
                } else {
                    if ('check_sub' === path_arr[path_arr.length - 1]) {
                        console.log('mqtt ' + bodytype + ' notification <----');

                        for (var idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                                mqtt_client.unsubscribe(noti_topic);
                                console.log('unsubscribe - ' + noti_topic);

                                if (udpCommLink.hasOwnProperty(conf.drone[idx].system_id) || udpCommLink.hasOwnProperty(noti_topic)) {
                                    if (udpCommLink.hasOwnProperty(conf.drone[idx].system_id)) {
                                        udpCommLink[conf.drone[idx].system_id].socket.close();
                                        delete udpCommLink[conf.drone[idx].system_id];
                                    }
                                    if (udpCommLink.hasOwnProperty(noti_topic)) {
                                        udpCommLink[noti_topic].socket.close();
                                        delete udpCommLink[noti_topic];
                                    }
                                    console.log('UDP socket delete on port ' + (10000 + conf.drone[idx].system_id) + ' [' + conf.drone[idx].system_id + ']-[' + noti_topic + ']');
                                }

                                if (tcpCommLink.hasOwnProperty(conf.drone[idx].system_id) || tcpCommLink.hasOwnProperty(noti_topic)) {
                                    if (tcpCommLink.hasOwnProperty(conf.drone[idx].system_id)) {
                                        tcpCommLink[conf.drone[idx].system_id].socket.end();
                                        delete tcpCommLink[conf.drone[idx].system_id];
                                    }
                                    if (tcpCommLink.hasOwnProperty(noti_topic)) {
                                        tcpCommLink[noti_topic].socket.end();
                                        delete tcpCommLink[noti_topic];
                                    }
                                    console.log('TCP socket delete on port ' + (9000 + conf.drone[idx].system_id) + ' [' + conf.drone[idx].system_id + ']-[' + noti_topic + ']');
                                }
                            }
                        }

                        resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                        response_mqtt(resp_topic, 2001, '', conf.aei, rqi, '', topic_arr[5]);

                        console.log('mqtt response - 2001 ---->');

                        conf.drone = [];
                        conf.drone = cinObj.con;
                        include_sitl = false;
                        for (idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                if (conf.drone[idx].name === conf.sitl.name) {
                                    include_sitl = true;
                                }
                                noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                                mqtt_client.subscribe(noti_topic);
                                console.log('subscribe - ' + noti_topic);
                            }
                        }

                        if (!include_sitl) {
                            conf.drone.unshift(conf.sitl);
                            noti_topic = '/Mobius/' + conf.sitl.gcs + '/Drone_Data/' + conf.sitl.name + '/#';
                            mqtt_client.subscribe(noti_topic);
                            console.log('subscribe - ' + noti_topic);
                            include_sitl = false;
                        }
                    }
                }
            }
        });
    } else {
        console.log('[mqtt_noti_action] message is not noti');
    }
}

function retrieve_drone() {
    rtv('/Mobius/' + conf.rtk + '/gMavUTM/la', conf.aei, 0, function (rsc, res_body, count) {
        if (rsc == 2000) {
            conf.drone = [];
            conf.drone = JSON.parse(JSON.stringify(res_body[Object.keys(res_body)[0]].con)).drone;
            for (var idx in conf.drone) {
                if (conf.drone.hasOwnProperty(idx)) {
                    var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                    mqtt_client.subscribe(noti_topic);
                    console.log('subscribe - ' + noti_topic);
                }
            }

            delsub('/Mobius/UTM/gMavUTM/check_sub', 0, function (rsc, res_body, count) {
                crtsub('/Mobius/UTM/gMavUTM', conf.aei, 'check_sub', 'mqtt://' + conf.cse.host + '/' + conf.aei + '?ct=json', 0, function () {
                    noti_topic = '/oneM2M/req/+/' + conf.aei + '/json';
                    mqtt_client.subscribe(noti_topic);
                });
            });
        } else {
            console.log('[retrieve_drone] x-m2m-rsc : ' + rsc + ' <----' + res_body);
            setTimeout(retrieve_drone, 10000);
        }
    });
}


var gcs_content = {};

//var udpClient = null;
//var utm_socket = {};

var udpCommLink = {};
var tcpCommLink = {};

function createUdpCommLink(sys_id, port, topic) {
    if (!udpCommLink.hasOwnProperty(sys_id)) {
        var udpSocket = udp.createSocket('udp4');

        udpSocket.id = sys_id;
        udpSocket.topic = topic;

        udpCommLink[sys_id] = {};
        udpCommLink[sys_id].socket = udpSocket;
        udpCommLink[sys_id].port = port;

        udpCommLink[topic] = {};
        udpCommLink[topic].socket = udpSocket;
        udpCommLink[topic].port = port;

        console.log('UDP socket created on port ' + port + ' [' + sys_id + ']-[' + topic + ']');

        udpSocket.on('message', send_to_drone_from_gcs);
    }
}

function createTcpCommLink(sys_id, port, topic) {
    if (!tcpCommLink.hasOwnProperty(sys_id)) {
        var _server = net.createServer(function (socket) {
            console.log('TCP socket connected [' + sys_id + '] - [' + topic + ']');

            socket.id = sys_id;
            socket.topic = topic;

            tcpCommLink[sys_id] = {};
            tcpCommLink[sys_id].socket = socket;
            tcpCommLink[sys_id].port = port;

            tcpCommLink[topic] = {};
            tcpCommLink[topic].socket = socket;
            tcpCommLink[topic].port = port;

            socket.on('data', send_to_drone_from_gcs);

            socket.on('end', function () {
                console.log('end');

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }

                if (tcpCommLink.hasOwnProperty(this.topic)) {
                    delete tcpCommLink[this.topic];
                }
            });

            socket.on('close', function () {
                console.log('close');

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }

                if (tcpCommLink.hasOwnProperty(this.topic)) {
                    delete tcpCommLink[this.topic];
                }
            });

            socket.on('error', function (e) {
                console.log('error ', e);

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }

                if (tcpCommLink.hasOwnProperty(this.topic)) {
                    delete tcpCommLink[this.topic];
                }
            });
        });

        if (conf.running_type === 'local') {
            _server.listen(port, () => {
                console.log('TCP Server for local GCS is listening on port ' + port);
            });
        } else if (conf.running_type === 'global') {
            _server.listen(port, () => {
                console.log('TCP Server for global GCS is listening on port ' + port);
            });
        } else {
            console.log('[server.listen] conf.running_type is incorrect');
        }
    }
}

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}

function hex(arrayBuffer) {
    const buff = new Uint8Array(arrayBuffer);
    const hexOctets = []; // new Array(buff.length) is even faster (preallocates necessary array size), then use hexOctets[i] instead of .push()

    for (let i = 0; i < buff.length; ++i) {
        hexOctets.push(byteToHex[buff[i]]);
    }

    return hexOctets.join("");
}

var mavStrFromGcs = '';
var mavStrFromGcsLength = 0;
var mavStrFromDrone = {};
var mavStrFromDroneLength = {};


function extractMav(msg, mavStr, fnParse) {
    mavStr += hex(msg);
    while (mavStr.length > 12) {
        var stx = mavStr.substring(0, 2);
        if (stx === 'fe' || stx === 'fd') {
            if (stx === 'fe') {
                var len = parseInt(mavStr.substring(2, 4), 16);
                var mavLength = (6 * 2) + (len * 2) + (2 * 2);
            } else { // if (stx === 'fd') {
                len = parseInt(mavStr.substring(2, 4), 16);
                mavLength = (10 * 2) + (len * 2) + (2 * 2);
            }

            if (mavStr.length >= mavLength) {
                var mavPacket = mavStr.substring(0, mavLength);
                mavStr = mavStr.slice(mavLength);
                setTimeout(fnParse, 0, mavPacket);
            } else {
                break;
            }
        } else {
            mavStr = mavStr.slice(2);
        }
    }
}

function send_to_drone_from_gcs(msg) {
    for (var idx in conf.drone) {
        if (conf.drone.hasOwnProperty(idx)) {
            //if (this.id == conf.drone[idx].system_id) {
            // console.log('\r\n\r\n<--- ' + 'MAVLINK_MSG_ID_COMMAND_LONG - ' + msg.toString('hex'));
            var parent = '/Mobius/' + conf.drone[idx].gcs + '/GCS_Data/' + conf.drone[idx].name;
            mqtt_client.publish(parent, msg);
            //}
        }
    }

    if (mavStrFromGcsLength > 0) {
        mavStrFromGcs = mavStrFromGcs.substring(mavStrFromGcsLength);
        mavStrFromGcsLength = 0;
    }

    mavStrFromGcs += hex(msg);
    while (mavStrFromGcs.length > 12) {
        var stx = mavStrFromGcs.substring(0, 2);
        if (stx === 'fe') {
            if (stx === 'fe') {
                var len = parseInt(mavStrFromGcs.substring(2, 4), 16);
                var mavLength = (6 * 2) + (len * 2) + (2 * 2);
            } else { // if (stx === 'fd') {
                len = parseInt(mavStrFromGcs.substring(2, 4), 16);
                mavLength = (10 * 2) + (len * 2) + (2 * 2);
            }

            if ((mavStrFromGcs.length - mavStrFromGcsLength) >= mavLength) {
                mavStrFromGcsLength += mavLength;
                var mavPacket = mavStrFromGcs.substring(0, mavLength);
                // mavStrFromGcs = mavStrFromGcs.substr(mavLength);
                setTimeout(parseMavFromGcs, 0, mavPacket);
            } else {
                break;
            }
        } else {
            mavStrFromGcs = mavStrFromGcs.substring(2);
        }
    }
}

function parseMavFromGcs(mavPacket) {
    try {
        var ver = mavPacket.substring(0, 2).toLowerCase();
        var sysid = '';
        var msgid = '';
        var base_offset = 12;

        if (ver == 'fd') {
            sysid = mavPacket.substring(10, 12).toLowerCase();
            msgid = mavPacket.substring(18, 20) + mavPacket.substring(16, 18) + mavPacket.substring(14, 16);
            base_offset = 20;

            gcs_content[sysid + '-' + msgid + '-' + ver] = mavPacket;
        } else {
            sysid = mavPacket.substring(6, 8).toLowerCase();
            msgid = mavPacket.substring(10, 12).toLowerCase();
            base_offset = 12;

            gcs_content[sysid + '-' + msgid + '-' + ver] = mavPacket;
        }

        var sys_id = parseInt(sysid, 16);
        var msg_id = parseInt(msgid, 16);

        if (msg_id == mavlink.MAVLINK_MSG_ID_HEARTBEAT) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_HEARTBEAT - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ITEM) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_ITEM - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_REQUEST) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_REQUEST - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_REQUEST_LIST) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_REQUEST_LIST - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_COUNT) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_COUNT - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ACK) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_ACK - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ITEM_INT) {
            // console.log('<--- ' + 'MAVLINK_MSG_ID_MISSION_ITEM_INT - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_COMMAND_LONG) {
            // console.log('\r\n\r\n<--- ' + 'MAVLINK_MSG_ID_COMMAND_LONG - ' + mavPacket);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_GPS_RTCM_DATA) {
            console.log('\r\n\r\n<--- ' + 'MAVLINK_MSG_ID_GPS_RTCM_DATA - ' + mavPacket);
        }
    } catch (e) {
        console.log(e.message);
    }
}

global.hb = {};
global.gpi = {};
global.rc1_max = {};
global.rc1_min = {};
global.rc1_trim = {};
global.rc2_max = {};
global.rc2_min = {};
global.rc2_trim = {};
global.rc3_max = {};
global.rc3_min = {};
global.rc3_trim = {};
global.rc4_max = {};
global.rc4_min = {};
global.rc4_trim = {};
global.ss = {};

global.resetGpiTimer = {};

global.result_mission_ack = {};
global.mission_request = {};

global.mavVersion = {};
global.mavVersionCheckFlag = {};

function resetGpiValue(sys_id) {
    gpi[sys_id].time_boot_ms = 0;
    gpi[sys_id].lat = 0;
    gpi[sys_id].lon = 0;
    gpi[sys_id].alt = 0;
    gpi[sys_id].relative_alt = 0;
    gpi[sys_id].vx = 0;
    gpi[sys_id].vy = 0;
}

function send_to_gcs_from_drone(topic, content_each) {
    var arr_topic = topic.split('/');
    arr_topic.pop();
    topic = arr_topic.join('/');
    if (conf.commLink === 'udp') {
        if (udpCommLink.hasOwnProperty(topic)) {
            udpCommLink[topic].socket.send(content_each, udpCommLink[topic].port, 'localhost', function (error) {
                if (error) {
                    udpCommLink[topic].socket.close();
                    console.log('udpCommLink[' + topic + '].socket is closed');
                }
            });
        }
    } else if (conf.commLink === 'tcp') {
        if (tcpCommLink.hasOwnProperty(topic + '/#')) {
            //console.log('tttttttttttttttttttttttttttttttttttttttttttttttttttttttttt', topic)
            tcpCommLink[topic + '/#'].socket.write(content_each);
        }
    }

    if (!mavStrFromDrone.hasOwnProperty(topic)) {
        mavStrFromDrone[topic] = '';
    }

    if (!mavStrFromDroneLength.hasOwnProperty(topic)) {
        mavStrFromDroneLength[topic] = 0;
    }

    if (!mavVersionCheckFlag.hasOwnProperty(topic)) {
        mavVersionCheckFlag[topic] = false;
    }

    if (mavStrFromDroneLength[topic] > 0) {
        mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(mavStrFromDroneLength[topic]);
        mavStrFromDroneLength[topic] = 0;
    }

    mavStrFromDrone[topic] += content_each.toString('hex').toLowerCase();

    while (mavStrFromDrone[topic].length > 20) {
        var sysid = '';

        if (!mavVersionCheckFlag[topic]) {
            var stx = mavStrFromDrone[topic].substring(0, 2);

            if (stx === 'fe') {
                var len = parseInt(mavStrFromDrone[topic].substring(2, 4), 16);
                var mavLength = (6 * 2) + (len * 2) + (2 * 2);
                sysid = parseInt(mavStrFromDrone[topic].substring(6, 8), 16);
                var msgid = parseInt(mavStrFromDrone[topic].substring(10, 12), 16);

                if (msgid === 0 && len === 9) { // HEARTBEAT
                    mavVersionCheckFlag[topic] = true;
                    mavVersion[topic] = 'v1';
                }

                if ((mavStrFromDrone[topic].length) >= mavLength) {
                    var mavPacket = mavStrFromDrone[topic].substring(0, mavLength);

                    mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(mavLength);
                    mavStrFromDroneLength[topic] = 0;
                } else {
                    break;
                }
            } else if (stx === 'fd') {
                len = parseInt(mavStrFromDrone[topic].substring(2, 4), 16);
                mavLength = (10 * 2) + (len * 2) + (2 * 2);

                sysid = parseInt(mavStrFromDrone[topic].substring(10, 12), 16);
                msgid = parseInt(mavStrFromDrone[topic].substring(18, 20) + mavStrFromDrone[topic].substring(16, 18) + mavStrFromDrone[topic].substring(14, 16), 16);

                if (msgid === 0 && len === 9) { // HEARTBEAT
                    mavVersionCheckFlag[topic] = true;
                    mavVersion[topic] = 'v2';
                }
                if (mavStrFromDrone[topic].length >= mavLength) {
                    mavPacket = mavStrFromDrone[topic].substring(0, mavLength);

                    mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(mavLength);
                    mavStrFromDroneLength[topic] = 0;
                } else {
                    break;
                }
            } else {
                mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(2);
            }
        } else {
            stx = mavStrFromDrone[topic].substring(0, 2);

            if (mavVersion[topic] === 'v1' && stx === 'fe') {
                len = parseInt(mavStrFromDrone[topic].substring(2, 4), 16);
                mavLength = (6 * 2) + (len * 2) + (2 * 2);

                if ((mavStrFromDrone[topic].length) >= mavLength) {
                    mavPacket = mavStrFromDrone[topic].substring(0, mavLength);
                    // console.log('v1: ', mavPacket);

                    setTimeout(parseMavFromDrone, 0, mavPacket);

                    mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(mavLength);
                    mavStrFromDroneLength[topic] = 0;
                } else {
                    break;
                }
            } else if (mavVersion[topic] === 'v2' && stx === 'fd') {
                len = parseInt(mavStrFromDrone[topic].substring(2, 4), 16);
                mavLength = (10 * 2) + (len * 2) + (2 * 2);

                if (mavStrFromDrone[topic].length >= mavLength) {
                    mavPacket = mavStrFromDrone[topic].substring(0, mavLength);
                    // console.log('v2: ', mavPacket);

                    setTimeout(parseMavFromDrone, 0, mavPacket);

                    mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(mavLength);
                    mavStrFromDroneLength[topic] = 0;
                } else {
                    break;
                }
            } else {
                mavStrFromDrone[topic] = mavStrFromDrone[topic].substring(2);
            }
        }
    }
}

function parseMavFromDrone(data) {
    try {
        var ver = data.substring(0, 2);
        var len = data.substring(2, 4).toLowerCase();
        var sysid = '';
        var msgid = '';
        var base_offset = 12;

        if (ver === 'fd') {
            sysid = data.substring(10, 12).toLowerCase();
            msgid = data.substring(18, 20) + data.substring(16, 18) + data.substring(14, 16);
            base_offset = 20;
        } else {
            sysid = data.substring(6, 8).toLowerCase();
            msgid = data.substring(10, 12).toLowerCase();
            base_offset = 12;
        }

        var sys_id = parseInt(sysid, 16);
        var msg_id = parseInt(msgid, 16);

        if (msg_id == mavlink.MAVLINK_MSG_ID_HEARTBEAT && len === '09') {
            var custom_mode = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var type = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var autopilot = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var base_mode = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var system_status = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var mavlink_version = data.substring(base_offset, base_offset + 2).toLowerCase();

            if (!hb.hasOwnProperty(sys_id)) {
                hb[sys_id] = {};
            }

            hb[sys_id].type = Buffer.from(type, 'hex').readUInt8(0);
            hb[sys_id].autopilot = Buffer.from(autopilot, 'hex').readUInt8(0);
            hb[sys_id].base_mode = Buffer.from(base_mode, 'hex').readUInt8(0);
            hb[sys_id].custom_mode = Buffer.from(custom_mode, 'hex').readUInt32LE(0);
            if (hb[sys_id].autopilot === 3) {
                hb[sys_id].custom_mode = Buffer.from(custom_mode, 'hex').readUInt32LE(0);
            } else if (hb[sys_id].autopilot === 12) {
                hb[sys_id].custom_mode = custom_mode;
            }
            hb[sys_id].system_status = Buffer.from(system_status, 'hex').readUInt8(0);
            hb[sys_id].mavlink_version = Buffer.from(mavlink_version, 'hex').readUInt8(0);

            if (rc3_trim.hasOwnProperty(sys_id) && rc3_max.hasOwnProperty(sys_id) && rc3_min.hasOwnProperty(sys_id)) {
                if (hb[sys_id].custom_mode == 0) {
                    rc3_trim[sys_id].param_value = rc3_min[sys_id].param_value;
                } else {
                    rc3_trim[sys_id].param_value = (rc3_max[sys_id].param_value + rc3_min[sys_id].param_value) / 2;
                }
            }
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_SYS_STATUS || len === '1f') {
            base_offset += 28;
            var voltage_battery = data.substring(base_offset, base_offset + 8).toLowerCase();

            if (!ss.hasOwnProperty(sys_id)) {
                ss[sys_id] = {};
            }

            ss[sys_id].voltage_battery = Buffer.from(voltage_battery, 'hex').readUInt16LE(0);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_GLOBAL_POSITION_INT && len === '1c') {
            var time_boot_ms = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var lat = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var lon = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var alt = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var relative_alt = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var vx = data.substring(base_offset, base_offset + 4).toLowerCase();
            base_offset += 4;
            var vy = data.substring(base_offset, base_offset + 4).toLowerCase();

            if (!gpi.hasOwnProperty(sys_id)) {
                gpi[sys_id] = {};
            }

            gpi[sys_id].time_boot_ms = Buffer.from(time_boot_ms, 'hex').readUInt32LE(0);
            gpi[sys_id].lat = Buffer.from(lat, 'hex').readInt32LE(0);
            gpi[sys_id].lon = Buffer.from(lon, 'hex').readInt32LE(0);
            gpi[sys_id].alt = Buffer.from(alt, 'hex').readInt32LE(0);
            gpi[sys_id].relative_alt = Buffer.from(relative_alt, 'hex').readInt32LE(0);
            gpi[sys_id].vx = Buffer.from(vx, 'hex').readInt16LE(0);
            gpi[sys_id].vy = Buffer.from(vy, 'hex').readInt16LE(0);

            if (resetGpiTimer.hasOwnProperty(sys_id)) {
                clearTimeout(resetGpiTimer[sys_id]);
            }

            resetGpiTimer[sys_id] = setTimeout(resetGpiValue, 2000, sys_id);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_PARAM_VALUE) {
            var param_value = data.substring(base_offset, base_offset + 8).toLowerCase();
            base_offset += 8;
            var param_count = data.substring(base_offset, base_offset + 4).toLowerCase();
            base_offset += 4;
            var param_index = data.substring(base_offset, base_offset + 4).toLowerCase();
            base_offset += 4;
            var param_id = data.substring(base_offset, base_offset + 32).toLowerCase();
            base_offset += 32;
            var param_type = data.substring(base_offset, base_offset + 2).toLowerCase();

            param_id = Buffer.from(param_id, "hex").toString('ASCII');

            if (param_id.includes('RC1_MIN')) {
                //console.log(param_id);
                if (!rc1_min.hasOwnProperty(sys_id)) {
                    rc1_min[sys_id] = {};
                }

                rc1_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc1_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc1_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc1_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC1_MAX')) {
                //console.log(param_id);
                if (!rc1_max.hasOwnProperty(sys_id)) {
                    rc1_max[sys_id] = {};
                }

                rc1_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc1_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc1_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc1_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC1_TRIM')) {
                //console.log(param_id);
                if (!rc1_trim.hasOwnProperty(sys_id)) {
                    rc1_trim[sys_id] = {};
                }

                rc1_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc1_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc1_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc1_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC2_MIN')) {
                //console.log(param_id);
                if (!rc2_min.hasOwnProperty(sys_id)) {
                    rc2_min[sys_id] = {};
                }

                rc2_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc2_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc2_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc2_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC2_MAX')) {
                //console.log(param_id);
                if (!rc2_max.hasOwnProperty(sys_id)) {
                    rc2_max[sys_id] = {};
                }

                rc2_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc2_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc2_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc2_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC2_TRIM')) {
                //console.log(param_id);
                if (!rc2_trim.hasOwnProperty(sys_id)) {
                    rc2_trim[sys_id] = {};
                }

                rc2_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc2_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc2_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc2_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC3_MIN')) {
                //console.log(param_id);
                if (!rc3_min.hasOwnProperty(sys_id)) {
                    rc3_min[sys_id] = {};
                }

                rc3_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc3_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc3_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc3_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC3_MAX')) {
                //console.log(param_id);
                if (!rc3_max.hasOwnProperty(sys_id)) {
                    rc3_max[sys_id] = {};
                }

                rc3_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc3_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc3_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc3_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC3_TRIM')) {
                //console.log(param_id);
                if (!rc3_trim.hasOwnProperty(sys_id)) {
                    rc3_trim[sys_id] = {};
                }

                rc3_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc3_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc3_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc3_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC4_MIN')) {
                //console.log(param_id);
                if (!rc4_min.hasOwnProperty(sys_id)) {
                    rc4_min[sys_id] = {};
                }

                rc4_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc4_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc4_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc4_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC4_MAX')) {
                //console.log(param_id);
                if (!rc4_max.hasOwnProperty(sys_id)) {
                    rc4_max[sys_id] = {};
                }

                rc4_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc4_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc4_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc4_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            } else if (param_id.includes('RC4_TRIM')) {
                //console.log(param_id);
                if (!rc4_trim.hasOwnProperty(sys_id)) {
                    rc4_trim[sys_id] = {};
                }

                rc4_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
                rc4_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
                rc4_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
                rc4_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
            }
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ITEM) {
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_ITEM - ' + data);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_REQUEST) {
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_REQUEST - ' + data);
            var mission_sequence = data.substring(base_offset, base_offset + 4).toLowerCase();
            base_offset += 4;
            var target_system = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var target_component = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var mission_type = data.substring(base_offset, base_offset + 2).toLowerCase();


            if (mission_request.hasOwnProperty(sys_id)) {
                var mission_result = Buffer.from(target_system, 'hex').readUInt8(0);
                mission_request[sys_id].target_system = mission_result;
                mission_result = Buffer.from(mission_sequence, 'hex').readUInt16LE(0);
                mission_request[sys_id].seq = mission_result;
            }
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_REQUEST_LIST) {
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_REQUEST_LIST - ' + data);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_COUNT) { // #33 - global_position_int
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_COUNT - ' + data);
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ACK) { // #33 - global_position_int
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_ACK - ' + data);
            target_system = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            target_component = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            var mission_result_type = data.substring(base_offset, base_offset + 2).toLowerCase();
            base_offset += 2;
            mission_type = data.substring(base_offset, base_offset + 2).toLowerCase();


            if (result_mission_ack.hasOwnProperty(sys_id)) {
                mission_result = Buffer.from(target_system, 'hex').readUInt8(0);
                result_mission_ack[sys_id].target_system = mission_result;
                mission_result = Buffer.from(mission_result_type, 'hex').readUInt8(0);
                result_mission_ack[sys_id].type = mission_result;
            }
        } else if (msg_id == mavlink.MAVLINK_MSG_ID_MISSION_ITEM_INT) {
            // console.log('---> ' + 'MAVLINK_MSG_ID_MISSION_ITEM_INT - ' + data);
        }
    } catch (e) {
        console.log(e.message);
    }
}

function crtae(parent, aei, rn, count, callback) {
    var results_ss = {};
    var bodyString = '';
    results_ss['m2m:ae'] = {};
    results_ss['m2m:ae'].rn = rn;
    results_ss['m2m:ae'].api = "0.2.481.2.0001.001.000111";
    results_ss['m2m:ae'].lbl = ['key1', 'key2'];
    results_ss['m2m:ae'].rr = true;

    bodyString = JSON.stringify(results_ss);
    console.log(bodyString);

    http_request(aei, parent, 'post', '2', bodyString, function (rsc, res_body) {
        console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        console.log(JSON.stringify(res_body));
        callback(rsc, res_body, count);
    });
}

function crtcnt(parent, aei, rn, count, callback) {
    var results_ss = {};
    var bodyString = '';
    results_ss['m2m:cnt'] = {};
    results_ss['m2m:cnt'].rn = rn;
    results_ss['m2m:cnt'].lbl = [rn];

    bodyString = JSON.stringify(results_ss);
    console.log(bodyString);

    http_request(aei, parent, 'post', '3', bodyString, function (rsc, res_body) {
        console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        console.log(JSON.stringify(res_body));
        callback(rsc, res_body, count);
    });
}

function crtci(parent, aei, con, count, callback) {
    var results_ss = {};
    var bodyString = '';
    results_ss['m2m:cin'] = {};
    results_ss['m2m:cin'].con = con;

    bodyString = JSON.stringify(results_ss);
    console.log(bodyString);

    http_request(aei, parent, 'post', '4', bodyString, function (rsc, res_body) {
        console.log(count + ' - ' + parent + '/' + con + ' - x-m2m-rsc : ' + rsc + ' <----');
        console.log(JSON.stringify(res_body));
        callback(rsc, res_body, count);
    });
}

function rtv(target, aei, count, callback) {
    http_request(aei, target, 'get', '', '', function (rsc, res_body) {
        callback(rsc, res_body, count);
    });
}

function delsub(target, count, callback) {
    http_request(conf.aei, target, 'delete', '', '', function (rsc, res_body) {
        console.log('[delsub]', count + ' - ' + target + ' - x-m2m-rsc : ' + rsc + ' <----');
        callback(rsc, res_body, count);
    });
}

function crtsub(parent, aei, rn, nu, count, callback) {
    var results_ss = {};
    var bodyString = '';
    results_ss['m2m:sub'] = {};
    results_ss['m2m:sub'].rn = rn;
    results_ss['m2m:sub'].enc = {net: [1, 2, 3, 4]};
    results_ss['m2m:sub'].nu = [nu];
    results_ss['m2m:sub'].nct = 2;
    //results_ss['m2m:sub'].exc = 0;

    bodyString = JSON.stringify(results_ss);
    // console.log(bodyString);

    http_request(aei, parent, 'post', '23', bodyString, function (rsc, res_body) {
        console.log('[crtsub]', count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        // console.log(JSON.stringify(res_body));
        callback(rsc, res_body, count);
    });
}

function http_request(origin, path, method, ty, bodyString, callback) {
    var options = {
        hostname: conf.cse.host, port: conf.cse.port, path: path, method: method, headers: {
            'X-M2M-RI': require('shortid').generate(),
            'Accept': 'application/json',
            'X-M2M-Origin': origin,
            'Locale': 'en'
        }
    };

    if (bodyString.length > 0) {
        options.headers['Content-Length'] = bodyString.length;
    }

    if (method === 'post') {
        var a = (ty === '') ? '' : ('; ty=' + ty);
        options.headers['Content-Type'] = 'application/vnd.onem2m-res+json' + a;
    } else if (method === 'put') {
        options.headers['Content-Type'] = 'application/vnd.onem2m-res+json';
    }

    if (conf.usesecure === 'enable') {
        options.ca = fs.readFileSync('ca-crt.pem');
        options.rejectUnauthorized = false;

        var http = require('https');
    } else {
        http = require('http');
    }

    var res_body = '';
    var jsonObj = {};
    var req = http.request(options, function (res) {
        //console.log('[crtae response : ' + res.statusCode);

        //res.setEncoding('utf8');

        res.on('data', function (chunk) {
            res_body += chunk;
        });

        res.on('end', function () {
            try {
                if (res_body == '') {
                    jsonObj = {};
                } else {
                    jsonObj = JSON.parse(res_body);
                }
                callback(res.headers['x-m2m-rsc'], jsonObj);
            } catch (e) {
                console.log('[http_adn] json parse error]');
                jsonObj = {};
                jsonObj.dbg = res_body;
                callback(9999, jsonObj);
            }
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        jsonObj = {};
        jsonObj.dbg = e.message;

        callback(9999, jsonObj);
    });

    //console.log(bodyString);

    //console.log(path);

    req.write(bodyString);
    req.end();
}
