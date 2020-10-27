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

var net = require('net');
var udp = require('dgram');


mqtt_connect(conf.cse.host);

function mqtt_connect(serverip) {
    if (mqtt_client == null) {
        if (conf.usesecure === 'disable') {
            var connectOptions = {
                host: serverip,
                port: conf.cse.mqttport,
//              username: 'keti',
//              password: 'keti123',
                protocol: "mqtt",
                keepalive: 10,
//              clientId: serverUID,
                protocolId: "MQTT",
                protocolVersion: 4,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 2000,
                rejectUnauthorized: false
            };
        }
        else {
            connectOptions = {
                host: serverip,
                port: conf.cse.mqttport,
                protocol: "mqtts",
                keepalive: 10,
//              clientId: serverUID,
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
    }

    mqtt_client.on('connect', function () {
        if (conf.running_type === 'local') {
            for (var idx in conf.drone) {
                if (conf.drone.hasOwnProperty(idx)) {
                    var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                    mqtt_client.subscribe(noti_topic);
                    console.log('subscribe - ' + noti_topic);

                    if (conf.commLink === 'udp') {
                        createUdpCommLink(conf.drone[idx].system_id, 10000 + parseInt(conf.drone[idx].system_id, 10));
                    }
                    else if (conf.commLink === 'tcp') {
                        createTcpCommLink(conf.drone[idx].system_id, 9000 + parseInt(conf.drone[idx].system_id, 10));
                    }
                }
            }
        }
        else if (conf.running_type === 'global') {
            retrieve_drone();
        }
        else {
            console.log('[mqtt_client.on] conf.running_type is incorrect');
        }
    });

    mqtt_client.on('message', function (topic, message) {
        if (message[0] == 0xfe || message[0] == 0xfd) {
            send_to_gcs(message);
        }
        else if (topic.includes('/oneM2M/req/')) {
            var jsonObj = JSON.parse(message.toString());

            if (jsonObj['m2m:rqp'] == null) {
                jsonObj['m2m:rqp'] = jsonObj;
            }

            onem2m_mqtt_noti_action(topic.split('/'), jsonObj);
        }
    });

    mqtt_client.on('error', function (err) {
        console.log(err.message);
    });
}

function parse_sgn(rqi, pc, callback) {
    if (pc.sgn) {
        var nmtype = pc['sgn'] != null ? 'short' : 'long';
        var sgnObj = {};
        var cinObj = {};
        sgnObj = pc['sgn'] != null ? pc['sgn'] : pc['singleNotification'];

        if (nmtype === 'long') {
            console.log('oneM2M spec. define only short name for resource')
        }
        else { // 'short'
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
                    }
                    else {
                        console.log('[mqtt_noti_action] m2m:cin is none');
                        cinObj = null;
                    }
                }
                else {
                    console.log('[mqtt_noti_action] rep tag of m2m:sgn.nev is none. m2m:notification format mismatch with oneM2M spec.');
                    cinObj = null;
                }
            }
            else if (sgnObj.sud) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.sud = sgnObj.sud;
            }
            else if (sgnObj.vrq) {
                console.log('[mqtt_noti_action] received notification of verification');
                cinObj = {};
                cinObj.vrq = sgnObj.vrq;
            }

            else {
                console.log('[mqtt_noti_action] nev tag of m2m:sgn is none. m2m:notification format mismatch with oneM2M spec.');
                cinObj = null;
            }
        }
    }
    else {
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
    }
    else if (bodytype === 'cbor') {
    }
    else { // 'json'
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
                }
                else {
                    if ('check_sub' === path_arr[path_arr.length - 1]) {
                        console.log('mqtt ' + bodytype + ' notification <----');

                        for (var idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                var noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                                mqtt_client.unsubscribe(noti_topic);
                                console.log('unsubscribe - ' + noti_topic);
                            }
                        }

                        resp_topic = '/oneM2M/resp/' + topic_arr[3] + '/' + topic_arr[4] + '/' + topic_arr[5];
                        response_mqtt(resp_topic, 2001, '', conf.aei, rqi, '', topic_arr[5]);

                        console.log('mqtt response - 2001 ---->');

                        conf.drone = [];
                        conf.drone = JSON.parse(JSON.stringify(cinObj.con)).drone;
                        for (idx in conf.drone) {
                            if (conf.drone.hasOwnProperty(idx)) {
                                noti_topic = '/Mobius/' + conf.drone[idx].gcs + '/Drone_Data/' + conf.drone[idx].name + '/#';
                                mqtt_client.subscribe(noti_topic);
                                console.log('subscribe - ' + noti_topic);
                            }
                        }
                    }
                }
            }
        });
    }
    else {
        console.log('[mqtt_noti_action] message is not noti');
    }
}

function retrieve_drone() {
    rtvct('/Mobius/UTM/gMavUTM/la', conf.aei, 0, function (rsc, res_body, count) {
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
        }
        else {
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
//
// if (conf.commLink == 'udp') {
//     if (udpClient == null) {
//         udpClient = udp.createSocket('udp4');
//
//         udpClient.on('message', from_gcs);
//     }
// }
// else if (conf.commLink == 'tcp') {
//     var _server = net.createServer(function (socket) {
//         socket.id = require('shortid').generate();
//         console.log('socket connected [' + socket.id + ']');
//
//         utm_socket[socket.id] = socket;
//
//         socket.on('data', from_gcs);
//
//         socket.on('end', function () {
//             console.log('end');
//             if (utm_socket.hasOwnProperty(this.id)) {
//                 delete utm_socket[this.id];
//             }
//         });
//
//         socket.on('close', function () {
//             console.log('close');
//             if (utm_socket.hasOwnProperty(this.id)) {
//                 delete utm_socket[this.id];
//             }
//         });
//
//         socket.on('error', function (e) {
//             console.log('error ', e);
//             if (utm_socket.hasOwnProperty(this.id)) {
//                 delete utm_socket[this.id];
//             }
//         });
//     });
//
//     if (conf.running_type === 'local') {
//         _server.listen(5760, function () {
//             console.log('TCP Server for local GCS is listening on port 5760');
//         });
//     }
//     else if (conf.running_type === 'global') {
//         _server.listen(7598, function () {
//             console.log('TCP Server for global GCS is listening on port 7598');
//         });
//     }
//     else {
//         console.log('[server.listen] conf.running_type is incorrect');
//     }
// }

function createUdpCommLink(sys_id, port) {
    if(!tcpCommLink.hasOwnProperty(sys_id)) {
        var udpSocket = udp.createSocket('udp4');

        udpSocket.id = sys_id;

        udpCommLink[sys_id] = {};
        udpCommLink[sys_id].socket = udpSocket;
        udpCommLink[sys_id].port = port;

        udpSocket.on('message', from_gcs);
    }
}

function createTcpCommLink(sys_id, port) {
    if(!tcpCommLink.hasOwnProperty(sys_id)) {
        var _server = net.createServer(function (socket) {
            console.log('socket connected [' + sys_id + ']');

            socket.id = sys_id;

            tcpCommLink[sys_id] = {};
            tcpCommLink[sys_id].socket = socket;
            tcpCommLink[sys_id].port = port;

            socket.on('data', from_gcs);

            socket.on('end', function () {
                console.log('end');

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }
            });

            socket.on('close', function () {
                console.log('close');

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }
            });

            socket.on('error', function (e) {
                console.log('error ', e);

                if (tcpCommLink.hasOwnProperty(this.id)) {
                    delete tcpCommLink[this.id];
                }
            });
        });

        if (conf.running_type === 'local') {
            _server.listen(port, function () {
                console.log('TCP Server for local GCS is listening on port ' + port);
            });
        }
        else if (conf.running_type === 'global') {
            _server.listen(port, function () {
                console.log('TCP Server for global GCS is listening on port ' + port);
            });
        }
        else {
            console.log('[server.listen] conf.running_type is incorrect');
        }
    }
}

function from_gcs(msg) {
    var content = new Buffer.from(msg, 'ascii').toString('hex');
    var ver = content.substr(0, 2).toLowerCase();
    if (ver == 'fd') {
        var sysid = content.substr(10, 2).toLowerCase();
        var msgid = content.substr(14, 6).toLowerCase();

        gcs_content[sysid + '-' + msgid + '-' + ver] = content;
    }
    else {
        sysid = content.substr(6, 2).toLowerCase();
        msgid = content.substr(10, 2).toLowerCase();

        gcs_content[sysid + '-' + msgid + '-' + ver] = content;
    }

    var sys_id = parseInt(sysid, 16);

    if(sys_id == conf.gcs_sys_id) {
        for (var idx in conf.drone) {
            if (conf.drone.hasOwnProperty(idx)) {
                if (this.id == conf.drone[idx].system_id) {
                    var parent = '/Mobius/' + conf.drone[idx].gcs + '/GCS_Data/' + conf.drone[idx].name;
                    mqtt_client.publish(parent, msg);
                }
            }
        }
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

global.resetGpiTimer = {};

function resetGpiValue(sys_id) {
    gpi[sys_id].time_boot_ms = 0;
    gpi[sys_id].lat = 0;
    gpi[sys_id].lon = 0;
    gpi[sys_id].alt = 0;
    gpi[sys_id].relative_alt = 0;
    gpi[sys_id].vx = 0;
    gpi[sys_id].vy = 0;
}

function send_to_gcs(content_each) {
    // if (Object.keys(utm_socket).length > 0 || udpClient != null) {
    var content_each_hex = content_each.toString('hex');
    var ver = content_each_hex.substr(0, 2);
    if (ver == 'fd') {
        var sysid = content_each_hex.substr(10, 2).toLowerCase();
        var msgid = content_each_hex.substr(14, 6).toLowerCase();
    }
    else {
        sysid = content_each_hex.substr(6, 2).toLowerCase();
        msgid = content_each_hex.substr(10, 2).toLowerCase();
    }

    // for (var idx in utm_socket) {
    //     if (utm_socket.hasOwnProperty(idx)) {
    //         utm_socket[idx].write(content_each);
    //     }
    // }

    var sys_id = parseInt(sysid, 16);

    if(conf.commLink === 'udp') {
        if(udpCommLink.hasOwnProperty(sys_id)) {
            udpCommLink[sys_id].socket.send(content_each, udpCommLink[sys_id].port, 'localhost', function (error) {
                if (error) {
                    udpCommLink[sys_id].socket.close();
                    console.log('udpCommLink[' + sys_id + '].socket is closed');
                }
            });
        }
    }
    else if(conf.commLink === 'tcp') {
        if(tcpCommLink.hasOwnProperty(sys_id)) {
            tcpCommLink[sys_id].socket.write(content_each);
        }
    }


    // if (udpClient != null) {
    //     udpClient.send(content_each, 14550, 'localhost', function (error) {
    //         if (error) {
    //             udpClient.close();
    //             console.log('udpClient socket is closed');
    //         }
    //     });
    // }


    if (msgid == '00') { // #00 : HEARTBEAT
        if (ver == 'fd') {
            var base_offset = 20;
            var custom_mode = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var type = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            var autopilot = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            var base_mode = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            var system_status = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            var mavlink_version = content_each_hex.substr(base_offset, 2).toLowerCase();
        }
        else {
            base_offset = 12;
            custom_mode = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            type = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            autopilot = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            base_mode = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            system_status = content_each_hex.substr(base_offset, 2).toLowerCase();
            base_offset += 2;
            mavlink_version = content_each_hex.substr(base_offset, 2).toLowerCase();
        }

        //console.log(content_each);
        sys_id = parseInt(sysid, 16).toString();
        if (!hb.hasOwnProperty(sys_id)) {
            hb[sys_id] = {};
        }
        hb[sys_id].type = Buffer.from(type, 'hex').readUInt8(0);
        hb[sys_id].autopilot = Buffer.from(autopilot, 'hex').readUInt8(0);
        hb[sys_id].base_mode = Buffer.from(base_mode, 'hex').readUInt8(0);
        hb[sys_id].custom_mode = Buffer.from(custom_mode, 'hex').readUInt32LE(0);
        hb[sys_id].system_status = Buffer.from(system_status, 'hex').readUInt8(0);
        hb[sys_id].mavlink_version = Buffer.from(mavlink_version, 'hex').readUInt8(0);

        if (rc3_trim.hasOwnProperty(sys_id)) {
            if (hb[sys_id].custom_mode == 0) {
                rc3_trim[sys_id].param_value = rc3_min[sys_id].param_value;
            }
            else {
                rc3_trim[sys_id].param_value = (rc3_max[sys_id].param_value + rc3_min[sys_id].param_value) / 2;
            }
        }
    }

    else if (msgid == '21') { // #33 - global_position_int
        if (ver == 'fd') {
            base_offset = 20;
            var time_boot_ms = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var lat = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var lon = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var alt = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var relative_alt = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var vx = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            var vy = content_each_hex.substr(base_offset, 4).toLowerCase();
        }
        else {
            base_offset = 12;
            time_boot_ms = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            lat = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            lon = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            alt = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            relative_alt = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            vx = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            vy = content_each_hex.substr(base_offset, 4).toLowerCase();
        }

        sys_id = parseInt(sysid, 16).toString();
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

        if(resetGpiTimer.hasOwnProperty(sys_id)) {
            clearTimeout(resetGpiTimer[sys_id]);
            resetGpiTimer[sys_id] = setTimeout(resetGpiValue, 2000, sys_id);
        }
        else {
            resetGpiTimer[sys_id] = setTimeout(resetGpiValue, 2000, sys_id);
        }
    }

    else if (msgid == '16') { // #22 PARAM_VALUE
        if (ver == 'fd') {
            base_offset = 20;
            var param_value = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            var param_count = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            var param_index = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            var param_id = content_each_hex.substr(base_offset, 32).toLowerCase();
            base_offset += 32;
            var param_type = content_each_hex.substr(base_offset, 2).toLowerCase();
        }
        else {
            base_offset = 12;
            param_value = content_each_hex.substr(base_offset, 8).toLowerCase();
            base_offset += 8;
            param_count = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            param_index = content_each_hex.substr(base_offset, 4).toLowerCase();
            base_offset += 4;
            param_id = content_each_hex.substr(base_offset, 32).toLowerCase();
            base_offset += 32;
            param_type = content_each_hex.substr(base_offset, 2).toLowerCase();
        }

        sys_id = parseInt(sysid, 16).toString();

        var buf = Buffer.from(param_id, "hex");
        param_id = buf.toString('ASCII');

        if (param_id.includes('RC1_MIN')) {
            //console.log(param_id);
            if (!rc1_min.hasOwnProperty(sys_id)) {
                rc1_min[sys_id] = {};
            }

            rc1_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc1_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc1_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc1_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC1_MAX')) {
            //console.log(param_id);
            if (!rc1_max.hasOwnProperty(sys_id)) {
                rc1_max[sys_id] = {};
            }

            rc1_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc1_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc1_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc1_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC1_TRIM')) {
            //console.log(param_id);
            if (!rc1_trim.hasOwnProperty(sys_id)) {
                rc1_trim[sys_id] = {};
            }

            rc1_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc1_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc1_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc1_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC2_MIN')) {
            //console.log(param_id);
            if (!rc2_min.hasOwnProperty(sys_id)) {
                rc2_min[sys_id] = {};
            }

            rc2_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc2_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc2_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc2_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC2_MAX')) {
            //console.log(param_id);
            if (!rc2_max.hasOwnProperty(sys_id)) {
                rc2_max[sys_id] = {};
            }

            rc2_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc2_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc2_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc2_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC2_TRIM')) {
            //console.log(param_id);
            if (!rc2_trim.hasOwnProperty(sys_id)) {
                rc2_trim[sys_id] = {};
            }

            rc2_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc2_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc2_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc2_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC3_MIN')) {
            //console.log(param_id);
            if (!rc3_min.hasOwnProperty(sys_id)) {
                rc3_min[sys_id] = {};
            }

            rc3_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc3_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc3_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc3_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC3_MAX')) {
            //console.log(param_id);
            if (!rc3_max.hasOwnProperty(sys_id)) {
                rc3_max[sys_id] = {};
            }

            rc3_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc3_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc3_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc3_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC3_TRIM')) {
            //console.log(param_id);
            if (!rc3_trim.hasOwnProperty(sys_id)) {
                rc3_trim[sys_id] = {};
            }

            rc3_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc3_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc3_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc3_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC4_MIN')) {
            //console.log(param_id);
            if (!rc4_min.hasOwnProperty(sys_id)) {
                rc4_min[sys_id] = {};
            }

            rc4_min[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc4_min[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc4_min[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc4_min[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC4_MAX')) {
            //console.log(param_id);
            if (!rc4_max.hasOwnProperty(sys_id)) {
                rc4_max[sys_id] = {};
            }

            rc4_max[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc4_max[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc4_max[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc4_max[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
        else if (param_id.includes('RC4_TRIM')) {
            //console.log(param_id);
            if (!rc4_trim.hasOwnProperty(sys_id)) {
                rc4_trim[sys_id] = {};
            }

            rc4_trim[sys_id].param_value = Buffer.from(param_value, 'hex').readFloatLE(0);
            rc4_trim[sys_id].param_type = Buffer.from(param_type, 'hex').readInt8(0);
            rc4_trim[sys_id].param_count = Buffer.from(param_count, 'hex').readInt16LE(0);
            rc4_trim[sys_id].param_index = Buffer.from(param_index, 'hex').readUInt16LE(0);
        }
    }

    // if(sysid == '37' ) {
    //     console.log('55 - ' + content_each);
    // }
    // else if(sysid == '0a' ) {
    //     console.log('10 - ' + content_each);
    // }
    // else if(sysid == '21' ) {
    //     console.log('33 - ' + content_each);
    // }
    // else if(sysid == 'ff' ) {
    //     console.log('255 - ' + content_each);
    // }

    // if (msgid == '2c') {
    //     console.log('2c MISSION_COUNT - ' + content_each);
    // }
    //
    // else if (msgid == '28') {
    //     console.log('28 MISSION_REQ - ' + content_each);
    // }
    //
    // else if (msgid == '2f') {
    //     console.log('2f MISSION_ACK - ' + content_each);
    // }
    //
    // else if (msgid == '33') {
    //     console.log('33 MISSION_REQ_INT - ' + content_each);
    // }
    //
    // else if (msgid == '49') {
    //     console.log('49 MISSION_ITEM_INT - ' + content_each);
    // }

    // else if (msgid == '00') {
    //     console.log('2c MISSION_COUNT - ' + content_each);
    // }
    // }
}

function rtvct(target, aei, count, callback) {
    http_request(aei, target, 'get', '', '', function (rsc, res_body) {
        callback(rsc, res_body, count);
    });
}

function delsub(target, count, callback) {
    http_request('Superman', target, 'delete', '', '', function (rsc, res_body) {
        console.log(count + ' - ' + target + ' - x-m2m-rsc : ' + rsc + ' <----');
        console.log(res_body);
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
    console.log(bodyString);

    http_request(aei, parent, 'post', '23', bodyString, function (rsc, res_body) {
        console.log(count + ' - ' + parent + '/' + rn + ' - x-m2m-rsc : ' + rsc + ' <----');
        console.log(JSON.stringify(res_body));
        callback(rsc, res_body, count);
    });
}

function http_request(origin, path, method, ty, bodyString, callback) {
    var options = {
        hostname: conf.cse.host,
        port: conf.cse.port,
        path: path,
        method: method,
        headers: {
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
    }
    else if (method === 'put') {
        options.headers['Content-Type'] = 'application/vnd.onem2m-res+json';
    }

    if (conf.usesecure === 'enable') {
        options.ca = fs.readFileSync('ca-crt.pem');
        options.rejectUnauthorized = false;

        var http = require('https');
    }
    else {
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
                }
                else {
                    jsonObj = JSON.parse(res_body);
                }
                callback(res.headers['x-m2m-rsc'], jsonObj);
            }
            catch (e) {
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
